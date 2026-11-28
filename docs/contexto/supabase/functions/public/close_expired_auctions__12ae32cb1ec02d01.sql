CREATE OR REPLACE FUNCTION public.close_expired_auctions()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_count INTEGER := 0; r RECORD;
BEGIN FOR r IN SELECT id FROM public.auctions WHERE status = 'active' AND ends_at <= now() ORDER BY ends_at ASC LIMIT 200 LOOP PERFORM public.settle_auction(r.id); v_count := v_count + 1; END LOOP; RETURN v_count; END; $function$
