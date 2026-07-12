
ALTER TABLE public.security_alerts DROP CONSTRAINT IF EXISTS security_alerts_alert_type_check;
ALTER TABLE public.security_alerts
  ADD CONSTRAINT security_alerts_alert_type_check
  CHECK (
    alert_type IN (
      'rate_limit_exceeded','brute_force','suspicious_login','ip_blocked',
      'multiple_failed_2fa','unusual_location'
    )
    OR alert_type LIKE 'burn_rate_%'
    OR alert_type LIKE 'error_budget_%'
    OR alert_type LIKE 'sla_%'
    OR alert_type LIKE 'digest_%'
  );
