
-- Criar apenas tabelas que NÃO existem

-- Enum para tipos de avaliador (se não existir)
DO $$ BEGIN
  CREATE TYPE public.evaluator_type AS ENUM ('self', 'manager', 'peer', 'direct_report', 'external');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para status do ciclo de feedback (se não existir)
DO $$ BEGIN
  CREATE TYPE public.feedback_cycle_status AS ENUM ('draft', 'active', 'collecting', 'processing', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adicionar colunas faltantes em feedback_cycles
ALTER TABLE public.feedback_cycles 
  ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS min_evaluators INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS include_self_evaluation BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS include_manager_evaluation BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS include_peer_evaluation BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS include_direct_report_evaluation BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);

-- Tabela de Questões do 360
CREATE TABLE IF NOT EXISTS public.feedback_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES public.feedback_cycles(id) ON DELETE CASCADE,
  competency_id UUID REFERENCES public.competencies(id),
  question_text TEXT NOT NULL,
  question_text_en TEXT,
  question_text_es TEXT,
  question_type TEXT DEFAULT 'scale',
  scale_min INTEGER DEFAULT 1,
  scale_max INTEGER DEFAULT 5,
  scale_labels JSONB,
  options JSONB,
  is_required BOOLEAN DEFAULT true,
  weight NUMERIC(3,2) DEFAULT 1.0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Avaliações (quem avalia quem)
CREATE TABLE IF NOT EXISTS public.feedback_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES public.feedback_cycles(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL,
  evaluatee_id UUID NOT NULL,
  evaluator_type TEXT DEFAULT 'peer',
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Resultados Consolidados
CREATE TABLE IF NOT EXISTS public.feedback_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES public.feedback_cycles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  competency_id UUID REFERENCES public.competencies(id),
  self_score NUMERIC(4,2),
  manager_score NUMERIC(4,2),
  peer_score NUMERIC(4,2),
  direct_report_score NUMERIC(4,2),
  overall_score NUMERIC(4,2),
  response_count INTEGER DEFAULT 0,
  blind_spots JSONB,
  hidden_strengths JSONB,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- PDI Templates
CREATE TABLE IF NOT EXISTS public.pdi_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  target_role TEXT,
  target_level TEXT,
  actions_template JSONB NOT NULL DEFAULT '[]',
  estimated_duration_months INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- PDI Mentors
CREATE TABLE IF NOT EXISTS public.pdi_mentors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.development_plans(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL,
  role TEXT DEFAULT 'mentor',
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- PDI Checkins
CREATE TABLE IF NOT EXISTS public.pdi_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.development_plans(id) ON DELETE CASCADE,
  checkin_date TIMESTAMP WITH TIME ZONE NOT NULL,
  progress_summary TEXT,
  blockers TEXT,
  next_steps TEXT,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
  manager_feedback TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Position Competencies
CREATE TABLE IF NOT EXISTS public.position_competencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
  required_level INTEGER NOT NULL CHECK (required_level >= 1 AND required_level <= 5),
  weight NUMERIC(3,2) DEFAULT 1.0,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Competency Assessments
CREATE TABLE IF NOT EXISTS public.user_competency_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
  assessed_level INTEGER NOT NULL CHECK (assessed_level >= 1 AND assessed_level <= 5),
  assessment_type TEXT DEFAULT 'manager',
  evidence TEXT,
  assessor_id UUID,
  feedback_cycle_id UUID REFERENCES public.feedback_cycles(id),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.feedback_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.position_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_competency_assessments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "feedback_questions_select" ON public.feedback_questions FOR SELECT USING (true);
CREATE POLICY "feedback_evaluations_select" ON public.feedback_evaluations FOR SELECT USING (auth.uid() = evaluator_id OR auth.uid() = evaluatee_id);
CREATE POLICY "feedback_evaluations_insert" ON public.feedback_evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "feedback_evaluations_update" ON public.feedback_evaluations FOR UPDATE USING (auth.uid() = evaluator_id);
CREATE POLICY "feedback_results_select" ON public.feedback_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "feedback_results_insert" ON public.feedback_results FOR INSERT WITH CHECK (true);
CREATE POLICY "pdi_templates_select" ON public.pdi_templates FOR SELECT USING (is_active = true);
CREATE POLICY "pdi_mentors_select" ON public.pdi_mentors FOR SELECT USING (auth.uid() = mentor_id OR EXISTS (SELECT 1 FROM public.development_plans dp WHERE dp.id = plan_id AND dp.user_id = auth.uid()));
CREATE POLICY "pdi_mentors_insert" ON public.pdi_mentors FOR INSERT WITH CHECK (true);
CREATE POLICY "pdi_checkins_select" ON public.pdi_checkins FOR SELECT USING (EXISTS (SELECT 1 FROM public.development_plans dp WHERE dp.id = plan_id AND dp.user_id = auth.uid()));
CREATE POLICY "pdi_checkins_insert" ON public.pdi_checkins FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "position_competencies_select" ON public.position_competencies FOR SELECT USING (true);
CREATE POLICY "position_competencies_manage" ON public.position_competencies FOR ALL USING (true);
CREATE POLICY "user_competency_assessments_select" ON public.user_competency_assessments FOR SELECT USING (auth.uid() = user_id OR auth.uid() = assessor_id);
CREATE POLICY "user_competency_assessments_insert" ON public.user_competency_assessments FOR INSERT WITH CHECK (true);
