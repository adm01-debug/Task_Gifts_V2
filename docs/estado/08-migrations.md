# Dimensão 8 — Migrations

> Documento de detalhe da auditoria de estado — 262 arquivos SQL, inventário por altitude.
> Evidência em `arquivo:linha`. Correções da Fase D estão em `ESTADO_ATUAL.md` e em `04-dados-e-runtime.md`.
> Runtime de build/teste = `NAO_VERIFICADO` (node_modules ausente no ambiente da auditoria).

---

# Auditoria de estado — supabase/migrations (task-gifts-v2)

Escopo auditado: `/home/user/task-gifts-v2/supabase/migrations` (262 arquivos `.sql`, 28.672 linhas) + `/home/user/task-gifts-v2/supabase/config.toml`.
Método: extração por `grep`/`perl` sobre o texto das migrations. Tudo abaixo é o **estado DECLARADO NO REPOSITÓRIO** — não é leitura do banco vivo.

`supabase/config.toml:1` contém apenas `project_id = "awzhgfmqwddzgbqzqusc"` (sem seções `[db]`, `[auth]`, `[functions]`).

## Resumo quantitativo

| Métrica | Valor | Como foi medido |
|---|---|---|
| Migrations `.sql` | **262** | `ls supabase/migrations \| wc -l` |
| Linhas totais de SQL | **28.672** | `wc -l supabase/migrations/*.sql` |
| Janela temporal | 2024-12-31 00:00:00 → 2026-08-07 03:00:00 | timestamp no nome do arquivo |
| Ocorrências `CREATE TABLE` | 238 | grep |
| **Tabelas distintas declaradas** | **228** | nomes únicos (2 falsos-positivos de comentário descartados) |
| Ocorrências `CREATE [OR REPLACE] FUNCTION` | 339 | grep |
| **Funções/RPC distintas declaradas** | **244** | nomes únicos |
| Ocorrências `CREATE TRIGGER` | 131 | grep |
| **Triggers distintos declarados** | **125** | nomes únicos |
| Ocorrências `CREATE [OR REPLACE] VIEW` | 3 | grep |
| **Views distintas declaradas** | **2** | nomes únicos (0 materialized views) |
| Ocorrências `CREATE POLICY` | **579** | grep |
| Objetos distintos com política RLS | **231** | 230 tabelas `public.*` + `storage.objects` |
| Ocorrências `CREATE [UNIQUE] INDEX` | 276 | grep |
| **Índices distintos declarados** | **259** | nomes únicos |
| Ocorrências `cron.schedule` | 23 | grep |
| **Jobs cron distintos declarados (ativos)** | **22** | 1 das 23 está comentada |
| Ocorrências `cron.unschedule` | 13 | grep |
| Statements `DROP` | 137 | 81 POLICY, 31 TRIGGER, 13 FUNCTION, 13 CONSTRAINT, 9 INDEX, 3 TABLE, 1 VIEW, 1 COLUMN |

Distribuição de migrations por mês (timestamp do nome):

| Mês | Migrations |
|---|---|
| 2024-12 | 2 |
| 2025-12 | 48 |
| 2026-01 | 4 |
| 2026-03 | 17 |
| 2026-05 | 8 |
| 2026-07 | 172 |
| 2026-08 | 11 |

> 66% de todas as migrations do projeto (172/262) foram criadas em julho/2026 — sinal de um ciclo de retrabalho intenso e concentrado.

Primeira/última migration:
- `supabase/migrations/20241231000000_saved_filters.sql`
- `supabase/migrations/20260807030000_fix_opinion_feed_rpc.sql`

---

## Tabelas declaradas

228 nomes únicos, extraídos de `CREATE TABLE [IF NOT EXISTS]` (prefixo `public.` removido). Ordenada:

