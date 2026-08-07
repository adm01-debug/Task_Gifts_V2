-- Create weekly challenges table
CREATE TABLE public.weekly_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL,
  opponent_id UUID NOT NULL,
  week_start DATE NOT NULL DEFAULT DATE_TRUNC('week', CURRENT_DATE)::date,
  week_end DATE NOT NULL DEFAULT (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::date,
  challenger_xp_start INTEGER NOT NULL DEFAULT 0,
  opponent_xp_start INTEGER NOT NULL DEFAULT 0,
  challenger_xp_gained INTEGER NOT NULL DEFAULT 0,
  opponent_xp_gained INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  coin_reward INTEGER NOT NULL DEFAULT 50,
  winner_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT different_users CHECK (challenger_id != opponent_id)
);

-- Enable RLS
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own challenges"
ON public.weekly_challenges
FOR SELECT
USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE POLICY "System can insert challenges"
ON public.weekly_challenges
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update challenges"
ON public.weekly_challenges
FOR UPDATE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_weekly_challenges_updated_at
BEFORE UPDATE ON public.weekly_challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_challenges;