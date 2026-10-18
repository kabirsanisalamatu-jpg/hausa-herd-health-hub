import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import type { TranslateFn } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/locales";

export type Livestock = Tables<"livestock">;

export const RECORD_TYPES = ["individual", "group"] as const;
export const SPECIES = ["cattle", "goats", "sheep", "poultry", "fish", "other"] as const;
export const SEXES = ["female", "male", "unknown"] as const;
export const AGE_UNITS = ["days", "months", "years"] as const;
export const PURPOSES = ["meat", "dairy", "breeding", "eggs", "mixed", "other"] as const;
export const STATUSES = ["active", "archived"] as const;
export const PAGE_SIZE = 20;

export type RecordType = (typeof RECORD_TYPES)[number];
export type Species = (typeof SPECIES)[number];
export type LivestockStatus = (typeof STATUSES)[number];

export const LIMITS = { name: 100, code: 60, breed: 80, source: 120, notes: 1000, quantity: 1_000_000, age: 1000 } as const;

/** Raw form state: every input is a string so optional fields stay genuinely optional. */
export interface LivestockFormValues {
  recordType: RecordType;
  species: string;
  name: string;
  identificationCode: string;
  breed: string;
  sex: string;
  ageMode: "unknown" | "dob" | "estimate";
  dateOfBirth: string;
  ageValue: string;
  ageUnit: string;
  quantity: string;
  purpose: string;
  acquisitionDate: string;
  acquisitionSource: string;
  notes: string;
}

