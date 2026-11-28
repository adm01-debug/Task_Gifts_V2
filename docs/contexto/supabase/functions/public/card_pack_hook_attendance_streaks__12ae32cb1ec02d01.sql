CREATE OR REPLACE FUNCTION public.card_pack_hook_attendance_streaks()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_new INTEGER := floor(LEAST(GREATEST(COALESCE(NEW.current_streak, 0), 0), 100) / 5) * 5; v_old INTEGER := 0;
BEGIN
  IF TG_OP = 'UPDATE' THEN v_old := floor(LEAST(GREATEST(COALESCE(OLD.current_streak, 0), 0), 100) / 5) * 5; END IF;
  IF v_new = 0 OR v_new <= v_old THEN RETURN NEW; END IF;
  PERFORM public._grant_card_pack_internal(NEW.user_id, 'streak', NEW.user_id::text || ':' || v_new::text, 4);
  RETURN NEW;
END; $function$
