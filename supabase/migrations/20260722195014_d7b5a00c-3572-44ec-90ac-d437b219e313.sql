
CREATE TABLE public.ai_course_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','succeeded','failed')),
  source_file_path TEXT NOT NULL,
  source_file_name TEXT NOT NULL,
  source_file_size BIGINT,
  prompt_hint TEXT,
  generated_trail_id UUID REFERENCES public.learning_trails(id) ON DELETE SET NULL,
  modules_created INTEGER NOT NULL DEFAULT 0,
  questions_created INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.ai_course_jobs TO authenticated;
GRANT ALL ON public.ai_course_jobs TO service_role;

ALTER TABLE public.ai_course_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ai course jobs"
  ON public.ai_course_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own ai course jobs"
  ON public.ai_course_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own ai course jobs"
  ON public.ai_course_jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ai_course_jobs_user ON public.ai_course_jobs(user_id, created_at DESC);
CREATE INDEX idx_ai_course_jobs_status ON public.ai_course_jobs(status) WHERE status IN ('pending','processing');

CREATE TRIGGER trg_ai_course_jobs_updated_at
  BEFORE UPDATE ON public.ai_course_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
