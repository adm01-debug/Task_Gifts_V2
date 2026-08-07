
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = true) AS
SELECT
  id, display_name, avatar_url, level, xp, coins, streak, best_streak,
  quests_completed, status, created_at, updated_at, last_access_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated, anon;
