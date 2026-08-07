CREATE TABLE public.lucky_wheel_prize_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prize_id uuid,
  operation text NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  before_data jsonb,
  after_data jsonb
);

COMMENT ON TABLE public.lucky_wheel_prize_audit IS 'Trilha imutavel de calibracao da Roleta da Sorte. Escrita apenas por trigger SECURITY DEFINER.';

CREATE INDEX lucky_wheel_prize_audit_changed_at_idx ON public.lucky_wheel_prize_audit (changed_at DESC);
CREATE INDEX lucky_wheel_prize_audit_prize_idx ON public.lucky_wheel_prize_audit (prize_id, changed_at DESC);

GRANT SELECT ON public.lucky_wheel_prize_audit TO authenticated;
GRANT ALL ON public.lucky_wheel_prize_audit TO service_role;

ALTER TABLE public.lucky_wheel_prize_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read wheel prize audit"
  ON public.lucky_wheel_prize_audit
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Sem policies de INSERT/UPDATE/DELETE: a trilha e append-only e escrita
-- exclusivamente pela trigger SECURITY DEFINER abaixo.

CREATE OR REPLACE FUNCTION public.log_lucky_wheel_prize_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before jsonb := NULL;
  v_after  jsonb := NULL;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    v_before := to_jsonb(OLD);
  END IF;
  IF TG_OP <> 'DELETE' THEN
    v_after := to_jsonb(NEW);
  END IF;

  -- UPDATE que nao mexeu em nenhum campo relevante nao polui a trilha.
  IF TG_OP = 'UPDATE'
     AND (v_before - 'updated_at') IS NOT DISTINCT FROM (v_after - 'updated_at') THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.lucky_wheel_prize_audit (prize_id, operation, changed_by, before_data, after_data)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    v_before,
    v_after
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.log_lucky_wheel_prize_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER lucky_wheel_prizes_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.lucky_wheel_prizes
  FOR EACH ROW EXECUTE FUNCTION public.log_lucky_wheel_prize_change();