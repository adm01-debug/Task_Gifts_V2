-- Create kudos badges table (predefined badges)
CREATE TABLE public.kudos_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '⭐',
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  xp_value INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kudos table (recognition posts)
CREATE TABLE public.kudos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  badge_id UUID REFERENCES public.kudos_badges(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT kudos_not_self CHECK (from_user_id != to_user_id)
);

-- Enable RLS
ALTER TABLE public.kudos_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;

-- Badges are public
CREATE POLICY "Everyone can view badges"
ON public.kudos_badges FOR SELECT
USING (true);

-- Only admins can manage badges
CREATE POLICY "Admins can manage badges"
ON public.kudos_badges FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Public kudos can be viewed by everyone
CREATE POLICY "Public kudos are viewable by all"
ON public.kudos FOR SELECT
USING (is_public = true OR from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Users can create kudos
CREATE POLICY "Authenticated users can give kudos"
ON public.kudos FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- Users can delete their own kudos
CREATE POLICY "Users can delete kudos they gave"
ON public.kudos FOR DELETE
USING (auth.uid() = from_user_id);

-- Enable realtime for kudos
ALTER TABLE public.kudos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kudos;

-- Create indexes
CREATE INDEX idx_kudos_to_user ON public.kudos(to_user_id);
CREATE INDEX idx_kudos_from_user ON public.kudos(from_user_id);
CREATE INDEX idx_kudos_created_at ON public.kudos(created_at DESC);

-- Insert default badges
INSERT INTO public.kudos_badges (name, icon, description, category, xp_value) VALUES
('Trabalho em Equipe', '🤝', 'Excelente colaboração com o time', 'teamwork', 30),
('Inovador', '💡', 'Trouxe ideias criativas e inovadoras', 'innovation', 35),
('Mentor', '🎓', 'Ajudou no desenvolvimento de colegas', 'leadership', 40),
('Estrela', '⭐', 'Performance excepcional', 'performance', 50),
('Solucionador', '🔧', 'Resolveu problemas complexos', 'problem-solving', 35),
('Comunicador', '💬', 'Comunicação clara e efetiva', 'communication', 25),
('Dedicação', '🔥', 'Demonstrou comprometimento exemplar', 'dedication', 30),
('Positivo', '😊', 'Manteve atitude positiva e motivadora', 'culture', 25);