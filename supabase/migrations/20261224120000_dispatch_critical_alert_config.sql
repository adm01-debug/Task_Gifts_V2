-- 20261224120000_dispatch_critical_alert_config.sql
--
-- Fecha as duas lacunas que impediam o alerta critico de seguranca de ser
-- entregue num ambiente reconstruido a partir do repositorio. Idempotente.
--
-- 1) O trigger autenticava na edge function com um segredo que nenhuma migration
--    provisionava. A fonte da verdade e' o Vault -
--    vault.decrypted_secrets('internal_dispatch_secret') - lido a cada disparo.
--    `_internal.dispatch_config('dispatch_secret')` fica como sobrescrita
--    explicita de operador, e por isso esta migration NAO escreve nessa chave:
--    uma copia automatica do Vault congela o valor de ontem e, depois de uma
--    rotacao, faz a edge responder 401 sem que ninguem perceba (o alerta critico
--    se perde em silencio). Ultimo recurso do trigger: 'cron_secret', token
--    medido como aceito em 2026-11-24 (dispatch-critical-alert HTTP 200).
--    Num rebuild o Vault tambem nao vem do repositorio: provisione
--    `internal_dispatch_secret` (ou grave `dispatch_secret` como override) antes
--    de contar com o alerta. Sem nenhum dos dois o trigger emite WARNING com o
--    nome das chaves em vez de entregar um 401 silencioso.
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

-- O schema `_internal` nao esta exposto pelo PostgREST (so public/graphql_public) e
-- o ACL dele nao da USAGE a anon/authenticated. Habilitar RLS sem policy e' defesa
-- em profundidade para o caso de o schema passar a ser exposto: o owner da tabela
-- (`postgres`) e o service_role (BYPASSRLS) continuam lendo normalmente, e o trigger
-- e' SECURITY DEFINER do proprio `postgres`.
ALTER TABLE _internal.dispatch_config ENABLE ROW LEVEL SECURITY;

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

  -- O Vault vem primeiro de proposito: `_internal.dispatch_config.dispatch_secret`
  -- e' a copia estatica feita no provisionamento. Depois de rotacionar o segredo no
  -- Vault, uma copia antiga aqui faria o trigger enviar o valor revogado, a edge
  -- devolver 401 e o alerta critico se perder em silencio.
  BEGIN
    SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets
    WHERE name = 'internal_dispatch_secret'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_secret := NULL;
  END;

  IF v_secret IS NULL OR v_secret = '' THEN
    BEGIN
      SELECT value INTO v_secret
      FROM _internal.dispatch_config
      WHERE key = 'dispatch_secret'
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      v_secret := NULL;
    END;
  END IF;

  -- Ultimo recurso: 'cron_secret' e' um token ja aceito pelas funcoes internas,
  -- entao serve quando o Vault nao esta acessivel nem ha sobrescrita explicita.
  IF v_secret IS NULL OR v_secret = '' THEN
    BEGIN
      SELECT value INTO v_secret
      FROM _internal.dispatch_config
      WHERE key = 'cron_secret'
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      v_secret := NULL;
    END;
  END IF;

  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE WARNING 'dispatch-critical-alert skipped: segredo ausente no vault e em _internal.dispatch_config (dispatch_secret/cron_secret)';
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