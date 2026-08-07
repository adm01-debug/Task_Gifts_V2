-- Create missing check_login_lockout function
CREATE OR REPLACE FUNCTION public.check_login_lockout(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_failed_attempts INTEGER;
  v_lockout_until TIMESTAMPTZ;
  v_is_locked BOOLEAN := false;
  v_remaining_seconds INTEGER := 0;
  v_lockout_minutes INTEGER := 0;
BEGIN
  -- Count recent failed attempts (last 30 minutes)
  SELECT COUNT(*) INTO v_failed_attempts
  FROM login_attempts
  WHERE email = lower(trim(p_email))
  AND error_message IS NOT NULL
  AND created_at > now() - INTERVAL '30 minutes';
  
  -- Determine lockout based on failed attempts
  IF v_failed_attempts >= 10 THEN
    v_lockout_minutes := 30;
  ELSIF v_failed_attempts >= 7 THEN
    v_lockout_minutes := 15;
  ELSIF v_failed_attempts >= 5 THEN
    v_lockout_minutes := 5;
  END IF;
  
  IF v_lockout_minutes > 0 THEN
    -- Get the most recent failed attempt time
    SELECT created_at + (v_lockout_minutes * INTERVAL '1 minute')
    INTO v_lockout_until
    FROM login_attempts
    WHERE email = lower(trim(p_email))
    AND error_message IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_lockout_until > now() THEN
      v_is_locked := true;
      v_remaining_seconds := EXTRACT(EPOCH FROM (v_lockout_until - now()))::INTEGER;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'is_locked', v_is_locked,
    'failed_attempts', v_failed_attempts,
    'remaining_seconds', v_remaining_seconds,
    'lockout_until', v_lockout_until,
    'lockout_minutes', v_lockout_minutes
  );
END;
$function$;