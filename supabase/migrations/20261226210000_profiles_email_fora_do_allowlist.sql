-- =============================================================================
-- Tira o e-mail corporativo do SELECT de public.profiles para `authenticated`
-- -----------------------------------------------------------------------------
-- Medido em producao em 2026-11-25: qualquer colaborador autenticado lia o
-- e-mail de TODOS os colegas, porque `email` estava na lista de colunas
-- liberadas por 20261226200000. E-mail e dado pessoal (LGPD) e nao e necessario
-- para nenhuma tela comum.
--
-- Caminhos controlados que continuam entregando o e-mail:
--   get_my_profile_private()  -> e-mail do proprio usuario;
--   admin_profile_directory() -> diretorio de gestao (SECURITY DEFINER,
--                                _require_manager_or_admin()).
--
-- O front usa `supabase.auth.getUser().email` na tela de perfil e a RPC de
-- gestao nas telas de admin (RBAC e compras da loja).
-- Idempotente: pode rodar mais de uma vez sem erro.
-- =============================================================================

REVOKE SELECT (email) ON public.profiles FROM authenticated;
REVOKE SELECT (email) ON public.profiles FROM anon;