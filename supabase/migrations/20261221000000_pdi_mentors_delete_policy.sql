-- pdi_mentors nasceu sem policy de DELETE (RLS nega por padrao quando nao existe
-- policy), o que tornava impossivel remover um mentor de um PDI pela aplicacao.
-- Alem da policy, a migration 20260728190509 revogou DELETE de authenticated em
-- pdi_mentors: sem o GRANT abaixo o DELETE falha com "permission denied" mesmo
-- com policy valida (PostgreSQL exige privilegio de tabela + policy de linha).
-- Espelha a policy de INSERT endurecida em 20260306000250 (gestor/admin), e
-- permite que o proprio mentor encerre o vinculo. Aditiva e idempotente.
GRANT DELETE ON public.pdi_mentors TO authenticated;

DROP POLICY IF EXISTS "pdi_mentors_delete" ON public.pdi_mentors;

CREATE POLICY "pdi_mentors_delete"
  ON public.pdi_mentors
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = mentor_id
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );