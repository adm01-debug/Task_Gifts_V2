-- 1) Raspadinha: pesos de sorteio não devem ser públicos para colaboradores
DROP POLICY IF EXISTS "scratch_prizes_select_authenticated" ON public.scratch_card_prizes;

CREATE POLICY "scratch_prizes_select_admin"
ON public.scratch_card_prizes
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2) Remover políticas SELECT duplicadas (mesma condição avaliada 2x por linha)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "Everyone can view role permissions" ON public.role_permissions;