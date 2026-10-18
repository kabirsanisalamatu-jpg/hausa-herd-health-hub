import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/common/LoadingState";
import { RoleGate } from "@/components/common/RoleGate";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { WORKSPACE_ACCESS } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/vet")({
  head: () => ({
    meta: [
      { title: "Veterinarian workspace — AgriVet OS" },
      { name: "description", content: "Your professional workspace on AgriVet OS." },
      { property: "og:title", content: "Veterinarian workspace — AgriVet OS" },
      { property: "og:description", content: "Your professional workspace on AgriVet OS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VetPage,
});

type Verification = Tables<"vet_verifications">;

function VetPage() {
  return (
    <RoleGate allow={WORKSPACE_ACCESS.vet}>
      <WorkspaceLayout
        titleKey="workspace.vet.title"
        descriptionKey="workspace.vet.description"
        role="vet"
        navItems={[
          { to: "/vet", labelKey: "nav.vetWorkspace" },
          { to: "/vet/care", labelKey: "care.title" },
          { to: "/profile", labelKey: "nav.profile" },
        ]}
      >
        <VerificationStatusCard />
        <div className="mt-8">
          <VetCareLink />
        </div>
      </WorkspaceLayout>
    </RoleGate>
  );
}

function VetCareLink() { const { t } = useTranslation(); return <Button asChild><Link to="/vet/care">{t("care.title")}</Link></Button>; }

/** Shows the signed-in vet's own verification record (RLS scopes it to them). */
function VerificationStatusCard() {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const [record, setRecord] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from("vet_verifications")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setRecord(data ?? null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) return <LoadingState label={t("common.loading")} />;

  const status = record?.status ?? "pending";
  const dateFmt = new Intl.DateTimeFormat(language === "ha" ? "ha-NG" : "en-NG", { dateStyle: "medium" });
  const Icon = status === "approved" ? BadgeCheck : status === "rejected" ? XCircle : Clock;
  const titleKey =
    status === "approved" ? "verification.approvedTitle" : status === "rejected" ? "verification.rejectedTitle" : "verification.pendingTitle";
  const descKey =
    status === "approved"
      ? "verification.approvedDescription"
      : status === "rejected"
        ? "verification.rejectedDescription"
        : "verification.pendingDescription";

  return (
    <Card className="shadow-sm" aria-labelledby="verification-status">
      <CardContent className="flex gap-4 p-6">
        <Icon className="mt-1 size-6 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="verification-status" className="text-lg font-semibold">
              {t("verification.title")}
            </h2>
            <Badge variant={status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"}>
              {t(`adminVets.status.${status}`)}
            </Badge>
          </div>
          <h3 className="mt-2 text-base font-medium">{t(titleKey)}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{t(descKey)}</p>
          {status === "rejected" && record?.rejection_reason ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              <span className="font-medium text-foreground">{t("verification.reasonLabel")}:</span> {record.rejection_reason}
            </p>
          ) : null}
          {record ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {t("verification.submittedAt")}: {dateFmt.format(new Date(record.submitted_at))}
              {record.reviewed_at ? ` · ${t("verification.reviewedAt")}: ${dateFmt.format(new Date(record.reviewed_at))}` : ""}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