- `achievements`
- `action_plan_items`
- `action_plan_updates`
- `action_plans`
- `activity_comments`
- `activity_reactions`
- `ai_coach_messages`
- `ai_course_jobs`
- `announcement_reactions`
- `announcement_reads`
- `announcements`
- `api_request_logs`
- `attendance_records`
- `attendance_settings`
- `attendance_streaks`
- `auction_admin_events`
- `auction_bids`
- `auctions`
- `audit_logs`
- `avatar_items`
- `bingo_board_tasks`
- `bingo_boards`
- `bingo_cards`
- `bingo_marks`
- `bitrix24_sync_mappings`
- `bitrix24_tokens`
- `bitrix24_webhook_logs`
- `blocked_ips`
- `board_moves`
- `board_player_states`
- `board_tiles`
- `board_trails`
- `boss_battle_damage`
- `boss_battle_rewards`
- `boss_battles`
- `boss_win_rate_goals`
- `campaign_participants`
- `campaign_progress_events`
- `campaign_result_imports`
- `campaign_result_rows`
- `campaign_team_members`
- `campaign_team_split_batches`
- `campaign_team_split_entries`
- `campaign_teams`
- `card_definitions`
- `card_packs`
- `card_set_claims`
- `card_trades`
- `celebrations`
- `certifications`
- `checkin_templates`
- `checkins`
- `climate_benchmarks`
- `climate_pillar_scores`
- `climate_question_answers`
- `climate_survey_questions`
- `climate_survey_responses`
- `climate_surveys`
- `competencies`
- `custom_badges`
- `custom_quests`
- `custom_ranks`
- `custom_titles`
- `department_missions`
- `department_rankings`
- `department_war_contributions`
- `department_war_departments`
- `department_war_metrics`
- `department_war_results`
- `department_wars`
- `departments`
- `development_plan_actions`
- `development_plans`
- `direct_duels`
- `engagement_action_playbooks`
- `engagement_answers`
- `engagement_cycles`
- `engagement_factors`
- `engagement_question_assignments`
- `engagement_question_pool`
- `engagement_snapshots`
- `enps_responses`
- `enps_surveys`
- `entity_versions`
- `executive_monthly_reports`
- `external_api_keys`
- `external_tasks`
- `feedback_cycles`
- `feedback_evaluations`
- `feedback_questions`
- `feedback_requests`
- `feedback_responses`
- `feedback_results`
- `gamification_themes`
- `geo_allowed_countries`
- `geo_settings`
- `goal_updates`
- `goals`
- `ip_access_logs`
- `ip_whitelist`
- `key_results`
- `kudos`
- `kudos_badges`
- `league_history`
- `leagues`
- `learning_trails`
- `level_configs`
- `lightning_quiz_answers`
- `lightning_quiz_questions`
- `lightning_quiz_sessions`
- `login_attempts`
- `lucky_wheel_payout_snapshots`
- `lucky_wheel_prize_audit`
- `lucky_wheel_prizes`
- `lucky_wheel_settings`
- `lucky_wheel_settings_audit`
- `lucky_wheel_spins`
- `lucky_wheel_whatif_snapshots`
- `memory_decks`
- `memory_pairs`
- `memory_sessions`
- `mentorship_mission_progress`
- `mentorship_missions`
- `mentorship_pairs`
- `mentorship_requests`
- `module_progress`
- `mood_entries`
- `new_device_alerts`
- `nine_box_evaluations`
- `notification_templates`
- `notifications`
- `nr1_factor_mappings`
- `nr1_risk_categories`
- `onboarding_progress`
- `opinion_responses`
- `opinion_supports`
- `opinion_tags`
- `opinions`
- `org_members`
- `org_theme_history`
- `organizations`
- `password_reset_requests`
- `pdi_checkins`
- `pdi_mentors`
- `pdi_templates`
- `penalty_rules`
- `permissions`
- `position_competencies`
- `position_task_templates`
- `positions`
- `postmortem_actions`
- `postmortems`
- `prediction_admin_events`
- `prediction_markets`
- `prediction_options`
- `prediction_stakes`
- `profiles`
- `pulse_responses`
- `pulse_surveys`
- `purchase_approvals`
- `push_notification_logs`
- `push_outbox`
- `push_outbox_health_snapshots`
- `push_subscriptions`
- `push_sync_events`
- `query_telemetry`
- `quest_assignments`
- `quest_steps`
- `quiz_answers`
- `quiz_options`
- `quiz_questions`
- `quiz_scores`
- `rate_limit_logs`
- `rate_limit_rules`
- `role_permissions`
- `roles`
- `runbook_executions`
- `sales_campaigns`
- `saved_filters`
- `scratch_card_prizes`
- `scratch_cards`
- `seasonal_challenges`
- `seasonal_events`
- `security_alerts`
- `sequence_attempts`
- `sequence_procedures`
- `sequence_steps`
- `session_logs`
- `shop_promotions`
- `shop_purchases`
- `shop_rewards`
- `sla_targets`
- `task_penalties`
- `task_scores`
- `team_members`
- `tournament_matches`
- `tournament_participants`
- `tournaments`
- `trail_enrollments`
- `trail_modules`
- `trail_prerequisites`
- `user_achievements`
- `user_avatar_config`
- `user_avatar_items`
- `user_cards`
- `user_certifications`
- `user_challenges`
- `user_combos`
- `user_competency_assessments`
- `user_devices`
- `user_leagues`
- `user_mission_progress`
- `user_positions`
- `user_roles`
- `user_seasonal_progress`
- `user_titles`
- `user_two_factor`
- `wager_budget_settings`
- `wager_entries`
- `wager_integrity_review_events`
- `wager_integrity_reviews`
- `wager_questions`
- `webauthn_challenges`
- `webauthn_credentials`
- `webhook_delivery_logs`
- `webhook_idempotency`
- `webhook_subscriptions`
- `weekly_challenges`

**Redeclaradas mais de uma vez** (duas migrations diferentes emitem `CREATE TABLE` para o mesmo nome):

