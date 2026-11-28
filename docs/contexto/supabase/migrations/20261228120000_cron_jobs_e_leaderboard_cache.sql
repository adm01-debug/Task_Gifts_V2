-- Paridade producao <-> repositorio (auditoria de 2026-11-25).
--
-- Dois objetos existem em producao e nao eram reproduziveis por um rebuild a
-- partir do repositorio:
--   1. a materialized view public.leaderboard_cache (alvo do job de refresh);
--   2. 15 jobs do pg_cron ativos em producao, medidos em cron.job por nome.
--
-- Os outros dois jobs internos ausentes (burn-rate-monitor-5min e
-- error-budget-monitor-daily) ja sao reproduzidos por
-- 20261224110000_cron_internal_jobs_drift.sql, que os reagenda lendo o
-- x-internal-secret de _internal.dispatch_config.
--
-- Nomes antigos: as migrations desta serie agendam nomes que producao ja
-- substituiu (ex.: weekly-cleanup-expired-challenges rodava semanal e em
-- producao o equivalente roda de hora em hora). Removidos de forma
-- defensiva para que um banco novo termine com exatamente os jobs de
-- producao.
--
-- Idempotente: em producao, onde tudo ja existe, esta migration e no-op
-- (CREATE ... IF NOT EXISTS + guarda por nome em cron.job) - com uma excecao
-- deliberada: o ACL da matview. Producao da GRANT ALL a authenticated e
-- service_role; aqui authenticated e anon recebem REVOKE ALL e o grant fica so
-- em service_role, para nao expor employee_id de todos a qualquer usuario
-- logado (ver o bloco do GRANT, item 1).

CREATE EXTENSION IF NOT EXISTS pg_cron

-- 1) Materialized view consumida por refresh-leaderboard-cache
CREATE MATERIALIZED VIEW IF NOT EXISTS public.leaderboard_cache AS
 SELECT p.id AS user_id,
    p.display_name,
    p.avatar_url,
    p.level,
    p.xp,
    p.coins,
    p.streak,
    p.best_streak,
    p.quests_completed,
    p.status,
    p.employee_id,
    COALESCE(d.name, 'Sem departamento'::text) AS department_name,
    d.id AS department_id,
    COALESCE(pos.name, 'Sem cargo'::text) AS position_name,
    rank() OVER (ORDER BY p.xp DESC) AS global_rank,
    rank() OVER (PARTITION BY d.id ORDER BY p.xp DESC) AS dept_rank,
    COALESCE(ach.total_achievements, 0::bigint) AS total_achievements,
    COALESCE(ts.tasks_completed, 0::bigint) AS tasks_completed,
    now() AS cached_at
   FROM profiles p
     LEFT JOIN user_positions up ON up.user_id = p.id AND up.is_primary = true
     LEFT JOIN positions pos ON pos.id = up.position_id
     LEFT JOIN departments d ON d.id = pos.department_id
     LEFT JOIN ( SELECT user_achievements.user_id,
            count(*) AS total_achievements
           FROM user_achievements
          GROUP BY user_achievements.user_id) ach ON ach.user_id = p.id
     LEFT JOIN ( SELECT task_scores.user_id,
            count(*) FILTER (WHERE task_scores.status = ANY (ARRAY['on_time'::task_completion_status, 'late'::task_completion_status])) AS tasks_completed
           FROM task_scores
          GROUP BY task_scores.user_id) ts ON ts.user_id = p.id
  WHERE p.status = ANY (ARRAY['confirmed'::text, 'invited'::text])
WITH DATA

CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_cache_user ON public.leaderboard_cache (user_id)

CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_xp ON public.leaderboard_cache (xp DESC, global_rank)

CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_dept ON public.leaderboard_cache (department_id, dept_rank)

CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_level ON public.leaderboard_cache (level DESC, xp DESC)

-- ACL de producao medida: `authenticated` e `service_role` com ALL. Aqui o grant
-- vai so para `service_role`: `employee_id` e dado restrito a gestor
-- (`20261226200000_profiles_select_colunas_sensiveis.sql` tira a coluna do SELECT de
-- `authenticated`), e a matview projetaria `employee_id` + totais de tarefas de todos
-- os colaboradores para qualquer usuario logado via PostgREST, driblando aquele
-- allowlist. Nenhum codigo le a matview (0 referencias fora das migrations), entao
-- `authenticated` nao tem consumidor para perder. Em producao isto remove o grant
-- que existe la hoje (unica diferenca intencional em relacao ao medido).
GRANT ALL ON public.leaderboard_cache TO service_role

