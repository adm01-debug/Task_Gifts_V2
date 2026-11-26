-- Reaplica em producao os indices que o repositorio define e o banco vivo nao tem
--
-- Medicao em 2026-11-25: 95 indices existem no banco reconstruido (portanto estao em
-- migrations) e nao existem em producao. E o mesmo tipo de desvio ja corrigido para funcoes em
-- 20261228170000: o ledger marca a versao como aplicada, mas o DDL daquele arquivo nao chegou a
-- rodar no banco vivo. Sem isso, consultas que o repositorio foi desenhado para servir rodam
-- sem indice em producao.
--
-- O segundo bloco realinha 9 indices cujo nome e igual nas duas pontas mas a definicao do
-- repositorio e mais completa (created_at/colunas extras). Nessas 9, a definicao do repositorio
-- e superconjunto da de producao, entao recriar nao perde nada e cobre mais consultas.

CREATE INDEX IF NOT EXISTS idx_auction_admin_events_created ON public.auction_admin_events USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_amount ON public.auction_bids USING btree (auction_id, amount DESC, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_auction_bids_dedupe ON public.auction_bids USING btree (auction_id, user_id, dedupe_key) WHERE (dedupe_key IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_auctions_reward ON public.auctions USING btree (reward_id);
CREATE INDEX IF NOT EXISTS idx_bingo_board_tasks_board ON public.bingo_board_tasks USING btree (board_id, order_index);
CREATE INDEX IF NOT EXISTS idx_board_moves_trail_challenge ON public.board_moves USING btree (trail_id, tile_type, created_at DESC) WHERE (tile_type = 'challenge'::text);
CREATE INDEX IF NOT EXISTS idx_board_moves_user_trail ON public.board_moves USING btree (trail_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_player_states_blocked ON public.board_player_states USING btree (blocked_at) WHERE (blocked_challenge_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_board_player_states_trail_rank ON public.board_player_states USING btree (trail_id, "position" DESC, xp DESC, coins DESC);
CREATE INDEX IF NOT EXISTS idx_board_player_states_user ON public.board_player_states USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_board_tiles_trail ON public.board_tiles USING btree (trail_id, "position");
CREATE INDEX IF NOT EXISTS idx_boss_battle_damage_battle_user ON public.boss_battle_damage USING btree (battle_id, user_id);
CREATE INDEX IF NOT EXISTS idx_boss_damage_battle_created ON public.boss_battle_damage USING btree (battle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_boss_damage_battle_user ON public.boss_battle_damage USING btree (battle_id, user_id);
CREATE INDEX IF NOT EXISTS idx_boss_battles_department ON public.boss_battles USING btree (department_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS boss_win_rate_goals_department_key ON public.boss_win_rate_goals USING btree (department_id) WHERE (department_id IS NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS boss_win_rate_goals_global_key ON public.boss_win_rate_goals USING btree (((department_id IS NULL))) WHERE (department_id IS NULL);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_campaign_result_rows_dedupe ON public.campaign_result_rows USING btree (campaign_id, dedupe_key) WHERE (status = ANY (ARRAY['valid'::text, 'applied'::text]));
CREATE INDEX IF NOT EXISTS idx_campaign_team_members_team ON public.campaign_team_members USING btree (team_id);
CREATE INDEX IF NOT EXISTS idx_campaign_team_members_user ON public.campaign_team_members USING btree (campaign_id, user_id);
CREATE INDEX IF NOT EXISTS idx_team_split_batches_campaign ON public.campaign_team_split_batches USING btree (campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_split_entries_batch ON public.campaign_team_split_entries USING btree (batch_id);
CREATE INDEX IF NOT EXISTS idx_team_split_entries_campaign ON public.campaign_team_split_entries USING btree (campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_split_entries_user ON public.campaign_team_split_entries USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_teams_campaign ON public.campaign_teams USING btree (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_teams_department ON public.campaign_teams USING btree (department_id);
CREATE INDEX IF NOT EXISTS idx_card_definitions_active ON public.card_definitions USING btree (is_active, rarity);
CREATE UNIQUE INDEX IF NOT EXISTS climate_benchmarks_scope_uidx ON public.climate_benchmarks USING btree (pillar, industry, company_size, region, period);
CREATE INDEX IF NOT EXISTS idx_climate_benchmarks_segment ON public.climate_benchmarks USING btree (region, industry, company_size, pillar, period DESC);
CREATE INDEX IF NOT EXISTS idx_war_contrib_feed ON public.department_war_contributions USING btree (war_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_war_contrib_user ON public.department_war_contributions USING btree (war_id, user_id);
CREATE INDEX IF NOT EXISTS idx_war_contrib_war_dept ON public.department_war_contributions USING btree (war_id, department_id);
CREATE INDEX IF NOT EXISTS idx_war_departments_war ON public.department_war_departments USING btree (war_id);
CREATE INDEX IF NOT EXISTS idx_war_metrics_war ON public.department_war_metrics USING btree (war_id);
CREATE INDEX IF NOT EXISTS idx_war_results_war ON public.department_war_results USING btree (war_id, "position");
CREATE INDEX IF NOT EXISTS idx_department_wars_running ON public.department_wars USING btree (status, starts_at, ends_at) WHERE (status = 'running'::text);
CREATE INDEX IF NOT EXISTS idx_department_wars_status_ends_at ON public.department_wars USING btree (status, ends_at DESC);
CREATE INDEX IF NOT EXISTS idx_playbooks_pillar ON public.engagement_action_playbooks USING btree (pillar, order_index);
CREATE UNIQUE INDEX IF NOT EXISTS uq_playbooks_pillar_title ON public.engagement_action_playbooks USING btree (pillar, title);
CREATE INDEX IF NOT EXISTS idx_eanswers_answered_at ON public.engagement_answers USING btree (answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_eanswers_cycle ON public.engagement_answers USING btree (cycle_id);
CREATE INDEX IF NOT EXISTS idx_eanswers_dept_date ON public.engagement_answers USING btree (department_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_eanswers_question ON public.engagement_answers USING btree (question_id);
CREATE INDEX IF NOT EXISTS idx_eanswers_user_question ON public.engagement_answers USING btree (user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_ecycles_status ON public.engagement_cycles USING btree (status, ends_at DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_factors_pillar ON public.engagement_factors USING btree (pillar);
CREATE INDEX IF NOT EXISTS idx_eqa_pending ON public.engagement_question_assignments USING btree (user_id) WHERE (answered_at IS NULL);
CREATE INDEX IF NOT EXISTS idx_eqa_user_cycle ON public.engagement_question_assignments USING btree (user_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_eqp_active ON public.engagement_question_pool USING btree (is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_eqp_factor ON public.engagement_question_pool USING btree (factor_id);
CREATE INDEX IF NOT EXISTS idx_eqp_pillar ON public.engagement_question_pool USING btree (pillar);
CREATE UNIQUE INDEX IF NOT EXISTS lightning_answers_session_idx_uidx ON public.lightning_quiz_answers USING btree (session_id, idx);
CREATE INDEX IF NOT EXISTS lightning_answers_user_idx ON public.lightning_quiz_answers USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lightning_questions_active_idx ON public.lightning_quiz_questions USING btree (is_active, difficulty);
CREATE INDEX IF NOT EXISTS lightning_sessions_user_created_idx ON public.lightning_quiz_sessions USING btree (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS lightning_sessions_user_dedupe_uidx ON public.lightning_quiz_sessions USING btree (user_id, dedupe_key);
CREATE INDEX IF NOT EXISTS lucky_wheel_prize_audit_changed_at_idx ON public.lucky_wheel_prize_audit USING btree (changed_at DESC);
CREATE INDEX IF NOT EXISTS lucky_wheel_prize_audit_prize_idx ON public.lucky_wheel_prize_audit USING btree (prize_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS lucky_wheel_prizes_active_idx ON public.lucky_wheel_prizes USING btree (is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_lw_settings_audit_changed_at ON public.lucky_wheel_settings_audit USING btree (changed_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS lucky_wheel_spins_dedupe_key_idx ON public.lucky_wheel_spins USING btree (user_id, dedupe_key);
CREATE INDEX IF NOT EXISTS lucky_wheel_spins_user_created_idx ON public.lucky_wheel_spins USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lucky_wheel_whatif_window ON public.lucky_wheel_whatif_snapshots USING btree (current_window_end DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_sessions_leaderboard ON public.memory_sessions USING btree (deck_id, session_date, status);
CREATE INDEX IF NOT EXISTS idx_memory_sessions_user_date ON public.memory_sessions USING btree (user_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_nr1_map_category ON public.nr1_factor_mappings USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_nr1_map_factor ON public.nr1_factor_mappings USING btree (factor_id);
CREATE INDEX IF NOT EXISTS idx_opinion_supports_opinion ON public.opinion_supports USING btree (opinion_id);
CREATE INDEX IF NOT EXISTS idx_opinions_status_created ON public.opinions USING btree (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_postmortems_alert ON public.postmortems USING btree (alert_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_prediction_stakes_dedupe ON public.prediction_stakes USING btree (market_id, user_id, dedupe_key) WHERE (dedupe_key IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_prediction_stakes_market_created ON public.prediction_stakes USING btree (market_id, created_at);
CREATE INDEX IF NOT EXISTS idx_prediction_stakes_user ON public.prediction_stakes USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_outbox_health_created ON public.push_outbox_health_snapshots USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_outbox_pending ON public.push_outbox USING btree (created_at) WHERE (status = 'pending'::text);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_fingerprint ON public.push_subscriptions USING btree (user_id, device_fingerprint) WHERE (device_fingerprint IS NOT NULL);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_last_used_idx ON public.push_subscriptions USING btree (user_id, last_used_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS push_sync_events_user_recent_idx ON public.push_sync_events USING btree (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS scratch_cards_user_dedupe_uidx ON public.scratch_cards USING btree (user_id, dedupe_key);
CREATE INDEX IF NOT EXISTS scratch_cards_user_status_idx ON public.scratch_cards USING btree (user_id, status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS security_alerts_lucky_wheel_dedupe_idx ON public.security_alerts USING btree (alert_type, ((metadata ->> 'ref_date'::text))) WHERE (alert_type ~~ 'lucky_wheel_%'::text);
CREATE INDEX IF NOT EXISTS idx_sequence_attempts_leaderboard ON public.sequence_attempts USING btree (procedure_id, attempt_date);
CREATE INDEX IF NOT EXISTS idx_sequence_attempts_proc_user_date ON public.sequence_attempts USING btree (procedure_id, user_id, attempt_date);
CREATE INDEX IF NOT EXISTS idx_sequence_attempts_user_day ON public.sequence_attempts USING btree (user_id, procedure_id, attempt_date);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tid ON public.tournament_matches USING btree (tournament_id, round, slot);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tid ON public.tournament_participants USING btree (tournament_id, seed);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON public.tournament_participants USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments USING btree (status, registration_opens_at DESC);
CREATE INDEX IF NOT EXISTS idx_wager_entries_user_created ON public.wager_entries USING btree (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_wager_entries_user_date ON public.wager_entries USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wager_review_events_lookup ON public.wager_integrity_review_events USING btree (window_days, target_user_id, anomaly_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wager_integrity_reviews_lookup ON public.wager_integrity_reviews USING btree (window_days, status, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_wager_questions_date_active ON public.wager_questions USING btree (scheduled_date) WHERE is_active;
CREATE INDEX IF NOT EXISTS webhook_idempotency_expires_at_idx ON public.webhook_idempotency USING btree (expires_at);
CREATE INDEX IF NOT EXISTS webhook_idempotency_provider_created_idx ON public.webhook_idempotency USING btree (provider, created_at DESC);

-- idx_auctions_status_ends: repositorio cobre mais colunas
DROP INDEX IF EXISTS public.idx_auctions_status_ends;
CREATE INDEX IF NOT EXISTS idx_auctions_status_ends ON public.auctions USING btree (status, ends_at DESC);
-- idx_bingo_cards_user: repositorio cobre mais colunas
DROP INDEX IF EXISTS public.idx_bingo_cards_user;
CREATE INDEX IF NOT EXISTS idx_bingo_cards_user ON public.bingo_cards USING btree (user_id, created_at DESC);
-- idx_boss_battles_status: repositorio cobre mais colunas
DROP INDEX IF EXISTS public.idx_boss_battles_status;
CREATE INDEX IF NOT EXISTS idx_boss_battles_status ON public.boss_battles USING btree (status, ends_at DESC);
-- idx_card_packs_user_status: repositorio cobre mais colunas
DROP INDEX IF EXISTS public.idx_card_packs_user_status;
CREATE INDEX IF NOT EXISTS idx_card_packs_user_status ON public.card_packs USING btree (user_id, status, created_at DESC);
-- idx_card_trades_proposer: repositorio cobre mais colunas
DROP INDEX IF EXISTS public.idx_card_trades_proposer;
CREATE INDEX IF NOT EXISTS idx_card_trades_proposer ON public.card_trades USING btree (proposer_id, status, created_at DESC);
-- idx_card_trades_responder: repositorio cobre mais colunas
DROP INDEX IF EXISTS public.idx_card_trades_responder;
CREATE INDEX IF NOT EXISTS idx_card_trades_responder ON public.card_trades USING btree (responder_id, status, created_at DESC);
-- idx_department_wars_status: repositorio cobre mais colunas
DROP INDEX IF EXISTS public.idx_department_wars_status;
CREATE INDEX IF NOT EXISTS idx_department_wars_status ON public.department_wars USING btree (status, ends_at DESC);
-- idx_prediction_markets_status: repositorio cobre mais colunas
DROP INDEX IF EXISTS public.idx_prediction_markets_status;
CREATE INDEX IF NOT EXISTS idx_prediction_markets_status ON public.prediction_markets USING btree (status, locks_at DESC);
-- idx_user_cards_user: repositorio cobre mais colunas
DROP INDEX IF EXISTS public.idx_user_cards_user;
CREATE INDEX IF NOT EXISTS idx_user_cards_user ON public.user_cards USING btree (user_id, card_id);
