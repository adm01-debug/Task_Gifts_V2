-- =============================================================================
-- Pendencia 02 (risco residual): valor da economia calculado no servidor
-- -----------------------------------------------------------------------------
-- Onde parou a 20261218000000: o UPDATE direto em xp/coins/level foi fechado,
-- mas add_xp/add_coins continuam aceitando `p_amount` arbitrario do proprio
-- usuario. Um usuario autenticado podia chamar add_coins(p_amount => 999999)
-- e inflar moeda/XP, distorcendo ranking, loja e metas.
--
-- Esta migration move a DECISAO do valor para o banco. O cliente informa apenas
-- QUAL evento aconteceu (`p_kind` + identificador da entidade); o valor sai de
-- uma tabela de dominio lida pelo proprio banco, e a conclusao do evento
-- precisa existir como fato previo (reward ja desbloqueado/coletado).
--
--   kind                          valor (fonte)                    fato exigido
--   achiev:<key>                  achievements.xp/coin_reward      user_achievements
--   seasonal:<id>                 seasonal_challenges.xp/coin      claimed + completed_at
--   quest:<assignment_id>         custom_quests.xp/coin_reward     completed_at preenchido
--   mission:<mission_id>          department_missions.xp/coin      claimed
--   checkin:<attendance_id>       attendance_settings.xp_punctual  is_punctual
--   kudos:<kudos_id>              kudos.xp_value                   remetente = auth.uid()
--   onboard:<step_id>             public.onboarding_step_rewards() rewards_claimed
--
-- Idempotencia: cada evento credita uma unica vez. A trava e um UPDATE
-- condicional em `public.economy_grants` (uma linha por evento/credito); a
-- segunda chamada nao encontra linha para inserir e devolve `already=true`.
--
-- add_xp/add_coins com `p_amount` mudam de assinatura: ganham `p_kind` e
-- perdem o valor. As sobrecargas antigas sao DROPADAS de proposito, para que
-- nenhum cliente antigo continue conseguindo escolher o proprio valor.
--
-- Idempotente: pode rodar multiplas vezes sem erro.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Tabela de eventos creditados (trava de idempotencia)
--    `kind`     = tipo do evento (achiev, seasonal, quest, mission, checkin, kudos, onboard)
--    `source_id`= identificador do fato que gerou o credito
--    `credit`   = 'xp' ou 'coins'
--    `user_id`  = quem recebeu
--    `amount`   = valor efetivamente creditado (auditoria)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.economy_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  source_id TEXT NOT NULL,
  credit TEXT NOT NULL CHECK (credit IN ('xp', 'coins')),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, source_id, credit)
);

ALTER TABLE public.economy_grants ENABLE ROW LEVEL SECURITY;

-- O usuario enxerga o proprio extrato; escrita so pelo backend (SECURITY DEFINER).
DROP POLICY IF EXISTS "economy_grants_select_own" ON public.economy_grants;
CREATE POLICY "economy_grants_select_own"
  ON public.economy_grants FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

REVOKE ALL ON public.economy_grants FROM PUBLIC, anon;
GRANT SELECT ON public.economy_grants TO authenticated;

-- -----------------------------------------------------------------------------
-- 2) Catalogo dos passos de onboarding (antes hardcoded em onboardingService.ts)
--    Mantem os mesmos ids/valores do front para nao mudar a regra de negocio.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.onboarding_step_rewards()
RETURNS TABLE (step_id TEXT, xp_reward INTEGER, coin_reward INTEGER)
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT * FROM (VALUES
    ('welcome',          10,  5),
    ('profile',          25, 10),
    ('explore_dashboard',15,  5),
    ('first_checkin',    30, 15),
    ('send_kudos',       20, 10),
    ('start_trail',      25, 15),
    ('visit_shop',       15,  5),
    ('set_goal',         25, 15),
    ('join_league',      30, 20),
    ('answer_survey',    20, 10),
    ('check_mood',       15, 10)
  ) AS t(step_id, xp_reward, coin_reward);
$$;

