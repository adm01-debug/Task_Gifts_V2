-- Feature de PDI ficou pela metade: existe a tabela pdi_templates com dados e a
-- policy de leitura, mas nenhuma policy de escrita. O Pdi.tsx le os templates e
-- mostra "Peca ao RH para cadastrar templates", so que o RH nao tem por onde:
-- o INSERT em pdiService.createTemplate sempre batia em RLS ("new row violates
-- row-level security policy") e nenhuma tela chamava a funcao.
-- Aqui entra a policy de escrita (admin) e a tela de cadastro (Pdi.tsx).

DROP POLICY IF EXISTS pdi_templates_insert_admin ON public.pdi_templates;
CREATE POLICY pdi_templates_insert_admin ON public.pdi_templates
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS pdi_templates_update_admin ON public.pdi_templates;
CREATE POLICY pdi_templates_update_admin ON public.pdi_templates
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS pdi_templates_delete_admin ON public.pdi_templates;
CREATE POLICY pdi_templates_delete_admin ON public.pdi_templates
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));