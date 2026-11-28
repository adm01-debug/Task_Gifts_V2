CREATE OR REPLACE FUNCTION public.auto_unblock_board_players(p_max_hours integer DEFAULT 48)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_count integer;
BEGIN
  IF auth.uid() IS NOT NULL THEN PERFORM public._require_admin(); END IF;
  SELECT count(*)::integer INTO v_count FROM public.unblock_board_players(p_max_hours, NULL);
  RETURN COALESCE(v_count, 0);
END; $function$
