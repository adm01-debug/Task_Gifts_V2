-- 20261224130000_climate_antecipa_fim_pesquisa.sql
--
-- Antecipa o fim da pesquisa de clima ativa para 30/11/2026 23:59:59 em
-- America/Sao_Paulo, para a coleta acontecer em novembro em vez de 17/12.
--
-- Por que isso muda a operacao: `public.send_climate_survey_reminders()` (cron
-- `climate-survey-reminders`, `0 12 * * *`, criado em 20261224100000) so lembra
-- quem nao respondeu quando faltam <= 7 dias para `ends_at`. Com o prazo em
-- 17/12 o primeiro lembrete sairia em 11/12 e a pesquisa passaria o mes inteiro
-- em zero respostas; com o prazo em 30/11 o lembrete diario ja cai dentro da
-- janela e quem nao respondeu recebe aviso ate o encerramento
-- (`expire_climate_surveys()`, cron `*/15`, fecha a pesquisa no primeiro ciclo
-- depois de `ends_at`).
--
-- Idempotente e guardada:
--   * so move pesquisas `active` cujo `ends_at` esta DEPOIS do alvo: nunca
--     estende pesquisa que termina antes e nunca toca em `completed`/`cancelled`;
--   * se aplicada depois de 2026-11-30 23:59:59-03, vira no-op com WARNING - sem
--     essa guarda o proximo `expire_climate_surveys()` encerraria a pesquisa no
--     mesmo minuto e a coleta nao aconteceria;
--   * a segunda aplicacao nao encontra nenhuma linha para mover.
--
-- E' DML puro: nenhum objeto do schema muda de forma. Nao provisiona segredo e
-- nao altera `send_reminders` (a coluna nasce `DEFAULT true`; se a pesquisa ativa
-- estiver com os lembretes desligados, o UPDATE de prazo nao liga por conta
-- propria - ver o PR).

DO $antecipa$
DECLARE
  v_alvo     timestamptz := timestamptz '2026-11-30 23:59:59-03';
  v_afetadas integer;
BEGIN
  IF now() >= v_alvo THEN
    RAISE WARNING 'climate: prazo alvo (%) ja passou (now() = %); nenhuma pesquisa foi alterada', v_alvo, now();
    RETURN;
  END IF;

  UPDATE public.climate_surveys
     SET ends_at = v_alvo,
         updated_at = now()
   WHERE status = 'active'
     AND ends_at > v_alvo;

  GET DIAGNOSTICS v_afetadas = ROW_COUNT;
  RAISE NOTICE 'climate: fim da pesquisa ativa antecipado para % (% linha(s) alterada(s))', v_alvo, v_afetadas;
END
$antecipa$;