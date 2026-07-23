
-- =====================================================
-- SPRINT 3: SALES CAMPAIGNS (Applause-style)
-- =====================================================

-- 1) sales_campaigns
CREATE TABLE public.sales_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  product_name TEXT,
  metric_key TEXT NOT NULL DEFAULT 'sales_amount',
  metric_unit TEXT NOT NULL DEFAULT 'BRL',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_global NUMERIC(14,2) NOT NULL DEFAULT 0,
  target_individual_default NUMERIC(14,2) NOT NULL DEFAULT 0,
  progress_global NUMERIC(14,2) NOT NULL DEFAULT 0,
  split_rule JSONB NOT NULL DEFAULT '{"type":"proportional","xp_per_unit":1,"coin_per_unit":0.1,"global_bonus_xp":500,"global_bonus_coins":100}'::jsonb,
  xp_reward INT NOT NULL DEFAULT 0,
  coin_reward INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed','cancelled')),
  cover_image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sales_campaigns_period_valid CHECK (end_date >= start_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_campaigns TO authenticated;
GRANT ALL ON public.sales_campaigns TO service_role;

ALTER TABLE public.sales_campaigns ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_sales_campaigns_org_status ON public.sales_campaigns(org_id, status);
CREATE INDEX idx_sales_campaigns_period ON public.sales_campaigns(start_date, end_date);
CREATE INDEX idx_sales_campaigns_metric_key ON public.sales_campaigns(metric_key) WHERE status = 'active';

CREATE POLICY "campaigns_select_authenticated"
  ON public.sales_campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "campaigns_insert_admin_manager"
  ON public.sales_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "campaigns_update_admin_manager"
  ON public.sales_campaigns FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "campaigns_delete_admin"
  ON public.sales_campaigns FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) campaign_participants
CREATE TABLE public.campaign_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.sales_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_adjusted NUMERIC(14,2) NOT NULL DEFAULT 0,
  progress NUMERIC(14,2) NOT NULL DEFAULT 0,
  progress_percent NUMERIC(6,2) NOT NULL DEFAULT 0,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  xp_earned INT NOT NULL DEFAULT 0,
  coins_earned INT NOT NULL DEFAULT 0,
  rank_position INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaign_participants_unique UNIQUE (campaign_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_participants TO authenticated;
GRANT ALL ON public.campaign_participants TO service_role;

ALTER TABLE public.campaign_participants ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_campaign_participants_campaign ON public.campaign_participants(campaign_id, rank_position);
CREATE INDEX idx_campaign_participants_user ON public.campaign_participants(user_id);

CREATE POLICY "participants_select_authenticated"
  ON public.campaign_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "participants_insert_self_or_admin"
  ON public.campaign_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "participants_update_self_or_admin"
  ON public.campaign_participants FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "participants_delete_admin"
  ON public.campaign_participants FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) campaign_progress_events (audit trail)
CREATE TABLE public.campaign_progress_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.sales_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta NUMERIC(14,2) NOT NULL,
  previous_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  new_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual',
  reference_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.campaign_progress_events TO authenticated;
GRANT ALL ON public.campaign_progress_events TO service_role;

ALTER TABLE public.campaign_progress_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_campaign_progress_events_campaign ON public.campaign_progress_events(campaign_id, created_at DESC);
CREATE INDEX idx_campaign_progress_events_user ON public.campaign_progress_events(user_id, created_at DESC);

CREATE POLICY "campaign_events_select_authenticated"
  ON public.campaign_progress_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "campaign_events_insert_self_or_admin"
  ON public.campaign_progress_events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

-- 4) updated_at triggers
CREATE TRIGGER trg_sales_campaigns_updated_at
  BEFORE UPDATE ON public.sales_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_campaign_participants_updated_at
  BEFORE UPDATE ON public.campaign_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Function: recalculate participant progress % and campaign global aggregate
CREATE OR REPLACE FUNCTION public.recalc_campaign_progress(_campaign_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total NUMERIC(14,2);
BEGIN
  UPDATE public.campaign_participants cp
  SET progress_percent = CASE
      WHEN target_adjusted > 0 THEN LEAST(100, ROUND((progress / target_adjusted) * 100, 2))
      ELSE 0
    END,
    completed_at = CASE
      WHEN progress >= target_adjusted AND target_adjusted > 0 AND completed_at IS NULL THEN now()
      ELSE completed_at
    END
  WHERE cp.campaign_id = _campaign_id;

  SELECT COALESCE(SUM(progress), 0) INTO _total
  FROM public.campaign_participants
  WHERE campaign_id = _campaign_id;

  UPDATE public.sales_campaigns
  SET progress_global = _total
  WHERE id = _campaign_id;

  -- Ranking
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY progress DESC, updated_at ASC) AS pos
    FROM public.campaign_participants
    WHERE campaign_id = _campaign_id AND accepted_at IS NOT NULL
  )
  UPDATE public.campaign_participants cp
  SET rank_position = r.pos
  FROM ranked r
  WHERE cp.id = r.id;
END;
$$;

REVOKE ALL ON FUNCTION public.recalc_campaign_progress(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalc_campaign_progress(UUID) TO authenticated, service_role;
