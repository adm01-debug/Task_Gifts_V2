-- Tabela para solicitações de reset de senha
CREATE TABLE public.password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'completed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '48 hours'),
  reset_token UUID,
  reset_token_expires_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_password_reset_requests_user_id ON public.password_reset_requests(user_id);
CREATE INDEX idx_password_reset_requests_status ON public.password_reset_requests(status);
CREATE INDEX idx_password_reset_requests_reviewed_by ON public.password_reset_requests(reviewed_by);

-- Enable RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Usuários podem ver suas próprias solicitações
CREATE POLICY "Users can view own password reset requests"
ON public.password_reset_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Managers e admins podem ver solicitações de sua equipe
CREATE POLICY "Managers can view team password reset requests"
ON public.password_reset_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm1
    JOIN public.team_members tm2 ON tm1.department_id = tm2.department_id
    WHERE tm1.user_id = auth.uid() 
    AND tm1.is_manager = true
    AND tm2.user_id = password_reset_requests.user_id
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Usuários podem criar solicitações para si mesmos
CREATE POLICY "Users can create own password reset requests"
ON public.password_reset_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Managers podem aprovar/rejeitar solicitações de sua equipe
CREATE POLICY "Managers can update team password reset requests"
ON public.password_reset_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm1
    JOIN public.team_members tm2 ON tm1.department_id = tm2.department_id
    WHERE tm1.user_id = auth.uid() 
    AND tm1.is_manager = true
    AND tm2.user_id = password_reset_requests.user_id
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_password_reset_requests_updated_at
BEFORE UPDATE ON public.password_reset_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para solicitar reset de senha
CREATE OR REPLACE FUNCTION public.request_password_reset(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id UUID;
  v_existing_pending UUID;
BEGIN
  -- Verificar se já existe uma solicitação pendente
  SELECT id INTO v_existing_pending
  FROM password_reset_requests
  WHERE user_id = p_user_id 
  AND status = 'pending'
  AND expires_at > now()
  LIMIT 1;
  
  IF v_existing_pending IS NOT NULL THEN
    RAISE EXCEPTION 'Já existe uma solicitação de reset pendente';
  END IF;
  
  -- Criar nova solicitação
  INSERT INTO password_reset_requests (user_id)
  VALUES (p_user_id)
  RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$;

-- Função para aprovar reset de senha
CREATE OR REPLACE FUNCTION public.approve_password_reset(p_request_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request password_reset_requests%ROWTYPE;
  v_reset_token UUID;
BEGIN
  -- Buscar solicitação
  SELECT * INTO v_request
  FROM password_reset_requests
  WHERE id = p_request_id;
  
  IF v_request IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solicitação não encontrada');
  END IF;
  
  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solicitação não está pendente');
  END IF;
  
  IF v_request.expires_at < now() THEN
    UPDATE password_reset_requests SET status = 'expired' WHERE id = p_request_id;
    RETURN jsonb_build_object('success', false, 'error', 'Solicitação expirada');
  END IF;
  
  -- Gerar token de reset
  v_reset_token := gen_random_uuid();
  
  -- Atualizar solicitação
  UPDATE password_reset_requests
  SET 
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_notes = p_notes,
    reset_token = v_reset_token,
    reset_token_expires_at = now() + INTERVAL '1 hour'
  WHERE id = p_request_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'reset_token', v_reset_token,
    'user_id', v_request.user_id
  );
END;
$$;

-- Função para rejeitar reset de senha
CREATE OR REPLACE FUNCTION public.reject_password_reset(p_request_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request password_reset_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request
  FROM password_reset_requests
  WHERE id = p_request_id;
  
  IF v_request IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solicitação não encontrada');
  END IF;
  
  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solicitação não está pendente');
  END IF;
  
  UPDATE password_reset_requests
  SET 
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_notes = p_notes
  WHERE id = p_request_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;