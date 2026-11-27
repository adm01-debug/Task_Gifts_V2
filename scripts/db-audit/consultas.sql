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
-- O que existe no banco sobre o engagement-reminders sem depender do job_run_details.
-- conta: quantos registros de cada tabela nasceram a partir de uma data de corte.
WITH corte AS (SELECT '2026-11-20 00:00:00+00'::timestamptz AS desde)
SELECT
  (SELECT count(*) FROM public.notifications n, corte WHERE n.created_at >= corte.desde) AS notificacoes,
  (SELECT count(*) FROM public.push_outbox o, corte WHERE o.created_at >= corte.desde) AS push_outbox,
  (SELECT max(n.created_at) FROM public.notifications n) AS ultima_notificacao,
  (SELECT max(o.created_at) FROM public.push_outbox o) AS ultimo_push

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
-- O que chegou em notifications e push_outbox desde 20/11, agrupado por hora e tipo, para reconhecer
-- a entrega do engagement-reminders sem depender de cron.job_run_details.
SELECT date_trunc('hour', n.created_at) AS hora, n.type, count(*) AS avisos,
  count(o.id) AS com_push
FROM public.notifications n
LEFT JOIN public.push_outbox o ON o.notification_id = n.id
WHERE n.created_at >= '2026-11-20 00:00:00+00'::timestamptz
GROUP BY 1, 2
ORDER BY 1 DESC, 2
LIMIT 60

-- nome: colunas_do_push_outbox
-- Nomes e tipos reais das colunas de push_outbox, para saber a ligacao com notifications.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'push_outbox'
ORDER BY ordinal_position
