CREATE OR REPLACE FUNCTION public.log_lucky_wheel_prize_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_before jsonb := NULL; v_after jsonb := NULL;
BEGIN
  IF TG_OP <> 'INSERT' THEN v_before := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN v_after := to_jsonb(NEW); END IF;
  IF TG_OP = 'UPDATE' AND (v_before - 'updated_at') IS NOT DISTINCT FROM (v_after - 'updated_at') THEN RETURN NEW; END IF;
  INSERT INTO public.lucky_wheel_prize_audit (prize_id, operation, changed_by, before_data, after_data)
  VALUES (COALESCE(NEW.id, OLD.id), TG_OP, auth.uid(), v_before, v_after);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$
