-- =====================================================================
-- Trilha de auditoria do rateio coletivo (award_campaign_team_split)
-- Objetivo: rastreabilidade completa por lote e por colaborador, com
-- motivo determinístico de cada não-pagamento, viabilizando reversão
-- e prestação de contas (compliance).
-- =====================================================================

CREATE TABLE public.campaign_team_split_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.sales_campaigns(id) ON DELETE CASCADE,
  executed_by UUID,
  share_mode TEXT NOT NULL DEFAULT 'proportional',
  pool_xp NUMERIC NOT NULL DEFAULT 0,
  pool_coins NUMERIC NOT NULL DEFAULT 0,
  teams_awarded INT NOT NULL DEFAULT 0,
  members_awarded INT NOT NULL DEFAULT 0,
  members_skipped INT NOT NULL DEFAULT 0,
  total_xp_paid INT NOT NULL DEFAULT 0,
  total_coins_paid INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  reason TEXT,
  reverted_at TIMESTAMPTZ,
  reverted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_split_batches_campaign
  ON public.campaign_team_split_batches (campaign_id, created_at DESC);

GRANT SELECT ON public.campaign_team_split_batches TO authenticated;
GRANT ALL ON public.campaign_team_split_batches TO service_role;

ALTER TABLE public.campaign_team_split_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_split_batches_select_staff"
ON public.campaign_team_split_batches
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'manager'::app_role)
);

CREATE TABLE public.campaign_team_split_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.campaign_team_split_batches(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL,
  team_id UUID,
  team_name TEXT,
  user_id UUID,
  -- Identificador legível preservado no momento do rateio: o perfil pode
  -- mudar de nome depois, mas a trilha precisa refletir o estado da época.
  user_identifier TEXT,
  member_progress NUMERIC NOT NULL DEFAULT 0,
  team_progress NUMERIC NOT NULL DEFAULT 0,
  team_target NUMERIC NOT NULL DEFAULT 0,
  share_percent NUMERIC NOT NULL DEFAULT 0,
  xp_allocated INT NOT NULL DEFAULT 0,
  coins_allocated INT NOT NULL DEFAULT 0,
  outcome TEXT NOT NULL DEFAULT 'paid',
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_split_entries_batch ON public.campaign_team_split_entries (batch_id);
CREATE INDEX idx_team_split_entries_user ON public.campaign_team_split_entries (user_id, created_at DESC);
CREATE INDEX idx_team_split_entries_campaign ON public.campaign_team_split_entries (campaign_id, created_at DESC);

GRANT SELECT ON public.campaign_team_split_entries TO authenticated;
GRANT ALL ON public.campaign_team_split_entries TO service_role;

ALTER TABLE public.campaign_team_split_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_split_entries_select_staff"
ON public.campaign_team_split_entries
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'manager'::app_role)
);

