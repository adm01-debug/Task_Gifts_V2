
-- Helper: verificar admin ou service_role
CREATE OR REPLACE FUNCTION public._require_admin()
RETURNS void
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN;
  END IF;
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public._require_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._require_admin() TO authenticated, service_role;

-- Injetar check nas funções sensíveis
CREATE OR REPLACE FUNCTION public.get_executive_metrics()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  total_users integer; active_users_today integer; active_users_week integer;
  level_5_plus integer; total_xp_earned integer; total_quests_completed integer;
  total_kudos integer; punctual_checkins integer; total_checkins integer;
  completed_trails integer; total_enrollments integer; avg_training_hours numeric;
BEGIN
  PERFORM public._require_admin();
  SELECT COUNT(*) INTO total_users FROM profiles;
  SELECT COUNT(DISTINCT user_id) INTO active_users_today FROM attendance_records WHERE DATE(check_in) = CURRENT_DATE;
  SELECT COUNT(DISTINCT user_id) INTO active_users_week FROM attendance_records WHERE check_in >= DATE_TRUNC('week', CURRENT_DATE);
  SELECT COUNT(*) INTO level_5_plus FROM profiles WHERE level >= 5;
  SELECT COALESCE(SUM(xp), 0) INTO total_xp_earned FROM profiles;
  SELECT COALESCE(SUM(quests_completed), 0) INTO total_quests_completed FROM profiles;
  SELECT COUNT(*) INTO total_kudos FROM kudos;
  SELECT COUNT(*) FILTER (WHERE is_punctual = true), COUNT(*) INTO punctual_checkins, total_checkins FROM attendance_records WHERE check_in >= DATE_TRUNC('month', CURRENT_DATE);
  SELECT COUNT(*) FILTER (WHERE completed_at IS NOT NULL), COUNT(*) INTO completed_trails, total_enrollments FROM trail_enrollments;
  SELECT COALESCE((SELECT COUNT(*) FROM module_progress WHERE completed_at IS NOT NULL) * 0.25, 0) INTO avg_training_hours;
  result := jsonb_build_object(
    'totalUsers', total_users, 'activeUsersToday', active_users_today, 'activeUsersWeek', active_users_week,
    'level5Plus', level_5_plus, 'totalXpEarned', total_xp_earned, 'totalQuestsCompleted', total_quests_completed,
    'totalKudos', total_kudos, 'punctualCheckins', punctual_checkins, 'totalCheckins', total_checkins,
    'completedTrails', completed_trails, 'totalEnrollments', total_enrollments, 'avgTrainingHours', avg_training_hours,
    'dau', CASE WHEN total_users > 0 THEN ROUND((active_users_today::numeric / total_users) * 100, 1) ELSE 0 END,
    'wau', CASE WHEN total_users > 0 THEN ROUND((active_users_week::numeric / total_users) * 100, 1) ELSE 0 END,
    'punctualityRate', CASE WHEN total_checkins > 0 THEN ROUND((punctual_checkins::numeric / total_checkins) * 100, 1) ELSE 0 END,
    'trainingCompletionRate', CASE WHEN total_enrollments > 0 THEN ROUND((completed_trails::numeric / total_enrollments) * 100, 1) ELSE 0 END,
    'level5PlusRate', CASE WHEN total_users > 0 THEN ROUND((level_5_plus::numeric / total_users) * 100, 1) ELSE 0 END
  );
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_security_stats(p_hours integer DEFAULT 24)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_result JSONB;
BEGIN
  PERFORM public._require_admin();
  SELECT jsonb_build_object(
    'rate_limit_violations', (SELECT COUNT(*) FROM public.rate_limit_logs WHERE was_blocked = true AND created_at > now() - (p_hours * INTERVAL '1 hour')),
    'blocked_ips', (SELECT COUNT(*) FROM public.blocked_ips WHERE is_permanent = true OR expires_at > now()),
    'failed_logins', (SELECT COUNT(*) FROM public.login_attempts WHERE error_message IS NOT NULL AND created_at > now() - (p_hours * INTERVAL '1 hour')),
    'active_sessions', (SELECT COUNT(*) FROM public.session_logs WHERE is_active = true),
    'unresolved_alerts', (SELECT COUNT(*) FROM public.security_alerts WHERE is_resolved = false),
    'top_blocked_ips', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (SELECT ip_address, violation_count, reason, is_permanent FROM public.blocked_ips ORDER BY violation_count DESC LIMIT 5) t),
    'recent_alerts', (SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (SELECT id, alert_type, severity, title, created_at FROM public.security_alerts WHERE is_resolved = false ORDER BY created_at DESC LIMIT 10) t)
  ) INTO v_result;
  RETURN v_result;
END;
$function$;
