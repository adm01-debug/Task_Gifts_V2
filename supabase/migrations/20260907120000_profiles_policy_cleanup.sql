-- ============================================================
-- Onda 1.2 (2026-09-05, 2a validação adversarial): limpeza da
-- policy residual de profiles.
--
-- Forense (pg_policy, OIDs): a "duplicata" era um PAR DE NOMES
-- quase idênticos — a original do Lovable
-- "Users can update THEIR own profile" (OID 21294, sem WITH CHECK
-- explícito, semanticamente equivalente pois USING age como check)
-- e a nossa "Users can update own profile" (OID 128080, com USING +
-- WITH CHECK coerentes, criada em 20260906120000).
-- Esta migration remove a original redundante, deixando exatamente
-- 3 policies em profiles (view/insert/update). Idempotente.
-- ============================================================

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
