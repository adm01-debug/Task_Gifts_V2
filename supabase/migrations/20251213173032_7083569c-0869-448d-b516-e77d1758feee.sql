-- Create table to track individual question answers for statistics
CREATE TABLE public.quiz_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.quiz_options(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_quiz_answers_question ON public.quiz_answers(question_id);
CREATE INDEX idx_quiz_answers_user ON public.quiz_answers(user_id);
CREATE INDEX idx_quiz_answers_created ON public.quiz_answers(created_at DESC);

-- Enable RLS
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- Everyone can view aggregated statistics
CREATE POLICY "Everyone can view answer statistics"
ON public.quiz_answers
FOR SELECT
USING (true);

-- Users can insert their own answers
CREATE POLICY "Users can insert own answers"
ON public.quiz_answers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to get category statistics
CREATE OR REPLACE FUNCTION public.get_quiz_category_stats()
RETURNS TABLE (
  category TEXT,
  total_answers BIGINT,
  correct_answers BIGINT,
  accuracy_rate NUMERIC,
  avg_time_ms NUMERIC,
  question_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(qq.category, 'Sem categoria') as category,
    COUNT(qa.id) as total_answers,
    COUNT(qa.id) FILTER (WHERE qa.is_correct = true) as correct_answers,
    ROUND(
      (COUNT(qa.id) FILTER (WHERE qa.is_correct = true)::NUMERIC / NULLIF(COUNT(qa.id), 0)) * 100, 
      1
    ) as accuracy_rate,
    ROUND(AVG(qa.time_spent_ms), 0) as avg_time_ms,
    COUNT(DISTINCT qq.id) as question_count
  FROM quiz_questions qq
  LEFT JOIN quiz_answers qa ON qa.question_id = qq.id
  WHERE qq.is_active = true
  GROUP BY qq.category
  ORDER BY total_answers DESC;
END;
$$;