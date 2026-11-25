-- Corrige o primeiro hardening (20261226120000), ja aplicado em producao.
-- Sem DO/format: o parser do MCP de banco nao detecta blocos com format('%s'),
-- entao a migration usa as assinaturas exatas do catalogo.
--   1. helpers avaliados por policies de RLS / DEFAULT de coluna precisam de EXECUTE
--      para authenticated - sem isso org_members, organizations, org_theme_history,
--      team_members e a emissao de certificado falham com "permission denied";
--   2. helpers de vinculo nao devem ser executaveis por anon (oraculo sem login);
--   3. RPCs que so a Edge Function chama com service role saem de authenticated
--      (qualquer conta podia consumir a fila de push de terceiros).

-- 1. helpers de policy avaliados por qualquer papel (145 policies visiveis a anon
--    usam has_role; team_members tem policy com roles={public} usando
--    is_department_manager) - authenticated e anon mantidos
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_department_manager(uuid, uuid) TO anon, authenticated;

-- 2. helpers de policy/DEFAULT que so fazem sentido com sessao
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_handle_opinion(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.can_handle_opinion(uuid, uuid) FROM anon;
-- user_certifications.certificate_code DEFAULT generate_certificate_code()
GRANT EXECUTE ON FUNCTION public.generate_certificate_code() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_certificate_code() FROM anon;

-- 3. RPCs internas: chamadas apenas por Edge Function com service role
REVOKE EXECUTE ON FUNCTION public.claim_push_outbox(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_push_outbox(integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.increment_push_failures(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_push_failures(uuid[]) TO service_role;
REVOKE EXECUTE ON FUNCTION public.reset_push_failures(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_push_failures(uuid[]) TO service_role;
REVOKE EXECUTE ON FUNCTION public.user_wants_push_notification(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_wants_push_notification(uuid, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.get_passkeys_by_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_passkeys_by_email(text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.register_device(uuid, text, inet, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_device(uuid, text, inet, text, text, text, text) TO service_role;

-- 4. Anon nao escreve em fila interna nem em dispositivo: RLS ja bloqueia, o grant
--    fica como defesa em profundidade.
REVOKE INSERT, UPDATE, DELETE ON public.push_outbox FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_devices FROM anon;

-- 5. RPCs de API que o teste de contrato trata como "exige login" (rpcAccess.test.ts
--    espera erro para anon e nao testa 401 para authenticated): authenticated mantem
--    o acesso historico, anon nao.
GRANT EXECUTE ON FUNCTION public.get_leaderboard_api(integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stats_api(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_reset_token(uuid) TO authenticated;