| Tabela | Nº de `CREATE TABLE` |
|---|---|
| `permissions` | 2 |
| `role_permissions` | 2 |
| `lightning_quiz_answers` | 2 |
| `lightning_quiz_sessions` | 2 |

---

## Funções/RPC declaradas

244 nomes únicos, extraídos de `CREATE [OR REPLACE] FUNCTION`. Ordenada:

- `_card_rarity_value`
- `_card_set_milestone_split`
- `_grant_card_pack_internal`
- `_guard_manager_or_admin_if_user`
- `_require_admin`
- `_require_manager_or_admin`
- `acknowledge_security_alert`
- `admin_profile_directory`
- `advance_board_trail`
- `answer_lightning_question`
- `apply_boss_damage_internal`
- `apply_campaign_import`
- `apply_task_penalty`
- `approve_password_reset`
- `assign_engagement_questions`
- `auto_block_ip`
- `auto_create_postmortem_on_resolve`
- `auto_lock_prediction_markets`
- `auto_promote_expired_webhook_secrets`
- `auto_unblock_board_players`
- `award_campaign_team_split`
- `bingo_metric_value`
- `boss_hook_attendance_streaks`
- `boss_hook_task_scores`
- `boss_hook_trail_enrollments`
- `boss_phase_alert_hook`
- `bulk_rotate_webhook_secrets`
- `calculate_enps_score`
- `can_handle_opinion`
- `cancel_auction`
- `cancel_webhook_secret_rotation`
- `card_pack_hook_attendance_streaks`
- `card_pack_hook_task_scores`
- `card_pack_hook_trail_enrollments`
- `card_pack_notify`
- `check_api_key_rotation_overdue`
- `check_boss_win_rate_alerts`
- `check_login_lockout`
- `check_overdue_postmortem_actions`
- `check_prediction_markets_health`
- `check_sla_breaches_and_alert`
- `check_webhook_sla_and_alert`
- `chi_square_critical`
- `claim_card_set_reward`
- `claim_push_outbox`
- `cleanup_expired_challenges`
- `cleanup_expired_idempotency_keys`
- `cleanup_old_security_logs`
- `close_auction`
- `close_expired_auctions`
- `close_expired_sales_campaigns`
- `complete_external_task`
- `complete_task_score`
- `create_auction_draft`
- `create_external_api_key`
- `create_prediction_market`
- `deal_boss_damage`
- `delete_board_trail`
- `delete_external_api_key`
- `enforce_campaign_team_consistency`
- `engagement_min_respondents`
- `enqueue_push`
- `ensure_single_default_filter`
- `erf_inverse`
- `expire_card_trades`
- `finish_lightning_round`
- `finish_memory_session`
- `generate_action_plan_from_factor`
- `generate_action_plan_from_nr1_category`
- `generate_action_plan_from_opinion`
- `generate_certificate_code`
- `generate_engagement_snapshot`
- `generate_executive_monthly_report`
- `get_2fa_status`
- `get_account_devices`
- `get_active_engagement_cycle`
- `get_alert_heatmap_30d`
- `get_alert_mttr_by_type_7d`
- `get_auction_summary`
- `get_board_challenge_stats`
- `get_board_trail_leaderboard`
- `get_boss_battle_leaderboard`
- `get_burn_rate`
- `get_card_set_rewards`
- `get_daily_wager`
- `get_department_metrics`
- `get_department_war_feed`
- `get_department_war_standings`
- `get_engagement_cycle_progress`
- `get_engagement_factor_scores`
- `get_engagement_nps`
- `get_engagement_nps_history`
- `get_engagement_overview`
- `get_engagement_pillar_benchmark`
- `get_engagement_pillar_correlations`
- `get_engagement_pillar_scores`
- `get_error_budget_30d`
- `get_executive_metrics`
- `get_incident_metrics`
- `get_leaderboard_api`
- `get_lucky_wheel_prizes_display`
- `get_lucky_wheel_status`
- `get_memory_leaderboard`
- `get_monthly_trends`
- `get_my_profile_private`
- `get_nine_box_distribution`
- `get_nr1_risk_matrix`
- `get_nr1_summary`
- `get_opinion_feed`
- `get_or_create_bingo_card`
- `get_passkeys_by_email`
- `get_prediction_odds_history`
- `get_prediction_oracle_aggregates`
- `get_push_outbox_health`
- `get_push_outbox_health_trend`
- `get_quiz_category_stats`
- `get_quiz_lifeline`
- `get_quiz_play_set`
- `get_reliability_slo`
- `get_reliability_timeline`
- `get_security_digest_history`
- `get_security_stats`
- `get_sequence_play_set`
- `get_sequence_procedure_stats`
- `get_tournament_bracket`
- `get_user_department_id`
- `get_user_stats_api`
- `get_wager_leaderboard`
- `get_webhook_delivery_hourly_24h`
- `get_webhook_delivery_logs`
- `get_webhook_delivery_stats_1h`
- `get_webhook_delivery_stats_24h`
- `get_webhook_executive_metrics_7d`
- `grade_quiz_answer`
- `grant_card_pack`
- `grant_scratch_card`
- `handle_new_user`
- `handle_updated_at`
- `has_role`
- `increment_announcement_views`
- `increment_push_failures`
- `ingest_war_event`
- `is_country_allowed`
- `is_department_manager`
- `is_ip_blocked`
- `is_ip_whitelisted`
- `is_org_admin`
- `is_org_member`
- `join_tournament`
- `list_external_api_keys`
- `list_stuck_board_players`
- `list_tournaments`
- `list_wager_questions`
- `log_auction_admin_event`
- `log_ip_access`
- `log_login_attempt`
- `log_lucky_wheel_budget_change`
- `log_lucky_wheel_prize_change`
- `log_prediction_settlement`
- `log_purchase_requested`
- `log_runbook_step`
- `log_wager_integrity_review_event`
- `notify_admins_of_monthly_report`
- `open_card_pack`
- `place_auction_bid`
- `place_prediction_stake`
- `process_external_task`
- `promote_webhook_secret`
- `propose_card_trade`
- `publish_auction`
- `quiz_fifty_fifty`
- `raise_lucky_wheel_window_alerts`
- `recalc_campaign_progress`
- `recalc_campaign_teams`
- `register_device`
- `register_war_contribution`
- `reject_password_reset`
- `report_tournament_match`
- `request_password_reset`
- `requeue_push_outbox`
- `reset_login_attempts`
- `reset_push_failures`
- `resolve_board_challenge`
- `respond_card_trade`
- `respond_to_opinion`
- `reveal_scratch_card`
- `revert_campaign_import`
- `revert_campaign_team_split`
- `review_purchase`
- `revoke_device_by_fingerprint`
- `revoke_push_device`
- `rotate_external_api_secret`
- `rotate_webhook_secret`
- `run_boss_win_rate_alerts`
- `save_board_trail`
- `save_sequence_procedure`
- `save_wager_question`
- `set_certificate_identity`
- `set_external_api_key_active`
- `set_opinion_status`
- `set_postmortem_action_completed_at`
- `settle_auction`
- `settle_boss_battle`
- `settle_department_war`
- `settle_prediction_market`
- `settle_tournament_rewards`
- `snapshot_lucky_wheel_payout`
- `snapshot_push_outbox_health`
- `spin_lucky_wheel`
- `start_lightning_round`
- `start_memory_session`
- `start_tournament`
- `submit_daily_wager`
- `submit_engagement_answer`
- `submit_sequence_attempt`
- `sync_bingo_card`
- `sync_board_blocked_at`
- `sync_department_war_headcount`
- `toggle_opinion_support`
- `tournament_place_winner`
- `tournament_propagate_byes`
- `tournament_seed_order`
- `transition_prediction_market`
- `trigger_dispatch_critical_alert`
- `trim_push_sync_events`
- `unblock_board_players`
- `update_certification_statuses`
- `update_saved_filters_updated_at`
- `update_updated_at_column`
- `user_has_passkeys`
- `user_wants_email_notification`
- `user_wants_in_app_notification`
- `user_wants_push_notification`
- `validate_api_key`
- `validate_auction_window`
- `validate_department_war`
- `validate_reset_token`
- `verify_certificate`
- `war_hook_attendance`
- `war_hook_kudos`
- `war_hook_module_progress`
- `war_hook_quiz_scores`
- `war_hook_task_scores`
- `war_hook_trail_enrollments`

