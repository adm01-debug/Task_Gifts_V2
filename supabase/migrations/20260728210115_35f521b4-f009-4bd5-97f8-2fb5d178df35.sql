ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'api_key_created';
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'api_key_rotated';
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'api_key_status_changed';
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'api_key_deleted';