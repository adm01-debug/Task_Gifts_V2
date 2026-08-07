CREATE TABLE public.wager_integrity_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user_id UUID NOT NULL,
  anomaly_code TEXT NOT NULL CHECK (anomaly_code IN ('accuracy_outlier','perfect_streak','net_drain','volume_spike','stale_activity')),
  window_days INTEGER NOT NULL CHECK (window_days IN (7, 30, 90)),
  status TEXT NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating','confirmed','false_positive')),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  metric NUMERIC NOT NULL DEFAULT 0,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT wager_integrity_reviews_unique UNIQUE (target_user_id, anomaly_code, window_days)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wager_integrity_reviews TO authenticated;
GRANT ALL ON public.wager_integrity_reviews TO service_role;

ALTER TABLE public.wager_integrity_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers and admins can read integrity reviews"
ON public.wager_integrity_reviews FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can insert integrity reviews"
ON public.wager_integrity_reviews FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND reviewed_by = auth.uid());

CREATE POLICY "Admins can update integrity reviews"
ON public.wager_integrity_reviews FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete integrity reviews"
ON public.wager_integrity_reviews FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_wager_integrity_reviews_lookup
  ON public.wager_integrity_reviews (window_days, status, updated_at DESC);

CREATE TRIGGER update_wager_integrity_reviews_updated_at
BEFORE UPDATE ON public.wager_integrity_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();