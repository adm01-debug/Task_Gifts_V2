# db-audit — guarda das migrations

## `check-migration-drift.mjs`

Responde, sem consultar o ledger, as duas perguntas que `supabase/migrations/` não responde sozinho.

**Por que o guarda não lê o ledger:** o banco **tem** `supabase_migrations.schema_migrations` — 280
registros para 280 arquivos, 0 pendentes (medido em 2026-11-24T16:13Z; ver `docs/agentes/banco.md`). O guarda
roda no CI, sem credencial de banco, e a fase 1 (idempotência) não depende do ledger. O guarda
equivalente do `adm01-debug/Zapp_Web_V2` (`scripts/db-audit/check-migration-drift.mjs` lá) compara
arquivo × ledger; aqui essa comparação não roda no CI.

| Fase | Precisa de | Pergunta | Sem isso |
|---|---|---|---|
| 1 | nada | o arquivo é seguro de reaplicar? | — (sempre roda) |
| 2 | `docs/contexto/supabase/snapshot.json` | o objeto existe no banco de verdade? | **PULADA** com aviso |

A fase 1 importa porque qualquer replay/reset reexecuta a migration inteira: uma
migration não idempotente aborta no meio e deixa o banco pela metade.

### Como a análise funciona (e por que não é um grep)

O SQL passa por um tokenizador que **guarda posições**, não só texto. Isso importa:

- Comentário (`--`, `/* */` aninhado) e conteúdo de literal `'…'` são descartados.
- `"Identificador"` é copiado **com a caixa original** (`"App"."X"` ≠ `app.x`) e marcado como faixa:
  nada dentro dele conta como código. Sem isso, uma coluna chamada `"drop table users"` virava acusação.
- `$tag$…$tag$` é marcado como faixa de **código** (precedido por `do`/`as`) ou de **dado**
  (`values ($t$…$t$)`). Dentro dele, literais também são descartados — `raise notice 'não faça drop
  table'` não é acusação.
- A dispensa por guarda é **por statement**, não por arquivo: um bloco `DO $$ … if not exists … $$`
  dispensa só o que está dentro dele.
- `DROP … IF EXISTS` dispensa apenas o **mesmo objeto** (nome, e tabela no caso de policy/trigger).
  `DROP POLICY IF EXISTS "antiga"` não libera `CREATE POLICY "nova"`.

### Ratchet

O baseline (`migration-baseline.json`, gerado) guarda **contagem por chave** `arquivo :: rótulo`. O CI
aponta a migration nova em vez de despejar o legado; a contagem subir reprova, cair entra em
`resolvidos`. Consertar metade do problema **não** deixa o CI vermelho (era um bug da 1ª versão).
`--atualizar-baseline` **recusa** gravar se a lista crescer, a não ser com `--permitir-crescer`.

```bash
node scripts/db-audit/check-migration-drift.mjs                            # fase 1
node scripts/db-audit/check-migration-drift.mjs --snapshot docs/contexto/supabase
node scripts/db-audit/check-migration-drift.mjs --atualizar-baseline       # só para ENCOLHER
```

Exit: `0` nada novo · `1` caso novo ou tabela declarada ausente no banco · `2` erro de uso **ou de
ambiente** (diretório ausente/vazio, baseline ilegível, `db.tables` inválido, baseline crescendo sem
`--permitir-crescer`). Nunca sai `0` por não ter encontrado o que analisar.
Env de teste: `MIGRATIONS_DIR`, `MIGRATION_BASELINE`.

### Estado medido em 2026-11-08 (266 arquivos)

**1.101 statements** em **333 chaves** (`arquivo :: rótulo`):

| Tipo | Statements | Leitura |
|---|---|---|
| `nome_invalido` | 0 | todos em `AAAAMMDDHHMMSS_slug.sql` |
| `versao_duplicada` | 0 | nenhuma colisão de timestamp |
| `nao_idempotente` | **1.062** | 546 `create policy` sem `DROP POLICY IF EXISTS` da mesma policy · 200 `create table` sem `IF NOT EXISTS` · 199 `create index` sem `IF NOT EXISTS` · 98 `create trigger` sem drop/`OR REPLACE` · 19 `create type` |
| `ddl_destrutivo` | **39** | 35 `delete from` · 2 `drop table` · 1 `truncate` · 1 `drop column` |

`codificacao` foi acrescentado em 2026-11-24, depois de um BOM (`EF BB BF`) derrubar o check
`Supabase Preview` no statement 0 de uma migration pendente (`syntax error at or near "\ufeff"`).
Medido então em **0** dos 280 arquivos — o tipo existe para que o próximo BOM reprove no CI do PR, e
não no apply em produção.

A 1ª versão deste guarda relatava 249 chaves porque um único bloco `$$` citando uma guarda zerava o
arquivo inteiro e qualquer `DROP … IF EXISTS` dispensava todos os `CREATE` do mesmo tipo. A auditoria
adversarial de 2026-11-08 quebrou essa versão em 18 pontos; os 14 casos de fixture viraram regressão
na suíte.

Exemplos conferidos no SQL: `20241231000000_saved_filters.sql:41` (4 `CREATE POLICY`, zero drop),
`20251212191618_c4be8585-….sql:2` (`CREATE TABLE public.profiles` nu) e `:57` (`CREATE TRIGGER`
sem drop), `20251212193329_5c696f63-….sql:3` (`CREATE TYPE public.app_role`).

### Fase 2 — o que é comparado

`declaradas` é um **ledger**: processa as migrations em ordem e desconta `DROP TABLE`. Hoje dá **228**
tabelas (o bruto declarado menos as que migrations posteriores derrubaram — medido em 2026-11-24, com
280 arquivos). `create temp table` não entra — em replay a sessão é nova.

Do lado do banco, dois conjuntos, porque as perguntas são diferentes:

- **"a declarada existe?"** → permissivo: existir em qualquer forma basta (pai particionado, partição
  filha, foreign table).
- **"o que existe sem migration?"** → restritivo: só tabela comum. Partição nasce de função/pg_partman
  e tabela de extensão (ex.: `postgis.spatial_ref_sys`) nunca vem de migration.

A comparação só vale nos schemas que o snapshot cobre (o coletor exclui `auth`, `storage`, `realtime`,
`cron`, `vault`…); declarada em schema não coberto sai como aviso, não como drift. `db.tables` vazio ou
reaproveitado de coleta anterior (`carried`) **pula** a fase — catálogo velho não é verdade atual.

### Limite conhecido

Análise **estática por token**, não um parser de PostgreSQL.

- **SQL dinâmico é invisível**: `execute format('create table …')` e `execute 'delete from …'` ficam
  dentro de literal, e literal é descartado. Isso é consequência direta de não acusar
  `raise notice 'drop table'` — escolhido de propósito.
- Fora de escopo: `alter table … add column`/`add constraint`, `alter type … add value`,
  `create extension`, `create schema`. Em replay, `add column` sem `IF NOT EXISTS` aborta igual.
- A fase 2 compara só `CREATE TABLE`: coluna, política e função declaradas não entram.

Achado é candidato a revisão, **não prova**; ausência de achado **não prova** idempotência.

### Testes

`node --test scripts/ci/check-migration-drift.unit.mjs` — **41 casos** com fixtures sintéticas, dos
quais 14 marcados `REGRESSAO` (cada um reproduz uma falha que a auditoria adversarial encontrou).
Nenhum toca banco, rede ou credencial.
