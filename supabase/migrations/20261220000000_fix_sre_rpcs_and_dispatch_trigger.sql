-- Fix das 2 RPCs SRE quebradas + trigger de alerta apontando para projeto errado.
-- Evidências (produção, 2026-12-20):
--   * error-budget-monitor (cron 31) → 500 {"ok":false,"error":"unknown"};
--     get_error_budget_30d roda com auth.uid() NULL (service_role/cron) e o guard
--     `has_role(auth.uid(),'admin')` retorna NULL → RAISE P0001 "access_denied: admin only".
--   * get_error_budget_30d referencia `status_code`, coluna inexistente em
--     api_request_logs (a real é response_status) → 42703.
--   * get_webhook_delivery_stats_1h usa current_setting('request.jwt.claim.role')
--     = 'service_role' como guard; GUC é sempre NULL fora do PostgREST → 0 linhas
--     para o webhook-health-monitor com service_role.
--   * trigger_dispatch_critical_alert() aponta para https://awzhgfmqwddzgbqzqusc.supabase.co
--     (projeto errado) e manda um JWT anon daquele projeto; a edge
--     dispatch-critical-alert só aceita service_role / INTERNAL_FUNCTION_SECRET /
--     CRON_SECRET via verifyServiceRole → chamada do trigger nunca autenticava.
-- Idempotente por construção (CREATE OR REPLACE / REVOKE+GRANT preservados).

