CREATE OR REPLACE FUNCTION public.set_certificate_identity()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.certificate_code IS NULL THEN
    NEW.certificate_code := public.generate_certificate_code();
  END IF;
  NEW.verification_hash := encode(
    digest(
      NEW.certificate_code || '|' || NEW.user_id::text || '|' ||
      NEW.certification_id::text || '|' || COALESCE(NEW.issued_at, now())::text,
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$function$