**Funções reescritas 3+ vezes** (indício de retrabalho / definição instável):

| Função | Nº de definições |
|---|---|
| `answer_lightning_question` | 4 |
| `cleanup_old_security_logs` | 4 |
| `close_expired_sales_campaigns` | 4 |
| `settle_auction` | 4 |
| `unblock_board_players` | 4 |
| `auto_unblock_board_players` | 3 |
| `finish_lightning_round` | 3 |
| `get_engagement_pillar_benchmark` | 3 |
| `log_login_attempt` | 3 |
| `recalc_campaign_progress` | 3 |
| `resolve_board_challenge` | 3 |
| `start_lightning_round` | 3 |
| `submit_sequence_attempt` | 3 |

Outras 30 funções têm exatamente 2 definições.

---

## Views declaradas

Apenas **2** views distintas no repositório inteiro; nenhuma materialized view.

| View | Arquivo:linha |
|---|---|
| `public.profiles_public` | `supabase/migrations/20260711192623_7a46baef-8f78-4c1d-a09f-c03ede842682.sql:5` (`CREATE OR REPLACE VIEW`) |
| `public.profiles_public` (recriada) | `supabase/migrations/20260711192652_49cd41e5-7b9d-42cb-b22e-4cd5747bf585.sql:4` (`DROP VIEW` + `CREATE VIEW ... WITH (security_invoker = true)`) |
| `public.webhook_delivery_stats_24h` | `supabase/migrations/20260712191659_7162f535-958f-4c45-8b50-f0a1eaa0028c.sql:4` |

