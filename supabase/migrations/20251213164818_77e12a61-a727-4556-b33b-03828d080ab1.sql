
-- Create certifications catalog table
CREATE TABLE public.certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '📜',
  category TEXT NOT NULL DEFAULT 'general',
  validity_months INTEGER, -- NULL means never expires
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  coin_reward INTEGER NOT NULL DEFAULT 50,
  department_id UUID REFERENCES public.departments(id),
  trail_id UUID REFERENCES public.learning_trails(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user certifications table
CREATE TABLE public.user_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  certification_id UUID NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  renewed_at TIMESTAMP WITH TIME ZONE,
  renewal_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, expiring_soon, expired, revoked
  issued_by UUID, -- manager who issued
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, certification_id)
);

-- Enable RLS
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;

-- Certifications policies
CREATE POLICY "Everyone can view certifications" ON public.certifications
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage certifications" ON public.certifications
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- User certifications policies
CREATE POLICY "Users can view own certifications" ON public.user_certifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Managers can view team certifications" ON public.user_certifications
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "System can insert certifications" ON public.user_certifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Managers can update certifications" ON public.user_certifications
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

-- Create function to check and update certification status
CREATE OR REPLACE FUNCTION public.update_certification_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update expired certifications
  UPDATE user_certifications
  SET status = 'expired', updated_at = now()
  WHERE expires_at IS NOT NULL 
    AND expires_at < now() 
    AND status != 'expired' 
    AND status != 'revoked';
  
  -- Update expiring soon (within 30 days)
  UPDATE user_certifications
  SET status = 'expiring_soon', updated_at = now()
  WHERE expires_at IS NOT NULL 
    AND expires_at > now() 
    AND expires_at < now() + INTERVAL '30 days'
    AND status = 'active';
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_certifications_updated_at
  BEFORE UPDATE ON public.certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_certifications_updated_at
  BEFORE UPDATE ON public.user_certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample certifications
INSERT INTO public.certifications (name, description, icon, category, validity_months, is_mandatory, xp_reward, coin_reward) VALUES
('Integração Promo Brindes', 'Certificação de conclusão do onboarding corporativo', '🎓', 'onboarding', NULL, true, 200, 100),
('Segurança do Trabalho', 'Treinamento obrigatório de segurança e NRs', '🦺', 'compliance', 12, true, 150, 75),
('LGPD e Proteção de Dados', 'Certificação em Lei Geral de Proteção de Dados', '🔒', 'compliance', 12, true, 150, 75),
('Operador de Empilhadeira', 'Certificação para operação de empilhadeiras', '🏗️', 'operacional', 24, true, 300, 150),
('Técnicas de Gravação - Silk Screen', 'Especialização em técnica Silk Screen', '🎨', 'tecnico', 36, false, 250, 125),
('Técnicas de Gravação - Laser', 'Especialização em técnica Laser', '✨', 'tecnico', 36, false, 250, 125),
('Atendimento ao Cliente', 'Excelência no atendimento B2B', '🤝', 'comercial', 18, false, 200, 100),
('Gestão de Estoque - BOX', 'Certificação no sistema BOX de estoque', '📦', 'operacional', 24, false, 200, 100);
