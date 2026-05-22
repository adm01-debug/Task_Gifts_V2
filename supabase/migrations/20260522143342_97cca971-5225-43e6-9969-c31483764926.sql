-- Revoke execution from PUBLIC
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;

-- Setting search_path for SECURITY DEFINER functions (matching confirmed signatures)
ALTER FUNCTION public.increment_announcement_views(uuid) SET search_path = public;
ALTER FUNCTION public.cleanup_expired_idempotency_keys() SET search_path = public;
ALTER FUNCTION public.get_department_metrics() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.log_login_attempt(text, inet, text, text, text) SET search_path = public;
ALTER FUNCTION public.process_external_task(uuid) SET search_path = public;
ALTER FUNCTION public.user_has_passkeys(uuid) SET search_path = public;
ALTER FUNCTION public.is_department_manager(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.is_ip_whitelisted(inet) SET search_path = public;
ALTER FUNCTION public.validate_reset_token(uuid) SET search_path = public;
ALTER FUNCTION public.is_country_allowed(character varying) SET search_path = public;
ALTER FUNCTION public.complete_task_score(uuid, task_completion_status) SET search_path = public;
ALTER FUNCTION public.reject_password_reset(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_user_stats_api(text) SET search_path = public;
ALTER FUNCTION public.register_device(uuid, text, inet, text, text, text, text) SET search_path = public;
ALTER FUNCTION public.complete_external_task(text, text, text, jsonb) SET search_path = public;
ALTER FUNCTION public.cleanup_old_security_logs() SET search_path = public;
ALTER FUNCTION public.is_ip_blocked(inet) SET search_path = public;
ALTER FUNCTION public.log_geo_access(inet, character varying, character varying, uuid, boolean, text, text, text) SET search_path = public;
ALTER FUNCTION public.log_ip_access(inet, uuid, text, boolean, text, text) SET search_path = public;
ALTER FUNCTION public.update_certification_statuses() SET search_path = public;
ALTER FUNCTION public.get_2fa_status(uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.validate_api_key(text, text) SET search_path = public;
ALTER FUNCTION public.reset_login_attempts(text) SET search_path = public;
ALTER FUNCTION public.apply_task_penalty(uuid, uuid, text, integer, integer, text, uuid) SET search_path = public;
ALTER FUNCTION public.calculate_enps_score(uuid) SET search_path = public;
ALTER FUNCTION public.get_monthly_trends() SET search_path = public;
ALTER FUNCTION public.get_nine_box_distribution(uuid, text) SET search_path = public;
ALTER FUNCTION public.request_password_reset(uuid) SET search_path = public;
ALTER FUNCTION public.auto_block_ip(inet, text, text, integer) SET search_path = public;
ALTER FUNCTION public.get_executive_metrics() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_challenges() SET search_path = public;
ALTER FUNCTION public.get_leaderboard_api(integer, uuid) SET search_path = public;
ALTER FUNCTION public.get_passkeys_by_email(text) SET search_path = public;
ALTER FUNCTION public.approve_password_reset(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_security_stats(integer) SET search_path = public;
ALTER FUNCTION public.generate_engagement_snapshot(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_quiz_category_stats() SET search_path = public;
ALTER FUNCTION public.check_login_lockout(text) SET search_path = public;

-- Fixed RLS Policies
DROP POLICY IF EXISTS "Admins can manage blocked_ips" ON public.blocked_ips;
CREATE POLICY "Admins can manage blocked_ips" 
ON public.blocked_ips 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'::app_role)) 
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage rate_limit_rules" ON public.rate_limit_rules;
CREATE POLICY "Admins can manage rate_limit_rules" 
ON public.rate_limit_rules 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'::app_role)) 
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
