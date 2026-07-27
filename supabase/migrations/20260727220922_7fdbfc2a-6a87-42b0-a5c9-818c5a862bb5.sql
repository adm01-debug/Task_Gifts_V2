CREATE TABLE public.lucky_wheel_whatif_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_window_start date NOT NULL,
  current_window_end date NOT NULL,
  previous_window_start date NOT NULL,
  previous_window_end date NOT NULL,
  active_budget numeric NOT NULL DEFAULT 0,
  current_coins_per_spin numeric NOT NULL DEFAULT 0,
  baseline_alert_count integer NOT NULL DEFAULT 0,
  break_even_budget numeric,
  scenarios jsonb NOT NULL DEFAULT '[]'::jsonb,
  signature text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lucky_wheel_whatif_signature_key UNIQUE (signature),
  CONSTRAINT lucky_wheel_whatif_scenarios_is_array CHECK (jsonb_typeof(scenarios) = 'array'),
  CONSTRAINT lucky_wheel_whatif_current_window_order CHECK (current_window_end >= current_window_start),
  CONSTRAINT lucky_wheel_whatif_previous_window_order CHECK (previous_window_end >= previous_window_start)
);

GRANT SELECT, INSERT, UPDATE ON public.lucky_wheel_whatif_snapshots TO authenticated;
GRANT ALL ON public.lucky_wheel_whatif_snapshots TO service_role;

ALTER TABLE public.lucky_wheel_whatif_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins leem simulacoes what-if"
  ON public.lucky_wheel_whatif_snapshots
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins registram simulacoes what-if"
  ON public.lucky_wheel_whatif_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid());

CREATE POLICY "Admins atualizam simulacoes what-if"
  ON public.lucky_wheel_whatif_snapshots
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid());

CREATE INDEX idx_lucky_wheel_whatif_window
  ON public.lucky_wheel_whatif_snapshots (current_window_end DESC, created_at DESC);

CREATE TRIGGER trg_lucky_wheel_whatif_updated_at
  BEFORE UPDATE ON public.lucky_wheel_whatif_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();