-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Managers can view their team members" ON public.team_members;

-- Create new policy using the SECURITY DEFINER function (no recursion)
CREATE POLICY "Managers can view their team members"
ON public.team_members
FOR SELECT
USING (
  auth.uid() = user_id 
  OR is_department_manager(auth.uid(), department_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);