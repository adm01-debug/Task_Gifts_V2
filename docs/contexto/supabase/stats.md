# Métricas (voláteis — mudam sem alteração de schema)

Valores aproximados de propósito, para não gerar commits a cada coleta. Fora de `snapshot.json`; o bruto está em `stats.json`.

## Banco

| métrica | valor |
|---|---|
| tamanho | 46.3 MB |
| schema public | 11.8 MB |
| schema _internal | 32.0 KB |


## Tabelas (ordenadas por tamanho)

| tabela | linhas (~) | total | heap | índices | linhas mortas (~) | seq scans (~) | idx scans (~) | último autovacuum |
|---|---|---|---|---|---|---|---|---|
| public.login_attempts | ~400 | 376.0 KB | 120.0 KB | 224.0 KB | 1 | ~490 | ~4.1k |  |
| public.push_outbox_health_snapshots | ~1.4k | 344.0 KB | 152.0 KB | 152.0 KB | 0 | ~40 | ~2.7k | 2026-11-26 |
| public.push_outbox | ~80 | 248.0 KB | 104.0 KB | 104.0 KB | ~20 | ~14k | ~51.5k | 2026-11-27 |
| public.notifications | ~30 | 184.0 KB | 32.0 KB | 120.0 KB | ~20 | ~670 | ~760 |  |
| public.profiles | 6 | 184.0 KB | 8.0 KB | 168.0 KB | ~50 | ~36.8k | ~40 |  |
| public.security_alerts | 0 | 184.0 KB | 8.0 KB | 168.0 KB | ~10 | ~7.2k | 0 |  |
| public.sales_campaigns | 5 | 128.0 KB | 8.0 KB | 112.0 KB | 6 | ~400 | 0 |  |
| public.announcements | 5 | 112.0 KB | 8.0 KB | 96.0 KB | 1 | ~530 | 3 |  |
| public.auction_bids | 9 | 112.0 KB | 8.0 KB | 96.0 KB | 9 | ~50 | 0 |  |
| public.department_war_contributions | ~10 | 112.0 KB | 8.0 KB | 96.0 KB | 0 | ~40 | 3 |  |
| public.engagement_question_pool | 6 | 112.0 KB | 8.0 KB | 96.0 KB | ~10 | ~30 | ~50 |  |
| public.lucky_wheel_spins | 2 | 112.0 KB | 8.0 KB | 96.0 KB | 0 | ~220 | ~30 |  |
| public.board_player_states | 1 | 104.0 KB | 8.0 KB | 88.0 KB | 3 | ~220 | ~20 |  |
| public.engagement_answers | 0 | 104.0 KB | 8.0 KB | 88.0 KB | 5 | ~50 | ~10 |  |
| public.achievements | ~20 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~280 | 3 |  |
| public.audit_logs | 3 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~470 | ~540 |  |
| public.climate_pillar_scores | 0 | 96.0 KB | 8.0 KB | 80.0 KB | ~20 | ~50 | ~20 |  |
| public.departments | 4 | 96.0 KB | 8.0 KB | 80.0 KB | 6 | ~540 | 2 |  |
| public.learning_trails | 3 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~420 | 1 |  |
| public.notification_preferences | 0 | 96.0 KB | 32.0 KB | 32.0 KB | 8 | ~290 | ~360 |  |
| public.password_reset_requests | 0 | 96.0 KB | 8.0 KB | 80.0 KB | ~20 | ~140 | 3 |  |
| public.scratch_cards | 8 | 96.0 KB | 8.0 KB | 80.0 KB | 9 | ~60 | ~20 |  |
| public.tournament_participants | 4 | 96.0 KB | 8.0 KB | 80.0 KB | 2 | ~40 | ~20 |  |
| public.wager_entries | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 2 | ~40 | 0 |  |
| public.engagement_question_assignments | ~20 | 88.0 KB | 8.0 KB | 80.0 KB | ~20 | ~80 | ~30 |  |
| public.quiz_answers | 5 | 88.0 KB | 8.0 KB | 80.0 KB | 0 | ~10 | 0 |  |
| public.bingo_cards | 1 | 80.0 KB | 8.0 KB | 48.0 KB | 0 | ~30 | 6 |  |
| public.board_moves | 3 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~30 | 6 |  |
| public.card_definitions | ~10 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~20 | ~30 |  |
| public.card_packs | 6 | 80.0 KB | 8.0 KB | 64.0 KB | 1 | ~40 | 3 |  |
| public.climate_question_answers | 0 | 80.0 KB | 8.0 KB | 48.0 KB | ~10 | ~40 | ~10 | 2026-11-24 |
| public.climate_surveys | 0 | 80.0 KB | 8.0 KB | 64.0 KB | ~10 | ~560 | 1 |  |
| public.league_history | 2 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~120 | 0 |  |
| public.leagues | 6 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~920 | ~10 |  |
| public.level_configs | ~20 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~10 | ~20 |  |
| public.lightning_quiz_sessions | 1 | 80.0 KB | 8.0 KB | 64.0 KB | 1 | ~60 | 6 |  |
| public.lucky_wheel_payout_snapshots | ~80 | 80.0 KB | 16.0 KB | 32.0 KB | 0 | ~160 | ~290 |  |
| public.new_device_alerts | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | 7 | 0 |  |
| public.nr1_factor_mappings | ~20 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~10 | ~20 |  |
| public.shop_purchases | 1 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~70 | 0 |  |
| public.tournament_matches | 3 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~10 | 2 |  |
| public.user_devices | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~20 | 0 |  |
| public.action_plans | 0 | 72.0 KB | 0 B | 64.0 KB | 0 | ~20 | 0 |  |
| public.climate_survey_responses | 0 | 72.0 KB | 8.0 KB | 64.0 KB | ~20 | ~200 | ~50 |  |
| public.ai_coach_messages | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 2 | ~690 | ~10 |  |
| public.auction_admin_events | 3 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~30 | 1 |  |
| public.auctions | 3 | 64.0 KB | 8.0 KB | 48.0 KB | 6 | ~25.4k | ~10 |  |
| public.board_tiles | ~20 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~20 | ~10 |  |
| public.department_war_metrics | 4 | 64.0 KB | 8.0 KB | 48.0 KB | 1 | 9 | 2 |  |
| public.department_wars | 1 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~40 | ~30 |  |
| public.engagement_cycles | 1 | 64.0 KB | 8.0 KB | 48.0 KB | 1 | ~50 | ~40 |  |
| public.engagement_factors | ~30 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~30 | ~30 |  |
| public.executive_monthly_reports | 2 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | 6 | 2 |  |
| public.lucky_wheel_prize_audit | ~10 | 64.0 KB | 8.0 KB | 48.0 KB | ~20 | ~30 | 8 |  |
| public.memory_sessions | 1 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~30 | 5 |  |
| public.prediction_stakes | 0 | 64.0 KB | 0 B | 56.0 KB | 0 | ~30 | 0 |  |
| public.quiz_questions | ~10 | 64.0 KB | 8.0 KB | 48.0 KB | ~10 | ~100 | 0 |  |
| public.quiz_scores | 1 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~30 | 0 |  |
| public.sequence_steps | ~20 | 64.0 KB | 8.0 KB | 48.0 KB | 4 | ~20 | 8 |  |
| public.wager_questions | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 9 | ~50 | 1 |  |
| public.boss_battle_damage | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~30 | 0 |  |
| public.department_war_departments | 4 | 56.0 KB | 8.0 KB | 48.0 KB | 0 | 7 | 5 |  |
| public.development_plans | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~60 | 0 |  |
| public.module_progress | 1 | 56.0 KB | 8.0 KB | 48.0 KB | 1 | ~390 | ~10 |  |
| public.rate_limit_logs | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~240 | 0 |  |
| public.saved_filters | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~30 | 0 |  |
| public.sequence_attempts | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~30 | 0 |  |
| public.team_members | 0 | 56.0 KB | 8.0 KB | 48.0 KB | 1 | ~60 | 6 |  |
| public.trail_enrollments | 1 | 56.0 KB | 8.0 KB | 48.0 KB | 1 | ~380 | ~10 |  |
| public.user_achievements | ~10 | 56.0 KB | 8.0 KB | 48.0 KB | 0 | ~32.8k | ~30 |  |
| public.user_avatar_config | 0 | 56.0 KB | 0 B | 56.0 KB | 0 | ~30 | 0 |  |
| public.user_cards | ~10 | 56.0 KB | 8.0 KB | 48.0 KB | 3 | ~40 | ~10 |  |
| public.user_leagues | 2 | 56.0 KB | 8.0 KB | 48.0 KB | ~10 | ~430 | 5 |  |
| public.bingo_board_tasks | ~20 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 7 | 3 |  |
| public.blocked_ips | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~240 | 0 |  |
| public.campaign_result_rows | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~30 | 1 |  |
| public.campaign_team_split_entries | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~30 | 1 |  |
| public.campaign_teams | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~30 | 1 |  |
| public.climate_survey_questions | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~30 | ~150 | ~90 |  |
| public.feedback_cycles | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 1 | ~40 | 0 |  |
| public.feedback_requests | 8 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~10 | 0 |  |
| public.geo_access_logs | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~30 | 0 |  |
| public.goals | 2 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~520 | 3 |  |
| public.ip_access_logs | 3 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | 0 |  |
| public.key_results | 7 | 48.0 KB | 8.0 KB | 32.0 KB | 3 | 8 | 0 |  |
| public.kudos | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~260 | 0 |  |
| public.lightning_quiz_questions | ~20 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 2 |  |
| public.lucky_wheel_prizes | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~110 | ~40 |  |
| public.memory_pairs | ~20 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | 6 | 3 |  |
| public.nr1_risk_categories | 8 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | 9 |  |
| public.onboarding_progress | 3 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~370 | 1 |  |
| public.opinions | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~10 | 1 |  |
| public.postmortems | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~40 | 0 |  |
| public.pulse_responses | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~80 | 0 |  |
| public.pulse_surveys | 2 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~200 | 0 |  |
| public.purchase_approvals | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 0 |  |
| public.push_subscriptions | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~190 | 1 |  |
| public.query_telemetry | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~130 | 0 |  |
| public.quiz_options | ~50 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~70 | 2 |  |
| public.sla_targets | 8 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | 8 |  |
| public.task_scores | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~32.8k | 0 |  |
| public.tournaments | 2 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~90 | ~20 |  |
| public.trail_modules | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~10 | ~10 |  |
| public.user_challenges | 9 | 48.0 KB | 8.0 KB | 32.0 KB | 9 | ~420 | 0 |  |
| public.ai_course_jobs | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~40 | 1 |  |
| public.bitrix24_sync_mappings | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | 6 | 0 |  |
| public.card_set_claims | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~30 | 3 |  |
| public.development_plan_actions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.engagement_action_playbooks | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | 8 | 1 |  |
| public.enps_responses | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~30 | 0 |  |
| public.enps_surveys | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~380 | 0 |  |
| public.entity_versions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~30 | 0 |  |
| public.external_tasks | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | 8 | 0 |  |
| public.geo_settings | 1 | 40.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | 0 |  |
| public.ip_whitelist | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~1.2k | 0 |  |
| public.lucky_wheel_whatif_snapshots | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~30 | 0 |  |
| public.nine_box_evaluations | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~60 | 0 |  |
| public.org_members | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~570 | 1 |  |
| public.postmortem_actions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~150 | 0 |  |
| public.push_notification_logs | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.runbook_executions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~40 | 0 |  |
| public.user_certifications | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~250 | ~20 |  |
| public.user_combos | 7 | 40.0 KB | 8.0 KB | 32.0 KB | 1 | ~140 | ~320 |  |
| public.user_roles | 1 | 40.0 KB | 8.0 KB | 32.0 KB | ~10 | ~3.2k | ~20 |  |
| public.wager_integrity_reviews | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | 0 |  |
| public.webhook_idempotency | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~1.4k | 0 |  |
| _internal.dispatch_config | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 2 | 7 | ~14.3k |  |
| public.bingo_boards | 1 | 32.0 KB | 8.0 KB | 16.0 KB | 1 | ~10 | ~30 |  |
| public.bingo_marks | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 2 |  |
| public.board_trails | 1 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~30 | ~20 |  |
| public.boss_battle_rewards | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.boss_battles | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~120 | 0 |  |
| public.boss_win_rate_goals | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~120 | 0 |  |
| public.campaign_participants | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~40 | 0 |  |
| public.campaign_progress_events | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.campaign_team_members | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~30 | 1 |  |
| public.card_trades | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~140 | 2 |  |
| public.certifications | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~50 | 0 |  |
| public.climate_benchmarks | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 8 | 0 |  |
| public.cron_job_watch_baseline | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 6 | ~10 | ~400 |  |
| public.custom_quests | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~380 | 0 |  |
| public.department_war_results | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 9 | 1 |  |
| public.direct_duels | 1 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~30 | 0 |  |
| public.engagement_snapshots | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.feedback_questions | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 1 |  |
| public.feedback_results | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.geo_allowed_countries | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~30 | 0 |  |
| public.geo_blocking_rules | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~30 | 0 |  |
| public.goal_templates | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 5 | ~30 | ~20 |  |
| public.goal_updates | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.lightning_quiz_answers | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~40 | 2 |  |
| public.lucky_wheel_settings | 1 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~110 | 1 |  |
| public.memory_decks | 2 | 32.0 KB | 8.0 KB | 16.0 KB | 1 | ~30 | ~20 |  |
| public.mentorship_missions | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 8 | ~10 | 0 |  |
| public.org_theme_history | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 6 | 1 |  |
| public.organizations | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~360 | 2 |  |
| public.pdi_templates | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 4 | ~10 | 2 |  |
| public.permissions | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.role_permissions | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.scratch_card_prizes | 7 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~30 | 4 |  |
| public.sequence_procedures | 3 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~30 | ~20 |  |
| public.session_logs | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~230 | 0 |  |
| public.shop_promotions | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.shop_rewards | ~10 | 32.0 KB | 8.0 KB | 16.0 KB | 1 | ~30 | 3 |  |
| public.trail_prerequisites | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~20 | 0 |  |
| public.user_competency_assessments | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.user_demographic_values | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.wager_integrity_review_events | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~50 | 1 |  |
| public.webauthn_challenges | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~2.9k | 0 |  |
| public.webauthn_credentials | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~10 | ~20 |  |
| public.webhook_subscriptions | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~590 | 0 |  |
| public.weekly_challenges | 5 | 32.0 KB | 8.0 KB | 16.0 KB | 1 | ~810 | 0 |  |
| public.action_plan_items | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 8 | 0 |  |
| public.action_plan_updates | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 8 | 0 |  |
| public.activity_reactions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.announcement_reactions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~70 | 0 |  |
| public.api_request_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~6.5k | 0 |  |
| public.attendance_records | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~810 | 0 |  |
| public.bitrix24_tokens | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 9 | 0 |  |
| public.bitrix24_webhook_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.campaign_result_imports | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 1 |  |
| public.campaign_team_split_batches | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | 2 |  |
| public.celebrations | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~850 | 0 |  |
| public.checkins | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.competencies | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.custom_badges | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 6 | 0 |  |
| public.custom_ranks | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 7 | 0 |  |
| public.custom_titles | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 7 | 0 |  |
| public.department_missions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~770 | 0 |  |
| public.department_rankings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.external_api_keys | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 1 |  |
| public.feedback_evaluations | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.feedback_responses | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.gamification_themes | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 1 |  |
| public.lucky_wheel_settings_audit | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.mentorship_mission_progress | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | 8 | 0 |  |
| public.mentorship_pairs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.mood_entries | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~780 | 0 |  |
| public.notification_templates | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 9 | 0 |  |
| public.opinion_responses | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 5 | 0 |  |
| public.opinion_supports | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.opinion_tags | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 5 | 0 |  |
| public.pdi_checkins | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.pdi_mentors | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 9 | 0 |  |
| public.position_competencies | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.position_task_templates | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 8 | 0 |  |
| public.positions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10 | 0 |  |
| public.prediction_admin_events | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 1 |  |
| public.prediction_markets | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~33.8k | 0 |  |
| public.prediction_options | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 6 | 1 |  |
| public.push_sync_events | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 9 |  |
| public.quest_assignments | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~140 | 0 |  |
| public.quest_steps | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 6 | 0 |  |
| public.roles | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.seasonal_challenges | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 5 | 0 |  |
| public.task_penalties | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 5 | 0 |  |
| public.user_avatar_items | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.user_mission_progress | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | 7 | 2 |  |
| public.user_permission_groups | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~10 | 0 |  |
| public.user_positions | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~32.8k | 2 |  |
| public.user_seasonal_progress | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | 8 | 0 |  |
| public.user_titles | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | 6 | 0 |  |
| public.user_two_factor | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~280 | 0 |  |
| public.wager_budget_settings | 1 | 24.0 KB | 8.0 KB | 16.0 KB | 0 | ~30 | 1 |  |
| public.webhook_delivery_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~6.7k | 0 |  |
| public.activity_comments | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.announcement_reads | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~70 | 0 |  |
| public.attendance_settings | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~370 | 0 |  |
| public.attendance_streaks | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~800 | 0 |  |
| public.avatar_items | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~160 | 0 |  |
| public.checkin_templates | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 4 | 0 |  |
| public.demographic_attributes | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 0 |  |
| public.kudos_badges | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.mentorship_requests | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 6 | 0 |  |
| public.penalty_rules | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 3 | 0 |  |
| public.permission_groups | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 9 | 0 |  |
| public.rate_limit_rules | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | 4 | 0 |  |
| public.seasonal_events | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~380 | 0 |  |


