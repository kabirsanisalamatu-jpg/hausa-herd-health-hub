import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BellRing,
  BookOpenText,
  Building2,
  Check,
  ClipboardList,
  Languages,
  MessageSquareText,
  PawPrint,
  ShieldCheck,
  Stethoscope,
  UserRound,
  UsersRound,
} from "lucide-react";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/locales";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriVet OS — Livestock Health Support for Farmers" },
      { name: "description", content: "Hausa-first livestock health guidance that helps farmers understand next steps and access veterinary support." },
      { property: "og:title", content: "AgriVet OS — Livestock Health Support for Farmers" },
      { property: "og:description", content: "Practical, Hausa-first livestock health support for farmers and veterinary professionals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const features: Array<{ icon: typeof Languages; title: TranslationKey; description: TranslationKey; future?: boolean }> = [
  { icon: Languages, title: "landing.featureHausaTitle", description: "landing.featureHausaDescription" },
  { icon: ShieldCheck, title: "landing.featureGuidanceTitle", description: "landing.featureGuidanceDescription" },
  { icon: Stethoscope, title: "landing.featureVetTitle", description: "landing.featureVetDescription" },
  { icon: ClipboardList, title: "landing.featureRecordsTitle", description: "landing.featureRecordsDescription", future: true },
  { icon: BellRing, title: "landing.featureRemindersTitle", description: "landing.featureRemindersDescription", future: true },
];

const steps: Array<{ icon: typeof MessageSquareText; title: TranslationKey; description: TranslationKey; future?: boolean }> = [
  { icon: MessageSquareText, title: "landing.step1Title", description: "landing.step1Description" },
  { icon: BookOpenText, title: "landing.step2Title", description: "landing.step2Description" },
  { icon: Stethoscope, title: "landing.step3Title", description: "landing.step3Description" },
  { icon: ClipboardList, title: "landing.step4Title", description: "landing.step4Description", future: true },
];

function LandingPage() {
  const { t } = useTranslation();

  return (
    <div>
      <section className="border-b border-border bg-secondary/45">
        <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:min-h-0 md:grid-cols-[1.08fr_.92fr] md:py-20 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-5 border border-border bg-background">{t("landing.eyebrow")}</Badge>
            <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">{t("landing.heroTitle")}</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{t("landing.heroDescription")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-h-12"><Link to="/waitlist">{t("landing.joinCta")}<ArrowRight aria-hidden="true" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="min-h-12"><a href="/demo" title={t("nav.comingSoon")}>{t("landing.demoCta")}</a></Button>
            </div>
            <p className="mt-5 flex items-start gap-2 text-sm text-muted-foreground"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />{t("landing.heroTrust")}</p>
          </div>
          <JourneyVisual />
        </div>
      </section>

      <section id="features" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="landing.featuresEyebrow" title="landing.featuresTitle" description="landing.featuresDescription" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description, future }) => (
              <Card key={title} className="shadow-none">
                <CardContent className="p-6">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-secondary text-primary"><Icon className="size-5" aria-hidden="true" /></span>
                    <Badge variant={future ? "outline" : "secondary"}>{t(future ? "common.future" : "common.current")}</Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{t(title)}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(description)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 border-y border-border bg-muted/55 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="landing.howEyebrow" title="landing.howTitle" />
          <ol className="mt-10 grid gap-8 md:grid-cols-4">
            {steps.map(({ icon: Icon, title, description, future }, index) => (
              <li key={title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Icon className="size-5" aria-hidden="true" /></span>
                  <span className="text-sm font-semibold text-primary">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{t(title)}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(description)}</p>
                {future ? <Badge variant="outline" className="mt-3">{t("common.future")}</Badge> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="landing.audienceEyebrow" title="landing.audienceTitle" align="center" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Audience icon={UserRound} title="landing.farmersTitle" description="landing.farmersDescription" />
            <Audience icon={Stethoscope} title="landing.vetsTitle" description="landing.vetsDescription" />
            <Audience icon={Building2} title="landing.partnersTitle" description="landing.partnersDescription" />
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-20 border-y border-border bg-secondary/45 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-[1fr_.9fr] lg:px-8">
          <SectionHeading eyebrow="landing.aboutEyebrow" title="landing.aboutTitle" description="landing.aboutDescription" />
          <ul className="grid gap-3 sm:grid-cols-2">
            {(["landing.aboutAccessibility", "landing.aboutPractical", "landing.aboutLanguage", "landing.aboutResponsible", "landing.aboutCollaboration"] as TranslationKey[]).map((item) => (
              <li key={item} className="flex min-h-14 items-center gap-3 rounded-md border border-border bg-background px-4 text-sm font-medium"><Check className="size-4 shrink-0 text-primary" aria-hidden="true" />{t(item)}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl bg-primary px-5 py-10 text-center text-primary-foreground sm:px-10 sm:py-14">
          <h2 className="text-2xl font-semibold sm:text-3xl">{t("landing.ctaTitle")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/85 sm:text-base">{t("landing.ctaDescription")}</p>
          <Button asChild size="lg" variant="secondary" className="mt-7 min-h-12"><Link to="/waitlist">{t("landing.joinCta")}<ArrowRight aria-hidden="true" /></Link></Button>
        </div>
      </section>
    </div>
  );
}

function JourneyVisual() {
  const { t } = useTranslation();
  const nodes = [
    { icon: UserRound, label: "landing.visualFarmer" as TranslationKey },
    { icon: PawPrint, label: "landing.visualLivestock" as TranslationKey },
    { icon: ShieldCheck, label: "landing.visualGuidance" as TranslationKey },
    { icon: Stethoscope, label: "landing.visualVet" as TranslationKey },
  ];
  return (
    <div className="relative mx-auto w-full max-w-lg" aria-label={nodes.map((node) => t(node.label)).join(" → ")} role="img">
      <div className="absolute top-1/2 right-10 left-10 h-px bg-border" aria-hidden="true" />
      <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-4">
        {nodes.map(({ icon: Icon, label }, index) => (
          <div key={label} className="flex min-h-32 flex-col items-center justify-center rounded-md border border-border bg-card p-4 text-center shadow-sm">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary"><Icon className="size-6" aria-hidden="true" /></span>
            <span className="mt-3 text-xs font-semibold text-foreground">{t(label)}</span>
            {index < nodes.length - 1 ? <ArrowRight className="absolute hidden size-4 translate-x-[4.4rem] text-muted-foreground sm:block" aria-hidden="true" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function Audience({ icon: Icon, title, description }: { icon: typeof UsersRound; title: TranslationKey; description: TranslationKey }) {
  const { t } = useTranslation();
  return (
    <div className="border-t-2 border-primary pt-5">
      <Icon className="size-6 text-primary" aria-hidden="true" />
      <h3 className="mt-4 text-lg font-semibold">{t(title)}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(description)}</p>
    </div>
  );
}