REVOKE ALL ON public.leaderboard_cache FROM authenticated, anon

-- 2) Jobs do pg_cron presentes em producao e ausentes do repositorio
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-promote-webhook-secrets') THEN
    PERFORM cron.schedule('auto-promote-webhook-secrets', '0 3 * * *', 'SELECT public.auto_promote_expired_webhook_secrets()');
  END IF;
END $$

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'boss-win-rate-critical-alerts') THEN
    PERFORM cron.schedule('boss-win-rate-critical-alerts', '0 12 * * *', 'SELECT public.check_boss_win_rate_alerts()');
  END IF;
END $$

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-overdue-postmortems') THEN
    PERFORM cron.schedule('check-overdue-postmortems', '0 9 * * *', 'SELECT public.check_overdue_postmortem_actions()');
  END IF;
END $$

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-challenges') THEN
    PERFORM cron.schedule('cleanup-expired-challenges', '0 * * * *', 'SELECT public.cleanup_expired_challenges()');
  END IF;
END $$

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-idempotency-keys') THEN
    PERFORM cron.schedule('cleanup-idempotency-keys', '0 */2 * * *', 'SELECT public.cleanup_expired_idempotency_keys()');
  END IF;
END $$

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-job-run-details-7d') THEN
    PERFORM cron.schedule('cleanup-job-run-details-7d', '30 4 * * *', 'DELETE FROM cron.job_run_details WHERE start_time < now() - interval ''7 days''');
  END IF;
END $$

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-security-logs') THEN
    PERFORM cron.schedule('cleanup-old-security-logs', '0 3 * * *', 'SELECT public.cleanup_old_security_logs()');
  END IF;
END $$

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-query-telemetry') THEN
    PERFORM cron.schedule('cleanup-query-telemetry', '0 1 * * *', 'DELETE FROM public.query_telemetry WHERE created_at < now() - interval ''30 days''');
  END IF;
END $$

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-webhook-logs') THEN
    PERFORM cron.schedule('cleanup-webhook-logs', '0 4 * * *', 'DELETE FROM public.webhook_delivery_logs WHERE created_at < now() - interval ''90 days''');
  END IF;
END $$

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'close-expired-campaigns') THEN
    PERFORM cron.schedule('close-expired-campaigns', '30 * * * *', 'SELECT * FROM public.close_expired_sales_campaigns()');
  END IF;
END $$

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'exec-monthly-report-generation') THEN
    PERFORM cron.schedule('exec-monthly-report-generation', '0 6 1 * *', 'SELECT public.generate_executive_monthly_report()');
  END IF;
END $$

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-leaderboard-cache') THEN
    PERFORM cron.schedule('refresh-leaderboard-cache', '*/5 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_cache');
  END IF;
END $$

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sla-breach-weekly-check') THEN
    PERFORM cron.schedule('sla-breach-weekly-check', '0 8 * * 1', 'SELECT public.check_sla_breaches_and_alert()');
  END IF;
END $$

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'update-certification-statuses') THEN
    PERFORM cron.schedule('update-certification-statuses', '0 6 * * *', 'SELECT public.update_certification_statuses()');
  END IF;
END $$

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-analyze') THEN
    PERFORM cron.schedule('weekly-analyze', '0 2 * * 0', 'ANALYZE');
  END IF;
END $$

-- 3) Nomes obsoletos: producao ja usa os nomes equivalentes acima
DO $$
DECLARE
  v_job TEXT;
BEGIN
  FOREACH v_job IN ARRAY ARRAY[
    'daily-cleanup-idempotency',
    'daily-cleanup-security-logs-90d',
    'weekly-cleanup-expired-challenges',
    'close-expired-sales-campaigns',
    'postmortem_overdue_daily_check',
    'auto-promote-expired-webhook-secrets',
    'exec_monthly_report_generation',
    'sla_breach_weekly_check'
  ] LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = v_job) THEN
      PERFORM cron.unschedule(v_job);
    END IF;
  END LOOP;
END $$
