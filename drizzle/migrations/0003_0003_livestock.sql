CREATE TABLE IF NOT EXISTS public.livestock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  record_type text NOT NULL CHECK (record_type IN ('individual','group')),
  name text CHECK (name IS NULL OR char_length(name) BETWEEN 1 AND 100),
  identification_code text CHECK (identification_code IS NULL OR char_length(identification_code) BETWEEN 1 AND 60),
  species text NOT NULL CHECK (species IN ('cattle','goats','sheep','poultry','fish','other')),
  breed text CHECK (breed IS NULL OR char_length(breed) <= 80),
  sex text CHECK (sex IS NULL OR sex IN ('male','female','unknown')),
  date_of_birth date,
  estimated_age_value numeric(6,1) CHECK (estimated_age_value IS NULL OR (estimated_age_value > 0 AND estimated_age_value <= 1000)),
  estimated_age_unit text CHECK (estimated_age_unit IS NULL OR estimated_age_unit IN ('days','months','years')),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 1000000),
  purpose text CHECK (purpose IS NULL OR purpose IN ('meat','dairy','breeding','eggs','mixed','other')),
  acquisition_date date,
  acquisition_source text CHECK (acquisition_source IS NULL OR char_length(acquisition_source) <= 120),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT livestock_individual_is_one CHECK (record_type <> 'individual' OR quantity = 1),
  CONSTRAINT livestock_group_no_individual_fields CHECK (record_type <> 'group' OR (sex IS NULL AND date_of_birth IS NULL)),
  CONSTRAINT livestock_age_pair CHECK ((estimated_age_value IS NULL) = (estimated_age_unit IS NULL)),
  CONSTRAINT livestock_dob_or_estimate CHECK (date_of_birth IS NULL OR estimated_age_value IS NULL),
  CONSTRAINT livestock_archived_consistent CHECK ((status = 'archived') = (archived_at IS NOT NULL))
);

GRANT SELECT, INSERT, UPDATE ON public.livestock TO authenticated;
GRANT ALL ON public.livestock TO service_role;
ALTER TABLE public.livestock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers read own livestock" ON public.livestock;
CREATE POLICY "Farmers read own livestock" ON public.livestock FOR SELECT TO authenticated
  USING (owner_id = auth.uid() AND public.has_role(auth.uid(), 'farmer'));
DROP POLICY IF EXISTS "Farmers add own livestock" ON public.livestock;
CREATE POLICY "Farmers add own livestock" ON public.livestock FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(), 'farmer'));
DROP POLICY IF EXISTS "Farmers update own livestock" ON public.livestock;
CREATE POLICY "Farmers update own livestock" ON public.livestock FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND public.has_role(auth.uid(), 'farmer'))
  WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(), 'farmer'));

CREATE UNIQUE INDEX IF NOT EXISTS livestock_owner_active_code_uniq
  ON public.livestock (owner_id, lower(identification_code))
  WHERE identification_code IS NOT NULL AND status = 'active';
CREATE INDEX IF NOT EXISTS livestock_owner_status_updated_idx ON public.livestock (owner_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS livestock_owner_status_created_idx ON public.livestock (owner_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION public.livestock_before_write()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.name := NULLIF(btrim(NEW.name), '');
  NEW.identification_code := NULLIF(btrim(NEW.identification_code), '');
  NEW.breed := NULLIF(btrim(NEW.breed), '');
  NEW.acquisition_source := NULLIF(btrim(NEW.acquisition_source), '');
  NEW.notes := NULLIF(btrim(NEW.notes), '');
  IF NEW.date_of_birth IS NOT NULL AND NEW.date_of_birth > current_date THEN
    RAISE EXCEPTION 'future_birth_date' USING ERRCODE = '23514';
  END IF;
  IF NEW.acquisition_date IS NOT NULL AND NEW.acquisition_date > current_date THEN
    RAISE EXCEPTION 'future_acquisition_date' USING ERRCODE = '23514';
  END IF;
  IF NEW.date_of_birth IS NOT NULL AND NEW.date_of_birth < date '1950-01-01' THEN
    RAISE EXCEPTION 'invalid_birth_date' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
    NEW.status := COALESCE(NEW.status, 'active');
  ELSE
    IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
      RAISE EXCEPTION 'owner_immutable' USING ERRCODE = '42501';
    END IF;
    NEW.id := OLD.id;
    NEW.created_at := OLD.created_at;
  END IF;
  IF NEW.status = 'archived' THEN
    IF TG_OP = 'INSERT' OR OLD.status <> 'archived' THEN NEW.archived_at := now();
    ELSE NEW.archived_at := OLD.archived_at; END IF;
  ELSE
    NEW.archived_at := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS livestock_before_write_trg ON public.livestock;
CREATE TRIGGER livestock_before_write_trg BEFORE INSERT OR UPDATE ON public.livestock
  FOR EACH ROW EXECUTE FUNCTION public.livestock_before_write();

CREATE OR REPLACE FUNCTION public.livestock_summary()
RETURNS TABLE (active_records bigint, individual_records bigint, group_records bigint, animals_in_groups bigint, total_animals bigint, archived_records bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public' AS $$
  SELECT
    count(*) FILTER (WHERE status = 'active'),
    count(*) FILTER (WHERE status = 'active' AND record_type = 'individual'),
    count(*) FILTER (WHERE status = 'active' AND record_type = 'group'),
    COALESCE(sum(quantity) FILTER (WHERE status = 'active' AND record_type = 'group'), 0)::bigint,
    COALESCE(sum(quantity) FILTER (WHERE status = 'active'), 0)::bigint,
    count(*) FILTER (WHERE status = 'archived')
  FROM public.livestock WHERE owner_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.livestock_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.livestock_summary() TO authenticated;