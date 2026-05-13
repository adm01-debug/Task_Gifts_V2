-- Create user_challenges table
CREATE TABLE IF NOT EXISTS public.user_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    target INTEGER NOT NULL DEFAULT 1,
    current INTEGER NOT NULL DEFAULT 0,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    coin_reward INTEGER NOT NULL DEFAULT 0,
    difficulty TEXT NOT NULL DEFAULT 'easy',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own challenges" 
ON public.user_challenges FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges" 
ON public.user_challenges FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_user_challenges
BEFORE UPDATE ON public.user_challenges
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_active ON public.user_challenges(user_id, is_active);
