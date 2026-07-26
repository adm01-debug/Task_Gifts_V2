-- ============ ENUMS ============
CREATE TYPE public.engagement_answer_format AS ENUM (
  'slider', 'stars', 'emoji', 'cards', 'checkbox', 'percentage', 'text'
);

CREATE TYPE public.engagement_cycle_status AS ENUM ('scheduled', 'active', 'closed');

-- ============ FATORES ============
CREATE TABLE public.engagement_factors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  pillar public.climate_pillar NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_engagement_factors_pillar ON public.engagement_factors(pillar);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.engagement_factors TO authenticated;
GRANT ALL ON public.engagement_factors TO service_role;
ALTER TABLE public.engagement_factors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "engagement_factors_select" ON public.engagement_factors
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "engagement_factors_admin_write" ON public.engagement_factors
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ POOL DE PERGUNTAS ============
CREATE TABLE public.engagement_question_pool (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  question_text TEXT NOT NULL,
  helper_text TEXT,
  pillar public.climate_pillar NOT NULL,
  factor_id UUID REFERENCES public.engagement_factors(id) ON DELETE SET NULL,
  answer_format public.engagement_answer_format NOT NULL DEFAULT 'slider',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  weight NUMERIC NOT NULL DEFAULT 1,
  is_reverse BOOLEAN NOT NULL DEFAULT false,
  is_nr1 BOOLEAN NOT NULL DEFAULT false,
  copsoq_dimension TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_eqp_pillar ON public.engagement_question_pool(pillar);
CREATE INDEX idx_eqp_factor ON public.engagement_question_pool(factor_id);
CREATE INDEX idx_eqp_active ON public.engagement_question_pool(is_active) WHERE is_active;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.engagement_question_pool TO authenticated;
GRANT ALL ON public.engagement_question_pool TO service_role;
ALTER TABLE public.engagement_question_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eqp_select" ON public.engagement_question_pool
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "eqp_admin_write" ON public.engagement_question_pool
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ CICLOS ============
CREATE TABLE public.engagement_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  questions_per_user INTEGER NOT NULL DEFAULT 6,
  status public.engagement_cycle_status NOT NULL DEFAULT 'active',
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ecycles_status ON public.engagement_cycles(status, ends_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.engagement_cycles TO authenticated;
GRANT ALL ON public.engagement_cycles TO service_role;
ALTER TABLE public.engagement_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ecycles_select" ON public.engagement_cycles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ecycles_admin_write" ON public.engagement_cycles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ ATRIBUIÇÕES ============
CREATE TABLE public.engagement_question_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES public.engagement_cycles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.engagement_question_pool(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, user_id, question_id)
);
CREATE INDEX idx_eqa_user_cycle ON public.engagement_question_assignments(user_id, cycle_id);
CREATE INDEX idx_eqa_pending ON public.engagement_question_assignments(user_id) WHERE answered_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.engagement_question_assignments TO authenticated;
GRANT ALL ON public.engagement_question_assignments TO service_role;
ALTER TABLE public.engagement_question_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eqa_own_select" ON public.engagement_question_assignments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "eqa_own_update" ON public.engagement_question_assignments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "eqa_own_insert" ON public.engagement_question_assignments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "eqa_admin_delete" ON public.engagement_question_assignments
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ RESPOSTAS ============
CREATE TABLE public.engagement_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES public.engagement_cycles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.engagement_question_pool(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  raw_value JSONB,
  normalized_score NUMERIC CHECK (normalized_score >= 0 AND normalized_score <= 10),
  text_answer TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, question_id, user_id)
);
CREATE INDEX idx_eanswers_cycle ON public.engagement_answers(cycle_id);
CREATE INDEX idx_eanswers_question ON public.engagement_answers(question_id);
CREATE INDEX idx_eanswers_dept_date ON public.engagement_answers(department_id, answered_at DESC);

GRANT SELECT, INSERT ON public.engagement_answers TO authenticated;
GRANT ALL ON public.engagement_answers TO service_role;
ALTER TABLE public.engagement_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eanswers_own_select" ON public.engagement_answers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "eanswers_own_insert" ON public.engagement_answers
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============ TRIGGERS updated_at ============
CREATE TRIGGER trg_engagement_factors_updated
  BEFORE UPDATE ON public.engagement_factors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_eqp_updated
  BEFORE UPDATE ON public.engagement_question_pool
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ecycles_updated
  BEFORE UPDATE ON public.engagement_cycles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();