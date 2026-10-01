/**
 * English dictionary (fallback language).
 * Keys are dot-namespaced and shared across all languages.
 */
export const en = {
  "brand.name": "AgriVet OS",
  "brand.tagline": "Livestock health, made clear",

  "language.label": "Language",
  "language.switch": "Change language",
  "language.hausa": "Hausa",
  "language.english": "English",

  "nav.skipToContent": "Skip to main content",
  "nav.menu": "Menu",

  "foundation.title": "Foundation ready",
  "foundation.description":
    "The design system, localization and layout foundations for AgriVet OS are in place. Pages and features arrive in later phases.",
  "foundation.badge": "Phase 1",

  "common.loading": "Loading…",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.continue": "Continue",
  "common.retry": "Try again",
  "common.search": "Search",
  "common.searchPlaceholder": "Search…",
  "common.selectPlaceholder": "Choose an option",
  "common.required": "This field is required",
  "common.error": "Something went wrong",
  "common.errorDescription": "Please check your connection and try again.",
  "common.empty": "Nothing here yet",
  "common.emptyDescription": "Items will appear here once they are added.",
  "common.notice": "Notice",

  "form.nameLabel": "Full name",
  "form.namePlaceholder": "Enter your full name",
  "form.livestockLabel": "Livestock type",
  "form.livestockCattle": "Cattle",
  "form.livestockGoats": "Goats",
  "form.livestockSheep": "Sheep",
  "form.livestockPoultry": "Poultry",

  "safety.disclaimer":
    "AgriVet OS provides informational guidance only. It is not a veterinarian and does not replace professional veterinary care.",
} as const;

export type TranslationKey = keyof typeof en;
export type Dictionary = Partial<Record<TranslationKey, string>>;
