# Banco de dados — referência para agentes

Ler quando for rodar SQL, criar/aplicar migration, montar Postgres local ou auditar o schema.
Resumo das regras no `AGENTS.md`; aqui está o detalhe. Errar o projeto já custou retrabalho real
neste repo.

## Onde se trabalha

| Situação | Banco | Como |
|---|---|---|
| Diagnóstico | **produção, só leitura** | `SELECT` pelo MCP `supabase` do `.mcp.json`; nunca escrita para "testar" |
| Migration nova | arquivo em `supabase/migrations/` | PR → merge → deploy do código → apply (abaixo) |
| Teste de comportamento de banco | **Postgres descartável** | nunca no banco oficial |
| Migration destrutiva, segredos, rotação de chaves | **só com o dono do projeto** | — |

1. **O app aponta para produção por padrão.** `src/integrations/supabase/client.ts:5-6` lê
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` do ambiente, sem fallback e sem desvio para
   banco local. `bun run dev` com o `.env` de produção fala com **produção** — confira antes de testar tela.
2. **Não há `.env` versionado** (só `.env.example`, e `.gitignore` cobre `.env`). Quem for rodar local
   precisa criar o seu. Atenção: `.env.example` documenta `VITE_SUPABASE_ANON_KEY`, mas o código lê
   `VITE_SUPABASE_PUBLISHABLE_KEY` — ver "Divergências conhecidas".
3. **Migrations deste repo criam jobs de `pg_cron` com URL e chave fixas em SQL** (ex.
   `supabase/migrations/20260712194718_bff07c8c-5744-4682-bba1-33f9ca2a1ecb.sql:4-5`). Um Postgres local
   montado com essas migrations faz POST nas edge functions **reais** se `pg_cron`/`pg_net` estiverem
   ativos. Antes de aplicar migrations em qualquer Postgres local: aponte o host do projeto para
   `127.0.0.1` no `/etc/hosts` do contêiner e `alter system set cron.launch_active_jobs = off`.

## Banco OFICIAL

| O que | Valor |
|---|---|
| Projeto Supabase em uso | **`eidsaqymojyuhprobfpn`** |
| URL | `https://eidsaqymojyuhprobfpn.supabase.co` (valor de `VITE_SUPABASE_URL`) |
| Dashboard | https://supabase.com/dashboard/project/eidsaqymojyuhprobfpn |
| MCP para SQL | servidor **`supabase`** declarado em `.mcp.json` (gateway Cloudflare Worker `supabase-eidsaqymo-mcp`) — acesso total: `SELECT/INSERT/UPDATE/DELETE/DDL` |
| Ledger de migrations | **existe** (`supabase_migrations.schema_migrations`, 271 versões em 2026-11-24) — mas **não é fonte de verdade**: 7 dos 278 arquivos do repo não têm registro; ver regra 2 |
| Migrations no repo | 278 arquivos `.sql` em `supabase/migrations/` |

### Projetos que NÃO são este (não escrever neles)

