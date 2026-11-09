# Contexto autônomo para agentes de IA

Pacote de automações que mantém, **sem intervenção humana**, um retrato do estado REAL do repositório
para agentes de IA lerem antes de qualquer tarefa. Objetivo: acabar com o retrabalho de redescobrir o
projeto a cada sessão e com os relatórios da raiz que envelhecem (`ESTADO_ATUAL.md`,
`INVENTARIO_FUNCIONALIDADES.md`, `*_AUDIT*.md` — auditoria de 2026-08, contexto e não fonte de verdade).

Origem: pacote `ai-context-sync`, em produção no `adm01-debug/Zapp_Web_V2`
(`.github/workflows/contexto.yml`). Portado para cá verbatim nos geradores; só os READMEs e o workflow
foram ajustados ao projeto.

## Um workflow, três produtores, um índice, uma branch

`.github/workflows/contexto.yml` (push em `main` + a cada 10 min no minuto 3 + dispatch):

| Produtor | Script | Saída | O que cobre |
|---|---|---|---|
| código | `scripts/ai-context/gerar.mjs` | `docs/contexto/codigo/` | rotas, módulos, componentes, hooks, edge functions, grafo de dependências, testes, CI, scripts, convenções, baseline (git log 90 dias) |
| banco real | `scripts/supabase_snapshot/snapshot.py` | `docs/contexto/supabase/` | banco **ao vivo**: tabelas, colunas, RLS/policies, constraints, índices, funções, triggers, cron, storage, grants, lints, diagrama ER |
| regras de negócio | `scripts/regras_negocio/generate.py` | `docs/contexto/regras/` | RLS por operação, máquinas de estado, validações, fórmulas, prazos, mensagens de erro, acesso/segurança, glossário, lacunas, `manual/` humano |
| índice | `scripts/regras_negocio/indice.py` | `docs/contexto/00-INDEX.md` | quem é dono de cada fato + frescor de cada fonte (`ok`, `parcial`, `desatualizado`, ausente) |

Cada fato tem um dono: schema real = `supabase/`; onde o código vive = `codigo/`; o que pode/não pode =
`regras/`. Fontes discordando → vale o dono.

## Onde ler (nunca em `main`)

A saída é publicada na branch gerada **`contexto`** — `main` tem branch protection e um PR a cada 10 min
dispararia o CI inteiro. `.gitignore` barra `docs/contexto/*` exceto `docs/contexto/regras/manual/`.

```bash
git fetch origin contexto
git show origin/contexto:docs/contexto/00-INDEX.md
git show origin/contexto:docs/contexto/codigo/INDEX.md
git show origin/contexto:docs/contexto/supabase/lints.md
```

Sem clone: `https://raw.githubusercontent.com/adm01-debug/Task_Gifts_V2/contexto/docs/contexto/00-INDEX.md`.
Nunca abra PR da branch `contexto`, nem edite nada nela.

## Regras humanas

`docs/contexto/regras/manual/*.md` vive em `main`, entra na seção A do `07-REGRAS-DE-NEGOCIO.md` com
prioridade máxima e nunca é sobrescrito. Comece copiando `TEMPLATE-regras-de-negocio.md` para `regras.md`.
Editar `manual/` em `main` dispara o workflow.

## Secret pendente (o produtor do banco está desligado)

O job `banco` exige o secret **`SUPABASE_DB_URL`**, que **não existe** neste repositório
(`github_list_actions_secrets` em 2026-11-08: só `E2E_EMAIL`, `E2E_PASSWORD`,
`VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`). Sem ele:

- no agendamento o job sai **verde com aviso** e `docs/contexto/supabase/` não é criada;
- no dispatch manual o job **falha**, de propósito, para a pessoa ver;
- `00-INDEX.md` marca a fonte "banco real" como `ainda não gerado`.

Como ligar: Settings → Secrets and variables → Actions → `SUPABASE_DB_URL` com o **Session pooler** do
projeto `eidsaqymojyuhprobfpn` e usuário `postgres` (exigências e role read-only alternativa em
`scripts/supabase_snapshot/README.md`). A sessão abre em `default_transaction_read_only = on`.

`PGDUMP` e `GEN_TYPES` ficam `false`: o `pg_dump` do runner é mais antigo que o servidor e o agente lê o
Markdown/JSON do snapshot, não um dump.

## Rodar local

```bash
bun run contexto:codigo
bun run contexto:regras
bun run contexto:test
```

```bash
python3 scripts/regras_negocio/indice.py --repo . --out docs/contexto/00-INDEX.md \
  --head "$(git rev-parse HEAD)" --remote adm01-debug/Task_Gifts_V2 \
  --fonte "banco real=docs/contexto/supabase" --fonte "código=docs/contexto/codigo" \
  --fonte "regras de negócio=docs/contexto/regras"
```

Snapshot do banco local exige `SUPABASE_DB_URL` exportada e
`pip install -r scripts/supabase_snapshot/requirements.txt`.

## Guardas no CI

O job `quality` roda, no passo "Guardas das automacoes de contexto", as suítes dos quatro produtores
(`scripts/ai-context/gerar.unit.mjs` + `scripts/ci/{contexto-indice,contexto-publicacao,regras-negocio,supabase-snapshot}.unit.mjs`):
89 testes, nenhum toca banco, rede ou API de LLM. `contexto-publicacao.unit.mjs` executa o publisher real
do `contexto.yml` contra um Git local — mexer no job `publicar` sem atualizar o teste reprova o CI.

## O que NÃO foi portado do Zapp_Web_V2

- `scripts/inventario/gerar-banco.mjs` + `banco.sql` e `inventario-estado-semanal.yml`: o SQL consulta
  tabelas do domínio do Zapp (`whatsapp_connections`) e o guard de gravação exige
  `supabase/schema-manifest.json` e o ledger `supabase_migrations.schema_migrations`, que **não existem**
  neste projeto (ver `docs/agentes/banco.md`).
- `scripts/inventario/gerar-rotas.mjs`: lê `src/routes/AppRoutes.tsx` + `src/pages/ViewRouter.tsx` +
  `src/services/navigation.service.ts`; aqui as rotas estão em `src/App.tsx` e já saem em
  `docs/contexto/codigo/rotas.json`.
- `scripts/inventario/gerar-repo.mjs`: redundante — `docs/contexto/codigo/edge-functions.json` traz o
  mesmo e mais (`verify_jwt`, tabelas, RPCs, env, quem chama do front/edges/SQL-cron).
- `scripts/talkx/`, `scripts/edge-deploy/`, `scripts/e2e-isolated/`: domínio, infraestrutura de deploy
  e guardas vivos de banco do Zapp; dependem de secrets, workflows e tabelas que não existem aqui.
- `scripts/db-audit/check-migration-drift.mjs` **foi** portado, mas reescrito: o original compara
  arquivo × ledger (`supabase_migrations.schema_migrations`), que aqui não existe. Ver
  `scripts/db-audit/README.md`. O resto de `scripts/db-audit/` do Zapp (≈180 arquivos de guarda vivo)
  não veio.
