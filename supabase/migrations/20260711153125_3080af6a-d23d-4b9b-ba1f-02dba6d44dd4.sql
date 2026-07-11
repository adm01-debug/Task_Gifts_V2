
-- 1) Fix RLS "true" policies
DROP POLICY IF EXISTS "Authenticated users can insert telemetry" ON public.query_telemetry;
CREATE POLICY "Users can insert their own telemetry"
  ON public.query_telemetry
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can do everything on idempotency" ON public.webhook_idempotency;
CREATE POLICY "Service role manages idempotency"
  ON public.webhook_idempotency
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2) Revoke EXECUTE from anon/authenticated on internal-only SECURITY DEFINER functions
DO $$
DECLARE
  fn text;
  internal_fns text[] := ARRAY[
    'cleanup_old_security_logs()',
    'cleanup_old_security_logs(integer)',
    'cleanup_expired_idempotency_keys()',
    'cleanup_expired_challenges()',
    'update_certification_statuses()',
    'auto_block_ip(inet, text, text, integer)',
    'log_geo_access(inet, character varying, character varying, uuid, boolean, text, text, text)',
    'log_ip_access(inet, uuid, text, boolean, text, text)',
    'is_ip_blocked(inet)',
    'is_ip_whitelisted(inet)',
    'is_country_allowed(character varying)',
    'validate_api_key(text, text)',
    'process_external_task(uuid)',
    'complete_external_task(text, text, text, jsonb)',
    'get_passkeys_by_email(text)',
    'get_user_stats_api(text)',
    'get_leaderboard_api(integer, uuid)',
    'generate_engagement_snapshot(uuid, text)',
    'update_notification_prefs_updated_at()',
    'update_updated_at_column()',
    'handle_updated_at()',
    'handle_new_user()'
  ];
BEGIN
  FOREACH fn IN ARRAY internal_fns LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'Function public.% not found, skipping', fn;
    END;
  END LOOP;
END $$;
