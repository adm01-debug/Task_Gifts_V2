CREATE OR REPLACE FUNCTION public.log_wager_integrity_review_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status AND NEW.notes IS NOT DISTINCT FROM OLD.notes THEN RETURN NEW; END IF;
  INSERT INTO public.wager_integrity_review_events (review_id, target_user_id, anomaly_code, window_days, previous_status, new_status, notes, metric, changed_by)
  VALUES (NEW.id, NEW.target_user_id, NEW.anomaly_code, NEW.window_days, CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END, NEW.status, NEW.notes, COALESCE(NEW.metric, 0), NEW.reviewed_by);
  RETURN NEW;
END;
$function$
