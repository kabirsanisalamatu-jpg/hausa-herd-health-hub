CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 1 AND 100),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255 AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text CHECK (phone IS NULL OR char_length(phone) BETWEEN 1 AND 40),
  location text NOT NULL CHECK (char_length(btrim(location)) BETWEEN 1 AND 120),
  user_type text NOT NULL CHECK (user_type IN ('farmer','vet','other')),
  livestock_types text[] NOT NULL CHECK (
    cardinality(livestock_types) BETWEEN 1 AND 7
    AND livestock_types <@ ARRAY['cattle','goats','sheep','poultry','fish','other','multiple']::text[]
  ),
  farm_size text CHECK (farm_size IS NULL OR char_length(farm_size) BETWEEN 1 AND 80),
  preferred_language text NOT NULL CHECK (preferred_language IN ('ha','en')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_unique ON public.waitlist (email);

CREATE OR REPLACE FUNCTION public.waitlist_normalize()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.email := lower(btrim(NEW.email));
  NEW.full_name := btrim(NEW.full_name);
  NEW.location := btrim(NEW.location);
  NEW.phone := NULLIF(btrim(NEW.phone), '');
  NEW.farm_size := NULLIF(btrim(NEW.farm_size), '');
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS waitlist_normalize_trg ON public.waitlist;
CREATE TRIGGER waitlist_normalize_trg BEFORE INSERT ON public.waitlist
FOR EACH ROW EXECUTE FUNCTION public.waitlist_normalize();

REVOKE ALL ON public.waitlist FROM anon, authenticated;
GRANT INSERT ON public.waitlist TO anon, authenticated;
GRANT ALL ON public.waitlist TO service_role;

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can join the waitlist" ON public.waitlist;
CREATE POLICY "Anyone can join the waitlist" ON public.waitlist
FOR INSERT TO anon, authenticated WITH CHECK (true);