-- Ciclo de vida das pesquisas de clima: encerramento por prazo e lembrete para
-- quem ainda nao respondeu.
--
-- Medido em 2026-11-24 no projeto de producao: a pesquisa ativa tem 11 perguntas
-- e zero respostas. `climate_surveys` nao tem nenhuma rotina que mova
-- `active` -> `completed` quando `ends_at` passa (o CHECK de status aceita
-- draft/scheduled/active/completed/cancelled), e nenhum dos 35 jobs de
-- `cron.job` avisa quem nao respondeu. O formulario grava
-- `send_reminders = true` e `reminder_frequency = 'daily'`
-- (ClimateSurveyForm.tsx:81-82), mas nada lia esses campos.
--
-- Estas duas rotinas fecham o ciclo sem criar edge function nova e sem segredo.

-- 1) Encerra pesquisas vencidas ------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_climate_surveys()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows integer;
BEGIN
  UPDATE public.climate_surveys
     SET status = 'completed',
         updated_at = now()
   WHERE status = 'active'
     AND ends_at IS NOT NULL
     AND ends_at < now();

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;

COMMENT ON FUNCTION public.expire_climate_surveys() IS
  'Fecha pesquisas de clima vencidas (active -> completed). Job cron expire-climate-surveys.';

REVOKE ALL ON FUNCTION public.expire_climate_surveys() FROM PUBLIC, anon, authenticated;

-- 1.1) Indice unico do dedupe das notificacoes ---------------------------------
-- Existe em producao desde antes deste arquivo, mas nenhuma migration do repo o
-- criava: num banco reconstruido `ON CONFLICT DO NOTHING` sozinho nao impede
-- duas notificacoes com o mesmo destinatario, tipo e `data`.
-- A criacao fica dentro de um bloco com EXCEPTION porque um unico historico
-- duplicado faria o `CREATE UNIQUE INDEX` abortar a migration inteira e os jobs
-- do bloco 3 nunca seriam agendados. Com duplicata o indice e' pulado com WARNING
-- e o resto da migration segue - degrada o dedupe, nao derruba o ciclo.
DO $idx$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = 'notifications_user_type_data_unique'
  ) THEN
    CREATE UNIQUE INDEX notifications_user_type_data_unique
      ON public.notifications USING btree (user_id, type, (((data))::text));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notifications_user_type_data_unique nao criado (%): dedupe de notificacoes fica desligado', SQLERRM;
END;
$idx$;

-- 2) Lembra quem nao respondeu -------------------------------------------------
-- Publico: contas `confirmed` (profiles_status_check) sem resposta registrada e
-- que nao pausaram as notificacoes no proprio perfil - quem optou por nao
-- receber in-app nao recebe lembrete (public.user_wants_in_app_notification).
-- Janela: pesquisa `active`, dentro do periodo e a no maximo 7 dias do fim.
-- A comparacao e' por data no fuso de Brasilia (mesmo fuso da mensagem): contar
-- por `now() + interval '7 days'` empurrava o primeiro lembrete para o dia
-- seguinte quando o `ends_at` estava algumas horas depois da hora do job.
-- Depois de `ends_at` o proprio `climate_submit_response` recusa a resposta
-- ("survey period is over"), entao lembrar ali seria inutil - quem encerra e' a
-- rotina 1.
-- Cadencia: `reminder_frequency = 'weekly'` agrupa por semana (date_trunc('week')),
-- qualquer outro valor cai no balde diario. O balde entra em `data` e o indice
-- unico `notifications_user_type_data_unique` (criado no bloco 1.1)
-- garante no maximo um lembrete por balde e por pesquisa. `data` leva so
-- `survey_id` e `balde`: o prazo fica no texto da mensagem, ja convertido para
-- Brasilia. Manter `ends_at` tambem no `data` so enfraqueceria a chave do dedupe
-- (mudar o prazo da pesquisa liberaria um lembrete extra) e nenhuma tela le esse
-- campo - a central de notificacoes exibe o texto gravado.
CREATE OR REPLACE FUNCTION public.send_climate_survey_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows integer;
BEGIN
  WITH elegiveis AS (
    SELECT s.id    AS survey_id,
           s.title AS survey_title,
           s.ends_at,
               s.is_anonymous,
           p.id    AS user_id,
           CASE WHEN s.reminder_frequency = 'weekly'
                THEN date_trunc('week', now())::date
                ELSE current_date
           END     AS balde
      FROM public.climate_surveys s
      JOIN public.profiles p
        ON p.status = 'confirmed'
     WHERE s.status = 'active'
       AND s.send_reminders
           AND public.user_wants_in_app_notification(p.id, 'climate_survey_reminder')
       AND (s.starts_at IS NULL OR s.starts_at <= now())
       AND s.ends_at IS NOT NULL
       AND s.ends_at > now()
       AND (s.ends_at AT TIME ZONE 'America/Sao_Paulo')::date
           <= ((now() AT TIME ZONE 'America/Sao_Paulo')::date + 7)
       AND NOT EXISTS (
             SELECT 1
               FROM public.climate_survey_responses r
              WHERE r.survey_id = s.id
                AND r.user_id = p.id
           )
  )
  INSERT INTO public.notifications (user_id, type, title, message, data)
  SELECT e.user_id,
         'climate_survey_reminder',
         'Pesquisa de clima aberta',
         'A pesquisa "' || e.survey_title || '" fica aberta ate '
           || to_char(e.ends_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM')
                    || ' (horario de Brasilia). A resposta leva poucos minutos'
                    || CASE WHEN e.is_anonymous THEN ' e e anonima.' ELSE '.' END,
                  jsonb_build_object('survey_id', e.survey_id, 'balde', e.balde)
    FROM elegiveis e
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;

COMMENT ON FUNCTION public.send_climate_survey_reminders() IS
  'Lembrete in-app para quem nao respondeu pesquisa de clima ativa a <=7 dias do fim. Job cron climate-survey-reminders.';

REVOKE ALL ON FUNCTION public.send_climate_survey_reminders() FROM PUBLIC, anon, authenticated;

-- 3) Agendamento ----------------------------------------------------------------
-- cron.schedule(job_name, schedule, command) faz upsert por nome (pg_cron 1.6.4),
-- entao reaplicar este arquivo nao duplica job.
SELECT cron.schedule('expire-climate-surveys', '*/15 * * * *',
                     $$SELECT public.expire_climate_surveys();$$);

SELECT cron.schedule('climate-survey-reminders', '0 12 * * *',
                     $$SELECT public.send_climate_survey_reminders();$$);
