import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { LoadingState } from "@/components/common/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import type { AppRole } from "@/lib/auth";
import { homeForRole } from "@/lib/roles";

/**
 * Role gate for workspace routes (auth itself is enforced by the _authenticated layout).
 * While the account is resolving it shows a loading state; a signed-in user with the
 * wrong role is redirected to their own workspace. The database remains the real
 * security boundary — this only keeps people on the right screen.
 */
export function RoleGate({ allow, children }: { allow: readonly AppRole[]; children: ReactNode }) {
  const { t } = useTranslation();
  const { role, loading, accountStatus } = useAuth();

  if (loading || accountStatus === "idle" || accountStatus === "loading") {
    return <LoadingState label={t("common.loading")} />;
  }
  if (!role || !allow.includes(role)) {
    return <Navigate to={homeForRole(role)} replace />;
  }
  return <>{children}</>;
}