export const EMPTY_FORM: LivestockFormValues = {
  recordType: "individual", species: "", name: "", identificationCode: "", breed: "", sex: "",
  ageMode: "unknown", dateOfBirth: "", ageValue: "", ageUnit: "months", quantity: "", purpose: "",
  acquisitionDate: "", acquisitionSource: "", notes: "",
};

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
function validDate(v: string) {
  if (!isoDate.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export function createLivestockSchema(t: TranslateFn) {
  const text = (max: number) => z.string().trim().max(max, t("livestock.validation.tooLong", { max }));
  return z
    .object({
      recordType: z.enum(RECORD_TYPES),
      species: z.string().refine((v) => (SPECIES as readonly string[]).includes(v), t("livestock.validation.species")),
      name: text(LIMITS.name),
      identificationCode: text(LIMITS.code),
      breed: text(LIMITS.breed),
      sex: z.string(),
      ageMode: z.enum(["unknown", "dob", "estimate"]),
      dateOfBirth: z.string(),
      ageValue: z.string(),
      ageUnit: z.string(),
      quantity: z.string(),
      purpose: z.string(),
      acquisitionDate: z.string(),
      acquisitionSource: text(LIMITS.source),
      notes: text(LIMITS.notes),
    })
    .superRefine((v, ctx) => {
      const today = todayIso();
      if (v.recordType === "group") {
        const q = v.quantity.trim();
        const n = Number(q);
        if (!q) ctx.addIssue({ code: "custom", path: ["quantity"], message: t("livestock.validation.quantityRequired") });
        else if (!/^\d+$/.test(q) || !Number.isInteger(n) || n < 1 || n > LIMITS.quantity)
          ctx.addIssue({ code: "custom", path: ["quantity"], message: t("livestock.validation.quantity") });
        if (!v.name.trim() && !v.identificationCode.trim())
          ctx.addIssue({ code: "custom", path: ["name"], message: t("livestock.validation.groupName") });
      }
      if (v.recordType === "individual" && v.ageMode === "dob") {
        if (!v.dateOfBirth || !validDate(v.dateOfBirth))
          ctx.addIssue({ code: "custom", path: ["dateOfBirth"], message: t("livestock.validation.date") });
        else if (v.dateOfBirth > today)
          ctx.addIssue({ code: "custom", path: ["dateOfBirth"], message: t("livestock.validation.futureBirth") });
        else if (v.dateOfBirth < "1950-01-01")
          ctx.addIssue({ code: "custom", path: ["dateOfBirth"], message: t("livestock.validation.date") });
      }
      if (v.ageMode === "estimate") {
        const n = Number(v.ageValue.replace(",", "."));
        if (!v.ageValue.trim() || !Number.isFinite(n) || n <= 0 || n > LIMITS.age)
          ctx.addIssue({ code: "custom", path: ["ageValue"], message: t("livestock.validation.age") });
        if (!(AGE_UNITS as readonly string[]).includes(v.ageUnit))
          ctx.addIssue({ code: "custom", path: ["ageValue"], message: t("livestock.validation.age") });
      }
      if (v.acquisitionDate) {
        if (!validDate(v.acquisitionDate))
          ctx.addIssue({ code: "custom", path: ["acquisitionDate"], message: t("livestock.validation.date") });
        else if (v.acquisitionDate > today)
          ctx.addIssue({ code: "custom", path: ["acquisitionDate"], message: t("livestock.validation.futureAcquisition") });
      }
    });
}

/** Maps validated form values to DB columns. Owner is never sent — the database sets it from the session. */
export function toRow(v: LivestockFormValues): Omit<TablesInsert<"livestock">, "owner_id"> {
  const individual = v.recordType === "individual";
  const ageMode = individual ? v.ageMode : v.ageMode === "dob" ? "unknown" : v.ageMode;
  const opt = (s: string) => (s.trim() ? s.trim() : null);
  const pick = <T extends string>(s: string, list: readonly T[]): T | null => ((list as readonly string[]).includes(s) ? (s as T) : null);
  return {
    record_type: v.recordType,
    species: v.species,
    name: opt(v.name),
    identification_code: opt(v.identificationCode),
    breed: opt(v.breed),
    sex: individual ? pick(v.sex, SEXES) : null,
    date_of_birth: individual && ageMode === "dob" ? v.dateOfBirth : null,
    estimated_age_value: ageMode === "estimate" ? Number(v.ageValue.replace(",", ".")) : null,
    estimated_age_unit: ageMode === "estimate" ? v.ageUnit : null,
    quantity: individual ? 1 : Number(v.quantity.trim()),
    purpose: pick(v.purpose, PURPOSES),
    acquisition_date: opt(v.acquisitionDate),
    acquisition_source: opt(v.acquisitionSource),
    notes: opt(v.notes),
  };
}

export function fromRow(r: Livestock): LivestockFormValues {
  return {
    recordType: r.record_type === "group" ? "group" : "individual",
    species: r.species,
    name: r.name ?? "",
    identificationCode: r.identification_code ?? "",
    breed: r.breed ?? "",
    sex: r.sex ?? "",
    ageMode: r.date_of_birth ? "dob" : r.estimated_age_value != null ? "estimate" : "unknown",
    dateOfBirth: r.date_of_birth ?? "",
    ageValue: r.estimated_age_value != null ? String(r.estimated_age_value) : "",
    ageUnit: r.estimated_age_unit ?? "months",
    quantity: String(r.quantity),
    purpose: r.purpose ?? "",
    acquisitionDate: r.acquisition_date ?? "",
    acquisitionSource: r.acquisition_source ?? "",
    notes: r.notes ?? "",
  };
}

export class LivestockError extends Error {
  constructor(public key: TranslationKey) {
    super(key);
  }
}

/** Never surface raw DB errors — map to translated keys. */
export function livestockErrorKey(error: { code?: string; message?: string } | null | undefined): TranslationKey {
  const code = error?.code;
  const msg = error?.message ?? "";
  if (code === "23505") return "livestock.error.duplicateCode";
  if (msg.includes("future_birth_date")) return "livestock.validation.futureBirth";
  if (msg.includes("future_acquisition_date")) return "livestock.validation.futureAcquisition";
  if (code === "23514" || code === "23502" || code === "22001" || code === "22P02" || code === "22008" || code === "22007") return "livestock.error.invalid";
  if (code === "42501") return "livestock.error.forbidden";
  if (!code || /fetch|network/i.test(msg)) return "livestock.error.network";
  return "livestock.error.generic";
}

function fail(error: { code?: string; message?: string }): never {
  throw new LivestockError(livestockErrorKey(error));
}

export interface ListParams {
  status: LivestockStatus;
  species: string;
  recordType: string;
  search: string;
  sort: "created" | "updated";
  page: number;
}

/** Strip characters that have meaning inside PostgREST filter syntax. */
export function sanitizeSearch(q: string): string {
  return q.replace(/[,()*%\\:."']/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

export const livestockService = {
  async list(p: ListParams) {
    let q = supabase
      .from("livestock")
      .select("id, record_type, name, identification_code, species, breed, quantity, status, created_at, updated_at", { count: "exact" })
      .eq("status", p.status);
    if ((SPECIES as readonly string[]).includes(p.species)) q = q.eq("species", p.species);
    if ((RECORD_TYPES as readonly string[]).includes(p.recordType)) q = q.eq("record_type", p.recordType);
    const s = sanitizeSearch(p.search);
    if (s) q = q.or(`name.ilike.*${s}*,identification_code.ilike.*${s}*`);
    const { data, error, count } = await q
      .order(p.sort === "updated" ? "updated_at" : "created_at", { ascending: false })
      .order("id")
      .range(0, (p.page + 1) * PAGE_SIZE - 1);
    if (error) fail(error);
    return { rows: data ?? [], total: count ?? 0 };
  },
  async get(id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const { data, error } = await supabase.from("livestock").select("*").eq("id", id).maybeSingle();
    if (error) fail(error);
    return data;
  },
  async create(v: LivestockFormValues) {
    const { data, error } = await supabase.from("livestock").insert(toRow(v)).select("id").single();
    if (error) fail(error);
    return data.id;
  },
  async update(id: string, v: LivestockFormValues) {
    const { data, error } = await supabase.from("livestock").update(toRow(v)).eq("id", id).select("id").maybeSingle();
    if (error) fail(error);
    if (!data) throw new LivestockError("livestock.error.notFound");
  },
  async setStatus(id: string, status: LivestockStatus) {
    const { data, error } = await supabase.from("livestock").update({ status }).eq("id", id).select("id").maybeSingle();
    if (error) fail(error);
    if (!data) throw new LivestockError("livestock.error.notFound");
  },
  async summary() {
    const { data, error } = await supabase.rpc("livestock_summary");
    if (error) fail(error);
    const row = Array.isArray(data) ? data[0] : data;
    return {
      activeRecords: Number(row?.active_records ?? 0),
      individualRecords: Number(row?.individual_records ?? 0),
      groupRecords: Number(row?.group_records ?? 0),
      animalsInGroups: Number(row?.animals_in_groups ?? 0),
      totalAnimals: Number(row?.total_animals ?? 0),
      archivedRecords: Number(row?.archived_records ?? 0),
    };
  },
};

export const livestockKeys = {
  all: ["livestock"] as const,
  list: (p: ListParams) => ["livestock", "list", p] as const,
  detail: (id: string) => ["livestock", "detail", id] as const,
  summary: ["livestock", "summary"] as const,
};

/** Age shown on details: computed from date of birth when known, otherwise the stated estimate. */
export function describeAge(r: Pick<Livestock, "date_of_birth" | "estimated_age_value" | "estimated_age_unit">, t: TranslateFn): string | null {
  if (r.date_of_birth) {
    const dob = new Date(`${r.date_of_birth}T00:00:00`);
    const now = new Date();
    let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    if (now.getDate() < dob.getDate()) months -= 1;
    if (months >= 24) return t("livestock.age.years", { n: Math.floor(months / 12) });
    if (months >= 1) return t("livestock.age.months", { n: months });
    const days = Math.max(0, Math.floor((now.getTime() - dob.getTime()) / 86_400_000));
    return t("livestock.age.days", { n: days });
  }
  if (r.estimated_age_value != null && r.estimated_age_unit) {
    const unit = r.estimated_age_unit as (typeof AGE_UNITS)[number];
    return t("livestock.age.estimated", { age: t(`livestock.age.${unit}`, { n: r.estimated_age_value }) });
  }
  return null;
}

export function displayName(r: Pick<Livestock, "name" | "identification_code">, t: TranslateFn): string {
  return r.name || r.identification_code || t("livestock.unnamed");
}
