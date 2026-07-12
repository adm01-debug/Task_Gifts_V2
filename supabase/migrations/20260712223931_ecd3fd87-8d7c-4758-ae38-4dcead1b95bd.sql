-- Fix: get_burn_rate rejeitava chamadas do service_role (cron/edge functions)
-- porque auth.uid() é NULL nesses contextos e has_role retornava false.
-- Agora: exige admin apenas quando há um usuário autenticado (auth.uid() IS NOT NULL);
-- chamadas internas do service_role/cron passam livremente (a função continua SECURITY DEFINER
-- e o GRANT EXECUTE segue restrito a authenticated + service_role).
CREATE OR REPLACE FUNCTION public.get_burn_rate(_minutes integer, _slo numeric DEFAULT 99.0)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since timestamptz := now() - make_interval(mins => _minutes);
  v_wh_total bigint; v_wh_fail bigint;
  v_api_total bigint; v_api_fail bigint;
  v_allowed numeric := (100.0 - _slo) / 100.0;
  v_wh_rate numeric := 0; v_api_rate numeric := 0;
  v_wh_burn numeric := 0; v_api_burn numeric := 0;
BEGIN
  -- Autoriza somente admins quando a chamada vem de um usuário logado.
  -- Chamadas do service_role/cron (auth.uid() IS NULL) passam por design.
  IF auth.uid() IS NOT NULL AND NOT COALESCE(public.has_role(auth.uid(), 'admin'::app_role), false) THEN
    RAISE EXCEPTION 'access denied' USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE success = false)
    INTO v_wh_total, v_wh_fail
    FROM public.webhook_delivery_logs WHERE created_at >= v_since;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE response_status >= 500)
    INTO v_api_total, v_api_fail
    FROM public.api_request_logs WHERE created_at >= v_since;

  IF v_wh_total > 0 THEN
    v_wh_rate := v_wh_fail::numeric / v_wh_total::numeric;
    IF v_allowed > 0 THEN v_wh_burn := v_wh_rate / v_allowed; END IF;
  END IF;
  IF v_api_total > 0 THEN
    v_api_rate := v_api_fail::numeric / v_api_total::numeric;
    IF v_allowed > 0 THEN v_api_burn := v_api_rate / v_allowed; END IF;
  END IF;

  RETURN jsonb_build_object(
    'window_minutes', _minutes,
    'slo', _slo,
    'webhooks', jsonb_build_object(
      'total', v_wh_total, 'failures', v_wh_fail,
      'error_rate', v_wh_rate, 'burn_rate', v_wh_burn
    ),
    'api_external', jsonb_build_object(
      'total', v_api_total, 'failures', v_api_fail,
      'error_rate', v_api_rate, 'burn_rate', v_api_burn
    ),
    'computed_at', now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_burn_rate(integer, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_burn_rate(integer, numeric) TO authenticated, service_role;