CREATE OR REPLACE FUNCTION public.recalc_campaign_progress_impl(_campaign_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _total NUMERIC(14,2);
BEGIN
  UPDATE public.campaign_participants cp SET progress_percent = CASE WHEN target_adjusted > 0 THEN LEAST(100, ROUND((progress / target_adjusted) * 100, 2)) ELSE 0 END, completed_at = CASE WHEN progress >= target_adjusted AND target_adjusted > 0 AND completed_at IS NULL THEN now() ELSE completed_at END WHERE cp.campaign_id = _campaign_id;
  SELECT COALESCE(SUM(progress), 0) INTO _total FROM public.campaign_participants WHERE campaign_id = _campaign_id;
  UPDATE public.sales_campaigns SET progress_global = _total WHERE id = _campaign_id;
  WITH ranked AS (SELECT id, ROW_NUMBER() OVER (ORDER BY progress DESC, updated_at ASC) AS pos FROM public.campaign_participants WHERE campaign_id = _campaign_id AND accepted_at IS NOT NULL)
  UPDATE public.campaign_participants cp SET rank_position = r.pos FROM ranked r WHERE cp.id = r.id;
  PERFORM public.recalc_campaign_teams(_campaign_id);
END; $function$
