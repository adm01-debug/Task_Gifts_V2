-- Corrige jobs de cron e trigger que ainda apontavam para o projeto errado (awzhgfmqwddzgbqzqusc).
-- Projeto em uso (produção): eidsaqymojyuhprobfpn.
-- Idempotente: pode ser reaplicado sem efeito colateral.

-- 1. Atualiza URL nos jobs de cron existentes
--    cron.job pertence a supabase_admin e `postgres` NAO tem UPDATE nele (conferido em
--    producao em 2026-11-24: has_table_privilege('postgres','cron.job','UPDATE') = false),
--    por isso o UPDATE solto abortava a aplicacao da migration com 42501 em qualquer base.
--    Guardado por excecao: corrige onde houver privilegio e avisa onde nao houver.
DO $$
DECLARE
  v_afetados int := 0;
BEGIN
  UPDATE cron.job
     SET command = replace(command, 'awzhgfmqwddzgbqzqusc', 'eidsaqymojyuhprobfpn')
   WHERE command LIKE '%awzhgfmqwddzgbqzqusc%';
  GET DIAGNOSTICS v_afetados = ROW_COUNT;
  RAISE NOTICE 'cron.job: % job(s) com o projeto antigo corrigido(s)', v_afetados;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING 'cron.job: sem privilegio de UPDATE (schema pertence a supabase_admin); confira manualmente se algum job aponta para awzhgfmqwddzgbqzqusc';
  WHEN undefined_table THEN
    RAISE NOTICE 'cron.job ausente nesta base; nada a corrigir';
END $$;

-- 2. Recria trigger_dispatch_critical_alert com URL correta
-- FIXME: v_anon_key abaixo ainda é a de awzhgfmqwddzgbqzqusc.
-- Após obter a anon key de eidsaqymojyuhprobfpn (valor em VITE_SUPABASE_ANON_KEY no Vercel),
-- criar migration nova com CREATE OR REPLACE usando a chave correta.
CREATE OR REPLACE FUNCTION public.trigger_dispatch_critical_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_url TEXT := 'https://eidsaqymojyuhprobfpn.supabase.co';
  v_anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3emhnZm1xd2RkemdicXpxdXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE1ODQsImV4cCI6MjA5NDI1NzU4NH0.HIsoaKjV2MFzTc6sCJ0p6RcoVIPR5SRIoE885SVMXCc'; -- FIXME: chave de awzhgfmqwddzgbqzqusc
BEGIN
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
  RAISE WARNING 'dispatch-critical-alert failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trigger_dispatch_critical_alert() FROM PUBLIC;
