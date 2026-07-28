-- 1) Fecha completamente o papel anônimo sobre o schema public.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Novas tabelas/sequências não devem reabrir a superfície anônima.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;

-- 2) Configurações de geo-bloqueio deixam de ser legíveis por qualquer usuário logado.
DROP POLICY IF EXISTS "Everyone can view geo settings" ON public.geo_settings;
CREATE POLICY "Admins can view geo settings"
  ON public.geo_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Everyone can view allowed countries" ON public.geo_allowed_countries;
CREATE POLICY "Admins can view allowed countries"
  ON public.geo_allowed_countries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Todos podem ver regras de geo blocking" ON public.geo_blocking_rules;
CREATE POLICY "Admins can view geo blocking rules"
  ON public.geo_blocking_rules FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));