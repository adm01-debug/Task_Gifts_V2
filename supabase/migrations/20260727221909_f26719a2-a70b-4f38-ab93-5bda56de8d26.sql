-- ============================================================
-- VERDADEIRO/FALSO RELÂMPAGO — núcleo transacional server-side
-- ============================================================

CREATE TABLE public.lightning_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement TEXT NOT NULL CHECK (btrim(statement) <> '' AND length(statement) <= 240),
  is_true BOOLEAN NOT NULL,
  explanation TEXT CHECK (explanation IS NULL OR length(explanation) <= 320),
  category TEXT NOT NULL DEFAULT 'geral' CHECK (length(category) <= 40),
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sem GRANT de SELECT para authenticated: o gabarito (is_true) nunca trafega
-- pela Data API. O acesso do jogador acontece só via RPC SECURITY DEFINER.
GRANT ALL ON public.lightning_quiz_questions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lightning_quiz_questions TO authenticated;
ALTER TABLE public.lightning_quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lightning_questions_admin_manage" ON public.lightning_quiz_questions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX lightning_questions_active_idx
  ON public.lightning_quiz_questions (is_active, difficulty);

CREATE TABLE public.lightning_quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  dedupe_key TEXT NOT NULL CHECK (length(dedupe_key) <= 120),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','finished')),
  question_ids UUID[] NOT NULL DEFAULT '{}',
  current_index INTEGER NOT NULL DEFAULT 0 CHECK (current_index >= 0),
  correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  wrong_count INTEGER NOT NULL DEFAULT 0 CHECK (wrong_count >= 0),
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  best_streak INTEGER NOT NULL DEFAULT 0 CHECK (best_streak >= 0),
  coins_awarded INTEGER NOT NULL DEFAULT 0 CHECK (coins_awarded >= 0),
  xp_awarded INTEGER NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deadline_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX lightning_sessions_user_dedupe_uidx
  ON public.lightning_quiz_sessions (user_id, dedupe_key);
CREATE INDEX lightning_sessions_user_created_idx
  ON public.lightning_quiz_sessions (user_id, created_at DESC);