Nota: `profiles_public` foi criada e imediatamente recriada com 29 segundos de diferença entre as duas migrations.

---

## Triggers declarados

125 nomes únicos, extraídos de `CREATE TRIGGER`. Ordenada:

- `lightning_questions_updated_at`
- `lightning_sessions_updated_at`
- `lucky_wheel_prizes_audit`
- `lucky_wheel_prizes_updated_at`
- `on_auth_user_created`
- `push_outbox_updated_at`
- `scratch_card_prizes_updated_at`
- `scratch_cards_updated_at`
- `set_card_set_claims_updated_at`
- `set_updated_at_user_challenges`
- `trg_ai_course_jobs_updated_at`
- `trg_auction_bids_updated_at`
- `trg_auctions_updated_at`
- `trg_auctions_validate_window`
- `trg_auto_create_postmortem`
- `trg_boss_damage_attendance_streaks`
- `trg_boss_damage_task_scores`
- `trg_boss_damage_trail_enrollments`
- `trg_boss_phase_alert`
- `trg_campaign_participants_updated_at`
- `trg_campaign_result_imports_updated_at`
- `trg_campaign_result_rows_updated_at`
- `trg_campaign_team_members_consistency`
- `trg_campaign_teams_updated_at`
- `trg_card_definitions_updated`
- `trg_card_pack_attendance_streaks`
- `trg_card_pack_notify`
- `trg_card_pack_task_scores`
- `trg_card_pack_trail_enrollments`
- `trg_card_packs_updated`
- `trg_card_trades_updated`
- `trg_ecycles_updated`
- `trg_engagement_factors_updated`
- `trg_eqp_updated`
- `trg_log_prediction_settlement`
- `trg_log_purchase_requested`
- `trg_log_wager_integrity_review_event`
- `trg_lucky_wheel_budget_audit`
- `trg_lucky_wheel_payout_snapshots_updated_at`
- `trg_lucky_wheel_settings_updated`
- `trg_lucky_wheel_whatif_updated_at`
- `trg_notify_admins_monthly_report`
- `trg_nr1_categories_updated`
- `trg_playbooks_updated`
- `trg_pm_action_completed`
- `trg_postmortem_actions_updated_at`
- `trg_postmortems_updated_at`
- `trg_prediction_markets_updated_at`
- `trg_push_subs_updated_at`
- `trg_sales_campaigns_updated_at`
- `trg_security_alerts_dispatch_critical`
- `trg_sla_targets_updated`
- `trg_sync_board_blocked_at`
- `trg_tournament_matches_updated_at`
- `trg_tournament_participants_updated_at`
- `trg_tournaments_updated_at`
- `trg_trim_push_sync_events`
- `trg_user_cards_updated`
- `trg_user_certifications_identity`
- `trg_validate_department_war`
- `trg_wager_budget_settings_updated`
- `trg_war_hook_attendance`
- `trg_war_hook_kudos`
- `trg_war_hook_module_progress`
- `trg_war_hook_quiz_scores`
- `trg_war_hook_task_scores`
- `trg_war_hook_trail_enrollments`
- `trigger_saved_filters_updated_at`
- `trigger_single_default_filter`
- `update_announcements_updated_at`
- `update_bingo_boards_updated_at`
- `update_bingo_cards_updated_at`
- `update_bitrix24_sync_mappings_updated_at`
- `update_bitrix24_tokens_updated_at`
- `update_board_player_states_updated_at`
- `update_board_tiles_updated_at`
- `update_board_trails_updated_at`
- `update_boss_battles_updated_at`
- `update_boss_win_rate_goals_updated_at`
- `update_certifications_updated_at`
- `update_checkins_updated_at`
- `update_custom_quests_updated_at`
- `update_department_missions_updated_at`
- `update_department_rankings_updated_at`
- `update_departments_updated_at`
- `update_direct_duels_updated_at`
- `update_external_api_keys_updated_at`
- `update_external_tasks_updated_at`
- `update_feedback_cycles_updated_at`
- `update_feedback_requests_updated_at`
- `update_goals_updated_at`
- `update_ip_whitelist_updated_at`
- `update_key_results_updated_at`
- `update_learning_trails_updated_at`
- `update_memory_decks_updated_at`
- `update_memory_pairs_updated_at`
- `update_memory_sessions_updated_at`
- `update_mentorship_mission_progress_updated_at`
- `update_mentorship_pairs_updated_at`
- `update_notification_templates_updated_at`
- `update_onboarding_progress_updated_at`
- `update_opinions_updated_at`
- `update_organizations_updated_at`
- `update_password_reset_requests_updated_at`
- `update_penalty_rules_updated_at`
- `update_position_task_templates_updated_at`
- `update_positions_updated_at`
- `update_profiles_updated_at`
- `update_pulse_surveys_updated_at`
- `update_quiz_questions_updated_at`
- `update_sequence_procedures_updated_at`
- `update_sequence_steps_updated_at`
- `update_shop_promotions_updated_at`
- `update_shop_rewards_updated_at`
- `update_task_scores_updated_at`
- `update_trail_modules_updated_at`
- `update_user_avatar_config_updated_at`
- `update_user_certifications_updated_at`
- `update_user_combos_updated_at`
- `update_user_leagues_updated_at`
- `update_user_two_factor_updated_at`
- `update_wager_integrity_reviews_updated_at`
- `update_wager_questions_updated_at`
- `update_webhook_subscriptions_updated_at`
- `update_weekly_challenges_updated_at`

