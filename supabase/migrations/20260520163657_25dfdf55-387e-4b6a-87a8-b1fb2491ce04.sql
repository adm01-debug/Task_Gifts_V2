-- Tabela para controle de idempotência
CREATE TABLE IF NOT EXISTS public.webhook_idempotency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    status TEXT NOT NULL, -- 'processing', 'completed', 'failed'
    response_body JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- Index para busca rápida por chave
CREATE INDEX idx_webhook_idempotency_key ON public.webhook_idempotency(idempotency_key);

-- Habilitar RLS
ALTER TABLE public.webhook_idempotency ENABLE ROW LEVEL SECURITY;

-- Apenas service_role pode acessar esta tabela
CREATE POLICY "Service role can do everything on idempotency"
ON public.webhook_idempotency
FOR ALL
TO service_role
USING (true);

-- Limpeza automática de chaves expiradas (função auxiliar)
CREATE OR REPLACE FUNCTION public.cleanup_expired_idempotency_keys()
RETURNS void AS $$
BEGIN
    DELETE FROM public.webhook_idempotency WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
