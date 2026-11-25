-- Traz para o repositorio as 102 constraints que existem em producao e nenhuma migration cria.
--
-- Medicao em 2026-11-25 (pg_constraint dos dois lados, chave tabela+nome): 61 FKs, 35 UNIQUE e
-- 6 CHECK existem em producao e nao no banco reconstruido. Efeito pratico do desvio: um `db
-- reset` recria as tabelas SEM as FKs para auth.users, SEM as unicidades de dedupe_key e SEM
-- alguns CHECK, ou seja, aceitaria orfao e duplicata que producao recusa hoje.
--
-- Cada bloco so adiciona se a constraint ainda nao existir, e captura erro em NOTICE em vez de
-- abortar: se algum dado de ambiente novo violar a regra, o apply continua e o nome fica no log.

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'auction_admin_events_actor_id_fkey' AND conrelid = 'public.auction_admin_events'::regclass) THEN
    BEGIN
      ALTER TABLE public.auction_admin_events ADD CONSTRAINT auction_admin_events_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'auction_admin_events_actor_id_fkey', 'auction_admin_events', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'auction_bids_dedupe_key_key' AND conrelid = 'public.auction_bids'::regclass) THEN
    BEGIN
      ALTER TABLE public.auction_bids ADD CONSTRAINT auction_bids_dedupe_key_key UNIQUE (dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'auction_bids_dedupe_key_key', 'auction_bids', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'auction_bids_user_id_fkey' AND conrelid = 'public.auction_bids'::regclass) THEN
    BEGIN
      ALTER TABLE public.auction_bids ADD CONSTRAINT auction_bids_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'auction_bids_user_id_fkey', 'auction_bids', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'auctions_created_by_fkey' AND conrelid = 'public.auctions'::regclass) THEN
    BEGIN
      ALTER TABLE public.auctions ADD CONSTRAINT auctions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'auctions_created_by_fkey', 'auctions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'auctions_ends_after_starts' AND conrelid = 'public.auctions'::regclass) THEN
    BEGIN
      ALTER TABLE public.auctions ADD CONSTRAINT auctions_ends_after_starts CHECK ((ends_at > starts_at));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'auctions_ends_after_starts', 'auctions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'auctions_winner_id_fkey' AND conrelid = 'public.auctions'::regclass) THEN
    BEGIN
      ALTER TABLE public.auctions ADD CONSTRAINT auctions_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'auctions_winner_id_fkey', 'auctions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bingo_cards_unique' AND conrelid = 'public.bingo_cards'::regclass) THEN
    BEGIN
      ALTER TABLE public.bingo_cards ADD CONSTRAINT bingo_cards_unique UNIQUE (board_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'bingo_cards_unique', 'bingo_cards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bingo_cards_user_id_fkey' AND conrelid = 'public.bingo_cards'::regclass) THEN
    BEGIN
      ALTER TABLE public.bingo_cards ADD CONSTRAINT bingo_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'bingo_cards_user_id_fkey', 'bingo_cards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bingo_marks_unique' AND conrelid = 'public.bingo_marks'::regclass) THEN
    BEGIN
      ALTER TABLE public.bingo_marks ADD CONSTRAINT bingo_marks_unique UNIQUE (card_id, "position");
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'bingo_marks_unique', 'bingo_marks', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bingo_marks_user_id_fkey' AND conrelid = 'public.bingo_marks'::regclass) THEN
    BEGIN
      ALTER TABLE public.bingo_marks ADD CONSTRAINT bingo_marks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'bingo_marks_user_id_fkey', 'bingo_marks', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_moves_dedupe' AND conrelid = 'public.board_moves'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_moves ADD CONSTRAINT board_moves_dedupe UNIQUE (dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_moves_dedupe', 'board_moves', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_moves_user_id_fkey' AND conrelid = 'public.board_moves'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_moves ADD CONSTRAINT board_moves_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_moves_user_id_fkey', 'board_moves', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_player_states_unique' AND conrelid = 'public.board_player_states'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_player_states ADD CONSTRAINT board_player_states_unique UNIQUE (trail_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_player_states_unique', 'board_player_states', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_player_states_user_id_fkey' AND conrelid = 'public.board_player_states'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_player_states ADD CONSTRAINT board_player_states_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_player_states_user_id_fkey', 'board_player_states', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_tiles_unique' AND conrelid = 'public.board_tiles'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_tiles ADD CONSTRAINT board_tiles_unique UNIQUE (trail_id, "position");
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_tiles_unique', 'board_tiles', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_trails_created_by_fkey' AND conrelid = 'public.board_trails'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_trails ADD CONSTRAINT board_trails_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_trails_created_by_fkey', 'board_trails', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_battle_damage_dedupe' AND conrelid = 'public.boss_battle_damage'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_battle_damage ADD CONSTRAINT boss_battle_damage_dedupe UNIQUE (dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_battle_damage_dedupe', 'boss_battle_damage', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_battle_damage_user_id_fkey' AND conrelid = 'public.boss_battle_damage'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_battle_damage ADD CONSTRAINT boss_battle_damage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_battle_damage_user_id_fkey', 'boss_battle_damage', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_battle_rewards_unique' AND conrelid = 'public.boss_battle_rewards'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_battle_rewards ADD CONSTRAINT boss_battle_rewards_unique UNIQUE (battle_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_battle_rewards_unique', 'boss_battle_rewards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_battle_rewards_user_id_fkey' AND conrelid = 'public.boss_battle_rewards'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_battle_rewards ADD CONSTRAINT boss_battle_rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_battle_rewards_user_id_fkey', 'boss_battle_rewards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_battles_created_by_fkey' AND conrelid = 'public.boss_battles'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_battles ADD CONSTRAINT boss_battles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_battles_created_by_fkey', 'boss_battles', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_win_rate_goals_updated_by_fkey' AND conrelid = 'public.boss_win_rate_goals'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_win_rate_goals ADD CONSTRAINT boss_win_rate_goals_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_win_rate_goals_updated_by_fkey', 'boss_win_rate_goals', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_result_rows_dedupe_unique' AND conrelid = 'public.campaign_result_rows'::regclass) THEN
    BEGIN
      ALTER TABLE public.campaign_result_rows ADD CONSTRAINT campaign_result_rows_dedupe_unique UNIQUE (dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'campaign_result_rows_dedupe_unique', 'campaign_result_rows', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_team_members_unique' AND conrelid = 'public.campaign_team_members'::regclass) THEN
    BEGIN
      ALTER TABLE public.campaign_team_members ADD CONSTRAINT campaign_team_members_unique UNIQUE (campaign_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'campaign_team_members_unique', 'campaign_team_members', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_team_members_user_id_fkey' AND conrelid = 'public.campaign_team_members'::regclass) THEN
    BEGIN
      ALTER TABLE public.campaign_team_members ADD CONSTRAINT campaign_team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'campaign_team_members_user_id_fkey', 'campaign_team_members', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_team_split_batches_executed_by_fkey' AND conrelid = 'public.campaign_team_split_batches'::regclass) THEN
    BEGIN
      ALTER TABLE public.campaign_team_split_batches ADD CONSTRAINT campaign_team_split_batches_executed_by_fkey FOREIGN KEY (executed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'campaign_team_split_batches_executed_by_fkey', 'campaign_team_split_batches', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_team_split_batches_reverted_by_fkey' AND conrelid = 'public.campaign_team_split_batches'::regclass) THEN
    BEGIN
      ALTER TABLE public.campaign_team_split_batches ADD CONSTRAINT campaign_team_split_batches_reverted_by_fkey FOREIGN KEY (reverted_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'campaign_team_split_batches_reverted_by_fkey', 'campaign_team_split_batches', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_team_split_batches_share_mode_check' AND conrelid = 'public.campaign_team_split_batches'::regclass) THEN
    BEGIN
      ALTER TABLE public.campaign_team_split_batches ADD CONSTRAINT campaign_team_split_batches_share_mode_check CHECK ((share_mode = ANY (ARRAY['proportional'::text, 'equal'::text, 'position'::text])));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'campaign_team_split_batches_share_mode_check', 'campaign_team_split_batches', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_team_split_batches_status_check' AND conrelid = 'public.campaign_team_split_batches'::regclass) THEN
    BEGIN
      ALTER TABLE public.campaign_team_split_batches ADD CONSTRAINT campaign_team_split_batches_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'reverted'::text])));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'campaign_team_split_batches_status_check', 'campaign_team_split_batches', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_team_split_entries_campaign_id_fkey' AND conrelid = 'public.campaign_team_split_entries'::regclass) THEN
    BEGIN
      ALTER TABLE public.campaign_team_split_entries ADD CONSTRAINT campaign_team_split_entries_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES sales_campaigns(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'campaign_team_split_entries_campaign_id_fkey', 'campaign_team_split_entries', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_team_split_entries_outcome_check' AND conrelid = 'public.campaign_team_split_entries'::regclass) THEN
    BEGIN
      ALTER TABLE public.campaign_team_split_entries ADD CONSTRAINT campaign_team_split_entries_outcome_check CHECK ((outcome = ANY (ARRAY['paid'::text, 'skipped'::text, 'failed'::text])));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'campaign_team_split_entries_outcome_check', 'campaign_team_split_entries', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_team_split_entries_team_id_fkey' AND conrelid = 'public.campaign_team_split_entries'::regclass) THEN
    BEGIN
      ALTER TABLE public.campaign_team_split_entries ADD CONSTRAINT campaign_team_split_entries_team_id_fkey FOREIGN KEY (team_id) REFERENCES campaign_teams(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'campaign_team_split_entries_team_id_fkey', 'campaign_team_split_entries', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_team_split_entries_user_id_fkey' AND conrelid = 'public.campaign_team_split_entries'::regclass) THEN
    BEGIN
      ALTER TABLE public.campaign_team_split_entries ADD CONSTRAINT campaign_team_split_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'campaign_team_split_entries_user_id_fkey', 'campaign_team_split_entries', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_teams_created_by_fkey' AND conrelid = 'public.campaign_teams'::regclass) THEN
    BEGIN
      ALTER TABLE public.campaign_teams ADD CONSTRAINT campaign_teams_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'campaign_teams_created_by_fkey', 'campaign_teams', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_packs_dedupe_unique' AND conrelid = 'public.card_packs'::regclass) THEN
    BEGIN
      ALTER TABLE public.card_packs ADD CONSTRAINT card_packs_dedupe_unique UNIQUE (dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'card_packs_dedupe_unique', 'card_packs', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_packs_user_id_fkey' AND conrelid = 'public.card_packs'::regclass) THEN
    BEGIN
      ALTER TABLE public.card_packs ADD CONSTRAINT card_packs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'card_packs_user_id_fkey', 'card_packs', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_set_claims_dedupe' AND conrelid = 'public.card_set_claims'::regclass) THEN
    BEGIN
      ALTER TABLE public.card_set_claims ADD CONSTRAINT card_set_claims_dedupe UNIQUE (dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'card_set_claims_dedupe', 'card_set_claims', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_trades_proposer_id_fkey' AND conrelid = 'public.card_trades'::regclass) THEN
    BEGIN
      ALTER TABLE public.card_trades ADD CONSTRAINT card_trades_proposer_id_fkey FOREIGN KEY (proposer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'card_trades_proposer_id_fkey', 'card_trades', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_trades_responder_id_fkey' AND conrelid = 'public.card_trades'::regclass) THEN
    BEGIN
      ALTER TABLE public.card_trades ADD CONSTRAINT card_trades_responder_id_fkey FOREIGN KEY (responder_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'card_trades_responder_id_fkey', 'card_trades', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'department_war_contributions_user_id_fkey' AND conrelid = 'public.department_war_contributions'::regclass) THEN
    BEGIN
      ALTER TABLE public.department_war_contributions ADD CONSTRAINT department_war_contributions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'department_war_contributions_user_id_fkey', 'department_war_contributions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dept_war_contributions_dedupe' AND conrelid = 'public.department_war_contributions'::regclass) THEN
    BEGIN
      ALTER TABLE public.department_war_contributions ADD CONSTRAINT dept_war_contributions_dedupe UNIQUE (dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'dept_war_contributions_dedupe', 'department_war_contributions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dept_war_departments_unique' AND conrelid = 'public.department_war_departments'::regclass) THEN
    BEGIN
      ALTER TABLE public.department_war_departments ADD CONSTRAINT dept_war_departments_unique UNIQUE (war_id, department_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'dept_war_departments_unique', 'department_war_departments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dept_war_metrics_unique' AND conrelid = 'public.department_war_metrics'::regclass) THEN
    BEGIN
      ALTER TABLE public.department_war_metrics ADD CONSTRAINT dept_war_metrics_unique UNIQUE (war_id, metric_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'dept_war_metrics_unique', 'department_war_metrics', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dept_war_results_unique' AND conrelid = 'public.department_war_results'::regclass) THEN
    BEGIN
      ALTER TABLE public.department_war_results ADD CONSTRAINT dept_war_results_unique UNIQUE (war_id, department_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'dept_war_results_unique', 'department_war_results', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'department_wars_created_by_fkey' AND conrelid = 'public.department_wars'::regclass) THEN
    BEGIN
      ALTER TABLE public.department_wars ADD CONSTRAINT department_wars_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'department_wars_created_by_fkey', 'department_wars', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_answers_unique' AND conrelid = 'public.engagement_answers'::regclass) THEN
    BEGIN
      ALTER TABLE public.engagement_answers ADD CONSTRAINT engagement_answers_unique UNIQUE (cycle_id, question_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'engagement_answers_unique', 'engagement_answers', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_answers_user_id_fkey' AND conrelid = 'public.engagement_answers'::regclass) THEN
    BEGIN
      ALTER TABLE public.engagement_answers ADD CONSTRAINT engagement_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'engagement_answers_user_id_fkey', 'engagement_answers', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_cycles_created_by_fkey' AND conrelid = 'public.engagement_cycles'::regclass) THEN
    BEGIN
      ALTER TABLE public.engagement_cycles ADD CONSTRAINT engagement_cycles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'engagement_cycles_created_by_fkey', 'engagement_cycles', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_question_assignments_unique' AND conrelid = 'public.engagement_question_assignments'::regclass) THEN
    BEGIN
      ALTER TABLE public.engagement_question_assignments ADD CONSTRAINT engagement_question_assignments_unique UNIQUE (cycle_id, user_id, question_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'engagement_question_assignments_unique', 'engagement_question_assignments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_question_assignments_user_id_fkey' AND conrelid = 'public.engagement_question_assignments'::regclass) THEN
    BEGIN
      ALTER TABLE public.engagement_question_assignments ADD CONSTRAINT engagement_question_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'engagement_question_assignments_user_id_fkey', 'engagement_question_assignments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lightning_quiz_answers_unique' AND conrelid = 'public.lightning_quiz_answers'::regclass) THEN
    BEGIN
      ALTER TABLE public.lightning_quiz_answers ADD CONSTRAINT lightning_quiz_answers_unique UNIQUE (session_id, idx);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lightning_quiz_answers_unique', 'lightning_quiz_answers', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lightning_quiz_answers_user_id_fkey' AND conrelid = 'public.lightning_quiz_answers'::regclass) THEN
    BEGIN
      ALTER TABLE public.lightning_quiz_answers ADD CONSTRAINT lightning_quiz_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lightning_quiz_answers_user_id_fkey', 'lightning_quiz_answers', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lightning_quiz_sessions_dedupe' AND conrelid = 'public.lightning_quiz_sessions'::regclass) THEN
    BEGIN
      ALTER TABLE public.lightning_quiz_sessions ADD CONSTRAINT lightning_quiz_sessions_dedupe UNIQUE (dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lightning_quiz_sessions_dedupe', 'lightning_quiz_sessions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lightning_quiz_sessions_user_id_fkey' AND conrelid = 'public.lightning_quiz_sessions'::regclass) THEN
    BEGIN
      ALTER TABLE public.lightning_quiz_sessions ADD CONSTRAINT lightning_quiz_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lightning_quiz_sessions_user_id_fkey', 'lightning_quiz_sessions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lucky_wheel_prize_audit_changed_by_fkey' AND conrelid = 'public.lucky_wheel_prize_audit'::regclass) THEN
    BEGIN
      ALTER TABLE public.lucky_wheel_prize_audit ADD CONSTRAINT lucky_wheel_prize_audit_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lucky_wheel_prize_audit_changed_by_fkey', 'lucky_wheel_prize_audit', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lucky_wheel_prize_audit_prize_id_fkey' AND conrelid = 'public.lucky_wheel_prize_audit'::regclass) THEN
    BEGIN
      ALTER TABLE public.lucky_wheel_prize_audit ADD CONSTRAINT lucky_wheel_prize_audit_prize_id_fkey FOREIGN KEY (prize_id) REFERENCES lucky_wheel_prizes(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lucky_wheel_prize_audit_prize_id_fkey', 'lucky_wheel_prize_audit', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lucky_wheel_settings_audit_changed_by_fkey' AND conrelid = 'public.lucky_wheel_settings_audit'::regclass) THEN
    BEGIN
      ALTER TABLE public.lucky_wheel_settings_audit ADD CONSTRAINT lucky_wheel_settings_audit_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lucky_wheel_settings_audit_changed_by_fkey', 'lucky_wheel_settings_audit', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lucky_wheel_settings_updated_by_fkey' AND conrelid = 'public.lucky_wheel_settings'::regclass) THEN
    BEGIN
      ALTER TABLE public.lucky_wheel_settings ADD CONSTRAINT lucky_wheel_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lucky_wheel_settings_updated_by_fkey', 'lucky_wheel_settings', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lucky_wheel_spins_dedupe_key_unique' AND conrelid = 'public.lucky_wheel_spins'::regclass) THEN
    BEGIN
      ALTER TABLE public.lucky_wheel_spins ADD CONSTRAINT lucky_wheel_spins_dedupe_key_unique UNIQUE (dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lucky_wheel_spins_dedupe_key_unique', 'lucky_wheel_spins', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lucky_wheel_spins_one_per_day' AND conrelid = 'public.lucky_wheel_spins'::regclass) THEN
    BEGIN
      ALTER TABLE public.lucky_wheel_spins ADD CONSTRAINT lucky_wheel_spins_one_per_day UNIQUE (user_id, spin_date);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lucky_wheel_spins_one_per_day', 'lucky_wheel_spins', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lucky_wheel_whatif_snapshots_created_by_fkey' AND conrelid = 'public.lucky_wheel_whatif_snapshots'::regclass) THEN
    BEGIN
      ALTER TABLE public.lucky_wheel_whatif_snapshots ADD CONSTRAINT lucky_wheel_whatif_snapshots_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lucky_wheel_whatif_snapshots_created_by_fkey', 'lucky_wheel_whatif_snapshots', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_decks_created_by_fkey' AND conrelid = 'public.memory_decks'::regclass) THEN
    BEGIN
      ALTER TABLE public.memory_decks ADD CONSTRAINT memory_decks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'memory_decks_created_by_fkey', 'memory_decks', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memory_sessions_user_id_fkey' AND conrelid = 'public.memory_sessions'::regclass) THEN
    BEGIN
      ALTER TABLE public.memory_sessions ADD CONSTRAINT memory_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'memory_sessions_user_id_fkey', 'memory_sessions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nr1_factor_mappings_unique' AND conrelid = 'public.nr1_factor_mappings'::regclass) THEN
    BEGIN
      ALTER TABLE public.nr1_factor_mappings ADD CONSTRAINT nr1_factor_mappings_unique UNIQUE (category_id, factor_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'nr1_factor_mappings_unique', 'nr1_factor_mappings', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'opinion_supports_unique' AND conrelid = 'public.opinion_supports'::regclass) THEN
    BEGIN
      ALTER TABLE public.opinion_supports ADD CONSTRAINT opinion_supports_unique UNIQUE (opinion_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'opinion_supports_unique', 'opinion_supports', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'opinion_supports_user_id_fkey' AND conrelid = 'public.opinion_supports'::regclass) THEN
    BEGIN
      ALTER TABLE public.opinion_supports ADD CONSTRAINT opinion_supports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'opinion_supports_user_id_fkey', 'opinion_supports', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prediction_admin_events_actor_id_fkey' AND conrelid = 'public.prediction_admin_events'::regclass) THEN
    BEGIN
      ALTER TABLE public.prediction_admin_events ADD CONSTRAINT prediction_admin_events_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'prediction_admin_events_actor_id_fkey', 'prediction_admin_events', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prediction_markets_created_by_fkey' AND conrelid = 'public.prediction_markets'::regclass) THEN
    BEGIN
      ALTER TABLE public.prediction_markets ADD CONSTRAINT prediction_markets_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'prediction_markets_created_by_fkey', 'prediction_markets', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prediction_markets_settled_by_fkey' AND conrelid = 'public.prediction_markets'::regclass) THEN
    BEGIN
      ALTER TABLE public.prediction_markets ADD CONSTRAINT prediction_markets_settled_by_fkey FOREIGN KEY (settled_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'prediction_markets_settled_by_fkey', 'prediction_markets', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prediction_markets_winning_option_fk' AND conrelid = 'public.prediction_markets'::regclass) THEN
    BEGIN
      ALTER TABLE public.prediction_markets ADD CONSTRAINT prediction_markets_winning_option_fk FOREIGN KEY (winning_option_id) REFERENCES prediction_options(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'prediction_markets_winning_option_fk', 'prediction_markets', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prediction_stakes_dedupe_key_key' AND conrelid = 'public.prediction_stakes'::regclass) THEN
    BEGIN
      ALTER TABLE public.prediction_stakes ADD CONSTRAINT prediction_stakes_dedupe_key_key UNIQUE (dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'prediction_stakes_dedupe_key_key', 'prediction_stakes', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prediction_stakes_one_option_per_user' AND conrelid = 'public.prediction_stakes'::regclass) THEN
    BEGIN
      ALTER TABLE public.prediction_stakes ADD CONSTRAINT prediction_stakes_one_option_per_user UNIQUE (market_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'prediction_stakes_one_option_per_user', 'prediction_stakes', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prediction_stakes_user_id_fkey' AND conrelid = 'public.prediction_stakes'::regclass) THEN
    BEGIN
      ALTER TABLE public.prediction_stakes ADD CONSTRAINT prediction_stakes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'prediction_stakes_user_id_fkey', 'prediction_stakes', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_approvals_actor_id_fkey' AND conrelid = 'public.purchase_approvals'::regclass) THEN
    BEGIN
      ALTER TABLE public.purchase_approvals ADD CONSTRAINT purchase_approvals_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'purchase_approvals_actor_id_fkey', 'purchase_approvals', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'push_outbox_dedupe_key_unique' AND conrelid = 'public.push_outbox'::regclass) THEN
    BEGIN
      ALTER TABLE public.push_outbox ADD CONSTRAINT push_outbox_dedupe_key_unique UNIQUE (dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'push_outbox_dedupe_key_unique', 'push_outbox', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'push_outbox_user_id_fkey' AND conrelid = 'public.push_outbox'::regclass) THEN
    BEGIN
      ALTER TABLE public.push_outbox ADD CONSTRAINT push_outbox_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'push_outbox_user_id_fkey', 'push_outbox', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scratch_cards_dedupe_key_unique' AND conrelid = 'public.scratch_cards'::regclass) THEN
    BEGIN
      ALTER TABLE public.scratch_cards ADD CONSTRAINT scratch_cards_dedupe_key_unique UNIQUE (dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'scratch_cards_dedupe_key_unique', 'scratch_cards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scratch_cards_prize_type_check' AND conrelid = 'public.scratch_cards'::regclass) THEN
    BEGIN
      ALTER TABLE public.scratch_cards ADD CONSTRAINT scratch_cards_prize_type_check CHECK ((prize_type = ANY (ARRAY['coins'::text, 'xp'::text, 'nothing'::text])));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'scratch_cards_prize_type_check', 'scratch_cards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scratch_cards_rarity_check' AND conrelid = 'public.scratch_cards'::regclass) THEN
    BEGIN
      ALTER TABLE public.scratch_cards ADD CONSTRAINT scratch_cards_rarity_check CHECK ((rarity = ANY (ARRAY['common'::text, 'rare'::text, 'epic'::text, 'legendary'::text])));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'scratch_cards_rarity_check', 'scratch_cards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scratch_cards_user_id_fkey' AND conrelid = 'public.scratch_cards'::regclass) THEN
    BEGIN
      ALTER TABLE public.scratch_cards ADD CONSTRAINT scratch_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'scratch_cards_user_id_fkey', 'scratch_cards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sequence_attempts_once_per_day' AND conrelid = 'public.sequence_attempts'::regclass) THEN
    BEGIN
      ALTER TABLE public.sequence_attempts ADD CONSTRAINT sequence_attempts_once_per_day UNIQUE (user_id, procedure_id, attempt_date);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'sequence_attempts_once_per_day', 'sequence_attempts', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sequence_attempts_user_id_fkey' AND conrelid = 'public.sequence_attempts'::regclass) THEN
    BEGIN
      ALTER TABLE public.sequence_attempts ADD CONSTRAINT sequence_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'sequence_attempts_user_id_fkey', 'sequence_attempts', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sequence_procedures_created_by_fkey' AND conrelid = 'public.sequence_procedures'::regclass) THEN
    BEGIN
      ALTER TABLE public.sequence_procedures ADD CONSTRAINT sequence_procedures_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'sequence_procedures_created_by_fkey', 'sequence_procedures', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sequence_steps_unique' AND conrelid = 'public.sequence_steps'::regclass) THEN
    BEGIN
      ALTER TABLE public.sequence_steps ADD CONSTRAINT sequence_steps_unique UNIQUE (procedure_id, "position");
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'sequence_steps_unique', 'sequence_steps', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shop_purchases_first_approver_id_fkey' AND conrelid = 'public.shop_purchases'::regclass) THEN
    BEGIN
      ALTER TABLE public.shop_purchases ADD CONSTRAINT shop_purchases_first_approver_id_fkey FOREIGN KEY (first_approver_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'shop_purchases_first_approver_id_fkey', 'shop_purchases', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_matches_unique' AND conrelid = 'public.tournament_matches'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournament_matches ADD CONSTRAINT tournament_matches_unique UNIQUE (tournament_id, round, slot);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournament_matches_unique', 'tournament_matches', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_participants_unique' AND conrelid = 'public.tournament_participants'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournament_participants ADD CONSTRAINT tournament_participants_unique UNIQUE (tournament_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournament_participants_unique', 'tournament_participants', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_participants_user_id_fkey' AND conrelid = 'public.tournament_participants'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournament_participants ADD CONSTRAINT tournament_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournament_participants_user_id_fkey', 'tournament_participants', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_champion_user_id_fkey' AND conrelid = 'public.tournaments'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_champion_user_id_fkey FOREIGN KEY (champion_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournaments_champion_user_id_fkey', 'tournaments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_created_by_fkey' AND conrelid = 'public.tournaments'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournaments_created_by_fkey', 'tournaments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_runner_up_user_id_fkey' AND conrelid = 'public.tournaments'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_runner_up_user_id_fkey FOREIGN KEY (runner_up_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournaments_runner_up_user_id_fkey', 'tournaments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_cards_unique' AND conrelid = 'public.user_cards'::regclass) THEN
    BEGIN
      ALTER TABLE public.user_cards ADD CONSTRAINT user_cards_unique UNIQUE (user_id, card_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'user_cards_unique', 'user_cards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_cards_user_id_fkey' AND conrelid = 'public.user_cards'::regclass) THEN
    BEGIN
      ALTER TABLE public.user_cards ADD CONSTRAINT user_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'user_cards_user_id_fkey', 'user_cards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wager_budget_settings_updated_by_fkey' AND conrelid = 'public.wager_budget_settings'::regclass) THEN
    BEGIN
      ALTER TABLE public.wager_budget_settings ADD CONSTRAINT wager_budget_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'wager_budget_settings_updated_by_fkey', 'wager_budget_settings', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wager_entries_one_per_question' AND conrelid = 'public.wager_entries'::regclass) THEN
    BEGIN
      ALTER TABLE public.wager_entries ADD CONSTRAINT wager_entries_one_per_question UNIQUE (question_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'wager_entries_one_per_question', 'wager_entries', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wager_entries_user_id_fkey' AND conrelid = 'public.wager_entries'::regclass) THEN
    BEGIN
      ALTER TABLE public.wager_entries ADD CONSTRAINT wager_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'wager_entries_user_id_fkey', 'wager_entries', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wager_integrity_review_events_changed_by_fkey' AND conrelid = 'public.wager_integrity_review_events'::regclass) THEN
    BEGIN
      ALTER TABLE public.wager_integrity_review_events ADD CONSTRAINT wager_integrity_review_events_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'wager_integrity_review_events_changed_by_fkey', 'wager_integrity_review_events', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wager_integrity_review_events_target_user_id_fkey' AND conrelid = 'public.wager_integrity_review_events'::regclass) THEN
    BEGIN
      ALTER TABLE public.wager_integrity_review_events ADD CONSTRAINT wager_integrity_review_events_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'wager_integrity_review_events_target_user_id_fkey', 'wager_integrity_review_events', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wager_integrity_reviews_reviewed_by_fkey' AND conrelid = 'public.wager_integrity_reviews'::regclass) THEN
    BEGIN
      ALTER TABLE public.wager_integrity_reviews ADD CONSTRAINT wager_integrity_reviews_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'wager_integrity_reviews_reviewed_by_fkey', 'wager_integrity_reviews', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wager_integrity_reviews_target_user_id_fkey' AND conrelid = 'public.wager_integrity_reviews'::regclass) THEN
    BEGIN
      ALTER TABLE public.wager_integrity_reviews ADD CONSTRAINT wager_integrity_reviews_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'wager_integrity_reviews_target_user_id_fkey', 'wager_integrity_reviews', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wager_questions_created_by_fkey' AND conrelid = 'public.wager_questions'::regclass) THEN
    BEGIN
      ALTER TABLE public.wager_questions ADD CONSTRAINT wager_questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'wager_questions_created_by_fkey', 'wager_questions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wager_questions_scheduled_date_key' AND conrelid = 'public.wager_questions'::regclass) THEN
    BEGIN
      ALTER TABLE public.wager_questions ADD CONSTRAINT wager_questions_scheduled_date_key UNIQUE (scheduled_date);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'wager_questions_scheduled_date_key', 'wager_questions', SQLERRM;
    END;
  END IF;
END
$do$;