-- 1) get_error_budget_30d: guard canônico (permite service_role/cron) + response_status
CREATE OR REPLACE FUNCTION public.get_error_budget_30d(
  p_webhook_slo NUMERIC DEFAULT 99.0,
  p_api_slo NUMERIC DEFAULT 99.0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_result JSONB;
  v_wh_total BIGINT;
  v_wh_success BIGINT;
  v_wh_fail BIGINT;
  v_wh_rate NUMERIC;
  v_wh_budget_total NUMERIC;
  v_wh_budget_consumed NUMERIC;
  v_wh_burn_pct NUMERIC;
  v_api_total BIGINT;
  v_api_success BIGINT;
  v_api_fail BIGINT;
  v_api_rate NUMERIC;
  v_api_budget_total NUMERIC;
  v_api_budget_consumed NUMERIC;
  v_api_burn_pct NUMERIC;
  v_timeline JSONB;
BEGIN
  -- Guard canônico: auth.uid() NULL (service_role/cron) passa;
  -- usuário logado precisa ser admin.
  SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO v_is_admin;
  IF auth.uid() IS NOT NULL AND NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  -- Webhooks aggregate
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE success = true)::BIGINT,
    COUNT(*) FILTER (WHERE success = false)::BIGINT
  INTO v_wh_total, v_wh_success, v_wh_fail
  FROM public.webhook_delivery_logs
  WHERE created_at >= now() - interval '30 days';

  v_wh_rate := CASE WHEN v_wh_total > 0 THEN ROUND((v_wh_success::NUMERIC / v_wh_total) * 100, 4) ELSE 100 END;
  v_wh_budget_total := ROUND(v_wh_total * ((100 - p_webhook_slo) / 100.0), 2);
  v_wh_budget_consumed := v_wh_fail;
  v_wh_burn_pct := CASE WHEN v_wh_budget_total > 0 THEN ROUND((v_wh_budget_consumed / v_wh_budget_total) * 100, 2) ELSE 0 END;

  -- API aggregate (coluna real: response_status)
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE response_status BETWEEN 200 AND 399)::BIGINT,
    COUNT(*) FILTER (WHERE response_status >= 400 OR response_status IS NULL)::BIGINT
  INTO v_api_total, v_api_success, v_api_fail
  FROM public.api_request_logs
  WHERE created_at >= now() - interval '30 days';

  v_api_rate := CASE WHEN v_api_total > 0 THEN ROUND((v_api_success::NUMERIC / v_api_total) * 100, 4) ELSE 100 END;
  v_api_budget_total := ROUND(v_api_total * ((100 - p_api_slo) / 100.0), 2);
  v_api_budget_consumed := v_api_fail;
  v_api_burn_pct := CASE WHEN v_api_budget_total > 0 THEN ROUND((v_api_budget_consumed / v_api_budget_total) * 100, 2) ELSE 0 END;

  -- Daily timeline
  WITH days AS (
    SELECT generate_series(
      date_trunc('day', now() - interval '29 days'),
      date_trunc('day', now()),
      interval '1 day'
    ) AS day
  ),
  wh AS (
    SELECT date_trunc('day', created_at) AS day,
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE success = false) AS fail
    FROM public.webhook_delivery_logs
    WHERE created_at >= now() - interval '30 days'
    GROUP BY 1
  ),
  api AS (
    SELECT date_trunc('day', created_at) AS day,
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE response_status >= 400 OR response_status IS NULL) AS fail
    FROM public.api_request_logs
    WHERE created_at >= now() - interval '30 days'
    GROUP BY 1
  )
  SELECT jsonb_agg(row_to_json(t) ORDER BY t.day)
  INTO v_timeline
  FROM (
    SELECT
      d.day,
      COALESCE(wh.total, 0) AS webhook_total,
      COALESCE(wh.fail, 0) AS webhook_fail,
      COALESCE(api.total, 0) AS api_total,
      COALESCE(api.fail, 0) AS api_fail
    FROM days d
    LEFT JOIN wh ON wh.day = d.day
    LEFT JOIN api ON api.day = d.day
  ) t;

  v_result := jsonb_build_object(
    'window_days', 30,
    'generated_at', now(),
    'webhook_slo_pct', p_webhook_slo,
    'api_slo_pct', p_api_slo,
    'webhooks', jsonb_build_object(
      'total', v_wh_total,
      'success', v_wh_success,
      'failed', v_wh_fail,
      'success_rate_pct', v_wh_rate,
      'budget_total', v_wh_budget_total,
      'budget_consumed', v_wh_budget_consumed,
      'burn_pct', v_wh_burn_pct,
      'status', CASE
        WHEN v_wh_burn_pct >= 90 THEN 'critical'
        WHEN v_wh_burn_pct >= 75 THEN 'high'
        WHEN v_wh_burn_pct >= 50 THEN 'warning'
        ELSE 'healthy'
      END
    ),
    'external_api', jsonb_build_object(
      'total', v_api_total,
      'success', v_api_success,
      'failed', v_api_fail,
      'success_rate_pct', v_api_rate,
      'budget_total', v_api_budget_total,
      'budget_consumed', v_api_budget_consumed,
      'burn_pct', v_api_burn_pct,
      'status', CASE
        WHEN v_api_burn_pct >= 90 THEN 'critical'
        WHEN v_api_burn_pct >= 75 THEN 'high'
        WHEN v_api_burn_pct >= 50 THEN 'warning'
        ELSE 'healthy'
      END
    ),
    'timeline', COALESCE(v_timeline, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_error_budget_30d(NUMERIC, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_error_budget_30d(NUMERIC, NUMERIC) TO authenticated, service_role;

-- 2) get_webhook_delivery_stats_1h: guard canônico (sem GUC)
CREATE OR REPLACE FUNCTION public.get_webhook_delivery_stats_1h()
RETURNS TABLE (
  subscription_id UUID,
  subscription_name TEXT,
  subscription_url TEXT,
  total_deliveries BIGINT,
  successful_deliveries BIGINT,
  failed_deliveries BIGINT,
  success_rate_pct NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id AS subscription_id,
    s.name AS subscription_name,
    s.url AS subscription_url,
    COUNT(l.id)::BIGINT AS total_deliveries,
    COUNT(l.id) FILTER (WHERE l.success)::BIGINT AS successful_deliveries,
    COUNT(l.id) FILTER (WHERE NOT l.success)::BIGINT AS failed_deliveries,
    CASE WHEN COUNT(l.id) > 0
      THEN ROUND((COUNT(l.id) FILTER (WHERE l.success)::NUMERIC / COUNT(l.id)) * 100, 2)
      ELSE NULL
    END AS success_rate_pct
  FROM public.webhook_subscriptions s
  LEFT JOIN public.webhook_delivery_logs l
    ON l.subscription_id = s.id
   AND l.created_at >= now() - interval '1 hour'
  WHERE auth.uid() IS NULL
     OR public.has_role(auth.uid(), 'admin'::app_role)
  GROUP BY s.id, s.name, s.url;
$$;

REVOKE EXECUTE ON FUNCTION public.get_webhook_delivery_stats_1h() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_webhook_delivery_stats_1h() TO authenticated, service_role;

-- 3) trigger_dispatch_critical_alert:
--    URL do projeto certo (eidsaqymojyuhprobfpn) + autenticacao por segredo interno
--    (x-internal-secret) em vez do JWT anon errado. Sem hardcode de segredo no codigo.
--    Fonte primaria do segredo: _internal.dispatch_config('dispatch_secret') - a mesma
--    que roda em producao desde 2026-11-24. Fallback: vault.decrypted_secrets
--    ('internal_dispatch_secret'), para ambientes recriados a partir do repo.
--    Em producao os dois valores sao identicos (conferido em 2026-11-24:
--    segredos_iguais = true, 64 chars em ambos), entao aplicar este arquivo e no-op.
--    Sem segredo em nenhuma das fontes, o trigger avisa e NAO dispara - nunca chama
--    a edge function sem autenticar.
CREATE OR REPLACE FUNCTION public.trigger_dispatch_critical_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_url TEXT := 'https://eidsaqymojyuhprobfpn.supabase.co';
  v_secret TEXT;
BEGIN
  IF LOWER(COALESCE(NEW.severity, '')) NOT IN ('high', 'critical') THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT value INTO v_secret
    FROM _internal.dispatch_config
    WHERE key = 'dispatch_secret'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_secret := NULL;
  END;

  IF v_secret IS NULL OR v_secret = '' THEN
    BEGIN
      SELECT decrypted_secret INTO v_secret
      FROM vault.decrypted_secrets
      WHERE name = 'internal_dispatch_secret'
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      v_secret := NULL;
    END;
  END IF;

  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE WARNING 'dispatch-critical-alert skipped: segredo ausente em _internal.dispatch_config e no vault';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := v_project_url || '/functions/v1/dispatch-critical-alert',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', v_secret
    ),
    body := jsonb_build_object(
      'alert_id', NEW.id,
      'alert_type', NEW.alert_type,
      'severity', NEW.severity,
      'title', NEW.title,
      'description', NEW.description,
      'metadata', NEW.metadata
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'dispatch-critical-alert failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trigger_dispatch_critical_alert() FROM PUBLIC;