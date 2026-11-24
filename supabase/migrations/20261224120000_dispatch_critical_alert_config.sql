-- 20261224120000_dispatch_critical_alert_config.sql
--
-- Fecha as duas lacunas que impediam o alerta critico de seguranca de ser
-- entregue num ambiente reconstruido a partir do repositorio. Idempotente.
--
-- 1) O segredo que autentica o trigger na edge function dispatch-critical-alert
--    nunca foi provisionado por migration. Como _internal.dispatch_config nao e
--    criada por nenhum arquivo do repo, um rebuild chega ao trigger sem
--    'dispatch_secret' e sem vault, cai no RAISE WARNING e nao entrega nada.
--    Aqui a tabela de config e garantida e o valor e semeado SEM literal de
--    segredo no repositorio, nesta ordem:
--      a) vault.decrypted_secrets('internal_dispatch_secret')
--      b) _internal.dispatch_config('cron_secret') - conferido em 2026-11-24:
--         dispatch-critical-alert aceita esse token (HTTP 200,
--         {"success":true,"skipped":true,"reason":"severity_below_threshold"})
--    Se ja existir 'dispatch_secret', nada e alterado (producao: no-op).
--
-- 2) A URL do projeto estava fixa dentro da funcao do trigger. Num projeto
--    recriado ela apontaria para eidsaqymojyuhprobfpn mesmo estando em outro.
--    Passa a ler _internal.dispatch_config('project_url'); se a chave nao
--    existir (ordem de aplicacao antes da migration de cron) usa a URL atual,
--    entao a producao de hoje nao muda de comportamento.

CREATE SCHEMA IF NOT EXISTS _internal;

CREATE TABLE IF NOT EXISTS _internal.dispatch_config (
  key   TEXT PRIMARY KEY,
  value TEXT
);

DO $outer$
DECLARE
  v_secret TEXT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM _internal.dispatch_config
    WHERE key = 'dispatch_secret' AND COALESCE(value, '') <> ''
  ) THEN
    RETURN;
  END IF;

  BEGIN
    SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets
    WHERE name = 'internal_dispatch_secret'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_secret := NULL;
  END;

  IF v_secret IS NULL OR v_secret = '' THEN
    SELECT value INTO v_secret
    FROM _internal.dispatch_config
    WHERE key = 'cron_secret'
    LIMIT 1;
  END IF;

  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE WARNING 'dispatch_secret nao provisionado: sem vault e sem cron_secret';
    RETURN;
  END IF;

  INSERT INTO _internal.dispatch_config (key, value)
  VALUES ('dispatch_secret', v_secret)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  WHERE COALESCE(_internal.dispatch_config.value, '') = '';
END;
$outer$;

CREATE OR REPLACE FUNCTION public.trigger_dispatch_critical_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_url TEXT;
  v_secret TEXT;
BEGIN
  IF LOWER(COALESCE(NEW.severity, '')) NOT IN ('high', 'critical') THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT value INTO v_project_url
    FROM _internal.dispatch_config
    WHERE key = 'project_url'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_project_url := NULL;
  END;

  IF v_project_url IS NULL OR v_project_url = '' THEN
    v_project_url := 'https://eidsaqymojyuhprobfpn.supabase.co';
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
    url := rtrim(v_project_url, '/') || '/functions/v1/dispatch-critical-alert',
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