## Índices nunca usados (candidatos a remoção; ignore PK/UNIQUE)

_nenhum_


## Storage

_nenhum_


## Auth (agregados)

| métrica | valor |
|---|---|
| usuários (~) | 8 |
| confirmados (~) | 8 |
| criados últimos 30d (~) | 1 |

| provider | usuários (~) |
|---|---|
| email | 7 |
| google | 1 |


## Consultas mais custosas (pg_stat_statements, desde o último reset)
| role | chamadas (~) | total ms (~) | média ms | query |
|---|---|---|---|---|
| postgres | ~153.3k | ~1M | 6.84 | `SELECT net.http_post(url:=$1,headers:=$2::jsonb,body:=$3::jsonb)` |
| postgres | ~25.3k | ~291.9k | 11.53 | `SELECT public.close_expired_auctions()` |
| authenticator | ~710 | ~275.7k | 388.26 | `SELECT name FROM pg_timezone_names` |
| postgres | ~25.3k | ~250.1k | 9.87 | `SELECT public.auto_lock_prediction_markets()` |
| postgres | ~330 | ~184.6k | 552.66 | `SELECT e.name, n.nspname AS schema, e.default_version, x.extversion AS installed_version, e.comment, ev.schema AS default_version_schema FROM pg_available_extensions e LEFT JOIN pg_extension x ON e.name = x.extname LEFT ` |
| postgres | ~8.4k | ~149.6k | 17.72 | `SELECT public.check_prediction_markets_health()` |
| authenticator | ~710 | ~106.6k | 150.11 | `WITH -- Recursively get the base types of domains base_types AS ( WITH RECURSIVE recurse AS ( SELECT oid, typbasetype, typnamespace AS base_namespace, COALESCE(NULLIF(typbasetype, $2), oid) AS base_type FROM pg_type UNIO` |
| postgres | ~30 | ~105.8k | 3305.25 | `with page as ( select c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity, c.relreplident, nc.nspname as schema, -- Computed once here so the final select can reference it for both the -- raw byte count and pg_size` |
| postgres | ~1.4k | ~101.5k | 71.71 | `SELECT public.snapshot_push_outbox_health()` |
| postgres | ~7.1k | ~80.4k | 11.28 | `SELECT net.http_post( url := (SELECT value FROM _internal.dispatch_config WHERE key = $1) \|\| $2, headers := jsonb_build_object( $3, $4, $5, (SELECT value FROM _internal.dispatch_config WHERE key = $6) ), body := $7::json` |
| service_role | ~3.5k | ~79k | 22.26 | `WITH pgrst_source AS (SELECT pgrst_call.pgrst_scalar FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "query" FROM json_to_record(pgrst_payload.json_data) AS _("query" text) LIMIT $4) pgrst_body , LATERAL (SE` |
| postgres | ~90 | ~73.6k | 836.88 | `DELETE FROM cron.job_run_details WHERE start_time < now() - interval $1` |
| service_role | ~6.5k | ~50.5k | 7.77 | `WITH pgrst_source AS (SELECT pgrst_call.pgrst_scalar FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "_minutes", "_slo" FROM json_to_record(pgrst_payload.json_data) AS _("_minutes" integer, "_slo" numeric) L` |
| postgres | ~140 | ~49.1k | 355.77 | `with f as ( -- CTE with sane arg_modes, arg_names, and arg_types. -- All three are always of the same length. -- All three include all args, including OUT and TABLE args. with functions as ( select *, -- proargmodes is n` |
| service_role | ~7.3k | ~46k | 6.29 | `WITH pgrst_source AS (SELECT "pgrst_call".* FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "p_limit" FROM json_to_record(pgrst_payload.json_data) AS _("p_limit" integer) LIMIT $4) pgrst_body , LATERAL "publ` |


