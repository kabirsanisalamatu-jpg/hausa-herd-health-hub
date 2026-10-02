import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Info, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import {
  createWaitlistSchema,
  LIVESTOCK_TYPES,
  PREFERRED_LANGUAGES,
  submitWaitlistPreview,
  USER_TYPES,
  type WaitlistFormData,
} from "@/lib/waitlist";
import type { TranslationKey } from "@/locales";

export const Route = createFileRoute("/waitlist")({
  head: () => ({
    meta: [
      { title: "Join the Waitlist — AgriVet OS" },
      { name: "description", content: "Join the early-access list for Hausa-first livestock health support from AgriVet OS." },
      { property: "og:title", content: "Join the AgriVet OS Waitlist" },
      { property: "og:description", content: "Register your interest in practical livestock health and veterinary support." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WaitlistPage,
});

const userTypeKeys: Record<(typeof USER_TYPES)[number], TranslationKey> = {
  farmer: "waitlist.userFarmer",
  veterinarian: "waitlist.userVeterinarian",
  other: "waitlist.userOther",
};
const livestockKeys: Record<(typeof LIVESTOCK_TYPES)[number], TranslationKey> = {
  cattle: "form.livestockCattle",
  goats: "form.livestockGoats",
  sheep: "form.livestockSheep",
  poultry: "form.livestockPoultry",
  fish: "waitlist.livestockFish",
  other: "waitlist.livestockOther",
  multiple: "waitlist.livestockMultiple",
};

function WaitlistPage() {
  const { language, t } = useTranslation();
  const [status, setStatus] = useState<"form" | "success" | "error">("form");
  const schema = createWaitlistSchema(t);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", phone: "", location: "", farmSize: "", preferredLanguage: language },
  });

  async function onSubmit(values: WaitlistFormData) {
    setStatus("form");
    try {
      const result = await submitWaitlistPreview(values);
      setStatus(result.status === "development-preview" ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <section className="mx-auto flex min-h-[65vh] max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full text-center" role="status" aria-live="polite">
          <CheckCircle2 className="mx-auto size-14 text-primary" aria-hidden="true" />
          <h1 className="mt-6 text-3xl font-semibold">{t("waitlist.successTitle")}</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">{t("waitlist.successDescription")}</p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">{t("waitlist.successCaveat")}</p>
          <Button asChild className="mt-8 min-h-11"><Link to="/"><ArrowLeft aria-hidden="true" />{t("common.backHome")}</Link></Button>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-border bg-secondary/35">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-[.75fr_1.25fr] lg:px-8">
        <div>
          <Badge variant="secondary">{t("waitlist.eyebrow")}</Badge>
          <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">{t("waitlist.title")}</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{t("waitlist.description")}</p>
          <Alert className="mt-6 bg-background">
            <Info className="size-4" aria-hidden="true" />
            <AlertTitle>{t("waitlist.devMode")}</AlertTitle>
            <AlertDescription>{t("waitlist.devModeDescription")}</AlertDescription>
          </Alert>
          <p className="mt-6 flex gap-2 text-sm leading-6 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />{t("safety.disclaimer")}</p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{t("waitlist.formTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("waitlist.formDescription")}</p>
          </CardHeader>
          <CardContent>
            {status === "error" ? (
              <Alert variant="destructive" className="mb-6" role="alert">
                <TriangleAlert className="size-4" aria-hidden="true" />
                <AlertTitle>{t("waitlist.errorTitle")}</AlertTitle>
                <AlertDescription>{t("waitlist.errorDescription")}</AlertDescription>
              </Alert>
            ) : null}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5" aria-busy={isSubmitting}>
              <Field id="fullName" label={t("form.nameLabel")} error={errors.fullName?.message}>
                <Input id="fullName" autoComplete="name" maxLength={101} aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? "fullName-error" : undefined} placeholder={t("form.namePlaceholder")} {...register("fullName")} />
              </Field>
              <Field id="email" label={t("waitlist.emailLabel")} error={errors.email?.message}>
                <Input id="email" type="email" inputMode="email" autoComplete="email" maxLength={256} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} placeholder={t("waitlist.emailPlaceholder")} {...register("email")} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="phone" label={`${t("waitlist.phoneLabel")} — ${t("waitlist.phoneHint")}`} error={errors.phone?.message}>
                  <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={41} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-error" : undefined} placeholder={t("waitlist.phonePlaceholder")} {...register("phone")} />
                </Field>
                <Field id="location" label={t("waitlist.locationLabel")} error={errors.location?.message}>
                  <Input id="location" autoComplete="address-level2" maxLength={121} aria-invalid={!!errors.location} aria-describedby={errors.location ? "location-error" : undefined} placeholder={t("waitlist.locationPlaceholder")} {...register("location")} />
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <SelectField name="userType" label="waitlist.userTypeLabel" error={errors.userType?.message} control={control} options={USER_TYPES.map((value) => ({ value, label: userTypeKeys[value] }))} />
                <SelectField name="livestockType" label="waitlist.livestockTypeLabel" error={errors.livestockType?.message} control={control} options={LIVESTOCK_TYPES.map((value) => ({ value, label: livestockKeys[value] }))} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="farmSize" label={`${t("waitlist.farmSizeLabel")} — ${t("common.optional")}`} error={errors.farmSize?.message}>
                  <Input id="farmSize" maxLength={81} aria-invalid={!!errors.farmSize} aria-describedby={errors.farmSize ? "farmSize-error" : undefined} placeholder={t("waitlist.farmSizePlaceholder")} {...register("farmSize")} />
                </Field>
                <SelectField name="preferredLanguage" label="waitlist.languageLabel" error={errors.preferredLanguage?.message} control={control} options={PREFERRED_LANGUAGES.map((value) => ({ value, label: value === "ha" ? "language.hausa" : "language.english" }))} />
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{t("waitlist.privacy")}</p>
              <Button type="submit" size="lg" disabled={isSubmitting} className="min-h-12 w-full sm:w-fit">
                {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                {t(isSubmitting ? "waitlist.submitting" : "waitlist.submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p id={`${id}-error`} className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

function SelectField({ name, label, error, control, options }: {
  name: "userType" | "livestockType" | "preferredLanguage";
  label: TranslationKey;
  error?: string;
  control: ReturnType<typeof useForm<WaitlistFormData>>["control"];
  options: Array<{ value: string; label: TranslationKey }>;
}) {
  const { t } = useTranslation();
  const id = `waitlist-${name}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{t(label)}</Label>
      <Controller control={control} name={name} render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger id={id} className="min-h-11 w-full" aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}>
            <SelectValue placeholder={t("common.selectPlaceholder")} />
          </SelectTrigger>
          <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{t(option.label)}</SelectItem>)}</SelectContent>
        </Select>
      )} />
      {error ? <p id={`${id}-error`} className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}