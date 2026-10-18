-- Phase 8: treatment records (owner-only, tied to the livestock owner) + on-screen reminder helpers.
CREATE TABLE IF NOT EXISTS public.treatment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id uuid NOT NULL,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  record_date date NOT NULL CHECK (record_date >= date '1950-01-01'),
  reported_problem text NOT NULL CHECK (char_length(reported_problem) BETWEEN 1 AND 500),
  farmer_observations text CHECK (farmer_observations IS NULL OR char_length(farmer_observations) <= 2000),
  veterinary_assessment text CHECK (veterinary_assessment IS NULL OR char_length(veterinary_assessment) <= 2000),
  veterinarian_name text CHECK (veterinarian_name IS NULL OR char_length(veterinarian_name) <= 100),
  assessment_date date CHECK (assessment_date IS NULL OR assessment_date >= date '1950-01-01'),
  treatment_plan text CHECK (treatment_plan IS NULL OR char_length(treatment_plan) <= 2000),
  medicine_name text CHECK (medicine_name IS NULL OR char_length(medicine_name) <= 120),
  dose_and_instructions text CHECK (dose_and_instructions IS NULL OR char_length(dose_and_instructions) <= 1000),
  treatment_status text NOT NULL DEFAULT 'awaiting_assessment'
    CHECK (treatment_status IN ('awaiting_assessment','recommended','prescribed','administered','completed','stopped')),
  administration_date date CHECK (administration_date IS NULL OR administration_date >= date '1950-01-01'),
  administered_by text CHECK (administered_by IS NULL OR char_length(administered_by) <= 100),
  follow_up_date date,
  notes text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT treatment_followup_after CHECK (follow_up_date IS NULL OR follow_up_date >= record_date),
  CONSTRAINT treatment_livestock_owner_fk FOREIGN KEY (livestock_id, owner_id)
    REFERENCES public.livestock (id, owner_id) ON DELETE RESTRICT
);

GRANT SELECT, INSERT, UPDATE ON public.treatment_records TO authenticated;
GRANT ALL ON public.treatment_records TO service_role;
ALTER TABLE public.treatment_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers read own treatments" ON public.treatment_records;
CREATE POLICY "Farmers read own treatments" ON public.treatment_records FOR SELECT TO authenticated
  USING (owner_id = auth.uid() AND public.has_role(auth.uid(), 'farmer'));
DROP POLICY IF EXISTS "Farmers add own treatments" ON public.treatment_records;
CREATE POLICY "Farmers add own treatments" ON public.treatment_records FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(), 'farmer')
    AND EXISTS (SELECT 1 FROM public.livestock l WHERE l.id = livestock_id AND l.owner_id = auth.uid() AND l.status = 'active'));
DROP POLICY IF EXISTS "Farmers update own treatments" ON public.treatment_records;
CREATE POLICY "Farmers update own treatments" ON public.treatment_records FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND public.has_role(auth.uid(), 'farmer'))
  WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(), 'farmer')
    AND EXISTS (SELECT 1 FROM public.livestock l WHERE l.id = livestock_id AND l.owner_id = auth.uid() AND l.status = 'active'));

