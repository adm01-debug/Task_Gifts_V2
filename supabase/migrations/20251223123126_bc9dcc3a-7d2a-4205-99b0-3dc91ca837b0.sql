-- ============================================
-- TEAMCULTURE-INSPIRED TALENT MANAGEMENT SYSTEM
-- ============================================

-- 0. Competencies table (required for PDI)
CREATE TABLE IF NOT EXISTS public.competencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'technical',
  department_id UUID REFERENCES departments(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 1. Nine Box Evaluations (Matriz 9-Box)
CREATE TABLE public.nine_box_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES auth.users(id),
  evaluation_period TEXT NOT NULL,
  performance_score INTEGER NOT NULL CHECK (performance_score >= 1 AND performance_score <= 3),
  potential_score INTEGER NOT NULL CHECK (potential_score >= 1 AND potential_score <= 3),
  box_position INTEGER GENERATED ALWAYS AS (((potential_score - 1) * 3) + performance_score) STORED,
  performance_notes TEXT,
  potential_notes TEXT,
  goals_for_next_period TEXT[],
  strengths TEXT[],
  development_areas TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Development Plans (PDI - Plano de Desenvolvimento Individual)
CREATE TABLE public.development_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  linked_feedback_id UUID REFERENCES feedback_responses(id),
  linked_nine_box_id UUID REFERENCES nine_box_evaluations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Development Plan Actions (Ações do PDI)
CREATE TABLE public.development_plan_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  action_type TEXT NOT NULL DEFAULT 'learning' CHECK (action_type IN ('learning', 'project', 'mentoring', 'certification', 'training', 'experience', 'other')),
  competency_id UUID REFERENCES competencies(id),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  evidence_url TEXT,
  notes TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. eNPS Surveys
CREATE TABLE public.enps_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  department_id UUID REFERENCES departments(id),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  follow_up_question TEXT DEFAULT 'O que podemos fazer para melhorar sua experiência?',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. eNPS Responses
CREATE TABLE public.enps_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES enps_surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  category TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN score >= 9 THEN 'promoter'
      WHEN score >= 7 THEN 'passive'
      ELSE 'detractor'
    END
  ) STORED,
  follow_up_answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(survey_id, user_id)
);

-- 6. Engagement Snapshots (Histórico de Engajamento)
CREATE TABLE public.engagement_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID REFERENCES departments(id),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_type TEXT NOT NULL DEFAULT 'weekly' CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
  enps_score NUMERIC(5,2),
  mood_avg NUMERIC(3,2),
  participation_rate NUMERIC(5,2),
  active_users INTEGER,
  total_users INTEGER,
  quests_completed INTEGER,
  training_completion_rate NUMERIC(5,2),
  punctuality_rate NUMERIC(5,2),
  kudos_given INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(department_id, snapshot_date, period_type)
);

-- Enable RLS
ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nine_box_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_plan_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enps_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enps_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS for Competencies
CREATE POLICY "Everyone can view competencies"
ON public.competencies FOR SELECT
USING (true);

CREATE POLICY "Admins can manage competencies"
ON public.competencies FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for Nine Box Evaluations
CREATE POLICY "Users can view their own evaluations"
ON public.nine_box_evaluations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all evaluations"
ON public.nine_box_evaluations FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view their team evaluations"
ON public.nine_box_evaluations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members tm1
    JOIN team_members tm2 ON tm1.department_id = tm2.department_id
    WHERE tm1.user_id = auth.uid() AND tm1.is_manager = true
    AND tm2.user_id = nine_box_evaluations.user_id
  )
);

CREATE POLICY "Admins and managers can create evaluations"
ON public.nine_box_evaluations FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM team_members tm1
    JOIN team_members tm2 ON tm1.department_id = tm2.department_id
    WHERE tm1.user_id = auth.uid() AND tm1.is_manager = true
    AND tm2.user_id = nine_box_evaluations.user_id
  )
);

CREATE POLICY "Admins and managers can update evaluations"
ON public.nine_box_evaluations FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR evaluator_id = auth.uid()
);

-- RLS Policies for Development Plans
CREATE POLICY "Users can view their own development plans"
ON public.development_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all development plans"
ON public.development_plans FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view team development plans"
ON public.development_plans FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members tm1
    JOIN team_members tm2 ON tm1.department_id = tm2.department_id
    WHERE tm1.user_id = auth.uid() AND tm1.is_manager = true
    AND tm2.user_id = development_plans.user_id
  )
);

