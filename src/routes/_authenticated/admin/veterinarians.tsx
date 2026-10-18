import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/veterinarians")({
  head: () => ({
    meta: [
      { title: "Veterinarian verification — AgriVet OS" },
      { name: "description", content: "Review veterinarian verification requests." },
      { property: "og:title", content: "Veterinarian verification — AgriVet OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminVetsPage,
});

interface VetRow {
  user_id: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  full_name: string;
  email: string;
  location: string | null;
}

/**
 * Admin vet review. Listing reads vet_verifications + profiles (admin-only RLS policies).
 * Approve/reject goes through the review_vet database function, which enforces admin
 * authorization, blocks self-review, and sets reviewed_by/reviewed_at server-side.
 */
function AdminVetsPage() {
  const { t, language } = useTranslation();
  const [vets, setVets] = useState<VetRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("vet_verifications")
      .select("user_id, status, submitted_at, reviewed_at, rejection_reason, profiles!vet_verifications_user_id_fkey(full_name, email, location)")
      .order("submitted_at", { ascending: false });
    if (error) {
      setFailed(true);
      return;
    }
    const rows: VetRow[] = (data ?? []).map((row) => {
      const profile = row.profiles as { full_name: string; email: string; location: string | null } | null;
      return {
        user_id: row.user_id,
        status: row.status,
        submitted_at: row.submitted_at,
        reviewed_at: row.reviewed_at,
        rejection_reason: row.rejection_reason,
        full_name: profile?.full_name ?? "—",
        email: profile?.email ?? "—",
        location: profile?.location ?? null,
      };
    });
    setVets(rows);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(vetId: string, status: "approved" | "rejected", rejectionReason?: string) {
    setBusyId(vetId);
    setNotice(null);
    const { error } = await supabase.rpc("review_vet", {
      _vet_id: vetId,
      _status: status,
      ...(rejectionReason ? { _reason: rejectionReason } : {}),
    });
    setBusyId(null);
    if (error) {
      setNotice({ kind: "err", text: t("adminVets.reviewError") });
      return;
    }
    setNotice({ kind: "ok", text: t("adminVets.reviewSuccess") });
    setRejectingId(null);
    setReason("");
    await load();
  }

  if (failed) return <p className="text-sm text-muted-foreground">{t("adminVets.loadError")}</p>;
  if (!vets) return <LoadingState label={t("common.loading")} />;

  const dateFmt = new Intl.DateTimeFormat(language === "ha" ? "ha-NG" : "en-NG", { dateStyle: "medium" });

  return (
    <div>
      <h2 className="text-xl font-semibold">{t("adminVets.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("adminVets.description")}</p>
      {notice ? (
        <p role="status" className={`mt-4 rounded-md border px-4 py-3 text-sm ${notice.kind === "ok" ? "border-border bg-card" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
          {notice.text}
        </p>
      ) : null}
      {vets.length === 0 ? (
        <EmptyState className="mt-6" title={t("adminVets.empty")} />
      ) : (
        <ul className="mt-6 grid gap-4">
          {vets.map((vet) => (
            <li key={vet.user_id}>
              <Card className="shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{vet.full_name}</p>
                    <Badge variant={vet.status === "approved" ? "default" : vet.status === "rejected" ? "destructive" : "secondary"}>
                      {t(`adminVets.status.${vet.status}`)}
                    </Badge>
                  </div>
                  <dl className="mt-3 grid gap-1.5 text-sm text-muted-foreground">
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-foreground">{t("auth.email")}:</dt>
                      <dd className="break-all">{vet.email}</dd>
                    </div>
                    {vet.location ? (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-medium text-foreground">{t("auth.location")}:</dt>
                        <dd>{vet.location}</dd>
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-foreground">{t("verification.submittedAt")}:</dt>
                      <dd>{dateFmt.format(new Date(vet.submitted_at))}</dd>
                    </div>
                    {vet.reviewed_at ? (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-medium text-foreground">{t("verification.reviewedAt")}:</dt>
                        <dd>{dateFmt.format(new Date(vet.reviewed_at))}</dd>
                      </div>
                    ) : null}
                    {vet.status === "rejected" && vet.rejection_reason ? (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-medium text-foreground">{t("verification.reasonLabel")}:</dt>
                        <dd>{vet.rejection_reason}</dd>
                      </div>
                    ) : null}
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      className="min-h-11"
                      disabled={busyId === vet.user_id || vet.status === "approved"}
                      onClick={() => {
                        if (window.confirm(t("adminVets.confirmApprove"))) void review(vet.user_id, "approved");
                      }}
                    >
                      {t("adminVets.approve")}
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-11"
                      disabled={busyId === vet.user_id || vet.status === "rejected"}
                      onClick={() => {
                        setRejectingId(rejectingId === vet.user_id ? null : vet.user_id);
                        setReason("");
                      }}
                    >
                      {t("adminVets.reject")}
                    </Button>
                  </div>

                  {rejectingId === vet.user_id ? (
                    <div className="mt-4 grid gap-2">
                      <Label htmlFor={`reason-${vet.user_id}`}>{t("adminVets.rejectReasonLabel")}</Label>
                      <Textarea
                        id={`reason-${vet.user_id}`}
                        value={reason}
                        maxLength={500}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={t("adminVets.rejectReasonPlaceholder")}
                        rows={3}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="destructive"
                          className="min-h-11"
                          disabled={busyId === vet.user_id}
                          onClick={() => {
                            if (window.confirm(t("adminVets.confirmReject"))) void review(vet.user_id, "rejected", reason.trim());
                          }}
                        >
                          {t("adminVets.reject")}
                        </Button>
                        <Button variant="ghost" className="min-h-11" onClick={() => setRejectingId(null)}>
                          {t("common.cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
