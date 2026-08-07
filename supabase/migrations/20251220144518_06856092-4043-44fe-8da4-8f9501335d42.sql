-- ============================================
-- 1. GOALS/OKRS SYSTEM
-- ============================================

-- Goals table (Objectives)
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL DEFAULT 'personal' CHECK (goal_type IN ('personal', 'team', 'company')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  xp_reward INTEGER NOT NULL DEFAULT 200,
  coin_reward INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Key Results table
CREATE TABLE public.key_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  metric_type TEXT NOT NULL DEFAULT 'percentage' CHECK (metric_type IN ('percentage', 'number', 'currency', 'boolean')),
  target_value NUMERIC NOT NULL DEFAULT 100,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  weight NUMERIC NOT NULL DEFAULT 1 CHECK (weight > 0),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Goal updates/check-ins
CREATE TABLE public.goal_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  key_result_id UUID REFERENCES public.key_results(id) ON DELETE CASCADE,
  previous_value NUMERIC,
  new_value NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_updates ENABLE ROW LEVEL SECURITY;

-- Goals policies
CREATE POLICY "Users can view own goals"
  ON public.goals FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view team goals"
  ON public.goals FOR SELECT
  USING (goal_type = 'team' AND department_id IN (
    SELECT department_id FROM public.team_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view company goals"
  ON public.goals FOR SELECT
  USING (goal_type = 'company');

CREATE POLICY "Users can create own goals"
  ON public.goals FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own goals"
  ON public.goals FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own draft goals"
  ON public.goals FOR DELETE
  USING (user_id = auth.uid() AND status = 'draft');

CREATE POLICY "Managers can manage team goals"
  ON public.goals FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Key Results policies
CREATE POLICY "Users can view key results of visible goals"
  ON public.key_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.goals g WHERE g.id = goal_id
  ));

CREATE POLICY "Goal owners can manage key results"
  ON public.key_results FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.goals g WHERE g.id = goal_id AND (g.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  ));

-- Goal updates policies
CREATE POLICY "Users can view updates of visible goals"
  ON public.goal_updates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.goals g WHERE g.id = goal_id
  ));

CREATE POLICY "Goal owners can insert updates"
  ON public.goal_updates FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.goals g WHERE g.id = goal_id AND (g.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  ));

-- ============================================
-- 2. LEAGUES/DIVISIONS SYSTEM
-- ============================================

-- Leagues definition
CREATE TABLE public.leagues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tier INTEGER NOT NULL UNIQUE CHECK (tier >= 1 AND tier <= 6),
  icon TEXT NOT NULL DEFAULT '🥉',
  color TEXT NOT NULL DEFAULT '#CD7F32',
  min_xp_weekly INTEGER NOT NULL DEFAULT 0,
  promotion_slots INTEGER NOT NULL DEFAULT 10,
  demotion_slots INTEGER NOT NULL DEFAULT 10,
  xp_bonus_percent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default leagues
INSERT INTO public.leagues (name, tier, icon, color, min_xp_weekly, promotion_slots, demotion_slots, xp_bonus_percent) VALUES
  ('Bronze', 1, '🥉', '#CD7F32', 0, 15, 0, 0),
  ('Prata', 2, '🥈', '#C0C0C0', 100, 12, 10, 5),
  ('Ouro', 3, '🥇', '#FFD700', 300, 10, 10, 10),
  ('Platina', 4, '💎', '#E5E4E2', 600, 8, 10, 15),
  ('Diamante', 5, '💠', '#B9F2FF', 1000, 5, 8, 20),
  ('Mestre', 6, '👑', '#FF6B6B', 2000, 0, 5, 30);

-- User league membership
CREATE TABLE public.user_leagues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  league_id UUID NOT NULL REFERENCES public.leagues(id),
  week_start DATE NOT NULL DEFAULT DATE_TRUNC('week', CURRENT_DATE)::DATE,
  weekly_xp INTEGER NOT NULL DEFAULT 0,
  rank_in_league INTEGER,
  promoted_at TIMESTAMP WITH TIME ZONE,
  demoted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- League history
