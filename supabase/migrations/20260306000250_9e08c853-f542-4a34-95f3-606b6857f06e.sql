-- Fix external_tasks: ALL true → restrict to admins
DROP POLICY IF EXISTS "System can manage external tasks" ON external_tasks;
CREATE POLICY "Admins manage external tasks" ON external_tasks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix position_competencies: ALL true → admins write, all read
DROP POLICY IF EXISTS "position_competencies_manage" ON position_competencies;
CREATE POLICY "Admins manage position competencies" ON position_competencies
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix feedback_evaluations: INSERT true → restrict to own evaluations
DROP POLICY IF EXISTS "feedback_evaluations_insert" ON feedback_evaluations;
CREATE POLICY "Users insert own evaluations" ON feedback_evaluations
  FOR INSERT TO authenticated
  WITH CHECK (evaluator_id = auth.uid());

-- Fix feedback_results: INSERT true → restrict to managers/admins
DROP POLICY IF EXISTS "feedback_results_insert" ON feedback_results;
CREATE POLICY "Managers insert feedback results" ON feedback_results
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix pdi_mentors: INSERT true → restrict to managers/admins  
DROP POLICY IF EXISTS "pdi_mentors_insert" ON pdi_mentors;
CREATE POLICY "Managers assign PDI mentors" ON pdi_mentors
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix user_competency_assessments: INSERT true → restrict to managers/admins
DROP POLICY IF EXISTS "user_competency_assessments_insert" ON user_competency_assessments;
CREATE POLICY "Managers insert competency assessments" ON user_competency_assessments
  FOR INSERT TO authenticated
  WITH CHECK (assessor_id = auth.uid());