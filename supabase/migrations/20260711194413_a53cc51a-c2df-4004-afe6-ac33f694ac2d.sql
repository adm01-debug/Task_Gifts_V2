
DROP INDEX IF EXISTS public.idx_webauthn_credentials_credential_id;
DROP INDEX IF EXISTS public.idx_user_combos_user_date;
DROP INDEX IF EXISTS public.idx_permissions_key;
DROP INDEX IF EXISTS public.idx_geo_blocking_rules_country;
DROP INDEX IF EXISTS public.idx_blocked_ips_address;
DROP INDEX IF EXISTS public.idx_geo_allowed_countries_code;
DROP INDEX IF EXISTS public.idx_user_two_factor_user_id;
DROP INDEX IF EXISTS public.idx_notifications_user_read;
DROP INDEX IF EXISTS public.idx_webhook_idempotency_key;
ANALYZE public.webauthn_credentials, public.user_combos, public.permissions, public.geo_blocking_rules, public.blocked_ips, public.geo_allowed_countries, public.user_two_factor, public.notifications, public.webhook_idempotency;
