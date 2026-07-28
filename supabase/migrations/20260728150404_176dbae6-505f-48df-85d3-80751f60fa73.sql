CREATE TABLE public.boss_win_rate_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  target_pct NUMERIC(5,2) NOT NULL DEFAULT 60 CHECK (target_pct >= 0 AND target_pct <= 100),
  tolerance_pp NUMERIC(5,2) NOT NULL DEFAULT 5 CHECK (tolerance_pp >= 0 AND tolerance_pp <= 100),
  window_days INTEGER NOT NULL DEFAULT 90 CHECK (window_days >= 1 AND window_days <= 3650),
  notes TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX boss_win_rate_goals_department_key
  ON public.boss_win_rate_goals (department_id)
  WHERE department_id IS NOT NULL;

CREATE UNIQUE INDEX boss_win_rate_goals_global_key
  ON public.boss_win_rate_goals ((department_id IS NULL))
  WHERE department_id IS NULL;

GRANT SELECT ON public.boss_win_rate_goals TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.boss_win_rate_goals TO authenticated;
GRANT ALL ON public.boss_win_rate_goals TO service_role;

ALTER TABLE public.boss_win_rate_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read boss win rate goals"
  ON public.boss_win_rate_goals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can insert boss win rate goals"
  ON public.boss_win_rate_goals FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Managers and admins can update boss win rate goals"
  ON public.boss_win_rate_goals FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Managers and admins can delete boss win rate goals"
  ON public.boss_win_rate_goals FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );

CREATE TRIGGER update_boss_win_rate_goals_updated_at
  BEFORE UPDATE ON public.boss_win_rate_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();