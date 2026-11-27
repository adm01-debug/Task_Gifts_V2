-- Catalogo de consultas de leitura no banco vivo, usado por
-- .github/workflows/db-migrate.yml (modo consulta -> scripts/db-audit/consultar-sql.mjs).
-- Cada consulta comeca com '-- nome: <slug>' e roda sozinha, numa unica instrucao.
-- Fica versionado de proposito: texto digitado no disparo nunca vira SQL.

-- nome: janela_de_silencio
-- Cobertura do silencio por usuario: quem tem linha ligada, quem so tem a linha padrao e
-- quem ficou de fora do backfill (criado depois dele).
SELECT
  (SELECT count(*) FROM auth.users) AS usuarios,
  (SELECT count(*) FROM public.notification_preferences) AS linhas_de_preferencia,
  (SELECT count(*) FROM public.notification_preferences WHERE do_not_disturb_enabled) AS silencio_ligado,
  (SELECT count(*) FROM public.notification_preferences
    WHERE coalesce(do_not_disturb_start, quiet_hours_start) = '22:00'::time
      AND coalesce(do_not_disturb_end, quiet_hours_end) = '08:00'::time) AS janela_padrao

-- nome: usuarios_sem_preferencia
-- Usuarios sem nenhuma linha em notification_preferences: o silencio e os tipos de aviso nao valem para eles.
SELECT u.id, u.email, u.created_at
FROM auth.users u
LEFT JOIN public.notification_preferences p ON p.user_id = u.id
WHERE p.user_id IS NULL
ORDER BY u.created_at

-- nome: lembrete_semanal_cron
-- Ultimas execucoes do job do lembrete semanal, para provar que saiu sem toque humano.
SELECT jobid, status, return_message, start_time, end_time
FROM cron.job_run_details
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname = 'engagement-reminders')
ORDER BY start_time DESC
LIMIT 20

-- nome: jobs_do_cron
-- Todo job agendado, com o ultimo status conhecido. A "ultima execucao" so vale se o cleanup de
-- 7 dias (cleanup-job-run-details-7d) tambem estiver com execucao recente; senao a tabela pode
-- estar vazia e o NULL significa "sem registro", nao "nunca rodou".
SELECT j.jobid, j.jobname, j.schedule, j.active,
  (SELECT max(d.start_time) FROM cron.job_run_details d WHERE d.jobid = j.jobid) AS ultima_execucao
FROM cron.job j
ORDER BY j.jobid

-- nome: rastros_do_lembrete
-- Por que o engagement-reminders (segunda 11:00 UTC) nao deixa aviso. Olha a serie inteira desde 01/09,
-- nao so os 7 dias do job_run_details: o cleanup-job-run-details-7d apaga o historico.
WITH segundas AS (
  SELECT min(created_at) AS primeiro, count(*) AS avisos
  FROM public.notifications
  WHERE created_at >= '2026-09-01 00:00:00+00'::timestamptz
    AND (extract(isodow FROM created_at) = 1 OR extract(isodow FROM (created_at AT TIME ZONE 'America/Sao_Paulo')) = 1)
), janela AS (
  SELECT count(*) AS avisos_na_hora_do_job
  FROM public.notifications
  WHERE created_at >= '2026-09-01 00:00:00+00'::timestamptz
    AND extract(hour FROM (created_at AT TIME ZONE 'America/Sao_Paulo')) = 8
)
SELECT
  (SELECT count(*) FROM public.notifications) AS notificacoes_total,
  (SELECT count(*) FROM public.push_outbox) AS push_outbox_total,
  (SELECT min(created_at) FROM public.notifications) AS primeira_notificacao,
  (SELECT max(created_at) FROM public.notifications) AS ultima_notificacao,
  (SELECT min(created_at) FROM public.push_outbox) AS primeiro_push,
  (SELECT count(*) FROM public.notifications WHERE created_at >= '2026-09-01 00:00:00+00'::timestamptz) AS notificacoes_desde_setembro,
  (SELECT avisos FROM segundas) AS em_segundas,
  (SELECT avisos_na_hora_do_job FROM janela) AS as_8h_de_brasilia,
  (SELECT count(*) FROM public.notification_preferences WHERE do_not_disturb_enabled) AS silencio_ligado,
  (SELECT count(*) FROM public.notification_preferences) AS linhas_de_preferencia
