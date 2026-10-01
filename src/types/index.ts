/**
 * Shared application types.
 * Role values mirror future database values and are never translated.
 */
export type UserRole = "farmer" | "vet" | "admin" | "content_editor" | "super_admin";

export const USER_ROLES: readonly UserRole[] = [
  "farmer",
  "vet",
  "admin",
  "content_editor",
  "super_admin",
] as const;

export type { Language } from "../locales";
