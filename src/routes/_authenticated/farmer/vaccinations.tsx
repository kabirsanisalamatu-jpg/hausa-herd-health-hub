import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { LoadingState } from "@/components/common/LoadingState";
import { DUE_BADGE, useDateFormat } from "@/components/livestock/HealthRecords";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { DUE_FILTERS, dueStatus, healthKeys, healthService } from "@/lib/health";
import { displayName, todayIso } from "@/lib/livestock";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/locales";

const searchSchema = z.object({ view: z.enum(DUE_FILTERS).optional().catch(undefined) });

export const Route = createFileRoute("/_authenticated/farmer/vaccinations")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Vaccinations — AgriVet OS" },
      { name: "description", content: "Your recorded vaccinations and their due dates." },
      { property: "og:title", content: "Vaccinations — AgriVet OS" },
      { property: "og:description", content: "Your recorded vaccinations and their due dates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VaccinationsPage,
});

function VaccinationsPage() {
  const { t } = useTranslation();
  const fmt = useDateFormat();
  const view = Route.useSearch().view ?? "all";
  const q = useQuery({ queryKey: healthKeys.overview, queryFn: healthService.overview, retry: 1 });
  const today = todayIso();

  const rows = (q.data ?? []).map((r) => ({ ...r, due: dueStatus(r.next_due_date, today) }));
  const counts = Object.fromEntries(DUE_FILTERS.map((f) => [f, f === "all" ? rows.length : rows.filter((r) => r.due === f).length]));
  const shown = view === "all" ? rows : rows.filter((r) => r.due === view);

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-xl font-semibold">{t("vaccination.overview.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("vaccination.overview.description")}</p>
      </div>
      <nav aria-label={t("vaccination.overview.filters")} className="flex flex-wrap gap-2">
        {DUE_FILTERS.map((f) => (
          <Button key={f} asChild variant={view === f ? "default" : "outline"} className="min-h-11">
            <Link to="/farmer/vaccinations" search={{ view: f }} aria-current={view === f ? "page" : undefined}>
              {t(`vaccination.filter.${f}` as TranslationKey)}{q.isSuccess ? ` (${counts[f]})` : ""}
            </Link>
          </Button>
        ))}
      </nav>
      <p className="rounded-md border border-dashed border-border px-4 py-3 text-xs leading-5 text-muted-foreground">{t("vaccination.overview.notice")}</p>
      {q.isPending ? <LoadingState /> : q.isError ? (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="text-destructive">{t("health.error.load")}</p>
          <Button variant="outline" className="mt-3 min-h-11" onClick={() => void q.refetch()}>{t("common.retry")}</Button>
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-md border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          {t(rows.length === 0 ? "vaccination.overview.emptyAll" : "vaccination.overview.emptyFilter")}
        </p>
      ) : (
        <ul className="grid gap-3">
          {shown.map((r) => {
            const l = r.livestock;
            return (
              <li key={r.id}>
                <Card className="shadow-sm">
                  <CardContent className="grid gap-2 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={DUE_BADGE[r.due]}>{t(`vaccination.status.${r.due}`)}</Badge>
                      {l?.status === "archived" ? <Badge variant="outline">{t("livestock.status.archived")}</Badge> : null}
                    </div>
                    <h3 className="break-words font-semibold">{r.vaccine_name}</h3>
                    {l ? (
                      <Link to="/farmer/livestock/$id" params={{ id: l.id }} className="inline-flex min-h-11 items-center break-words text-sm font-medium text-primary underline-offset-4 hover:underline">
                        {displayName(l, t)} · {t(`livestock.species.${l.species}` as TranslationKey)} · {l.record_type === "group"
                          ? t("vaccination.overview.group", { n: l.quantity.toLocaleString() })
                          : t("livestock.recordType.individual")}
                      </Link>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {t("vaccination.givenOn", { date: fmt(r.vaccination_date) })}
                      {r.next_due_date ? ` · ${t("vaccination.dueOn", { date: fmt(r.next_due_date) })}` : ""}
                    </p>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
