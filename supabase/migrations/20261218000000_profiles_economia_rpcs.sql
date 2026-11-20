

-- =============================================================================
-- Pendência 02: securitizar escrita de economia em profiles
-- -----------------------------------------------------------------------------
-- A policy "Users can update own profile" (20260906120000) permite UPDATE sem
-- allowlist de colunas => qualquer authenticated manipula xp/coins/level do
-- próprio perfil. Esta migration:
--   1) Cria RPCs SECURITY DEFINER para todas as escritas de economia (padrão
--      do lucky_wheel: autoallocation de level por GREATEST/floor/1000);
--   2) REVOKEA UPDATE das colunas econômicas para authenticated (mantendo
--      UPDATE na policy atual para colunas editáveis via client).
-- Idempotente: pode rodar múltiplas vezes sem erro.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1) add_xp          — soma XP + autoallocation de level (padrão lucky_wheel)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_xp(p_user_id uuid, p_amount integer, p_source text DEFAULT NULL)
RETURNS TABLE (id uuid, xp integer, level integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_xp integer;
  v_level integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount deve ser positivo';
  END IF;

  UPDATE public.profiles
     SET xp = xp + p_amount,
         level = GREATEST(level, floor((xp + p_amount) / 1000) + 1)
   WHERE id = p_user_id
   RETURNING xp, level INTO v_xp, v_level;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'perfil não encontrado';
  END IF;

  RETURN QUERY SELECT p_user_id, v_xp, v_level;
END;
$$;

REVOKE ALL ON FUNCTION public.add_xp(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_xp(uuid, integer, text) TO authenticated;


-- -----------------------------------------------------------------------------
-- 2) add_coins       — soma coins
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_coins(p_user_id uuid, p_amount integer)
RETURNS TABLE (id uuid, coins integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coins integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount deve ser positivo';
  END IF;

  UPDATE public.profiles
     SET coins = coins + p_amount
   WHERE id = p_user_id
   RETURNING coins INTO v_coins;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'perfil não encontrado';
  END IF;

  RETURN QUERY SELECT p_user_id, v_coins;
END;
$$;

REVOKE ALL ON FUNCTION public.add_coins(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_coins(uuid, integer) TO authenticated;


-- -----------------------------------------------------------------------------
-- 3) spend_coins     — debita coins com saldo negativo bloqueado (atomic)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.spend_coins(p_user_id uuid, p_amount integer)
RETURNS TABLE (id uuid, coins integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coins integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount deve ser positivo';
  END IF;

  UPDATE public.profiles
     SET coins = coins - p_amount
   WHERE id = p_user_id AND coins >= p_amount
   RETURNING coins INTO v_coins;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'coins insuficientes';
  END IF;

  RETURN QUERY SELECT p_user_id, v_coins;
END;
$$;

REVOKE ALL ON FUNCTION public.spend_coins(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spend_coins(uuid, integer) TO authenticated;


-- -----------------------------------------------------------------------------
-- 4) increment_streak — streak reseta >48h, mantém se <12h; atualiza best e last
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_streak(p_user_id uuid)
RETURNS TABLE (id uuid, streak integer, best_streak integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak integer;
  v_best integer;
  v_last timestamptz;
BEGIN
  SELECT streak, best_streak, last_access_at INTO v_streak, v_best, v_last
    FROM public.profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'perfil não encontrado';
  END IF;

  -- >48h de gap: reseta; <12h: mesma sessão (não incrementa)
  IF v_last IS NULL OR (now() - v_last) > interval '48 hours' THEN
    v_streak := 1;
  ELSIF (now() - v_last) >= interval '12 hours' THEN
    v_streak := v_streak + 1;
  END IF;

  v_best := GREATEST(v_best, v_streak);

  UPDATE public.profiles
     SET streak = v_streak,
         best_streak = v_best,
         last_access_at = now()
   WHERE id = p_user_id;

  RETURN QUERY SELECT p_user_id, v_streak, v_best;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_streak(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_streak(uuid) TO authenticated;


-- -----------------------------------------------------------------------------
-- 5) increment_quests_completed
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_quests_completed(p_user_id uuid)
RETURNS TABLE (id uuid, quests_completed integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.profiles
     SET quests_completed = quests_completed + 1
   WHERE id = p_user_id
   RETURNING quests_completed INTO v_count;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'perfil não encontrado';
  END IF;

  RETURN QUERY SELECT p_user_id, v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_quests_completed(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_quests_completed(uuid) TO authenticated;


-- -----------------------------------------------------------------------------
-- 6) REVOKE UPDATE column-level das colunas econômicas
--    (UPDATE nas colunas restantes continua via policy existente)
-- -----------------------------------------------------------------------------
REVOKE UPDATE (xp, coins, level, streak, best_streak, quests_completed, last_access_at) ON public.profiles FROM authenticated;

-- Garante SELECT amplo já concedido (LGPD) para os clientes que leem antes de RPC
GRANT SELECT (id, display_name, avatar_url, level, xp, coins, streak, best_streak, quests_completed, created_at, updated_at, birth_date, hire_date, status, last_access_at, email) ON public.profiles TO authenticated;
