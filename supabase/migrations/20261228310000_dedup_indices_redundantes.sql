-- Deduplicacao dos indices fisicamente redundantes: 46 pares com a mesma definicao
-- (`pg_get_indexdef` identico depois de remover o nome do indice, a qualificacao `extensions.`
-- e os espacos). Medido em producao (eidsaqymojyuhprobfpn) e no rebuild em 2026-11-25.
--
-- Por que remover: indice redundante paga escrita em todo INSERT/UPDATE da tabela;
-- no `push_outbox` o `dedupe_key` tem duas arvores unicas identicas, por exemplo.
--
-- Seguranca da lista:
--   * nenhum dos removidos e alvo de foreign key (`pg_constraint.conindid` com contype = f: 0);
--   * 20 deles sao o indice de uma constraint UNIQUE: a constraint e removida e a unicidade
--     continua garantida pelo par que fica (mesmas colunas, mesmo predicado);
--   * o par que fica tem `pg_get_indexdef` identico ao removido (conferido um a um);
--   * nenhum nome removido aparece em `src/`, `supabase/functions/` ou `scripts/` e o
--     repositorio nao usa `ON CONFLICT ON CONSTRAINT` em lugar nenhum.
--
-- Idempotente: cada par so e removido se o par que fica existir (senao o indice seria a ultima
-- copia da unicidade) e as remocoes usam IF EXISTS / checagem de catalogo.

