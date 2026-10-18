import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardList, Users, BadgeCheck } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin — AgriVet OS" },
      { name: "description", content: "AgriVet OS administration overview." },
      { property: "og:title", content: "Admin — AgriVet OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOverviewPage,
});

/** Overview with real counts only — no invented statistics. */
function AdminOverviewPage() {
  const { t } = useTranslation();
  const [counts, setCounts] = useState<{ waitlist: number; pendingVets: number; users: number } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.from("waitlist").select("id", { count: "exact", head: true }),
      supabase.from("vet_verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]).then(([w, v, u]) => {
      if (cancelled) return;
      if (w.error || v.error || u.error) {
        setFailed(true);
        return;
      }
      setCounts({ waitlist: w.count ?? 0, pendingVets: v.count ?? 0, users: u.count ?? 0 });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return <p className="text-sm text-muted-foreground">{t("common.errorDescription")}</p>;
  }
  if (!counts) return <LoadingState label={t("common.loading")} />;

  const cards = [
    { icon: ClipboardList, labelKey: "admin.overview.waitlist" as const, count: counts.waitlist, to: "/admin/waitlist" },
    { icon: BadgeCheck, labelKey: "admin.overview.vets" as const, count: counts.pendingVets, to: "/admin/veterinarians" },
    { icon: Users, labelKey: "admin.overview.users" as const, count: counts.users, to: "/admin" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Link key={card.labelKey} to={card.to} className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          <Card className="h-full shadow-sm transition-colors hover:bg-accent/40">
            <CardContent className="flex items-center gap-4 p-5">
              <card.icon className="size-6 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-2xl font-semibold tabular-nums">{card.count}</p>
                <p className="text-sm text-muted-foreground">{t(card.labelKey)}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
