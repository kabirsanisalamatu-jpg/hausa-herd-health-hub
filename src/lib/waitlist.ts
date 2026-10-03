import { z } from "zod";
import type { TranslateFn } from "@/contexts/LanguageContext";

export const USER_TYPES = ["farmer", "veterinarian", "other"] as const;
export const LIVESTOCK_TYPES = [
  "cattle",
  "goats",
  "sheep",
  "poultry",
  "fish",
  "other",
  "multiple",
] as const;
export const PREFERRED_LANGUAGES = ["ha", "en"] as const;

export function createWaitlistSchema(t: TranslateFn) {
  return z.object({
    fullName: z.string().trim().min(1, t("waitlist.validation.nameRequired")).max(100, t("waitlist.validation.nameLong")),
    email: z.string().trim().min(1, t("waitlist.validation.emailRequired")).email(t("waitlist.validation.emailInvalid")).max(255, t("waitlist.validation.emailLong")),
    phone: z.string().trim().max(40, t("waitlist.validation.phoneLong")),
    location: z.string().trim().min(1, t("waitlist.validation.locationRequired")).max(120, t("waitlist.validation.locationLong")),
    userType: z.enum(USER_TYPES, { required_error: t("waitlist.validation.userTypeRequired") }),
    livestockType: z.enum(LIVESTOCK_TYPES, { required_error: t("waitlist.validation.livestockRequired") }),
    farmSize: z.string().trim().max(80, t("waitlist.validation.farmSizeLong")),
    preferredLanguage: z.enum(PREFERRED_LANGUAGES, { required_error: t("waitlist.validation.languageRequired") }),
  });
}

export type WaitlistFormData = z.infer<ReturnType<typeof createWaitlistSchema>>;

export type WaitlistSubmissionResult =
  | { status: "success" }
  | { status: "duplicate" }
  | { status: "invalid" }
  | { status: "network" }
  | { status: "error" };

/** Normalizes an email for duplicate checks and storage (the database repeats this). */
export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Supabase-backed waitlist service. Raw database errors never leave this module. */
export const waitlistService = {
  async submit(data: WaitlistFormData): Promise<WaitlistSubmissionResult> {
    const { supabase } = await import("@/integrations/supabase/client");
    try {
      // No `.select()`: anonymous visitors may insert but never read rows back.
      const { error } = await supabase.from("waitlist").insert({
        full_name: data.fullName.trim(),
        email: normalizeEmail(data.email),
        phone: data.phone.trim() || null,
        location: data.location.trim(),
        user_type: data.userType,
        livestock_types: [data.livestockType],
        farm_size: data.farmSize.trim() || null,
        preferred_language: data.preferredLanguage,
      });
      if (!error) return { status: "success" };
      if (error.code === "23505") return { status: "duplicate" };
      if (error.code === "23514" || error.code === "23502" || error.code === "22001") return { status: "invalid" };
      if (!error.code || error.message?.includes("Failed to fetch")) return { status: "network" };
      console.warn("Waitlist submission failed", error.code);
      return { status: "error" };
    } catch {
      return { status: "network" };
    }
  },
};