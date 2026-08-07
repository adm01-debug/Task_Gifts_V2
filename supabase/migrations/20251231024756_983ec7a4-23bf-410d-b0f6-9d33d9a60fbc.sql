-- Tabela para armazenar configurações de 2FA dos usuários
CREATE TABLE public.user_two_factor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    totp_secret TEXT,
    is_enabled BOOLEAN DEFAULT false NOT NULL,
    backup_codes TEXT[],
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_two_factor ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own 2FA settings"
ON public.user_two_factor FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings"
ON public.user_two_factor FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings"
ON public.user_two_factor FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_user_two_factor_updated_at
BEFORE UPDATE ON public.user_two_factor
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índice
CREATE INDEX idx_user_two_factor_user_id ON public.user_two_factor(user_id);