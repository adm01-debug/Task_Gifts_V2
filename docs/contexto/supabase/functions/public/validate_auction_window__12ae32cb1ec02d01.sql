CREATE OR REPLACE FUNCTION public.validate_auction_window()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN IF NEW.ends_at <= NEW.starts_at THEN RAISE EXCEPTION 'auction_window_invalid'; END IF; RETURN NEW; END; $function$
