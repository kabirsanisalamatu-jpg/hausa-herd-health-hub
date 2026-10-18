import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, X } from "lucide-react";
import { Brand } from "@/components/common/Brand";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "@/lib/auth";
import type { TranslationKey } from "@/locales";

/** Role-based navigation for signed-in users. Route protection + RLS stay the real boundary. */
const ROLE_NAV: Record<AppRole, { to: string; labelKey: TranslationKey }[]> = {
  farmer: [
    { to: "/dashboard", labelKey: "nav.dashboard" },
    { to: "/farmer", labelKey: "nav.myWorkspace" },
    { to: "/farmer/livestock", labelKey: "nav.livestock" },
    { to: "/farmer/vaccinations", labelKey: "nav.vaccinations" },
    { to: "/farmer/care", labelKey: "care.title" },
    { to: "/profile", labelKey: "nav.profile" },
  ],
  vet: [
    { to: "/dashboard", labelKey: "nav.dashboard" },
    { to: "/vet", labelKey: "nav.vetWorkspace" },
    { to: "/vet/care", labelKey: "care.title" },
    { to: "/profile", labelKey: "nav.profile" },
  ],
  admin: [
    { to: "/dashboard", labelKey: "nav.dashboard" },
    { to: "/admin", labelKey: "nav.admin" },
    { to: "/admin/waitlist", labelKey: "nav.waitlistReview" },
    { to: "/admin/veterinarians", labelKey: "nav.veterinarians" },
    { to: "/profile", labelKey: "nav.profile" },
  ],
  content_editor: [
    { to: "/dashboard", labelKey: "nav.dashboard" },
    { to: "/content", labelKey: "nav.content" },
    { to: "/profile", labelKey: "nav.profile" },
  ],
  super_admin: [
    { to: "/dashboard", labelKey: "nav.dashboard" },
    { to: "/admin", labelKey: "nav.admin" },
    { to: "/admin/waitlist", labelKey: "nav.waitlistReview" },
    { to: "/admin/veterinarians", labelKey: "nav.veterinarians" },
    { to: "/content", labelKey: "nav.content" },
    { to: "/profile", labelKey: "nav.profile" },
  ],
};

/**
 * Shared public shell: header with brand + language switcher, main region, footer.
 * Future auth and dashboard layouts can reuse the same pieces.
 */
export function SiteLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const year = new Date().getFullYear();
  const roleNav = user && role ? ROLE_NAV[role] : [];

  async function handleSignOut() {
    closeMenu();
    await signOut();
    void navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        {t("nav.skipToContent")}
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-label={t("brand.name")}
          >
            <Brand />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label={t("nav.menu")}>
            <Link to="/veterinarians" className="px-3 py-3 text-sm font-medium">{t("care.directory")}</Link>
            <a href="/#features" className="rounded-md px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t("nav.features")}</a>
            <a href="/#how-it-works" className="rounded-md px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t("nav.howItWorks")}</a>
            <a href="/#about" className="rounded-md px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t("nav.about")}</a>
            <a href="/demo" title={t("nav.comingSoon")} className="rounded-md px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t("nav.demo")}</a>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <LanguageSwitcher />
            {user ? (
              <>
                {roleNav.map((item) => (
                  <Link key={item.to} to={item.to} className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-foreground hover:bg-accent">{t(item.labelKey)}</Link>
                ))}
                <Button variant="outline" className="min-h-11" onClick={handleSignOut}>
                  <LogOut aria-hidden="true" />
                  {t("auth.signOut")}
                </Button>
              </>
            ) : (
              <>
                <Link to="/sign-in" className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-foreground">{t("nav.signIn")}</Link>
                <Link to="/sign-up" className="inline-flex min-h-11 items-center rounded-md border border-input px-3 text-sm font-medium text-foreground hover:bg-accent">{t("nav.signUp")}</Link>
                <Button asChild><Link to="/waitlist">{t("nav.joinWaitlist")}</Link></Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 lg:hidden"
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.menu")}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
        {menuOpen ? (
          <nav id="mobile-navigation" className="border-t border-border bg-background px-4 py-4 lg:hidden" aria-label={t("nav.menu")}>
            <div className="mx-auto grid max-w-7xl gap-1">
              <Link to="/veterinarians" onClick={closeMenu} className="flex min-h-11 items-center px-3 text-sm font-medium">{t("care.directory")}</Link>
              <a href="/#features" onClick={closeMenu} className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-foreground hover:bg-accent">{t("nav.features")}</a>
              <a href="/#how-it-works" onClick={closeMenu} className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-foreground hover:bg-accent">{t("nav.howItWorks")}</a>
              <a href="/#about" onClick={closeMenu} className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-foreground hover:bg-accent">{t("nav.about")}</a>
              <a href="/demo" title={t("nav.comingSoon")} className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-foreground hover:bg-accent">{t("nav.demo")}</a>
              <div className="my-2 border-t border-border" />
              {user ? (
                <>
                  {roleNav.map((item) => (
                    <Link key={item.to} to={item.to} onClick={closeMenu} className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-foreground hover:bg-accent">{t(item.labelKey)}</Link>
                  ))}
                  <Button variant="outline" className="mt-2 min-h-11" onClick={handleSignOut}>
                    <LogOut aria-hidden="true" />
                    {t("auth.signOut")}
                  </Button>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/sign-in" onClick={closeMenu} className="inline-flex min-h-11 items-center justify-center rounded-md border border-input text-sm font-medium">{t("nav.signIn")}</Link>
                    <Link to="/sign-up" onClick={closeMenu} className="inline-flex min-h-11 items-center justify-center rounded-md bg-secondary text-sm font-medium text-secondary-foreground">{t("nav.signUp")}</Link>
                  </div>
                  <Button asChild className="mt-2 min-h-11"><Link to="/waitlist" onClick={closeMenu}>{t("nav.joinWaitlist")}</Link></Button>
                </>
              )}
              <LanguageSwitcher className="mt-3 w-fit" />
            </div>
          </nav>
        ) : null}
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div className="max-w-sm space-y-3">
            <Brand showTagline />
            <p className="text-sm leading-6 text-muted-foreground">{t("landing.footerMission")}</p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">{t("landing.footerProduct")}</p>
            <div className="grid gap-1 text-sm text-muted-foreground">
              <a href="/#features" className="w-fit py-2 hover:text-foreground">{t("nav.features")}</a>
              <a href="/#how-it-works" className="w-fit py-2 hover:text-foreground">{t("nav.howItWorks")}</a>
              <a href="/#about" className="w-fit py-2 hover:text-foreground">{t("nav.about")}</a>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">{t("landing.footerAccess")}</p>
            <Button asChild variant="outline"><Link to="/waitlist">{t("nav.joinWaitlist")}</Link></Button>
            <LanguageSwitcher className="mt-4" />
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs leading-relaxed text-muted-foreground sm:px-6 md:flex-row md:justify-between lg:px-8">
            <p>{t("landing.footerCopyright", { year })}</p>
            <p className="max-w-2xl">{t("safety.disclaimer")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
