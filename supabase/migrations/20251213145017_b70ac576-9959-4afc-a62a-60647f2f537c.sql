-- Create seasonal events table
CREATE TABLE public.seasonal_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎄',
  banner_color TEXT NOT NULL DEFAULT '#dc2626',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  xp_multiplier NUMERIC NOT NULL DEFAULT 1.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create seasonal challenges table
CREATE TABLE public.seasonal_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.seasonal_events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '🎯',
  target_value INTEGER NOT NULL DEFAULT 1,
  metric_key TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  coin_reward INTEGER NOT NULL DEFAULT 50,
  badge_name TEXT,
  badge_icon TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user seasonal progress table
CREATE TABLE public.user_seasonal_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.seasonal_challenges(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.seasonal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_seasonal_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seasonal_events
CREATE POLICY "Everyone can view active events"
  ON public.seasonal_events
  FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage events"
  ON public.seasonal_events
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for seasonal_challenges
CREATE POLICY "Everyone can view challenges"
  ON public.seasonal_challenges
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.seasonal_events e 
    WHERE e.id = event_id AND (e.is_active = true OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Admins can manage challenges"
  ON public.seasonal_challenges
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_seasonal_progress
CREATE POLICY "Users can view own progress"
  ON public.user_seasonal_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_seasonal_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_seasonal_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all progress"
  ON public.user_seasonal_progress
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.seasonal_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_seasonal_progress;