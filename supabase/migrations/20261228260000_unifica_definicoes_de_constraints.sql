-- Unifica as 22 constraints que existem nas duas pontas com o mesmo nome e definicao diferente.
--
-- Regra aplicada: adotar o superconjunto, isto e, a definicao que aceita tudo o que cada lado
-- aceita hoje. Isso elimina a divergencia sem que nenhuma linha valida passe a ser recusada em
-- nenhum dos dois ambientes. Onde a diferenca e de acao em cascata (FK de department_id), fica
-- ON DELETE SET NULL, que e o comportamento vivo em producao e o nao destrutivo.
--
-- Trocar constraint exige DROP + ADD: o bloco captura violacao como NOTICE para nao abortar o
-- apply, e o nome da constraint pulada fica registrado.

-- uniao das duas definicoes
ALTER TABLE public.board_tiles DROP CONSTRAINT IF EXISTS board_tiles_tile_type_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.board_tiles ADD CONSTRAINT board_tiles_tile_type_check CHECK ((tile_type = ANY (ARRAY['start'::text, 'bonus'::text, 'neutral'::text, 'reward'::text, 'penalty'::text, 'shortcut'::text, 'challenge'::text, 'checkpoint'::text, 'finish'::text])));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'board_tiles_tile_type_check', 'board_tiles', SQLERRM;
  END;
END
$do$;

-- producao ja era o superconjunto
ALTER TABLE public.boss_battles DROP CONSTRAINT IF EXISTS boss_battles_department_id_fkey;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.boss_battles ADD CONSTRAINT boss_battles_department_id_fkey FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'boss_battles_department_id_fkey', 'boss_battles', SQLERRM;
  END;
END
$do$;

-- producao ja era o superconjunto
ALTER TABLE public.boss_battles DROP CONSTRAINT IF EXISTS boss_battles_total_hp_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.boss_battles ADD CONSTRAINT boss_battles_total_hp_check CHECK ((total_hp >= 1));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'boss_battles_total_hp_check', 'boss_battles', SQLERRM;
  END;
END
$do$;

-- producao ja era o superconjunto
ALTER TABLE public.boss_win_rate_goals DROP CONSTRAINT IF EXISTS boss_win_rate_goals_department_id_fkey;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.boss_win_rate_goals ADD CONSTRAINT boss_win_rate_goals_department_id_fkey FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'boss_win_rate_goals_department_id_fkey', 'boss_win_rate_goals', SQLERRM;
  END;
END
$do$;

-- uniao das duas definicoes
ALTER TABLE public.campaign_result_rows DROP CONSTRAINT IF EXISTS campaign_result_rows_status_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.campaign_result_rows ADD CONSTRAINT campaign_result_rows_status_check CHECK ((status = ANY (ARRAY['valid'::text, 'invalid'::text, 'applied'::text, 'skipped'::text, 'reverted'::text])));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'campaign_result_rows_status_check', 'campaign_result_rows', SQLERRM;
  END;
END
$do$;

-- uniao das duas definicoes
ALTER TABLE public.card_definitions DROP CONSTRAINT IF EXISTS card_definitions_rarity_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.card_definitions ADD CONSTRAINT card_definitions_rarity_check CHECK ((rarity = ANY (ARRAY['common'::text, 'uncommon'::text, 'rare'::text, 'epic'::text, 'legendary'::text])));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'card_definitions_rarity_check', 'card_definitions', SQLERRM;
  END;
END
$do$;

-- producao ja era o superconjunto
ALTER TABLE public.card_packs DROP CONSTRAINT IF EXISTS card_packs_size_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.card_packs ADD CONSTRAINT card_packs_size_check CHECK ((size >= 1));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'card_packs_size_check', 'card_packs', SQLERRM;
  END;
END
$do$;

-- uniao: >= 0 aceita o peso zero que o formulario permite
-- (src/lib/departmentWarConfig.ts:339 exige peso > 0 em AO MENOS UMA metrica)
ALTER TABLE public.department_war_metrics DROP CONSTRAINT IF EXISTS department_war_metrics_weight_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.department_war_metrics ADD CONSTRAINT department_war_metrics_weight_check CHECK ((weight >= (0)::numeric));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'department_war_metrics_weight_check', 'department_war_metrics', SQLERRM;
  END;
END
$do$;

-- uniao das duas definicoes
ALTER TABLE public.engagement_action_playbooks DROP CONSTRAINT IF EXISTS engagement_action_playbooks_priority_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.engagement_action_playbooks ADD CONSTRAINT engagement_action_playbooks_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'engagement_action_playbooks_priority_check', 'engagement_action_playbooks', SQLERRM;
  END;
END
$do$;

-- producao ja era o superconjunto
ALTER TABLE public.engagement_answers DROP CONSTRAINT IF EXISTS engagement_answers_normalized_score_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.engagement_answers ADD CONSTRAINT engagement_answers_normalized_score_check CHECK (((normalized_score IS NULL) OR ((normalized_score >= (0)::numeric) AND (normalized_score <= (10)::numeric))));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'engagement_answers_normalized_score_check', 'engagement_answers', SQLERRM;
  END;
