-- Enum for module content types
CREATE TYPE public.module_content_type AS ENUM ('video', 'text', 'quiz', 'flashcard', 'infographic', 'simulation', 'checklist');

-- Enum for trail status
CREATE TYPE public.trail_status AS ENUM ('draft', 'published', 'archived');

-- Learning Trails (Trilhas de Aprendizado)
CREATE TABLE public.learning_trails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📚',
  department_id UUID REFERENCES public.departments(id),
  estimated_hours NUMERIC(4,1) DEFAULT 1,
  xp_reward INTEGER DEFAULT 100,
  coin_reward INTEGER DEFAULT 50,
  badge_name TEXT,
  badge_icon TEXT,
  status trail_status DEFAULT 'draft',
  order_index INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trail Modules (Módulos dentro das Trilhas)
CREATE TABLE public.trail_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id UUID NOT NULL REFERENCES public.learning_trails(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type module_content_type DEFAULT 'text',
  content JSONB DEFAULT '{}',
  video_url TEXT,
  xp_reward INTEGER DEFAULT 25,
  duration_minutes INTEGER DEFAULT 15,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Trail Enrollments (Inscrições nas Trilhas)
CREATE TABLE public.trail_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  trail_id UUID NOT NULL REFERENCES public.learning_trails(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  progress_percent INTEGER DEFAULT 0,
  UNIQUE(user_id, trail_id)
);

-- User Module Progress (Progresso por Módulo)
CREATE TABLE public.module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id UUID NOT NULL REFERENCES public.trail_modules(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  score INTEGER,
  attempts INTEGER DEFAULT 0,
  UNIQUE(user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.learning_trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trail_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trail_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_trails
CREATE POLICY "Everyone can view published trails"
ON public.learning_trails FOR SELECT
USING (status = 'published' OR created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers and admins can create trails"
ON public.learning_trails FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Creators and admins can update trails"
ON public.learning_trails FOR UPDATE
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Creators and admins can delete trails"
ON public.learning_trails FOR DELETE
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- RLS Policies for trail_modules
CREATE POLICY "Everyone can view modules of published trails"
ON public.trail_modules FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.learning_trails t 
  WHERE t.id = trail_modules.trail_id 
  AND (t.status = 'published' OR t.created_by = auth.uid() OR has_role(auth.uid(), 'admin'))
));

CREATE POLICY "Trail creators can manage modules"
ON public.trail_modules FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.learning_trails t 
  WHERE t.id = trail_modules.trail_id 
  AND (t.created_by = auth.uid() OR has_role(auth.uid(), 'admin'))
));

-- RLS Policies for trail_enrollments
CREATE POLICY "Users can view own enrollments"
ON public.trail_enrollments FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Users can enroll themselves"
ON public.trail_enrollments FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own enrollments"
ON public.trail_enrollments FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for module_progress
CREATE POLICY "Users can view own progress"
ON public.module_progress FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Users can insert own progress"
ON public.module_progress FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress"
ON public.module_progress FOR UPDATE
USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_learning_trails_updated_at
BEFORE UPDATE ON public.learning_trails
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trail_modules_updated_at
BEFORE UPDATE ON public.trail_modules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();