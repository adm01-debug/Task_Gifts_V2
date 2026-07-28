CREATE TABLE public.wager_integrity_review_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.wager_integrity_reviews(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL,
  anomaly_code TEXT NOT NULL,
  window_days INTEGER NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  metric NUMERIC NOT NULL DEFAULT 0,
  changed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_wager_review_events_lookup
  ON public.wager_integrity_review_events (window_days, target_user_id, anomaly_code, created_at DESC);

GRANT SELECT ON public.wager_integrity_review_events TO authenticated;
GRANT ALL ON public.wager_integrity_review_events TO service_role;

ALTER TABLE public.wager_integrity_review_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestores e admins leem historico de apuracoes"
  ON public.wager_integrity_review_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE OR REPLACE FUNCTION public.log_wager_integrity_review_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.notes IS NOT DISTINCT FROM OLD.notes THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.wager_integrity_review_events (
    review_id, target_user_id, anomaly_code, window_days,
    previous_status, new_status, notes, metric, changed_by
  ) VALUES (
    NEW.id, NEW.target_user_id, NEW.anomaly_code, NEW.window_days,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
    NEW.status, NEW.notes, COALESCE(NEW.metric, 0), NEW.reviewed_by
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_wager_integrity_review_event
AFTER INSERT OR UPDATE ON public.wager_integrity_reviews
FOR EACH ROW EXECUTE FUNCTION public.log_wager_integrity_review_event();