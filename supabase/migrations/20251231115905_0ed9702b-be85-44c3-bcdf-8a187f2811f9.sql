-- =============================================
-- MÓDULO DE SEGURANÇA AVANÇADA
-- =============================================

-- 1. TABELA DE LOGS DE RATE LIMIT
CREATE TABLE public.rate_limit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'GET',
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    window_end TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '1 minute',
    was_blocked BOOLEAN NOT NULL DEFAULT false,
    user_agent TEXT,
    country_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_rate_limit_logs_ip ON public.rate_limit_logs(ip_address);
CREATE INDEX idx_rate_limit_logs_created ON public.rate_limit_logs(created_at DESC);
CREATE INDEX idx_rate_limit_logs_blocked ON public.rate_limit_logs(was_blocked) WHERE was_blocked = true;
CREATE INDEX idx_rate_limit_logs_endpoint ON public.rate_limit_logs(endpoint);

-- 2. TABELA DE IPs BLOQUEADOS (automático por rate limit)
CREATE TABLE public.blocked_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    block_type TEXT NOT NULL DEFAULT 'rate_limit' CHECK (block_type IN ('rate_limit', 'manual', 'suspicious', 'brute_force')),
    blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    is_permanent BOOLEAN NOT NULL DEFAULT false,
    violation_count INTEGER NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blocked_ips_address ON public.blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_expires ON public.blocked_ips(expires_at) WHERE expires_at IS NOT NULL;

-- 3. TABELA DE LOGS DE SESSÃO
CREATE TABLE public.session_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT,
    login_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    logout_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_session_logs_user ON public.session_logs(user_id);
CREATE INDEX idx_session_logs_active ON public.session_logs(is_active) WHERE is_active = true;

-- 4. TABELA DE TENTATIVAS DE LOGIN FALHADAS
CREATE TABLE public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    attempt_type TEXT NOT NULL DEFAULT 'password' CHECK (attempt_type IN ('password', '2fa', 'recovery')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_login_attempts_ip ON public.login_attempts(ip_address);
CREATE INDEX idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX idx_login_attempts_created ON public.login_attempts(created_at DESC);

-- 5. TABELA DE ALERTAS DE SEGURANÇA
CREATE TABLE public.security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('rate_limit_exceeded', 'brute_force', 'suspicious_login', 'ip_blocked', 'multiple_failed_2fa', 'unusual_location')),
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT,
    ip_address INET,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_security_alerts_type ON public.security_alerts(alert_type);
CREATE INDEX idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX idx_security_alerts_unresolved ON public.security_alerts(is_resolved) WHERE is_resolved = false;

-- 6. CONFIGURAÇÕES DE RATE LIMIT
CREATE TABLE public.rate_limit_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    endpoint_pattern TEXT NOT NULL,
    requests_per_minute INTEGER NOT NULL DEFAULT 60,
    requests_per_hour INTEGER NOT NULL DEFAULT 1000,
    block_duration_minutes INTEGER NOT NULL DEFAULT 15,
    is_active BOOLEAN NOT NULL DEFAULT true,
    applies_to_authenticated BOOLEAN NOT NULL DEFAULT true,
    applies_to_anonymous BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir regras padrão
INSERT INTO public.rate_limit_rules (name, endpoint_pattern, requests_per_minute, requests_per_hour, block_duration_minutes) VALUES
('Login', '/auth/*', 5, 30, 30),
('API Geral', '/api/*', 60, 1000, 15),
('Password Reset', '/auth/recovery', 3, 10, 60),
('2FA Verify', '/auth/2fa/*', 5, 20, 30),
('Edge Functions', '/functions/*', 30, 500, 15);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_rules ENABLE ROW LEVEL SECURITY;

-- Rate limit logs: apenas admins podem ver
CREATE POLICY "Admins can view rate limit logs"
ON public.rate_limit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Blocked IPs: admins podem CRUD
CREATE POLICY "Admins can manage blocked IPs"
ON public.blocked_ips FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Session logs: usuários veem suas próprias, admins veem todas
CREATE POLICY "Users can view own sessions"
ON public.session_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own sessions"
ON public.session_logs FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Login attempts: apenas admins
CREATE POLICY "Admins can view login attempts"
ON public.login_attempts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Security alerts: apenas admins
CREATE POLICY "Admins can manage security alerts"
ON public.security_alerts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Rate limit rules: apenas admins
CREATE POLICY "Admins can manage rate limit rules"
ON public.rate_limit_rules FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- FUNCTIONS
-- =============================================

-- Função para verificar se IP está bloqueado
CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip_address INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.blocked_ips
        WHERE ip_address = p_ip_address
        AND (is_permanent = true OR expires_at > now())
    );
END;
$$;

