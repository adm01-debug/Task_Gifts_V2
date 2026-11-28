CREATE OR REPLACE FUNCTION public.validate_api_key(p_api_key text, p_api_secret text)
 RETURNS TABLE(id uuid, name text, system_type text, permissions jsonb, rate_limit_per_minute integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_row public.external_api_keys%ROWTYPE;
BEGIN
  IF p_api_key IS NULL OR p_api_secret IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_row
  FROM public.external_api_keys eak
  WHERE eak.api_key = [REDACTED] AND eak.is_active = true;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF encode(extensions.digest(v_row.secret_salt || p_api_secret, 'sha256'), 'hex') <> v_row.secret_hash THEN
    RETURN;
  END IF;

  UPDATE public.external_api_keys
  SET last_used_at = now()
  WHERE external_api_keys.id = [REDACTED];

  RETURN QUERY
  SELECT v_row.id, v_row.name, v_row.system_type, v_row.permissions, v_row.rate_limit_per_minute;
END;
$function$
