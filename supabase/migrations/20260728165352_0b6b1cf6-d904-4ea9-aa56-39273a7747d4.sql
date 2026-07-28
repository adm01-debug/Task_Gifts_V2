CREATE TABLE public.wager_budget_settings (
  id boolean NOT NULL DEFAULT true PRIMARY KEY CHECK (id),
  monthly_coin_budget integer NOT NULL DEFAULT 20000 CHECK (monthly_coin_budget >= 0 AND monthly_coin_budget <= 10000000),
  expected_players integer NOT NULL DEFAULT 30 CHECK (expected_players >= 0 AND expected_players <= 100000),
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.wager_budget_settings TO authenticated;
GRANT ALL ON public.wager_budget_settings TO service_role;

ALTER TABLE public.wager_budget_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers read wager budget"
  ON public.wager_budget_settings FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins insert wager budget"
  ON public.wager_budget_settings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update wager budget"
  ON public.wager_budget_settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_wager_budget_settings_updated
  BEFORE UPDATE ON public.wager_budget_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.wager_budget_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;