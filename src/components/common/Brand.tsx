import { Leaf } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

/** Temporary text + icon brand treatment for AgriVet OS. */
export function Brand({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
      >
        <Leaf className="size-5" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-base font-semibold tracking-tight text-foreground">
          {t("brand.name")}
        </span>
        {showTagline ? (
          <span className="text-xs text-muted-foreground">{t("brand.tagline")}</span>
        ) : null}
      </span>
    </span>
  );
}