---

## Jobs cron declarados no repo

**22 jobs ativos** (nome = 1º argumento de `cron.schedule`), ordenados alfabeticamente:

| # | Nome do job | Arquivo:linha |
|---|---|---|
| 1 | `api-key-rotation-overdue-weekly` | `20260728210216_01d79f58-57ea-48d9-a859-ef3ddf891190.sql:186` |
| 2 | `auto-lock-prediction-markets` | `20260728114514_7f6f6bd8-8c0c-4762-9f48-2e4474ed0b2b.sql:201` |
| 3 | `auto-promote-expired-webhook-secrets` | `20260712200006_664f7c03-75c3-4a12-9b8d-1d6da5c917d2.sql:61` |
| 4 | `board-auto-unblock-daily` | `20260728175346_9062e6fd-34a2-4490-82cd-d4877f2beafd.sql:98` |
| 5 | `check-prediction-markets-health` | `20260728115201_58fcd8a8-c7ad-4a49-863c-74e07cdbc8e5.sql:123` |
| 6 | `close-expired-auctions` | `20260728103701_298e9bca-0b39-4dba-aef0-058a9b24a556.sql:4` |
| 7 | `close-expired-sales-campaigns` | `20260723150852_6048cf0f-c3a4-48e7-9f40-e2b293b020b9.sql:31` |
| 8 | `daily-cleanup-idempotency` | `20260712115320_24a903a0-f49b-4374-b87b-b0775838c874.sql:37` |
| 9 | `daily-cleanup-security-logs-30d` | `20260712115320_24a903a0-f49b-4374-b87b-b0775838c874.sql:30` |
| 10 | `daily-cleanup-security-logs-90d` | `20260712115320_24a903a0-f49b-4374-b87b-b0775838c874.sql:23` |
| 11 | `exec_monthly_report_generation` | `20260712222455_cdcbc232-1f35-4c6c-9c2c-0e4bf903e241.sql:186` |
| 12 | `expire-card-trades-daily` | `20260728121542_4ac8cbd1-0d6d-410d-8734-4fd032804ddc.sql:451` |
| 13 | `lucky-wheel-payout-snapshot` | `20260727211017_30d9a02a-0c84-4b45-8702-4bab7e71f005.sql:285` |
| 14 | `lucky-wheel-window-alerts` | `20260727213924_1ac322ab-1677-4094-96a8-c1ad0812647f.sql:142` |
| 15 | `postmortem_overdue_daily_check` | `20260712222316_d8f7eabc-3e3b-437f-b041-70b9f3b88f9b.sql:131` |
| 16 | `push-outbox-dispatcher` | `20260728112123_ea25bb13-aa3c-4f75-9892-c58e2785e70b.sql:243` |
| 17 | `push-outbox-health-snapshot` | `20260728112815_fd49db87-3ae3-448d-b394-dfe7f248adae.sql:186` |
| 18 | `security-weekly-digest` | `20260712212544_f5c57b6a-8da7-4609-9178-803cbf5741f6.sql:1` |
| 19 | `sla_breach_weekly_check` | `20260712222009_147eee74-b689-46b7-b92b-d903d1e4754b.sql:112` |
| 20 | `webhook-health-monitor-every-15min` | `20260712194718_bff07c8c-5744-4682-bba1-33f9ca2a1ecb.sql:10` |
| 21 | `webhook-sla-daily-check` | `20260712203117_fac39bdd-c966-4e9e-96f4-feee404f2a82.sql:108` |
| 22 | `weekly-cleanup-expired-challenges` | `20260712115320_24a903a0-f49b-4374-b87b-b0775838c874.sql:44` |

**Declarado mas COMENTADO (não executa):**

| Nome | Arquivo:linha |
|---|---|
| `cleanup-logs-daily` | `20260520162624_05dce903-e1a2-49e8-93a1-64ec4f6421b4.sql:21` — a linha inteira é `-- SELECT cron.schedule('cleanup-logs-daily', '0 3 * * *', ...)` |

