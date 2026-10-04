import { z } from "zod";
import type { TranslateFn } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/locales";

/** The only roles a visitor may choose at signup. Privileged roles are assigned server-side only. */
export const SIGNUP_USER_TYPES = ["farmer", "vet"] as const;
export type SignupUserType = (typeof SIGNUP_USER_TYPES)[number];

export const APP_ROLES = ["farmer", "vet", "admin", "content_editor", "super_admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

function passwordField(t: TranslateFn) {
  return z
    .string()
    .min(1, t("auth.validation.passwordRequired"))
    .min(PASSWORD_MIN, t("auth.validation.passwordShort"))
    .max(PASSWORD_MAX, t("auth.validation.passwordLong"));
}

function emailField(t: TranslateFn) {
  return z
    .string()
    .trim()
    .min(1, t("auth.validation.emailRequired"))
    .email(t("auth.validation.emailInvalid"))
    .max(255, t("auth.validation.emailLong"));
}

export function createSignInSchema(t: TranslateFn) {
  return z.object({
    email: emailField(t),
    password: z.string().min(1, t("auth.validation.passwordRequired")),
  });
}

export function createSignUpSchema(t: TranslateFn) {
  return z
    .object({
      fullName: z.string().trim().min(1, t("auth.validation.nameRequired")).max(100, t("auth.validation.nameLong")),
      email: emailField(t),
      phone: z.string().trim().min(1, t("auth.validation.phoneRequired")).max(40, t("auth.validation.phoneLong")),
      location: z.string().trim().min(1, t("auth.validation.locationRequired")).max(120, t("auth.validation.locationLong")),
      password: passwordField(t),
      confirmPassword: z.string(),
      userType: z.enum(SIGNUP_USER_TYPES, { required_error: t("auth.validation.userTypeRequired") }),
      preferredLanguage: z.enum(["ha", "en"], { required_error: t("auth.validation.languageRequired") }),
    })
    .refine((v) => v.password === v.confirmPassword, {
      message: t("auth.validation.passwordMismatch"),
      path: ["confirmPassword"],
    });
}

export function createForgotSchema(t: TranslateFn) {
  return z.object({ email: emailField(t) });
}

export function createNewPasswordSchema(t: TranslateFn) {
  return z
    .object({ password: passwordField(t), confirmPassword: z.string() })
    .refine((v) => v.password === v.confirmPassword, {
      message: t("auth.validation.passwordMismatch"),
      path: ["confirmPassword"],
    });
}

export type SignInData = z.infer<ReturnType<typeof createSignInSchema>>;
export type SignUpData = z.infer<ReturnType<typeof createSignUpSchema>>;

/** Maps an auth error to a safe, translatable message key. Raw errors never reach the UI. */
export function authErrorKey(error: { code?: string | undefined; message?: string; status?: number | undefined } | null): TranslationKey {
  if (!error) return "auth.error.generic";
  const code = error.code ?? "";
  if (code === "invalid_credentials") return "auth.error.invalidCredentials";
  if (code === "email_not_confirmed") return "auth.error.emailNotConfirmed";
  if (code === "weak_password") return "auth.error.weakPassword";
  if (code === "same_password") return "auth.error.samePassword";
  if (code.startsWith("over_") || error.status === 429) return "auth.error.rateLimit";
  if (code === "session_not_found" || code === "session_expired" || code === "refresh_token_not_found") return "auth.error.session";
  if (!error.status || error.message?.includes("fetch")) return "auth.error.network";
  return "auth.error.generic";
}

export const ROLE_LABEL_KEYS: Record<AppRole, TranslationKey> = {
  farmer: "role.farmer",
  vet: "role.vet",
  admin: "role.admin",
  content_editor: "role.content_editor",
  super_admin: "role.super_admin",
};