CREATE INDEX IF NOT EXISTS treatment_livestock_idx ON public.treatment_records (livestock_id, record_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS treatment_owner_followup_idx ON public.treatment_records (owner_id, follow_up_date);

-- Normalises text, blocks future dates (1-day grace for local vs server date), locks owner/livestock/created_at.
CREATE OR REPLACE FUNCTION public.treatment_before_write()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.reported_problem := btrim(NEW.reported_problem);
  NEW.farmer_observations := NULLIF(btrim(NEW.farmer_observations), '');
  NEW.veterinary_assessment := NULLIF(btrim(NEW.veterinary_assessment), '');
  NEW.veterinarian_name := NULLIF(btrim(NEW.veterinarian_name), '');
  NEW.treatment_plan := NULLIF(btrim(NEW.treatment_plan), '');
  NEW.medicine_name := NULLIF(btrim(NEW.medicine_name), '');
  NEW.dose_and_instructions := NULLIF(btrim(NEW.dose_and_instructions), '');
  NEW.administered_by := NULLIF(btrim(NEW.administered_by), '');
  NEW.notes := NULLIF(btrim(NEW.notes), '');
  IF NEW.record_date > current_date + 1 THEN
    RAISE EXCEPTION 'future_record_date' USING ERRCODE = '23514';
  END IF;
  IF NEW.administration_date IS NOT NULL AND NEW.administration_date > current_date + 1 THEN
    RAISE EXCEPTION 'future_administration_date' USING ERRCODE = '23514';
  END IF;
  IF NEW.assessment_date IS NOT NULL AND NEW.assessment_date > current_date + 1 THEN
    RAISE EXCEPTION 'future_assessment_date' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
  ELSE
    IF NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.livestock_id IS DISTINCT FROM OLD.livestock_id THEN
      RAISE EXCEPTION 'owner_immutable' USING ERRCODE = '42501';
    END IF;
    NEW.id := OLD.id;
    NEW.created_at := OLD.created_at;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS treatment_before_write_trg ON public.treatment_records;
CREATE TRIGGER treatment_before_write_trg BEFORE INSERT OR UPDATE ON public.treatment_records
  FOR EACH ROW EXECUTE FUNCTION public.treatment_before_write();

-- A vaccination is superseded when the same livestock has a later record with the same normalised vaccine name.
CREATE OR REPLACE FUNCTION public.vaccine_key(_name text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT lower(regexp_replace(btrim(COALESCE(_name, '')), '\s+', ' ', 'g'));
$$;

-- Health summary: due counts now ignore superseded vaccination records (active livestock only).
CREATE OR REPLACE FUNCTION public.health_summary(_today date)
RETURNS TABLE(health_events bigint, vaccination_records bigint, upcoming bigint, due_today bigint, overdue bigint)
LANGUAGE sql STABLE SET search_path TO 'public' AS $$
  WITH cur AS (
    SELECT v.next_due_date FROM public.vaccination_records v JOIN public.livestock l ON l.id = v.livestock_id
    WHERE v.owner_id = auth.uid() AND l.status = 'active' AND v.next_due_date IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.vaccination_records n
        WHERE n.livestock_id = v.livestock_id AND n.id <> v.id
          AND public.vaccine_key(n.vaccine_name) = public.vaccine_key(v.vaccine_name)
          AND (n.vaccination_date > v.vaccination_date OR (n.vaccination_date = v.vaccination_date AND n.created_at > v.created_at)))
  )
  SELECT
    (SELECT count(*) FROM public.health_events h WHERE h.owner_id = auth.uid()),
    (SELECT count(*) FROM public.vaccination_records v WHERE v.owner_id = auth.uid()),
    (SELECT count(*) FROM cur WHERE next_due_date > _today),
    (SELECT count(*) FROM cur WHERE next_due_date = _today),
    (SELECT count(*) FROM cur WHERE next_due_date < _today);
$$;

-- Reminder rows for the signed-in farmer: treatment follow-ups + current vaccination due dates,
-- active livestock only, everything overdue plus anything due within _horizon days of the farmer's local _today.
CREATE OR REPLACE FUNCTION public.farmer_reminders(_today date, _horizon integer DEFAULT 7)
RETURNS TABLE(kind text, record_id uuid, livestock_id uuid, label text, due_date date, treatment_status text,
  livestock_name text, identification_code text, species text, record_type text, quantity integer)
LANGUAGE sql STABLE SET search_path TO 'public' AS $$
  SELECT 'treatment', t.id, t.livestock_id, t.reported_problem, t.follow_up_date, t.treatment_status,
    l.name, l.identification_code, l.species, l.record_type, l.quantity
  FROM public.treatment_records t JOIN public.livestock l ON l.id = t.livestock_id
  WHERE t.owner_id = auth.uid() AND l.status = 'active' AND t.follow_up_date IS NOT NULL
    AND t.follow_up_date <= _today + LEAST(GREATEST(_horizon, 0), 60)
  UNION ALL
  SELECT 'vaccination', v.id, v.livestock_id, v.vaccine_name, v.next_due_date, NULL,
    l.name, l.identification_code, l.species, l.record_type, l.quantity
  FROM public.vaccination_records v JOIN public.livestock l ON l.id = v.livestock_id
  WHERE v.owner_id = auth.uid() AND l.status = 'active' AND v.next_due_date IS NOT NULL
    AND v.next_due_date <= _today + LEAST(GREATEST(_horizon, 0), 60)
    AND NOT EXISTS (SELECT 1 FROM public.vaccination_records n
      WHERE n.livestock_id = v.livestock_id AND n.id <> v.id
        AND public.vaccine_key(n.vaccine_name) = public.vaccine_key(v.vaccine_name)
        AND (n.vaccination_date > v.vaccination_date OR (n.vaccination_date = v.vaccination_date AND n.created_at > v.created_at)))
  ORDER BY 5, 1;
$$;

CREATE OR REPLACE FUNCTION public.treatment_count()
RETURNS bigint LANGUAGE sql STABLE SET search_path TO 'public' AS $$
  SELECT count(*) FROM public.treatment_records WHERE owner_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.farmer_reminders(date, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.farmer_reminders(date, integer) TO authenticated;
REVOKE ALL ON FUNCTION public.treatment_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.treatment_count() TO authenticated;
REVOKE ALL ON FUNCTION public.health_summary(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.health_summary(date) TO authenticated;