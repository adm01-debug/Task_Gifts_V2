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
END $$

-- 2. A redefinicao de trigger_dispatch_critical_alert que existia aqui foi REMOVIDA (2026-11-24).
--    Ela usava a anon key do projeto morto (awzhgfmqwddzgbqzqusc) em 'apikey'/'Authorization',
--    que a edge function recusa: enquanto este arquivo abortava no UPDATE cron.job acima, essa
--    redefinicao nunca era aplicada e o dano ficava escondido. Guardar o UPDATE expoe o risco -
--    aplicar o arquivo passaria a sobrescrever a definicao correta que roda em producao.
--    A definicao correta (x-internal-secret lido de _internal.dispatch_config, com fallback no
--    Vault) esta em 20261220000000_fix_sre_rpcs_and_dispatch_trigger.sql, aplicada depois desta.
