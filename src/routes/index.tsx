import { createFileRoute } from "@tanstack/react-router";
import { HeartPulse, Languages, ShieldCheck } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { PageContainer } from "@/components/common/PageContainer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriVet OS — Hausa-first livestock health platform" },
      {
        name: "description",
        content:
          "AgriVet OS is a Hausa-first, English-ready livestock health platform for farmers and veterinary professionals in Nigeria.",
      },
      { property: "og:title", content: "AgriVet OS — Hausa-first livestock health platform" },
      {
        property: "og:description",
        content:
          "A Hausa-first, English-ready livestock health platform for farmers and veterinary professionals in Nigeria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FoundationPage,
});

function FoundationPage() {
  const { t } = useTranslation();

  return (
    <PageContainer as="section" className="space-y-8">
      <header className="space-y-3">
        <Badge variant="secondary">{t("foundation.badge")}</Badge>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("foundation.title")}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t("foundation.description")}
        </p>
      </header>

      <Alert>
        <ShieldCheck className="size-4" aria-hidden="true" />
        <AlertTitle>{t("common.notice")}</AlertTitle>
        <AlertDescription>{t("safety.disclaimer")}</AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Languages className="size-4 text-primary" aria-hidden="true" />
              {t("language.label")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="demo-name">{t("form.nameLabel")}</Label>
              <Input id="demo-name" placeholder={t("form.namePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-livestock">{t("form.livestockLabel")}</Label>
              <Select>
                <SelectTrigger id="demo-livestock" className="min-h-11 w-full">
                  <SelectValue placeholder={t("common.selectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cattle">{t("form.livestockCattle")}</SelectItem>
                  <SelectItem value="goats">{t("form.livestockGoats")}</SelectItem>
                  <SelectItem value="sheep">{t("form.livestockSheep")}</SelectItem>
                  <SelectItem value="poultry">{t("form.livestockPoultry")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="min-h-11">{t("common.save")}</Button>
              <Button variant="outline" className="min-h-11">
                {t("common.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HeartPulse className="size-4 text-primary" aria-hidden="true" />
              {t("brand.tagline")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoadingState className="py-6" />
            <EmptyState />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
