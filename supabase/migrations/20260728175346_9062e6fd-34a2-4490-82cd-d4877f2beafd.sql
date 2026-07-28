-- 1) Marcador temporal do bloqueio.
ALTER TABLE public.board_player_states
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz;

-- Backfill conservador: quem já está travado herda o updated_at (última
-- mutação conhecida foi justamente a que travou o jogador).
UPDATE public.board_player_states
   SET blocked_at = updated_at
 WHERE blocked_challenge_id IS NOT NULL
   AND blocked_at IS NULL;

-- 2) Trigger: mantém blocked_at coerente sem depender do app.
CREATE OR REPLACE FUNCTION public.sync_board_blocked_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.blocked_challenge_id IS NULL THEN
    NEW.blocked_at := NULL;
  ELSIF TG_OP = 'INSERT'
     OR OLD.blocked_challenge_id IS DISTINCT FROM NEW.blocked_challenge_id THEN
    -- Novo bloqueio (ou troca de casa): reinicia o relógio.
    NEW.blocked_at := now();
  ELSIF NEW.blocked_at IS NULL THEN
    NEW.blocked_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_board_blocked_at ON public.board_player_states;
CREATE TRIGGER trg_sync_board_blocked_at
  BEFORE INSERT OR UPDATE OF blocked_challenge_id ON public.board_player_states
  FOR EACH ROW EXECUTE FUNCTION public.sync_board_blocked_at();

-- 3) Índice parcial: a varredura do cron só olha quem está travado.
CREATE INDEX IF NOT EXISTS idx_board_player_states_blocked
  ON public.board_player_states (blocked_at)
  WHERE blocked_challenge_id IS NOT NULL;

-- 4) Rotina de auto-desbloqueio (sem recompensa, com trilha auditável).
CREATE OR REPLACE FUNCTION public.auto_unblock_board_players(p_max_hours integer DEFAULT 48)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hours integer := GREATEST(1, LEAST(COALESCE(p_max_hours, 48), 720));
  v_count integer := 0;
BEGIN
  -- Execução manual é privilégio de admin; o cron roda como postgres.
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem executar o auto-desbloqueio';
  END IF;

  WITH stale AS (
    SELECT id, trail_id, user_id, position, blocked_challenge_id
      FROM public.board_player_states
     WHERE blocked_challenge_id IS NOT NULL
       AND blocked_at IS NOT NULL
       AND blocked_at < now() - make_interval(hours => v_hours)
     FOR UPDATE SKIP LOCKED
  ), released AS (
    UPDATE public.board_player_states s
       SET blocked_challenge_id = NULL,
           challenge_attempts = 0,
           updated_at = now()
      FROM stale
     WHERE s.id = stale.id
    RETURNING stale.trail_id, stale.user_id, stale.position, stale.blocked_challenge_id
  )
  INSERT INTO public.board_moves (
    trail_id, user_id, from_position, to_position, dice,
    tile_type, coins_delta, xp_delta, dedupe_key, challenge_correct
  )
  SELECT r.trail_id, r.user_id, r.position, r.position, 0,
         'challenge', 0, 0,
         'board-auto-unblock:' || r.trail_id || ':' || r.user_id || ':'
           || r.blocked_challenge_id || ':' || to_char(now(), 'YYYYMMDD'),
         false
    FROM released r
  ON CONFLICT (dedupe_key) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_unblock_board_players(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.auto_unblock_board_players(integer) TO authenticated, service_role;

-- 5) Agendamento diário.
SELECT cron.unschedule('board-auto-unblock-daily')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'board-auto-unblock-daily');

SELECT cron.schedule(
  'board-auto-unblock-daily',
  '0 4 * * *',
  $cron$SELECT public.auto_unblock_board_players(48);$cron$
);