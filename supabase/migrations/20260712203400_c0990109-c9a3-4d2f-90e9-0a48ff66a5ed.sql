
-- Função dispatcher que envia alertas críticos via edge function usando pg_net
CREATE OR REPLACE FUNCTION public.trigger_dispatch_critical_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_url TEXT := 'https://awzhgfmqwddzgbqzqusc.supabase.co';
  v_anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3emhnZm1xd2RkemdicXpxdXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE1ODQsImV4cCI6MjA5NDI1NzU4NH0.HIsoaKjV2MFzTc6sCJ0p6RcoVIPR5SRIoE885SVMXCc';
BEGIN
  -- Escalonar apenas severidades altas
  IF LOWER(COALESCE(NEW.severity, '')) NOT IN ('high', 'critical') THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := v_project_url || '/functions/v1/dispatch-critical-alert',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', v_anon_key,
      'Authorization', 'Bearer ' || v_anon_key
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
  -- Falha no envio não deve bloquear a inserção do alerta
  RAISE WARNING 'dispatch-critical-alert failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trigger_dispatch_critical_alert() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_security_alerts_dispatch_critical ON public.security_alerts;

CREATE TRIGGER trg_security_alerts_dispatch_critical
AFTER INSERT ON public.security_alerts
FOR EACH ROW
EXECUTE FUNCTION public.trigger_dispatch_critical_alert();
