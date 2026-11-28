CREATE OR REPLACE FUNCTION public.ensure_single_default_filter()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.saved_filters
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND entity_type = NEW.entity_type
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$function$
