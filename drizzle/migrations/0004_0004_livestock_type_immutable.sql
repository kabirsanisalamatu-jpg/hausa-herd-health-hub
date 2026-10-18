CREATE OR REPLACE FUNCTION public.livestock_type_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.record_type IS DISTINCT FROM OLD.record_type THEN
    RAISE EXCEPTION 'record_type_immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS livestock_type_immutable_trg ON public.livestock;
CREATE TRIGGER livestock_type_immutable_trg BEFORE UPDATE ON public.livestock
  FOR EACH ROW EXECUTE FUNCTION public.livestock_type_immutable();