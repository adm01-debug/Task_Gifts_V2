-- Hardening do login por passkey.
--
-- 1) `counter` era INTEGER (int4, teto 2147483647), mas o contador de
--    autenticador no WebAuthn e uint32 (teto 4294967295). Um autenticador que
--    cruzasse 2^31 fazia todo login falhar com erro de range no UPDATE.
-- 2) A policy de `webauthn_challenges` aceitava `user_id IS NULL` para
--    qualquer usuario autenticado, o que permitia ler/apagar challenges
--    pendentes de terceiros (o desafio e inserido sem dono no fluxo de login
--    sem e-mail). Restringimos a policy ao proprio dono; o servidor continua
--    gravando via service role, que nao passa por RLS.
--
-- Idempotente: reaplicar nao tem efeito colateral.

ALTER TABLE public.webauthn_credentials
  ALTER COLUMN counter TYPE BIGINT USING counter::bigint;

DROP POLICY IF EXISTS "Users can manage their own challenges" ON public.webauthn_challenges;

CREATE POLICY "Users can manage their own challenges"
  ON public.webauthn_challenges FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);