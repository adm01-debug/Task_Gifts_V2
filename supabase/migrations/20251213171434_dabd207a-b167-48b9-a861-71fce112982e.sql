-- Create table for quiz scores
CREATE TABLE public.quiz_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_type TEXT NOT NULL DEFAULT 'magic_cards',
  score INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  streak_bonus INTEGER NOT NULL DEFAULT 0,
  time_bonus INTEGER NOT NULL DEFAULT 0,
  played_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_scores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own scores"
ON public.quiz_scores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view scores"
ON public.quiz_scores
FOR SELECT
USING (true);

-- Create index for daily ranking queries
CREATE INDEX idx_quiz_scores_played_at ON public.quiz_scores(played_at DESC);
CREATE INDEX idx_quiz_scores_user_date ON public.quiz_scores(user_id, played_at);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_scores;