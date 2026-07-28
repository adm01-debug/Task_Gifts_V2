CREATE INDEX IF NOT EXISTS idx_wager_entries_user_created ON public.wager_entries (user_id, created_at);

CREATE OR REPLACE FUNCTION public.get_wager_leaderboard(p_days integer DEFAULT 7, p_limit integer DEFAULT 20)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  entries integer,
  correct_count integer,
  accuracy numeric,
  staked_coins integer,
  net_coins integer,
  xp_awarded integer,
  current_streak integer,
  best_streak integer,
  last_played date,
  rank integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH bounds AS (
    SELECT (now() AT TIME ZONE 'utc')::date
           - (LEAST(GREATEST(COALESCE(p_days, 7), 1), 90) - 1) AS since
  ),
  ent AS (
    SELECT e.user_id,
           e.is_correct,
           e.coins_delta,
           e.stake_coins,
           e.xp_awarded,
           q.scheduled_date,
           e.created_at
    FROM public.wager_entries e
    JOIN public.wager_questions q ON q.id = e.question_id
    CROSS JOIN bounds b
    WHERE q.scheduled_date >= b.since
  ),
  ord AS (
    SELECT ent.*,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY scheduled_date, created_at) AS rn,
           ROW_NUMBER() OVER (PARTITION BY user_id, is_correct ORDER BY scheduled_date, created_at) AS rn2
    FROM ent
  ),
  runs AS (
    SELECT user_id,
           COUNT(*)::int AS len,
           MAX(scheduled_date) AS last_date,
           MAX(created_at) AS last_at
    FROM ord
    WHERE is_correct
    GROUP BY user_id, (rn - rn2)
  ),
  best AS (
    SELECT user_id, MAX(len)::int AS best_streak FROM runs GROUP BY user_id
  ),
  last_run AS (
    SELECT DISTINCT ON (user_id) user_id, len
    FROM runs
    ORDER BY user_id, last_date DESC, last_at DESC
  ),
  last_entry AS (
    SELECT DISTINCT ON (user_id) user_id, is_correct, scheduled_date
    FROM ent
    ORDER BY user_id, scheduled_date DESC, created_at DESC
  ),
  agg AS (
    SELECT user_id,
           COUNT(*)::int AS entries,
           COUNT(*) FILTER (WHERE is_correct)::int AS correct_count,
           COALESCE(SUM(stake_coins), 0)::int AS staked_coins,
           COALESCE(SUM(coins_delta), 0)::int AS net_coins,
           COALESCE(SUM(xp_awarded), 0)::int AS xp_awarded
    FROM ent
    GROUP BY user_id
  )
  SELECT
    a.user_id,
    COALESCE(p.display_name, 'Jogador') AS display_name,
    p.avatar_url,
    a.entries,
    a.correct_count,
    ROUND((a.correct_count::numeric / NULLIF(a.entries, 0)) * 100, 1) AS accuracy,
    a.staked_coins,
    a.net_coins,
    a.xp_awarded,
    CASE WHEN le.is_correct THEN COALESCE(lr.len, 0) ELSE 0 END AS current_streak,
    COALESCE(b.best_streak, 0) AS best_streak,
    le.scheduled_date AS last_played,
    (ROW_NUMBER() OVER (
      ORDER BY a.net_coins DESC,
               a.correct_count DESC,
               (a.correct_count::numeric / NULLIF(a.entries, 0)) DESC NULLS LAST,
               a.entries DESC,
               a.user_id
    ))::int AS rank
  FROM agg a
  LEFT JOIN public.profiles p ON p.id = a.user_id
  LEFT JOIN best b ON b.user_id = a.user_id
  LEFT JOIN last_run lr ON lr.user_id = a.user_id
  LEFT JOIN last_entry le ON le.user_id = a.user_id
  ORDER BY rank
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100)
$function$;

REVOKE ALL ON FUNCTION public.get_wager_leaderboard(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_wager_leaderboard(integer, integer) TO authenticated;