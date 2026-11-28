CREATE OR REPLACE FUNCTION public.get_card_set_rewards()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_out  JSONB;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000'; END IF;

  WITH sets AS (
    SELECT d.set_code,
           COUNT(*)::INTEGER AS total_cards,
           COUNT(*) FILTER (WHERE uc.quantity > 0)::INTEGER AS owned_cards,
           SUM(public._card_rarity_value(d.rarity))::INTEGER AS set_value
    FROM public.card_definitions d
    LEFT JOIN public.user_cards uc ON uc.card_id = d.id AND uc.user_id = v_user
    WHERE d.is_active GROUP BY d.set_code
  ),
  expanded AS (
    SELECT s.set_code, s.total_cards, s.owned_cards, s.set_value,
           c.milestone, c.amount AS coins, x.amount AS xp,
           CEIL((s.total_cards * c.milestone)::NUMERIC / 100)::INTEGER AS cards_required,
           (s.owned_cards * 100 >= c.milestone * s.total_cards) AS reached,
           (cl.id IS NOT NULL) AS claimed
    FROM sets s
    CROSS JOIN LATERAL public._card_set_milestone_split(s.set_value * 5) c
    JOIN LATERAL public._card_set_milestone_split(s.set_value * 3) x ON x.milestone = c.milestone
    LEFT JOIN public.card_set_claims cl ON cl.user_id = v_user AND cl.set_code = s.set_code AND cl.milestone = c.milestone
  )
  SELECT COALESCE(jsonb_agg(row_to_json(t)::JSONB ORDER BY t.set_code), '[]'::JSONB) INTO v_out
  FROM (
    SELECT e.set_code, MAX(e.total_cards) AS total_cards, MAX(e.owned_cards) AS owned_cards,
           MAX(e.set_value) AS set_value,
           jsonb_agg(jsonb_build_object(
             'milestone', e.milestone, 'coins', e.coins, 'xp', e.xp,
             'cards_required', e.cards_required, 'reached', e.reached, 'claimed', e.claimed,
             'claimable', (e.reached AND NOT e.claimed)) ORDER BY e.milestone) AS milestones
    FROM expanded e GROUP BY e.set_code
  ) t;

  RETURN v_out;
END;
$function$
