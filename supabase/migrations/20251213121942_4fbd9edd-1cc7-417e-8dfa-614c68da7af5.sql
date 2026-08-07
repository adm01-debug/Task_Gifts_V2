-- Create combo tracking table
CREATE TABLE public.user_combos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  combo_date date NOT NULL DEFAULT CURRENT_DATE,
  actions_count integer NOT NULL DEFAULT 0,
  current_multiplier numeric(3,1) NOT NULL DEFAULT 1.0,
  max_multiplier_reached numeric(3,1) NOT NULL DEFAULT 1.0,
  total_bonus_xp integer NOT NULL DEFAULT 0,
  last_action_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, combo_date)
);

-- Enable RLS
ALTER TABLE public.user_combos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own combos"
  ON public.user_combos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own combos"
  ON public.user_combos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own combos"
  ON public.user_combos FOR UPDATE
  USING (auth.uid() = user_id);

-- Managers can view team combos
CREATE POLICY "Managers can view team combos"
  ON public.user_combos FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Add trigger for updated_at
CREATE TRIGGER update_user_combos_updated_at
  BEFORE UPDATE ON public.user_combos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_user_combos_user_date ON public.user_combos(user_id, combo_date DESC);