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
$function$
