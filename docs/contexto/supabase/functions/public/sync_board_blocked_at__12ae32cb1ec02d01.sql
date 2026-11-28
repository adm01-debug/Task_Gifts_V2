CREATE OR REPLACE FUNCTION public.sync_board_blocked_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.blocked_challenge_id IS NULL THEN NEW.blocked_at := NULL;
  ELSIF TG_OP = 'INSERT' OR OLD.blocked_challenge_id IS DISTINCT FROM NEW.blocked_challenge_id THEN NEW.blocked_at := now();
  ELSIF NEW.blocked_at IS NULL THEN NEW.blocked_at := now(); END IF;
  RETURN NEW;
END; $function$
