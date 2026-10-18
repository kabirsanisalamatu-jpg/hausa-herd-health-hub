-- Phase 7: health events + vaccination records, owner-only, tied to the livestock owner.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'livestock_id_owner_uniq') THEN
    ALTER TABLE public.livestock ADD CONSTRAINT livestock_id_owner_uniq UNIQUE (id, owner_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.health_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id uuid NOT NULL,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  event_type text NOT NULL CHECK (event_type IN ('observation','illness_report','injury','vet_visit','recovery','other')),
  event_date date NOT NULL CHECK (event_date >= date '1950-01-01'),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description text CHECK (description IS NULL OR char_length(description) <= 2000),
  reported_by text CHECK (reported_by IS NULL OR char_length(reported_by) <= 100),
  professional_involved text CHECK (professional_involved IS NULL OR char_length(professional_involved) <= 100),
  follow_up_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT health_events_followup_after CHECK (follow_up_date IS NULL OR follow_up_date >= event_date),
  CONSTRAINT health_events_livestock_owner_fk FOREIGN KEY (livestock_id, owner_id)
    REFERENCES public.livestock (id, owner_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS public.vaccination_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  livestock_id uuid NOT NULL,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  vaccine_name text NOT NULL CHECK (char_length(vaccine_name) BETWEEN 1 AND 120),
  vaccination_date date NOT NULL CHECK (vaccination_date >= date '1950-01-01'),
  next_due_date date,
  administered_by_name text CHECK (administered_by_name IS NULL OR char_length(administered_by_name) <= 100),
  batch_number text CHECK (batch_number IS NULL OR char_length(batch_number) <= 60),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vaccination_due_after CHECK (next_due_date IS NULL OR next_due_date >= vaccination_date),
  CONSTRAINT vaccination_livestock_owner_fk FOREIGN KEY (livestock_id, owner_id)
    REFERENCES public.livestock (id, owner_id) ON DELETE RESTRICT
);

GRANT SELECT, INSERT, UPDATE ON public.health_events TO authenticated;
GRANT ALL ON public.health_events TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.vaccination_records TO authenticated;
GRANT ALL ON public.vaccination_records TO service_role;
ALTER TABLE public.health_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers read own health events" ON public.health_events;
CREATE POLICY "Farmers read own health events" ON public.health_events FOR SELECT TO authenticated
  USING (owner_id = auth.uid() AND public.has_role(auth.uid(), 'farmer'));
DROP POLICY IF EXISTS "Farmers add own health events" ON public.health_events;
CREATE POLICY "Farmers add own health events" ON public.health_events FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(), 'farmer')
    AND EXISTS (SELECT 1 FROM public.livestock l WHERE l.id = livestock_id AND l.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Farmers update own health events" ON public.health_events;
CREATE POLICY "Farmers update own health events" ON public.health_events FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND public.has_role(auth.uid(), 'farmer'))
  WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(), 'farmer')
    AND EXISTS (SELECT 1 FROM public.livestock l WHERE l.id = livestock_id AND l.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Farmers read own vaccinations" ON public.vaccination_records;
CREATE POLICY "Farmers read own vaccinations" ON public.vaccination_records FOR SELECT TO authenticated
  USING (owner_id = auth.uid() AND public.has_role(auth.uid(), 'farmer'));
DROP POLICY IF EXISTS "Farmers add own vaccinations" ON public.vaccination_records;
CREATE POLICY "Farmers add own vaccinations" ON public.vaccination_records FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(), 'farmer')
    AND EXISTS (SELECT 1 FROM public.livestock l WHERE l.id = livestock_id AND l.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Farmers update own vaccinations" ON public.vaccination_records;
CREATE POLICY "Farmers update own vaccinations" ON public.vaccination_records FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND public.has_role(auth.uid(), 'farmer'))
  WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(), 'farmer')
    AND EXISTS (SELECT 1 FROM public.livestock l WHERE l.id = livestock_id AND l.owner_id = auth.uid()));

CREATE INDEX IF NOT EXISTS health_events_livestock_idx ON public.health_events (livestock_id, event_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS health_events_owner_idx ON public.health_events (owner_id);
CREATE INDEX IF NOT EXISTS vaccination_livestock_idx ON public.vaccination_records (livestock_id, vaccination_date DESC);
CREATE INDEX IF NOT EXISTS vaccination_owner_due_idx ON public.vaccination_records (owner_id, next_due_date);

-- Normalises text, blocks future dates (1-day grace for UTC vs local time), locks owner/livestock/created_at.
CREATE OR REPLACE FUNCTION public.health_events_before_write()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.title := btrim(NEW.title);
  NEW.description := NULLIF(btrim(NEW.description), '');
  NEW.reported_by := NULLIF(btrim(NEW.reported_by), '');
  NEW.professional_involved := NULLIF(btrim(NEW.professional_involved), '');
  IF NEW.event_date > current_date + 1 THEN
    RAISE EXCEPTION 'future_event_date' USING ERRCODE = '23514';
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

CREATE OR REPLACE FUNCTION public.vaccination_before_write()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.vaccine_name := btrim(NEW.vaccine_name);
  NEW.administered_by_name := NULLIF(btrim(NEW.administered_by_name), '');
  NEW.batch_number := NULLIF(btrim(NEW.batch_number), '');
  NEW.notes := NULLIF(btrim(NEW.notes), '');
  IF NEW.vaccination_date > current_date + 1 THEN
    RAISE EXCEPTION 'future_vaccination_date' USING ERRCODE = '23514';
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

DROP TRIGGER IF EXISTS health_events_before_write_trg ON public.health_events;
CREATE TRIGGER health_events_before_write_trg BEFORE INSERT OR UPDATE ON public.health_events
  FOR EACH ROW EXECUTE FUNCTION public.health_events_before_write();
DROP TRIGGER IF EXISTS vaccination_before_write_trg ON public.vaccination_records;
CREATE TRIGGER vaccination_before_write_trg BEFORE INSERT OR UPDATE ON public.vaccination_records
  FOR EACH ROW EXECUTE FUNCTION public.vaccination_before_write();

-- Real counts for the signed-in farmer. _today is the farmer's local date. Due counts only include active livestock.
CREATE OR REPLACE FUNCTION public.health_summary(_today date)
RETURNS TABLE(health_events bigint, vaccination_records bigint, upcoming bigint, due_today bigint, overdue bigint)
LANGUAGE sql STABLE SET search_path TO 'public' AS $$
  SELECT
    (SELECT count(*) FROM public.health_events h WHERE h.owner_id = auth.uid()),
    (SELECT count(*) FROM public.vaccination_records v WHERE v.owner_id = auth.uid()),
    (SELECT count(*) FROM public.vaccination_records v JOIN public.livestock l ON l.id = v.livestock_id
      WHERE v.owner_id = auth.uid() AND l.status = 'active' AND v.next_due_date > _today),
    (SELECT count(*) FROM public.vaccination_records v JOIN public.livestock l ON l.id = v.livestock_id
      WHERE v.owner_id = auth.uid() AND l.status = 'active' AND v.next_due_date = _today),
    (SELECT count(*) FROM public.vaccination_records v JOIN public.livestock l ON l.id = v.livestock_id
      WHERE v.owner_id = auth.uid() AND l.status = 'active' AND v.next_due_date < _today);
$$;
REVOKE ALL ON FUNCTION public.health_summary(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.health_summary(date) TO authenticated;