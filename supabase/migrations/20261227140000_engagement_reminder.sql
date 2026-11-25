-- Lembrete semanal da pesquisa de engajamento (in-app + push).
--
-- Medido em 2026-11-25 no projeto de producao:
--   * engagement_cycles tem 1 ciclo `active` (e913a5e7..., 07/08 a 31/12);
--   * engagement_question_assignments: 24 linhas, 6 colaboradores (todos os
--     profiles `confirmed`), 14 perguntas sem resposta;
--   * engagement_answers: 0 linhas;
--   * public.notifications com type LIKE 'engagement%': 0 linhas.
-- Ou seja: a atribuicao e' criada de forma preguicosa quando o colaborador abre
-- /engajamento (assign_engagement_questions), mas nada avisa quem nao abre - a
-- pesquisa fica parada. O unico caminho de entrada era o proprio site.
--
-- Este arquivo faz tres coisas:
--   1) corrige `answered_at` orfao: 10 atribuicoes estavam marcadas como
--      respondidas em 07/08 sem a resposta correspondente em
--      engagement_answers (a tabela esta vazia). Sem isso a pessoa continued
--      "concluida" na metrica e nunca receberia lembrete. Idempotente e sem
--      DELETE: apenas devolve a pergunta para pendente.
--   2) send_engagement_reminders(): lembrete por balde SEMANAL (segunda),
--      seguindo o mesmo desenho de send_climate_survey_reminders() - in-app em
--      public.notifications e fila de push por public.enqueue_push().
--   3) job pg_cron `engagement-reminders` (segunda 11:00 UTC = 08:00 BRT).
--      cron.schedule faz upsert por nome, entao reaplicar nao duplica job.

-- 1) Atribuicao marcada como respondida sem resposta correspondente ----------
UPDATE public.engagement_question_assignments a
   SET answered_at = NULL
 WHERE a.answered_at IS NOT NULL
   AND NOT EXISTS (
         SELECT 1
           FROM public.engagement_answers r
          WHERE r.cycle_id   = a.cycle_id
            AND r.question_id = a.question_id
            AND r.user_id    = a.user_id
       );

-- 2) Lembrete ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.send_engagement_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows      integer := 0;
  v_inseridos integer;
  v_mensagem  text;
  e           record;
BEGIN
  FOR e IN
    WITH elegiveis AS (
      SELECT c.id    AS cycle_id,
             c.title AS cycle_title,
             c.ends_at,
             a.user_id,
             count(*) AS pendentes,
             date_trunc('week', now())::date AS balde
        FROM public.engagement_question_assignments a
        JOIN public.engagement_cycles c
          ON c.id = a.cycle_id
        JOIN public.profiles p
          ON p.id = a.user_id
         AND p.status = 'confirmed'
       WHERE a.answered_at IS NULL
         AND c.status = 'active'
         AND c.starts_at <= now()
         AND c.ends_at > now()
       GROUP BY c.id, c.title, c.ends_at, a.user_id
    )
    SELECT * FROM elegiveis
  LOOP
    v_mensagem := 'Voce tem ' || e.pendentes
      || CASE WHEN e.pendentes = 1 THEN ' pergunta' ELSE ' perguntas' END
      || ' da pesquisa "' || e.cycle_title || '" esperando resposta ate '
      || to_char(e.ends_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM')
      || ' (horario de Brasilia). Sao poucos minutos e ajuda a empresa a agir'
      || ' sobre o que incomoda o time.';

    IF public.user_wants_in_app_notification(e.user_id, 'engagement_survey_reminder') THEN
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (e.user_id,
              'engagement_survey_reminder',
              'Pesquisa de engajamento esperando voce',
              v_mensagem,
              jsonb_build_object('cycle_id', e.cycle_id,
                                 'balde', e.balde,
                                 'url', '/engajamento'))
      ON CONFLICT DO NOTHING;

      GET DIAGNOSTICS v_inseridos = ROW_COUNT;
      v_rows := v_rows + v_inseridos;
    END IF;

    -- enqueue_push() ja filtra a preferencia de push e o dedupe_key unico.
    PERFORM public.enqueue_push(
      e.user_id,
      'engagement_survey_reminder',
      'Pesquisa de engajamento esperando voce',
      v_mensagem,
      'engagement_reminder:' || e.cycle_id::text || ':' || e.user_id::text || ':' || e.balde::text,
      '/engajamento',
      jsonb_build_object('cycle_id', e.cycle_id, 'balde', e.balde)
    );
  END LOOP;

  RETURN v_rows;
END;
$$;

COMMENT ON FUNCTION public.send_engagement_reminders() IS
  'Lembrete in-app + push (balde semanal) para quem tem pergunta de engajamento pendente em ciclo ativo. Job cron engagement-reminders.';

REVOKE ALL ON FUNCTION public.send_engagement_reminders() FROM PUBLIC, anon, authenticated;

-- 3) Agendamento ------------------------------------------------------------
SELECT cron.schedule('engagement-reminders', '0 11 * * 1',
                     $$SELECT public.send_engagement_reminders();$$);