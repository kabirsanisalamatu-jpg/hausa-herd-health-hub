DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('farmer','vet','admin','content_editor','super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 1 AND 100),
  email text NOT NULL CHECK (char_length(email) <= 255),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 40),
  preferred_language text NOT NULL DEFAULT 'ha' CHECK (preferred_language IN ('ha','en')),
  location text CHECK (location IS NULL OR char_length(location) <= 120),
  avatar_url text CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Profiles: users read their own row and may update only the editable columns.
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone, location, preferred_language, avatar_url) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Roles: read-only for the owner; no client writes at all.
REVOKE ALL ON public.user_roles FROM anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.profiles_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS profiles_touch_updated_at ON public.profiles;
CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_touch_updated_at();

-- Creates the profile and the only self-selectable roles (farmer/vet) atomically.
-- Any other requested user type aborts the signup, so no half-created accounts.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  requested text := meta->>'user_type';
  lang text := CASE WHEN meta->>'preferred_language' IN ('ha','en') THEN meta->>'preferred_language' ELSE 'ha' END;
BEGIN
  IF requested IS NOT NULL AND requested NOT IN ('farmer','vet') THEN
    RAISE EXCEPTION 'invalid_user_type';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, phone, preferred_language, location)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(left(btrim(meta->>'full_name'), 100), ''), split_part(COALESCE(NEW.email, ''), '@', 1), 'User'),
    lower(COALESCE(NEW.email, '')),
    NULLIF(left(btrim(meta->>'phone'), 40), ''),
    lang,
    NULLIF(left(btrim(meta->>'location'), 120), '')
  );

  IF requested IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, requested::public.app_role);
  END IF;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();