CREATE TABLE public.league_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_league_id UUID REFERENCES public.leagues(id),
  to_league_id UUID NOT NULL REFERENCES public.leagues(id),
  change_type TEXT NOT NULL CHECK (change_type IN ('promotion', 'demotion', 'initial')),
  weekly_xp INTEGER NOT NULL DEFAULT 0,
  week_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_history ENABLE ROW LEVEL SECURITY;

-- Leagues policies
CREATE POLICY "Everyone can view leagues"
  ON public.leagues FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage leagues"
  ON public.leagues FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- User leagues policies
CREATE POLICY "Everyone can view user leagues"
  ON public.user_leagues FOR SELECT
  USING (true);

CREATE POLICY "System can manage user leagues"
  ON public.user_leagues FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own league"
  ON public.user_leagues FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- League history policies
CREATE POLICY "Everyone can view league history"
  ON public.league_history FOR SELECT
  USING (true);

CREATE POLICY "System can insert league history"
  ON public.league_history FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 3. CHECK-INS 1:1 SYSTEM
-- ============================================

CREATE TABLE public.checkin_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default template
INSERT INTO public.checkin_templates (name, description, questions, is_default, created_by) VALUES
  ('Template Padrão 1:1', 'Template básico para reuniões de acompanhamento', 
   '[{"id":"q1","question":"Como você está se sentindo em relação ao trabalho?","type":"rating"},{"id":"q2","question":"Quais foram suas principais conquistas desde nosso último 1:1?","type":"text"},{"id":"q3","question":"Quais desafios você está enfrentando?","type":"text"},{"id":"q4","question":"Como posso ajudá-lo melhor?","type":"text"},{"id":"q5","question":"Algum feedback para mim ou para a equipe?","type":"text"}]',
   true, '00000000-0000-0000-0000-000000000000');

CREATE TABLE public.checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  template_id UUID REFERENCES public.checkin_templates(id),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  action_items JSONB DEFAULT '[]',
  responses JSONB DEFAULT '{}',
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
  xp_reward INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checkin_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Templates policies
CREATE POLICY "Everyone can view templates"
  ON public.checkin_templates FOR SELECT
  USING (true);

CREATE POLICY "Managers can create templates"
  ON public.checkin_templates FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Template owners can manage"
  ON public.checkin_templates FOR ALL
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Checkins policies
CREATE POLICY "Participants can view their checkins"
  ON public.checkins FOR SELECT
  USING (manager_id = auth.uid() OR employee_id = auth.uid());

CREATE POLICY "Managers can create checkins"
  ON public.checkins FOR INSERT
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Participants can update checkins"
  ON public.checkins FOR UPDATE
  USING (manager_id = auth.uid() OR employee_id = auth.uid());

CREATE POLICY "Admins can view all checkins"
  ON public.checkins FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- 4. PULSE SURVEYS SYSTEM
-- ============================================

CREATE TABLE public.pulse_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  department_id UUID REFERENCES public.departments(id),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pulse_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.pulse_surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pulse_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pulse_responses ENABLE ROW LEVEL SECURITY;

