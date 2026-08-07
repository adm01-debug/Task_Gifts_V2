
-- Fase 9: Proteção PII + Hardening de EXECUTE em SECURITY DEFINER

-- 1) View pública sem PII (sem cpf, phone, personal_email, birth_date, hire_date, employee_id, contract_type, email)
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT
  id, display_name, avatar_url, level, xp, coins, streak, best_streak,
  quests_completed, status, created_at, updated_at, last_access_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated, anon;

-- 2) Revogar EXECUTE de PUBLIC em funções administrativas sensíveis
REVOKE EXECUTE ON FUNCTION public.approve_password_reset(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reject_password_reset(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_block_ip(inet, text, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_security_logs() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_security_logs(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_idempotency_keys() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_challenges() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_security_stats(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_certification_statuses() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_ip_access(inet, uuid, text, boolean, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_geo_access(inet, character varying, character varying, uuid, boolean, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_api_key(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_external_task(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_external_task(text, text, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_task_penalty(uuid, uuid, text, integer, integer, text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_engagement_snapshot(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.register_device(uuid, text, inet, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_login_attempt(text, inet, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_nine_box_distribution(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_department_metrics() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_monthly_trends() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_executive_metrics() FROM PUBLIC;

-- 3) Conceder EXECUTE explicitamente ao service_role (edge functions)
GRANT EXECUTE ON FUNCTION public.approve_password_reset(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reject_password_reset(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_block_ip(inet, text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_security_logs() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_security_logs(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_idempotency_keys() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_challenges() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_security_stats(integer) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.update_certification_statuses() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_ip_access(inet, uuid, text, boolean, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_geo_access(inet, character varying, character varying, uuid, boolean, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_api_key(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_external_task(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_external_task(text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_task_penalty(uuid, uuid, text, integer, integer, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_engagement_snapshot(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.register_device(uuid, text, inet, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_login_attempt(text, inet, text, text, text) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.get_nine_box_distribution(uuid, text) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.get_department_metrics() TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_trends() TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.get_executive_metrics() TO service_role, authenticated;