GRANT SELECT ON public.lightning_quiz_sessions TO authenticated;
GRANT ALL ON public.lightning_quiz_sessions TO service_role;
ALTER TABLE public.lightning_quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lightning_sessions_select_own" ON public.lightning_quiz_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.lightning_quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.lightning_quiz_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.lightning_quiz_questions(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL CHECK (idx >= 0),
  answered_true BOOLEAN NOT NULL,
  is_correct BOOLEAN NOT NULL,
  elapsed_ms INTEGER NOT NULL DEFAULT 0 CHECK (elapsed_ms >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX lightning_answers_session_idx_uidx
  ON public.lightning_quiz_answers (session_id, idx);
CREATE INDEX lightning_answers_user_idx
  ON public.lightning_quiz_answers (user_id, created_at DESC);

GRANT SELECT ON public.lightning_quiz_answers TO authenticated;
GRANT ALL ON public.lightning_quiz_answers TO service_role;
ALTER TABLE public.lightning_quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lightning_answers_select_own" ON public.lightning_quiz_answers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER lightning_questions_updated_at BEFORE UPDATE ON public.lightning_quiz_questions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER lightning_sessions_updated_at BEFORE UPDATE ON public.lightning_quiz_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------
-- start_lightning_round: cria rodada idempotente (3/dia)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_lightning_round()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_used INTEGER;
  v_key TEXT;
  v_ids UUID[];
  v_session RECORD;
  v_q RECORD;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('lightning_quiz:' || v_user::text));

  -- Rodada ativa e ainda dentro do prazo: devolve a mesma (replay seguro).
  SELECT * INTO v_session FROM public.lightning_quiz_sessions
   WHERE user_id = v_user AND status = 'active' AND deadline_at > now()
   ORDER BY created_at DESC LIMIT 1;

  IF FOUND THEN
    SELECT id, statement, category, difficulty INTO v_q
      FROM public.lightning_quiz_questions
     WHERE id = v_session.question_ids[v_session.current_index + 1];

    RETURN jsonb_build_object(
      'success', true, 'replayed', true,
      'session_id', v_session.id,
      'deadline_at', v_session.deadline_at,
      'total', array_length(v_session.question_ids, 1),
      'index', v_session.current_index,
      'correct_count', v_session.correct_count,
      'wrong_count', v_session.wrong_count,
      'current_streak', v_session.current_streak,
      'question', CASE WHEN v_q.id IS NULL THEN NULL ELSE jsonb_build_object(
        'id', v_q.id, 'statement', v_q.statement,
        'category', v_q.category, 'difficulty', v_q.difficulty) END
    );
  END IF;

  -- Encerra rodadas ativas expiradas antes de abrir uma nova.
  UPDATE public.lightning_quiz_sessions
     SET status = 'finished', finished_at = COALESCE(finished_at, now())
   WHERE user_id = v_user AND status = 'active' AND deadline_at <= now();

  SELECT count(*) INTO v_used FROM public.lightning_quiz_sessions
   WHERE user_id = v_user
     AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today;

  IF v_used >= 3 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'daily_limit', 'used', v_used, 'limit', 3);
  END IF;

  SELECT array_agg(id) INTO v_ids FROM (
    SELECT id FROM public.lightning_quiz_questions
     WHERE is_active ORDER BY random() LIMIT 10
  ) s;

  IF v_ids IS NULL OR array_length(v_ids, 1) < 3 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_questions');
  END IF;

  v_key := 'round:' || v_today::text || ':' || (v_used + 1)::text;

  INSERT INTO public.lightning_quiz_sessions (user_id, dedupe_key, question_ids, deadline_at)
  VALUES (v_user, v_key, v_ids, now() + interval '60 seconds')
  RETURNING * INTO v_session;

  SELECT id, statement, category, difficulty INTO v_q
    FROM public.lightning_quiz_questions WHERE id = v_ids[1];

  RETURN jsonb_build_object(
    'success', true, 'replayed', false,
    'session_id', v_session.id,
    'deadline_at', v_session.deadline_at,
    'total', array_length(v_ids, 1),
    'index', 0, 'correct_count', 0, 'wrong_count', 0, 'current_streak', 0,
    'question', jsonb_build_object(
      'id', v_q.id, 'statement', v_q.statement,
      'category', v_q.category, 'difficulty', v_q.difficulty)
  );
END;
$$;

