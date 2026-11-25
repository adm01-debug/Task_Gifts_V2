# Mapa do repositório — referência para agentes

Ler quando precisar saber onde fica algo antes de buscar por texto.

## Onde olhar primeiro

| Precisa de | Leia |
|---|---|
| Regras de trabalho, banco, Git, CI, deploy | `AGENTS.md` + `docs/agentes/*.md` (esta pasta) — **fonte de verdade** |
| Qual banco, migration, segredo | `docs/agentes/banco.md` |
| Por que a edge não responde | `docs/agentes/edge-functions.md` |
| Confirmar deploy, env var, CSP | `docs/agentes/vercel-deploy.md` |
| Branch protection, passos do CI, Dependabot | `docs/agentes/github-ci.md` |
| Regra de negócio que o código não deixa óbvio | `docs/agentes/regras-dominio.md` |
| Onde fica cada tela/rota | `src/App.tsx` (83 rotas) e `src/pages/` (82 arquivos) |
| Histórico, auditorias, planos antigos | `docs/estado/`, `ESTADO_ATUAL.md`, `INVENTARIO_FUNCIONALIDADES.md`, `PADROES_LAYOUT_UX.md`, `RELATORIO_CI.md`, `*_AUDIT*.md`, `audit_report.md`, `.lovable/plan.md` — **contexto, não fonte de verdade** |

**Sobre a auditoria de 2026-08** (`ESTADO_ATUAL.md` + `docs/estado/`): é um levantamento sério e útil
para entender o porquê das coisas, mas **parte dela já foi corrigida** — o `ci.yml` não é mais YAML
inválido e roda verde, `.env` não está mais versionado, `prettier` está declarado. Qualquer afirmação
dela que você vá usar como base de um fix precisa ser reconfirmada no código/banco atual.

## Mapa rápido

