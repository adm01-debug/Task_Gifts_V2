-- =====================================================
-- SISTEMA DE 10 PILARES DO CLIMA ORGANIZACIONAL
-- =====================================================

-- Enum para os 10 pilares do clima
CREATE TYPE public.climate_pillar AS ENUM (
  'recognition',     -- Reconhecimento
  'autonomy',        -- Autonomia
  'growth',          -- Crescimento
  'leadership',      -- Liderança
  'peers',           -- Pares
  'purpose',         -- Propósito
  'environment',     -- Ambiente
  'communication',   -- Comunicação
  'benefits',        -- Benefícios
  'balance'          -- Equilíbrio
);

-- Pesquisas de clima
CREATE TABLE public.climate_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  survey_type TEXT NOT NULL DEFAULT 'weekly' CHECK (survey_type IN ('weekly', 'monthly', 'quarterly', 'annual', 'custom')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'cancelled')),
  created_by UUID NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  allow_skip BOOLEAN NOT NULL DEFAULT true,
  send_reminders BOOLEAN NOT NULL DEFAULT true,
  reminder_frequency TEXT DEFAULT 'daily',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_pattern TEXT, -- weekly, biweekly, monthly
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Perguntas das pesquisas de clima
CREATE TABLE public.climate_survey_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.climate_surveys(id) ON DELETE CASCADE,
  pillar public.climate_pillar NOT NULL,
  question_text TEXT NOT NULL,
  question_text_en TEXT,
  question_text_es TEXT,
  question_type TEXT NOT NULL DEFAULT 'likert_5' CHECK (question_type IN ('likert_5', 'likert_10', 'nps', 'yes_no', 'multiple_choice', 'text')),
  options JSONB, -- Para múltipla escolha
  is_required BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Respostas das pesquisas de clima
CREATE TABLE public.climate_survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.climate_surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  completion_time_seconds INTEGER,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Respostas individuais por pergunta
CREATE TABLE public.climate_question_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES public.climate_survey_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.climate_survey_questions(id) ON DELETE CASCADE,
  score INTEGER, -- Para likert/NPS
  text_answer TEXT, -- Para respostas abertas
  selected_options JSONB, -- Para múltipla escolha
  skipped BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scores consolidados por pilar (pré-calculados)
CREATE TABLE public.climate_pillar_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.climate_surveys(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id),
  pillar public.climate_pillar NOT NULL,
  score NUMERIC(5,2) NOT NULL, -- 0-100
  response_count INTEGER NOT NULL DEFAULT 0,
  previous_score NUMERIC(5,2), -- Score anterior para comparação
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(survey_id, department_id, pillar)
);

-- Benchmark de mercado
CREATE TABLE public.climate_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pillar public.climate_pillar NOT NULL,
  industry TEXT NOT NULL DEFAULT 'general',
  company_size TEXT NOT NULL DEFAULT 'all' CHECK (company_size IN ('small', 'medium', 'large', 'enterprise', 'all')),
  region TEXT NOT NULL DEFAULT 'brazil',
  average_score NUMERIC(5,2) NOT NULL,
  top_quartile_score NUMERIC(5,2) NOT NULL,
  top_10_percent_score NUMERIC(5,2) NOT NULL,
  sample_size INTEGER NOT NULL DEFAULT 0,
  period TEXT NOT NULL, -- e.g., '2024-Q4'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- SISTEMA DE OPINIÕES ABERTAS
-- =====================================================

-- Categorias de opinião
CREATE TYPE public.opinion_category AS ENUM (
  'suggestion',    -- Sugestão
  'complaint',     -- Reclamação
  'compliment',    -- Elogio
  'question',      -- Dúvida
  'other'          -- Outro
);

-- Urgência
CREATE TYPE public.opinion_urgency AS ENUM (
  'low', 'normal', 'high', 'critical'
);

-- Status da opinião
CREATE TYPE public.opinion_status AS ENUM (
  'new', 'read', 'in_progress', 'resolved', 'archived'
);

