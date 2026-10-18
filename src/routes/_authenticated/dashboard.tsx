import { createFileRoute, Navigate } from "@tanstack/react-router";
import { LoadingState } from "@/components/common/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { homeForRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AgriVet OS" },
      { name: "description", content: "Your AgriVet OS account home." },
      { property: "og:title", content: "Dashboard — AgriVet OS" },
      { property: "og:description", content: "Your AgriVet OS account home." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

/** Role-aware entry point: sends each signed-in user to their workspace. */
function DashboardPage() {
  const { t } = useTranslation();
  const { role, loading, accountStatus } = useAuth();

  if (loading || accountStatus === "idle" || accountStatus === "loading") {
    return <LoadingState label={t("common.loading")} />;
  }
  return <Navigate to={homeForRole(role)} replace />;
}