-- nome: jobs_do_usuario
-- Cobertura da janela de silencio: quantas linhas, quantos usuarios e desde quando.
SELECT count(*) AS linhas, count(DISTINCT user_id) AS usuarios_cobertos,
  count(*) FILTER (WHERE do_not_disturb_enabled) AS silencio_ligado,
  min(created_at) AS primeira_linha, max(created_at) AS ultima_linha
FROM public.notification_preferences

-- nome: ultima_entrega_do_lembrete
-- O que a ultima execucao do engagement-reminders entregou. Vazio quando o job_run_details foi limpo.
SELECT d.jobid, d.status, d.return_message, d.start_time, d.end_time,
  (SELECT count(*) FROM public.notifications n WHERE n.created_at >= d.start_time) AS avisos_criados_desde
FROM cron.job_run_details d
JOIN cron.job j ON j.jobid = d.jobid
WHERE j.jobname = 'engagement-reminders'
ORDER BY d.start_time DESC
LIMIT 5

-- nome: entregas_recentes_do_lembrete
-- O que chegou em notifications e push_outbox desde 20/11, para reconhecer a entrega do
-- engagement-reminders sem depender de cron.job_run_details. push_outbox nao tem o id do aviso:
-- a ligacao possivel e por type + mesma hora, feita em CTE (subquery com coluna da consulta externa
-- e proibida dentro de GROUP BY: erro 42803 no run 46023668003).
WITH avisos AS (
  SELECT date_trunc('hour', created_at) AS hora, type, count(*) AS avisos
  FROM public.notifications
  WHERE created_at >= '2026-11-20 00:00:00+00'::timestamptz
  GROUP BY 1, 2
), pushes AS (
  SELECT date_trunc('hour', created_at) AS hora, type, count(*) AS pushes
  FROM public.push_outbox
  WHERE created_at >= '2026-11-20 00:00:00+00'::timestamptz
  GROUP BY 1, 2
)
SELECT a.hora, a.type, a.avisos, coalesce(p.pushes, 0) AS pushes_na_mesma_hora
FROM avisos a
LEFT JOIN pushes p ON p.hora = a.hora AND p.type = a.type
ORDER BY a.hora DESC, a.type
LIMIT 60

-- nome: entregas_do_lembrete_semanal
-- Entrega do engagement-reminders (segunda, 0 11 * * 1): avisos por data e tipo em toda segunda desde 01/09.
-- O job_run_details nao guarda essa execucao, entao a prova de entrega vem do efeito em notifications
-- e do push enfileirado na mesma hora e do mesmo tipo.
-- Colunas com nome de tabela (created_at) dentro da CTE precisam de GROUP BY pela expressao inteira.
WITH avisos AS (
  SELECT date_trunc('day', n.created_at) AS dia, n.type AS tipo, count(*) AS qtd, min(n.created_at) AS primeiro
  FROM public.notifications n
  WHERE extract(isodow FROM n.created_at) = 1 AND n.created_at >= '2026-09-01 00:00:00+00'::timestamptz
  GROUP BY date_trunc('day', n.created_at), n.type
), pushes AS (
  SELECT date_trunc('hour', o.created_at) AS hora, o.type AS tipo, count(*) AS qtd
  FROM public.push_outbox o
  WHERE extract(isodow FROM o.created_at) = 1
  GROUP BY date_trunc('hour', o.created_at), o.type
)
SELECT a.dia, a.tipo, a.qtd AS avisos, a.primeiro, coalesce(sum(p.qtd), 0) AS pushes_do_dia
FROM avisos a
LEFT JOIN pushes p ON p.tipo = a.tipo AND p.hora = date_trunc('hour', a.primeiro)
GROUP BY a.dia, a.tipo, a.qtd, a.primeiro
ORDER BY a.dia DESC, a.tipo
LIMIT 40

