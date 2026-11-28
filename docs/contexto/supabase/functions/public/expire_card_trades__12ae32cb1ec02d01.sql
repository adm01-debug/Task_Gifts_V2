CREATE OR REPLACE FUNCTION public.expire_card_trades()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_count INTEGER;
BEGIN UPDATE public.card_trades SET status = 'expired', resolved_at = now(), updated_at = now() WHERE status = 'pending' AND expires_at <= now(); GET DIAGNOSTICS v_count = ROW_COUNT; RETURN v_count; END; $function$
