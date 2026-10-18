import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { LoadingState } from "@/components/common/LoadingState";
import { DUE_BADGE, useDateFormat } from "@/components/livestock/HealthRecords";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { displayName, todayIso } from "@/lib/livestock";
import { REMINDER_HORIZON_DAYS, treatmentKeys, treatmentService } from "@/lib/treatments";
import type { TranslationKey } from "@/locales";

/** On-screen reminders derived only from saved dates. Errors show a retry, never a false zero. */
export function Reminders() {
  const { t } = useTranslation();
  const fmt = useDateFormat();
  const today = todayIso();
  const q = useQuery({ queryKey: [...treatmentKeys.reminders, today], queryFn: () => treatmentService.reminders(today), retry: 1 });

  if (q.isPending) return <LoadingState />;
  if (q.isError) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
        <p className="text-destructive">{t("reminders.error")}</p>
        <Button variant="outline" className="mt-3 min-h-11" onClick={() => void q.refetch()}>{t("common.retry")}</Button>
      </div>
    );
  }
  const s = q.data;
  const stats: [TranslationKey, number][] = [
    ["reminders.stats.treatments", s.treatments],
    ["reminders.stats.dueToday", s.dueToday],
    ["reminders.stats.upcoming", s.upcoming],
    ["reminders.stats.overdue", s.overdue],
  ];
  return (
    <div className="grid gap-4">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([k, n]) => (
          <Card key={k} className="shadow-sm">
            <CardContent className="p-4">
              <dt className="text-xs leading-5 text-muted-foreground">{t(k)}</dt>
              <dd className="mt-1 text-2xl font-semibold">{n.toLocaleString()}</dd>
            </CardContent>
          </Card>
        ))}
      </dl>
      <p className="text-xs leading-5 text-muted-foreground">{t("reminders.hint", { n: REMINDER_HORIZON_DAYS })}</p>
      {s.items.length === 0 ? (
        <p className="rounded-md border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">{t("reminders.empty", { n: REMINDER_HORIZON_DAYS })}</p>
      ) : (
        <ul className="grid gap-3" aria-label={t("reminders.listLabel")}>
          {s.items.map((r) => (
            <li key={`${r.kind}-${r.record_id}`}>
              <Card className="shadow-sm">
                <CardContent className="grid gap-1 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={DUE_BADGE[r.due]}>{t(`reminders.status.${r.due}`)}</Badge>
                    <Badge variant="outline">{t(r.kind === "treatment" ? "reminders.kind.treatment" : "reminders.kind.vaccination")}</Badge>
                  </div>
                  <p className="break-words font-semibold">{r.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(r.kind === "treatment" ? "reminders.followUpOn" : "vaccination.dueOn", { date: fmt(r.due_date) })}
                  </p>
                  <Link to="/farmer/livestock/$id" params={{ id: r.livestock_id }} hash={`${r.kind}-${r.record_id}`}
                    className="inline-flex min-h-11 items-center break-words text-sm font-medium text-primary underline-offset-4 hover:underline">
                    {displayName({ name: r.livestock_name, identification_code: r.identification_code, species: r.species, record_type: r.record_type, quantity: r.quantity } as Parameters<typeof displayName>[0], t)}
                    {" · "}{t(`livestock.species.${r.species}` as TranslationKey)}
                  </Link>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs leading-5 text-muted-foreground">{t("reminders.overdueNote")}</p>
    </div>
  );
}
