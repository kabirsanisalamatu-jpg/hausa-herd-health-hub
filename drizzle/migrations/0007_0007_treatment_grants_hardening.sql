-- Defense in depth: no permanent deletion and no anonymous access to treatment records, even at grant level.
REVOKE DELETE, TRUNCATE ON public.treatment_records FROM authenticated;
REVOKE ALL ON public.treatment_records FROM anon;