import { Check } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { LANGUAGES, LANGUAGE_LABEL_KEYS } from "@/locales";
import { cn } from "@/lib/utils";

/**
 * Reusable language switcher (Hausa | English).
 * Works in marketing, auth and app layouts.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t("language.switch")}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1",
        className,
      )}
    >
      {LANGUAGES.map((code) => {
        const active = code === language;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            onClick={() => setLanguage(code)}
            aria-pressed={active}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {active ? <Check className="size-4" aria-hidden="true" /> : null}
            {t(LANGUAGE_LABEL_KEYS[code])}
          </button>
        );
      })}
    </div>
  );
}
