CREATE OR REPLACE FUNCTION public.log_lucky_wheel_budget_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.coins_per_spin_budget IS NOT DISTINCT FROM OLD.coins_per_spin_budget THEN RETURN NEW; END IF;
  INSERT INTO public.lucky_wheel_settings_audit (old_budget, new_budget, changed_by)
  VALUES (CASE WHEN TG_OP = 'UPDATE' THEN OLD.coins_per_spin_budget ELSE NULL END, NEW.coins_per_spin_budget, COALESCE(NEW.updated_by, auth.uid()));
  RETURN NEW;
END;
$function$
