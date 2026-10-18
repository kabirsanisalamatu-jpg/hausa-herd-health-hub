import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { ArchiveRestore, Archive, ArrowLeft, Pencil } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { describeAge, displayName, LivestockError, livestockKeys, livestockService } from "@/lib/livestock";
import type { TranslationKey } from "@/locales";

const searchSchema = z.object({ notice: z.enum(["created", "updated"]).optional().catch(undefined) });

export const Route = createFileRoute("/_authenticated/farmer/livestock/$id")({
  validateSearch: searchSchema,
  component: LivestockDetailPage,
});

function LivestockDetailPage() {
  const { id } = Route.useParams();
  const { notice } = Route.useSearch();
  const { t, language } = useTranslation();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: livestockKeys.detail(id), queryFn: () => livestockService.get(id), retry: 1 });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; key: TranslationKey } | null>(null);

  const fmt = (iso: string) => new Date(iso).toLocaleDateString(language === "ha" ? "ha-NG" : "en-NG", { year: "numeric", month: "short", day: "numeric" });

  if (q.isPending) return <LoadingState />;
  if (q.isError) {
    return (
      <EmptyState title={t("livestock.error.loadTitle")} description={t("livestock.error.network")}
        action={<Button className="min-h-11" onClick={() => void q.refetch()}>{t("common.retry")}</Button>} />
    );
  }
  const r = q.data;
  if (!r) {
    return (
      <EmptyState title={t("livestock.detail.notFoundTitle")} description={t("livestock.detail.notFoundDescription")}
        action={<Button asChild variant="outline" className="min-h-11"><Link to="/farmer/livestock">{t("livestock.detail.back")}</Link></Button>} />
    );
  }
  const archived = r.status === "archived";

  async function changeStatus(next: "active" | "archived") {
    setBusy(true);
    setMessage(null);
    try {
      await livestockService.setStatus(id, next);
      await qc.invalidateQueries({ queryKey: livestockKeys.all });
      setMessage({ ok: true, key: next === "archived" ? "livestock.archive.success" : "livestock.archive.restoreSuccess" });
    } catch (e) {
      setMessage({ ok: false, key: e instanceof LivestockError ? e.key : "livestock.error.network" });
    } finally {
      setBusy(false);
    }
  }

  const age = describeAge(r, t);
  const rows: [TranslationKey, string | null][] = [
    ["livestock.field.species", t(`livestock.species.${r.species}` as TranslationKey)],
    ["livestock.recordType.label", t(r.record_type === "group" ? "livestock.recordType.group" : "livestock.recordType.individual")],
    ["livestock.field.quantity", r.record_type === "group" ? r.quantity.toLocaleString() : null],
    ["livestock.field.name", r.name],
    ["livestock.field.code", r.identification_code],
    ["livestock.field.breed", r.breed],
    ["livestock.field.sex", r.sex ? t(`livestock.sex.${r.sex}` as TranslationKey) : null],
    ["livestock.field.dateOfBirth", r.date_of_birth ? fmt(r.date_of_birth) : null],
    ["livestock.detail.age", age],
    ["livestock.field.purpose", r.purpose ? t(`livestock.purpose.${r.purpose}` as TranslationKey) : null],
    ["livestock.field.acquisitionDate", r.acquisition_date ? fmt(r.acquisition_date) : null],
    ["livestock.field.acquisitionSource", r.acquisition_source],
    ["livestock.field.notes", r.notes],
  ];

  const banner = message ?? (notice ? { ok: true, key: (notice === "created" ? "livestock.new.success" : "livestock.edit.success") as TranslationKey } : null);

  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <Link to="/farmer/livestock" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary">
        <ArrowLeft className="size-4" aria-hidden="true" />{t("livestock.detail.back")}
      </Link>

      {banner ? (
        <p role={banner.ok ? "status" : "alert"} className={banner.ok ? "rounded-md border border-border bg-card px-4 py-3 text-sm" : "rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"}>
          {t(banner.key)}
        </p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words text-xl font-semibold">{displayName(r, t)}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={archived ? "outline" : "secondary"}>{t(archived ? "livestock.status.archived" : "livestock.status.active")}</Badge>
            {r.record_type === "group" ? <Badge variant="outline">{t("livestock.detail.animals", { n: r.quantity.toLocaleString() })}</Badge> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!archived ? (
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/farmer/livestock/$id/edit" params={{ id }}><Pencil aria-hidden="true" />{t("livestock.detail.edit")}</Link>
            </Button>
          ) : null}
          {archived ? (
            <Button variant="outline" className="min-h-11" disabled={busy} onClick={() => void changeStatus("active")}>
              <ArchiveRestore aria-hidden="true" />{t("livestock.detail.restore")}
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="min-h-11" disabled={busy}><Archive aria-hidden="true" />{t("livestock.detail.archive")}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("livestock.archive.confirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("livestock.archive.confirmDescription")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="min-h-11">{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction className="min-h-11" onClick={() => void changeStatus("archived")}>{t("livestock.archive.confirm")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            {rows.filter(([, val]) => val).map(([k, val]) => (
              <div key={k} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{t(k)}</dt>
                <dd className="mt-1 whitespace-pre-line break-words text-sm font-medium">{val}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 grid gap-1 border-t border-border pt-4 text-xs text-muted-foreground">
            <span>{t("livestock.detail.createdOn", { date: fmt(r.created_at) })}</span>
            <span>{t("livestock.detail.updatedOn", { date: fmt(r.updated_at) })}</span>
            {r.archived_at ? <span>{t("livestock.detail.archivedOn", { date: fmt(r.archived_at) })}</span> : null}
          </div>
        </CardContent>
      </Card>

      <p className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">{t("livestock.detail.healthNotice")}</p>
    </div>
  );
}