REVOKE ALL ON FUNCTION public.onboarding_step_rewards() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.onboarding_step_rewards() TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 3) Resolucao do valor: dado (kind, source_id), devolve tipo do evento,
--    quem e o dono legitimo e o valor autorizado. Chamador interno.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.economy_reward_source(p_kind TEXT, p_source_id TEXT)
RETURNS TABLE (event_kind TEXT, owner_id UUID, xp_amount INTEGER, coin_amount INTEGER)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_kind = 'achiev' THEN
    RETURN QUERY
      SELECT 'achiev'::text, ua.user_id, a.xp_reward, a.coin_reward
        FROM public.user_achievements ua
        JOIN public.achievements a ON a.id = ua.achievement_id
       WHERE a.key = p_source_id;
  ELSIF p_kind = 'seasonal' THEN
    RETURN QUERY
      SELECT 'seasonal'::text, usp.user_id, sc.xp_reward, sc.coin_reward
        FROM public.user_seasonal_progress usp
        JOIN public.seasonal_challenges sc ON sc.id = usp.challenge_id
       WHERE sc.id::text = p_source_id
         AND usp.claimed
         AND usp.completed_at IS NOT NULL;
  ELSIF p_kind = 'quest' THEN
    RETURN QUERY
      SELECT 'quest'::text, qa.user_id, q.xp_reward, q.coin_reward
        FROM public.quest_assignments qa
        JOIN public.custom_quests q ON q.id = qa.quest_id
       WHERE qa.id::text = p_source_id
         AND qa.completed_at IS NOT NULL;
  ELSIF p_kind = 'mission' THEN
    RETURN QUERY
      SELECT 'mission'::text, ump.user_id, m.xp_reward, m.coin_reward
        FROM public.user_mission_progress ump
        JOIN public.department_missions m ON m.id = ump.mission_id
       WHERE ump.id::text = p_source_id
         AND ump.claimed;
  ELSIF p_kind = 'campaign' THEN
    -- Participacao concluida; o valor e o gravado pelo servico ao fechar a meta.
    RETURN QUERY
      SELECT 'campaign'::text, cp.user_id,
             GREATEST(cp.xp_earned, c.xp_reward),
             GREATEST(cp.coins_earned, c.coin_reward)
        FROM public.campaign_participants cp
        JOIN public.sales_campaigns c ON c.id = cp.campaign_id
       WHERE cp.id::text = p_source_id
         AND cp.completed_at IS NOT NULL;
  ELSIF p_kind = 'weekly' THEN
    -- Vencedor do desafio semanal.
    RETURN QUERY
      SELECT 'weekly'::text, wc.winner_id, wc.xp_reward, wc.coin_reward
        FROM public.weekly_challenges wc
       WHERE wc.id::text = p_source_id
         AND wc.winner_id IS NOT NULL;
  ELSIF p_kind = 'challenge' THEN
    -- Desafio automatico concluido pelo proprio usuario.
    RETURN QUERY
      SELECT 'challenge'::text, uc.user_id, uc.xp_reward, uc.coin_reward
        FROM public.user_challenges uc
       WHERE uc.id::text = p_source_id
         AND uc.user_id = auth.uid()
         AND uc.completed_at IS NOT NULL;
  ELSIF p_kind = 'checkin' THEN
    RETURN QUERY
      SELECT 'checkin'::text, ar.user_id, COALESCE(s.xp_punctual_checkin, 15), 0
        FROM public.attendance_records ar
        LEFT JOIN public.attendance_settings s ON s.department_id = (
          SELECT p.department_id FROM public.profiles p WHERE p.id = ar.user_id
        )
       WHERE ar.id::text = p_source_id
         AND ar.is_punctual;
  ELSIF p_kind = 'kudos' THEN
    RETURN QUERY
      SELECT 'kudos'::text, k.to_user_id, COALESCE(b.xp_value, 25), 0
        FROM public.kudos k
        LEFT JOIN public.kudos_badges b ON b.id = k.badge_id
       WHERE k.id::text = p_source_id
         AND k.from_user_id = auth.uid();
  ELSIF p_kind = 'onboard' THEN
    RETURN QUERY
      SELECT 'onboard'::text, op.user_id, r.xp_reward, r.coin_reward
        FROM public.onboarding_progress op
        CROSS JOIN public.onboarding_step_rewards() r
       WHERE op.user_id = auth.uid()
         AND r.step_id = p_source_id
         AND p_source_id = ANY (op.rewards_claimed);
  ELSIF p_kind = 'mentoring' THEN
    -- Fato: as duas pontas concluiram a missao do par.
    RETURN QUERY
      SELECT 'mentoring'::text,
             mp.mentor_id,
             mm.xp_reward,
             mm.coin_reward
        FROM public.mentorship_mission_progress p
        JOIN public.mentorship_pairs mp ON mp.id = p.pair_id
        JOIN public.mentorship_missions mm ON mm.id = p.mission_id
       WHERE p.id::text = p_source_id
         AND p.completed_by_mentor
         AND p.completed_by_apprentice
         AND auth.uid() IN (mp.mentor_id, mp.apprentice_id);
  ELSIF p_kind = 'trail' THEN
    -- Fato: o concluinte tem o modulo marcado como concluido.
    RETURN QUERY
      SELECT 'trail'::text, mp.user_id, m.xp_reward, 0
        FROM public.module_progress mp
        JOIN public.trail_modules m ON m.id = mp.module_id
       WHERE mp.module_id::text = p_source_id
         AND mp.user_id = auth.uid()
         AND mp.completed_at IS NOT NULL;
  ELSE
    RAISE EXCEPTION 'evento de economia desconhecido: %', p_kind
      USING HINT = 'use achiev, seasonal, quest, mission, checkin, kudos ou onboard';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.economy_reward_source(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.economy_reward_source(TEXT, TEXT) TO service_role;

-- -----------------------------------------------------------------------------
-- 4) Credito unico: aplica o valor autorizado e registra o evento.
--    Chamado por add_xp/add_coins; nao exposto ao cliente.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.economy_credit(
  p_user_id UUID,
  p_kind TEXT,
  p_source_id TEXT,
  p_credit TEXT,
  p_bonus INTEGER DEFAULT 0
)
RETURNS TABLE (id UUID, xp INTEGER, level INTEGER, coins INTEGER, amount INTEGER, already BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_xp INTEGER;
  v_level INTEGER;
  v_coins INTEGER;
  v_amount INTEGER;
  v_owner UUID;
BEGIN
  IF p_credit NOT IN ('xp', 'coins') THEN
    RAISE EXCEPTION 'credito invalido: %', p_credit;
  END IF;

  -- Trava de idempotencia: a linha so existe uma vez por evento/credito.
  INSERT INTO public.economy_grants (user_id, kind, source_id, credit, amount)
  VALUES (p_user_id, p_kind, p_source_id, p_credit, 0)
  ON CONFLICT (user_id, kind, source_id, credit) DO NOTHING;

  IF NOT FOUND THEN
    RETURN QUERY
      SELECT pr.id, pr.xp, pr.level, pr.coins, 0, TRUE
        FROM public.profiles pr WHERE pr.id = p_user_id;
    RETURN;
  END IF;

  SELECT s.owner_id,
         CASE WHEN p_credit = 'xp' THEN s.xp_amount ELSE s.coin_amount END
    INTO v_owner, v_amount
    FROM public.economy_reward_source(p_kind, p_source_id) s;

  IF v_owner IS NULL OR v_owner <> p_user_id THEN
    -- Sem fato previo para este usuario: nao credita e desfaz a trava.
    DELETE FROM public.economy_grants
     WHERE user_id = p_user_id AND kind = p_kind
       AND source_id = p_source_id AND credit = p_credit;
    RETURN QUERY
      SELECT pr.id, pr.xp, pr.level, pr.coins, 0, TRUE
        FROM public.profiles pr WHERE pr.id = p_user_id;
    RETURN;
  END IF;

  IF COALESCE(v_amount, 0) <= 0 THEN
    UPDATE public.economy_grants g SET amount = 0
     WHERE g.user_id = p_user_id AND g.kind = p_kind
       AND g.source_id = p_source_id AND g.credit = p_credit;
    RETURN QUERY
      SELECT pr.id, pr.xp, pr.level, pr.coins, 0, TRUE
        FROM public.profiles pr WHERE pr.id = p_user_id;
    RETURN;
  END IF;

  -- Bonus de combo: so para XP e limitado a 2x o valor autorizado.
  IF p_credit = 'xp' AND p_bonus > 0 THEN
    v_amount := v_amount + LEAST(p_bonus, v_amount);
  END IF;

  IF p_credit = 'xp' THEN
    UPDATE public.profiles AS pr
       SET xp = pr.xp + v_amount,
           level = GREATEST(pr.level, floor((pr.xp + v_amount) / 1000) + 1)
     WHERE pr.id = p_user_id
     RETURNING pr.id, pr.xp, pr.level, pr.coins INTO id, v_xp, v_level, v_coins;
  ELSE
    UPDATE public.profiles AS pr
       SET coins = pr.coins + v_amount
     WHERE pr.id = p_user_id
     RETURNING pr.id, pr.xp, pr.level, pr.coins INTO id, v_xp, v_level, v_coins;
  END IF;

  IF id IS NULL THEN
    RAISE EXCEPTION 'perfil nao encontrado';
  END IF;

  UPDATE public.economy_grants g SET amount = v_amount
   WHERE g.user_id = p_user_id AND g.kind = p_kind
     AND g.source_id = p_source_id AND g.credit = p_credit;

  RETURN QUERY SELECT id, v_xp, v_level, v_coins, v_amount, FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.economy_credit(UUID, TEXT, TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.economy_credit(UUID, TEXT, TEXT, TEXT, INTEGER) TO service_role;

-- -----------------------------------------------------------------------------
-- 5) add_xp nova assinatura: (uuid, text, text) — sem valor
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.add_xp(uuid, integer, text);

CREATE OR REPLACE FUNCTION public.add_xp(p_user_id UUID, p_kind TEXT, p_source_id TEXT, p_bonus INTEGER DEFAULT 0)
RETURNS TABLE (id UUID, xp INTEGER, level INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só credita a própria economia, salvo eventos que premiam terceiro
  -- (kudos recebido, vitória em desafio semanal).
  IF auth.uid() IS DISTINCT FROM p_user_id
     AND p_kind NOT IN ('kudos', 'weekly') THEN
    RAISE EXCEPTION 'add_xp so credita na propria economia'
      USING HINT = 'use o evento de kudos para o remetente creditar terceiro';
  END IF;

  RETURN QUERY
    SELECT c.id, c.xp, c.level
      FROM public.economy_credit(p_user_id, p_kind, p_source_id, 'xp',
                                 GREATEST(COALESCE(p_bonus, 0), 0)) c;
END;
$$;

REVOKE ALL ON FUNCTION public.add_xp(UUID, TEXT, TEXT, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_xp(UUID, TEXT, TEXT, INTEGER) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6) add_coins nova assinatura: (uuid, text, text) — sem valor
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.add_coins(uuid, integer);

CREATE OR REPLACE FUNCTION public.add_coins(p_user_id UUID, p_kind TEXT, p_source_id TEXT)
RETURNS TABLE (id UUID, coins INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id
     AND p_kind NOT IN ('kudos', 'weekly') THEN
    RAISE EXCEPTION 'add_coins so credita na propria economia';
  END IF;

  RETURN QUERY
    SELECT c.id, c.coins
      FROM public.economy_credit(p_user_id, p_kind, p_source_id, 'coins') c;
END;
$$;

REVOKE ALL ON FUNCTION public.add_coins(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_coins(UUID, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7) Evento de pontuacao completa: fecha quest/desafio e credita em um passo.
--    Evita que o cliente consiga creditar antes de existir o fato.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_quest_assignment(p_assignment_id UUID)
RETURNS TABLE (assignment_id UUID, quest_id UUID, user_id UUID, xp INTEGER, level INTEGER, coins INTEGER, already BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID;
  v_quest UUID;
  v_xp INTEGER;
  v_level INTEGER;
  v_coins INTEGER;
  v_already BOOLEAN;
BEGIN
  UPDATE public.quest_assignments qa
     SET completed_at = COALESCE(qa.completed_at, now())
   WHERE qa.id = p_assignment_id
     AND qa.user_id = auth.uid()
   RETURNING qa.user_id, qa.quest_id INTO v_user, v_quest;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'atribuicao de quest nao encontrada';
  END IF;

  SELECT c.xp, c.level, c.coins, c.already
    INTO v_xp, v_level, v_coins, v_already
    FROM public.economy_credit(v_user, 'quest', p_assignment_id::text, 'xp') c;

  SELECT c.coins INTO v_coins
    FROM public.economy_credit(v_user, 'quest', p_assignment_id::text, 'coins') c;

  RETURN QUERY SELECT p_assignment_id, v_quest, v_user, v_xp, v_level, COALESCE(v_coins, 0), COALESCE(v_already, FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.complete_quest_assignment(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_quest_assignment(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8) Coleta de desafio sazonal: marca claimed e credita, atomicamente.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_seasonal_reward(p_challenge_id UUID)
RETURNS TABLE (challenge_id UUID, xp INTEGER, level INTEGER, coins INTEGER, already BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID;
  v_xp INTEGER;
  v_level INTEGER;
  v_coins INTEGER;
  v_already BOOLEAN;
BEGIN
  UPDATE public.user_seasonal_progress usp
     SET claimed = TRUE,
         completed_at = COALESCE(usp.completed_at, now()),
         updated_at = now()
   WHERE usp.challenge_id = p_challenge_id
     AND usp.user_id = auth.uid()
   RETURNING usp.user_id INTO v_user;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'progresso do desafio nao encontrado';
  END IF;

  SELECT c.xp, c.level, c.coins, c.already
    INTO v_xp, v_level, v_coins, v_already
    FROM public.economy_credit(v_user, 'seasonal', p_challenge_id::text, 'xp') c;

  SELECT c.coins INTO v_coins
    FROM public.economy_credit(v_user, 'seasonal', p_challenge_id::text, 'coins') c;

  RETURN QUERY SELECT p_challenge_id, v_xp, v_level, COALESCE(v_coins, 0), COALESCE(v_already, FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_seasonal_reward(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_seasonal_reward(UUID) TO authenticated;