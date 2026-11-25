-- Integridade do engajamento + remoção de sobra de sondagem + anon sem escrita.
--
-- 1) `engagement_answers.normalized_score` não tinha CHECK: a RPC limitava a 0..10,
--    mas a policy `engagement_answers_user_insert` deixa qualquer cliente autenticado
--    inserir direto via PostgREST, e o valor entrava sem limite e distorcia a média
--    por pilar/departamento (os cálculos de NPS e snapshot leem essa coluna).
-- 2) `submit_engagement_answer` aceitava responder qualquer pergunta do pool em
--    qualquer ciclo, inclusive fora das atribuições do usuário
--    (`assign_engagement_questions` é quem distribui as `questions_per_user`).
-- 3) `public._rls_probe` era sobra de sondagem de RLS: 0 linhas, RLS desligada,
--    sem nenhuma referência em `supabase/migrations` nem em `src/`.
-- 4) `anon` mantinha INSERT/UPDATE/DELETE/TRUNCATE em 234 tabelas do schema `public`
--    que não têm nenhuma policy para `anon` — o bloqueio acontecia só pela RLS. Com o
--    REVOKE ALL, `anon` fica sem privilégio de tabela alguma (o que o app anônimo usa
--    é RPC: `request_password_reset_by_email`, `reset_password_with_token`), e a
--    proteção deixa de depender de a RLS continuar ligada e sem política para `anon`.
--    `ALTER DEFAULT PRIVILEGES` impede que as próximas tabelas voltem com o grant.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.engagement_answers'::regclass
       AND conname = 'engagement_answers_normalized_score_check'
  ) THEN
    ALTER TABLE public.engagement_answers
      ADD CONSTRAINT engagement_answers_normalized_score_check
      CHECK (normalized_score IS NULL OR (normalized_score >= 0 AND normalized_score <= 10));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.submit_engagement_answer(p_cycle_id uuid, p_question_id uuid, p_raw_value jsonb, p_normalized_score numeric DEFAULT NULL::numeric, p_text_answer text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user UUID := auth.uid(); v_dept UUID; v_id UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.engagement_question_assignments a WHERE a.cycle_id = p_cycle_id AND a.question_id = p_question_id AND a.user_id = v_user) THEN
    RAISE EXCEPTION 'pergunta nao atribuida ao usuario neste ciclo' USING ERRCODE = '42501';
  END IF;
  SELECT tm.department_id INTO v_dept FROM public.team_members tm WHERE tm.user_id = v_user ORDER BY tm.joined_at DESC LIMIT 1;
  INSERT INTO public.engagement_answers (cycle_id, question_id, user_id, department_id, raw_value, normalized_score, text_answer) VALUES (p_cycle_id, p_question_id, v_user, v_dept, p_raw_value, LEAST(GREATEST(p_normalized_score, 0), 10), p_text_answer) ON CONFLICT (cycle_id, question_id, user_id) DO UPDATE SET raw_value = EXCLUDED.raw_value, normalized_score = EXCLUDED.normalized_score, text_answer = EXCLUDED.text_answer, answered_at = now() RETURNING id INTO v_id;
  UPDATE public.engagement_question_assignments SET answered_at = now() WHERE cycle_id = p_cycle_id AND question_id = p_question_id AND user_id = v_user;
  RETURN v_id;
END; $function$;

DROP TABLE IF EXISTS public._rls_probe;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;

-- Leitura anonima de volta onde a propria policy declara leitura publica (qual = true).
-- Sem isto o visitante deslogado perde a marca da organizacao (organizationService le
-- "organizations" pelo hostname antes do login) e passa a receber 401 em vez de lista vazia.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT DISTINCT tablename FROM pg_policies
    WHERE schemaname = 'public' AND cmd = 'SELECT' AND qual = 'true'
      AND roles::text LIKE '%public%'
  LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon', r.tablename);
  END LOOP;
END $$;

-- A resposta direta pelo PostgREST nao pode furar a atribuicao. O EXISTS dentro da policy
-- nao serve (a subconsulta reavalia a RLS da tabela alvo e nunca enxerga a linha nova),
-- entao a regra vai num trigger SECURITY DEFINER, que enxerga as atribuicoes e vale para
-- qualquer caminho de escrita. Chamadas sem JWT (service_role, migrations) passam.
CREATE OR REPLACE FUNCTION public.guard_engagement_answer_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.engagement_question_assignments a
    WHERE a.cycle_id = NEW.cycle_id
      AND a.question_id = NEW.question_id
      AND a.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'resposta sem atribuicao no ciclo' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END; $function$;

DROP TRIGGER IF EXISTS trg_guard_engagement_answer_assignment ON public.engagement_answers;
CREATE TRIGGER trg_guard_engagement_answer_assignment
  BEFORE INSERT OR UPDATE ON public.engagement_answers
  FOR EACH ROW EXECUTE FUNCTION public.guard_engagement_answer_assignment();

-- O colaborador nao pode mais criar/mexer na propria atribuicao (seria o caminho para
-- responder qualquer pergunta do pool). A atribuicao continua sendo criada pela RPC
-- assign_engagement_questions, que e SECURITY DEFINER.
DROP POLICY IF EXISTS engagement_question_assignments_user_own ON public.engagement_question_assignments;
CREATE POLICY engagement_question_assignments_user_own ON public.engagement_question_assignments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());