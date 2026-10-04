import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useTranslation } from "@/hooks/useTranslation";
import { APP_ROLES, authErrorKey, type AppRole, type SignUpData } from "@/lib/auth";
import type { TranslationKey } from "@/locales";

export type Profile = Tables<"profiles">;
type Result = { ok: true } | { ok: false; errorKey: TranslationKey };

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (data: SignUpData) => Promise<Result>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<Result>;
  updatePassword: (password: string) => Promise<Result>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ROLE_PRIORITY: AppRole[] = ["super_admin", "admin", "content_editor", "vet", "farmer"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const { language, setLanguage } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const syncedLanguage = useRef<string | null>(null);

  const loadAccount = useCallback(async (userId: string) => {
    const [{ data: profileRow }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile(profileRow ?? null);
    const roles = (roleRows ?? []).map((r) => r.role).filter((r): r is AppRole => (APP_ROLES as readonly string[]).includes(r));
    setRole(ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null);
    if (profileRow) {
      // Profile language wins after sign-in; the local preference follows it.
      syncedLanguage.current = profileRow.preferred_language;
      if (profileRow.preferred_language === "ha" || profileRow.preferred_language === "en") setLanguage(profileRow.preferred_language);
    }
  }, [setLanguage]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_OUT" || !next) {
        setProfile(null);
        setRole(null);
        syncedLanguage.current = null;
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Defer DB calls outside the auth callback to avoid deadlocks.
        setTimeout(() => void loadAccount(next.user.id), 0);
      }
    });
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        setSession(data.session);
        if (data.session) await loadAccount(data.session.user.id);
      })
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
    return () => sub.subscription.unsubscribe();
  }, [loadAccount]);

  // Language changes while signed in update only the profile's language column.
  useEffect(() => {
    if (!profile || syncedLanguage.current === null || syncedLanguage.current === language) return;
    syncedLanguage.current = language;
    void supabase.from("profiles").update({ preferred_language: language }).eq("id", profile.id);
  }, [language, profile]);

  const signIn = useCallback<AuthContextValue["signIn"]>(async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      return error ? { ok: false, errorKey: authErrorKey(error) } : { ok: true };
    } catch {
      return { ok: false, errorKey: "auth.error.network" };
    }
  }, []);

  const signUp = useCallback<AuthContextValue["signUp"]>(async (data) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          // Only farmer/vet are accepted; the database rejects anything else.
          data: {
            full_name: data.fullName.trim(),
            phone: data.phone.trim(),
            location: data.location.trim(),
            preferred_language: data.preferredLanguage,
            user_type: data.userType,
          },
        },
      });
      return error ? { ok: false, errorKey: authErrorKey(error) } : { ok: true };
    } catch {
      return { ok: false, errorKey: "auth.error.network" };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Local session is cleared regardless.
    }
  }, []);

  const resetPassword = useCallback<AuthContextValue["resetPassword"]>(async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      // Only rate-limit/network problems are surfaced, never whether the account exists.
      if (error && (error.status === 429 || !error.status)) return { ok: false, errorKey: authErrorKey(error) };
      return { ok: true };
    } catch {
      return { ok: false, errorKey: "auth.error.network" };
    }
  }, []);

  const updatePassword = useCallback<AuthContextValue["updatePassword"]>(async (password) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return error ? { ok: false, errorKey: authErrorKey(error) } : { ok: true };
    } catch {
      return { ok: false, errorKey: "auth.error.network" };
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, user: session?.user ?? null, profile, role, loading, signIn, signUp, signOut, resetPassword, updatePassword }),
    [session, profile, role, loading, signIn, signUp, signOut, resetPassword, updatePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
