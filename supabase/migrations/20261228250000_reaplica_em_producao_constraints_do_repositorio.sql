-- Reaplica em producao as 135 constraints que o repositorio define e o banco vivo nao tem.
--
-- Medicao em 2026-11-25: 105 CHECK e 30 UNIQUE existem no banco reconstruido e nao em producao.
-- Sao guardas que nasceram em migrations marcadas como aplicadas no ledger, mas cujo DDL nao
-- chegou a rodar no banco vivo - o mesmo desvio ja corrigido para funcoes (20261228170000) e
-- indices (20261228231000).
--
-- Cada bloco valida os dados existentes: se alguma linha de producao violar a regra, o erro e
-- capturado como NOTICE e a constraint nao entra - nada e apagado nem corrigido a forca.

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'action_plans_source_check' AND conrelid = 'public.action_plans'::regclass) THEN
    BEGIN
      ALTER TABLE public.action_plans ADD CONSTRAINT action_plans_source_check CHECK ((source = ANY (ARRAY['manual'::text, 'engagement_factor'::text, 'climate_survey'::text, 'nine_box'::text, 'nr1_category'::text])));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'action_plans_source_check', 'action_plans', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'auction_bids_auction_id_user_id_key' AND conrelid = 'public.auction_bids'::regclass) THEN
    BEGIN
      ALTER TABLE public.auction_bids ADD CONSTRAINT auction_bids_auction_id_user_id_key UNIQUE (auction_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'auction_bids_auction_id_user_id_key', 'auction_bids', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'auction_bids_escrow_coins_check' AND conrelid = 'public.auction_bids'::regclass) THEN
    BEGIN
      ALTER TABLE public.auction_bids ADD CONSTRAINT auction_bids_escrow_coins_check CHECK ((escrow_coins >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'auction_bids_escrow_coins_check', 'auction_bids', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bingo_board_tasks_target_value_check' AND conrelid = 'public.bingo_board_tasks'::regclass) THEN
    BEGIN
      ALTER TABLE public.bingo_board_tasks ADD CONSTRAINT bingo_board_tasks_target_value_check CHECK (((target_value >= 1) AND (target_value <= 1000)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'bingo_board_tasks_target_value_check', 'bingo_board_tasks', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bingo_boards_coins_full_house_check' AND conrelid = 'public.bingo_boards'::regclass) THEN
    BEGIN
      ALTER TABLE public.bingo_boards ADD CONSTRAINT bingo_boards_coins_full_house_check CHECK (((coins_full_house >= 0) AND (coins_full_house <= 5000)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'bingo_boards_coins_full_house_check', 'bingo_boards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bingo_boards_coins_per_line_check' AND conrelid = 'public.bingo_boards'::regclass) THEN
    BEGIN
      ALTER TABLE public.bingo_boards ADD CONSTRAINT bingo_boards_coins_per_line_check CHECK (((coins_per_line >= 0) AND (coins_per_line <= 500)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'bingo_boards_coins_per_line_check', 'bingo_boards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bingo_boards_window_chk' AND conrelid = 'public.bingo_boards'::regclass) THEN
    BEGIN
      ALTER TABLE public.bingo_boards ADD CONSTRAINT bingo_boards_window_chk CHECK ((ends_at > starts_at));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'bingo_boards_window_chk', 'bingo_boards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bingo_boards_xp_full_house_check' AND conrelid = 'public.bingo_boards'::regclass) THEN
    BEGIN
      ALTER TABLE public.bingo_boards ADD CONSTRAINT bingo_boards_xp_full_house_check CHECK (((xp_full_house >= 0) AND (xp_full_house <= 10000)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'bingo_boards_xp_full_house_check', 'bingo_boards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bingo_boards_xp_per_line_check' AND conrelid = 'public.bingo_boards'::regclass) THEN
    BEGIN
      ALTER TABLE public.bingo_boards ADD CONSTRAINT bingo_boards_xp_per_line_check CHECK (((xp_per_line >= 0) AND (xp_per_line <= 1000)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'bingo_boards_xp_per_line_check', 'bingo_boards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bingo_cards_lines_awarded_check' AND conrelid = 'public.bingo_cards'::regclass) THEN
    BEGIN
      ALTER TABLE public.bingo_cards ADD CONSTRAINT bingo_cards_lines_awarded_check CHECK (((lines_awarded >= 0) AND (lines_awarded <= 12)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'bingo_cards_lines_awarded_check', 'bingo_cards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bingo_cards_unique_per_board' AND conrelid = 'public.bingo_cards'::regclass) THEN
    BEGIN
      ALTER TABLE public.bingo_cards ADD CONSTRAINT bingo_cards_unique_per_board UNIQUE (board_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'bingo_cards_unique_per_board', 'bingo_cards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bingo_marks_position_check' AND conrelid = 'public.bingo_marks'::regclass) THEN
    BEGIN
      ALTER TABLE public.bingo_marks ADD CONSTRAINT bingo_marks_position_check CHECK ((("position" >= 0) AND ("position" <= 24)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'bingo_marks_position_check', 'bingo_marks', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bingo_marks_unique_cell' AND conrelid = 'public.bingo_marks'::regclass) THEN
    BEGIN
      ALTER TABLE public.bingo_marks ADD CONSTRAINT bingo_marks_unique_cell UNIQUE (card_id, "position");
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'bingo_marks_unique_cell', 'bingo_marks', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_moves_dedupe_key_key' AND conrelid = 'public.board_moves'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_moves ADD CONSTRAINT board_moves_dedupe_key_key UNIQUE (dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_moves_dedupe_key_key', 'board_moves', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_moves_move_index_check' AND conrelid = 'public.board_moves'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_moves ADD CONSTRAINT board_moves_move_index_check CHECK ((move_index >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_moves_move_index_check', 'board_moves', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_moves_roll_check' AND conrelid = 'public.board_moves'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_moves ADD CONSTRAINT board_moves_roll_check CHECK (((roll >= 0) AND (roll <= 20)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_moves_roll_check', 'board_moves', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_player_states_challenge_attempts_check' AND conrelid = 'public.board_player_states'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_player_states ADD CONSTRAINT board_player_states_challenge_attempts_check CHECK ((challenge_attempts >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_player_states_challenge_attempts_check', 'board_player_states', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_player_states_coins_check' AND conrelid = 'public.board_player_states'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_player_states ADD CONSTRAINT board_player_states_coins_check CHECK ((coins >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_player_states_coins_check', 'board_player_states', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_player_states_moves_count_check' AND conrelid = 'public.board_player_states'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_player_states ADD CONSTRAINT board_player_states_moves_count_check CHECK ((moves_count >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_player_states_moves_count_check', 'board_player_states', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_player_states_position_check' AND conrelid = 'public.board_player_states'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_player_states ADD CONSTRAINT board_player_states_position_check CHECK (("position" >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_player_states_position_check', 'board_player_states', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_player_states_trail_id_user_id_key' AND conrelid = 'public.board_player_states'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_player_states ADD CONSTRAINT board_player_states_trail_id_user_id_key UNIQUE (trail_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_player_states_trail_id_user_id_key', 'board_player_states', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_player_states_xp_check' AND conrelid = 'public.board_player_states'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_player_states ADD CONSTRAINT board_player_states_xp_check CHECK ((xp >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_player_states_xp_check', 'board_player_states', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_tiles_coins_check' AND conrelid = 'public.board_tiles'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_tiles ADD CONSTRAINT board_tiles_coins_check CHECK (((coins >= 0) AND (coins <= 500)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_tiles_coins_check', 'board_tiles', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_tiles_move_by_check' AND conrelid = 'public.board_tiles'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_tiles ADD CONSTRAINT board_tiles_move_by_check CHECK (((move_by >= '-20'::integer) AND (move_by <= 20)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_tiles_move_by_check', 'board_tiles', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_tiles_position_check' AND conrelid = 'public.board_tiles'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_tiles ADD CONSTRAINT board_tiles_position_check CHECK ((("position" >= 0) AND ("position" < 100)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_tiles_position_check', 'board_tiles', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_tiles_trail_id_position_key' AND conrelid = 'public.board_tiles'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_tiles ADD CONSTRAINT board_tiles_trail_id_position_key UNIQUE (trail_id, "position");
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_tiles_trail_id_position_key', 'board_tiles', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_tiles_xp_check' AND conrelid = 'public.board_tiles'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_tiles ADD CONSTRAINT board_tiles_xp_check CHECK (((xp >= 0) AND (xp <= 800)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_tiles_xp_check', 'board_tiles', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'board_trails_max_moves_per_day_check' AND conrelid = 'public.board_trails'::regclass) THEN
    BEGIN
      ALTER TABLE public.board_trails ADD CONSTRAINT board_trails_max_moves_per_day_check CHECK (((max_moves_per_day >= 1) AND (max_moves_per_day <= 20)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'board_trails_max_moves_per_day_check', 'board_trails', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_battle_damage_battle_id_dedupe_key_key' AND conrelid = 'public.boss_battle_damage'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_battle_damage ADD CONSTRAINT boss_battle_damage_battle_id_dedupe_key_key UNIQUE (battle_id, dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_battle_damage_battle_id_dedupe_key_key', 'boss_battle_damage', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_battle_damage_wasted_check' AND conrelid = 'public.boss_battle_damage'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_battle_damage ADD CONSTRAINT boss_battle_damage_wasted_check CHECK ((wasted >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_battle_damage_wasted_check', 'boss_battle_damage', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_battle_rewards_battle_id_user_id_key' AND conrelid = 'public.boss_battle_rewards'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_battle_rewards ADD CONSTRAINT boss_battle_rewards_battle_id_user_id_key UNIQUE (battle_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_battle_rewards_battle_id_user_id_key', 'boss_battle_rewards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_battles_coins_pool_check' AND conrelid = 'public.boss_battles'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_battles ADD CONSTRAINT boss_battles_coins_pool_check CHECK ((coins_pool >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_battles_coins_pool_check', 'boss_battles', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_battles_current_hp_check' AND conrelid = 'public.boss_battles'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_battles ADD CONSTRAINT boss_battles_current_hp_check CHECK ((current_hp >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_battles_current_hp_check', 'boss_battles', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_battles_min_share_check' AND conrelid = 'public.boss_battles'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_battles ADD CONSTRAINT boss_battles_min_share_check CHECK (((min_share >= (0)::numeric) AND (min_share <= (1)::numeric)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_battles_min_share_check', 'boss_battles', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_battles_per_user_cap_check' AND conrelid = 'public.boss_battles'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_battles ADD CONSTRAINT boss_battles_per_user_cap_check CHECK ((per_user_cap >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_battles_per_user_cap_check', 'boss_battles', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_battles_per_user_coins_cap_check' AND conrelid = 'public.boss_battles'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_battles ADD CONSTRAINT boss_battles_per_user_coins_cap_check CHECK ((per_user_coins_cap >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_battles_per_user_coins_cap_check', 'boss_battles', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_battles_xp_pool_check' AND conrelid = 'public.boss_battles'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_battles ADD CONSTRAINT boss_battles_xp_pool_check CHECK ((xp_pool >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_battles_xp_pool_check', 'boss_battles', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_win_rate_goals_target_pct_check' AND conrelid = 'public.boss_win_rate_goals'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_win_rate_goals ADD CONSTRAINT boss_win_rate_goals_target_pct_check CHECK (((target_pct >= (0)::numeric) AND (target_pct <= (100)::numeric)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_win_rate_goals_target_pct_check', 'boss_win_rate_goals', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_win_rate_goals_tolerance_pp_check' AND conrelid = 'public.boss_win_rate_goals'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_win_rate_goals ADD CONSTRAINT boss_win_rate_goals_tolerance_pp_check CHECK (((tolerance_pp >= (0)::numeric) AND (tolerance_pp <= (100)::numeric)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_win_rate_goals_tolerance_pp_check', 'boss_win_rate_goals', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boss_win_rate_goals_window_days_check' AND conrelid = 'public.boss_win_rate_goals'::regclass) THEN
    BEGIN
      ALTER TABLE public.boss_win_rate_goals ADD CONSTRAINT boss_win_rate_goals_window_days_check CHECK (((window_days >= 1) AND (window_days <= 3650)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'boss_win_rate_goals_window_days_check', 'boss_win_rate_goals', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_result_imports_source_check' AND conrelid = 'public.campaign_result_imports'::regclass) THEN
    BEGIN
      ALTER TABLE public.campaign_result_imports ADD CONSTRAINT campaign_result_imports_source_check CHECK ((source = ANY (ARRAY['spreadsheet'::text, 'api'::text, 'manual'::text])));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'campaign_result_imports_source_check', 'campaign_result_imports', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_team_members_unique_per_campaign' AND conrelid = 'public.campaign_team_members'::regclass) THEN
    BEGIN
      ALTER TABLE public.campaign_team_members ADD CONSTRAINT campaign_team_members_unique_per_campaign UNIQUE (campaign_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'campaign_team_members_unique_per_campaign', 'campaign_team_members', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_teams_name_unique' AND conrelid = 'public.campaign_teams'::regclass) THEN
    BEGIN
      ALTER TABLE public.campaign_teams ADD CONSTRAINT campaign_teams_name_unique UNIQUE (campaign_id, name);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'campaign_teams_name_unique', 'campaign_teams', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_teams_target_nonneg' AND conrelid = 'public.campaign_teams'::regclass) THEN
    BEGIN
      ALTER TABLE public.campaign_teams ADD CONSTRAINT campaign_teams_target_nonneg CHECK ((target_team >= (0)::numeric));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'campaign_teams_target_nonneg', 'campaign_teams', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_packs_user_id_dedupe_key_key' AND conrelid = 'public.card_packs'::regclass) THEN
    BEGIN
      ALTER TABLE public.card_packs ADD CONSTRAINT card_packs_user_id_dedupe_key_key UNIQUE (user_id, dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'card_packs_user_id_dedupe_key_key', 'card_packs', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_set_claims_cards_owned_check' AND conrelid = 'public.card_set_claims'::regclass) THEN
    BEGIN
      ALTER TABLE public.card_set_claims ADD CONSTRAINT card_set_claims_cards_owned_check CHECK ((cards_owned >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'card_set_claims_cards_owned_check', 'card_set_claims', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_set_claims_cards_total_check' AND conrelid = 'public.card_set_claims'::regclass) THEN
    BEGIN
      ALTER TABLE public.card_set_claims ADD CONSTRAINT card_set_claims_cards_total_check CHECK ((cards_total >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'card_set_claims_cards_total_check', 'card_set_claims', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_set_claims_coins_awarded_check' AND conrelid = 'public.card_set_claims'::regclass) THEN
    BEGIN
      ALTER TABLE public.card_set_claims ADD CONSTRAINT card_set_claims_coins_awarded_check CHECK ((coins_awarded >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'card_set_claims_coins_awarded_check', 'card_set_claims', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_set_claims_dedupe_unique' AND conrelid = 'public.card_set_claims'::regclass) THEN
    BEGIN
      ALTER TABLE public.card_set_claims ADD CONSTRAINT card_set_claims_dedupe_unique UNIQUE (dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'card_set_claims_dedupe_unique', 'card_set_claims', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_set_claims_milestone_check' AND conrelid = 'public.card_set_claims'::regclass) THEN
    BEGIN
      ALTER TABLE public.card_set_claims ADD CONSTRAINT card_set_claims_milestone_check CHECK ((milestone = ANY (ARRAY[25, 50, 75, 100])));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'card_set_claims_milestone_check', 'card_set_claims', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_set_claims_unique' AND conrelid = 'public.card_set_claims'::regclass) THEN
    BEGIN
      ALTER TABLE public.card_set_claims ADD CONSTRAINT card_set_claims_unique UNIQUE (user_id, set_code, milestone);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'card_set_claims_unique', 'card_set_claims', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_set_claims_xp_awarded_check' AND conrelid = 'public.card_set_claims'::regclass) THEN
    BEGIN
      ALTER TABLE public.card_set_claims ADD CONSTRAINT card_set_claims_xp_awarded_check CHECK ((xp_awarded >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'card_set_claims_xp_awarded_check', 'card_set_claims', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_trades_distinct_cards' AND conrelid = 'public.card_trades'::regclass) THEN
    BEGIN
      ALTER TABLE public.card_trades ADD CONSTRAINT card_trades_distinct_cards CHECK ((offered_card_id <> requested_card_id));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'card_trades_distinct_cards', 'card_trades', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_trades_distinct_users' AND conrelid = 'public.card_trades'::regclass) THEN
    BEGIN
      ALTER TABLE public.card_trades ADD CONSTRAINT card_trades_distinct_users CHECK ((proposer_id <> responder_id));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'card_trades_distinct_users', 'card_trades', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'department_war_contributions_amount_check' AND conrelid = 'public.department_war_contributions'::regclass) THEN
    BEGIN
      ALTER TABLE public.department_war_contributions ADD CONSTRAINT department_war_contributions_amount_check CHECK ((amount > (0)::numeric));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'department_war_contributions_amount_check', 'department_war_contributions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'department_war_contributions_war_id_dedupe_key_key' AND conrelid = 'public.department_war_contributions'::regclass) THEN
    BEGIN
      ALTER TABLE public.department_war_contributions ADD CONSTRAINT department_war_contributions_war_id_dedupe_key_key UNIQUE (war_id, dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'department_war_contributions_war_id_dedupe_key_key', 'department_war_contributions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'department_war_departments_headcount_check' AND conrelid = 'public.department_war_departments'::regclass) THEN
    BEGIN
      ALTER TABLE public.department_war_departments ADD CONSTRAINT department_war_departments_headcount_check CHECK ((headcount >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'department_war_departments_headcount_check', 'department_war_departments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'department_war_departments_war_id_department_id_key' AND conrelid = 'public.department_war_departments'::regclass) THEN
    BEGIN
      ALTER TABLE public.department_war_departments ADD CONSTRAINT department_war_departments_war_id_department_id_key UNIQUE (war_id, department_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'department_war_departments_war_id_department_id_key', 'department_war_departments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'department_war_metrics_war_id_metric_key_key' AND conrelid = 'public.department_war_metrics'::regclass) THEN
    BEGIN
      ALTER TABLE public.department_war_metrics ADD CONSTRAINT department_war_metrics_war_id_metric_key_key UNIQUE (war_id, metric_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'department_war_metrics_war_id_metric_key_key', 'department_war_metrics', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'department_war_results_war_id_department_id_key' AND conrelid = 'public.department_war_results'::regclass) THEN
    BEGIN
      ALTER TABLE public.department_war_results ADD CONSTRAINT department_war_results_war_id_department_id_key UNIQUE (war_id, department_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'department_war_results_war_id_department_id_key', 'department_war_results', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'department_wars_coins_pool_check' AND conrelid = 'public.department_wars'::regclass) THEN
    BEGIN
      ALTER TABLE public.department_wars ADD CONSTRAINT department_wars_coins_pool_check CHECK ((coins_pool >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'department_wars_coins_pool_check', 'department_wars', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'department_wars_participation_bonus_check' AND conrelid = 'public.department_wars'::regclass) THEN
    BEGIN
      ALTER TABLE public.department_wars ADD CONSTRAINT department_wars_participation_bonus_check CHECK (((participation_bonus >= (0)::numeric) AND (participation_bonus <= (1)::numeric)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'department_wars_participation_bonus_check', 'department_wars', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'department_wars_per_member_coins_cap_check' AND conrelid = 'public.department_wars'::regclass) THEN
    BEGIN
      ALTER TABLE public.department_wars ADD CONSTRAINT department_wars_per_member_coins_cap_check CHECK ((per_member_coins_cap >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'department_wars_per_member_coins_cap_check', 'department_wars', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'department_wars_per_user_cap_check' AND conrelid = 'public.department_wars'::regclass) THEN
    BEGIN
      ALTER TABLE public.department_wars ADD CONSTRAINT department_wars_per_user_cap_check CHECK ((per_user_cap >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'department_wars_per_user_cap_check', 'department_wars', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'department_wars_xp_pool_check' AND conrelid = 'public.department_wars'::regclass) THEN
    BEGIN
      ALTER TABLE public.department_wars ADD CONSTRAINT department_wars_xp_pool_check CHECK ((xp_pool >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'department_wars_xp_pool_check', 'department_wars', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_action_playbooks_duration_days_check' AND conrelid = 'public.engagement_action_playbooks'::regclass) THEN
    BEGIN
      ALTER TABLE public.engagement_action_playbooks ADD CONSTRAINT engagement_action_playbooks_duration_days_check CHECK ((duration_days > 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'engagement_action_playbooks_duration_days_check', 'engagement_action_playbooks', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_answers_cycle_id_question_id_user_id_key' AND conrelid = 'public.engagement_answers'::regclass) THEN
    BEGIN
      ALTER TABLE public.engagement_answers ADD CONSTRAINT engagement_answers_cycle_id_question_id_user_id_key UNIQUE (cycle_id, question_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'engagement_answers_cycle_id_question_id_user_id_key', 'engagement_answers', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'engagement_question_assignment_cycle_id_user_id_question_id_key' AND conrelid = 'public.engagement_question_assignments'::regclass) THEN
    BEGIN
      ALTER TABLE public.engagement_question_assignments ADD CONSTRAINT engagement_question_assignment_cycle_id_user_id_question_id_key UNIQUE (cycle_id, user_id, question_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'engagement_question_assignment_cycle_id_user_id_question_id_key', 'engagement_question_assignments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lightning_quiz_answers_elapsed_ms_check' AND conrelid = 'public.lightning_quiz_answers'::regclass) THEN
    BEGIN
      ALTER TABLE public.lightning_quiz_answers ADD CONSTRAINT lightning_quiz_answers_elapsed_ms_check CHECK ((elapsed_ms >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lightning_quiz_answers_elapsed_ms_check', 'lightning_quiz_answers', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lightning_quiz_answers_idx_check' AND conrelid = 'public.lightning_quiz_answers'::regclass) THEN
    BEGIN
      ALTER TABLE public.lightning_quiz_answers ADD CONSTRAINT lightning_quiz_answers_idx_check CHECK ((idx >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lightning_quiz_answers_idx_check', 'lightning_quiz_answers', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lightning_quiz_questions_category_check' AND conrelid = 'public.lightning_quiz_questions'::regclass) THEN
    BEGIN
      ALTER TABLE public.lightning_quiz_questions ADD CONSTRAINT lightning_quiz_questions_category_check CHECK ((length(category) <= 40));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lightning_quiz_questions_category_check', 'lightning_quiz_questions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lightning_quiz_questions_explanation_check' AND conrelid = 'public.lightning_quiz_questions'::regclass) THEN
    BEGIN
      ALTER TABLE public.lightning_quiz_questions ADD CONSTRAINT lightning_quiz_questions_explanation_check CHECK (((explanation IS NULL) OR (length(explanation) <= 320)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lightning_quiz_questions_explanation_check', 'lightning_quiz_questions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lightning_quiz_questions_statement_check' AND conrelid = 'public.lightning_quiz_questions'::regclass) THEN
    BEGIN
      ALTER TABLE public.lightning_quiz_questions ADD CONSTRAINT lightning_quiz_questions_statement_check CHECK (((btrim(statement) <> ''::text) AND (length(statement) <= 240)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lightning_quiz_questions_statement_check', 'lightning_quiz_questions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lightning_quiz_sessions_best_streak_check' AND conrelid = 'public.lightning_quiz_sessions'::regclass) THEN
    BEGIN
      ALTER TABLE public.lightning_quiz_sessions ADD CONSTRAINT lightning_quiz_sessions_best_streak_check CHECK ((best_streak >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lightning_quiz_sessions_best_streak_check', 'lightning_quiz_sessions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lightning_quiz_sessions_coins_awarded_check' AND conrelid = 'public.lightning_quiz_sessions'::regclass) THEN
    BEGIN
      ALTER TABLE public.lightning_quiz_sessions ADD CONSTRAINT lightning_quiz_sessions_coins_awarded_check CHECK ((coins_awarded >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lightning_quiz_sessions_coins_awarded_check', 'lightning_quiz_sessions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lightning_quiz_sessions_correct_count_check' AND conrelid = 'public.lightning_quiz_sessions'::regclass) THEN
    BEGIN
      ALTER TABLE public.lightning_quiz_sessions ADD CONSTRAINT lightning_quiz_sessions_correct_count_check CHECK ((correct_count >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lightning_quiz_sessions_correct_count_check', 'lightning_quiz_sessions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lightning_quiz_sessions_current_index_check' AND conrelid = 'public.lightning_quiz_sessions'::regclass) THEN
    BEGIN
      ALTER TABLE public.lightning_quiz_sessions ADD CONSTRAINT lightning_quiz_sessions_current_index_check CHECK ((current_index >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lightning_quiz_sessions_current_index_check', 'lightning_quiz_sessions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lightning_quiz_sessions_current_streak_check' AND conrelid = 'public.lightning_quiz_sessions'::regclass) THEN
    BEGIN
      ALTER TABLE public.lightning_quiz_sessions ADD CONSTRAINT lightning_quiz_sessions_current_streak_check CHECK ((current_streak >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lightning_quiz_sessions_current_streak_check', 'lightning_quiz_sessions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lightning_quiz_sessions_dedupe_key_check' AND conrelid = 'public.lightning_quiz_sessions'::regclass) THEN
    BEGIN
      ALTER TABLE public.lightning_quiz_sessions ADD CONSTRAINT lightning_quiz_sessions_dedupe_key_check CHECK ((length(dedupe_key) <= 120));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lightning_quiz_sessions_dedupe_key_check', 'lightning_quiz_sessions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lightning_quiz_sessions_wrong_count_check' AND conrelid = 'public.lightning_quiz_sessions'::regclass) THEN
    BEGIN
      ALTER TABLE public.lightning_quiz_sessions ADD CONSTRAINT lightning_quiz_sessions_wrong_count_check CHECK ((wrong_count >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lightning_quiz_sessions_wrong_count_check', 'lightning_quiz_sessions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lightning_quiz_sessions_xp_awarded_check' AND conrelid = 'public.lightning_quiz_sessions'::regclass) THEN
    BEGIN
      ALTER TABLE public.lightning_quiz_sessions ADD CONSTRAINT lightning_quiz_sessions_xp_awarded_check CHECK ((xp_awarded >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lightning_quiz_sessions_xp_awarded_check', 'lightning_quiz_sessions', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lucky_wheel_prizes_amount_check' AND conrelid = 'public.lucky_wheel_prizes'::regclass) THEN
    BEGIN
      ALTER TABLE public.lucky_wheel_prizes ADD CONSTRAINT lucky_wheel_prizes_amount_check CHECK ((amount >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lucky_wheel_prizes_amount_check', 'lucky_wheel_prizes', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lucky_wheel_settings_coins_per_spin_budget_check' AND conrelid = 'public.lucky_wheel_settings'::regclass) THEN
    BEGIN
      ALTER TABLE public.lucky_wheel_settings ADD CONSTRAINT lucky_wheel_settings_coins_per_spin_budget_check CHECK (((coins_per_spin_budget > (0)::numeric) AND (coins_per_spin_budget <= (10000)::numeric)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lucky_wheel_settings_coins_per_spin_budget_check', 'lucky_wheel_settings', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lucky_wheel_whatif_current_window_order' AND conrelid = 'public.lucky_wheel_whatif_snapshots'::regclass) THEN
    BEGIN
      ALTER TABLE public.lucky_wheel_whatif_snapshots ADD CONSTRAINT lucky_wheel_whatif_current_window_order CHECK ((current_window_end >= current_window_start));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lucky_wheel_whatif_current_window_order', 'lucky_wheel_whatif_snapshots', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lucky_wheel_whatif_previous_window_order' AND conrelid = 'public.lucky_wheel_whatif_snapshots'::regclass) THEN
    BEGIN
      ALTER TABLE public.lucky_wheel_whatif_snapshots ADD CONSTRAINT lucky_wheel_whatif_previous_window_order CHECK ((previous_window_end >= previous_window_start));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lucky_wheel_whatif_previous_window_order', 'lucky_wheel_whatif_snapshots', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lucky_wheel_whatif_scenarios_is_array' AND conrelid = 'public.lucky_wheel_whatif_snapshots'::regclass) THEN
    BEGIN
      ALTER TABLE public.lucky_wheel_whatif_snapshots ADD CONSTRAINT lucky_wheel_whatif_scenarios_is_array CHECK ((jsonb_typeof(scenarios) = 'array'::text));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lucky_wheel_whatif_scenarios_is_array', 'lucky_wheel_whatif_snapshots', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lucky_wheel_whatif_signature_key' AND conrelid = 'public.lucky_wheel_whatif_snapshots'::regclass) THEN
    BEGIN
      ALTER TABLE public.lucky_wheel_whatif_snapshots ADD CONSTRAINT lucky_wheel_whatif_signature_key UNIQUE (signature);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'lucky_wheel_whatif_signature_key', 'lucky_wheel_whatif_snapshots', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nr1_factor_mappings_category_id_factor_id_key' AND conrelid = 'public.nr1_factor_mappings'::regclass) THEN
    BEGIN
      ALTER TABLE public.nr1_factor_mappings ADD CONSTRAINT nr1_factor_mappings_category_id_factor_id_key UNIQUE (category_id, factor_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'nr1_factor_mappings_category_id_factor_id_key', 'nr1_factor_mappings', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nr1_factor_mappings_weight_check' AND conrelid = 'public.nr1_factor_mappings'::regclass) THEN
    BEGIN
      ALTER TABLE public.nr1_factor_mappings ADD CONSTRAINT nr1_factor_mappings_weight_check CHECK ((weight > (0)::numeric));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'nr1_factor_mappings_weight_check', 'nr1_factor_mappings', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nr1_risk_categories_severity_weight_check' AND conrelid = 'public.nr1_risk_categories'::regclass) THEN
    BEGIN
      ALTER TABLE public.nr1_risk_categories ADD CONSTRAINT nr1_risk_categories_severity_weight_check CHECK (((severity_weight >= (1)::numeric) AND (severity_weight <= (3)::numeric)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'nr1_risk_categories_severity_weight_check', 'nr1_risk_categories', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'opinion_supports_opinion_id_user_id_key' AND conrelid = 'public.opinion_supports'::regclass) THEN
    BEGIN
      ALTER TABLE public.opinion_supports ADD CONSTRAINT opinion_supports_opinion_id_user_id_key UNIQUE (opinion_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'opinion_supports_opinion_id_user_id_key', 'opinion_supports', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prediction_admin_events_action_check' AND conrelid = 'public.prediction_admin_events'::regclass) THEN
    BEGIN
      ALTER TABLE public.prediction_admin_events ADD CONSTRAINT prediction_admin_events_action_check CHECK ((action = ANY (ARRAY['created'::text, 'published'::text, 'locked'::text, 'voided'::text, 'settled'::text, 'auto_locked'::text])));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'prediction_admin_events_action_check', 'prediction_admin_events', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prediction_markets_max_stake_per_user_check' AND conrelid = 'public.prediction_markets'::regclass) THEN
    BEGIN
      ALTER TABLE public.prediction_markets ADD CONSTRAINT prediction_markets_max_stake_per_user_check CHECK ((max_stake_per_user >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'prediction_markets_max_stake_per_user_check', 'prediction_markets', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prediction_markets_rake_collected_check' AND conrelid = 'public.prediction_markets'::regclass) THEN
    BEGIN
      ALTER TABLE public.prediction_markets ADD CONSTRAINT prediction_markets_rake_collected_check CHECK ((rake_collected >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'prediction_markets_rake_collected_check', 'prediction_markets', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prediction_markets_total_pool_check' AND conrelid = 'public.prediction_markets'::regclass) THEN
    BEGIN
      ALTER TABLE public.prediction_markets ADD CONSTRAINT prediction_markets_total_pool_check CHECK ((total_pool >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'prediction_markets_total_pool_check', 'prediction_markets', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prediction_options_pool_check' AND conrelid = 'public.prediction_options'::regclass) THEN
    BEGIN
      ALTER TABLE public.prediction_options ADD CONSTRAINT prediction_options_pool_check CHECK ((pool >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'prediction_options_pool_check', 'prediction_options', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'push_outbox_health_snapshots_score_check' AND conrelid = 'public.push_outbox_health_snapshots'::regclass) THEN
    BEGIN
      ALTER TABLE public.push_outbox_health_snapshots ADD CONSTRAINT push_outbox_health_snapshots_score_check CHECK (((score >= 0) AND (score <= 100)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'push_outbox_health_snapshots_score_check', 'push_outbox_health_snapshots', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'push_outbox_dedupe_key_key' AND conrelid = 'public.push_outbox'::regclass) THEN
    BEGIN
      ALTER TABLE public.push_outbox ADD CONSTRAINT push_outbox_dedupe_key_key UNIQUE (dedupe_key);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'push_outbox_dedupe_key_key', 'push_outbox', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scratch_card_prizes_amount_check' AND conrelid = 'public.scratch_card_prizes'::regclass) THEN
    BEGIN
      ALTER TABLE public.scratch_card_prizes ADD CONSTRAINT scratch_card_prizes_amount_check CHECK (((amount >= 0) AND (amount <= 100000)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'scratch_card_prizes_amount_check', 'scratch_card_prizes', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scratch_card_prizes_label_check' AND conrelid = 'public.scratch_card_prizes'::regclass) THEN
    BEGIN
      ALTER TABLE public.scratch_card_prizes ADD CONSTRAINT scratch_card_prizes_label_check CHECK (((btrim(label) <> ''::text) AND (length(label) <= 80)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'scratch_card_prizes_label_check', 'scratch_card_prizes', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scratch_cards_dedupe_key_check' AND conrelid = 'public.scratch_cards'::regclass) THEN
    BEGIN
      ALTER TABLE public.scratch_cards ADD CONSTRAINT scratch_cards_dedupe_key_check CHECK ((length(dedupe_key) <= 160));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'scratch_cards_dedupe_key_check', 'scratch_cards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sequence_steps_position_check' AND conrelid = 'public.sequence_steps'::regclass) THEN
    BEGIN
      ALTER TABLE public.sequence_steps ADD CONSTRAINT sequence_steps_position_check CHECK ((("position" >= 1) AND ("position" <= 20)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'sequence_steps_position_check', 'sequence_steps', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sequence_steps_procedure_id_position_key' AND conrelid = 'public.sequence_steps'::regclass) THEN
    BEGIN
      ALTER TABLE public.sequence_steps ADD CONSTRAINT sequence_steps_procedure_id_position_key UNIQUE (procedure_id, "position") DEFERRABLE INITIALLY DEFERRED;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'sequence_steps_procedure_id_position_key', 'sequence_steps', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shop_purchases_risk_level_check' AND conrelid = 'public.shop_purchases'::regclass) THEN
    BEGIN
      ALTER TABLE public.shop_purchases ADD CONSTRAINT shop_purchases_risk_level_check CHECK ((risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'shop_purchases_risk_level_check', 'shop_purchases', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_matches_away_score_check' AND conrelid = 'public.tournament_matches'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournament_matches ADD CONSTRAINT tournament_matches_away_score_check CHECK ((away_score >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournament_matches_away_score_check', 'tournament_matches', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_matches_home_score_check' AND conrelid = 'public.tournament_matches'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournament_matches ADD CONSTRAINT tournament_matches_home_score_check CHECK ((home_score >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournament_matches_home_score_check', 'tournament_matches', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_matches_round_check' AND conrelid = 'public.tournament_matches'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournament_matches ADD CONSTRAINT tournament_matches_round_check CHECK (((round >= 1) AND (round <= 8)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournament_matches_round_check', 'tournament_matches', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_matches_slot_check' AND conrelid = 'public.tournament_matches'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournament_matches ADD CONSTRAINT tournament_matches_slot_check CHECK ((slot >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournament_matches_slot_check', 'tournament_matches', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_matches_tournament_id_round_slot_key' AND conrelid = 'public.tournament_matches'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournament_matches ADD CONSTRAINT tournament_matches_tournament_id_round_slot_key UNIQUE (tournament_id, round, slot);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournament_matches_tournament_id_round_slot_key', 'tournament_matches', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_participants_coins_awarded_check' AND conrelid = 'public.tournament_participants'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournament_participants ADD CONSTRAINT tournament_participants_coins_awarded_check CHECK ((coins_awarded >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournament_participants_coins_awarded_check', 'tournament_participants', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_participants_placement_check' AND conrelid = 'public.tournament_participants'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournament_participants ADD CONSTRAINT tournament_participants_placement_check CHECK (((placement IS NULL) OR (placement = ANY (ARRAY['champion'::text, 'runner_up'::text, 'eliminated'::text]))));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournament_participants_placement_check', 'tournament_participants', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_participants_seed_check' AND conrelid = 'public.tournament_participants'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournament_participants ADD CONSTRAINT tournament_participants_seed_check CHECK (((seed IS NULL) OR ((seed >= 1) AND (seed <= 256))));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournament_participants_seed_check', 'tournament_participants', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_participants_tournament_id_seed_key' AND conrelid = 'public.tournament_participants'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournament_participants ADD CONSTRAINT tournament_participants_tournament_id_seed_key UNIQUE (tournament_id, seed);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournament_participants_tournament_id_seed_key', 'tournament_participants', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_participants_tournament_id_user_id_key' AND conrelid = 'public.tournament_participants'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournament_participants ADD CONSTRAINT tournament_participants_tournament_id_user_id_key UNIQUE (tournament_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournament_participants_tournament_id_user_id_key', 'tournament_participants', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_participants_wins_check' AND conrelid = 'public.tournament_participants'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournament_participants ADD CONSTRAINT tournament_participants_wins_check CHECK ((wins >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournament_participants_wins_check', 'tournament_participants', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_participants_xp_awarded_check' AND conrelid = 'public.tournament_participants'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournament_participants ADD CONSTRAINT tournament_participants_xp_awarded_check CHECK ((xp_awarded >= 0));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournament_participants_xp_awarded_check', 'tournament_participants', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_bracket_size_check' AND conrelid = 'public.tournaments'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_bracket_size_check CHECK (((bracket_size IS NULL) OR ((bracket_size >= 2) AND (bracket_size <= 256))));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournaments_bracket_size_check', 'tournaments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_coins_champion_check' AND conrelid = 'public.tournaments'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_coins_champion_check CHECK (((coins_champion >= 0) AND (coins_champion <= 5000)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournaments_coins_champion_check', 'tournaments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_coins_per_win_check' AND conrelid = 'public.tournaments'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_coins_per_win_check CHECK (((coins_per_win >= 0) AND (coins_per_win <= 500)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournaments_coins_per_win_check', 'tournaments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_coins_runner_up_check' AND conrelid = 'public.tournaments'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_coins_runner_up_check CHECK (((coins_runner_up >= 0) AND (coins_runner_up <= 5000)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournaments_coins_runner_up_check', 'tournaments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_description_check' AND conrelid = 'public.tournaments'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_description_check CHECK (((description IS NULL) OR (char_length(description) <= 1000)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournaments_description_check', 'tournaments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_max_participants_check' AND conrelid = 'public.tournaments'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_max_participants_check CHECK (((max_participants >= 2) AND (max_participants <= 256)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournaments_max_participants_check', 'tournaments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_rounds_check' AND conrelid = 'public.tournaments'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_rounds_check CHECK (((rounds IS NULL) OR ((rounds >= 1) AND (rounds <= 8))));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournaments_rounds_check', 'tournaments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_title_check' AND conrelid = 'public.tournaments'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_title_check CHECK (((char_length(btrim(title)) >= 3) AND (char_length(btrim(title)) <= 120)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournaments_title_check', 'tournaments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_xp_champion_check' AND conrelid = 'public.tournaments'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_xp_champion_check CHECK (((xp_champion >= 0) AND (xp_champion <= 10000)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournaments_xp_champion_check', 'tournaments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_xp_per_win_check' AND conrelid = 'public.tournaments'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_xp_per_win_check CHECK (((xp_per_win >= 0) AND (xp_per_win <= 1000)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournaments_xp_per_win_check', 'tournaments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_xp_runner_up_check' AND conrelid = 'public.tournaments'::regclass) THEN
    BEGIN
      ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_xp_runner_up_check CHECK (((xp_runner_up >= 0) AND (xp_runner_up <= 10000)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'tournaments_xp_runner_up_check', 'tournaments', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_cards_user_id_card_id_key' AND conrelid = 'public.user_cards'::regclass) THEN
    BEGIN
      ALTER TABLE public.user_cards ADD CONSTRAINT user_cards_user_id_card_id_key UNIQUE (user_id, card_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'user_cards_user_id_card_id_key', 'user_cards', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wager_budget_settings_expected_players_check' AND conrelid = 'public.wager_budget_settings'::regclass) THEN
    BEGIN
      ALTER TABLE public.wager_budget_settings ADD CONSTRAINT wager_budget_settings_expected_players_check CHECK (((expected_players >= 0) AND (expected_players <= 100000)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'wager_budget_settings_expected_players_check', 'wager_budget_settings', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wager_budget_settings_monthly_coin_budget_check' AND conrelid = 'public.wager_budget_settings'::regclass) THEN
    BEGIN
      ALTER TABLE public.wager_budget_settings ADD CONSTRAINT wager_budget_settings_monthly_coin_budget_check CHECK (((monthly_coin_budget >= 0) AND (monthly_coin_budget <= 10000000)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'wager_budget_settings_monthly_coin_budget_check', 'wager_budget_settings', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wager_entries_question_id_user_id_key' AND conrelid = 'public.wager_entries'::regclass) THEN
    BEGIN
      ALTER TABLE public.wager_entries ADD CONSTRAINT wager_entries_question_id_user_id_key UNIQUE (question_id, user_id);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'wager_entries_question_id_user_id_key', 'wager_entries', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wager_integrity_reviews_anomaly_code_check' AND conrelid = 'public.wager_integrity_reviews'::regclass) THEN
    BEGIN
      ALTER TABLE public.wager_integrity_reviews ADD CONSTRAINT wager_integrity_reviews_anomaly_code_check CHECK ((anomaly_code = ANY (ARRAY['accuracy_outlier'::text, 'perfect_streak'::text, 'net_drain'::text, 'volume_spike'::text, 'stale_activity'::text])));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'wager_integrity_reviews_anomaly_code_check', 'wager_integrity_reviews', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wager_integrity_reviews_notes_check' AND conrelid = 'public.wager_integrity_reviews'::regclass) THEN
    BEGIN
      ALTER TABLE public.wager_integrity_reviews ADD CONSTRAINT wager_integrity_reviews_notes_check CHECK (((notes IS NULL) OR (char_length(notes) <= 2000)));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'wager_integrity_reviews_notes_check', 'wager_integrity_reviews', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wager_integrity_reviews_unique' AND conrelid = 'public.wager_integrity_reviews'::regclass) THEN
    BEGIN
      ALTER TABLE public.wager_integrity_reviews ADD CONSTRAINT wager_integrity_reviews_unique UNIQUE (target_user_id, anomaly_code, window_days);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'wager_integrity_reviews_unique', 'wager_integrity_reviews', SQLERRM;
    END;
  END IF;
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wager_integrity_reviews_window_days_check' AND conrelid = 'public.wager_integrity_reviews'::regclass) THEN
    BEGIN
      ALTER TABLE public.wager_integrity_reviews ADD CONSTRAINT wager_integrity_reviews_window_days_check CHECK ((window_days = ANY (ARRAY[7, 30, 90])));
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'pulada % em %: %', 'wager_integrity_reviews_window_days_check', 'wager_integrity_reviews', SQLERRM;
    END;
  END IF;
END
$do$;
