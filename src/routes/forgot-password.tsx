import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, MailCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthCard, AuthField, fieldA11y } from "@/components/common/AuthCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { createForgotSchema } from "@/lib/auth";
import type { TranslationKey } from "@/locales";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — AgriVet OS" },
      { name: "description", content: "Request a password-reset link for your AgriVet OS account." },
      { property: "og:title", content: "Forgot password — AgriVet OS" },
      { property: "og:description", content: "Reset access to your AgriVet OS account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ email: string }>({
    resolver: zodResolver(createForgotSchema(t)),
    defaultValues: { email: "" },
  });

  async function onSubmit({ email }: { email: string }) {
    setErrorKey(null);
    const result = await resetPassword(email);
    if (!result.ok) return setErrorKey(result.errorKey);
    setSent(true);
  }

  if (sent) {
    return (
      <AuthCard title={t("auth.forgotSentTitle")}>
        <div role="status" aria-live="polite" className="space-y-4">
          <MailCheck className="size-12 text-primary" aria-hidden="true" />
          <p className="text-base leading-7">{t("auth.forgotSentDescription")}</p>
          <Button asChild className="min-h-11"><Link to="/sign-in">{t("auth.backToSignIn")}</Link></Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("auth.forgotTitle")} description={t("auth.forgotDescription")}>
      {errorKey ? (
        <Alert variant="destructive" className="mb-5" role="alert">
          <TriangleAlert className="size-4" aria-hidden="true" />
          <AlertDescription>{t(errorKey)}</AlertDescription>
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5" aria-busy={isSubmitting}>
        <AuthField id="email" label={t("auth.email")} error={errors.email?.message}>
          <Input {...fieldA11y("email", errors.email)} type="email" inputMode="email" autoComplete="email" className="min-h-11" placeholder={t("auth.emailPlaceholder")} {...register("email")} />
        </AuthField>
        <Button type="submit" size="lg" className="min-h-12" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {t(isSubmitting ? "auth.forgotSending" : "auth.forgotButton")}
        </Button>
      </form>
      <Link to="/sign-in" className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline">{t("auth.backToSignIn")}</Link>
    </AuthCard>
  );
}
