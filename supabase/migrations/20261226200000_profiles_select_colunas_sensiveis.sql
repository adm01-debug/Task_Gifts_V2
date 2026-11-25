-- =============================================================================
-- Fecha o vazamento de PII em public.profiles (SELECT sem allowlist)
-- -----------------------------------------------------------------------------
-- Medido em produção em 2026-11-25T11:51Z:
--   has_table_privilege('authenticated','public.profiles','SELECT') = true
--   has_column_privilege('authenticated','public.profiles','cpf','SELECT')  = true
--   GET /rest/v1/profiles?select=id,display_name,cpf,personal_email,phone,
--       employee_id,contract_type&id=eq.<outro usuario>
--   => 200 com CPF, e-mail pessoal, telefone, matrícula e tipo de contrato
--      de OUTRO colaborador (probe com usuário descartável).
--
-- A migration 20260728184034 já revogava SELECT/DELETE/TRUNCATE de
-- `authenticated`, mas o estado vivo não reflete isso: a tabela está com GRANT
-- de tabela (que concede todas as colunas), o que também anulou o allowlist de
-- colunas de 20261218000000 (linha 214). O ledger provar a versão não prova que
-- o SQL rodou, então o reparo é feito a partir da medição de `has_*_privilege`.
--
-- Esta migration:
--   1) REVOKE SELECT table-level de `authenticated` (colunas passam a ser por
--      allowlist) e REVOKE ALL de `anon` (defesa em profundidade: RLS já nega
--      linhas a `anon`, que não tem policy);
--   2) GRANT SELECT apenas no allowlist já usado pelo front
--      (`PROFILE_SAFE_COLUMNS` em src/services/profilesService.ts), mantendo
--      leaderboards, duels, rankings e relatórios funcionando;
--   3) NÃO toca em INSERT (próprio id) nem em UPDATE (allowlist de 4 colunas).
--
-- Dado sensível segue acessível por caminho controlado, ambos SECURITY DEFINER:
--   get_my_profile_private()  -> dados privados do próprio usuário;
--   admin_profile_directory() -> diretório de gestão (admin).
-- A view profiles_public continua legível (owner postgres).
-- Idempotente: pode rodar múltiplas vezes sem erro.
-- =============================================================================

REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE ALL ON public.profiles FROM anon;

-- `anon` mantém apenas as colunas usadas por telas publicas
-- (author:profiles(display_name, avatar_url) em announcements/celebrations).
-- Nao ha policy de RLS para `anon`, entao nenhuma linha e devolvida; o grant
-- existe para preservar 200 com embed nulo em vez de 401 na consulta inteira.
GRANT SELECT (id, display_name, avatar_url, level, status)
  ON public.profiles TO anon;

GRANT SELECT (
  id,
  display_name,
  avatar_url,
  level,
  xp,
  coins,
  streak,
  best_streak,
  quests_completed,
  status,
  created_at,
  updated_at,
  email,
  birth_date,
  hire_date,
  last_access_at
) ON public.profiles TO authenticated;