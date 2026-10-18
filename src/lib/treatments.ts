import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { TranslateFn } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/locales";
import { HealthError, dueStatus, healthErrorKey, validDate } from "@/lib/health";
import { todayIso } from "@/lib/livestock";

export type Treatment = Tables<"treatment_records">;

export const TREATMENT_STATUSES = ["awaiting_assessment", "recommended", "prescribed", "administered", "completed", "stopped"] as const;
export type TreatmentStatus = (typeof TREATMENT_STATUSES)[number];
export const TREATMENT_LIMITS = { problem: 500, long: 2000, person: 100, medicine: 120, dose: 1000, notes: 1000 } as const;
/** Reminders show everything overdue plus anything due within this many days. */
export const REMINDER_HORIZON_DAYS = 7;

export interface TreatmentForm {
  recordDate: string; reportedProblem: string; farmerObservations: string;
  veterinaryAssessment: string; veterinarianName: string; assessmentDate: string;
  treatmentPlan: string; medicineName: string; doseAndInstructions: string;
  treatmentStatus: string; administrationDate: string; administeredBy: string;
  followUpDate: string; notes: string;
}

export const emptyTreatment = (): TreatmentForm => ({
  recordDate: todayIso(), reportedProblem: "", farmerObservations: "", veterinaryAssessment: "", veterinarianName: "",
  assessmentDate: "", treatmentPlan: "", medicineName: "", doseAndInstructions: "", treatmentStatus: "awaiting_assessment",
  administrationDate: "", administeredBy: "", followUpDate: "", notes: "",
});

export const treatmentToForm = (r: Treatment): TreatmentForm => ({
  recordDate: r.record_date, reportedProblem: r.reported_problem, farmerObservations: r.farmer_observations ?? "",
  veterinaryAssessment: r.veterinary_assessment ?? "", veterinarianName: r.veterinarian_name ?? "", assessmentDate: r.assessment_date ?? "",
  treatmentPlan: r.treatment_plan ?? "", medicineName: r.medicine_name ?? "", doseAndInstructions: r.dose_and_instructions ?? "",
  treatmentStatus: r.treatment_status, administrationDate: r.administration_date ?? "", administeredBy: r.administered_by ?? "",
  followUpDate: r.follow_up_date ?? "", notes: r.notes ?? "",
});

/** An assessment counts as professionally attributed only when a professional's name was recorded with it. */
export const hasProfessionalAttribution = (r: Pick<Treatment, "veterinary_assessment" | "veterinarian_name">) =>
  !!r.veterinary_assessment && !!r.veterinarian_name;

export function createTreatmentSchema(t: TranslateFn) {
  const text = (max: number) => z.string().trim().max(max, t("livestock.validation.tooLong", { max }));
  const L = TREATMENT_LIMITS;
  return z.object({
    recordDate: z.string(),
    reportedProblem: text(L.problem).min(1, t("treatment.validation.problem")),
    farmerObservations: text(L.long), veterinaryAssessment: text(L.long), veterinarianName: text(L.person),
    assessmentDate: z.string(), treatmentPlan: text(L.long), medicineName: text(L.medicine), doseAndInstructions: text(L.dose),
    treatmentStatus: z.string().refine((v) => (TREATMENT_STATUSES as readonly string[]).includes(v), t("treatment.validation.status")),
    administrationDate: z.string(), administeredBy: text(L.person), followUpDate: z.string(), notes: text(L.notes),
  }).superRefine((v, ctx) => {
    const today = todayIso();
    const bad = (path: string, key: TranslationKey) => ctx.addIssue({ code: "custom", path: [path], message: t(key) });
    if (!validDate(v.recordDate)) bad("recordDate", "livestock.validation.date");
    else if (v.recordDate > today) bad("recordDate", "health.validation.futureDate");
    for (const k of ["assessmentDate", "administrationDate"] as const) {
      if (!v[k]) continue;
      if (!validDate(v[k])) bad(k, "livestock.validation.date");
      else if (v[k] > today) bad(k, k === "administrationDate" ? "treatment.validation.futureAdministration" : "health.validation.futureDate");
    }
    if (v.followUpDate) {
      if (!validDate(v.followUpDate)) bad("followUpDate", "livestock.validation.date");
      else if (validDate(v.recordDate) && v.followUpDate < v.recordDate) bad("followUpDate", "treatment.validation.followUpBefore");
    }
  });
}

