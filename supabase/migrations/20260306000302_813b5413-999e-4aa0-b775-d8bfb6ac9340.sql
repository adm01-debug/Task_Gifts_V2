-- Fix task_scores: UPDATE true → restrict to managers/admins
DROP POLICY IF EXISTS "System can update task scores" ON task_scores;
CREATE POLICY "Managers update task scores" ON task_scores
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix task_scores: INSERT true → restrict to managers/admins
DROP POLICY IF EXISTS "System can insert task scores" ON task_scores;
CREATE POLICY "Managers insert task scores" ON task_scores
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix weekly_challenges: UPDATE true → restrict to admins
DROP POLICY IF EXISTS "System can update challenges" ON weekly_challenges;
CREATE POLICY "Admins update weekly challenges" ON weekly_challenges
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix weekly_challenges: INSERT true → restrict to admins
DROP POLICY IF EXISTS "System can insert challenges" ON weekly_challenges;
CREATE POLICY "Admins insert weekly challenges" ON weekly_challenges
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));