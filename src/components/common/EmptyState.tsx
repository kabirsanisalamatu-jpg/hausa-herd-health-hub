import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

/** Empty state for lists and panels. All text is supplied already translated. */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <Icon className="size-6" />
      </span>
      <h3 className="font-heading text-base font-semibold text-foreground">
        {title ?? t("common.empty")}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description ?? t("common.emptyDescription")}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
