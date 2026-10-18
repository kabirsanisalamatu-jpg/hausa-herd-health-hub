import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LivestockForm } from "@/components/livestock/LivestockForm";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { EMPTY_FORM, LivestockError, livestockKeys, livestockService } from "@/lib/livestock";
import { careHead } from "@/lib/care";

export const Route = createFileRoute("/_authenticated/farmer/livestock/new")({
  head: () => careHead("Register livestock", "Register your individual animal or livestock group privately on AgriVet OS."),
  component: NewLivestockPage,
});

function NewLivestockPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-xl font-semibold">{t("livestock.new.title")}</h2>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">{t("livestock.new.description")}</p>
      <LivestockForm
        initial={EMPTY_FORM}
        submitLabel={t("livestock.new.submit")}
        footer={<Button asChild variant="outline" className="min-h-11"><Link to="/farmer/livestock">{t("common.cancel")}</Link></Button>}
        onSubmit={async (values) => {
          try {
            const id = await livestockService.create(values);
            await qc.invalidateQueries({ queryKey: livestockKeys.all });
            void navigate({ to: "/farmer/livestock/$id", params: { id }, search: { notice: "created" } });
            return null;
          } catch (e) {
            return e instanceof LivestockError ? e.key : "livestock.error.network";
          }
        }}
      />
    </div>
  );
}
