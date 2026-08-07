-- Function to get executive dashboard metrics
CREATE OR REPLACE FUNCTION public.get_executive_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  total_users integer;
  active_users_today integer;
  active_users_week integer;
  level_5_plus integer;
  total_xp_earned integer;
  total_quests_completed integer;
  total_kudos integer;
  punctual_checkins integer;
  total_checkins integer;
  completed_trails integer;
  total_enrollments integer;
  avg_training_hours numeric;
BEGIN
  -- Get total users
  SELECT COUNT(*) INTO total_users FROM profiles;
  
  -- Get active users today (based on attendance or profile updates)
  SELECT COUNT(DISTINCT user_id) INTO active_users_today 
  FROM attendance_records 
  WHERE DATE(check_in) = CURRENT_DATE;
  
  -- Get active users this week
  SELECT COUNT(DISTINCT user_id) INTO active_users_week 
  FROM attendance_records 
  WHERE check_in >= DATE_TRUNC('week', CURRENT_DATE);
  
  -- Get users level 5+
  SELECT COUNT(*) INTO level_5_plus 
  FROM profiles 
  WHERE level >= 5;
  
  -- Get total XP earned (sum of all XP)
  SELECT COALESCE(SUM(xp), 0) INTO total_xp_earned FROM profiles;
  
  -- Get total quests completed
  SELECT COALESCE(SUM(quests_completed), 0) INTO total_quests_completed FROM profiles;
  
  -- Get total kudos given
  SELECT COUNT(*) INTO total_kudos FROM kudos;
  
  -- Get punctual check-ins this month
  SELECT 
    COUNT(*) FILTER (WHERE is_punctual = true),
    COUNT(*)
  INTO punctual_checkins, total_checkins
  FROM attendance_records
  WHERE check_in >= DATE_TRUNC('month', CURRENT_DATE);
  
  -- Get training completion
  SELECT 
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL),
    COUNT(*)
  INTO completed_trails, total_enrollments
  FROM trail_enrollments;
  
  -- Estimate average training hours (based on completed modules * 15 min avg)
  SELECT COALESCE(
    (SELECT COUNT(*) FROM module_progress WHERE completed_at IS NOT NULL) * 0.25, 
    0
  ) INTO avg_training_hours;
  
  -- Build result JSON
  result := jsonb_build_object(
    'totalUsers', total_users,
    'activeUsersToday', active_users_today,
    'activeUsersWeek', active_users_week,
    'level5Plus', level_5_plus,
    'totalXpEarned', total_xp_earned,
    'totalQuestsCompleted', total_quests_completed,
    'totalKudos', total_kudos,
    'punctualCheckins', punctual_checkins,
    'totalCheckins', total_checkins,
    'completedTrails', completed_trails,
    'totalEnrollments', total_enrollments,
    'avgTrainingHours', avg_training_hours,
    'dau', CASE WHEN total_users > 0 THEN ROUND((active_users_today::numeric / total_users) * 100, 1) ELSE 0 END,
    'wau', CASE WHEN total_users > 0 THEN ROUND((active_users_week::numeric / total_users) * 100, 1) ELSE 0 END,
    'punctualityRate', CASE WHEN total_checkins > 0 THEN ROUND((punctual_checkins::numeric / total_checkins) * 100, 1) ELSE 0 END,
    'trainingCompletionRate', CASE WHEN total_enrollments > 0 THEN ROUND((completed_trails::numeric / total_enrollments) * 100, 1) ELSE 0 END,
    'level5PlusRate', CASE WHEN total_users > 0 THEN ROUND((level_5_plus::numeric / total_users) * 100, 1) ELSE 0 END
  );
  
  RETURN result;
END;
$$;

-- Function to get monthly trend data for the last 6 months
CREATE OR REPLACE FUNCTION public.get_monthly_trends()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  FOR i IN 0..5 LOOP
    month_start := DATE_TRUNC('month', CURRENT_DATE - (i || ' months')::interval)::date;
    month_end := (month_start + INTERVAL '1 month' - INTERVAL '1 day')::date;
    
    -- Users created that month
    SELECT COUNT(*) INTO month_users
    FROM profiles
    WHERE DATE(created_at) <= month_end;
    
    -- XP earned that month (approximation from current totals)
    SELECT COALESCE(SUM(xp), 0) INTO month_xp
    FROM profiles
    WHERE DATE(created_at) <= month_end;
    
    -- Punctuality that month
    SELECT 
      COUNT(*) FILTER (WHERE is_punctual = true),
      COUNT(*)
    INTO month_punctual, month_total
    FROM attendance_records
    WHERE DATE(check_in) >= month_start AND DATE(check_in) <= month_end;
    
    -- Trail completions
    SELECT 
      COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND DATE(completed_at) <= month_end),
      COUNT(*)
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
  
  -- Reverse to get chronological order
  SELECT jsonb_agg(elem) INTO result
  FROM (SELECT elem FROM jsonb_array_elements(result) AS elem ORDER BY elem->>'monthFull') AS ordered;
  
  RETURN result;
END;
$$;

-- Function to get department performance metrics
CREATE OR REPLACE FUNCTION public.get_department_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '[]'::jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(dept_data), '[]'::jsonb) INTO result
  FROM (
    SELECT jsonb_build_object(
      'id', d.id,
      'name', d.name,
      'color', d.color,
      'employeeCount', (SELECT COUNT(*) FROM team_members tm WHERE tm.department_id = d.id),
      'totalXp', COALESCE((
        SELECT SUM(p.xp) 
        FROM team_members tm 
        JOIN profiles p ON p.id = tm.user_id 
        WHERE tm.department_id = d.id
      ), 0),
      'avgLevel', COALESCE((
        SELECT ROUND(AVG(p.level), 1) 
        FROM team_members tm 
        JOIN profiles p ON p.id = tm.user_id 
        WHERE tm.department_id = d.id
      ), 0),
      'punctualityRate', COALESCE((
        SELECT ROUND(
          (COUNT(*) FILTER (WHERE ar.is_punctual = true)::numeric / NULLIF(COUNT(*), 0)) * 100, 
          1
        )
        FROM team_members tm
        JOIN attendance_records ar ON ar.user_id = tm.user_id
        WHERE tm.department_id = d.id
        AND ar.check_in >= DATE_TRUNC('month', CURRENT_DATE)
      ), 0),
      'questsCompleted', COALESCE((
        SELECT SUM(p.quests_completed) 
        FROM team_members tm 
        JOIN profiles p ON p.id = tm.user_id 
        WHERE tm.department_id = d.id
      ), 0),
      'score', COALESCE((
        SELECT ROUND(
          (AVG(p.level) * 10 + 
           (COUNT(*) FILTER (WHERE ar.is_punctual = true)::numeric / NULLIF(COUNT(ar.*), 0)) * 50 +
           AVG(p.quests_completed) * 2), 
          0
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
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_executive_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_trends() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_department_metrics() TO authenticated;