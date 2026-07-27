-- ============ Equipes de campanha (metas coletivas) ============
CREATE TABLE public.campaign_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.sales_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  target_team NUMERIC(14,2) NOT NULL DEFAULT 0,
  progress NUMERIC(14,2) NOT NULL DEFAULT 0,
  progress_percent NUMERIC(6,2) NOT NULL DEFAULT 0,
  rank_position INTEGER,
  members_count INTEGER NOT NULL DEFAULT 0,
  awarded_at TIMESTAMP WITH TIME ZONE,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  coins_awarded INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT campaign_teams_name_unique UNIQUE (campaign_id, name),
  CONSTRAINT campaign_teams_target_nonneg CHECK (target_team >= 0)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_teams TO authenticated;
GRANT ALL ON public.campaign_teams TO service_role;
ALTER TABLE public.campaign_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_teams_select_authenticated"
  ON public.campaign_teams FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "campaign_teams_manage_staff"
  ON public.campaign_teams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE INDEX idx_campaign_teams_campaign ON public.campaign_teams(campaign_id);
CREATE INDEX idx_campaign_teams_department ON public.campaign_teams(department_id);

CREATE TRIGGER trg_campaign_teams_updated_at
  BEFORE UPDATE ON public.campaign_teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ Membros das equipes ============
CREATE TABLE public.campaign_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.campaign_teams(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.sales_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT campaign_team_members_unique_per_campaign UNIQUE (campaign_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_team_members TO authenticated;
GRANT ALL ON public.campaign_team_members TO service_role;
ALTER TABLE public.campaign_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_team_members_select_authenticated"
  ON public.campaign_team_members FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "campaign_team_members_manage_staff"
  ON public.campaign_team_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE INDEX idx_campaign_team_members_team ON public.campaign_team_members(team_id);
CREATE INDEX idx_campaign_team_members_user ON public.campaign_team_members(campaign_id, user_id);

-- Garante que o time referenciado pertence à mesma campanha
CREATE OR REPLACE FUNCTION public.enforce_campaign_team_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _team_campaign UUID;
BEGIN
  SELECT campaign_id INTO _team_campaign FROM public.campaign_teams WHERE id = NEW.team_id;
  IF _team_campaign IS NULL THEN
    RAISE EXCEPTION 'team_not_found' USING ERRCODE = '23503';
  END IF;
  IF NEW.campaign_id IS NULL THEN
    NEW.campaign_id := _team_campaign;
  ELSIF NEW.campaign_id <> _team_campaign THEN
    RAISE EXCEPTION 'team_campaign_mismatch' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_campaign_team_members_consistency
  BEFORE INSERT OR UPDATE ON public.campaign_team_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_campaign_team_consistency();

-- ============ Recalculo de progresso coletivo ============
CREATE OR REPLACE FUNCTION public.recalc_campaign_teams(_campaign_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH agg AS (
    SELECT t.id AS team_id,
           COALESCE(SUM(cp.progress), 0)::NUMERIC(14,2) AS total,
           COUNT(m.user_id)::INT AS members
    FROM public.campaign_teams t
    LEFT JOIN public.campaign_team_members m ON m.team_id = t.id
    LEFT JOIN public.campaign_participants cp
           ON cp.campaign_id = t.campaign_id AND cp.user_id = m.user_id
    WHERE t.campaign_id = _campaign_id
    GROUP BY t.id
  )
  UPDATE public.campaign_teams t
  SET progress = a.total,
      members_count = a.members,
      progress_percent = CASE
        WHEN t.target_team > 0 THEN LEAST(100, ROUND((a.total / t.target_team) * 100, 2))
        ELSE 0
      END
  FROM agg a
  WHERE t.id = a.team_id;

  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY progress DESC, created_at ASC) AS pos
    FROM public.campaign_teams
    WHERE campaign_id = _campaign_id
  )
  UPDATE public.campaign_teams t
  SET rank_position = r.pos
  FROM ranked r
  WHERE t.id = r.id;
END;
$$;

REVOKE ALL ON FUNCTION public.recalc_campaign_teams(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recalc_campaign_teams(UUID) TO authenticated, service_role;

-- Encadeia o recálculo coletivo ao recálculo individual
CREATE OR REPLACE FUNCTION public.recalc_campaign_progress(_campaign_id UUID)
RETURNS VOID
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

  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY progress DESC, updated_at ASC) AS pos
    FROM public.campaign_participants
    WHERE campaign_id = _campaign_id AND accepted_at IS NOT NULL
  )
  UPDATE public.campaign_participants cp
  SET rank_position = r.pos
  FROM ranked r
  WHERE cp.id = r.id;

  PERFORM public.recalc_campaign_teams(_campaign_id);
