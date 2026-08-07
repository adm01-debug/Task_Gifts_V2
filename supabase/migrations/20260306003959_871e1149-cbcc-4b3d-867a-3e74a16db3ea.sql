-- Fix 1: Allow PostgREST/Reatime HEAD/SELECT requests on weekly_challenges for anon/authenticated roles
GRANT SELECT ON TABLE public.weekly_challenges TO anon, authenticated;

-- Ensure public read policy exists and stays permissive for read-only leaderboard/challenge widgets
DROP POLICY IF EXISTS "Anyone can view weekly challenges" ON public.weekly_challenges;
CREATE POLICY "Anyone can view weekly challenges"
ON public.weekly_challenges
FOR SELECT
TO anon, authenticated
USING (true);

-- Fix 2: Prevent login logging failures when client cannot resolve IP
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_email text,
  p_ip_address inet,
  p_user_agent text,
  p_attempt_type text DEFAULT 'password'::text,
  p_error_message text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_log_id UUID;
  v_recent_failures INTEGER;
  v_lockout_status JSONB;
  v_effective_ip inet := COALESCE(p_ip_address, '0.0.0.0'::inet);
BEGIN
  -- Register attempt even when IP is unavailable
  INSERT INTO public.login_attempts (email, ip_address, user_agent, attempt_type, error_message)
  VALUES (p_email, v_effective_ip, p_user_agent, p_attempt_type, p_error_message)
  RETURNING id INTO v_log_id;

  -- Count recent failures by effective IP
  SELECT COUNT(*) INTO v_recent_failures
  FROM public.login_attempts
  WHERE ip_address = v_effective_ip
    AND created_at > now() - INTERVAL '15 minutes'
    AND error_message IS NOT NULL;

  -- Auto-block only for real IPs (skip placeholder 0.0.0.0)
  IF v_recent_failures >= 10 AND v_effective_ip <> '0.0.0.0'::inet THEN
    PERFORM public.auto_block_ip(
      v_effective_ip,
      'Múltiplas tentativas de login falhadas (' || v_recent_failures || ' em 15 min)',
      'brute_force',
      30
    );
  END IF;

  v_lockout_status := public.check_login_lockout(p_email);

  RETURN jsonb_build_object(
    'log_id', v_log_id,
    'lockout_status', v_lockout_status
  );
END;
$function$;