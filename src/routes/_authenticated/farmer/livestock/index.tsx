import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import { displayName, livestockKeys, livestockService, RECORD_TYPES, SPECIES, STATUSES } from "@/lib/livestock";
import type { TranslationKey } from "@/locales";
import { careHead } from "@/lib/care";

const ALL = "all";
const searchSchema = z.object({
  q: z.string().max(60).optional().catch(undefined),
  species: z.enum([ALL, ...SPECIES]).optional().catch(undefined),
  type: z.enum([ALL, ...RECORD_TYPES]).optional().catch(undefined),
  status: z.enum(STATUSES).optional().catch(undefined),
  sort: z.enum(["created", "updated"]).optional().catch(undefined),
});

export const Route = createFileRoute("/_authenticated/farmer/livestock/")({
  head: () => careHead("My livestock", "Search and manage your private individual and group livestock records."),
  validateSearch: searchSchema,
  component: LivestockListPage,
});

function FilterSelect({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(v) => { if (v) onChange(v); }}>
        <SelectTrigger id={id} className="min-h-11"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function LivestockListPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/farmer/livestock/" });
  const status = search.status ?? "active";
  const species = search.species ?? ALL;
  const recordType = search.type ?? ALL;
  const sort = search.sort ?? "created";
  const [text, setText] = useState(search.q ?? "");
  const [page, setPage] = useState(0);

  // Debounce search text into the URL so filters are shareable and survive refresh.
  useEffect(() => {
    const h = setTimeout(() => {
      if ((search.q ?? "") !== text) void navigate({ search: (s) => ({ ...s, q: text || undefined }), replace: true });
    }, 350);
    return () => clearTimeout(h);
  }, [text, search.q, navigate]);

  useEffect(() => setPage(0), [status, species, recordType, sort, search.q]);

  const params = { status, species, recordType, sort, search: search.q ?? "", page } as const;
  const q = useQuery({ queryKey: livestockKeys.list(params), queryFn: () => livestockService.list(params), placeholderData: keepPreviousData, retry: 1 });

  const setParam = (k: "species" | "type" | "status" | "sort", v: string) =>
    void navigate({ search: (s) => ({ ...s, [k]: v }), replace: true });
  const filtered = !!search.q || species !== ALL || recordType !== ALL;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t("livestock.list.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("livestock.list.description")}</p>
        </div>
        <Button asChild className="min-h-11"><Link to="/farmer/livestock/new"><Plus aria-hidden="true" />{t("farmerHome.registerCta")}</Link></Button>
      </div>

      <div role="search" className="grid gap-4 rounded-lg border border-border p-4">
        <div className="grid gap-2">
          <Label htmlFor="ls-search">{t("livestock.filter.search")}</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="ls-search" type="search" value={text} onChange={(e) => setText(e.target.value)} maxLength={60} placeholder={t("livestock.filter.searchPlaceholder")} className="min-h-11 pl-9" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect id="ls-f-status" label={t("livestock.filter.status")} value={status} onChange={(v) => setParam("status", v)}
            options={STATUSES.map((s) => ({ value: s, label: t(`livestock.status.${s}`) }))} />
          <FilterSelect id="ls-f-species" label={t("livestock.filter.species")} value={species} onChange={(v) => setParam("species", v)}
            options={[{ value: ALL, label: t("livestock.filter.allSpecies") }, ...SPECIES.map((s) => ({ value: s, label: t(`livestock.species.${s}`) }))]} />
          <FilterSelect id="ls-f-type" label={t("livestock.filter.type")} value={recordType} onChange={(v) => setParam("type", v)}
            options={[{ value: ALL, label: t("livestock.filter.allTypes") }, ...RECORD_TYPES.map((s) => ({ value: s, label: t(`livestock.recordType.${s}`) }))]} />
          <FilterSelect id="ls-f-sort" label={t("livestock.filter.sort")} value={sort} onChange={(v) => setParam("sort", v)}
            options={[{ value: "created", label: t("livestock.filter.sortCreated") }, { value: "updated", label: t("livestock.filter.sortUpdated") }]} />
        </div>
        {filtered ? (
          <Button variant="ghost" className="min-h-11 justify-self-start" onClick={() => { setText(""); void navigate({ search: { status }, replace: true }); }}>
            {t("livestock.filter.clear")}
          </Button>
        ) : null}
      </div>

      {q.isPending ? <LoadingState /> : q.isError ? (
        <div role="alert">
          <EmptyState title={t("livestock.error.loadTitle")} description={t("livestock.error.network")}
            action={<Button className="min-h-11" onClick={() => void q.refetch()}>{t("common.retry")}</Button>} />
        </div>
      ) : q.data.rows.length === 0 ? (
        filtered ? (
          <EmptyState title={t("livestock.noResults.title")} description={t("livestock.noResults.description")} icon={Search} />
        ) : status === "archived" ? (
          <EmptyState title={t("livestock.empty.archivedTitle")} description={t("livestock.empty.archivedDescription")} />
        ) : (
          <EmptyState title={t("livestock.empty.title")} description={t("livestock.empty.description")}
            action={<Button asChild className="min-h-11"><Link to="/farmer/livestock/new"><Plus aria-hidden="true" />{t("livestock.empty.cta")}</Link></Button>} />
        )
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">{t("livestock.list.showing", { shown: q.data.rows.length, total: q.data.total })}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {q.data.rows.map((r) => (
              <li key={r.id}>
                <Link to="/farmer/livestock/$id" params={{ id: r.id }} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Card className="h-full shadow-sm transition-colors hover:border-primary">
                    <CardContent className="grid gap-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="min-w-0 break-words font-semibold">{displayName(r, t)}</h3>
                        <Badge variant={r.status === "archived" ? "outline" : "secondary"}>{t(r.status === "archived" ? "livestock.status.archived" : "livestock.status.active")}</Badge>
                      </div>
                      {r.name && r.identification_code ? <p className="break-words text-xs text-muted-foreground">{r.identification_code}</p> : null}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">{t(`livestock.species.${r.species}` as TranslationKey)}</Badge>
                        <Badge variant="outline">{t(r.record_type === "group" ? "livestock.recordType.group" : "livestock.recordType.individual")}</Badge>
                        {r.record_type === "group" ? <Badge variant="outline">{t("livestock.detail.animals", { n: r.quantity.toLocaleString() })}</Badge> : null}
                      </div>
                      {r.breed ? <p className="break-words text-sm text-muted-foreground">{r.breed}</p> : null}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
          {q.data.rows.length < q.data.total ? (
            <Button variant="outline" className="min-h-11 justify-self-center" disabled={q.isFetching} onClick={() => setPage((p) => p + 1)}>
              {q.isFetching ? t("common.loading") : t("livestock.list.loadMore")}
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