-- Surveys policies
CREATE POLICY "Users can view active surveys for their department"
  ON public.pulse_surveys FOR SELECT
  USING (
    status = 'active' AND (
      department_id IS NULL OR
      department_id IN (SELECT department_id FROM public.team_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Managers can manage surveys"
  ON public.pulse_surveys FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Responses policies
CREATE POLICY "Users can submit responses"
  ON public.pulse_responses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own responses"
  ON public.pulse_responses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view anonymous aggregated responses"
  ON public.pulse_responses FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- ============================================
-- 5. CELEBRATIONS SYSTEM
-- ============================================

CREATE TABLE public.celebrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  celebration_type TEXT NOT NULL CHECK (celebration_type IN ('birthday', 'work_anniversary', 'milestone', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  celebration_date DATE NOT NULL,
  year_count INTEGER,
  is_public BOOLEAN NOT NULL DEFAULT true,
  auto_generated BOOLEAN NOT NULL DEFAULT false,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  coin_reward INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User profile extensions for celebrations
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS hire_date DATE;

-- Enable RLS
ALTER TABLE public.celebrations ENABLE ROW LEVEL SECURITY;

-- Celebrations policies
CREATE POLICY "Users can view public celebrations"
  ON public.celebrations FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "System can create celebrations"
  ON public.celebrations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can manage own celebrations"
  ON public.celebrations FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- 6. MOOD TRACKER SYSTEM
-- ============================================

CREATE TABLE public.mood_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
  mood_emoji TEXT NOT NULL DEFAULT '😐',
  note TEXT,
  factors JSONB DEFAULT '[]',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

-- Enable RLS
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

-- Mood entries policies
CREATE POLICY "Users can manage own mood entries"
  ON public.mood_entries FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view anonymous team mood data"
  ON public.mood_entries FOR SELECT
  USING (
    is_anonymous = false OR
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  );

-- ============================================
-- 7. ANNOUNCEMENTS BOARD SYSTEM
-- ============================================

CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'urgent', 'event', 'achievement', 'policy')),
  department_id UUID REFERENCES public.departments(id),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  pin_expires_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.announcement_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id, emoji)
);

CREATE TABLE public.announcement_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Announcements policies
CREATE POLICY "Everyone can view published announcements"
  ON public.announcements FOR SELECT
  USING (
    published_at IS NOT NULL AND 
    published_at <= now() AND
    (expires_at IS NULL OR expires_at > now()) AND
    (department_id IS NULL OR department_id IN (SELECT department_id FROM public.team_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Managers can create announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Authors can manage own announcements"
  ON public.announcements FOR UPDATE
  USING (author_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete announcements"
  ON public.announcements FOR DELETE
  USING (author_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Reactions policies
CREATE POLICY "Users can react to announcements"
  ON public.announcement_reactions FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Everyone can view reactions"
  ON public.announcement_reactions FOR SELECT
  USING (true);

-- Reads policies
CREATE POLICY "Users can mark as read"
  ON public.announcement_reads FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own reads"
  ON public.announcement_reads FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- ============================================
-- 8. FEEDBACK 360° SYSTEM
-- ============================================

CREATE TABLE public.feedback_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cycle_type TEXT NOT NULL DEFAULT '360' CHECK (cycle_type IN ('360', 'manager', 'peer', 'self')),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'review', 'completed')),
  questions JSONB NOT NULL DEFAULT '[]',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.feedback_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES public.feedback_cycles(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('self', 'manager', 'peer', 'direct_report')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'skipped')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.feedback_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.feedback_requests(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  strengths TEXT,
  improvements TEXT,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;

-- Cycles policies
CREATE POLICY "Everyone can view active cycles"
  ON public.feedback_cycles FOR SELECT
  USING (status IN ('active', 'review', 'completed') OR created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can manage cycles"
  ON public.feedback_cycles FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Requests policies
CREATE POLICY "Users can view their feedback requests"
  ON public.feedback_requests FOR SELECT
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Managers can create requests"
  ON public.feedback_requests FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Users can update their requests"
  ON public.feedback_requests FOR UPDATE
  USING (from_user_id = auth.uid());

CREATE POLICY "Admins can view all requests"
  ON public.feedback_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Responses policies
CREATE POLICY "Submitters can create responses"
  ON public.feedback_responses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.feedback_requests r WHERE r.id = request_id AND r.from_user_id = auth.uid()
  ));

CREATE POLICY "Submitters can view own responses"
  ON public.feedback_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.feedback_requests r WHERE r.id = request_id AND r.from_user_id = auth.uid()
  ));

CREATE POLICY "Receivers can view non-anonymous feedback"
  ON public.feedback_responses FOR SELECT
  USING (
    is_anonymous = false AND EXISTS (
      SELECT 1 FROM public.feedback_requests r WHERE r.id = request_id AND r.to_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all responses"
  ON public.feedback_responses FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_key_results_updated_at BEFORE UPDATE ON public.key_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_leagues_updated_at BEFORE UPDATE ON public.user_leagues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checkins_updated_at BEFORE UPDATE ON public.checkins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pulse_surveys_updated_at BEFORE UPDATE ON public.pulse_surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_cycles_updated_at BEFORE UPDATE ON public.feedback_cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_requests_updated_at BEFORE UPDATE ON public.feedback_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();