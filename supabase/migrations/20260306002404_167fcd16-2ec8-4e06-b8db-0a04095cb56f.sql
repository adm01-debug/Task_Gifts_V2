DROP POLICY IF EXISTS "Authenticated can view weekly challenges" ON public.weekly_challenges;
CREATE POLICY "Anyone can view weekly challenges"
ON public.weekly_challenges
FOR SELECT
TO authenticated, anon
USING (true);