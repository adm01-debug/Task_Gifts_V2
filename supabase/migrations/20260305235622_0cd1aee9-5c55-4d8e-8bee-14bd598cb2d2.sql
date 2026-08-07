-- Fix task_scores: drop existing and recreate
DROP POLICY IF EXISTS "Users can view own task scores" ON task_scores;
DROP POLICY IF EXISTS "Admins can manage task scores" ON task_scores;
CREATE POLICY "Users can view own task scores" ON task_scores
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage task scores" ON task_scores
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Fix weekly_challenges
DROP POLICY IF EXISTS "Everyone can view weekly challenges" ON weekly_challenges;
DROP POLICY IF EXISTS "Admins can manage weekly challenges" ON weekly_challenges;
CREATE POLICY "Everyone can view weekly challenges" ON weekly_challenges
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage weekly challenges" ON weekly_challenges
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));