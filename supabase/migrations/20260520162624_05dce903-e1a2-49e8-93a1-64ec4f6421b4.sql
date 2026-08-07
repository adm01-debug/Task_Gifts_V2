-- Função para limpar logs antigos de segurança
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Remove logs de segurança com mais de 90 dias
    DELETE FROM public.security_logs
    WHERE created_at < now() - interval '90 days';
    
    -- Remove logs de webhook do Bitrix24 processados com mais de 30 dias
    DELETE FROM public.bitrix24_webhook_logs
    WHERE processed = true AND created_at < now() - interval '30 days';
END;
$$;

-- Agendamento diário via pg_cron (se disponível) ou via Edge Function dedicada
-- Como estamos no ambiente Supabase, usaremos a interface de Cron via HTTP ou SQL se habilitado.
-- SELECT cron.schedule('cleanup-logs-daily', '0 3 * * *', 'SELECT cleanup_old_security_logs()');
