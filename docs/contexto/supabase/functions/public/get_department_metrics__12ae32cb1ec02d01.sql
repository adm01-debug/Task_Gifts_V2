CREATE OR REPLACE FUNCTION public.get_department_metrics()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb := '[]'::jsonb;
BEGIN
  PERFORM public._require_admin();
  SELECT COALESCE(jsonb_agg(dept_data), '[]'::jsonb) INTO result
  FROM (
    SELECT jsonb_build_object(
      'id', d.id,
      'name', d.name,
      'color', d.color,
      'employeeCount', (SELECT COUNT(*) FROM team_members tm WHERE tm.department_id = d.id),
      'totalXp', COALESCE((
        SELECT SUM(p.xp) FROM team_members tm JOIN profiles p ON p.id = tm.user_id WHERE tm.department_id = d.id
      ), 0),
      'avgLevel', COALESCE((
        SELECT ROUND(AVG(p.level), 1) FROM team_members tm JOIN profiles p ON p.id = tm.user_id WHERE tm.department_id = d.id
      ), 0),
      'punctualityRate', COALESCE((
        SELECT ROUND(
          (COUNT(*) FILTER (WHERE ar.is_punctual = true)::numeric / NULLIF(COUNT(*), 0)) * 100, 1
        )
        FROM team_members tm
        JOIN attendance_records ar ON ar.user_id = tm.user_id
        WHERE tm.department_id = d.id
        AND ar.check_in >= DATE_TRUNC('month', CURRENT_DATE)
      ), 0),
      'questsCompleted', COALESCE((
        SELECT SUM(p.quests_completed) FROM team_members tm JOIN profiles p ON p.id = tm.user_id WHERE tm.department_id = d.id
      ), 0),
      'score', COALESCE((
        SELECT ROUND(
          (AVG(p.level) * 10 +
           (COUNT(*) FILTER (WHERE ar.is_punctual = true)::numeric / NULLIF(COUNT(ar.*), 0)) * 50 +
           AVG(p.quests_completed) * 2), 0
        )
        FROM team_members tm
        LEFT JOIN profiles p ON p.id = tm.user_id
        LEFT JOIN attendance_records ar ON ar.user_id = tm.user_id
        WHERE tm.department_id = d.id
      ), 0)
    ) as dept_data
    FROM departments d
    ORDER BY d.name
  ) AS departments;
  RETURN result;
END;
$function$
