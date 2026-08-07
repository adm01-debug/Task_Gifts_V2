-- Fix league_history: SELECT was for 'public' role, needs 'authenticated'
DROP POLICY IF EXISTS "Everyone can view league history" ON league_history;
CREATE POLICY "Everyone can view league history" ON league_history
  FOR SELECT TO authenticated USING (true);

-- Fix weekly_challenges: remove duplicate/conflicting policies
-- The ALL admin policy + separate SELECT policies cause conflicts
DROP POLICY IF EXISTS "Admins can manage weekly challenges" ON weekly_challenges;
DROP POLICY IF EXISTS "Everyone can view weekly challenges" ON weekly_challenges;
DROP POLICY IF EXISTS "Users can view their own challenges" ON weekly_challenges;
DROP POLICY IF EXISTS "Admins insert weekly challenges" ON weekly_challenges;
DROP POLICY IF EXISTS "Admins update weekly challenges" ON weekly_challenges;

-- Recreate clean policies
CREATE POLICY "Authenticated can view weekly challenges" ON weekly_challenges
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert weekly challenges" ON weekly_challenges
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update weekly challenges" ON weekly_challenges
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete weekly challenges" ON weekly_challenges
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));