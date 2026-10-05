import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AuthCard, AuthField, fieldA11y } from "@/components/common/AuthCard";
import { LoadingState } from "@/components/common/LoadingState";
import { PasswordInput } from "@/components/common/PasswordInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { createNewPasswordSchema } from "@/lib/auth";
import type { TranslationKey } from "@/locales";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — AgriVet OS" },
      { name: "description", content: "Choose a new password for your AgriVet OS account." },
      { property: "og:title", content: "Set a new password — AgriVet OS" },
      { property: "og:description", content: "Finish resetting your AgriVet OS password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

type FormValues = { password: string; confirmPassword: string };

function ResetPasswordPage() {
  const { t } = useTranslation();
  const { updatePassword, signOut } = useAuth();
  const [linkState, setLinkState] = useState<"checking" | "valid" | "invalid">("checking");
  const [done, setDone] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(createNewPasswordSchema(t)),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    if (hash.get("error") || query.get("error")) return setLinkState("invalid");
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setLinkState("valid");
    });
    // Give the client time to exchange the recovery token from the link.
    const timer = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      setLinkState((s) => (s === "checking" ? (data.session ? "valid" : "invalid") : s));
    }, 1200);
    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  async function onSubmit({ password }: FormValues) {
    setErrorKey(null);
    const result = await updatePassword(password);
    if (!result.ok) {
      if (result.errorKey === "auth.error.session") return setLinkState("invalid");
      return setErrorKey(result.errorKey);
    }
    await signOut();
    setDone(true);
  }

  if (done) {
    return (
      <AuthCard title={t("auth.resetSuccessTitle")}>
        <div role="status" aria-live="polite" className="space-y-4">
          <CheckCircle2 className="size-12 text-primary" aria-hidden="true" />
          <p className="text-base leading-7">{t("auth.resetSuccessDescription")}</p>
          <Button asChild className="min-h-11"><Link to="/sign-in">{t("auth.backToSignIn")}</Link></Button>
        </div>
      </AuthCard>
    );
  }

  if (linkState === "checking") return <LoadingState label={t("auth.checking")} />;

  if (linkState === "invalid") {
    return (
      <AuthCard title={t("auth.resetInvalidTitle")}>
        <div role="alert" className="space-y-4">
          <p className="text-base leading-7 text-muted-foreground">{t("auth.resetInvalidDescription")}</p>
          <Button asChild className="min-h-11"><Link to="/forgot-password">{t("auth.requestNewLink")}</Link></Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("auth.resetTitle")} description={t("auth.resetDescription")}>
      {errorKey ? (
        <Alert variant="destructive" className="mb-5" role="alert">
          <TriangleAlert className="size-4" aria-hidden="true" />
          <AlertDescription>{t(errorKey)}</AlertDescription>
        </Alert>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5" aria-busy={isSubmitting}>
        <AuthField id="password" label={t("auth.newPassword")} hint={t("auth.passwordHint")} error={errors.password?.message}>
          <PasswordInput {...fieldA11y("password", errors.password)} autoComplete="new-password" {...register("password")} />
        </AuthField>
        <AuthField id="confirmPassword" label={t("auth.confirmNewPassword")} error={errors.confirmPassword?.message}>
          <PasswordInput {...fieldA11y("confirmPassword", errors.confirmPassword)} autoComplete="new-password" {...register("confirmPassword")} />
        </AuthField>
        <Button type="submit" size="lg" className="min-h-12" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {t(isSubmitting ? "auth.resetSaving" : "auth.resetButton")}
        </Button>
      </form>
    </AuthCard>
  );
}
