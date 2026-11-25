-- Colunas de `public.profiles` que existem em producao e nunca foram versionadas.
--
-- Causa: estas 8 colunas foram criadas direto no banco de producao, fora das
-- migrations, depois de `20251220144518` (que versionou `birth_date`). O esquema
-- versionado ficou com 13 colunas, mas objetos do proprio repositorio ja dependem
-- das ausentes, entao um banco limpo reconstruido pelas migrations quebra antes
-- de chegar nas mais recentes:
--   * 20260728184034:2-12,39-43      RPC get_my_profile_private (LANGUAGE sql,
--                                    validada na criacao) e GRANT SELECT por
--                                    coluna em hire_date, status e last_access_at
--   * 20261218000000:211,214         GRANT UPDATE/SELECT por coluna (hire_date,
--                                    status, last_access_at)
--   * 20261226200000:41,44-61        GRANT SELECT por coluna para anon e
--                                    authenticated
--   * 20261228120000                 matview `leaderboard_cache` projeta
--                                    `status` e `employee_id`
--   * 20260727230544:549             `sync_department_war_headcount` (plpgsql)
--                                    so quebra em runtime - mesmo sintoma,
--                                    invisivel no rebuild
--
-- Tipos, defaults, CHECKs e ordem vem de producao (information_schema.columns e
-- pg_constraint). Idempotente: em producao e no-op. A posicao do arquivo logo
-- apos `birth_date` reproduz a ordem ordinal das colunas em producao (13..21).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hire_date DATE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'confirmed',
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS personal_email TEXT,
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS employee_id TEXT,
  ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'clt',
  ADD COLUMN IF NOT EXISTS last_access_at TIMESTAMP WITH TIME ZONE;

-- CHECKs de producao, com os mesmos nomes. Sao a regra de negocio de `status`
-- (so 'confirmed'/'invited' entram nos lembretes - ver 20261224100000:67) e de
-- `contract_type`. Guardadas por pg_constraint para nao falhar em producao.
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_status_check'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check
      CHECK (status = ANY (ARRAY['invited'::text, 'confirmed'::text, 'inactive'::text, 'deleted'::text]));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_contract_type_check'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_contract_type_check
      CHECK (contract_type = ANY (ARRAY['clt'::text, 'pj'::text, 'intern'::text, 'temporary'::text]));
  END IF;
END
$do$;
