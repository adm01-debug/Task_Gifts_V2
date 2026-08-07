-- Create direct duels table for 1v1 challenges
CREATE TABLE public.direct_duels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL,
  opponent_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'active', 'completed', 'declined', 'cancelled')),
  challenger_xp_start INTEGER NOT NULL DEFAULT 0,
  opponent_xp_start INTEGER NOT NULL DEFAULT 0,
  challenger_xp_gained INTEGER NOT NULL DEFAULT 0,
  opponent_xp_gained INTEGER NOT NULL DEFAULT 0,
  winner_id UUID,
  xp_reward INTEGER NOT NULL DEFAULT 150,
  coin_reward INTEGER NOT NULL DEFAULT 75,
  duration_hours INTEGER NOT NULL DEFAULT 24,
  message TEXT,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.direct_duels ENABLE ROW LEVEL SECURITY;

-- Users can view duels they are part of
CREATE POLICY "Users can view their duels"
ON public.direct_duels
FOR SELECT
USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- Users can create duels as challenger
CREATE POLICY "Users can create duels"
ON public.direct_duels
FOR INSERT
WITH CHECK (auth.uid() = challenger_id);

-- Users can update their own duels (accept, decline, etc)
CREATE POLICY "Users can update their duels"
ON public.direct_duels
FOR UPDATE
USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- Create trigger for updated_at
CREATE TRIGGER update_direct_duels_updated_at
BEFORE UPDATE ON public.direct_duels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_duels;