-- ------------------------------------------------------------
-- answer_lightning_question: valida no servidor e avança
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.answer_lightning_question(
  p_session_id UUID,
  p_idx INTEGER,
  p_answer BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_s RECORD;
  v_qid UUID;
  v_correct BOOLEAN;
  v_expected BOOLEAN;
  v_explanation TEXT;
  v_elapsed INTEGER;
  v_total INTEGER;
  v_next RECORD;
  v_streak INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('lightning_quiz:' || v_user::text));

  SELECT * INTO v_s FROM public.lightning_quiz_sessions
   WHERE id = p_session_id AND user_id = v_user
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_s.status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'finished');
  END IF;

  IF v_s.deadline_at <= now() THEN
    RETURN jsonb_build_object('success', false, 'reason', 'expired');
  END IF;

  -- O índice é ditado pelo servidor: cliente fora de ordem é rejeitado.
  IF p_idx IS DISTINCT FROM v_s.current_index THEN
    RETURN jsonb_build_object('success', false, 'reason', 'out_of_order', 'index', v_s.current_index);
  END IF;

  v_total := array_length(v_s.question_ids, 1);
  v_qid := v_s.question_ids[v_s.current_index + 1];
  IF v_qid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'completed');
  END IF;

  SELECT is_true, explanation INTO v_expected, v_explanation
    FROM public.lightning_quiz_questions WHERE id = v_qid;

  v_correct := (COALESCE(p_answer, false) = v_expected);
  v_elapsed := GREATEST(0, LEAST(60000,
    (EXTRACT(EPOCH FROM (now() - COALESCE(
      (SELECT max(created_at) FROM public.lightning_quiz_answers WHERE session_id = v_s.id),
      v_s.started_at))) * 1000)::int));

  -- Índice único (session_id, idx) é a barreira final anti-duplo-crédito.
  INSERT INTO public.lightning_quiz_answers
    (session_id, user_id, question_id, idx, answered_true, is_correct, elapsed_ms)
  VALUES (v_s.id, v_user, v_qid, v_s.current_index, COALESCE(p_answer, false), v_correct, v_elapsed)
  ON CONFLICT (session_id, idx) DO NOTHING;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'race');
  END IF;

  v_streak := CASE WHEN v_correct THEN v_s.current_streak + 1 ELSE 0 END;

  UPDATE public.lightning_quiz_sessions
     SET current_index = current_index + 1,
         correct_count = correct_count + CASE WHEN v_correct THEN 1 ELSE 0 END,
         wrong_count = wrong_count + CASE WHEN v_correct THEN 0 ELSE 1 END,
         current_streak = v_streak,
         best_streak = GREATEST(best_streak, v_streak)
   WHERE id = v_s.id AND current_index = p_idx
  RETURNING * INTO v_s;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'race');
  END IF;

  IF v_s.current_index < v_total THEN
    SELECT id, statement, category, difficulty INTO v_next
      FROM public.lightning_quiz_questions
     WHERE id = v_s.question_ids[v_s.current_index + 1];
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'is_correct', v_correct,
    'expected', v_expected,
    'explanation', v_explanation,
    'elapsed_ms', v_elapsed,
    'index', v_s.current_index,
    'total', v_total,
    'correct_count', v_s.correct_count,
    'wrong_count', v_s.wrong_count,
    'current_streak', v_s.current_streak,
    'best_streak', v_s.best_streak,
    'completed', v_s.current_index >= v_total,
    'question', CASE WHEN v_next.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_next.id, 'statement', v_next.statement,
      'category', v_next.category, 'difficulty', v_next.difficulty) END
  );
END;
$$;

-- ------------------------------------------------------------
-- finish_lightning_round: credita prêmio uma única vez
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finish_lightning_round(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_s RECORD;
  v_coins INTEGER;
  v_xp INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('lightning_quiz:' || v_user::text));

  SELECT * INTO v_s FROM public.lightning_quiz_sessions
   WHERE id = p_session_id AND user_id = v_user
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_s.status = 'finished' THEN
    RETURN jsonb_build_object(
      'success', true, 'replayed', true,
      'correct_count', v_s.correct_count, 'wrong_count', v_s.wrong_count,
      'best_streak', v_s.best_streak,
      'coins_awarded', v_s.coins_awarded, 'xp_awarded', v_s.xp_awarded);
  END IF;

  -- Economia: 5 moedas + 8 XP por acerto, bônus de sequência a partir de 5.
  v_coins := LEAST(200, v_s.correct_count * 5 + CASE WHEN v_s.best_streak >= 5 THEN 25 ELSE 0 END);
  v_xp := LEAST(300, v_s.correct_count * 8 + CASE WHEN v_s.best_streak >= 5 THEN 20 ELSE 0 END);

  UPDATE public.lightning_quiz_sessions
     SET status = 'finished', finished_at = now(),
         coins_awarded = v_coins, xp_awarded = v_xp
   WHERE id = v_s.id AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'race');
  END IF;

  IF v_coins > 0 OR v_xp > 0 THEN
    UPDATE public.profiles
       SET coins = coins + v_coins,
           xp = xp + v_xp,
           level = GREATEST(level, floor((xp + v_xp) / 1000) + 1)
     WHERE id = v_user;
  END IF;

  RETURN jsonb_build_object(
    'success', true, 'replayed', false,
    'correct_count', v_s.correct_count, 'wrong_count', v_s.wrong_count,
    'best_streak', v_s.best_streak,
    'coins_awarded', v_coins, 'xp_awarded', v_xp);