-- Opiniões
CREATE TABLE public.opinions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL, -- Quem enviou
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('manager', 'hr', 'ceo', 'custom')),
  recipient_id UUID, -- Se for para pessoa específica
  category public.opinion_category NOT NULL DEFAULT 'suggestion',
  urgency public.opinion_urgency NOT NULL DEFAULT 'normal',
  subject TEXT,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  status public.opinion_status NOT NULL DEFAULT 'new',
  read_at TIMESTAMP WITH TIME ZONE,
  read_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Respostas às opiniões
CREATE TABLE public.opinion_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opinion_id UUID NOT NULL REFERENCES public.opinions(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false, -- Nota interna vs resposta visível
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tags para opiniões
CREATE TABLE public.opinion_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opinion_id UUID NOT NULL REFERENCES public.opinions(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- PLANO DE AÇÃO FCA (Fator-Causa-Ação)
-- =====================================================

CREATE TABLE public.action_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Fator (o que está errado)
  pillar public.climate_pillar,
  related_survey_id UUID REFERENCES public.climate_surveys(id),
  initial_score NUMERIC(5,2),
  target_score NUMERIC(5,2),
  
  -- Causas (5 Porquês)
  root_causes JSONB NOT NULL DEFAULT '[]', -- Array de causas com níveis
  root_cause_summary TEXT,
  
  -- Meta
  target_date DATE NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  
  -- Responsáveis
  owner_id UUID NOT NULL,
  reviewer_id UUID,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'paused', 'completed', 'cancelled')),
  current_score NUMERIC(5,2),
  progress_percent INTEGER NOT NULL DEFAULT 0,
  
  -- Gamificação
  xp_reward INTEGER NOT NULL DEFAULT 200,
  coin_reward INTEGER NOT NULL DEFAULT 100,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Ações do plano (5W2H)
CREATE TABLE public.action_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  
  -- 5W2H
  what_title TEXT NOT NULL,
  what_description TEXT,
  why_reason TEXT,
  where_location TEXT,
  when_start DATE,
  when_end DATE,
  who_responsible_id UUID NOT NULL,
  who_participants JSONB DEFAULT '[]', -- Array de user_ids
  how_method TEXT,
  how_much_cost NUMERIC(12,2) DEFAULT 0,
  how_much_currency TEXT DEFAULT 'BRL',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'blocked')),
  progress_percent INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- Impacto
  impact_score NUMERIC(5,2), -- Quanto impactou o indicador
  impact_notes TEXT,
  
  order_index INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Atualizações/log do plano
CREATE TABLE public.action_plan_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  update_type TEXT NOT NULL DEFAULT 'progress' CHECK (update_type IN ('progress', 'score_update', 'status_change', 'comment')),
  old_value TEXT,
  new_value TEXT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE public.climate_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.climate_survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.climate_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.climate_question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.climate_pillar_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.climate_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opinions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opinion_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opinion_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plan_updates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - Climate Surveys
-- =====================================================

-- Admins e managers podem criar pesquisas
CREATE POLICY "Managers can create climate surveys"
ON public.climate_surveys FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Todos podem ver pesquisas ativas
CREATE POLICY "Everyone can view active surveys"
ON public.climate_surveys FOR SELECT
USING (status IN ('active', 'completed') OR created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Criadores e admins podem editar
CREATE POLICY "Creators can update surveys"
ON public.climate_surveys FOR UPDATE
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Apenas admins podem deletar
CREATE POLICY "Admins can delete surveys"
ON public.climate_surveys FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Questions - herdam visibilidade da survey
CREATE POLICY "View survey questions"
ON public.climate_survey_questions FOR SELECT
USING (EXISTS (SELECT 1 FROM climate_surveys s WHERE s.id = survey_id AND (s.status IN ('active', 'completed') OR s.created_by = auth.uid() OR has_role(auth.uid(), 'admin'))));

CREATE POLICY "Manage survey questions"
ON public.climate_survey_questions FOR ALL
USING (EXISTS (SELECT 1 FROM climate_surveys s WHERE s.id = survey_id AND (s.created_by = auth.uid() OR has_role(auth.uid(), 'admin'))));

-- Responses
CREATE POLICY "Users can submit responses"
ON public.climate_survey_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own responses"
ON public.climate_survey_responses FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own responses"
ON public.climate_survey_responses FOR UPDATE
USING (user_id = auth.uid());

-- Question Answers
CREATE POLICY "Users can answer questions"
ON public.climate_question_answers FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM climate_survey_responses r WHERE r.id = response_id AND r.user_id = auth.uid()));

