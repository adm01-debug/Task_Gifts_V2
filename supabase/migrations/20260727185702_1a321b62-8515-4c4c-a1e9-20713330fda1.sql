CREATE OR REPLACE FUNCTION public.revert_campaign_team_split(
  _batch_id UUID,
  _reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _batch RECORD;
  _entry RECORD;
  _members INT := 0;
  _teams INT := 0;
  _xp_total INT := 0;
  _coins_total INT := 0;
  _actor UUID := auth.uid();
  _xp INT;
  _coins INT;
BEGIN
  PERFORM public._require_manager_or_admin();

  SELECT * INTO _batch
  FROM public.campaign_team_split_batches
  WHERE id = _batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('reverted', false, 'reason', 'batch_not_found');
  END IF;

  IF _batch.reverted_at IS NOT NULL OR _batch.status = 'reverted' THEN
    RETURN jsonb_build_object('reverted', false, 'reason', 'already_reverted');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.campaign_team_split_entries
    WHERE batch_id = _batch_id AND outcome = 'paid' AND user_id IS NOT NULL
  ) THEN
    RETURN jsonb_build_object('reverted', false, 'reason', 'nothing_to_revert');
  END IF;

  FOR _entry IN
    SELECT user_id,
           GREATEST(0, xp_allocated) AS xp_allocated,
           GREATEST(0, coins_allocated) AS coins_allocated
    FROM public.campaign_team_split_entries
    WHERE batch_id = _batch_id AND outcome = 'paid' AND user_id IS NOT NULL
    ORDER BY created_at
  LOOP
    _xp := _entry.xp_allocated;
    _coins := _entry.coins_allocated;

    IF _xp = 0 AND _coins = 0 THEN
      CONTINUE;
    END IF;

    UPDATE public.profiles
    SET xp = GREATEST(0, COALESCE(xp, 0) - _xp),
        coins = GREATEST(0, COALESCE(coins, 0) - _coins)
    WHERE id = _entry.user_id;

    UPDATE public.campaign_participants
    SET xp_earned = GREATEST(0, COALESCE(xp_earned, 0) - _xp),
        coins_earned = GREATEST(0, COALESCE(coins_earned, 0) - _coins)
    WHERE campaign_id = _batch.campaign_id AND user_id = _entry.user_id;

    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      _entry.user_id,
      'campaign_team_award_reverted',
      'Rateio coletivo revertido',
      'O prêmio coletivo de ' || _xp || ' XP e ' || _coins || ' moedas foi estornado por revisão da campanha.',
      jsonb_build_object(
        'campaign_id', _batch.campaign_id,
        'batch_id', _batch_id,
        'xp', _xp,
        'coins', _coins,
        'reason', _reason
      )
    );

    _members := _members + 1;
    _xp_total := _xp_total + _xp;
    _coins_total := _coins_total + _coins;
  END LOOP;

  WITH reset AS (
    UPDATE public.campaign_teams t
    SET awarded_at = NULL,
        xp_awarded = 0,
        coins_awarded = 0
    WHERE t.awarded_at IS NOT NULL
      AND t.id IN (
        SELECT DISTINCT team_id
        FROM public.campaign_team_split_entries
        WHERE batch_id = _batch_id AND team_id IS NOT NULL AND outcome = 'paid'
      )
    RETURNING 1
  )
  SELECT COUNT(*) INTO _teams FROM reset;

  UPDATE public.campaign_team_split_batches
  SET status = 'reverted',
      reverted_at = now(),
      reverted_by = _actor,
      reason = COALESCE(NULLIF(TRIM(COALESCE(_reason, '')), ''), reason)
  WHERE id = _batch_id;

  RETURN jsonb_build_object(
    'reverted', true,
    'members_reverted', _members,
    'teams_reset', _teams,
    'xp_reverted', _xp_total,
    'coins_reverted', _coins_total,
    'batch_id', _batch_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.revert_campaign_team_split(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revert_campaign_team_split(UUID, TEXT) TO authenticated;