END;
$$;

-- ============ Rateio de prêmio coletivo (team_split) ============
CREATE OR REPLACE FUNCTION public.award_campaign_team_split(_campaign_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rule JSONB;
  _mode TEXT;
  _pool_xp NUMERIC;
  _pool_coins NUMERIC;
  _team RECORD;
  _member RECORD;
  _teams_awarded INT := 0;
  _members_awarded INT := 0;
  _share NUMERIC;
  _xp INT;
  _coins INT;
BEGIN
  PERFORM public._require_manager_or_admin();

  PERFORM public.recalc_campaign_teams(_campaign_id);

  SELECT COALESCE(split_rule, '{}'::jsonb) INTO _rule
  FROM public.sales_campaigns WHERE id = _campaign_id;

  IF _rule IS NULL THEN
    RAISE EXCEPTION 'campaign_not_found' USING ERRCODE = 'P0002';
  END IF;

  _pool_xp := COALESCE((_rule->>'team_pool_xp')::NUMERIC, 0);
  _pool_coins := COALESCE((_rule->>'team_pool_coins')::NUMERIC, 0);
  _mode := COALESCE(_rule->>'team_share', 'proportional');

  IF _pool_xp <= 0 AND _pool_coins <= 0 THEN
    RETURN jsonb_build_object('teams_awarded', 0, 'members_awarded', 0, 'reason', 'empty_pool');
  END IF;

  FOR _team IN
    SELECT * FROM public.campaign_teams
    WHERE campaign_id = _campaign_id
      AND awarded_at IS NULL
      AND target_team > 0
      AND progress >= target_team
  LOOP
    FOR _member IN
      SELECT m.user_id, COALESCE(cp.progress, 0) AS progress
      FROM public.campaign_team_members m
      LEFT JOIN public.campaign_participants cp
        ON cp.campaign_id = _campaign_id AND cp.user_id = m.user_id
      WHERE m.team_id = _team.id
    LOOP
      IF _mode = 'equal' OR _team.progress <= 0 THEN
        _share := CASE WHEN _team.members_count > 0 THEN 1.0 / _team.members_count ELSE 0 END;
      ELSE
        _share := _member.progress / _team.progress;
      END IF;

      _xp := GREATEST(0, ROUND(_pool_xp * _share))::INT;
      _coins := GREATEST(0, ROUND(_pool_coins * _share))::INT;

      IF _xp > 0 OR _coins > 0 THEN
        UPDATE public.profiles
        SET xp = COALESCE(xp, 0) + _xp,
            coins = COALESCE(coins, 0) + _coins
        WHERE id = _member.user_id;

        UPDATE public.campaign_participants
        SET xp_earned = COALESCE(xp_earned, 0) + _xp,
            coins_earned = COALESCE(coins_earned, 0) + _coins
        WHERE campaign_id = _campaign_id AND user_id = _member.user_id;

        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
          _member.user_id,
          'campaign_team_award',
          '🤝 Meta coletiva batida: ' || _team.name,
          'Sua parte do prêmio coletivo: +' || _xp || ' XP e +' || _coins || ' moedas.',
          jsonb_build_object('campaign_id', _campaign_id, 'team_id', _team.id, 'xp', _xp, 'coins', _coins)
        );

        _members_awarded := _members_awarded + 1;
      END IF;
    END LOOP;

    UPDATE public.campaign_teams
    SET awarded_at = now(),
        xp_awarded = ROUND(_pool_xp)::INT,
        coins_awarded = ROUND(_pool_coins)::INT
    WHERE id = _team.id;

    _teams_awarded := _teams_awarded + 1;
  END LOOP;

  RETURN jsonb_build_object('teams_awarded', _teams_awarded, 'members_awarded', _members_awarded);
END;
$$;

REVOKE ALL ON FUNCTION public.award_campaign_team_split(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_campaign_team_split(UUID) TO authenticated, service_role;