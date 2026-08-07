-- Create table for quiz questions
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_type TEXT NOT NULL DEFAULT 'magic_cards',
  question TEXT NOT NULL,
  explanation TEXT,
  points INTEGER NOT NULL DEFAULT 100,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for quiz question options
CREATE TABLE public.quiz_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;

-- RLS policies for quiz_questions
CREATE POLICY "Admins and managers can manage questions"
ON public.quiz_questions
FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Everyone can view active questions"
ON public.quiz_questions
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- RLS policies for quiz_options
CREATE POLICY "Admins and managers can manage options"
ON public.quiz_options
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM quiz_questions q 
    WHERE q.id = quiz_options.question_id 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  )
);

CREATE POLICY "Everyone can view options of active questions"
ON public.quiz_options
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quiz_questions q 
    WHERE q.id = quiz_options.question_id 
    AND (q.is_active = true OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  )
);

-- Create indexes
CREATE INDEX idx_quiz_questions_type ON public.quiz_questions(quiz_type);
CREATE INDEX idx_quiz_questions_department ON public.quiz_questions(department_id);
CREATE INDEX idx_quiz_options_question ON public.quiz_options(question_id);

-- Create trigger for updated_at
CREATE TRIGGER update_quiz_questions_updated_at
BEFORE UPDATE ON public.quiz_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();