-- Função para bloquear IP automaticamente
CREATE OR REPLACE FUNCTION public.auto_block_ip(
    p_ip_address INET,
    p_reason TEXT,
    p_block_type TEXT DEFAULT 'rate_limit',
    p_duration_minutes INTEGER DEFAULT 15
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_blocked_id UUID;
    v_existing RECORD;
BEGIN
    -- Verificar se já existe
    SELECT * INTO v_existing FROM public.blocked_ips WHERE ip_address = p_ip_address;
    
    IF v_existing IS NOT NULL THEN
        -- Atualizar violação existente
        UPDATE public.blocked_ips
        SET 
            violation_count = violation_count + 1,
            expires_at = CASE 
                WHEN is_permanent THEN NULL
                ELSE now() + (p_duration_minutes * (violation_count + 1) * INTERVAL '1 minute')
            END,
            is_permanent = CASE WHEN violation_count >= 5 THEN true ELSE false END,
            reason = p_reason,
            updated_at = now()
        WHERE ip_address = p_ip_address
        RETURNING id INTO v_blocked_id;
    ELSE
        -- Criar novo bloqueio
        INSERT INTO public.blocked_ips (ip_address, reason, block_type, expires_at)
        VALUES (p_ip_address, p_reason, p_block_type, now() + (p_duration_minutes * INTERVAL '1 minute'))
        RETURNING id INTO v_blocked_id;
    END IF;
    
    -- Criar alerta de segurança
    INSERT INTO public.security_alerts (alert_type, severity, title, description, ip_address, metadata)
    VALUES (
        'ip_blocked',
        CASE WHEN v_existing IS NOT NULL AND v_existing.violation_count >= 3 THEN 'high' ELSE 'medium' END,
        'IP Bloqueado: ' || p_ip_address::TEXT,
        p_reason,
        p_ip_address,
        jsonb_build_object('block_type', p_block_type, 'duration_minutes', p_duration_minutes)
    );
    
    RETURN v_blocked_id;
END;
$$;

-- Função para registrar tentativa de login
CREATE OR REPLACE FUNCTION public.log_login_attempt(
    p_email TEXT,
    p_ip_address INET,
    p_user_agent TEXT,
    p_attempt_type TEXT DEFAULT 'password',
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
    v_recent_failures INTEGER;
BEGIN
    -- Registrar tentativa
    INSERT INTO public.login_attempts (email, ip_address, user_agent, attempt_type, error_message)
    VALUES (p_email, p_ip_address, p_user_agent, p_attempt_type, p_error_message)
    RETURNING id INTO v_log_id;
    
    -- Verificar tentativas recentes do mesmo IP
    SELECT COUNT(*) INTO v_recent_failures
    FROM public.login_attempts
    WHERE ip_address = p_ip_address
    AND created_at > now() - INTERVAL '15 minutes'
    AND error_message IS NOT NULL;
    
    -- Bloquear automaticamente se muitas falhas
    IF v_recent_failures >= 10 THEN
        PERFORM public.auto_block_ip(
            p_ip_address,
            'Múltiplas tentativas de login falhadas (' || v_recent_failures || ' em 15 min)',
            'brute_force',
            30
        );
    END IF;
    
    RETURN v_log_id;
END;
$$;

-- Função para limpar logs antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs(p_days_to_keep INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rate_limit_deleted INTEGER;
    v_login_attempts_deleted INTEGER;
    v_session_logs_deleted INTEGER;
    v_expired_blocks_deleted INTEGER;
BEGIN
    -- Limpar rate limit logs
    DELETE FROM public.rate_limit_logs
    WHERE created_at < now() - (p_days_to_keep * INTERVAL '1 day');
    GET DIAGNOSTICS v_rate_limit_deleted = ROW_COUNT;
    
    -- Limpar login attempts
    DELETE FROM public.login_attempts
    WHERE created_at < now() - (p_days_to_keep * INTERVAL '1 day');
    GET DIAGNOSTICS v_login_attempts_deleted = ROW_COUNT;
    
    -- Limpar sessões inativas antigas
    DELETE FROM public.session_logs
    WHERE is_active = false
    AND logout_at < now() - (p_days_to_keep * INTERVAL '1 day');
    GET DIAGNOSTICS v_session_logs_deleted = ROW_COUNT;
    
    -- Limpar bloqueios expirados (não permanentes)
    DELETE FROM public.blocked_ips
    WHERE is_permanent = false
    AND expires_at < now() - INTERVAL '7 days';
    GET DIAGNOSTICS v_expired_blocks_deleted = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'rate_limit_logs_deleted', v_rate_limit_deleted,
        'login_attempts_deleted', v_login_attempts_deleted,
        'session_logs_deleted', v_session_logs_deleted,
        'expired_blocks_deleted', v_expired_blocks_deleted,
        'cleaned_at', now()
    );
END;
$$;

-- Função para obter estatísticas de segurança
CREATE OR REPLACE FUNCTION public.get_security_stats(p_hours INTEGER DEFAULT 24)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'rate_limit_violations', (
            SELECT COUNT(*) FROM public.rate_limit_logs 
            WHERE was_blocked = true 
            AND created_at > now() - (p_hours * INTERVAL '1 hour')
        ),
        'blocked_ips', (
            SELECT COUNT(*) FROM public.blocked_ips 
            WHERE is_permanent = true OR expires_at > now()
        ),
        'failed_logins', (
            SELECT COUNT(*) FROM public.login_attempts 
            WHERE error_message IS NOT NULL 
            AND created_at > now() - (p_hours * INTERVAL '1 hour')
        ),
        'active_sessions', (
            SELECT COUNT(*) FROM public.session_logs WHERE is_active = true
        ),
        'unresolved_alerts', (
            SELECT COUNT(*) FROM public.security_alerts WHERE is_resolved = false
        ),
        'top_blocked_ips', (
            SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
            FROM (
                SELECT ip_address, violation_count, reason, is_permanent
                FROM public.blocked_ips
                ORDER BY violation_count DESC
                LIMIT 5
            ) t
        ),
        'recent_alerts', (
            SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
            FROM (
                SELECT id, alert_type, severity, title, created_at
                FROM public.security_alerts
                WHERE is_resolved = false
                ORDER BY created_at DESC
                LIMIT 10
            ) t
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Habilitar realtime para alertas
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_ips;