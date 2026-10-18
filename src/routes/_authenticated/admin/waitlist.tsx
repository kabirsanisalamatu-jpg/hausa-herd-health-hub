import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/waitlist")({
  head: () => ({
    meta: [
      { title: "Waitlist review — AgriVet OS" },
      { name: "description", content: "Review early-access waitlist signups." },
      { property: "og:title", content: "Waitlist review — AgriVet OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminWaitlistPage,
});

type Entry = Tables<"waitlist">;

/** Read-only waitlist review. RLS allows SELECT to admin/super_admin only. */
function AdminWaitlistPage() {
  const { t, language } = useTranslation();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("waitlist")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setFailed(true);
          return;
        }
        setEntries(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return <p className="text-sm text-muted-foreground">{t("adminWaitlist.loadError")}</p>;
  if (!entries) return <LoadingState label={t("common.loading")} />;

  const dateFmt = new Intl.DateTimeFormat(language === "ha" ? "ha-NG" : "en-NG", { dateStyle: "medium" });

  return (
    <div>
      <h2 className="text-xl font-semibold">{t("adminWaitlist.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("adminWaitlist.description")}</p>
      <p className="mt-3 text-sm font-medium">{t("adminWaitlist.count", { count: entries.length })}</p>
      {entries.length === 0 ? (
        <EmptyState className="mt-6" title={t("adminWaitlist.empty")} />
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Card className="h-full shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{entry.full_name}</p>
                    <Badge variant="secondary">{t(`waitlist.user${entry.user_type === "vet" ? "Veterinarian" : entry.user_type === "farmer" ? "Farmer" : "Other"}`)}</Badge>
                  </div>
                  <dl className="mt-3 grid gap-1.5 text-sm text-muted-foreground">
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-foreground">{t("auth.email")}:</dt>
                      <dd className="break-all">{entry.email}</dd>
                    </div>
                    {entry.phone ? (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-medium text-foreground">{t("auth.phone")}:</dt>
                        <dd>{entry.phone}</dd>
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-foreground">{t("auth.location")}:</dt>
                      <dd>{entry.location}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-foreground">{t("form.livestockLabel")}:</dt>
                      <dd>{entry.livestock_types.join(", ")}</dd>
                    </div>
                    {entry.farm_size ? (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-medium text-foreground">{t("waitlist.farmSizeLabel")}:</dt>
                        <dd>{entry.farm_size}</dd>
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-foreground">{t("auth.language")}:</dt>
                      <dd>{t(entry.preferred_language === "ha" ? "language.hausa" : "language.english")}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-foreground">{t("adminWaitlist.joined")}:</dt>
                      <dd>{dateFmt.format(new Date(entry.created_at))}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
