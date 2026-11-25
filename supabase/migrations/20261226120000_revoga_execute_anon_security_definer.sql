-- Hardening de permissões em produção.
--
-- Motivo: a auditoria de 25/11 mostrou que `public.exec_sql(text)` era SECURITY
-- DEFINER sem search_path travado e executável por `anon` (GRANT herdado de
-- PUBLIC). Com a anon key publicada no bundle, qualquer pessoa na internet
-- rodava SQL arbitrário como `postgres` — confirmado por probe HTTP:
--   POST /rest/v1/rpc/exec_sql {"query":"select current_user, ..."}
--   -> 200 [{"role_atual":"postgres","session_user":"authenticator"}]
--   POST /rest/v1/rpc/exec_sql {"query":"select count(*) from auth.users"}
--   -> 200 [{"usuarios":8,"com_senha":7}]
-- Além dele, 214 outras funções SECURITY DEFINER estavam executáveis por `anon`.
--
-- O que esta migration faz:
--   1. fecha `exec_sql` (nenhum código do repositório a usa);
--   2. revoga EXECUTE de PUBLIC/anon em todas as funções SECURITY DEFINER do
--      schema public, devolvendo acesso apenas a quem o app realmente chama;
--   3. mantém em `anon` só o necessário para o fluxo pré-login e para as
--      funções avaliadas por policies de RLS (has_role/is_org_admin/
--      is_department_manager — sem elas o próprio login por e-mail quebra);
--   4. revoga a leitura anônima da view webhook_delivery_stats_24h, que expõe
--      a URL dos webhooks (subscription_url) e não é usada pelo front.

