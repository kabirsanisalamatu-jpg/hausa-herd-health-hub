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
  | { status: "development-preview" }
  | { status: "error" };

/** Phase 2 adapter: validates the UI flow but deliberately performs no persistence. */
export async function submitWaitlistPreview(
  _data: WaitlistFormData,
): Promise<WaitlistSubmissionResult> {
  await new Promise((resolve) => window.setTimeout(resolve, 700));
  return { status: "development-preview" };
}