END
$do$;

-- producao ja era o superconjunto
ALTER TABLE public.engagement_cycles DROP CONSTRAINT IF EXISTS engagement_cycles_department_id_fkey;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.engagement_cycles ADD CONSTRAINT engagement_cycles_department_id_fkey FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'engagement_cycles_department_id_fkey', 'engagement_cycles', SQLERRM;
  END;
END
$do$;

-- uniao das duas definicoes
ALTER TABLE public.lightning_quiz_sessions DROP CONSTRAINT IF EXISTS lightning_quiz_sessions_status_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.lightning_quiz_sessions ADD CONSTRAINT lightning_quiz_sessions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'expired'::text, 'finished'::text])));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'lightning_quiz_sessions_status_check', 'lightning_quiz_sessions', SQLERRM;
  END;
END
$do$;

-- producao ja era o superconjunto
ALTER TABLE public.lucky_wheel_prizes DROP CONSTRAINT IF EXISTS lucky_wheel_prizes_weight_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.lucky_wheel_prizes ADD CONSTRAINT lucky_wheel_prizes_weight_check CHECK ((weight >= 1));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'lucky_wheel_prizes_weight_check', 'lucky_wheel_prizes', SQLERRM;
  END;
END
$do$;

-- producao ja era o superconjunto
ALTER TABLE public.lucky_wheel_settings DROP CONSTRAINT IF EXISTS lucky_wheel_settings_id_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.lucky_wheel_settings ADD CONSTRAINT lucky_wheel_settings_id_check CHECK ((id = true));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'lucky_wheel_settings_id_check', 'lucky_wheel_settings', SQLERRM;
  END;
END
$do$;

-- uniao das duas definicoes
ALTER TABLE public.memory_sessions DROP CONSTRAINT IF EXISTS memory_sessions_status_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.memory_sessions ADD CONSTRAINT memory_sessions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'abandoned'::text, 'finished'::text])));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'memory_sessions_status_check', 'memory_sessions', SQLERRM;
  END;
END
$do$;

-- uniao das duas definicoes
ALTER TABLE public.scratch_card_prizes DROP CONSTRAINT IF EXISTS scratch_card_prizes_weight_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.scratch_card_prizes ADD CONSTRAINT scratch_card_prizes_weight_check CHECK (((weight >= (0)::numeric) AND (weight <= (1000000)::numeric)));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'scratch_card_prizes_weight_check', 'scratch_card_prizes', SQLERRM;
  END;
END
$do$;

-- uniao das duas definicoes
ALTER TABLE public.tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_status_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.tournament_matches ADD CONSTRAINT tournament_matches_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'ready'::text, 'active'::text, 'decided'::text, 'bye'::text])));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'tournament_matches_status_check', 'tournament_matches', SQLERRM;
  END;
END
$do$;

-- producao ja era o superconjunto
ALTER TABLE public.wager_budget_settings DROP CONSTRAINT IF EXISTS wager_budget_settings_id_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.wager_budget_settings ADD CONSTRAINT wager_budget_settings_id_check CHECK ((id = true));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'wager_budget_settings_id_check', 'wager_budget_settings', SQLERRM;
  END;
END
$do$;

-- producao ja era o superconjunto
ALTER TABLE public.wager_entries DROP CONSTRAINT IF EXISTS wager_entries_stake_coins_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.wager_entries ADD CONSTRAINT wager_entries_stake_coins_check CHECK ((stake_coins >= 1));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'wager_entries_stake_coins_check', 'wager_entries', SQLERRM;
  END;
END
$do$;

-- uniao das duas definicoes
ALTER TABLE public.wager_integrity_reviews DROP CONSTRAINT IF EXISTS wager_integrity_reviews_status_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.wager_integrity_reviews ADD CONSTRAINT wager_integrity_reviews_status_check CHECK ((status = ANY (ARRAY['investigating'::text, 'cleared'::text, 'sanctioned'::text, 'flagged'::text, 'confirmed'::text, 'false_positive'::text])));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'wager_integrity_reviews_status_check', 'wager_integrity_reviews', SQLERRM;
  END;
END
$do$;

-- producao ja era o superconjunto
ALTER TABLE public.wager_questions DROP CONSTRAINT IF EXISTS wager_questions_base_multiplier_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.wager_questions ADD CONSTRAINT wager_questions_base_multiplier_check CHECK (((base_multiplier >= (1)::numeric) AND (base_multiplier <= (10)::numeric)));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'wager_questions_base_multiplier_check', 'wager_questions', SQLERRM;
  END;
END
$do$;

-- producao ja era o superconjunto
ALTER TABLE public.wager_questions DROP CONSTRAINT IF EXISTS wager_questions_max_stake_check;
DO $do$
BEGIN
  BEGIN
    ALTER TABLE public.wager_questions ADD CONSTRAINT wager_questions_max_stake_check CHECK ((max_stake >= 1));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'nao reaplicada % em %: %', 'wager_questions_max_stake_check', 'wager_questions', SQLERRM;
  END;
END
$do$;
