CREATE INDEX IF NOT EXISTS idx_memory_sessions_leaderboard
  ON public.memory_sessions (deck_id, session_date, status);

CREATE OR REPLACE FUNCTION public.get_memory_leaderboard(
  p_deck_id uuid DEFAULT NULL,
  p_days integer DEFAULT 7,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  deck_id uuid,
  matched_pairs integer,
  pairs_total integer,
  moves integer,
  duration_ms integer,
  coins_awarded integer,
  played_at timestamptz,
  rank integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT (now() AT TIME ZONE 'utc')::date
           - (LEAST(GREATEST(COALESCE(p_days, 7), 1), 90) - 1) AS since
  ),
  best AS (
    SELECT DISTINCT ON (s.user_id)
      s.user_id,
      s.deck_id,
      s.matched_pairs,
      s.pairs_total,
      s.moves,
      s.duration_ms,
      s.coins_awarded,
      s.created_at
    FROM public.memory_sessions s, bounds b
    WHERE s.status = 'finished'
      AND s.session_date >= b.since
      AND s.pairs_total > 0
      AND (p_deck_id IS NULL OR s.deck_id = p_deck_id)
    ORDER BY s.user_id,
             s.matched_pairs DESC,
             s.moves ASC,
             s.duration_ms ASC,
             s.created_at ASC
  )
  SELECT
    best.user_id,
    COALESCE(p.display_name, 'Jogador') AS display_name,
    p.avatar_url,
    best.deck_id,
    best.matched_pairs,
    best.pairs_total,
    best.moves,
    best.duration_ms,
    best.coins_awarded,
    best.created_at AS played_at,
    (ROW_NUMBER() OVER (
      ORDER BY best.matched_pairs DESC,
               best.moves ASC,
               best.duration_ms ASC,
               best.created_at ASC
    ))::integer AS rank
  FROM best
  LEFT JOIN public.profiles_public p ON p.id = best.user_id
  ORDER BY rank
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
$$;

REVOKE ALL ON FUNCTION public.get_memory_leaderboard(uuid, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_memory_leaderboard(uuid, integer, integer) TO authenticated;