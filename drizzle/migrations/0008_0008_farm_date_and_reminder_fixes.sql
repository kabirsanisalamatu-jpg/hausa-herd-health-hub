-- Phase 8.1: one server-side farm calendar date (Africa/Lagos, WAT, no DST) replaces the old UTC current_date + 1 grace.
CREATE OR REPLACE FUNCTION public.farm_today()
RETURNS date LANGUAGE sql STABLE SET search_path TO 'public' AS $$
  SELECT (now() AT TIME ZONE 'Africa/Lagos')::date;
$$;
GRANT EXECUTE ON FUNCTION public.farm_today() TO authenticated, service_role;

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
  IF NEW.record_date > public.farm_today() THEN
    RAISE EXCEPTION 'future_record_date' USING ERRCODE = '23514';
  END IF;
  IF NEW.administration_date IS NOT NULL AND NEW.administration_date > public.farm_today() THEN
    RAISE EXCEPTION 'future_administration_date' USING ERRCODE = '23514';
  END IF;
  IF NEW.assessment_date IS NOT NULL AND NEW.assessment_date > public.farm_today() THEN
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

CREATE OR REPLACE FUNCTION public.vaccination_before_write()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.vaccine_name := btrim(NEW.vaccine_name);
  NEW.administered_by_name := NULLIF(btrim(NEW.administered_by_name), '');
  NEW.batch_number := NULLIF(btrim(NEW.batch_number), '');
  NEW.notes := NULLIF(btrim(NEW.notes), '');
  IF NEW.vaccination_date > public.farm_today() THEN
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

CREATE OR REPLACE FUNCTION public.health_events_before_write()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.title := btrim(NEW.title);
  NEW.description := NULLIF(btrim(NEW.description), '');
  NEW.reported_by := NULLIF(btrim(NEW.reported_by), '');
  NEW.professional_involved := NULLIF(btrim(NEW.professional_involved), '');
  IF NEW.event_date > public.farm_today() THEN
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

-- _today is kept for signature compatibility but ignored: the server farm date is always used.
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
    (SELECT count(*) FROM cur WHERE next_due_date > public.farm_today()),
    (SELECT count(*) FROM cur WHERE next_due_date = public.farm_today()),
    (SELECT count(*) FROM cur WHERE next_due_date < public.farm_today());
$$;

-- Completed/stopped treatments no longer produce follow-up reminders; their records and dates are untouched.
CREATE OR REPLACE FUNCTION public.farmer_reminders(_today date, _horizon integer DEFAULT 7)
RETURNS TABLE(kind text, record_id uuid, livestock_id uuid, label text, due_date date, treatment_status text,
  livestock_name text, identification_code text, species text, record_type text, quantity integer)
LANGUAGE sql STABLE SET search_path TO 'public' AS $$
  SELECT 'treatment', t.id, t.livestock_id, t.reported_problem, t.follow_up_date, t.treatment_status,
    l.name, l.identification_code, l.species, l.record_type, l.quantity
  FROM public.treatment_records t JOIN public.livestock l ON l.id = t.livestock_id
  WHERE t.owner_id = auth.uid() AND l.status = 'active' AND t.follow_up_date IS NOT NULL
    AND t.treatment_status NOT IN ('completed', 'stopped')
    AND t.follow_up_date <= public.farm_today() + LEAST(GREATEST(_horizon, 0), 60)
  UNION ALL
  SELECT 'vaccination', v.id, v.livestock_id, v.vaccine_name, v.next_due_date, NULL,
    l.name, l.identification_code, l.species, l.record_type, l.quantity
  FROM public.vaccination_records v JOIN public.livestock l ON l.id = v.livestock_id
  WHERE v.owner_id = auth.uid() AND l.status = 'active' AND v.next_due_date IS NOT NULL
    AND v.next_due_date <= public.farm_today() + LEAST(GREATEST(_horizon, 0), 60)
    AND NOT EXISTS (SELECT 1 FROM public.vaccination_records n
      WHERE n.livestock_id = v.livestock_id AND n.id <> v.id
        AND public.vaccine_key(n.vaccine_name) = public.vaccine_key(v.vaccine_name)
        AND (n.vaccination_date > v.vaccination_date OR (n.vaccination_date = v.vaccination_date AND n.created_at > v.created_at)))
  ORDER BY 5, 1;
$$;

-- Deletion protection (re-asserted): no DELETE/TRUNCATE for app roles, no anon access at all.
REVOKE DELETE, TRUNCATE ON public.treatment_records FROM authenticated;
REVOKE ALL ON public.treatment_records FROM anon;