CREATE POLICY "Users can create their own development plans"
ON public.development_plans FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() = created_by);

CREATE POLICY "Users and managers can update development plans"
ON public.development_plans FOR UPDATE
USING (
  auth.uid() = user_id OR 
  auth.uid() = created_by OR
  public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for Development Plan Actions
CREATE POLICY "Users can view their plan actions"
ON public.development_plan_actions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM development_plans dp
    WHERE dp.id = development_plan_actions.plan_id
    AND (dp.user_id = auth.uid() OR dp.created_by = auth.uid())
  )
);

CREATE POLICY "Admins can view all plan actions"
ON public.development_plan_actions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create plan actions"
ON public.development_plan_actions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM development_plans dp
    WHERE dp.id = development_plan_actions.plan_id
    AND (dp.user_id = auth.uid() OR dp.created_by = auth.uid())
  )
);

CREATE POLICY "Users can update plan actions"
ON public.development_plan_actions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM development_plans dp
    WHERE dp.id = development_plan_actions.plan_id
    AND (dp.user_id = auth.uid() OR dp.created_by = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can delete plan actions"
ON public.development_plan_actions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM development_plans dp
    WHERE dp.id = development_plan_actions.plan_id
    AND (dp.user_id = auth.uid() OR dp.created_by = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for eNPS Surveys
CREATE POLICY "Everyone can view active surveys"
ON public.enps_surveys FOR SELECT
USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage surveys"
ON public.enps_surveys FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for eNPS Responses
CREATE POLICY "Users can submit their responses"
ON public.enps_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own responses"
ON public.enps_responses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all responses"
ON public.enps_responses FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for Engagement Snapshots
CREATE POLICY "Admins can manage snapshots"
ON public.engagement_snapshots FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view department snapshots"
ON public.engagement_snapshots FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid() AND tm.is_manager = true
    AND (engagement_snapshots.department_id IS NULL OR tm.department_id = engagement_snapshots.department_id)
  )
);

-- Indexes for performance
CREATE INDEX idx_competencies_dept ON competencies(department_id);
CREATE INDEX idx_nine_box_user ON nine_box_evaluations(user_id);
CREATE INDEX idx_nine_box_evaluator ON nine_box_evaluations(evaluator_id);
CREATE INDEX idx_nine_box_period ON nine_box_evaluations(evaluation_period);
CREATE INDEX idx_development_plans_user ON development_plans(user_id);
CREATE INDEX idx_development_plans_status ON development_plans(status);
CREATE INDEX idx_plan_actions_plan ON development_plan_actions(plan_id);
CREATE INDEX idx_plan_actions_status ON development_plan_actions(status);
CREATE INDEX idx_enps_surveys_status ON enps_surveys(status);
CREATE INDEX idx_enps_responses_survey ON enps_responses(survey_id);
CREATE INDEX idx_engagement_snapshots_date ON engagement_snapshots(snapshot_date);

-- Function to calculate eNPS score
CREATE OR REPLACE FUNCTION public.calculate_enps_score(p_survey_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promoters INTEGER;
  v_detractors INTEGER;
  v_total INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE score >= 9),
    COUNT(*) FILTER (WHERE score <= 6),
    COUNT(*)
  INTO v_promoters, v_detractors, v_total
  FROM enps_responses
  WHERE survey_id = p_survey_id;
  
  IF v_total = 0 THEN
    RETURN NULL;
  END IF;
  
  RETURN ROUND(((v_promoters::NUMERIC - v_detractors::NUMERIC) / v_total) * 100, 1);
END;
$$;

-- Function to get Nine Box distribution
CREATE OR REPLACE FUNCTION public.get_nine_box_distribution(p_department_id UUID DEFAULT NULL, p_period TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'distribution', COALESCE(jsonb_object_agg(box_position::text, cnt), '{}'::jsonb),
    'total', COALESCE(SUM(cnt), 0),
    'labels', jsonb_build_object(
      '1', 'Baixo Desempenho / Baixo Potencial',
      '2', 'Médio Desempenho / Baixo Potencial',
      '3', 'Alto Desempenho / Baixo Potencial',
      '4', 'Baixo Desempenho / Médio Potencial',
      '5', 'Médio Desempenho / Médio Potencial',
      '6', 'Alto Desempenho / Médio Potencial',
      '7', 'Baixo Desempenho / Alto Potencial',
      '8', 'Médio Desempenho / Alto Potencial',
      '9', 'Alto Desempenho / Alto Potencial (Star)'
    )
  ) INTO v_result
  FROM (
    SELECT nbe.box_position, COUNT(*) as cnt
    FROM nine_box_evaluations nbe
    LEFT JOIN team_members tm ON tm.user_id = nbe.user_id
    WHERE (p_department_id IS NULL OR tm.department_id = p_department_id)
    AND (p_period IS NULL OR nbe.evaluation_period = p_period)
    AND nbe.id IN (
      SELECT DISTINCT ON (user_id) id
      FROM nine_box_evaluations
      ORDER BY user_id, created_at DESC
    )
    GROUP BY nbe.box_position
  ) dist;
  
  RETURN v_result;
