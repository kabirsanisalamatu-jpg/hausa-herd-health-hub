import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Brand } from "@/components/common/Brand";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Shared public shell: header with brand + language switcher, main region, footer.
 * Future auth and dashboard layouts can reuse the same pieces.
 */
export function SiteLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        {t("nav.skipToContent")}
      </a>

      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-label={t("brand.name")}
          >
            <Brand />
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-xs leading-relaxed text-muted-foreground">{t("safety.disclaimer")}</p>
        </div>
      </footer>
    </div>
  );
}
