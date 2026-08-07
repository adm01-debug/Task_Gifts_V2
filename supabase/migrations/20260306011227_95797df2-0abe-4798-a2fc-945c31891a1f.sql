-- Revert profiles policy - internal company app, all authenticated users need to see colleagues
DROP POLICY IF EXISTS "Users can view basic profile info" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);
