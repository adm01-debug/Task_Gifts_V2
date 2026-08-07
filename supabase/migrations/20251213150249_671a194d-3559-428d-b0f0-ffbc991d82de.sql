-- Create mentorship pairs table
CREATE TABLE public.mentorship_pairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL,
  apprentice_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_xp_earned INTEGER NOT NULL DEFAULT 0,
  total_missions_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT mentorship_pairs_unique UNIQUE (mentor_id, apprentice_id),
  CONSTRAINT mentorship_pairs_different_users CHECK (mentor_id != apprentice_id)
);

-- Create mentorship missions table
CREATE TABLE public.mentorship_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '🎯',
  xp_reward INTEGER NOT NULL DEFAULT 50,
  coin_reward INTEGER NOT NULL DEFAULT 25,
  mission_type TEXT NOT NULL DEFAULT 'collaborative' CHECK (mission_type IN ('mentor_only', 'apprentice_only', 'collaborative')),
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mentorship mission progress table
CREATE TABLE public.mentorship_mission_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID NOT NULL REFERENCES public.mentorship_pairs(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.mentorship_missions(id) ON DELETE CASCADE,
  completed_by_mentor BOOLEAN NOT NULL DEFAULT false,
  completed_by_apprentice BOOLEAN NOT NULL DEFAULT false,
  mentor_completed_at TIMESTAMP WITH TIME ZONE,
  apprentice_completed_at TIMESTAMP WITH TIME ZONE,
  rewards_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT mentorship_progress_unique UNIQUE (pair_id, mission_id)
);

-- Create mentorship requests table for pairing
CREATE TABLE public.mentorship_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  target_id UUID,
  request_type TEXT NOT NULL CHECK (request_type IN ('find_mentor', 'find_apprentice', 'specific')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.mentorship_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentorship_pairs
CREATE POLICY "Users can view their own mentorship pairs" 
ON public.mentorship_pairs FOR SELECT 
USING (auth.uid() = mentor_id OR auth.uid() = apprentice_id);

CREATE POLICY "Users can create mentorship pairs" 
ON public.mentorship_pairs FOR INSERT 
WITH CHECK (auth.uid() = mentor_id OR auth.uid() = apprentice_id);

CREATE POLICY "Users can update their own pairs" 
ON public.mentorship_pairs FOR UPDATE 
USING (auth.uid() = mentor_id OR auth.uid() = apprentice_id);

-- RLS Policies for mentorship_missions
CREATE POLICY "Everyone can view active missions" 
ON public.mentorship_missions FOR SELECT 
USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage missions" 
ON public.mentorship_missions FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for mentorship_mission_progress
CREATE POLICY "Users can view their pair progress" 
ON public.mentorship_mission_progress FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM mentorship_pairs mp 
    WHERE mp.id = pair_id 
    AND (mp.mentor_id = auth.uid() OR mp.apprentice_id = auth.uid())
  )
);

CREATE POLICY "Users can insert progress for their pairs" 
ON public.mentorship_mission_progress FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM mentorship_pairs mp 
    WHERE mp.id = pair_id 
    AND (mp.mentor_id = auth.uid() OR mp.apprentice_id = auth.uid())
  )
);

CREATE POLICY "Users can update their pair progress" 
ON public.mentorship_mission_progress FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM mentorship_pairs mp 
    WHERE mp.id = pair_id 
    AND (mp.mentor_id = auth.uid() OR mp.apprentice_id = auth.uid())
  )
);

-- RLS Policies for mentorship_requests
CREATE POLICY "Users can view their requests" 
ON public.mentorship_requests FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Users can create requests" 
ON public.mentorship_requests FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update requests targeting them" 
ON public.mentorship_requests FOR UPDATE 
USING (auth.uid() = target_id OR auth.uid() = requester_id);

-- Triggers for updated_at
CREATE TRIGGER update_mentorship_pairs_updated_at
  BEFORE UPDATE ON public.mentorship_pairs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentorship_mission_progress_updated_at
  BEFORE UPDATE ON public.mentorship_mission_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default mentorship missions
INSERT INTO public.mentorship_missions (title, description, icon, xp_reward, coin_reward, mission_type, difficulty, order_index) VALUES
('Primeira Reunião', 'Realize a primeira reunião de alinhamento entre mentor e aprendiz', '🤝', 50, 25, 'collaborative', 'easy', 1),
('Definir Objetivos', 'Defina 3 objetivos de desenvolvimento para os próximos 30 dias', '🎯', 75, 35, 'collaborative', 'medium', 2),
('Compartilhar Experiência', 'Mentor compartilha uma história de aprendizado importante', '📖', 40, 20, 'mentor_only', 'easy', 3),
('Completar Primeira Trilha', 'Aprendiz completa sua primeira trilha de aprendizado', '🎓', 100, 50, 'apprentice_only', 'medium', 4),
('Feedback Construtivo', 'Mentor fornece feedback detalhado sobre uma entrega', '💬', 60, 30, 'mentor_only', 'medium', 5),
('Superar Desafio', 'Aprendiz supera um desafio identificado pelo mentor', '🏆', 150, 75, 'collaborative', 'hard', 6),
('Apresentar Projeto', 'Aprendiz apresenta um projeto para o mentor', '📊', 120, 60, 'apprentice_only', 'hard', 7),
('Certificação Alcançada', 'Dupla completa todas as missões da mentoria', '🌟', 200, 100, 'collaborative', 'hard', 8);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentorship_pairs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentorship_mission_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentorship_requests;