**`cron.unschedule` presentes** (13): `sla_breach_weekly_check`, `lucky-wheel-payout-snapshot`, `exec_monthly_report_generation`, `board-auto-unblock-daily`, `auto-promote-expired-webhook-secrets`, `api-key-rotation-overdue-weekly`, `lucky-wheel-window-alerts`, `postmortem_overdue_daily_check`, `webhook-sla-daily-check`, `webhook-health-monitor-every-15min`, `close-expired-sales-campaigns`, `close-expired-auctions`, + 1 dinâmico em loop (`20260712115320_...sql:17`). Todos são padrão "unschedule → reschedule" na mesma migration.

---

## Migrations com seed/dado fictício

### 1. Benchmarks de clima organizacional — dados explicitamente fictícios
`supabase/migrations/20251225223108_0cefeb56-0f31-454b-8422-7dad048d070f.sql:490`

```
-- SEED DATA - Benchmark (dados fictícios para exemplo)
```
Linha 493: `INSERT INTO public.climate_benchmarks (...)` com 10 linhas inventadas (`'recognition','general','all','brazil', 72.0, 82.0, 90.0, 1500, '2024-Q4'` etc.). O `sample_size = 1500` sugere uma base de 1.500 respondentes que não existe. **Estes números alimentam comparativos exibidos ao usuário como se fossem benchmark de mercado.**

### 2. Usuário de teste criado direto em `auth.users` com senha em texto claro
`supabase/migrations/20260306011941_220c1381-806a-40d8-8510-d2558ac0369d.sql:1-39`

Cria `qa-test@taskgifts.com` via `INSERT INTO auth.users` (linha 11), senha literal `'QaTest2026!'` no código (linha 18), `display_name: "QA Tester"` (linha 21), e **concede role `admin`** (linha 33). Revertida por `supabase/migrations/20260306012041_1654ce6f-6010-4ca6-abc7-10f35bb469f7.sql:2-3` (`DELETE FROM auth.identities` / `DELETE FROM auth.users`), mas a senha permanece versionada no histórico do repositório.

### 3. Rodada "de exemplo" de desafios semanais
`supabase/migrations/20260727222655_16b4a067-5707-4794-9cba-be5694907056.sql:421-460`

```
-- Rodada de exemplo do mês corrente + 24 desafios reais
DO $seed$ ... $seed$;
```
Insere uma rodada de exemplo do mês corrente diretamente em produção.

### 4. Seeds legítimos (configuração, não dado fictício)
- `20251225230238_0f975e88-ad46-43fc-8b20-3fbe8fe213e0.sql:89` — permissões base
- `20251225230238_...sql:109` — roles base
- `20251225230238_...sql:118` — templates de notificação
- `20260806184700_seed_leagues_if_empty.sql:1-9` — ligas padrão, idempotente via `ON CONFLICT (tier) DO NOTHING`
- `20260726160940_73598534-820c-416f-8663-cb0272ff160a.sql:58-64` — playbooks de engajamento, idempotentes

Estes são dados de configuração do sistema e não configuram dado fictício de negócio.

---

## Achados graves

### G1 — DRIFT CONFIRMADO: o job cron `update-profile-name-daily` NÃO EXISTE NO REPOSITÓRIO
Comando executado sobre todo o repositório:
```
grep -rin "update-profile-name-daily\|update_profile_name_daily\|Abner" /home/user/task-gifts-v2
→ 0 resultados
```
Verificação cruzada: os 22 jobs de `cron.schedule` declarados estão listados na seção anterior — nenhum manipula `profiles.display_name`. Nenhuma migration contém a string `Abner` em nenhum lugar do repositório (busca em todos os arquivos, não só `.sql`).

**Conclusão:** se o job `update-profile-name-daily` existe no banco vivo e renomeia diariamente o perfil de um usuário específico para `'Abner Pereira N'`, ele foi criado **fora do controle de versão** — via SQL Editor do Supabase, via MCP, ou por outro canal. Isto significa que:
- O banco tem código executando diariamente que **ninguém pode revisar pelo repositório**.
- Um `supabase db reset` ou reprovisionamento a partir das migrations **não recriaria** esse job — e nem revelaria sua existência.
- É um job que escreve em `profiles` de forma hardcoded para um único usuário: perfil de comportamento de backdoor/pegadinha, não de feature.

### G2 — Migration concede `admin` + `manager` a um UUID hardcoded, sem qualquer condição
`supabase/migrations/20260306012145_1621918a-fb50-4f2d-8af2-799429f5c8ea.sql:1-2`
```sql
INSERT INTO public.user_roles (user_id, role) VALUES ('2ad6e986-5a6c-4173-8d39-40de4287bba7', 'admin') ON CONFLICT (user_id, role) DO NOTHING;
INSERT INTO public.user_roles (user_id, role) VALUES ('2ad6e986-5a6c-4173-8d39-40de4287bba7', 'manager') ON CONFLICT (user_id, role) DO NOTHING;
```
Migration de 2 linhas, sem comentário, sem verificação de existência do usuário. Escalação de privilégio permanente e versionada para um indivíduo específico. Vale cruzar este UUID com o usuário-alvo do job do achado G1.

