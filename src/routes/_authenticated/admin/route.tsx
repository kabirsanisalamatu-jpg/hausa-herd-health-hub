import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RoleGate } from "@/components/common/RoleGate";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";
import { useAuth } from "@/contexts/AuthContext";
import { WORKSPACE_ACCESS } from "@/lib/roles";

/** Admin shell: gates the whole /admin subtree to admin + super_admin. */
export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { role } = useAuth();
  return (
    <RoleGate allow={WORKSPACE_ACCESS.admin}>
      <WorkspaceLayout
        titleKey="workspace.admin.title"
        descriptionKey="workspace.admin.description"
        role={role === "super_admin" ? "super_admin" : "admin"}
        navItems={[
          { to: "/admin", labelKey: "nav.admin" },
          { to: "/admin/waitlist", labelKey: "nav.waitlistReview" },
          { to: "/admin/veterinarians", labelKey: "nav.veterinarians" },
          { to: "/admin/reports", labelKey: "care.reports" },
          { to: "/profile", labelKey: "nav.profile" },
        ]}
      >
        <Outlet />
      </WorkspaceLayout>
    </RoleGate>
  );
}
