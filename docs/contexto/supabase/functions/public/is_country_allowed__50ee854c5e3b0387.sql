CREATE OR REPLACE FUNCTION public.is_country_allowed(p_country_code character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_settings geo_settings;
  v_is_allowed BOOLEAN;
BEGIN
  SELECT * INTO v_settings FROM geo_settings LIMIT 1;
  
  IF v_settings IS NULL OR NOT v_settings.is_enabled THEN
    RETURN true;
  END IF;
  
  IF p_country_code IS NULL THEN
    RETURN NOT v_settings.block_unknown_countries;
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM geo_allowed_countries
    WHERE country_code = p_country_code AND is_active = true
  ) INTO v_is_allowed;
  
  RETURN v_is_allowed;
END;
$function$
