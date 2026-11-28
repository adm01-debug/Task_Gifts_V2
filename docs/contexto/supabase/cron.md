# Cron (pg_cron)

Horários em UTC. Execuções recentes em `cron-runs.md`.

| id | nome | schedule | ativo | database | usuário | comando |
|---|---|---|---|---|---|---|
| 1 | cleanup-expired-challenges | `0 * * * *` | sim | postgres | postgres | `SELECT public.cleanup_expired_challenges()` |
| 2 | cleanup-idempotency-keys | `0 */2 * * *` | sim | postgres | postgres | `SELECT public.cleanup_expired_idempotency_keys()` |
| 3 | cleanup-old-security-logs | `0 3 * * *` | sim | postgres | postgres | `SELECT public.cleanup_old_security_logs()` |
| 4 | update-certification-statuses | `0 6 * * *` | sim | postgres | postgres | `SELECT public.update_certification_statuses()` |
| 5 | close-expired-campaigns | `30 * * * *` | sim | postgres | postgres | `SELECT * FROM public.close_expired_sales_campaigns()` |
| 6 | check-overdue-postmortems | `0 9 * * *` | sim | postgres | postgres | `SELECT public.check_overdue_postmortem_actions()` |
| 8 | weekly-analyze | `0 2 * * 0` | sim | postgres | postgres | `ANALYZE` |
| 9 | cleanup-webhook-logs | `0 4 * * *` | sim | postgres | postgres | `DELETE FROM public.webhook_delivery_logs WHERE created_at < now() - interval '90 days'` |
| 10 | cleanup-query-telemetry | `0 1 * * *` | sim | postgres | postgres | `DELETE FROM public.query_telemetry WHERE created_at < now() - interval '30 days'` |
| 11 | refresh-leaderboard-cache | `*/5 * * * *` | sim | postgres | postgres | `REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_cache` |
| 13 | auto-lock-prediction-markets | `*/5 * * * *` | sim | postgres | postgres | `SELECT public.auto_lock_prediction_markets()` |
| 14 | close-expired-auctions | `*/5 * * * *` | sim | postgres | postgres | `SELECT public.close_expired_auctions()` |
| 15 | push-outbox-health-snapshot | `*/15 * * * *` | sim | postgres | postgres | `SELECT public.snapshot_push_outbox_health()` |
| 16 | check-prediction-markets-health | `*/15 * * * *` | sim | postgres | postgres | `SELECT public.check_prediction_markets_health()` |
| 17 | lucky-wheel-payout-snapshot | `0 7 * * *` | sim | postgres | postgres | `SELECT public.snapshot_lucky_wheel_payout()` |
| 18 | lucky-wheel-window-alerts | `5 6 * * *` | sim | postgres | postgres | `SELECT public.raise_lucky_wheel_window_alerts()` |
| 19 | expire-card-trades-daily | `10 3 * * *` | sim | postgres | postgres | `SELECT public.expire_card_trades()` |
| 20 | auto-promote-webhook-secrets | `0 3 * * *` | sim | postgres | postgres | `SELECT public.auto_promote_expired_webhook_secrets()` |
| 21 | daily-cleanup-security-logs-30d | `20 3 * * *` | sim | postgres | postgres | `SELECT public.cleanup_old_security_logs(30)` |
| 22 | board-auto-unblock-daily | `0 4 * * *` | sim | postgres | postgres | `SELECT public.auto_unblock_board_players(48)` |
| 23 | webhook-sla-daily-check | `5 4 * * *` | sim | postgres | postgres | `SELECT public.check_webhook_sla_and_alert(95, 24)` |
| 24 | cleanup-job-run-details-7d | `30 4 * * *` | sim | postgres | postgres | `DELETE FROM cron.job_run_details WHERE start_time < now() - interval '7 days'` |
| 25 | exec-monthly-report-generation | `0 6 1 * *` | sim | postgres | postgres | `SELECT public.generate_executive_monthly_report()` |
| 26 | boss-win-rate-critical-alerts | `0 12 * * *` | sim | postgres | postgres | `SELECT public.check_boss_win_rate_alerts()` |
| 27 | sla-breach-weekly-check | `0 8 * * 1` | sim | postgres | postgres | `SELECT public.check_sla_breaches_and_alert()` |
| 28 | api-key-rotation-overdue-weekly | `0 9 * * 1` | sim | postgres | postgres | `SELECT public.check_api_key_rotation_overdue()` |
| 30 | push-outbox-dispatcher | `* * * * *` | sim | postgres | postgres | `   SELECT net.http_post(     url := (SELECT value FROM _internal.dispatch_config WHERE key = 'project_url')            \|\| '/functions/v1/push-outbox-dispatcher',     headers := jsonb_build_object(       'Content-Type', 'application/json',       'x-internal-secret', (SELECT value FROM _internal.dispatch_config WHERE key = 'cron_secret')     ),     body := '{}'::jsonb   ); ` |
| 31 | burn-rate-monitor-5min | `*/5 * * * *` | sim | postgres | postgres | `   SELECT net.http_post(     url := (SELECT value FROM _internal.dispatch_config WHERE key = 'project_url')            \|\| '/functions/v1/burn-rate-monitor',     headers := jsonb_build_object(       'Content-Type', 'application/json',       'x-internal-secret', (SELECT value FROM _internal.dispatch_config WHERE key = 'cron_secret')     ),     body := '{}'::jsonb   ); ` |
| 32 | error-budget-monitor-daily | `0 12 * * *` | sim | postgres | postgres | `   SELECT net.http_post(     url := (SELECT value FROM _internal.dispatch_config WHERE key = 'project_url')            \|\| '/functions/v1/error-budget-monitor',     headers := jsonb_build_object(       'Content-Type', 'application/json',       'x-internal-secret', (SELECT value FROM _internal.dispatch_config WHERE key = 'cron_secret')     ),     body := '{}'::jsonb   ); ` |
| 33 | security-weekly-digest | `0 13 * * 1` | sim | postgres | postgres | `   SELECT net.http_post(     url := (SELECT value FROM _internal.dispatch_config WHERE key = 'project_url')            \|\| '/functions/v1/security-weekly-digest',     headers := jsonb_build_object(       'Content-Type', 'application/json',       'x-internal-secret', (SELECT value FROM _internal.dispatch_config WHERE key = 'cron_secret')     ),     body := '{}'::jsonb   ); ` |
| 34 | webhook-health-monitor-every-15min | `*/15 * * * *` | sim | postgres | postgres | `   SELECT net.http_post(     url := (SELECT value FROM _internal.dispatch_config WHERE key = 'project_url')            \|\| '/functions/v1/webhook-health-monitor',     headers := jsonb_build_object(       'Content-Type', 'application/json',       'x-internal-secret', (SELECT value FROM _internal.dispatch_config WHERE key = 'cron_secret')     ),     body := '{}'::jsonb   ); ` |
| 35 | expire-climate-surveys | `*/15 * * * *` | sim | postgres | postgres | `SELECT public.expire_climate_surveys();` |
| 36 | climate-survey-reminders | `0 12 * * *` | sim | postgres | postgres | `SELECT public.send_climate_survey_reminders();` |
| 65 | engagement-reminders | `0 11 * * 1` | sim | postgres | postgres | `SELECT public.send_engagement_reminders();` |
| 66 | cron-jobs-parados | `20 */6 * * *` | sim | postgres | postgres | `SELECT * FROM public.check_stale_cron_jobs()` |
