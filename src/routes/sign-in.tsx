import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthCard, AuthField, fieldA11y } from "@/components/common/AuthCard";
import { LoadingState } from "@/components/common/LoadingState";
import { PasswordInput } from "@/components/common/PasswordInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useRedirectIfSignedIn } from "@/hooks/useRedirectIfSignedIn";
import { useTranslation } from "@/hooks/useTranslation";
import { createSignInSchema, type SignInData } from "@/lib/auth";
import type { TranslationKey } from "@/locales";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign in — AgriVet OS" },
      { name: "description", content: "Sign in to your AgriVet OS account." },
      { property: "og:title", content: "Sign in — AgriVet OS" },
      { property: "og:description", content: "Access your AgriVet OS livestock health account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { checking } = useRedirectIfSignedIn();
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInData>({
    resolver: zodResolver(createSignInSchema(t)),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInData) {
    setErrorKey(null);
    const result = await signIn(values.email, values.password);
    if (!result.ok) return setErrorKey(result.errorKey);
    setSuccess(true);
    void navigate({ to: "/dashboard", replace: true });
  }

  if (checking && !success) return <LoadingState label={t("auth.checking")} />;

  return (
    <AuthCard title={t("auth.signInTitle")} description={t("auth.signInDescription")}>
      {errorKey ? (
        <Alert variant="destructive" className="mb-5" role="alert">
          <TriangleAlert className="size-4" aria-hidden="true" />
          <AlertDescription>{t(errorKey)}</AlertDescription>
        </Alert>
      ) : null}
      {success ? <p role="status" className="mb-5 text-sm text-primary">{t("auth.signInSuccess")}</p> : null}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5" aria-busy={isSubmitting}>
        <AuthField id="email" label={t("auth.email")} error={errors.email?.message}>
          <Input {...fieldA11y("email", errors.email)} type="email" inputMode="email" autoComplete="email" className="min-h-11" placeholder={t("auth.emailPlaceholder")} {...register("email")} />
        </AuthField>
        <AuthField id="password" label={t("auth.password")} error={errors.password?.message}>
          <PasswordInput {...fieldA11y("password", errors.password)} autoComplete="current-password" {...register("password")} />
        </AuthField>
        <Link to="/forgot-password" className="-mt-2 w-fit py-2 text-sm font-medium text-primary underline-offset-4 hover:underline">{t("auth.forgotLink")}</Link>
        <Button type="submit" size="lg" className="min-h-12" disabled={isSubmitting || success}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {t(isSubmitting ? "auth.signingIn" : "auth.signInButton")}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        {t("auth.noAccount")}{" "}
        <Link to="/sign-up" className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline">{t("auth.signUpLink")}</Link>
      </p>
    </AuthCard>
  );
}
