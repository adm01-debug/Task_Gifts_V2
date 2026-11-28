CREATE OR REPLACE FUNCTION public.calculate_enps_score_impl(p_survey_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_promoters INTEGER;
  v_detractors INTEGER;
  v_total INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE score >= 9),
    COUNT(*) FILTER (WHERE score <= 6),
    COUNT(*)
  INTO v_promoters, v_detractors, v_total
  FROM enps_responses
  WHERE survey_id = p_survey_id;
  
  IF v_total = 0 THEN
    RETURN NULL;
  END IF;
  
  RETURN ROUND(((v_promoters::NUMERIC - v_detractors::NUMERIC) / v_total) * 100, 1);
END;
$function$
