

-- =============================================================================
-- Pendência 02: securitizar escrita de economia em profiles
-- -----------------------------------------------------------------------------
-- A policy "Users can update own profile" (20260906120000) permite UPDATE sem
-- allowlist de colunas => qualquer authenticated manipula xp/coins/level do
-- próprio perfil. Esta migration:
--   1) Cria RPCs SECURITY DEFINER para todas as escritas de economia (padrão
--      do lucky_wheel: autoallocation de level por GREATEST/floor/1000);
--   2) REVOKE UPDATE table-level + GRANT UPDATE column-level (allowlist
--      display_name, avatar_url, birth_date, hire_date).
-- Todas as RPCs são qualificadas (alias `pr`) para resolver o 42702 de
-- `RETURNS TABLE` com nomes homônimos às colunas.
-- Cada RPC exige auth.uid() (usuário só manipula a própria economia); o
-- add_xp aceita também o remetente de um kudos real (fluxo cross-user).
-- Idempotente: pode rodar múltiplas vezes sem erro.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1) add_xp          — soma XP + autoallocation de level (padrão lucky_wheel)
--    Guard: auth.uid() == p_user_id (própria economia) OU o chamador é o
--    remetente de um kudos real para p_user_id (fluxo cross-user legítimo).
--    Autoconcessão via RPC própria (add_xp do próprio íd) permanece como
--    contrapartida de 8 features client-side que somam XP — follow-up.
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

  UPDATE public.profiles AS pr
     SET xp = pr.xp + p_amount,
         level = GREATEST(pr.level, floor((pr.xp + p_amount) / 1000) + 1)
   WHERE pr.id = p_user_id
     AND (auth.uid() = p_user_id
          OR EXISTS (SELECT 1 FROM public.kudos k
                      WHERE k.to_user_id = p_user_id AND k.from_user_id = auth.uid()))
   RETURNING pr.xp, pr.level INTO v_xp, v_level;

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

  UPDATE public.profiles AS pr
     SET coins = pr.coins + p_amount
   WHERE pr.id = p_user_id AND auth.uid() = p_user_id
   RETURNING pr.coins INTO v_coins;

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

  UPDATE public.profiles AS pr
     SET coins = pr.coins - p_amount
   WHERE pr.id = p_user_id AND pr.coins >= p_amount AND auth.uid() = p_user_id
   RETURNING pr.coins INTO v_coins;

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
  SELECT pr.streak, pr.best_streak, pr.last_access_at INTO v_streak, v_best, v_last
    FROM public.profiles AS pr WHERE pr.id = p_user_id AND auth.uid() = p_user_id;

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

  UPDATE public.profiles AS pr
     SET streak = v_streak,
         best_streak = v_best,
         last_access_at = now()
   WHERE pr.id = p_user_id AND auth.uid() = p_user_id;

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
  UPDATE public.profiles AS pr
     SET quests_completed = pr.quests_completed + 1
   WHERE pr.id = p_user_id AND auth.uid() = p_user_id
   RETURNING pr.quests_completed INTO v_count;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'perfil não encontrado';
  END IF;

  RETURN QUERY SELECT p_user_id, v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_quests_completed(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_quests_completed(uuid) TO authenticated;


-- -----------------------------------------------------------------------------
-- 6) REVOKE UPDATE table-level + GRANT UPDATE column-level (allowlist)
--    Privilégios table-level e column-level são CUMULATIVOS no Postgres:
--    um REVOKE só de colunas não protege. O REVOKE table-level de UPDATE
--    derruba a escrita de qualquer coluna econômica via client; o GRANT
--    column-level reconcede apenas o que a UI edita diretamente.
--    (display_name, avatar_url, birth_date, hire_date)
-- -----------------------------------------------------------------------------
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url, birth_date, hire_date) ON public.profiles TO authenticated;

-- Garante SELECT amplo já concedido (LGPD) para os clientes que leem antes de RPC
GRANT SELECT (id, display_name, avatar_url, level, xp, coins, streak, best_streak, quests_completed, created_at, updated_at, birth_date, hire_date, status, last_access_at, email) ON public.profiles TO authenticated;
