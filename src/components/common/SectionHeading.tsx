import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/locales";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: TranslationKey;
  title: TranslationKey;
  description?: TranslationKey;
  align?: "left" | "center";
}) {
  const { t } = useTranslation();

  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p className="text-sm font-semibold text-primary">{t(eyebrow)}</p>
      <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">{t(title)}</h2>
      {description ? (
        <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{t(description)}</p>
      ) : null}
    </div>
  );
}