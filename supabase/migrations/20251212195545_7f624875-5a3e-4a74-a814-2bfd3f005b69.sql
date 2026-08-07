-- Create enum for quest difficulty
CREATE TYPE public.quest_difficulty AS ENUM ('easy', 'medium', 'hard', 'expert');

-- Create enum for quest status
CREATE TYPE public.quest_status AS ENUM ('draft', 'active', 'archived');

-- Create custom quests table
CREATE TABLE public.custom_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📚',
  difficulty quest_difficulty NOT NULL DEFAULT 'medium',
  xp_reward INTEGER NOT NULL DEFAULT 100,
  coin_reward INTEGER NOT NULL DEFAULT 50,
  status quest_status NOT NULL DEFAULT 'draft',
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  deadline_days INTEGER,
  max_participants INTEGER,
  requirements TEXT[],
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quest steps/milestones table
CREATE TABLE public.quest_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_id UUID NOT NULL REFERENCES public.custom_quests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quest assignments table (who is assigned to which quest)
CREATE TABLE public.quest_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_id UUID NOT NULL REFERENCES public.custom_quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_quests
CREATE POLICY "Managers and admins can create quests"
ON public.custom_quests
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
);

CREATE POLICY "Managers and admins can update their quests"
ON public.custom_quests
FOR UPDATE
USING (
  created_by = auth.uid() OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Managers and admins can delete their quests"
ON public.custom_quests
FOR DELETE
USING (
  created_by = auth.uid() OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Everyone can view active quests"
ON public.custom_quests
FOR SELECT
USING (
  status = 'active' OR created_by = auth.uid() OR has_role(auth.uid(), 'admin')
);

-- RLS Policies for quest_steps
CREATE POLICY "Quest creators can manage steps"
ON public.quest_steps
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.custom_quests q 
    WHERE q.id = quest_id 
    AND (q.created_by = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Everyone can view steps of active quests"
ON public.quest_steps
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.custom_quests q 
    WHERE q.id = quest_id AND q.status = 'active'
  )
);

-- RLS Policies for quest_assignments
CREATE POLICY "Users can view their own assignments"
ON public.quest_assignments
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Managers can view team assignments"
ON public.quest_assignments
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
);

CREATE POLICY "Managers can create assignments"
ON public.quest_assignments
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')
);

CREATE POLICY "Users can update their own progress"
ON public.quest_assignments
FOR UPDATE
USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_custom_quests_updated_at
  BEFORE UPDATE ON public.custom_quests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes
CREATE INDEX idx_custom_quests_status ON public.custom_quests(status);
CREATE INDEX idx_custom_quests_department ON public.custom_quests(department_id);
CREATE INDEX idx_quest_steps_quest ON public.quest_steps(quest_id);
CREATE INDEX idx_quest_assignments_user ON public.quest_assignments(user_id);
CREATE INDEX idx_quest_assignments_quest ON public.quest_assignments(quest_id);