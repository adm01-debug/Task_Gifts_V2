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
  ADD COLUMN IF NOT EXISTS hire_date DATE,
  -- Colunas criadas direto em producao e nunca versionadas. Objetos do proprio
  -- repositorio ja dependem delas, entao um rebuild sem elas quebra:
  --   get_my_profile_private (20260728184034:2-12, LANGUAGE sql),
  --   GRANT SELECT/UPDATE por coluna (20260728184034:39-43, 20261218000000:211,214,
  --   20261226200000:41,44-61) e a matview leaderboard_cache (20261228120000).
  -- Tipos, defaults e ordem reproduzem information_schema.columns de producao.
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'confirmed',
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS personal_email TEXT,
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS employee_id TEXT,
  ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'clt',
  ADD COLUMN IF NOT EXISTS last_access_at TIMESTAMP WITH TIME ZONE;

-- CHECKs de producao, com os mesmos nomes. `status` e regra de negocio: so
-- 'confirmed' recebe os lembretes de clima (20261224100000:67). Guardados por
-- pg_constraint para nao falhar onde ja existem.
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_status_check'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check
      CHECK (status = ANY (ARRAY['invited'::text, 'confirmed'::text, 'inactive'::text, 'deleted'::text]));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_contract_type_check'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_contract_type_check
      CHECK (contract_type = ANY (ARRAY['clt'::text, 'pj'::text, 'intern'::text, 'temporary'::text]));
  END IF;
END
$do$;

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

-- =============================================================================
-- 2026-11-25 | Recuperacao de drift de esquema (nao existia no versionamento)
-- -----------------------------------------------------------------------------
-- Por que este bloco mora AQUI e nao numa migration nova:
--   `20251225230238:59` faz ALTER TABLE public.notification_preferences e a
--   tabela nunca era criada em nenhuma migration -> um `supabase db reset`
--   abortava ali. Uma migration nova com versao retroativa nao resolveria
--   (o `supabase db push` nao aplica versao anterior a ultima do ledger) e
--   ainda travaria os applies seguintes. Criar as tabelas neste arquivo,
--   ja aplicado, e o mesmo caminho usado em outras correcoes de rebuild.
--
-- Estrutura copiada do catalogo de producao em 2026-11-25 (pg_attribute,
-- pg_constraint, pg_indexes, pg_policies, relacl) - 7 tabelas, 73 colunas,
-- 11 policies, 8 indices extras. Em producao este bloco e INERTE: o arquivo
-- ja esta no ledger, e cada statement e idempotente (`CREATE TABLE IF NOT
-- EXISTS` pula a tabela existente, `DROP ... IF EXISTS` antes de criar).
-- =============================================================================

-- Funcao do trigger de updated_at de notification_preferences (duplicata
-- proposital de update_updated_at_column(), com o nome que existe em producao).
CREATE OR REPLACE FUNCTION public.update_notification_prefs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TABLE IF NOT EXISTS public.demographic_attributes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  name_en text,
  name_es text,
  attribute_type text DEFAULT 'single_select'::text NOT NULL,
  options jsonb DEFAULT '[]'::jsonb,
  is_required boolean DEFAULT false NOT NULL,
  is_visible_in_reports boolean DEFAULT true NOT NULL,
  is_restricted boolean DEFAULT false NOT NULL,
  allow_prefer_not_answer boolean DEFAULT true NOT NULL,
  order_index integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT demographic_attributes_pkey PRIMARY KEY (id),
  CONSTRAINT demographic_attributes_attribute_type_check CHECK (attribute_type = ANY (ARRAY['text'::text, 'single_select'::text, 'multi_select'::text, 'number'::text, 'date'::text, 'calculated'::text]))
);

