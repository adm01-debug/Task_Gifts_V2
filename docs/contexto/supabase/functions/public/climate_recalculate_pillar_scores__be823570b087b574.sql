CREATE OR REPLACE FUNCTION public.climate_recalculate_pillar_scores(p_survey_id uuid, p_min_responses integer DEFAULT 5)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT (
    public.has_role(v_user_id, 'admin')
    OR public.has_role(v_user_id, 'manager')
    OR EXISTS (SELECT 1 FROM public.climate_surveys s WHERE s.id = p_survey_id AND s.created_by = v_user_id)
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN public._climate_recompute_pillar_scores(p_survey_id, p_min_responses);
END;
$function$