-- nome: ultima_execucao_por_job
-- Data da ultima linha de cada job em cron.job_run_details e quanto dessa tabela ainda existe.
-- Serve para separar "job nunca rodou" de "registro apagado pelo cleanup de 7 dias".
SELECT d.jobid, j.jobname, max(d.start_time) AS ultima_linha, count(*) AS linhas,
  min(d.start_time) AS linha_mais_velha
FROM cron.job_run_details d
JOIN cron.job j ON j.jobid = d.jobid
GROUP BY d.jobid, j.jobname
ORDER BY max(d.start_time) DESC

-- nome: elegiveis_do_lembrete
-- Quantas pessoas a regra do send_engagement_reminders deveria atingir agora: ciclo ativo, dentro da
-- janela e pergunta nao respondida. Zero aqui explica o job 65 sem linha em job_run_details.
WITH ativos AS (
  SELECT id, title, ends_at FROM public.engagement_cycles WHERE status = 'active'
    AND starts_at <= now() AND ends_at > now()
), pendentes AS (
  SELECT a.user_id, count(*) AS perguntas
  FROM public.engagement_question_assignments a
  JOIN ativos c ON c.id = a.cycle_id
  JOIN public.profiles p ON p.id = a.user_id AND p.status = 'confirmed'
  WHERE a.answered_at IS NULL
  GROUP BY a.user_id
)
SELECT (SELECT count(*) FROM public.engagement_cycles) AS ciclos_total,
  (SELECT count(*) FROM ativos) AS ciclos_ativos,
  (SELECT count(*) FROM public.engagement_cycles WHERE status = 'active') AS marcados_ativos,
  (SELECT count(*) FROM public.engagement_question_assignments) AS atribuicoes_total,
  (SELECT count(*) FROM public.engagement_question_assignments WHERE answered_at IS NULL) AS sem_resposta,
  (SELECT count(*) FROM pendentes) AS pessoas_elegiveis,
  (SELECT coalesce(sum(perguntas), 0) FROM pendentes) AS perguntas_pendentes

-- nome: alcance_do_silencio
-- Janela de silencio com a regra que o dispatcher usa (America/Sao_Paulo por padrao) + os tipos que
-- de fato chegariam entre 22h e 8h se a regra fosse aplicada hoje. O dispatcher foi agendado antes
-- da janela entrar no codigo, entao o teste final e um push as 22h.
WITH prefs AS (
  SELECT user_id, do_not_disturb_enabled, do_not_disturb_start AS quiet_hours_start,
    do_not_disturb_end AS quiet_hours_end
  FROM public.notification_preferences
), agora AS (
  SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::time AS hora_local
)
SELECT
  p.do_not_disturb_enabled, p.quiet_hours_start, p.quiet_hours_end, count(*) AS pessoas,
  (SELECT hora_local FROM agora) AS hora_local_agora,
  CASE WHEN p.quiet_hours_start > p.quiet_hours_end
    THEN (SELECT hora_local FROM agora) >= p.quiet_hours_start
         OR (SELECT hora_local FROM agora) < p.quiet_hours_end
    ELSE (SELECT hora_local FROM agora) >= p.quiet_hours_start
         AND (SELECT hora_local FROM agora) < p.quiet_hours_end
  END AS em_silencio_agora,
  (SELECT count(*) FROM public.notifications
    WHERE created_at >= now() - interval '14 days') AS avisos_14_dias,
  (SELECT count(*) FROM public.push_outbox
    WHERE status = 'pending') AS push_pendentes
