import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { LoadingState } from "@/components/common/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { healthKeys, healthService } from "@/lib/health";
import type { TranslationKey } from "@/locales";

/** Real record counts; shows an error with retry instead of zeros when loading fails. */
export function HealthSummary() {
  const { t } = useTranslation();
  const q = useQuery({ queryKey: healthKeys.summary, queryFn: healthService.summary, retry: 1 });
  if (q.isPending) return <LoadingState />;
  if (q.isError) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
        <p className="text-destructive">{t("health.error.summary")}</p>
        <Button variant="outline" className="mt-3 min-h-11" onClick={() => void q.refetch()}>{t("common.retry")}</Button>
      </div>
    );
  }
  const s = q.data;
  const items: [TranslationKey, number][] = [
    ["health.stats.events", s.healthEvents],
    ["health.stats.vaccinations", s.vaccinations],
    ["health.stats.upcoming", s.upcoming],
    ["health.stats.dueToday", s.dueToday],
    ["health.stats.overdue", s.overdue],
  ];
  return (
    <div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {items.map(([k, n]) => (
          <Card key={k} className="shadow-sm">
            <CardContent className="p-4">
              <dt className="text-xs leading-5 text-muted-foreground">{t(k)}</dt>
              <dd className="mt-1 text-2xl font-semibold">{n.toLocaleString()}</dd>
            </CardContent>
          </Card>
        ))}
      </dl>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{t("health.stats.hint")}</p>
      <Link to="/farmer/vaccinations" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline">
        {t("vaccination.overview.link")}
      </Link>
    </div>
  );
}
