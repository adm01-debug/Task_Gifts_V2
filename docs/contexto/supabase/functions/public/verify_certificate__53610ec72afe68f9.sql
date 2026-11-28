CREATE OR REPLACE FUNCTION public.verify_certificate(_code text)
 RETURNS TABLE(certificate_code text, holder_name text, certification_name text, certification_category text, issued_at timestamp with time zone, expires_at timestamp with time zone, status text, is_valid boolean, verification_hash text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    uc.certificate_code,
    COALESCE(p.display_name, 'Colaborador'),
    c.name,
    c.category,
    uc.issued_at,
    uc.expires_at,
    uc.status,
    (uc.status IN ('active', 'expiring_soon') AND (uc.expires_at IS NULL OR uc.expires_at > now())),
    uc.verification_hash
  FROM public.user_certifications uc
  JOIN public.certifications c ON c.id = uc.certification_id
  LEFT JOIN public.profiles p ON p.id = uc.user_id
  WHERE upper(trim(uc.certificate_code)) = upper(trim(_code))
  LIMIT 1;
$function$
