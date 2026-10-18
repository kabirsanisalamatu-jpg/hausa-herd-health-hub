import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { ROLE_LABEL_KEYS, type AppRole } from "@/lib/auth";
import type { TranslationKey } from "@/locales";
import { cn } from "@/lib/utils";

export interface WorkspaceNavItem {
  to: string;
  labelKey: TranslationKey;
}

/** Shared shell for role workspaces: greeting, role badge, workspace nav, sign out. */
export function WorkspaceLayout({
  titleKey,
  descriptionKey,
  role,
  navItems,
  children,
}: {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  role: AppRole;
  navItems: WorkspaceNavItem[];
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    void navigate({ to: "/", replace: true });
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{t(titleKey)}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{t(descriptionKey)}</p>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{profile?.full_name}</span>
            <Badge variant="secondary">{t(ROLE_LABEL_KEYS[role])}</Badge>
          </p>
        </div>
        <Button variant="outline" className="min-h-11" onClick={handleSignOut}>
          <LogOut aria-hidden="true" />
          {t("auth.signOut")}
        </Button>
      </div>

      <nav aria-label={t("nav.menu")} className="mt-6 flex flex-wrap gap-2 border-b border-border pb-4">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: true }}
            className={cn(
              "inline-flex min-h-11 items-center rounded-md border border-input px-3 text-sm font-medium text-foreground hover:bg-accent",
              "[&.active]:border-primary [&.active]:bg-accent",
            )}
          >
            {t(item.labelKey)}
          </Link>
        ))}
      </nav>

      <div className="mt-8">{children}</div>
    </section>
  );
}