-- 1. exec_sql: função morta, execução de SQL arbitrário como postgres.
--    `to_regprocedure` porque nenhuma migration versionada cria a função: em banco
--    reconstruído ela não existe e o REVOKE direto abortaria a migration.
DO $exec_sql_acl$
BEGIN
  IF to_regprocedure('public.exec_sql(text)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role';
  END IF;
END
$exec_sql_acl$;

-- 4. view de webhooks: o front usa a RPC get_webhook_delivery_stats_24h, não a view
REVOKE SELECT ON public.webhook_delivery_stats_24h FROM anon, authenticated;
GRANT SELECT ON public.webhook_delivery_stats_24h TO service_role;

-- 5. reset_login_attempts é chamada depois do signInWithPassword dar certo
--    (src/pages/Auth.tsx:183), então a sessão já existe e o papel é authenticated.
--    Com acesso anônimo ela zerava o contador de tentativas e anulava o lockout.
REVOKE EXECUTE ON FUNCTION public.reset_login_attempts(text) FROM anon;

-- 2 + 3. varredura de todas as funções SECURITY DEFINER do schema public
DO $hardening$
DECLARE
  r record;
  -- RPCs efetivamente chamadas pelo front (src/**) ou pelas edge functions.
  app_calls text[] := ARRAY[
    'acknowledge_security_alert','add_coins','add_xp','admin_profile_directory',
    'advance_board_trail','answer_lightning_question','apply_campaign_import','apply_task_penalty',
    'approve_password_reset','assign_engagement_questions','award_campaign_team_split',
    'bulk_rotate_webhook_secrets','calculate_enps_score','cancel_auction','cancel_webhook_secret_rotation',
    'check_login_lockout','claim_card_set_reward','claim_push_outbox','cleanup_old_security_logs',
    'climate_recalculate_pillar_scores','climate_submit_response','climate_survey_enps','close_auction',
    'complete_task_score','create_auction_draft','create_external_api_key','create_prediction_market',
    'deal_boss_damage','delete_board_trail','delete_external_api_key','finish_lightning_round',
    'finish_memory_session','generate_action_plan_from_factor','generate_action_plan_from_nr1_category',
    'generate_action_plan_from_opinion','generate_engagement_snapshot','generate_executive_monthly_report',
    'get_2fa_status','get_account_devices','get_active_engagement_cycle','get_alert_heatmap_30d',
    'get_alert_mttr_by_type_7d','get_auction_summary','get_board_challenge_stats','get_board_trail_leaderboard',
    'get_boss_battle_leaderboard','get_burn_rate','get_card_set_rewards','get_daily_wager',
    'get_department_metrics','get_department_war_feed','get_department_war_standings',
    'get_engagement_cycle_progress','get_engagement_factor_scores','get_engagement_nps',
    'get_engagement_nps_history','get_engagement_overview','get_engagement_pillar_benchmark',
    'get_engagement_pillar_correlations','get_engagement_pillar_scores','get_error_budget_30d',
    'get_executive_metrics','get_incident_metrics','get_lucky_wheel_prizes_display','get_lucky_wheel_status',
    'get_memory_leaderboard','get_monthly_trends','get_my_profile_private','get_nine_box_distribution',
    'get_nr1_risk_matrix','get_nr1_summary','get_opinion_feed','get_or_create_bingo_card',
    'get_passkeys_by_email','get_prediction_odds_history','get_prediction_oracle_aggregates',
    'get_push_outbox_health','get_push_outbox_health_trend','get_quiz_category_stats','get_quiz_lifeline',
    'get_quiz_play_set','get_security_digest_history','get_security_stats','get_sequence_play_set',
    'get_sequence_procedure_stats','get_tournament_bracket','get_user_department_id','get_wager_leaderboard',
    'get_webhook_delivery_hourly_24h','get_webhook_delivery_stats_1h','get_webhook_delivery_stats_24h',
    'get_webhook_executive_metrics_7d','grade_quiz_answer','grant_scratch_card','has_role',
    'increment_announcement_views','increment_push_failures','increment_quests_completed','increment_streak',
    'is_ip_whitelisted','join_tournament','list_external_api_keys','list_stuck_board_players',
    'list_tournaments','list_wager_questions','log_ip_access','log_login_attempt','log_runbook_step',
    'open_card_pack','place_auction_bid','place_prediction_stake','promote_webhook_secret',
    'propose_card_trade','publish_auction','quiz_fifty_fifty','recalc_campaign_progress',
    'recalc_campaign_teams','register_device','reject_password_reset','report_tournament_match',
    'request_password_reset','requeue_push_outbox','reset_login_attempts','reset_push_failures',
    'resolve_board_challenge','respond_card_trade','respond_to_opinion','reveal_scratch_card',
    'revert_campaign_import','revert_campaign_team_split','review_purchase','revoke_device_by_fingerprint',
    'revoke_push_device','rotate_external_api_secret','rotate_webhook_secret','run_boss_win_rate_alerts',
    'save_board_trail','save_sequence_procedure','save_wager_question','set_external_api_key_active',
    'set_opinion_status','settle_boss_battle','settle_department_war','settle_prediction_market',
    'spend_coins','spin_lucky_wheel','start_lightning_round','start_memory_session','start_tournament',
    'submit_daily_wager','submit_engagement_answer','submit_sequence_attempt','sync_bingo_card',
    'sync_department_war_headcount','toggle_opinion_support','transition_prediction_market',
    'unblock_board_players','user_has_passkeys','user_wants_in_app_notification',
    'user_wants_push_notification','verify_certificate'
  ];
  -- Funções que precisam continuar executáveis por `anon`: fluxo pré-login e
  -- helpers avaliados por policies de RLS (anon também passa por elas).
  anon_ok text[] := ARRAY[
    'check_login_lockout','log_login_attempt','request_password_reset',
    'is_ip_whitelisted','is_ip_blocked','log_ip_access','log_geo_access','is_country_allowed',
    'validate_api_key','verify_certificate','generate_certificate_code','user_has_passkeys',
    'has_role','is_org_admin','is_org_member','is_department_manager','can_handle_opinion',
    'get_user_department_id'
  ];
    -- Helpers avaliados por policies de RLS que qualquer papel (inclusive anon) passa:
    -- precisam de EXECUTE para authenticated tambem, senao org_members/team_members quebram.
    helpers_rls text[] := ARRAY['has_role','is_department_manager'];
    -- Helpers de policy/default de coluna que só fazem sentido com sessão:
    -- authenticated mantem, anon perde (evita oráculo de vínculo sem login).
    helpers_sessao text[] := ARRAY[
      'is_org_admin','is_org_member','can_handle_opinion','generate_certificate_code'
    ];
    -- RPCs chamadas somente por Edge Function com service role: qualquer grant a
    -- authenticated deixa a conta ler/consumir fila interna de terceiros.
    internal_only text[] := ARRAY[
      'claim_push_outbox','increment_push_failures','reset_push_failures',
      'user_wants_push_notification','get_passkeys_by_email','register_device'
    ];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.prorettype NOT IN ('trigger'::regtype, 'event_trigger'::regtype)
      AND p.proname <> 'exec_sql'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', r.sig);

    IF r.proname = ANY(internal_only) THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated', r.sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
    ELSIF r.proname = ANY(app_calls) THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
    ELSE
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated', r.sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
    END IF;

    IF r.proname = ANY(anon_ok) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', r.sig);
    END IF;

        -- Policies de RLS e DEFAULT de coluna sao avaliados com o privilegio de quem
        -- consulta/insere: sem EXECUTE para authenticated a query falha mesmo que o
        -- front nunca chame a funcao por RPC.
        IF r.proname = ANY(helpers_rls) OR r.proname = ANY(helpers_sessao) THEN
          EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
        END IF;

        IF r.proname = ANY(helpers_sessao) THEN
          EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
        END IF;
  END LOOP;
END
$hardening$;