END;
$$;

-- Function to generate engagement snapshot
CREATE OR REPLACE FUNCTION public.generate_engagement_snapshot(p_department_id UUID DEFAULT NULL, p_period_type TEXT DEFAULT 'weekly')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot_id UUID;
  v_enps NUMERIC;
  v_mood NUMERIC;
  v_participation NUMERIC;
  v_active INTEGER;
  v_total INTEGER;
  v_quests INTEGER;
  v_training NUMERIC;
  v_punctuality NUMERIC;
  v_kudos INTEGER;
BEGIN
  -- Calculate eNPS from most recent survey
  SELECT calculate_enps_score(es.id) INTO v_enps
  FROM enps_surveys es
  WHERE es.status = 'closed'
  AND (p_department_id IS NULL OR es.department_id = p_department_id)
  ORDER BY es.ends_at DESC
  LIMIT 1;
  
  -- Calculate mood average
  SELECT AVG(mood_score) INTO v_mood
  FROM mood_entries me
  LEFT JOIN team_members tm ON tm.user_id = me.user_id
  WHERE me.entry_date >= CURRENT_DATE - INTERVAL '7 days'
  AND (p_department_id IS NULL OR tm.department_id = p_department_id);
  
  -- Calculate active users and total
  SELECT 
    COUNT(DISTINCT ar.user_id),
    COUNT(DISTINCT p.id)
  INTO v_active, v_total
  FROM profiles p
  LEFT JOIN team_members tm ON tm.user_id = p.id
  LEFT JOIN attendance_records ar ON ar.user_id = p.id AND ar.check_in >= CURRENT_DATE - INTERVAL '7 days'
  WHERE p_department_id IS NULL OR tm.department_id = p_department_id;
  
  v_participation := CASE WHEN v_total > 0 THEN ROUND((v_active::NUMERIC / v_total) * 100, 2) ELSE 0 END;
  
  -- Calculate quests completed
  SELECT COALESCE(SUM(p.quests_completed), 0) INTO v_quests
  FROM profiles p
  LEFT JOIN team_members tm ON tm.user_id = p.id
  WHERE p_department_id IS NULL OR tm.department_id = p_department_id;
  
  -- Calculate training completion
  SELECT ROUND(
    (COUNT(*) FILTER (WHERE te.completed_at IS NOT NULL)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2
  ) INTO v_training
  FROM trail_enrollments te
  LEFT JOIN team_members tm ON tm.user_id = te.user_id
  WHERE p_department_id IS NULL OR tm.department_id = p_department_id;
  
  -- Calculate punctuality
  SELECT ROUND(
    (COUNT(*) FILTER (WHERE ar.is_punctual = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2
  ) INTO v_punctuality
  FROM attendance_records ar
  LEFT JOIN team_members tm ON tm.user_id = ar.user_id
  WHERE ar.check_in >= CURRENT_DATE - INTERVAL '30 days'
  AND (p_department_id IS NULL OR tm.department_id = p_department_id);
  
  -- Calculate kudos
  SELECT COUNT(*) INTO v_kudos
  FROM kudos k
  LEFT JOIN team_members tm ON tm.user_id = k.to_user_id
  WHERE k.created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND (p_department_id IS NULL OR tm.department_id = p_department_id);
  
  -- Insert snapshot with conflict handling
  INSERT INTO engagement_snapshots (
    department_id, period_type, enps_score, mood_avg, participation_rate,
    active_users, total_users, quests_completed, training_completion_rate,
    punctuality_rate, kudos_given
  ) VALUES (
    p_department_id, p_period_type, v_enps, v_mood, v_participation,
    v_active, v_total, v_quests, v_training, v_punctuality, v_kudos
  )
  RETURNING id INTO v_snapshot_id;
  
  RETURN v_snapshot_id;
END;
$$;