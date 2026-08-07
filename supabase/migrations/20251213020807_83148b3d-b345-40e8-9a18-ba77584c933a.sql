-- Enum for mission frequency
CREATE TYPE public.mission_frequency AS ENUM ('daily', 'weekly', 'monthly');

-- Department Missions (Missões por Departamento)
CREATE TABLE public.department_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES public.departments(id),
  title TEXT NOT NULL,
  description TEXT,
  frequency mission_frequency DEFAULT 'daily',
  xp_reward INTEGER DEFAULT 30,
  coin_reward INTEGER DEFAULT 0,
  target_value INTEGER DEFAULT 1,
  metric_key TEXT NOT NULL,
  icon TEXT DEFAULT '🎯',
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Mission Progress (Progresso do Usuário nas Missões)
CREATE TABLE public.user_mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mission_id UUID NOT NULL REFERENCES public.department_missions(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mission_id, period_start)
);

-- Department Rankings (Rankings Departamentais)
CREATE TABLE public.department_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id),
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'weekly',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metrics JSONB DEFAULT '{}',
  total_score INTEGER DEFAULT 0,
  rank_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(department_id, user_id, period_type, period_start)
);

-- Enable RLS
ALTER TABLE public.department_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_rankings ENABLE ROW LEVEL SECURITY;

-- RLS for department_missions
CREATE POLICY "Everyone can view active missions"
ON public.department_missions FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage missions"
ON public.department_missions FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS for user_mission_progress
CREATE POLICY "Users can view own progress"
ON public.user_mission_progress FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Users can insert own progress"
ON public.user_mission_progress FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress"
ON public.user_mission_progress FOR UPDATE
USING (user_id = auth.uid());

-- RLS for department_rankings
CREATE POLICY "Everyone can view rankings"
ON public.department_rankings FOR SELECT
USING (true);

CREATE POLICY "System can manage rankings"
ON public.department_rankings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Triggers
CREATE TRIGGER update_department_missions_updated_at
BEFORE UPDATE ON public.department_missions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_department_rankings_updated_at
BEFORE UPDATE ON public.department_rankings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();