CREATE POLICY "Users view own answers"
ON public.climate_question_answers FOR SELECT
USING (EXISTS (SELECT 1 FROM climate_survey_responses r WHERE r.id = response_id AND (r.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))));

CREATE POLICY "Users update own answers"
ON public.climate_question_answers FOR UPDATE
USING (EXISTS (SELECT 1 FROM climate_survey_responses r WHERE r.id = response_id AND r.user_id = auth.uid()));

-- Pillar Scores
CREATE POLICY "Managers can view pillar scores"
ON public.climate_pillar_scores FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "System can manage pillar scores"
ON public.climate_pillar_scores FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Benchmarks
CREATE POLICY "Everyone can view benchmarks"
ON public.climate_benchmarks FOR SELECT
USING (true);

CREATE POLICY "Admins manage benchmarks"
ON public.climate_benchmarks FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS POLICIES - Opinions
-- =====================================================

-- Usuários podem criar opiniões
CREATE POLICY "Users can create opinions"
ON public.opinions FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Ver próprias opiniões ou opiniões recebidas (se for gestor/HR)
CREATE POLICY "View opinions"
ON public.opinions FOR SELECT
USING (
  sender_id = auth.uid() 
  OR recipient_id = auth.uid()
  OR (recipient_type = 'hr' AND has_role(auth.uid(), 'admin'))
  OR (recipient_type = 'manager' AND has_role(auth.uid(), 'manager'))
  OR has_role(auth.uid(), 'admin')
);

-- Atualizar status (para quem recebe)
CREATE POLICY "Recipients can update opinions"
ON public.opinions FOR UPDATE
USING (
  recipient_id = auth.uid()
  OR (recipient_type = 'hr' AND has_role(auth.uid(), 'admin'))
  OR (recipient_type = 'manager' AND has_role(auth.uid(), 'manager'))
  OR has_role(auth.uid(), 'admin')
);

-- Opinion Responses
CREATE POLICY "Responders can create responses"
ON public.opinion_responses FOR INSERT
WITH CHECK (
  auth.uid() = responder_id 
  AND EXISTS (
    SELECT 1 FROM opinions o 
    WHERE o.id = opinion_id 
    AND (o.recipient_id = auth.uid() OR (o.recipient_type = 'hr' AND has_role(auth.uid(), 'admin')) OR (o.recipient_type = 'manager' AND has_role(auth.uid(), 'manager')))
  )
);

