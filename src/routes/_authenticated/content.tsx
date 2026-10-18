import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonGrid } from "@/components/common/ComingSoonGrid";
import { RoleGate } from "@/components/common/RoleGate";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";
import { WORKSPACE_ACCESS } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/content")({
  head: () => ({
    meta: [
      { title: "Content workspace — AgriVet OS" },
      { name: "description", content: "Content and education workspace on AgriVet OS." },
      { property: "og:title", content: "Content workspace — AgriVet OS" },
      { property: "og:description", content: "Content and education workspace on AgriVet OS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContentPage,
});

function ContentPage() {
  return (
    <RoleGate allow={WORKSPACE_ACCESS.content}>
      <WorkspaceLayout
        titleKey="workspace.content.title"
        descriptionKey="workspace.content.description"
        role="content_editor"
        navItems={[
          { to: "/content", labelKey: "nav.content" },
          { to: "/profile", labelKey: "nav.profile" },
        ]}
      >
        <ComingSoonGrid
          items={[
            { titleKey: "content.feature.hausaEducation", descriptionKey: "content.feature.hausaEducationDesc" },
            { titleKey: "content.feature.vetGuidance", descriptionKey: "content.feature.vetGuidanceDesc" },
            { titleKey: "content.feature.farmerEducation", descriptionKey: "content.feature.farmerEducationDesc" },
            { titleKey: "content.feature.announcements", descriptionKey: "content.feature.announcementsDesc" },
          ]}
        />
      </WorkspaceLayout>
    </RoleGate>
  );
}
