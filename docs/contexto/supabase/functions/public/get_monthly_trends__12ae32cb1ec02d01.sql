CREATE OR REPLACE FUNCTION public.get_monthly_trends()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb := '[]'::jsonb;
  month_data jsonb;
  month_start date;
  month_end date;
  i integer;
  month_users integer;
  month_xp integer;
  month_punctual integer;
  month_total integer;
  month_enrollments integer;
  month_completed integer;
BEGIN
  PERFORM public._require_admin();
  FOR i IN 0..5 LOOP
    month_start := DATE_TRUNC('month', CURRENT_DATE - (i || ' months')::interval)::date;
    month_end := (month_start + INTERVAL '1 month' - INTERVAL '1 day')::date;
    SELECT COUNT(*) INTO month_users FROM profiles WHERE DATE(created_at) <= month_end;
    SELECT COALESCE(SUM(xp), 0) INTO month_xp FROM profiles WHERE DATE(created_at) <= month_end;
    SELECT COUNT(*) FILTER (WHERE is_punctual = true), COUNT(*)
      INTO month_punctual, month_total
      FROM attendance_records
      WHERE DATE(check_in) >= month_start AND DATE(check_in) <= month_end;
    SELECT COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND DATE(completed_at) <= month_end), COUNT(*)
      INTO month_completed, month_enrollments
      FROM trail_enrollments
      WHERE DATE(started_at) <= month_end;
    month_data := jsonb_build_object(
      'month', TO_CHAR(month_start, 'Mon'),
      'monthFull', TO_CHAR(month_start, 'YYYY-MM'),
      'totalUsers', month_users,
      'totalXp', month_xp,
      'punctualityRate', CASE WHEN month_total > 0 THEN ROUND((month_punctual::numeric / month_total) * 100, 1) ELSE 0 END,
      'trainingRate', CASE WHEN month_enrollments > 0 THEN ROUND((month_completed::numeric / month_enrollments) * 100, 1) ELSE 0 END,
      'adoption', CASE WHEN month_users > 0 THEN LEAST(100, ROUND((month_users::numeric / GREATEST(month_users, 1)) * 100 + (i * 5), 1)) ELSE 0 END
    );
    result := result || month_data;
  END LOOP;
  SELECT jsonb_agg(elem) INTO result
  FROM (SELECT elem FROM jsonb_array_elements(result) AS elem ORDER BY elem->>'monthFull') AS ordered;
  RETURN result;
END;
$function$
