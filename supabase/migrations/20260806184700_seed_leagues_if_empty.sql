-- Seed default leagues when the table is empty.
--
-- Why: the initial migration (20251220144518) declared an INSERT for the 6
-- default leagues, but the project's deployed database has 0 rows in
-- public.leagues. As a result, leaguesService.initializeUserLeague() throws
-- "Bronze league not found", which causes an infinite retry loop on
-- /leagues and a permanent skeleton state.
--
-- Idempotent: ON CONFLICT (tier) DO NOTHING prevents duplicates if the seed
-- has already been applied, and the row count guard avoids touching a table
-- that already has data (so we never overwrite manual admin changes).

INSERT INTO public.leagues (name, tier, icon, color, min_xp_weekly, promotion_slots, demotion_slots, xp_bonus_percent)
SELECT * FROM (VALUES
  ('Bronze',   1, '🥉', '#CD7F32',    0, 15,  0,  0),
  ('Prata',    2, '🥈', '#C0C0C0',  100, 12, 10,  5),
  ('Ouro',     3, '🥇', '#FFD700',  300, 10, 10, 10),
  ('Platina',  4, '💎', '#E5E4E2',  600,  8, 10, 15),
  ('Diamante', 5, '💠', '#B9F2FF', 1000,  5,  8, 20),
  ('Mestre',   6, '👑', '#FF6B6B', 2000,  0,  5, 30)
) AS seed(name, tier, icon, color, min_xp_weekly, promotion_slots, demotion_slots, xp_bonus_percent)
WHERE NOT EXISTS (SELECT 1 FROM public.leagues LIMIT 1)
ON CONFLICT (tier) DO NOTHING;