## Conexões
| usuário | estado | n |
|---|---|---|
| authenticator | idle | 11 |
| pgbouncer | idle | 1 |
| postgres | active | 2 |
| supabase_admin | active | 1 |
| supabase_admin | idle | 9 |
| supabase_admin |  | 1 |
| supabase_storage_admin | idle | 1 |


## Saúde dos serviços
```json
[
  {
    "healthy": true,
    "info": {
      "description": "GoTrue is a user registration and authentication API",
      "name": "GoTrue",
      "version": "v2.199.0"
    },
    "name": "auth",
    "status": "ACTIVE_HEALTHY"
  },
  {
    "healthy": true,
    "name": "db",
    "status": "ACTIVE_HEALTHY"
  },
  {
    "healthy": true,
    "name": "pooler",
    "status": "ACTIVE_HEALTHY"
  },
  {
    "healthy": true,
    "info": {
      "connected_cluster": 0,
      "db_connected": true,
      "healthy": true,
      "node": "realtime@2600:1f18:67fc:ac02:787e:9aa4:5647:c91c",
      "region": "us-east-1",
      "replication_connected": true
    },
    "name": "realtime",
    "status": "ACTIVE_HEALTHY"
  },
  {
    "healthy": true,
    "info": {
      "db_schema": "public,graphql_public"
    },
    "name": "rest",
    "status": "ACTIVE_HEALTHY"
  },
  {
    "healthy": true,
    "name": "storage",
    "status": "ACTIVE_HEALTHY"
  }
]
```
