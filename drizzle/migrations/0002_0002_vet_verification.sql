DO $$ BEGIN
  CREATE TYPE public.vet_verification_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.vet_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.vet_verification_status NOT NULL DEFAULT 'pending',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason text CHECK (rejection_reason IS NULL OR char_length(rejection_reason) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Clients can only read; every change goes through review_vet() below.
REVOKE ALL ON public.vet_verifications FROM anon, authenticated;
GRANT SELECT ON public.vet_verifications TO authenticated;
GRANT ALL ON public.vet_verifications TO service_role;
ALTER TABLE public.vet_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vets read own verification" ON public.vet_verifications;
CREATE POLICY "Vets read own verification" ON public.vet_verifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins read verifications" ON public.vet_verifications;
CREATE POLICY "Admins read verifications" ON public.vet_verifications
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP TRIGGER IF EXISTS vet_verifications_touch_updated_at ON public.vet_verifications;
CREATE TRIGGER vet_verifications_touch_updated_at BEFORE UPDATE ON public.vet_verifications
  FOR EACH ROW EXECUTE FUNCTION public.profiles_touch_updated_at();

-- Admins may read profiles (to review vets and count users); no write access is added.
DROP POLICY IF EXISTS "Admins read profiles" ON public.profiles;
CREATE POLICY "Admins read profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Waitlist: read-only for admins; anonymous insert unchanged.
GRANT SELECT ON public.waitlist TO authenticated;
DROP POLICY IF EXISTS "Admins read waitlist" ON public.waitlist;
CREATE POLICY "Admins read waitlist" ON public.waitlist
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- The only way to approve/reject. Reviewer is always the caller, never a client value.
CREATE OR REPLACE FUNCTION public.review_vet(_vet_id uuid, _status public.vet_verification_status, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;
  IF _vet_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_review_self' USING ERRCODE = '42501';
  END IF;
  IF _status NOT IN ('approved','rejected') THEN
    RAISE EXCEPTION 'invalid_status' USING ERRCODE = '22023';
  END IF;
  IF _reason IS NOT NULL AND char_length(_reason) > 500 THEN
    RAISE EXCEPTION 'reason_too_long' USING ERRCODE = '22001';
  END IF;
  UPDATE public.vet_verifications
     SET status = _status,
         reviewed_at = now(),
         reviewed_by = auth.uid(),
         rejection_reason = CASE WHEN _status = 'rejected' THEN NULLIF(btrim(_reason), '') ELSE NULL END
   WHERE user_id = _vet_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
END; $$;
REVOKE EXECUTE ON FUNCTION public.review_vet(uuid, public.vet_verification_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_vet(uuid, public.vet_verification_status, text) TO authenticated;

-- New vets start as pending.
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
  IF requested = 'vet' THEN
    INSERT INTO public.vet_verifications (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Backfill existing vets as pending.
INSERT INTO public.vet_verifications (user_id)
SELECT r.user_id FROM public.user_roles r
JOIN public.profiles p ON p.id = r.user_id
WHERE r.role = 'vet'
ON CONFLICT (user_id) DO NOTHING;