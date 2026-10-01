import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGE,
  dictionaries,
  isLanguage,
  type Language,
  type TranslationKey,
} from "@/locales";

/** Stable localStorage key. A future profiles.preferred_language can sync with this. */
export const LANGUAGE_STORAGE_KEY = "agrivet_language";

export type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TranslateFn;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // SSR-safe: start with the default, then hydrate the stored preference.
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(stored) && stored !== language) setLanguageState(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); language still applies for this session.
    }
  }, []);

  const t = useCallback<TranslateFn>(
    (key, vars) => {
      const value = dictionaries[language]?.[key] ?? dictionaries[FALLBACK_LANGUAGE]?.[key];
      return value ? interpolate(value, vars) : key;
    },
    [language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
