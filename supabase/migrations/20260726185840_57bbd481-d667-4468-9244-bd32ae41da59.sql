CREATE OR REPLACE FUNCTION public.generate_certificate_code()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alphabet CONSTANT TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  candidate TEXT;
  i INT;
  attempts INT := 0;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..12 LOOP
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    candidate := substr(candidate, 1, 4) || '-' || substr(candidate, 5, 4) || '-' || substr(candidate, 9, 4);

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.user_certifications WHERE certificate_code = candidate
    );

    attempts := attempts + 1;
    IF attempts > 20 THEN
      RAISE EXCEPTION 'Não foi possível gerar um código de certificado único';
    END IF;
  END LOOP;

  RETURN candidate;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_certificate_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_certificate_code() TO authenticated, service_role;

ALTER TABLE public.user_certifications
  ALTER COLUMN certificate_code SET DEFAULT public.generate_certificate_code();