-- Drift dos jobs internos de cron (medido em 2026-11-24 no projeto de producao).
--
-- Os cinco jobs que chamam edge functions internas rodam em producao e respondem
-- 200, mas o repositorio nao os reproduz:
--   * nenhuma migration cria `burn-rate-monitor-5min` (jobid 31) nem
--     `error-budget-monitor-daily` (jobid 32). Um rebuild os perde, e o burn rate
--     e o error budget deixam de ser monitorados;
--   * `security-weekly-digest` (20260712212544) nasce sem credencial nenhuma, e o
--     guardInternalRequest da funcao devolve 401 sem token
--     (supabase/functions/security-weekly-digest/index.ts:31-39);
--   * `webhook-health-monitor-every-15min` (20260712194718) nasce com a anon key do
--     projeto morto awzhgfmqwddzgbqzqusc em texto claro;
--   * `push-outbox-dispatcher` (20260728112123) nasce sem credencial.
--
-- Em producao os cinco enviam o mesmo `x-internal-secret` (medido: 1 valor
-- distinto para 5 jobs) e respondem 200. Esse valor NAO e' o `dispatch_secret` do
-- trigger de alerta (medido: position(dispatch_secret in command) = false nos 5
-- jobs), entao trocar um pelo outro quebraria o guard do digest semanal.
--
-- O segredo nao entra neste arquivo nem no comando gravado em `cron.job`: ele fica
-- em `_internal.dispatch_config` e e' lido em tempo de execucao, dentro do proprio
-- SQL do job. A primeira aplicacao semeia a chave `cron_secret` com o valor que os
-- jobs ja usam, para nao mudar nada em producao.

-- 0) Garante a tabela de configuracao -------------------------------------------
-- Nenhuma migration do repo criava `_internal.dispatch_config`: em banco
-- reconstruido o INSERT abaixo abortava a migration inteira antes de agendar
-- qualquer job. `IF NOT EXISTS` e' no-op na producao atual.
CREATE SCHEMA IF NOT EXISTS _internal;

CREATE TABLE IF NOT EXISTS _internal.dispatch_config (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- O schema `_internal` nao esta exposto pelo PostgREST e o ACL dele nao da USAGE a
-- anon/authenticated. Habilitar RLS sem policy e' defesa em profundidade para o caso
-- de o schema passar a ser exposto: `postgres` (owner) e o service_role (BYPASSRLS)
-- continuam lendo, inclusive pelos subselects dos jobs e pelo trigger SECURITY DEFINER.
ALTER TABLE _internal.dispatch_config ENABLE ROW LEVEL SECURITY;

-- 1) Destino comum ---------------------------------------------------------------
-- A URL do projeto nao e' segredo e ja aparece em outras migrations. Guarda-la em
-- config permite que o trigger de alerta critico pare de fixar a URL no corpo da
-- funcao (ver 20261224120000).
INSERT INTO _internal.dispatch_config (key, value)
VALUES ('project_url', 'https://eidsaqymojyuhprobfpn.supabase.co')
ON CONFLICT (key) DO NOTHING;

-- 2) Semeia o segredo dos jobs com o que ja roda ---------------------------------
-- Em rebuild limpo nao existe job para copiar e a chave continua ausente: o passo 3
-- entao recusa recriar os jobs sem credencial em vez de deixa-los tomando 401.
-- A busca fica restrita aos cinco jobs medidos (por nome), para nao copiar o
-- cabecalho de um job de outro grupo que por acaso use o mesmo header.
-- A regex cobre `"x-internal-secret":"valor"` e `"x-internal-secret": "valor"`, que sao
-- as duas formas ja gravadas por jobs antigos deste projeto.
INSERT INTO _internal.dispatch_config (key, value)
SELECT 'cron_secret', v.secret
  FROM (
    SELECT (regexp_match(command, '"x-internal-secret"\s*:\s*"([^"]+)"'))[1] AS secret
      FROM cron.job
     WHERE command LIKE '%"x-internal-secret"%'
       AND jobname IN ('push-outbox-dispatcher',
                       'burn-rate-monitor-5min',
                       'error-budget-monitor-daily',
                       'security-weekly-digest',
                       'webhook-health-monitor-every-15min')
     ORDER BY jobid
     LIMIT 1
  ) v
 WHERE length(v.secret) >= 32
ON CONFLICT (key) DO NOTHING;

-- 3) Recria os cinco jobs com `x-internal-secret` lido da config ------------------
-- O comando gravado em `cron.job` nao contem o segredo: ele e' resolvido pelo
-- subselect no momento da execucao, entao rotacionar a chave nao exige reagendar.
-- cron.schedule(nome, ...) faz upsert por nome (pg_cron 1.6.4): reaplicar atualiza o
-- job no lugar, sem duplicar e sem tocar no jobid. `postgres` nao tem UPDATE em
-- cron.job, mas cron.schedule e' SECURITY DEFINER e funciona (conferido em producao).
DO $outer$
DECLARE
  v_url    text;
  v_secret text;
  v_names  text[] := ARRAY['push-outbox-dispatcher',
                           'burn-rate-monitor-5min',
                           'error-budget-monitor-daily',
                           'security-weekly-digest',
                           'webhook-health-monitor-every-15min'];
  v_scheds text[] := ARRAY['* * * * *',
                           '*/5 * * * *',
                           '0 12 * * *',
                           '0 13 * * 1',
                           '*/15 * * * *'];
  v_slugs  text[] := ARRAY['push-outbox-dispatcher',
                           'burn-rate-monitor',
                           'error-budget-monitor',
                           'security-weekly-digest',
                           'webhook-health-monitor'];
  i        int;
BEGIN
  SELECT value INTO v_url FROM _internal.dispatch_config WHERE key = 'project_url';
  SELECT value INTO v_secret FROM _internal.dispatch_config WHERE key = 'cron_secret';

  IF v_url IS NULL OR v_secret IS NULL OR length(v_secret) < 32 THEN
      -- Sem `cron_secret` os jobs seriam gravados com x-internal-secret nulo (o
      -- comando resolve a chave em tempo de execucao) e tomariam 401 para sempre.
      -- `dispatch_secret` NAO serve de substituto aqui: e' outra credencial, nao e'
      -- a chave que o comando agendado le, e reusa-la mascararia o drift.
    RAISE WARNING 'sem project_url/cron_secret em _internal.dispatch_config: os jobs internos NAO foram recriados (recriar sem credencial geraria 401)';
    RETURN;
  END IF;

  FOR i IN 1..array_length(v_names, 1) LOOP
    PERFORM cron.schedule(
      v_names[i],
      v_scheds[i],
      format($cmd$
  SELECT net.http_post(
    url := (SELECT value FROM _internal.dispatch_config WHERE key = 'project_url')
           || '/functions/v1/%s',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', (SELECT value FROM _internal.dispatch_config WHERE key = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
$cmd$, v_slugs[i])
    );
  END LOOP;
END $outer$;
