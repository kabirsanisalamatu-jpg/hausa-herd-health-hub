import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { livestockKeys, livestockService } from "@/lib/livestock";
import type { TranslationKey } from "@/locales";

/** Real totals from the database; never shows zero on failure. */
export function LivestockSummary() {
  const { t } = useTranslation();
  const q = useQuery({ queryKey: livestockKeys.summary, queryFn: livestockService.summary, retry: 1 });

  if (q.isPending) return <LoadingState />;
  if (q.isError) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
        <p className="text-destructive">{t("livestock.stats.error")}</p>
        <Button variant="outline" className="mt-3 min-h-11" onClick={() => void q.refetch()}>{t("common.retry")}</Button>
      </div>
    );
  }
  const s = q.data;
  if (s.activeRecords === 0 && s.archivedRecords === 0) {
    return (
      <EmptyState
        title={t("livestock.empty.title")}
        description={t("livestock.empty.description")}
        action={<Button asChild className="min-h-11"><Link to="/farmer/livestock/new"><Plus aria-hidden="true" />{t("livestock.empty.cta")}</Link></Button>}
      />
    );
  }
  const items: [TranslationKey, number][] = [
    ["livestock.stats.totalAnimals", s.totalAnimals],
    ["livestock.stats.activeRecords", s.activeRecords],
    ["livestock.stats.individualRecords", s.individualRecords],
    ["livestock.stats.groupRecords", s.groupRecords],
    ["livestock.stats.animalsInGroups", s.animalsInGroups],
    ["livestock.stats.archivedRecords", s.archivedRecords],
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
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{t("livestock.stats.totalHint")}</p>
      <Link to="/farmer/livestock" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline">
        {t("farmerHome.viewAll")}
      </Link>
    </div>
  );
}
