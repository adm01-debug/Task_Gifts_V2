CREATE OR REPLACE FUNCTION public.log_prediction_settlement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IN ('settled','voided') AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.prediction_admin_events (market_id, action, actor_id, payload)
    VALUES (NEW.id, CASE WHEN NEW.status = 'voided' THEN 'voided' ELSE 'settled' END, NEW.settled_by, jsonb_build_object('winning_option_id', NEW.winning_option_id, 'total_pool', NEW.total_pool, 'rake_collected', NEW.rake_collected));
  END IF; RETURN NEW;
END; $function$
