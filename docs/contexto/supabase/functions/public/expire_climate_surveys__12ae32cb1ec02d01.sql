CREATE OR REPLACE FUNCTION public.expire_climate_surveys()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rows integer;
BEGIN
  UPDATE public.climate_surveys
     SET status = 'completed',
         updated_at = now()
   WHERE status = 'active'
     AND ends_at IS NOT NULL
     AND ends_at < now();

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$function$
