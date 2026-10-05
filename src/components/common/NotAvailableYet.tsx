import { Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

/** Placeholder for role areas planned for later phases. Shows no data or actions. */
export function NotAvailableYet() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <Construction className="size-12 text-primary" aria-hidden="true" />
      <h1 className="mt-5 text-2xl font-semibold">{t("common.notAvailableTitle")}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("common.notAvailableDescription")}</p>
      <Button asChild className="mt-6 min-h-11"><Link to="/dashboard">{t("nav.dashboard")}</Link></Button>
    </section>
  );
}
