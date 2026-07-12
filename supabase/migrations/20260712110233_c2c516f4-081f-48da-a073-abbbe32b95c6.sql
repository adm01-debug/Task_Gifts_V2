
-- Helper for future manager/admin checks
CREATE OR REPLACE FUNCTION public._require_manager_or_admin()
RETURNS void
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN;
  END IF;
  IF auth.uid() IS NULL
     OR NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public._require_manager_or_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._require_manager_or_admin() TO service_role;

-- get_department_metrics: admin-only
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
$function$;

-- get_monthly_trends: admin-only
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
$function$;

-- get_nine_box_distribution: admin-only
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
$function$;

-- generate_engagement_snapshot: admin-only
CREATE OR REPLACE FUNCTION public.generate_engagement_snapshot(p_department_id uuid DEFAULT NULL::uuid, p_period_type text DEFAULT 'weekly'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_snapshot_id UUID;
  v_enps NUMERIC;
  v_mood NUMERIC;
  v_participation NUMERIC;
  v_active INTEGER;
  v_total INTEGER;
  v_quests INTEGER;
  v_training NUMERIC;
  v_punctuality NUMERIC;
  v_kudos INTEGER;
BEGIN
  PERFORM public._require_admin();
  SELECT calculate_enps_score(es.id) INTO v_enps
  FROM enps_surveys es
  WHERE es.status = 'closed'
  AND (p_department_id IS NULL OR es.department_id = p_department_id)
  ORDER BY es.ends_at DESC
  LIMIT 1;
  SELECT AVG(mood_score) INTO v_mood
  FROM mood_entries me
  LEFT JOIN team_members tm ON tm.user_id = me.user_id
  WHERE me.entry_date >= CURRENT_DATE - INTERVAL '7 days'
  AND (p_department_id IS NULL OR tm.department_id = p_department_id);
  SELECT COUNT(DISTINCT ar.user_id), COUNT(DISTINCT p.id)
  INTO v_active, v_total
  FROM profiles p
  LEFT JOIN team_members tm ON tm.user_id = p.id
  LEFT JOIN attendance_records ar ON ar.user_id = p.id AND ar.check_in >= CURRENT_DATE - INTERVAL '7 days'
  WHERE p_department_id IS NULL OR tm.department_id = p_department_id;
  v_participation := CASE WHEN v_total > 0 THEN ROUND((v_active::NUMERIC / v_total) * 100, 2) ELSE 0 END;
  SELECT COALESCE(SUM(p.quests_completed), 0) INTO v_quests
  FROM profiles p
  LEFT JOIN team_members tm ON tm.user_id = p.id
  WHERE p_department_id IS NULL OR tm.department_id = p_department_id;
  SELECT ROUND(
    (COUNT(*) FILTER (WHERE te.completed_at IS NOT NULL)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2
  ) INTO v_training
  FROM trail_enrollments te
  LEFT JOIN team_members tm ON tm.user_id = te.user_id
  WHERE p_department_id IS NULL OR tm.department_id = p_department_id;
  SELECT ROUND(
    (COUNT(*) FILTER (WHERE ar.is_punctual = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2
  ) INTO v_punctuality
  FROM attendance_records ar
  LEFT JOIN team_members tm ON tm.user_id = ar.user_id
  WHERE ar.check_in >= CURRENT_DATE - INTERVAL '30 days'
  AND (p_department_id IS NULL OR tm.department_id = p_department_id);
  SELECT COUNT(*) INTO v_kudos
  FROM kudos k
  LEFT JOIN team_members tm ON tm.user_id = k.to_user_id
  WHERE k.created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND (p_department_id IS NULL OR tm.department_id = p_department_id);
  INSERT INTO engagement_snapshots (
    department_id, period_type, enps_score, mood_avg, participation_rate,
    active_users, total_users, quests_completed, training_completion_rate,
    punctuality_rate, kudos_given
  ) VALUES (
    p_department_id, p_period_type, v_enps, v_mood, v_participation,
    v_active, v_total, v_quests, v_training, v_punctuality, v_kudos
  )
  RETURNING id INTO v_snapshot_id;
  RETURN v_snapshot_id;
END;
$function$;

-- get_quiz_category_stats: admin-only
CREATE OR REPLACE FUNCTION public.get_quiz_category_stats()
 RETURNS TABLE(category text, total_answers bigint, correct_answers bigint, accuracy_rate numeric, avg_time_ms numeric, question_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public._require_admin();
  RETURN QUERY
  SELECT
    COALESCE(qq.category, 'Sem categoria') as category,
    COUNT(qa.id) as total_answers,
    COUNT(qa.id) FILTER (WHERE qa.is_correct = true) as correct_answers,
    ROUND(
      (COUNT(qa.id) FILTER (WHERE qa.is_correct = true)::NUMERIC / NULLIF(COUNT(qa.id), 0)) * 100, 1
    ) as accuracy_rate,
    ROUND(AVG(qa.time_spent_ms), 0) as avg_time_ms,
    COUNT(DISTINCT qq.id) as question_count
  FROM quiz_questions qq
  LEFT JOIN quiz_answers qa ON qa.question_id = qq.id
  WHERE qq.is_active = true
  GROUP BY qq.category
  ORDER BY total_answers DESC;
END;
$function$;