-- =====================================================================
-- Rateio instrumentado: cada avaliação de colaborador gera uma linha,
-- paga ou não, com o motivo exato do não-pagamento.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.award_campaign_team_split(_campaign_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _rule JSONB;
  _mode TEXT;
  _pool_xp NUMERIC;
  _pool_coins NUMERIC;
  _team RECORD;
  _member RECORD;
  _teams_awarded INT := 0;
  _members_awarded INT := 0;
  _members_skipped INT := 0;
  _total_xp INT := 0;
  _total_coins INT := 0;
  _share NUMERIC;
  _xp INT;
  _coins INT;
  _batch_id UUID;
  _actor UUID := auth.uid();
  _eligible_teams INT := 0;
  _reason TEXT;
  _outcome TEXT;
  _failure TEXT;
  _profile_exists BOOLEAN;
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

  INSERT INTO public.campaign_team_split_batches (
    campaign_id, executed_by, share_mode, pool_xp, pool_coins, status
  ) VALUES (
    _campaign_id, _actor, _mode, _pool_xp, _pool_coins, 'running'
  ) RETURNING id INTO _batch_id;

  IF _pool_xp <= 0 AND _pool_coins <= 0 THEN
    UPDATE public.campaign_team_split_batches
    SET status = 'skipped', reason = 'empty_pool'
    WHERE id = _batch_id;

    RETURN jsonb_build_object(
      'teams_awarded', 0, 'members_awarded', 0,
      'reason', 'empty_pool', 'batch_id', _batch_id
    );
  END IF;

  FOR _team IN
    SELECT * FROM public.campaign_teams
    WHERE campaign_id = _campaign_id
      AND awarded_at IS NULL
      AND target_team > 0
      AND progress >= target_team
    ORDER BY created_at
  LOOP
    _eligible_teams := _eligible_teams + 1;

    -- Equipe elegível sem membros alocados: registra o motivo para que o
    -- gestor perceba a lacuna de alocação antes de fechar a campanha.
    IF NOT EXISTS (SELECT 1 FROM public.campaign_team_members WHERE team_id = _team.id) THEN
      INSERT INTO public.campaign_team_split_entries (
        batch_id, campaign_id, team_id, team_name, user_id, user_identifier,
        member_progress, team_progress, team_target, share_percent,
        xp_allocated, coins_allocated, outcome, failure_reason
      ) VALUES (
        _batch_id, _campaign_id, _team.id, _team.name, NULL, NULL,
        0, _team.progress, _team.target_team, 0,
        0, 0, 'skipped', 'team_without_members'
      );
    END IF;

    FOR _member IN
      SELECT
        m.user_id,
        COALESCE(cp.progress, 0) AS progress,
        COALESCE(p.display_name, p.email, m.user_id::text) AS identifier,
        (p.id IS NOT NULL) AS has_profile
      FROM public.campaign_team_members m
      LEFT JOIN public.campaign_participants cp
        ON cp.campaign_id = _campaign_id AND cp.user_id = m.user_id
      LEFT JOIN public.profiles p ON p.id = m.user_id
      WHERE m.team_id = _team.id
      ORDER BY m.created_at
    LOOP
      IF _mode = 'equal' OR _team.progress <= 0 THEN
        _share := CASE WHEN _team.members_count > 0 THEN 1.0 / _team.members_count ELSE 0 END;
      ELSE
        _share := _member.progress / _team.progress;
      END IF;

      _xp := GREATEST(0, ROUND(_pool_xp * _share))::INT;
      _coins := GREATEST(0, ROUND(_pool_coins * _share))::INT;
      _profile_exists := COALESCE(_member.has_profile, false);
      _outcome := 'paid';
      _failure := NULL;

      IF NOT _profile_exists THEN
        _outcome := 'skipped';
        _failure := 'profile_not_found';
      ELSIF _xp = 0 AND _coins = 0 THEN
        _outcome := 'skipped';
        _failure := CASE
          WHEN _share = 0 AND _mode <> 'equal' AND _team.progress > 0 THEN 'zero_contribution'
          WHEN _team.members_count = 0 THEN 'members_count_zero'
          ELSE 'rounded_to_zero'
        END;
      END IF;

      IF _outcome = 'paid' THEN
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
          jsonb_build_object(
            'campaign_id', _campaign_id, 'team_id', _team.id,
            'xp', _xp, 'coins', _coins, 'batch_id', _batch_id
          )
        );

        _members_awarded := _members_awarded + 1;
        _total_xp := _total_xp + _xp;
        _total_coins := _total_coins + _coins;
      ELSE
        _members_skipped := _members_skipped + 1;
      END IF;

      INSERT INTO public.campaign_team_split_entries (
        batch_id, campaign_id, team_id, team_name, user_id, user_identifier,
        member_progress, team_progress, team_target, share_percent,
        xp_allocated, coins_allocated, outcome, failure_reason
      ) VALUES (
        _batch_id, _campaign_id, _team.id, _team.name, _member.user_id, _member.identifier,
        _member.progress, _team.progress, _team.target_team, ROUND(_share * 100, 4),
        CASE WHEN _outcome = 'paid' THEN _xp ELSE 0 END,
        CASE WHEN _outcome = 'paid' THEN _coins ELSE 0 END,
        _outcome, _failure
      );
    END LOOP;

    UPDATE public.campaign_teams
    SET awarded_at = now(),
        xp_awarded = ROUND(_pool_xp)::INT,
        coins_awarded = ROUND(_pool_coins)::INT
    WHERE id = _team.id;

    _teams_awarded := _teams_awarded + 1;
  END LOOP;

  _reason := CASE
    WHEN _eligible_teams = 0 THEN 'no_eligible_teams'
    WHEN _members_awarded = 0 THEN 'no_members_paid'
    ELSE NULL
  END;

  UPDATE public.campaign_team_split_batches
  SET status = CASE WHEN _teams_awarded > 0 THEN 'completed' ELSE 'skipped' END,
      teams_awarded = _teams_awarded,
      members_awarded = _members_awarded,
      members_skipped = _members_skipped,
      total_xp_paid = _total_xp,
      total_coins_paid = _total_coins,
      reason = _reason
  WHERE id = _batch_id;

  RETURN jsonb_build_object(
    'teams_awarded', _teams_awarded,
    'members_awarded', _members_awarded,
    'members_skipped', _members_skipped,
    'total_xp_paid', _total_xp,
    'total_coins_paid', _total_coins,
    'reason', _reason,
    'batch_id', _batch_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.award_campaign_team_split(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_campaign_team_split(uuid) TO authenticated, service_role;