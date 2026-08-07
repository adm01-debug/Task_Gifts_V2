-- ============================================
-- Fix scratch_cards.prize_id FK target
-- ============================================
--
-- Why: in the deployed database, scratch_cards.prize_id had a foreign key
-- pointing to public.lucky_wheel_prizes(id) instead of
-- public.scratch_card_prizes(id). This was almost certainly introduced by a
-- manual ALTER TABLE on the Supabase dashboard that referenced the wrong
-- table. The mismatch caused the reveal_scratch_card RPC to fail with
-- HTTP 409 "insert or update on table 'scratch_cards' violates foreign key
-- constraint 'scratch_cards_prize_id_fkey'" every time a player scratched
-- a card, because the prize_id came from scratch_card_prizes (not
-- lucky_wheel_prizes).
--
-- The fix: drop the wrong FK and recreate it pointing at the right table.
-- Idempotent (DROP CONSTRAINT IF EXISTS).

ALTER TABLE public.scratch_cards
  DROP CONSTRAINT IF EXISTS scratch_cards_prize_id_fkey;

ALTER TABLE public.scratch_cards
  ADD CONSTRAINT scratch_cards_prize_id_fkey
    FOREIGN KEY (prize_id) REFERENCES public.scratch_card_prizes(id) ON DELETE SET NULL;
