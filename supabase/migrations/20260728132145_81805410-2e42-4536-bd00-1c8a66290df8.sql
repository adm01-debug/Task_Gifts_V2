CREATE INDEX IF NOT EXISTS idx_boss_battle_damage_battle_user
  ON public.boss_battle_damage (battle_id, user_id);

CREATE OR REPLACE FUNCTION public.get_boss_battle_leaderboard(
  _battle_id uuid,
  _limit integer DEFAULT 20
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  total_damage bigint,
  hits bigint,
  share numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_total  bigint;
  v_limit  integer := LEAST(GREATEST(COALESCE(_limit, 20), 1), 100);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT b.status INTO v_status FROM public.boss_battles b WHERE b.id = _battle_id;
  IF v_status IS NULL THEN
    RETURN;
  END IF;

  -- Rascunhos permanecem restritos a gestores/admins.
  IF v_status = 'draft'
     AND NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(d.damage), 0) INTO v_total
  FROM public.boss_battle_damage d
  WHERE d.battle_id = _battle_id;

  RETURN QUERY
  SELECT
    d.user_id,
    COALESCE(p.display_name, 'Participante') AS display_name,
    p.avatar_url,
    SUM(d.damage)::bigint AS total_damage,
    COUNT(*)::bigint AS hits,
    CASE WHEN v_total > 0
      THEN ROUND(SUM(d.damage)::numeric / v_total, 6)
      ELSE 0::numeric
    END AS share
  FROM public.boss_battle_damage d
  LEFT JOIN public.profiles_public p ON p.id = d.user_id
  WHERE d.battle_id = _battle_id
  GROUP BY d.user_id, p.display_name, p.avatar_url
  HAVING SUM(d.damage) > 0
  ORDER BY total_damage DESC, d.user_id ASC
  LIMIT v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_boss_battle_leaderboard(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_boss_battle_leaderboard(uuid, integer) TO authenticated;