END;
$$;

REVOKE ALL ON FUNCTION public.start_lightning_round() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.answer_lightning_question(UUID, INTEGER, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finish_lightning_round(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_lightning_round() TO authenticated;
GRANT EXECUTE ON FUNCTION public.answer_lightning_question(UUID, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_lightning_round(UUID) TO authenticated;

INSERT INTO public.lightning_quiz_questions (statement, is_true, explanation, category, difficulty) VALUES
  ('Tarefas entregues após o prazo geram penalidade de pontos.', true, 'O sistema aplica dedução automática por atraso.', 'processos', 'easy'),
  ('É permitido compartilhar sua senha com um colega de equipe.', false, 'Credenciais são pessoais e intransferíveis.', 'seguranca', 'easy'),
  ('O check-in de ponto contribui para a sua sequência de assiduidade.', true, NULL, 'processos', 'easy'),
  ('Moedas do sistema podem ser trocadas por benefícios na Loja.', true, NULL, 'gamificacao', 'easy'),
  ('O XP pode ser transferido diretamente entre colaboradores.', false, 'XP é individual e não transferível.', 'gamificacao', 'easy'),
  ('Retrabalho registrado em uma entrega reduz a pontuação final.', true, NULL, 'processos', 'medium'),
  ('Pesquisas de clima anônimas identificam o respondente para o gestor.', false, 'O anonimato é garantido por agregação mínima.', 'cultura', 'medium'),
  ('O eNPS varia de -100 a 100.', true, NULL, 'cultura', 'medium'),
  ('Trilhas de aprendizagem emitem certificado verificável ao serem concluídas.', true, NULL, 'lms', 'easy'),
  ('Um plano de ação 5W2H responde: o quê, por quê, onde, quando, quem, como e quanto.', true, NULL, 'processos', 'medium'),
  ('A NR-1 trata do gerenciamento de riscos ocupacionais, incluindo psicossociais.', true, NULL, 'compliance', 'medium'),
  ('Feedback construtivo deve focar na pessoa, e não no comportamento.', false, 'O foco correto é o comportamento observável.', 'cultura', 'medium'),
  ('É seguro clicar em links de e-mails inesperados pedindo login.', false, 'Phishing clássico: nunca clicar nem informar credenciais.', 'seguranca', 'easy'),
  ('A autenticação em dois fatores aumenta a segurança da conta.', true, NULL, 'seguranca', 'easy'),
  ('Missões departamentais têm métricas específicas por área.', true, NULL, 'gamificacao', 'easy'),
  ('A Roleta da Sorte pode ser girada infinitas vezes por dia.', false, 'Há limite diário de giros.', 'gamificacao', 'easy'),
  ('O combo multiplica pontos em ações consecutivas.', true, NULL, 'gamificacao', 'medium'),
  ('Metas coletivas de campanha permitem rateio entre a equipe.', true, NULL, 'campanhas', 'medium'),
  ('Resgates de alto valor podem passar por análise de risco antes da aprovação.', true, NULL, 'campanhas', 'hard'),
  ('Dados pessoais sensíveis podem ser publicados no feed social.', false, 'Viola a proteção de dados pessoais.', 'compliance', 'easy'),
  ('A matriz 9-Box cruza desempenho e potencial.', true, NULL, 'rh', 'medium'),
  ('PDI significa Plano de Desenvolvimento Individual.', true, NULL, 'rh', 'easy'),
  ('Kudos reconhecem publicamente boas atitudes de colegas.', true, NULL, 'cultura', 'easy'),
  ('Uma pesquisa de pulso é mais curta e frequente que uma pesquisa anual.', true, NULL, 'cultura', 'medium');