
-- Performance indexes for the highest-traffic query patterns identified via pg_stat_statements

-- Notifications: WHERE user_id = ? AND read = ?
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications (user_id, read)
  WHERE read = false;

-- League history: WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_league_history_user_created
  ON public.league_history (user_id, created_at DESC);

-- IP whitelist: WHERE is_active = true (partial covers the hot path)
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_active
  ON public.ip_whitelist (is_active)
  WHERE is_active = true;

-- Login attempts: cleanup + lockout check (email + created_at)
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created
  ON public.login_attempts (email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_created
  ON public.login_attempts (ip_address, created_at DESC);

-- Attendance records: dashboards filter by user + check_in
CREATE INDEX IF NOT EXISTS idx_attendance_user_checkin
  ON public.attendance_records (user_id, check_in DESC);

-- Security logs cleanup (created_at)
CREATE INDEX IF NOT EXISTS idx_bitrix24_webhook_logs_processed_created
  ON public.bitrix24_webhook_logs (processed, created_at)
  WHERE processed = true;

-- Rate limit logs: cleanup by created_at
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created
  ON public.rate_limit_logs (created_at);

-- Session logs: active session lookups + cleanup
CREATE INDEX IF NOT EXISTS idx_session_logs_active
  ON public.session_logs (is_active, logout_at)
  WHERE is_active = false;

-- Blocked IPs: hot path lookup
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip_expires
  ON public.blocked_ips (ip_address, expires_at);

-- Refresh stats
ANALYZE public.notifications;
ANALYZE public.league_history;
ANALYZE public.ip_whitelist;
ANALYZE public.login_attempts;
ANALYZE public.attendance_records;
ANALYZE public.session_logs;
ANALYZE public.blocked_ips;
