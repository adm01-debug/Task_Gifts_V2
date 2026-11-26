-- Deduplicacao dos indices fisicamente redundantes: 46 pares com a mesma definicao
-- (`pg_get_indexdef` identico depois de remover o nome do indice, a qualificacao `extensions.`
-- e os espacos). Medido em producao (eidsaqymojyuhprobfpn) e no rebuild em 2026-11-25.
--
-- Por que remover: indice redundante paga escrita em todo INSERT/UPDATE da tabela;
-- no `push_outbox` o `dedupe_key` tem duas arvores unicas identicas, por exemplo.
--
-- Seguranca da lista (medida antes de escrever o arquivo):
--   * nenhum dos removidos e alvo de foreign key (`pg_constraint.conindid` com contype = f: 0);
--   * 20 deles sao o indice de uma constraint UNIQUE: a constraint e removida e a unicidade
--     continua garantida pelo par que fica (mesmas colunas, mesmo predicado - conferido um a um);
--   * nenhum nome removido aparece em `src/`, `supabase/functions/` ou `scripts/` e o
--     repositorio nao usa `ON CONFLICT ON CONSTRAINT` em lugar nenhum.
--
-- Guarda por par (nao confia so no nome):
--   * o par que fica tem de existir, estar na MESMA tabela, com `indisvalid` e `indisready`
--     verdadeiros, e a definicao normalizada (`pg_get_indexdef` sem o nome do indice, sem
--     `extensions.` e sem espacos) tem de ser IGUAL a do que sai, com o mesmo `indisunique`.
--     Qualquer divergencia deixa os DOIS no lugar e conta em "divergente";
--   * o que sai e removido por `ALTER TABLE ... DROP CONSTRAINT` quando e o indice de uma
--     constraint (conferido em `pg_constraint.conname`/`conrelid`) ou por `DROP INDEX` quando
--     nao e indice de constraint nenhuma.
--
-- Idempotente: rodar 2x nao faz nada na segunda vez (os removidos ja nao existem) e o bloco
-- inteiro roda numa transacao - ou remove os 46, ou nao remove nenhum.
--
-- `lock_timeout` de 5s: cada DROP INDEX / DROP CONSTRAINT pega ACCESS EXCLUSIVE na tabela e o
-- lock fica retido ate o fim da transacao; sem limite, um bloco longo esperando pela tabela 46
-- seguraria os locks das 45 anteriores. Com o limite, a migration falha inteira (rollback, nada
-- vai para o ledger) e e retentavel depois, em vez de arrastar bloqueio na base viva.
--
-- Cuidado com a ORDEM: se uma base aplicar ESTA migration ANTES das migrations da PR #174 (as
-- que criam os 46 indices que ficam), os pares ausentes sao pulados de proposito - remover o
-- que sobrou apagaria a unica copia da unicidade. Como a versao fica registrada no ledger, o
-- CLI nao roda este arquivo de novo nessa base: os pares que "chegarem depois" precisam de um
-- arquivo de dedup novo (a guarda os anota como pulados). Neste repositorio a ordem e garantida
-- pela versao: `20261228300000` < `20261228310000`.

SET lock_timeout = '5s';

DO $dedup$
DECLARE
  r record;
  v_removidos int := 0;
  v_pulados int := 0;
  v_divergentes int := 0;
  v_ndef_fica text;
  v_ndef_sai text;
  v_fica_ok boolean;
  v_fica_uniq boolean;
  v_sai_uniq boolean;
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
    SELECT regexp_replace(regexp_replace(regexp_replace(pg_get_indexdef(i.indexrelid), 'INDEX \S+ ON', 'INDEX ON'), 'extensions\.', ''), '[[:space:]]+', '', 'g'),
           i.indisvalid AND i.indisready,
           i.indisunique
      INTO v_ndef_fica, v_fica_ok, v_fica_uniq
      FROM pg_index i
      JOIN pg_class t ON t.oid = i.indrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
     WHERE n.nspname = 'public'
       AND t.relname = r.tabela
       AND i.indexrelid = to_regclass('public.' || r.fica);

    IF v_ndef_fica IS NULL THEN
      RAISE NOTICE 'dedup: par % ausente nesta base (ou em outra tabela), preservando %', r.fica, r.sai;
      v_pulados := v_pulados + 1;
      CONTINUE;
    END IF;

    SELECT regexp_replace(regexp_replace(regexp_replace(pg_get_indexdef(i.indexrelid), 'INDEX \S+ ON', 'INDEX ON'), 'extensions\.', ''), '[[:space:]]+', '', 'g'),
           i.indisunique
      INTO v_ndef_sai, v_sai_uniq
      FROM pg_index i
      JOIN pg_class t ON t.oid = i.indrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
     WHERE n.nspname = 'public'
       AND t.relname = r.tabela
       AND i.indexrelid = to_regclass('public.' || r.sai);

    IF v_ndef_sai IS NULL THEN
      CONTINUE;  -- ja limpo nesta base (ou o nome nem existe)
    END IF;

    IF v_ndef_sai <> v_ndef_fica OR NOT v_fica_ok OR v_sai_uniq <> v_fica_uniq THEN
      RAISE WARNING 'dedup: % nao e equivalente a % (fica_indisvalid_ou_nao_pronto=%, unico saiu/ficou=%/%), preservando os dois',
        r.sai, r.fica, NOT v_fica_ok, v_sai_uniq, v_fica_uniq;
      v_divergentes := v_divergentes + 1;
      CONTINUE;
    END IF;

    IF r.sai_e_constraint AND EXISTS (
      SELECT 1 FROM pg_constraint c
      WHERE c.conname = r.sai AND c.conrelid = to_regclass('public.' || r.tabela)
    ) THEN
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.tabela, r.sai);
      v_removidos := v_removidos + 1;
    ELSIF NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = to_regclass('public.' || r.sai)) THEN
      EXECUTE format('DROP INDEX public.%I', r.sai);
      v_removidos := v_removidos + 1;
    ELSE
      RAISE WARNING 'dedup: % e o indice de uma constraint fora da lista esperada, preservando', r.sai;
      v_divergentes := v_divergentes + 1;
    END IF;
  END LOOP;
  RAISE NOTICE 'dedup de indices: % removido(s), % pulado(s), % divergente(s)', v_removidos, v_pulados, v_divergentes;
END
$dedup$;