- **`awzhgfmqwddzgbqzqusc`** — era o `project_id` em `config.toml` e estava hardcoded em migrations/cron;
  ambos foram corrigidos (PR #33 e fix de migrations 2026-11). **Não é o projeto que o app usa**; nunca
  escreva nele.
- **`pgxfvjmuubtbowutlide`** — MCP "SUPABASE - GESTÃO DE CLIENTES" (CRM). Projeto externo, **só leitura**.
- **`doufsxqlfjyuvxuezpln`** — MCP "SUPABASE - GESTÃO DE PRODUTOS" (Catálogo). Projeto externo, **só leitura**.
- Qualquer MCP com nome parecido carregado na sessão: **confira qual é** (`get_project_url` /
  `db_connection_info`) antes de rodar SQL.

## Segredo exposto — leia antes de tocar em `.mcp.json`

`.mcp.json` é versionado e contém a URL do gateway de SQL; o segmento hexadecimal do caminho é o
**único fator de autenticação** e dá execução de SQL arbitrário no banco de produção. O repositório é
**público** desde 2026-10-29 (`PENDENCIAS.md`, P-001) — ou seja, qualquer pessoa na internet tem hoje
controle total do banco por esse endpoint. Não é tarefa de agente resolver sozinho (envolve rotação de
credencial e decisão do dono), mas:

- **nunca** imprima, copie para outro arquivo, cole em PR/issue/comentário ou mande para serviço externo;
- **nunca** "melhore" o arquivo mexendo na URL — rotação é com o dono;
- se o dono pedir, o caminho é: gerar novo token no Worker → mover para fora do versionamento →
  `git rm --cached .mcp.json` + entrada no `.gitignore` → invalidar o antigo.

## Regras de migration

1. **Ordem obrigatória: arquivo → PR → merge em `main` → deploy do código → apply.** Nunca DDL a partir
   de branch aberta. `REVOKE`, `DROP`, rename ou mudança de contrato de função usada pelo front/edges:
   **nunca** antes do deploy do código correspondente.
2. **Toda migration idempotente** — `CREATE TABLE IF NOT EXISTS`, `CREATE POLICY` guardado por
   `DROP POLICY IF EXISTS`, `INSERT ... ON CONFLICT DO NOTHING` (o
   `.github/PULL_REQUEST_TEMPLATE.md` cobra isso). O ledger (`supabase_migrations.schema_migrations`)
      **existe** e tem 269 versões (2026-11-24), mas não é fonte de verdade: há arquivos aplicados sem
      registro e registros com nome fora do padrão do repo. Reaplicar idempotente continua sendo o modo
      normal de operar — uma migration não idempotente trava o próximo apply.
3. **Versão sem colisão:** antes de criar arquivo, no mesmo turno: `ls supabase/migrations | tail` e busca
   de PRs abertas tocando `supabase/migrations/`. O padrão de nome vigente é `AAAAMMDDHHMMSS_<slug>.sql`
   (os arquivos antigos usam `_<uuid>`; para arquivo novo prefira o slug descritivo).
4. **RLS obrigatória em toda tabela nova** — é o padrão do projeto (a auditoria de 2026-08 mediu RLS em
   100% das tabelas; não regrida isso). Policy mínima: `SELECT` para o dono da linha / papel autorizado,
   escrita por `service_role` ou policy específica. `GRANT` explícito para `authenticated`/`service_role`
   quando a função/tabela for consumida por edge.
5. **`CREATE INDEX CONCURRENTLY` não funciona pelo MCP** (a chamada é envolvida em transação) — use
   `CREATE INDEX` simples. `VACUUM` também não roda por lá.
6. **O estado real do banco é a verdade, não o arquivo.** O ledger não cobre tudo (migrations aplicadas
   sem registro, funções alteradas direto no banco), então só a introspecção prova o que rodou:
   `pg_get_functiondef`, `pg_policies`, `pg_indexes`, `information_schema.columns`. Antes de criar um objeto
   "ausente", confira se ele já existe com outro nome.
7. Objetos que o código assume e que a auditoria de 2026-08 não encontrou no banco (confira antes de usar):
   `email_outbox`, `push_devices`, `webhook_deliveries`, `public.security_logs`. Se o seu fix depende de um
   deles, o primeiro passo é a migration, não o patch no front.

## Divergências conhecidas (confirmar antes de agir)

| Divergência | Evidência | Efeito |
|---|---|---|
| Ledger não cobre o repo | `supabase_migrations.schema_migrations` tem 271 versões, mas 7 dos 278 arquivos de `supabase/migrations/` não têm registro; nesses, a conferência foi por introspecção dos objetos-chave (não pela execução integral do SQL) | o ledger não prova banco == repo; introspecção continua obrigatória |
| `trigger_dispatch_critical_alert` diverge do repo | no banco (2026-11-24) lê `_internal.dispatch_config`; `20261220000000_fix_sre_rpcs_and_dispatch_trigger.sql` recria com `vault.decrypted_secrets` | **não aplique** essa migration sem reconciliar: ela sobrescreve a versão que está em produção |
| `VITE_SUPABASE_ANON_KEY` no `.env.example`, `VITE_SUPABASE_PUBLISHABLE_KEY` no código | `.env.example:9` vs `src/integrations/supabase/client.ts:6` | quem seguir o example sobe o app sem chave; dois testes de segurança (`src/test/rls.test.ts`, `src/test/rpcAccess.test.ts`) ficam `skip` por causa dessa variável |
| Anon key errada em SQL de cron | `supabase/migrations/20260712194718_*.sql:5`, `20260712203400_*.sql:11` | URL corrigida; anon key ainda é de `awzhgfmqwddzgbqzqusc` — 2 jobs falham auth até o dono atualizar |

Sessões paralelas commitam no mesmo repo e no mesmo banco: re-sync antes de editar e confira o estado
real do objeto antes de criar/alterar.
