import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { ComingSoonGrid } from "@/components/common/ComingSoonGrid";
import { HealthSummary } from "@/components/livestock/HealthSummary";
import { Reminders } from "@/components/livestock/Reminders";
import { LivestockSummary } from "@/components/livestock/LivestockSummary";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

export const Route = createFileRoute("/_authenticated/farmer/")({
  component: FarmerHome,
});

function FarmerHome() {
  const { t } = useTranslation();
  return (
    <div className="grid gap-10">
      <section aria-labelledby="overview-heading" className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="overview-heading" className="text-lg font-semibold">{t("farmerHome.overviewTitle")}</h2>
          <Button asChild className="min-h-11">
            <Link to="/farmer/livestock/new"><Plus aria-hidden="true" />{t("farmerHome.registerCta")}</Link>
          </Button>
        </div>
        <LivestockSummary />
      </section>
      <section aria-labelledby="reminders-heading" className="grid gap-4">
        <h2 id="reminders-heading" className="text-lg font-semibold">{t("reminders.title")}</h2>
        <Reminders />
      </section>
      <section aria-labelledby="health-overview-heading" className="grid gap-4">
        <h2 id="health-overview-heading" className="text-lg font-semibold">{t("farmerHome.healthTitle")}</h2>
        <HealthSummary />
      </section>
      <section aria-labelledby="coming-heading" className="grid gap-4">
        <h2 id="coming-heading" className="text-lg font-semibold">{t("farmerHome.comingTitle")}</h2>
        <ComingSoonGrid
          items={[
            { titleKey: "farmer.feature.askVet", descriptionKey: "farmer.feature.askVetDesc" },
            { titleKey: "farmer.feature.ai", descriptionKey: "farmer.feature.aiDesc" },
            { titleKey: "farmer.feature.marketplace", descriptionKey: "farmer.feature.marketplaceDesc" },
            { titleKey: "farmer.feature.farm", descriptionKey: "farmer.feature.farmDesc" },
          ]}
        />
      </section>
    </div>
  );
}