DO $dedup$
DECLARE
  r record;
  v_removidos int := 0;
  v_pulados int := 0;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('bingo_board_tasks', 'idx_bingo_board_tasks', 'idx_bingo_board_tasks_board', false),
      ('bingo_cards', 'bingo_cards_unique', 'bingo_cards_unique_per_board', true),
      ('bingo_marks', 'bingo_marks_unique_cell', 'bingo_marks_unique', true),
      ('board_moves', 'board_moves_dedupe', 'board_moves_dedupe_key_key', true),
      ('board_moves', 'idx_board_moves_trail_user', 'idx_board_moves_user_trail', false),
      ('board_player_states', 'board_player_states_unique', 'board_player_states_trail_id_user_id_key', true),
      ('board_tiles', 'board_tiles_unique', 'board_tiles_trail_id_position_key', true),
      ('board_tiles', 'idx_board_tiles', 'idx_board_tiles_trail', false),
      ('boss_battle_damage', 'idx_boss_damage_battle_created', 'idx_boss_battle_damage_battle', false),
      ('boss_battle_damage', 'idx_boss_damage_battle_user', 'idx_boss_battle_damage_battle_user', false),
      ('boss_battle_rewards', 'boss_battle_rewards_unique', 'boss_battle_rewards_battle_id_user_id_key', true),
      ('campaign_team_members', 'campaign_team_members_unique_per_campaign', 'campaign_team_members_unique', true),
      ('campaign_team_members', 'idx_campaign_team_members_team', 'idx_campaign_team_members', false),
      ('campaign_team_split_batches', 'idx_team_split_batches_campaign', 'idx_campaign_team_split_batches', false),
      ('card_set_claims', 'card_set_claims_dedupe_unique', 'card_set_claims_dedupe', true),
      ('department_war_contributions', 'idx_dept_war_contributions_war', 'idx_war_contrib_war_dept', false),
      ('department_war_departments', 'dept_war_departments_unique', 'department_war_departments_war_id_department_id_key', true),
      ('department_war_metrics', 'dept_war_metrics_unique', 'department_war_metrics_war_id_metric_key_key', true),
      ('department_war_results', 'dept_war_results_unique', 'department_war_results_war_id_department_id_key', true),
      ('department_war_results', 'idx_war_results_war', 'idx_dept_war_results', false),
      ('department_wars', 'idx_department_wars_status_ends_at', 'idx_department_wars_status', false),
      ('engagement_answers', 'engagement_answers_unique', 'engagement_answers_cycle_id_question_id_user_id_key', true),
      ('engagement_question_assignments', 'engagement_question_assignments_unique', 'engagement_question_assignment_cycle_id_user_id_question_id_key', true),
      ('lightning_quiz_answers', 'lightning_quiz_answers_unique', 'lightning_answers_session_idx_uidx', false),
      ('lightning_quiz_questions', 'lightning_questions_active_idx', 'idx_lightning_quiz_questions_active', false),
      ('lightning_quiz_sessions', 'idx_lightning_quiz_sessions_user', 'lightning_sessions_user_created_idx', false),
      ('lucky_wheel_prize_audit', 'idx_lucky_wheel_prize_audit_prize', 'lucky_wheel_prize_audit_prize_idx', false),
      ('memory_sessions', 'idx_memory_sessions_user', 'idx_memory_sessions_user_date', false),
      ('nr1_factor_mappings', 'idx_nr1_map_category', 'idx_nr1_factor_mappings', false),
      ('nr1_factor_mappings', 'nr1_factor_mappings_unique', 'nr1_factor_mappings_category_id_factor_id_key', true),
      ('opinion_supports', 'idx_opinion_supports_opinion', 'idx_opinion_supports', false),
      ('opinion_supports', 'opinion_supports_unique', 'opinion_supports_opinion_id_user_id_key', true),
      ('org_members', 'idx_org_members_org_id', 'idx_org_members_org', false),
      ('org_members', 'idx_org_members_user_id', 'idx_org_members_user', false),
      ('org_members', 'org_members_org_id_user_id_key', 'idx_org_members_org_user', false),
      ('organizations', 'organizations_slug_key', 'idx_organizations_slug', false),
      ('push_outbox', 'push_outbox_dedupe_key_unique', 'push_outbox_dedupe_key_key', true),
      ('push_outbox_health_snapshots', 'idx_push_outbox_health_snapshots', 'idx_push_outbox_health_created', false),
      ('push_sync_events', 'idx_push_sync_events_user', 'push_sync_events_user_recent_idx', false),
      ('quest_assignments', 'idx_quest_assignments_user_id', 'idx_quest_assignments_user', false),
      ('tournament_matches', 'tournament_matches_unique', 'tournament_matches_tournament_id_round_slot_key', true),
      ('tournament_participants', 'idx_tournament_participants', 'idx_tournament_participants_tid', false),
      ('tournament_participants', 'tournament_participants_unique', 'tournament_participants_tournament_id_user_id_key', true),
      ('user_cards', 'user_cards_unique', 'user_cards_user_id_card_id_key', true),
      ('wager_entries', 'idx_wager_entries_user_date', 'idx_wager_entries_user', false),
      ('wager_entries', 'wager_entries_question_id_user_id_key', 'wager_entries_one_per_question', true)
    ) AS t(tabela, fica, sai, sai_e_constraint)
  LOOP
    IF to_regclass('public.' || r.fica) IS NULL THEN
      RAISE NOTICE 'dedup: par ausente nesta base, preservando % (o par % nao existe)', r.sai, r.fica;
      v_pulados := v_pulados + 1;
      CONTINUE;
    END IF;
    IF r.sai_e_constraint THEN
      IF EXISTS (
        SELECT 1 FROM pg_constraint c
        WHERE c.conname = r.sai AND c.conrelid = to_regclass('public.' || r.tabela)
      ) THEN
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.tabela, r.sai);
        v_removidos := v_removidos + 1;
      END IF;
    ELSIF to_regclass('public.' || r.sai) IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = to_regclass('public.' || r.sai)) THEN
      EXECUTE format('DROP INDEX public.%I', r.sai);
      v_removidos := v_removidos + 1;
    END IF;
  END LOOP;
  RAISE NOTICE 'dedup de indices: % removido(s), % pulado(s)', v_removidos, v_pulados;
END
$dedup$;
