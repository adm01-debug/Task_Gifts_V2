-- Revogar execução pública para segurança
REVOKE EXECUTE ON FUNCTION public.cleanup_old_security_logs() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_security_logs() FROM anon, authenticated;

-- Garantir que apenas o service role ou o próprio sistema possa rodar
GRANT EXECUTE ON FUNCTION public.cleanup_old_security_logs() TO service_role;
