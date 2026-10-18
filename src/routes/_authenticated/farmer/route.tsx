import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGate } from "@/components/common/RoleGate";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";
import { WORKSPACE_ACCESS } from "@/lib/roles";

/** Farmer shell: gates the whole /farmer subtree to the farmer role. RLS enforces ownership. */
export const Route = createFileRoute("/_authenticated/farmer")({
  head: () => ({
    meta: [
      { title: "Farmer workspace — AgriVet OS" },
      { name: "description", content: "Register and manage your livestock on AgriVet OS." },
      { property: "og:title", content: "Farmer workspace — AgriVet OS" },
      { property: "og:description", content: "Register and manage your livestock on AgriVet OS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FarmerLayout,
});

function FarmerLayout() {
  return (
    <RoleGate allow={WORKSPACE_ACCESS.farmer}>
      <WorkspaceLayout
        titleKey="workspace.farmer.title"
        descriptionKey="workspace.farmer.description"
        role="farmer"
        navItems={[
          { to: "/farmer", labelKey: "nav.myWorkspace" },
          { to: "/farmer/livestock", labelKey: "nav.livestock" },
          { to: "/farmer/vaccinations", labelKey: "nav.vaccinations" },
          { to: "/profile", labelKey: "nav.profile" },
        ]}
      >
        <Outlet />
      </WorkspaceLayout>
    </RoleGate>
  );
}