CREATE TABLE IF NOT EXISTS public.user_demographic_values (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  attribute_id uuid NOT NULL,
  value text,
  values_array jsonb DEFAULT '[]'::jsonb,
  number_value numeric,
  date_value date,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT user_demographic_values_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_demographic_value UNIQUE (user_id, attribute_id),
  CONSTRAINT user_demographic_values_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.demographic_attributes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.permission_groups (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  is_system boolean DEFAULT false NOT NULL,
  permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT permission_groups_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_permission_groups (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  permission_group_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT user_permission_groups_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_permission_group UNIQUE (user_id, permission_group_id),
  CONSTRAINT user_permission_groups_permission_group_id_fkey FOREIGN KEY (permission_group_id) REFERENCES public.permission_groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.geo_blocking_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  country_code character varying(2) NOT NULL,
  country_name character varying(100) NOT NULL,
  is_allowed boolean DEFAULT true NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT geo_blocking_rules_pkey PRIMARY KEY (id),
  CONSTRAINT geo_blocking_rules_country_code_key UNIQUE (country_code),
  CONSTRAINT geo_blocking_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.geo_access_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  ip_address inet NOT NULL,
  country_code character varying(2),
  country_name character varying(100),
  user_id uuid,
  was_allowed boolean NOT NULL,
  reason text,
  user_agent text,
  endpoint text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT geo_access_logs_pkey PRIMARY KEY (id),
  CONSTRAINT geo_access_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  email_enabled boolean DEFAULT true NOT NULL,
  push_enabled boolean DEFAULT true NOT NULL,
  in_app_enabled boolean DEFAULT true NOT NULL,
  type_preferences jsonb DEFAULT '{"xp": {"push": false, "email": false, "in_app": true, "priority": "low"}, "goal": {"push": true, "email": true, "in_app": true, "priority": "high"}, "quest": {"push": true, "email": true, "in_app": true, "priority": "normal"}, "survey": {"push": true, "email": true, "in_app": true, "priority": "high"}, "checkin": {"push": false, "email": true, "in_app": true, "priority": "normal"}, "feedback": {"push": true, "email": true, "in_app": true, "priority": "high"}, "level_up": {"push": true, "email": true, "in_app": true, "priority": "high"}, "achievement": {"push": true, "email": true, "in_app": true, "priority": "normal"}, "leaderboard": {"push": true, "email": false, "in_app": true, "priority": "normal"}, "announcement": {"push": true, "email": true, "in_app": true, "priority": "normal"}, "competency_gap": {"push": true, "email": true, "in_app": true, "priority": "high"}, "campaign_closed": {"push": true, "email": true, "in_app": true, "priority": "normal"}, "development_tip": {"push": false, "email": true, "in_app": true, "priority": "low"}, "campaign_enrolled": {"push": true, "email": false, "in_app": true, "priority": "normal"}, "campaign_progress": {"push": false, "email": false, "in_app": true, "priority": "low"}, "campaign_completed": {"push": true, "email": true, "in_app": true, "priority": "high"}, "campaign_milestone": {"push": true, "email": false, "in_app": true, "priority": "normal"}}'::jsonb NOT NULL,
  do_not_disturb_enabled boolean DEFAULT false NOT NULL,
  do_not_disturb_start time without time zone DEFAULT '22:00:00'::time without time zone,
  do_not_disturb_end time without time zone DEFAULT '08:00:00'::time without time zone,
  do_not_disturb_weekends boolean DEFAULT true NOT NULL,
  digest_enabled boolean DEFAULT true NOT NULL,
  digest_frequency text DEFAULT 'daily'::text NOT NULL,
  digest_time time without time zone DEFAULT '09:00:00'::time without time zone,
  language text DEFAULT 'pt-BR'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  channel_email boolean DEFAULT true,
  channel_push boolean DEFAULT true,
  channel_in_app boolean DEFAULT true,
  quiet_hours_start time without time zone,
  quiet_hours_end time without time zone,
  frequency text DEFAULT 'instant'::text,
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_notification_prefs UNIQUE (user_id),
  CONSTRAINT notification_preferences_digest_frequency_check CHECK (digest_frequency = ANY (ARRAY['hourly'::text, 'daily'::text, 'weekly'::text]))
);
-- Indices que nao vem das constraints acima (nomes identicos aos de producao).
CREATE INDEX IF NOT EXISTS idx_geo_access_logs_allowed ON public.geo_access_logs USING btree (was_allowed);
CREATE INDEX IF NOT EXISTS idx_geo_access_logs_country ON public.geo_access_logs USING btree (country_code);
CREATE INDEX IF NOT EXISTS idx_geo_access_logs_created ON public.geo_access_logs USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_geo_access_logs_user_id ON public.geo_access_logs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_geo_blocking_rules_allowed ON public.geo_blocking_rules USING btree (is_allowed);
CREATE INDEX IF NOT EXISTS idx_geo_blocking_rules_created_by ON public.geo_blocking_rules USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_user_demographic_values_attribute_id ON public.user_demographic_values USING btree (attribute_id);
CREATE INDEX IF NOT EXISTS idx_user_permission_groups_permission_group_id ON public.user_permission_groups USING btree (permission_group_id);

-- RLS: as 7 tabelas sao deny-by-default em producao.
ALTER TABLE public.demographic_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_blocking_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_demographic_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_groups ENABLE ROW LEVEL SECURITY;

-- ACL de producao: authenticated/service_role com ALL, anon sem acesso
-- (exceto leitura em geo_blocking_rules e permission_groups).
GRANT ALL ON public.demographic_attributes TO authenticated, service_role;
GRANT ALL ON public.geo_access_logs TO authenticated, service_role;
GRANT ALL ON public.geo_blocking_rules TO authenticated, service_role;
GRANT ALL ON public.notification_preferences TO authenticated, service_role;
GRANT ALL ON public.permission_groups TO authenticated, service_role;
GRANT ALL ON public.user_demographic_values TO authenticated, service_role;
GRANT ALL ON public.user_permission_groups TO authenticated, service_role;
REVOKE ALL ON public.demographic_attributes FROM anon;
REVOKE ALL ON public.geo_access_logs FROM anon;
REVOKE ALL ON public.geo_blocking_rules FROM anon;
REVOKE ALL ON public.notification_preferences FROM anon;
REVOKE ALL ON public.permission_groups FROM anon;
REVOKE ALL ON public.user_demographic_values FROM anon;
REVOKE ALL ON public.user_permission_groups FROM anon;
GRANT SELECT ON public.geo_blocking_rules TO anon;
GRANT SELECT ON public.permission_groups TO anon;

-- Policies (as 2 de geo_* criadas em migrations posteriores nao sao repetidas aqui).
DROP POLICY IF EXISTS "Admins can manage demographic attributes" ON public.demographic_attributes;
CREATE POLICY "Admins can manage demographic attributes" ON public.demographic_attributes FOR ALL USING (has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Everyone can view active demographic attributes" ON public.demographic_attributes;
CREATE POLICY "Everyone can view active demographic attributes" ON public.demographic_attributes FOR SELECT USING (is_active OR has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins podem ver logs de acesso geografico" ON public.geo_access_logs;
CREATE POLICY "Admins podem ver logs de acesso geografico" ON public.geo_access_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins podem gerenciar regras de geo blocking" ON public.geo_blocking_rules;
CREATE POLICY "Admins podem gerenciar regras de geo blocking" ON public.geo_blocking_rules FOR ALL USING (has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage permission groups" ON public.permission_groups;
CREATE POLICY "Admins can manage permission groups" ON public.permission_groups FOR ALL USING (has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Everyone can view permission groups" ON public.permission_groups;
CREATE POLICY "Everyone can view permission groups" ON public.permission_groups FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins and managers can view demographic values" ON public.user_demographic_values;
CREATE POLICY "Admins and managers can view demographic values" ON public.user_demographic_values FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
DROP POLICY IF EXISTS "Users can manage own demographic values" ON public.user_demographic_values;
CREATE POLICY "Users can manage own demographic values" ON public.user_demographic_values FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage user permission groups" ON public.user_permission_groups;
CREATE POLICY "Admins can manage user permission groups" ON public.user_permission_groups FOR ALL USING (has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users can view own permission groups" ON public.user_permission_groups;
CREATE POLICY "Users can view own permission groups" ON public.user_permission_groups FOR SELECT USING (auth.uid() = user_id);

-- Triggers de updated_at (os de geo_access_logs/user_permission_groups nao existem em producao).
DROP TRIGGER IF EXISTS update_demographic_attributes_updated_at ON public.demographic_attributes;
CREATE TRIGGER update_demographic_attributes_updated_at BEFORE UPDATE ON public.demographic_attributes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_geo_blocking_rules_updated_at ON public.geo_blocking_rules;
CREATE TRIGGER update_geo_blocking_rules_updated_at BEFORE UPDATE ON public.geo_blocking_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION update_notification_prefs_updated_at();
DROP TRIGGER IF EXISTS update_permission_groups_updated_at ON public.permission_groups;
CREATE TRIGGER update_permission_groups_updated_at BEFORE UPDATE ON public.permission_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_user_demographic_values_updated_at ON public.user_demographic_values;
CREATE TRIGGER update_user_demographic_values_updated_at BEFORE UPDATE ON public.user_demographic_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Colunas de aprovacao de compra: existem em producao desde a aprovacao em
-- duas etapas, nunca foram versionadas. `ADD COLUMN IF NOT EXISTS` e no-op la.
ALTER TABLE public.shop_purchases
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS approval_reason TEXT,
  ADD COLUMN IF NOT EXISTS risk_flags JSONB DEFAULT '[]'::jsonb;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shop_purchases_approval_status_check' AND conrelid = 'public.shop_purchases'::regclass) THEN
    ALTER TABLE public.shop_purchases ADD CONSTRAINT shop_purchases_approval_status_check CHECK (approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'auto_approved'::text]));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shop_purchases_approved_by_fkey' AND conrelid = 'public.shop_purchases'::regclass) THEN
    ALTER TABLE public.shop_purchases ADD CONSTRAINT shop_purchases_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END
$do$;
-- -----------------------------------------------------------------------------
-- Funcoes de producao que nunca foram versionadas mas sao citadas por
-- migrations posteriores (ALTER/REVOKE/GRANT em cima delas). Sem elas, o
-- replay aborta em 20260522143342 e 20260905120000.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_geo_access(p_ip_address inet, p_country_code character varying, p_country_name character varying, p_user_id uuid, p_was_allowed boolean, p_reason text, p_user_agent text, p_endpoint text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.geo_access_logs (
        ip_address, country_code, country_name, user_id, 
        was_allowed, reason, user_agent, endpoint
    )
    VALUES (
        p_ip_address, p_country_code, p_country_name, p_user_id,
        p_was_allowed, p_reason, p_user_agent, p_endpoint
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$function$;

-- Trigger de auditoria da Roleta da Sorte: em producao o trigger aponta para
-- esta funcao (criada no dashboard). O repositorio usa a versao evoluida
-- log_lucky_wheel_prize_change(); esta fica apenas para o ALTER de 20260905.
CREATE OR REPLACE FUNCTION public.audit_lucky_wheel_prize()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  INSERT INTO public.lucky_wheel_prize_audit(prize_id, operation, changed_by, before_data, after_data)
  VALUES (
    COALESCE(OLD.id, NEW.id),
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD)::jsonb END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW)::jsonb END
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;
