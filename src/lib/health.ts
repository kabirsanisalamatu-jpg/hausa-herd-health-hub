import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { TranslateFn } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/locales";
import { todayIso } from "@/lib/livestock";

export type HealthEvent = Tables<"health_events">;
export type Vaccination = Tables<"vaccination_records">;

export const EVENT_TYPES = ["observation", "illness_report", "injury", "vet_visit", "recovery", "other"] as const;
export const HEALTH_LIMITS = { title: 120, description: 2000, person: 100, vaccine: 120, batch: 60, notes: 1000 } as const;
export const DUE_FILTERS = ["all", "upcoming", "due_today", "overdue", "no_due"] as const;
export type DueStatus = "upcoming" | "due_today" | "overdue" | "no_due";
export type DueFilter = (typeof DUE_FILTERS)[number];

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
export function validDate(v: string) {
  if (!isoDate.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v && v >= "1950-01-01";
}

/** Status comes only from the recorded next due date and today's local date. */
export function dueStatus(nextDue: string | null, today: string = todayIso()): DueStatus {
  if (!nextDue) return "no_due";
  if (nextDue > today) return "upcoming";
  if (nextDue === today) return "due_today";
  return "overdue";
}

export interface HealthEventForm {
  eventType: string; eventDate: string; title: string; description: string;
  reportedBy: string; professionalInvolved: string; followUpDate: string;
}
export interface VaccinationForm {
  vaccineName: string; vaccinationDate: string; nextDueDate: string;
  administeredBy: string; batchNumber: string; notes: string;
}

export const emptyEvent = (): HealthEventForm => ({
  eventType: "", eventDate: todayIso(), title: "", description: "", reportedBy: "", professionalInvolved: "", followUpDate: "",
});
export const emptyVaccination = (): VaccinationForm => ({
  vaccineName: "", vaccinationDate: todayIso(), nextDueDate: "", administeredBy: "", batchNumber: "", notes: "",
});
export const eventToForm = (e: HealthEvent): HealthEventForm => ({
  eventType: e.event_type, eventDate: e.event_date, title: e.title, description: e.description ?? "",
  reportedBy: e.reported_by ?? "", professionalInvolved: e.professional_involved ?? "", followUpDate: e.follow_up_date ?? "",
});
export const vaccinationToForm = (v: Vaccination): VaccinationForm => ({
  vaccineName: v.vaccine_name, vaccinationDate: v.vaccination_date, nextDueDate: v.next_due_date ?? "",
  administeredBy: v.administered_by_name ?? "", batchNumber: v.batch_number ?? "", notes: v.notes ?? "",
});

export function createEventSchema(t: TranslateFn) {
  const text = (max: number) => z.string().trim().max(max, t("livestock.validation.tooLong", { max }));
  return z.object({
    eventType: z.string().refine((v) => (EVENT_TYPES as readonly string[]).includes(v), t("health.validation.type")),
    eventDate: z.string(),
    title: text(HEALTH_LIMITS.title).min(1, t("health.validation.title")),
    description: text(HEALTH_LIMITS.description),
    reportedBy: text(HEALTH_LIMITS.person),
    professionalInvolved: text(HEALTH_LIMITS.person),
    followUpDate: z.string(),
  }).superRefine((v, ctx) => {
    const today = todayIso();
    if (!validDate(v.eventDate)) ctx.addIssue({ code: "custom", path: ["eventDate"], message: t("livestock.validation.date") });
    else if (v.eventDate > today) ctx.addIssue({ code: "custom", path: ["eventDate"], message: t("health.validation.futureDate") });
    if (v.followUpDate) {
      if (!validDate(v.followUpDate)) ctx.addIssue({ code: "custom", path: ["followUpDate"], message: t("livestock.validation.date") });
      else if (validDate(v.eventDate) && v.followUpDate < v.eventDate)
        ctx.addIssue({ code: "custom", path: ["followUpDate"], message: t("health.validation.followUpBefore") });
    }
  });
}

export function createVaccinationSchema(t: TranslateFn) {
  const text = (max: number) => z.string().trim().max(max, t("livestock.validation.tooLong", { max }));
  return z.object({
    vaccineName: text(HEALTH_LIMITS.vaccine).min(1, t("vaccination.validation.name")),
    vaccinationDate: z.string(),
    nextDueDate: z.string(),
    administeredBy: text(HEALTH_LIMITS.person),
    batchNumber: text(HEALTH_LIMITS.batch),
    notes: text(HEALTH_LIMITS.notes),
  }).superRefine((v, ctx) => {
    const today = todayIso();
    if (!validDate(v.vaccinationDate)) ctx.addIssue({ code: "custom", path: ["vaccinationDate"], message: t("livestock.validation.date") });
    else if (v.vaccinationDate > today) ctx.addIssue({ code: "custom", path: ["vaccinationDate"], message: t("vaccination.validation.future") });
    if (v.nextDueDate) {
      if (!validDate(v.nextDueDate)) ctx.addIssue({ code: "custom", path: ["nextDueDate"], message: t("livestock.validation.date") });
      else if (validDate(v.vaccinationDate) && v.nextDueDate < v.vaccinationDate)
        ctx.addIssue({ code: "custom", path: ["nextDueDate"], message: t("vaccination.validation.dueBefore") });
    }
  });
}

export class HealthError extends Error {
  constructor(public key: TranslationKey) { super(key); }
}

export function healthErrorKey(error: { code?: string; message?: string } | null | undefined): TranslationKey {
  const code = error?.code;
  const msg = error?.message ?? "";
  if (msg.includes("future_event_date")) return "health.validation.futureDate";
  if (msg.includes("future_vaccination_date")) return "vaccination.validation.future";
  if (msg.includes("vaccination_due_after")) return "vaccination.validation.dueBefore";
  if (msg.includes("health_events_followup_after")) return "health.validation.followUpBefore";
  if (code === "42501" || code === "23503") return "livestock.error.forbidden";
  if (code === "23514" || code === "23502" || code === "22001" || code === "22P02" || code === "22008" || code === "22007") return "livestock.error.invalid";
  if (!code || /fetch|network/i.test(msg)) return "livestock.error.network";
  return "livestock.error.generic";
}
function fail(error: { code?: string; message?: string }): never {
  throw new HealthError(healthErrorKey(error));
}
const opt = (s: string) => (s.trim() ? s.trim() : null);

export const healthKeys = {
  all: ["health"] as const,
  events: (id: string) => ["health", "events", id] as const,
  vaccinations: (id: string) => ["health", "vaccinations", id] as const,
  overview: ["health", "overview"] as const,
  summary: ["health", "summary"] as const,
};

/** Owner is never sent — the database defaults it from the session and checks it against the livestock owner. */
export const healthService = {
  async listEvents(livestockId: string) {
    const { data, error } = await supabase.from("health_events").select("*").eq("livestock_id", livestockId)
      .order("event_date", { ascending: false }).order("created_at", { ascending: false }).limit(200);
    if (error) fail(error);
    return data ?? [];
  },
  async saveEvent(livestockId: string, f: HealthEventForm, id?: string) {
    const row = {
      event_type: f.eventType, event_date: f.eventDate, title: f.title.trim(), description: opt(f.description),
      reported_by: opt(f.reportedBy), professional_involved: opt(f.professionalInvolved), follow_up_date: opt(f.followUpDate),
    };
    const res = id
      ? await supabase.from("health_events").update(row).eq("id", id).select("id").maybeSingle()
      : await supabase.from("health_events").insert({ ...row, livestock_id: livestockId }).select("id").maybeSingle();
    if (res.error) fail(res.error);
    if (!res.data) throw new HealthError("livestock.error.notFound");
  },
  async listVaccinations(livestockId: string) {
    const { data, error } = await supabase.from("vaccination_records").select("*").eq("livestock_id", livestockId)
      .order("vaccination_date", { ascending: false }).order("created_at", { ascending: false }).limit(200);
    if (error) fail(error);
    return data ?? [];
  },
  async saveVaccination(livestockId: string, f: VaccinationForm, id?: string) {
    const row = {
      vaccine_name: f.vaccineName.trim(), vaccination_date: f.vaccinationDate, next_due_date: opt(f.nextDueDate),
      administered_by_name: opt(f.administeredBy), batch_number: opt(f.batchNumber), notes: opt(f.notes),
    };
    const res = id
      ? await supabase.from("vaccination_records").update(row).eq("id", id).select("id").maybeSingle()
      : await supabase.from("vaccination_records").insert({ ...row, livestock_id: livestockId }).select("id").maybeSingle();
    if (res.error) fail(res.error);
    if (!res.data) throw new HealthError("livestock.error.notFound");
  },
  async overview() {
    const { data, error } = await supabase.from("vaccination_records")
      .select("id, livestock_id, vaccine_name, vaccination_date, next_due_date, livestock(id, name, identification_code, record_type, quantity, species, status)")
      .order("next_due_date", { ascending: true, nullsFirst: false }).order("vaccination_date", { ascending: false }).limit(500);
    if (error) fail(error);
    return data ?? [];
  },
  async summary() {
    const { data, error } = await supabase.rpc("health_summary", { _today: todayIso() });
    if (error) fail(error);
    const r = Array.isArray(data) ? data[0] : data;
    return {
      healthEvents: Number(r?.health_events ?? 0), vaccinations: Number(r?.vaccination_records ?? 0),
      upcoming: Number(r?.upcoming ?? 0), dueToday: Number(r?.due_today ?? 0), overdue: Number(r?.overdue ?? 0),
    };
  },
};
