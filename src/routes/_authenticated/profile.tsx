import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AuthCard, AuthField, fieldA11y } from "@/components/common/AuthCard";
import { LoadingState } from "@/components/common/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL_KEYS } from "@/lib/auth";
import { LANGUAGES, type Language } from "@/locales";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — AgriVet OS" },
      { name: "description", content: "Manage your AgriVet OS profile." },
      { property: "og:title", content: "Profile — AgriVet OS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

/**
 * Profile settings. Only editable columns are sent (full_name, phone, location,
 * preferred_language); id/email/role are locked by RLS and column grants.
 */
function ProfilePage() {
  const { t } = useTranslation();
  const { profile, role, loading, accountStatus, refreshAccount } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState<Language>("ha");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name);
    setPhone(profile.phone ?? "");
    setLocation(profile.location ?? "");
    setLanguage(profile.preferred_language === "en" ? "en" : "ha");
  }, [profile]);

  if (loading || accountStatus === "idle" || accountStatus === "loading") {
    return <LoadingState label={t("common.loading")} />;
  }
  if (!profile) {
    return <p className="mx-auto max-w-xl px-4 py-10 text-sm text-muted-foreground">{t("common.errorDescription")}</p>;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setNotice(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        location: location.trim() || null,
        preferred_language: language,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      setNotice({ kind: "err", text: t("profile.saveError") });
      return;
    }
    await refreshAccount();
    setNotice({ kind: "ok", text: t("profile.saved") });
  }

  return (
    <AuthCard title={t("profile.title")} description={t("profile.description")}>
      <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
        {notice ? (
          <p role="status" className={`rounded-md border px-4 py-3 text-sm ${notice.kind === "ok" ? "border-border bg-card" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
            {notice.text}
          </p>
        ) : null}

        <AuthField id="profile-name" label={t("auth.fullName")}>
          <Input id="profile-name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} required className="min-h-11" />
        </AuthField>

        <AuthField id="profile-phone" label={t("auth.phone")}>
          <Input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} inputMode="tel" className="min-h-11" />
        </AuthField>

        <AuthField id="profile-location" label={t("auth.location")}>
          <Input id="profile-location" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} className="min-h-11" />
        </AuthField>

        <div className="grid gap-2">
          <Label htmlFor="profile-language">{t("auth.language")}</Label>
          <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
            <SelectTrigger id="profile-language" className="min-h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {t(lang === "ha" ? "language.hausa" : "language.english")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="profile-email">{t("profile.emailNote")}</Label>
          <Input id="profile-email" value={profile.email} readOnly disabled className="min-h-11" {...fieldA11y("profile-email")} />
        </div>

        <div className="grid gap-2">
          <Label>{t("profile.roleNote")}</Label>
          <div>
            <Badge variant="secondary">{role ? t(ROLE_LABEL_KEYS[role]) : t("dashboard.noRole")}</Badge>
          </div>
        </div>

        <Button type="submit" className="min-h-11" disabled={saving || !fullName.trim()}>
          {saving ? t("profile.saving") : t("profile.save")}
        </Button>
      </form>
    </AuthCard>
  );
}
