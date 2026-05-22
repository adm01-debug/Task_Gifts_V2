
-- Fix: goal_updates SELECT must check goal ownership/admin
DROP POLICY IF EXISTS "Users can view updates of visible goals" ON public.goal_updates;
CREATE POLICY "Goal owners and admins can view goal updates"
ON public.goal_updates FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.goals g
    WHERE g.id = goal_updates.goal_id
      AND (g.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Fix: key_results SELECT must check goal ownership/admin
DROP POLICY IF EXISTS "Users can view key results of visible goals" ON public.key_results;
CREATE POLICY "Goal owners and admins can view key results"
ON public.key_results FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.goals g
    WHERE g.id = key_results.goal_id
      AND (g.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Fix: mood_entries - non-anonymous entries should NOT be visible to peers
DROP POLICY IF EXISTS "Managers can view anonymous team mood data" ON public.mood_entries;
CREATE POLICY "Managers and admins can view team mood data"
ON public.mood_entries FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'manager'::app_role)
);

-- Fix: pdi_templates - restrict to authenticated
DROP POLICY IF EXISTS "pdi_templates_select" ON public.pdi_templates;
CREATE POLICY "pdi_templates_select"
ON public.pdi_templates FOR SELECT TO authenticated
USING (is_active = true);

-- Fix: quiz_answers - restrict to own answers or admin, authenticated only
DROP POLICY IF EXISTS "Everyone can view answer statistics" ON public.quiz_answers;
CREATE POLICY "Users can view own quiz answers"
ON public.quiz_answers FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- Fix: weekly_challenges - restrict to authenticated
DROP POLICY IF EXISTS "Anyone can view weekly challenges" ON public.weekly_challenges;
CREATE POLICY "Authenticated users can view weekly challenges"
ON public.weekly_challenges FOR SELECT TO authenticated
USING (true);
