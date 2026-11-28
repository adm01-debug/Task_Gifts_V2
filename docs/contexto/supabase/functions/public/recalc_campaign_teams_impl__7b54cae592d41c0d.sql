CREATE OR REPLACE FUNCTION public.recalc_campaign_teams_impl(_campaign_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  WITH agg AS (SELECT t.id AS team_id, COALESCE(SUM(cp.progress), 0)::NUMERIC(14,2) AS total, COUNT(m.user_id)::INT AS members FROM public.campaign_teams t LEFT JOIN public.campaign_team_members m ON m.team_id = t.id LEFT JOIN public.campaign_participants cp ON cp.campaign_id = t.campaign_id AND cp.user_id = m.user_id WHERE t.campaign_id = _campaign_id GROUP BY t.id)
  UPDATE public.campaign_teams t SET progress = a.total, members_count = a.members, progress_percent = CASE WHEN t.target_team > 0 THEN LEAST(100, ROUND((a.total / t.target_team) * 100, 2)) ELSE 0 END FROM agg a WHERE t.id = a.team_id;
  WITH ranked AS (SELECT id, ROW_NUMBER() OVER (ORDER BY progress DESC, created_at ASC) AS pos FROM public.campaign_teams WHERE campaign_id = _campaign_id)
  UPDATE public.campaign_teams t SET rank_position = r.pos FROM ranked r WHERE t.id = r.id;
END; $function$
