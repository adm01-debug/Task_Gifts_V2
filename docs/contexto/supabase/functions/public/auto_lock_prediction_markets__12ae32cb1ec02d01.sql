CREATE OR REPLACE FUNCTION public.auto_lock_prediction_markets()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_row record; v_count integer := 0;
BEGIN
  FOR v_row IN SELECT id FROM public.prediction_markets WHERE status = 'open' AND locks_at <= now() ORDER BY locks_at FOR UPDATE SKIP LOCKED LOOP
    UPDATE public.prediction_markets SET status = 'locked' WHERE id = v_row.id;
    INSERT INTO public.prediction_admin_events (market_id, action, payload) VALUES (v_row.id, 'auto_locked', jsonb_build_object('locked_at', now()));
    v_count := v_count + 1;
  END LOOP; RETURN v_count;
END; $function$