function fail(error: { code?: string; message?: string }): never {
  const msg = error.message ?? "";
  if (msg.includes("future_administration_date")) throw new HealthError("treatment.validation.futureAdministration");
  if (msg.includes("future_record_date") || msg.includes("future_assessment_date")) throw new HealthError("health.validation.futureDate");
  if (msg.includes("treatment_followup_after")) throw new HealthError("treatment.validation.followUpBefore");
  throw new HealthError(healthErrorKey(error));
}
const opt = (s: string) => (s.trim() ? s.trim() : null);

export const treatmentKeys = {
  all: ["treatments"] as const,
  list: (id: string) => ["treatments", "list", id] as const,
  reminders: ["treatments", "reminders"] as const,
};

export type Reminder = {
  kind: "treatment" | "vaccination"; record_id: string; livestock_id: string; label: string; due_date: string;
  treatment_status: string | null; livestock_name: string | null; identification_code: string | null;
  species: string; record_type: string; quantity: number; due: "upcoming" | "due_today" | "overdue";
};

/** Owner is never sent — the database defaults it from the session and checks it against the livestock owner. */
export const treatmentService = {
  async list(livestockId: string) {
    const { data, error } = await supabase.from("treatment_records").select("*").eq("livestock_id", livestockId)
      .order("record_date", { ascending: false }).order("created_at", { ascending: false }).limit(200);
    if (error) fail(error);
    return data ?? [];
  },
  async save(livestockId: string, f: TreatmentForm, id?: string) {
    const row = {
      record_date: f.recordDate, reported_problem: f.reportedProblem.trim(), farmer_observations: opt(f.farmerObservations),
      veterinary_assessment: opt(f.veterinaryAssessment), veterinarian_name: opt(f.veterinarianName), assessment_date: opt(f.assessmentDate),
      treatment_plan: opt(f.treatmentPlan), medicine_name: opt(f.medicineName), dose_and_instructions: opt(f.doseAndInstructions),
      treatment_status: f.treatmentStatus, administration_date: opt(f.administrationDate), administered_by: opt(f.administeredBy),
      follow_up_date: opt(f.followUpDate), notes: opt(f.notes),
    };
    const res = id
      ? await supabase.from("treatment_records").update(row).eq("id", id).select("id").maybeSingle()
      : await supabase.from("treatment_records").insert({ ...row, livestock_id: livestockId }).select("id").maybeSingle();
    if (res.error) fail(res.error);
    if (!res.data) throw new HealthError("livestock.error.notFound");
  },
  /** Reminder rows + treatment total. Both come from the database; any failure throws (never a false zero). */
  async reminders(today: string = todayIso()) {
    const [r, c] = await Promise.all([
      supabase.rpc("farmer_reminders", { _today: today, _horizon: REMINDER_HORIZON_DAYS }),
      supabase.rpc("treatment_count"),
    ]);
    if (r.error) fail(r.error);
    if (c.error) fail(c.error);
    const items = (r.data ?? []).map((x) => ({ ...x, due: dueStatus(x.due_date, today) })) as Reminder[];
    return {
      items,
      treatments: Number(c.data ?? 0),
      dueToday: items.filter((i) => i.kind === "treatment" && i.due === "due_today").length,
      upcoming: items.filter((i) => i.kind === "treatment" && i.due === "upcoming").length,
      overdue: items.filter((i) => i.kind === "treatment" && i.due === "overdue").length,
    };
  },
};
