-- ============================================================
-- Pós-validação adversarial (2026-09-06): correções da Onda 1.1
-- Ref: issue #4 (baseline de migrations) + revisão de policies
-- pelos 5 agentes de validação. Idempotente por design
-- (DROP IF EXISTS + CREATE) para re-execução segura pelo app
-- Supabase no fluxo de migrations.
-- ============================================================

-- 1) profiles: havia DUAS policies "Users can update own profile"
--    (uma sem WITH CHECK). Deduplica mantendo USING + WITH CHECK
--    coerentes e escopo `authenticated`.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2) entity_versions: SELECT era USING (true) — qualquer usuário
--    autenticado podia ler snapshots JSONB de TODAS as entidades.
--    Restringe a autores e admins (defesa em profundidade; a tabela
--    não possui consumidores no frontend hoje).
DROP POLICY IF EXISTS "Users can view versions" ON public.entity_versions;
CREATE POLICY "Users can view versions"
  ON public.entity_versions FOR SELECT
  TO authenticated
  USING (
    changed_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );
