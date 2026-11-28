CREATE OR REPLACE FUNCTION public.audit_lucky_wheel_prize()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  INSERT INTO public.lucky_wheel_prize_audit(prize_id, operation, changed_by, before_data, after_data)
  VALUES (
    COALESCE(OLD.id, NEW.id),
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD)::jsonb END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW)::jsonb END
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$
