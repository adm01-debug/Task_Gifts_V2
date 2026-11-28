CREATE OR REPLACE FUNCTION public.get_nine_box_distribution(p_department_id uuid DEFAULT NULL::uuid, p_period text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  PERFORM public._require_admin();
  SELECT jsonb_build_object(
    'distribution', COALESCE(jsonb_object_agg(box_position::text, cnt), '{}'::jsonb),
    'total', COALESCE(SUM(cnt), 0),
    'labels', jsonb_build_object(
      '1', 'Baixo Desempenho / Baixo Potencial',
      '2', 'Médio Desempenho / Baixo Potencial',
      '3', 'Alto Desempenho / Baixo Potencial',
      '4', 'Baixo Desempenho / Médio Potencial',
      '5', 'Médio Desempenho / Médio Potencial',
      '6', 'Alto Desempenho / Médio Potencial',
      '7', 'Baixo Desempenho / Alto Potencial',
      '8', 'Médio Desempenho / Alto Potencial',
      '9', 'Alto Desempenho / Alto Potencial (Star)'
    )
  ) INTO v_result
  FROM (
    SELECT nbe.box_position, COUNT(*) as cnt
    FROM nine_box_evaluations nbe
    LEFT JOIN team_members tm ON tm.user_id = nbe.user_id
    WHERE (p_department_id IS NULL OR tm.department_id = p_department_id)
    AND (p_period IS NULL OR nbe.evaluation_period = p_period)
    AND nbe.id IN (
      SELECT DISTINCT ON (user_id) id
      FROM nine_box_evaluations
      ORDER BY user_id, created_at DESC
    )
    GROUP BY nbe.box_position
  ) dist;
  RETURN v_result;
END;
$function$
