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
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname ILIKE '.weekly_reminder%')
ORDER BY start_time DESC
LIMIT 20