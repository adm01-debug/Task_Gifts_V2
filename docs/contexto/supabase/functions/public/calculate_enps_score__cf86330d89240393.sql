CREATE OR REPLACE FUNCTION public.calculate_enps_score(p_survey_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public._guard_manager_or_admin_if_user();
  RETURN public.calculate_enps_score_impl(p_survey_id);
END; $function$
