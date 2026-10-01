import { en, type Dictionary, type TranslationKey } from "./en/common";
import { ha } from "./ha/common";

/** Supported interface languages. Add new codes here to extend. */
export const LANGUAGES = ["ha", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "ha";
export const FALLBACK_LANGUAGE: Language = "en";

/** Label shown in the switcher, resolved through the translation system. */
export const LANGUAGE_LABEL_KEYS: Record<Language, TranslationKey> = {
  ha: "language.hausa",
  en: "language.english",
};

export const dictionaries: Record<Language, Dictionary> = { ha, en };

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}

export type { Dictionary, TranslationKey };
export { en, ha };
