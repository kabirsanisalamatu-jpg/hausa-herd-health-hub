import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, MailCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { AuthCard, AuthField, fieldA11y } from "@/components/common/AuthCard";
import { LoadingState } from "@/components/common/LoadingState";
import { PasswordInput } from "@/components/common/PasswordInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useRedirectIfSignedIn } from "@/hooks/useRedirectIfSignedIn";
import { useTranslation } from "@/hooks/useTranslation";
import { createSignUpSchema, type SignUpData } from "@/lib/auth";
import type { TranslationKey } from "@/locales";

export const Route = createFileRoute("/sign-up")({
  head: () => ({
    meta: [
      { title: "Create an account — AgriVet OS" },
      { name: "description", content: "Create an AgriVet OS account as a farmer or veterinarian." },
      { property: "og:title", content: "Create an account — AgriVet OS" },
      { property: "og:description", content: "Join AgriVet OS as a livestock farmer or veterinarian." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const { t, language } = useTranslation();
  const { signUp } = useAuth();
  const { checking } = useRedirectIfSignedIn();
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [sent, setSent] = useState(false);
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpData>({
    resolver: zodResolver(createSignUpSchema(t)),
    defaultValues: { fullName: "", email: "", phone: "", location: "", password: "", confirmPassword: "", preferredLanguage: language },
  });

  async function onSubmit(values: SignUpData) {
    setErrorKey(null);
    const result = await signUp(values);
    if (!result.ok) return setErrorKey(result.errorKey);
    // Email confirmation is required; for privacy the same screen appears for new and existing emails.
    setSent(true);
  }

  if (sent) {
    return (
      <AuthCard title={t("auth.confirmTitle")}>
        <div role="status" aria-live="polite" className="space-y-4">
          <MailCheck className="size-12 text-primary" aria-hidden="true" />
          <p className="text-base leading-7">{t("auth.confirmDescription")}</p>
          <p className="text-sm text-muted-foreground">{t("auth.confirmHint")}</p>
          <Button asChild className="min-h-11"><Link to="/sign-in">{t("auth.backToSignIn")}</Link></Button>
        </div>
      </AuthCard>
    );
  }

  if (checking) return <LoadingState label={t("auth.checking")} />;

  return (
    <AuthCard title={t("auth.signUpTitle")} description={t("auth.signUpDescription")}>
      {errorKey ? (
        <Alert variant="destructive" className="mb-5" role="alert">
          <TriangleAlert className="size-4" aria-hidden="true" />
          <AlertDescription>{t(errorKey)}</AlertDescription>
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5" aria-busy={isSubmitting}>
        <AuthField id="fullName" label={t("auth.fullName")} error={errors.fullName?.message}>
          <Input {...fieldA11y("fullName", errors.fullName)} autoComplete="name" className="min-h-11" placeholder={t("auth.fullNamePlaceholder")} {...register("fullName")} />
        </AuthField>
        <AuthField id="email" label={t("auth.email")} error={errors.email?.message}>
          <Input {...fieldA11y("email", errors.email)} type="email" inputMode="email" autoComplete="email" className="min-h-11" placeholder={t("auth.emailPlaceholder")} {...register("email")} />
        </AuthField>
        <AuthField id="phone" label={t("auth.phone")} error={errors.phone?.message}>
          <Input {...fieldA11y("phone", errors.phone)} type="tel" inputMode="tel" autoComplete="tel" className="min-h-11" placeholder={t("auth.phonePlaceholder")} {...register("phone")} />
        </AuthField>
        <AuthField id="location" label={t("auth.location")} error={errors.location?.message}>
          <Input {...fieldA11y("location", errors.location)} autoComplete="address-level2" className="min-h-11" placeholder={t("auth.locationPlaceholder")} {...register("location")} />
        </AuthField>
        <AuthField id="userType" label={t("auth.userType")} error={errors.userType?.message}>
          <Controller control={control} name="userType" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger {...fieldA11y("userType", errors.userType)} className="min-h-11 w-full"><SelectValue placeholder={t("common.selectPlaceholder")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="farmer">{t("auth.farmer")}</SelectItem>
                <SelectItem value="vet">{t("auth.veterinarian")}</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </AuthField>
        <AuthField id="preferredLanguage" label={t("auth.language")} error={errors.preferredLanguage?.message}>
          <Controller control={control} name="preferredLanguage" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger {...fieldA11y("preferredLanguage", errors.preferredLanguage)} className="min-h-11 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ha">{t("language.hausa")}</SelectItem>
                <SelectItem value="en">{t("language.english")}</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </AuthField>
        <AuthField id="password" label={t("auth.password")} hint={t("auth.passwordHint")} error={errors.password?.message}>
          <PasswordInput {...fieldA11y("password", errors.password)} autoComplete="new-password" {...register("password")} />
        </AuthField>
        <AuthField id="confirmPassword" label={t("auth.confirmPassword")} error={errors.confirmPassword?.message}>
          <PasswordInput {...fieldA11y("confirmPassword", errors.confirmPassword)} autoComplete="new-password" {...register("confirmPassword")} />
        </AuthField>
        <Button type="submit" size="lg" className="min-h-12" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {t(isSubmitting ? "auth.signingUp" : "auth.signUpButton")}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        {t("auth.haveAccount")}{" "}
        <Link to="/sign-in" className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline">{t("auth.signInLink")}</Link>
      </p>
    </AuthCard>
  );
}