### G3 — Senha de usuário admin em texto claro versionada no repositório
`supabase/migrations/20260306011941_220c1381-806a-40d8-8510-d2558ac0369d.sql:18`
```sql
crypt('QaTest2026!', gen_salt('bf')),
```
O usuário `qa-test@taskgifts.com` recebe role `admin` na linha 33. A migration seguinte (`20260306012041_...sql`) apaga o usuário, mas **a senha continua no histórico git para sempre**. Se o padrão `QaTest2026!` for reutilizado em outras contas, é credencial comprometida.

### G4 — Funções referenciam objetos que não existem no repositório (esquema incompleto/divergente)
Três referências a objetos nunca criados por nenhuma migration:

| Objeto ausente | Onde é referenciado | Evidência |
|---|---|---|
| tabela `public.security_logs` | `20260520162624_05dce903-e1a2-49e8-93a1-64ec4f6421b4.sql:10` (`DELETE FROM public.security_logs`) | zero `CREATE TABLE ... security_logs` no repo |
| tabela `geo_access_logs` | `20260306000318_cc14b254-e622-48a0-a219-de592646bf75.sql:20` (`CREATE POLICY ... ON geo_access_logs`) e `20260728190509_...sql:1` (`REVOKE`) | zero `CREATE TABLE` |
| tabela `geo_blocking_rules` | `CREATE POLICY` sem `CREATE TABLE` correspondente | zero `CREATE TABLE` |

A própria base admite o problema em `supabase/migrations/20260728180424_040c01ed-24d7-4c7e-af93-4ad3cbf536dc.sql:58`:
```
-- 2) Remove a sobrecarga sem argumentos de cleanup_old_security_logs (ambígua e apontando para tabela inexistente)
```
Ou seja: **o repositório sozinho não reconstrói o banco.** Existem objetos no banco vivo (ou esperados por ele) que só existem lá.

### G5 — Migration que limpa artefato nunca criado pelo repo: chave de API `tg_probe`
`supabase/migrations/20260728205625_eef465d5-b0c9-4c52-81a9-0e870313599d.sql:1` (arquivo de uma linha só)
```sql
DELETE FROM public.external_api_keys WHERE api_key = 'tg_probe';
```
Não existe nenhum `INSERT` de `tg_probe` em nenhuma migration. Alguém criou uma chave de API de teste chamada `tg_probe` **diretamente no banco de produção** e depois versionou apenas a limpeza. É a mesma assinatura de drift do achado G1: escrita direta no banco vivo, repositório usado só para o remendo.

### G6 (adicional) — Nível alto de retrabalho: 137 `DROP` e 5 funções redefinidas 4×
- 81 `DROP POLICY`, 31 `DROP TRIGGER`, 13 `DROP FUNCTION` em 262 migrations.
- 5 funções (`answer_lightning_question`, `cleanup_old_security_logs`, `close_expired_sales_campaigns`, `settle_auction`, `unblock_board_players`) foram redefinidas 4 vezes cada; 8 outras 3 vezes; 30 duas vezes.
- Pares de migrations quase idênticas com minutos de diferença, ex.: `20260728180043_71553ac9-...sql` e `20260728180133_93c53b2d-...sql` (50s de diferença, ambas com `DELETE FROM _unblocked_board_players`); `20260728180424_040c01ed-...sql` e `20260728180730_1d09218b-...sql` (3min, ambas redefinem `cleanup_old_security_logs`); `20260711192623_...sql` e `20260711192652_...sql` (29s, ambas criam a view `profiles_public`).
- 172 das 262 migrations (66%) são de um único mês (julho/2026).

Consequência prática: a ordem de aplicação importa muito e o estado final é difícil de prever a partir da leitura estática — o que amplifica o risco dos drifts G1/G4/G5.

---

## Notas de método e limitações

- Todas as contagens vêm de análise textual (`grep -rinE`, `perl -0777`) sobre os 262 `.sql`. Não houve conexão com o banco.
- Dois falsos-positivos foram identificados e removidos das listas: comentários no formato `-- Create table for ...` (5 ocorrências) e `-- Create function to ...` (3 ocorrências) casavam com os padrões de extração.
- Contagens de "ocorrências" ≠ "objetos distintos": migrations usam `CREATE OR REPLACE` extensivamente, então 339 `CREATE FUNCTION` produzem 244 funções distintas.
- SQL construído dinamicamente (`EXECUTE format(...)`) não é capturado por esta análise. Objetos criados por esse caminho não aparecem no inventário.
- A lista de índices (259) não foi expandida nominalmente por não ter sido pedida; está disponível pelo mesmo método.
