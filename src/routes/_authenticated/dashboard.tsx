import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Clock, LogOut } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { ROLE_LABEL_KEYS } from "@/lib/auth";

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

function DashboardPage() {
  const { t } = useTranslation();
  const { profile, role, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) return <LoadingState label={t("auth.checking")} />;

  async function handleSignOut() {
    await signOut();
    void navigate({ to: "/", replace: true });
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
      <h1 className="text-3xl font-semibold leading-tight">{t("dashboard.title", { name: profile?.full_name ?? "" })}</h1>
      <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {t("dashboard.roleLabel")}:
        <Badge variant="secondary">{role ? t(ROLE_LABEL_KEYS[role]) : t("dashboard.noRole")}</Badge>
      </p>
      <Card className="mt-8 shadow-sm">
        <CardContent className="flex gap-4 p-6">
          <Clock className="mt-1 size-6 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold">{t("dashboard.comingSoonTitle")}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("dashboard.comingSoonDescription")}</p>
          </div>
        </CardContent>
      </Card>
      <Button variant="outline" className="mt-8 min-h-11" onClick={handleSignOut}>
        <LogOut aria-hidden="true" />
        {t("auth.signOut")}
      </Button>
    </section>
  );
}