FROM prefs p
GROUP BY p.do_not_disturb_enabled, p.quiet_hours_start, p.quiet_hours_end
ORDER BY pessoas DESC
-- nome: ensaio_do_lembrete
-- A funcao depende de dados (perfil confirmado, pergunta sem resposta)? Os elegiveis existem,
-- entao o runner abre BEGIN e sempre faz ROLLBACK (nada fica gravado mesmo se a funcao
-- enfileirar avisos), e uma excecao da funcao aparece com a mensagem do Postgres.
BEGIN;
SELECT public.send_engagement_reminders() AS retorno;
-- nome: porque_o_lembrete_nao_enfileira
-- O ensaio devolveu 0 mesmo com 6 elegiveis: a funcao roda, mas nenhuma linha passa pelos filtros.
-- Cada contagem abaixo e' a mesma condicao do send_engagement_reminders, separada, para apontar
-- qual delas zera. `preferencia_in_app` e' a condicao do IF que envolve o INSERT do aviso.
WITH elegiveis AS (
  SELECT c.id AS cycle_id, c.title AS cycle_title, a.user_id, count(*) AS pendentes
  FROM public.engagement_question_assignments a
  JOIN public.engagement_cycles c ON c.id = a.cycle_id
  JOIN public.profiles p ON p.id = a.user_id AND p.status = 'confirmed'
  WHERE a.answered_at IS NULL
    AND c.status = 'active'
    AND c.starts_at <= now()
    AND c.ends_at > now()
  GROUP BY c.id, c.title, a.user_id
)
SELECT (SELECT count(*) FROM elegiveis) AS elegiveis,
  (SELECT count(*) FROM public.profiles WHERE status = 'confirmed') AS perfis_confirmados,
  (SELECT count(*) FROM public.engagement_cycles WHERE status = 'active') AS ciclos_ativos,
  (SELECT count(*) FROM public.engagement_question_assignments WHERE answered_at IS NULL) AS pendentes_ativas,
  (SELECT count(*) FROM elegiveis e WHERE public.user_wants_in_app_notification(e.user_id, 'engagement_survey_reminder')) AS preferencia_in_app,
  (SELECT count(*) FROM public.notifications WHERE type = 'engagement_survey_reminder') AS avisos_existentes,
  (SELECT string_agg(user_id::text || '=' || user_wants_in_app_notification(user_id, 'engagement_survey_reminder')::text, ' ') FROM elegiveis) AS detalhe
-- nome: duplicata_do_lembrete
-- porque_o_lembrete_nao_enfileira mostrou avisos_existentes=6: o INSERT do aviso cai no ON CONFLICT
-- DO NOTHING. Aqui aparece qual constraint esta batendo, isto e, se o aviso ja foi entregue no
-- mesmo balde semanal ou se a linha ficou presa em outro status.
SELECT n.created_at, n.read, n.data->>'balde' AS balde, n.user_id,
  (n.data->>'balde') = date_trunc('week', now())::date::text AS mesmo_balde_desta_semana,
  (SELECT count(*) FROM public.push_outbox o
    WHERE o.user_id = n.user_id AND o.type = 'engagement_survey_reminder') AS pushes_da_pessoa
FROM public.notifications n
WHERE n.type = 'engagement_survey_reminder'
ORDER BY n.created_at DESC

-- nome: comparecimento_do_cron
-- O lembrete semanal (jobid 65) nunca teve linha em cron.job_run_details, enquanto outros jobs do
-- mesmo pg_cron rodam. Aqui cada job aparece com o agendamento registrado, quantas execucoes
-- ficaram na janela retida e a ultima. Job ativo com zero execucao = o agendador nao esta'
-- disparando aquele job, e nao o codigo dele.
SELECT j.jobid, j.jobname, j.schedule, j.active, j.username,
  (SELECT count(*) FROM cron.job_run_details d WHERE d.jobid = j.jobid) AS execucoes,
  (SELECT max(d.start_time) FROM cron.job_run_details d WHERE d.jobid = j.jobid) AS ultima,
  left(j.command, 70) AS comando
FROM cron.job j
ORDER BY execucoes ASC, j.jobid
-- nome: prova_do_vigia
-- Prova em producao que o vigia enxerga o que deveria: jobs ativos, o marco zero criado para quem
-- nunca rodou, e o que check_stale_cron_jobs(p_force => true) devolve. `p_force` ignora a espera
-- (um job morto ha semanas nao espere 8 dias para aparecer), mas nao cria job nem apaga nada.
SELECT (SELECT count(*) FROM cron.job WHERE active) AS jobs_ativos,
  (SELECT count(*) FROM public.cron_job_watch_baseline) AS marcos_zero,
  (SELECT count(*) FROM cron.job WHERE jobname = 'cron-jobs-parados') AS vigia_agendado,
  (SELECT schedule FROM cron.job WHERE jobname = 'cron-jobs-parados') AS vigia_schedule,
  (SELECT count(*) FROM public.check_stale_cron_jobs(true)) AS parados
