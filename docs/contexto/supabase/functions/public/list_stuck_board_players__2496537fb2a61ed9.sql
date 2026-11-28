CREATE OR REPLACE FUNCTION public.list_stuck_board_players(p_max_hours integer DEFAULT 48, p_trail_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(trail_id uuid, trail_title text, user_id uuid, display_name text, "position" integer, blocked_hours numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT s.trail_id, t.title, s.user_id, COALESCE(p.display_name, 'Colaborador'), s.position, ROUND((EXTRACT(EPOCH FROM (now() - s.blocked_at)) / 3600.0)::numeric, 1) FROM public.board_player_states s LEFT JOIN public.board_trails t ON t.id = s.trail_id LEFT JOIN public.profiles p ON p.id = s.user_id WHERE s.blocked_challenge_id IS NOT NULL AND s.blocked_at IS NOT NULL AND s.blocked_at < now() - make_interval(hours => GREATEST(1, LEAST(COALESCE(p_max_hours, 48), 720))) AND (p_trail_id IS NULL OR s.trail_id = p_trail_id) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')) ORDER BY s.blocked_at ASC LIMIT 200;
$function$