| Onde | O que tem |
|---|---|
| `src/` | front Vite + React 19: `components/` (461 arquivos), `hooks/` (129), `services/` (99 arquivos; 96 `*Service.ts` na raiz), `pages/` (82), `lib/` (106), `contexts/`, `constants/`, `types/`, `utils/`, `i18n/`, `styles/` |
| `src/integrations/supabase/` | `client.ts` (lê `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`) e `types.ts` (**gerado — não editar à mão**) |
| `src/lib/edgeAvailability.ts` | allowlist + kill-switch das edge functions (leia antes de dizer "a edge não funciona") |
| `src/test/` (122 testes) · `src/tests/unit/` (16) | suíte vitest — **os dois diretórios existem**, o glob `src/**` cobre ambos |
| `tests/` | Playwright: `auth-flow.spec.ts`, `e2e/smoke.spec.ts` (gate do CI), `e2e/happy-paths.spec.ts` (não-bloqueante) |
| `src/stories/` + `.storybook/` | 30 stories e config válida, **sem script `storybook`/`build-storybook`** no `package.json` — hoje não há como subir nem buildar |
| `supabase/functions/` | 37 edge functions + `_shared/` |
| `supabase/migrations/` | 314 arquivos `.sql`, **alinhados 1:1** com as 314 versões do ledger (medido em 2026-11-26); antes eram 313 para 313, e antes 312 para 312, e antes 311 para 311, e antes disso 306 para 306, 305 para 305, 304 para 304 e 295 para 295 (medido em 2026-11-25 após os merges de #158–#164, a `20261227120000` e a `20261227140000` — ver `banco.md`) |
| `supabase/config.toml` | `project_id` **divergente** do projeto em uso + único `verify_jwt=false` |
| `scripts/ci/` | guardas de repo: `check-claude-md-integrity.mjs` (GA02), `commit-msg-lint.mjs`, e os adaptadores `*.unit.mjs` das automações de contexto |
| `scripts/ai-context/` | produtor `codigo/` do contexto: rotas, módulos, hooks, edges, grafo, testes, convenções |
| `scripts/supabase_snapshot/` | produtor `supabase/` do contexto: retrato do banco ao vivo (exige `SUPABASE_DB_URL`) |
| `scripts/regras_negocio/` | produtor `regras/` do contexto + `indice.py`, que monta `docs/contexto/00-INDEX.md` |
| `scripts/db-audit/` | guarda das migrations: idempotência (ratchet) + drift das tabelas contra o snapshot do banco |
| `scripts/graphify/` | setup do grafo de código (`setup.sh` + README) |
| `scripts/patch-recharts.cjs` | `postinstall` que muta `node_modules` para silenciar um warning do recharts |
| `docs/api/openapi.yaml` | contrato da API externa (`external-api`) |
| `.claude/` | `settings.json` (hooks), `hooks/session-start.sh`, `skills/task-gifts-v2/`, `prompts/` |
| `.codex/`, `.agents/` | mesma instrução para Codex/OpenCode — ver `AGENTS.md` |

## Automações (`scripts/`)

Automação vive em `scripts/<nome>/`, um subdiretório por automação, cada um com `README.md` dizendo o
que faz, como rodar e que secrets usa. Scripts em `scripts/`; a saída deles em `docs/` — nunca misturar
os dois. Não use `supabase/scripts` (o CLI do Supabase é dono de `supabase/`) nem `src/scripts` (entra
no bundle). **Leia o README da automação antes de alterar.**

## Comandos

O repo usa **bun** (`bun.lock`); `package-lock.json` também está versionado, mas CI e Vercel usam bun —
`bun install --frozen-lockfile`.

- testes unitários só do que você tocou: `npx vitest run <caminho>` (a suíte inteira são ~137 arquivos);
- cobertura como no CI: `bun run test:ci` (thresholds em `vitest.config.ts`: statements 30, branches 25,
  functions 25, lines 30 — **não baixe**);
- **typecheck:** `bun run typecheck` verifica `tsconfig.app.json` e `tsconfig.node.json` explicitamente,
  sem emitir arquivos. Não substitua por `tsc --noEmit` sozinho: `tsconfig.json` tem `"files": []` +
  `references`, e esse comando não segue as referências;
- lint dos arquivos tocados: `npx eslint <arquivos>`; a suíte toda: `bun run lint`;
- E2E como no CI: `bun playwright test tests/e2e/smoke.spec.ts tests/auth-flow.spec.ts`
  (o `webServer` sobe `bun run dev` em `http://localhost:8080`);
- guardas antes do PR: `node scripts/ci/check-claude-md-integrity.mjs`,
  `node scripts/ci/commit-msg-lint.mjs <arquivo>`;
- hooks do husky: `pre-commit` (`npx lint-staged`), `commit-msg` (`scripts/ci/commit-msg-lint.mjs`).

## Grafo de código (graphify) — detalhes

`bun run graph:setup` → `scripts/graphify/setup.sh`; precisa de `uv` ou `pipx` (cai para
`pip install --user`). `graphify-out/` está no `.gitignore`: cada clone gera o seu. Frescura: compare
`git rev-parse --short HEAD` com a linha "Built from commit" de `graphify-out/GRAPH_REPORT.md`; se
divergir, `graphify update .` (só AST, sem custo de API).

Medido neste repo em 2026-11-08 (graphify 0.9.68): **1.416 arquivos → 8.998 nós, 25.584 arestas, 586
comunidades**, ~2,5 min de build, 0 token de API. `src/integrations/supabase/types.ts` é grande demais e
sai parcialmente extraído (erro de sintaxe na linha 6490) — é esperado, não tente "consertar" o arquivo
gerado. `.graphifyignore` exclui `.env*`, chaves, `dist/`, `coverage/` e os relatórios de auditoria da
raiz (que poluem a busca sem ser fonte de verdade).

Em sessão de nuvem, `.claude/hooks/session-start.sh` instala o graphify e gera o grafo em segundo plano
(log em `graphify-out/.session-start.log`; pula se o grafo já é do commit atual). Os hooks `PreToolUse`
de `.claude/settings.json` chamam `graphify hook-guard` e não fazem nada onde o graphify não estiver
instalado.
