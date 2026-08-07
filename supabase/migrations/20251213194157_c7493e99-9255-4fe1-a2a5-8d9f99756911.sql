-- Create table for AI Coach chat history
CREATE TABLE public.ai_coach_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster user queries
CREATE INDEX idx_ai_coach_messages_user_id ON public.ai_coach_messages(user_id);
CREATE INDEX idx_ai_coach_messages_created_at ON public.ai_coach_messages(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_coach_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own messages
CREATE POLICY "Users can view their own messages"
ON public.ai_coach_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can insert their own messages"
ON public.ai_coach_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.ai_coach_messages
FOR DELETE
USING (auth.uid() = user_id);