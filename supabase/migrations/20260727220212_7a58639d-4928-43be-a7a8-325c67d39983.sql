CREATE TABLE IF NOT EXISTS public.lucky_wheel_settings_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  old_budget numeric,
  new_budget numeric NOT NULL,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lw_settings_audit_changed_at
  ON public.lucky_wheel_settings_audit (changed_at DESC);

GRANT SELECT ON public.lucky_wheel_settings_audit TO authenticated;
GRANT ALL ON public.lucky_wheel_settings_audit TO service_role;

ALTER TABLE public.lucky_wheel_settings_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read lucky wheel settings audit" ON public.lucky_wheel_settings_audit;
CREATE POLICY "Admins read lucky wheel settings audit"
ON public.lucky_wheel_settings_audit
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.log_lucky_wheel_budget_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.coins_per_spin_budget IS NOT DISTINCT FROM OLD.coins_per_spin_budget THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.lucky_wheel_settings_audit (old_budget, new_budget, changed_by)
  VALUES (
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.coins_per_spin_budget ELSE NULL END,
    NEW.coins_per_spin_budget,
    COALESCE(NEW.updated_by, auth.uid())
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lucky_wheel_budget_audit ON public.lucky_wheel_settings;
CREATE TRIGGER trg_lucky_wheel_budget_audit
AFTER INSERT OR UPDATE ON public.lucky_wheel_settings
FOR EACH ROW EXECUTE FUNCTION public.log_lucky_wheel_budget_change();

REVOKE ALL ON FUNCTION public.log_lucky_wheel_budget_change() FROM PUBLIC, anon, authenticated;