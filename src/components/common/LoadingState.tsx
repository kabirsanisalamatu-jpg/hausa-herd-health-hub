import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

/** Accessible loading indicator with a translated, screen-reader friendly label. */
export function LoadingState({ className, label }: { className?: string; label?: string }) {
  const { t } = useTranslation();
  const text = label ?? t("common.loading");

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-4 py-12 text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="size-6 animate-spin" aria-hidden="true" />
      <span className="text-sm">{text}</span>
    </div>
  );
}