CREATE POLICY "View opinion responses"
ON public.opinion_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM opinions o 
    WHERE o.id = opinion_id 
    AND (o.sender_id = auth.uid() OR o.recipient_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

-- Opinion Tags
CREATE POLICY "Manage opinion tags"
ON public.opinion_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM opinions o 
    WHERE o.id = opinion_id 
    AND (o.recipient_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

-- =====================================================
-- RLS POLICIES - Action Plans
-- =====================================================

CREATE POLICY "View action plans"
ON public.action_plans FOR SELECT
USING (
  owner_id = auth.uid() 
  OR reviewer_id = auth.uid() 
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'manager')
);

CREATE POLICY "Managers create action plans"
ON public.action_plans FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Owners update action plans"
ON public.action_plans FOR UPDATE
USING (owner_id = auth.uid() OR reviewer_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete action plans"
ON public.action_plans FOR DELETE
USING (has_role(auth.uid(), 'admin') OR owner_id = auth.uid());

-- Action Plan Items
CREATE POLICY "View action plan items"
ON public.action_plan_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM action_plans ap 
    WHERE ap.id = plan_id 
    AND (ap.owner_id = auth.uid() OR ap.reviewer_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  )
);

CREATE POLICY "Manage action plan items"
ON public.action_plan_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM action_plans ap 
    WHERE ap.id = plan_id 
    AND (ap.owner_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

-- Action Plan Updates
CREATE POLICY "View action plan updates"
ON public.action_plan_updates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM action_plans ap 
    WHERE ap.id = plan_id 
    AND (ap.owner_id = auth.uid() OR ap.reviewer_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  )
);

CREATE POLICY "Create action plan updates"
ON public.action_plan_updates FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_climate_surveys_status ON public.climate_surveys(status);
CREATE INDEX idx_climate_surveys_dates ON public.climate_surveys(starts_at, ends_at);
CREATE INDEX idx_climate_survey_questions_survey ON public.climate_survey_questions(survey_id);
CREATE INDEX idx_climate_survey_responses_survey ON public.climate_survey_responses(survey_id);
CREATE INDEX idx_climate_survey_responses_user ON public.climate_survey_responses(user_id);
CREATE INDEX idx_climate_pillar_scores_survey ON public.climate_pillar_scores(survey_id);
CREATE INDEX idx_opinions_sender ON public.opinions(sender_id);
CREATE INDEX idx_opinions_recipient ON public.opinions(recipient_id);
CREATE INDEX idx_opinions_status ON public.opinions(status);
CREATE INDEX idx_action_plans_owner ON public.action_plans(owner_id);
CREATE INDEX idx_action_plans_status ON public.action_plans(status);
CREATE INDEX idx_action_plan_items_plan ON public.action_plan_items(plan_id);

-- =====================================================
-- SEED DATA - Benchmark (dados fictícios para exemplo)
-- =====================================================

INSERT INTO public.climate_benchmarks (pillar, industry, company_size, region, average_score, top_quartile_score, top_10_percent_score, sample_size, period)
VALUES
  ('recognition', 'general', 'all', 'brazil', 72.0, 82.0, 90.0, 1500, '2024-Q4'),
  ('autonomy', 'general', 'all', 'brazil', 69.0, 78.0, 87.0, 1500, '2024-Q4'),
  ('growth', 'general', 'all', 'brazil', 65.0, 76.0, 85.0, 1500, '2024-Q4'),
  ('leadership', 'general', 'all', 'brazil', 70.0, 80.0, 88.0, 1500, '2024-Q4'),
  ('peers', 'general', 'all', 'brazil', 76.0, 84.0, 92.0, 1500, '2024-Q4'),
  ('purpose', 'general', 'all', 'brazil', 74.0, 82.0, 89.0, 1500, '2024-Q4'),
  ('environment', 'general', 'all', 'brazil', 71.0, 79.0, 86.0, 1500, '2024-Q4'),
  ('communication', 'general', 'all', 'brazil', 68.0, 77.0, 85.0, 1500, '2024-Q4'),
  ('benefits', 'general', 'all', 'brazil', 62.0, 73.0, 82.0, 1500, '2024-Q4'),
  ('balance', 'general', 'all', 'brazil', 67.0, 76.0, 84.0, 1500, '2024-Q4');

-- Benchmark específico para tecnologia
INSERT INTO public.climate_benchmarks (pillar, industry, company_size, region, average_score, top_quartile_score, top_10_percent_score, sample_size, period)
VALUES
  ('recognition', 'technology', 'medium', 'brazil', 74.0, 84.0, 92.0, 350, '2024-Q4'),
  ('autonomy', 'technology', 'medium', 'brazil', 78.0, 86.0, 93.0, 350, '2024-Q4'),
  ('growth', 'technology', 'medium', 'brazil', 72.0, 82.0, 90.0, 350, '2024-Q4'),
  ('leadership', 'technology', 'medium', 'brazil', 71.0, 81.0, 89.0, 350, '2024-Q4'),
  ('peers', 'technology', 'medium', 'brazil', 80.0, 88.0, 94.0, 350, '2024-Q4'),
  ('purpose', 'technology', 'medium', 'brazil', 76.0, 84.0, 91.0, 350, '2024-Q4'),
  ('environment', 'technology', 'medium', 'brazil', 75.0, 83.0, 90.0, 350, '2024-Q4'),
  ('communication', 'technology', 'medium', 'brazil', 70.0, 79.0, 87.0, 350, '2024-Q4'),
  ('benefits', 'technology', 'medium', 'brazil', 68.0, 78.0, 86.0, 350, '2024-Q4'),
  ('balance', 'technology', 'medium', 'brazil', 65.0, 75.0, 84.0, 350, '2024-Q4');