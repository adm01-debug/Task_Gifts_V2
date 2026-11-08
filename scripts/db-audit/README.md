# db-audit — guarda das migrations

## `check-migration-drift.mjs`

Responde, sem ledger, as duas perguntas que `supabase/migrations/` não responde sozinho.

**Por que sem ledger:** este banco **não tem** `supabase_migrations.schema_migrations`
(`docs/agentes/banco.md`), então as 266 migrations não estão rastreadas. O guarda equivalente do
`adm01-debug/Zapp_Web_V2` (`scripts/db-audit/check-migration-drift.mjs` lá) compara arquivo × ledger;
aqui isso é impossível, e um port literal seria código morto.

| Fase | Precisa de | Pergunta | Sem isso |
|---|---|---|---|
| 1 | nada | o arquivo é seguro de reaplicar? | — (sempre roda) |
| 2 | `docs/contexto/supabase/snapshot.json` | o objeto existe no banco de verdade? | **PULADA** com aviso |

A fase 1 importa porque, sem ledger, qualquer replay/reset reexecuta a migration inteira: uma
migration não idempotente aborta no meio e deixa o banco pela metade.

### Ratchet

O baseline (`migration-baseline.json`, gerado) guarda a **lista** de achados, não a contagem: o CI
aponta a migration nova em vez de despejar o legado. Achado que desaparece entra em `resolvidos` e o
baseline pode encolher — nunca crescer para "passar".

```bash
node scripts/db-audit/check-migration-drift.mjs                            # fase 1
node scripts/db-audit/check-migration-drift.mjs --snapshot docs/contexto/supabase
node scripts/db-audit/check-migration-drift.mjs --atualizar-baseline       # só para ENCOLHER
```

Exit: `0` nada novo · `1` caso novo ou tabela declarada ausente no banco · `2` erro de uso.
Env de teste: `MIGRATIONS_DIR`, `MIGRATION_BASELINE`.

### Estado medido em 2026-11-08 (266 arquivos)

| Tipo | Qtd | Leitura |
|---|---|---|
| `nome_invalido` | 0 | todos em `AAAAMMDDHHMMSS_slug.sql` |
| `versao_duplicada` | 0 | nenhuma colisão de timestamp |
| `nao_idempotente` | 249 | 78 `create policy` sem `DROP POLICY IF EXISTS`, 67 `create table` sem `IF NOT EXISTS`, 48 `create trigger` sem drop, 46 `create index` sem `IF NOT EXISTS`, 9 `create type`, 1 `create view` sem `OR REPLACE` |
| `ddl_destrutivo` | 24 | `delete from` / `truncate` / `drop` em migration |

Exemplos conferidos no SQL: `20241231000000_saved_filters.sql:41` (4 `CREATE POLICY`, zero drop),
`20251212191618_c4be8585-….sql:2` (`CREATE TABLE public.profiles` nu) e `:57` (`CREATE TRIGGER`
sem drop), `20251212193329_5c696f63-….sql:3` (`CREATE TYPE public.app_role`).

### Limite conhecido

Análise **estática por token**, não um parser de PostgreSQL. Guardas dentro de `DO $$ … $$` são
reconhecidas por heurística (o bloco conta como guardado se cita `if not exists`, `to_regclass`,
`pg_class`, `pg_policies`, `information_schema` e afins). Achado é candidato a revisão, não prova;
ausência de achado **não** prova idempotência. A fase 2 compara só `CREATE TABLE` — colunas,
políticas e funções declaradas não entram.

### Testes

`node --test scripts/ci/check-migration-drift.unit.mjs` — 20 casos com fixtures sintéticas; nenhum
toca banco, rede ou credencial.
