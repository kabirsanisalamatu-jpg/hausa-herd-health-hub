import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { LivestockForm } from "@/components/livestock/LivestockForm";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { fromRow, LivestockError, livestockKeys, livestockService } from "@/lib/livestock";

export const Route = createFileRoute("/_authenticated/farmer/livestock/$id_/edit")({
  component: EditLivestockPage,
});

function EditLivestockPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: livestockKeys.detail(id), queryFn: () => livestockService.get(id), retry: 1 });

  if (q.isPending) return <LoadingState />;
  if (q.isError) {
    return (
      <EmptyState title={t("livestock.error.loadTitle")} description={t("livestock.error.network")}
        action={<Button className="min-h-11" onClick={() => void q.refetch()}>{t("common.retry")}</Button>} />
    );
  }
  if (!q.data) {
    return (
      <EmptyState title={t("livestock.detail.notFoundTitle")} description={t("livestock.detail.notFoundDescription")}
        action={<Button asChild variant="outline" className="min-h-11"><Link to="/farmer/livestock">{t("livestock.detail.back")}</Link></Button>} />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-xl font-semibold">{t("livestock.edit.title")}</h2>
      <LivestockForm
        key={q.data.updated_at}
        initial={fromRow(q.data)}
        lockRecordType
        submitLabel={t("livestock.edit.submit")}
        footer={<Button asChild variant="outline" className="min-h-11"><Link to="/farmer/livestock/$id" params={{ id }}>{t("common.cancel")}</Link></Button>}
        onSubmit={async (values) => {
          try {
            await livestockService.update(id, values);
            await qc.invalidateQueries({ queryKey: livestockKeys.all });
            void navigate({ to: "/farmer/livestock/$id", params: { id }, search: { notice: "updated" } });
            return null;
          } catch (e) {
            return e instanceof LivestockError ? e.key : "livestock.error.network";
          }
        }}
      />
    </div>
  );
}
