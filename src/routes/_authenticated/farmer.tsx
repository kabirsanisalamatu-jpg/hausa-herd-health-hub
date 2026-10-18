import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonGrid } from "@/components/common/ComingSoonGrid";
import { RoleGate } from "@/components/common/RoleGate";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";
import { WORKSPACE_ACCESS } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/farmer")({
  head: () => ({
    meta: [
      { title: "Farmer workspace — AgriVet OS" },
      { name: "description", content: "Your livestock-health workspace on AgriVet OS." },
      { property: "og:title", content: "Farmer workspace — AgriVet OS" },
      { property: "og:description", content: "Your livestock-health workspace on AgriVet OS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FarmerPage,
});

function FarmerPage() {
  return (
    <RoleGate allow={WORKSPACE_ACCESS.farmer}>
      <WorkspaceLayout
        titleKey="workspace.farmer.title"
        descriptionKey="workspace.farmer.description"
        role="farmer"
        navItems={[
          { to: "/farmer", labelKey: "nav.myWorkspace" },
          { to: "/profile", labelKey: "nav.profile" },
        ]}
      >
        <ComingSoonGrid
          items={[
            { titleKey: "farmer.feature.animals", descriptionKey: "farmer.feature.animalsDesc" },
            { titleKey: "farmer.feature.records", descriptionKey: "farmer.feature.recordsDesc" },
            { titleKey: "farmer.feature.vaccinations", descriptionKey: "farmer.feature.vaccinationsDesc" },
            { titleKey: "farmer.feature.treatments", descriptionKey: "farmer.feature.treatmentsDesc" },
            { titleKey: "farmer.feature.reminders", descriptionKey: "farmer.feature.remindersDesc" },
            { titleKey: "farmer.feature.askVet", descriptionKey: "farmer.feature.askVetDesc" },
            { titleKey: "farmer.feature.ai", descriptionKey: "farmer.feature.aiDesc" },
            { titleKey: "farmer.feature.marketplace", descriptionKey: "farmer.feature.marketplaceDesc" },
            { titleKey: "farmer.feature.farm", descriptionKey: "farmer.feature.farmDesc" },
          ]}
        />
      </WorkspaceLayout>
    </RoleGate>
  );
}
