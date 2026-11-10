# GitHub (perímetro, CI, workflows) — referência para agentes

Ler quando mexer em branch protection, settings do repo, `.github/workflows/`, ou quando um merge ou
um workflow falhar de forma estranha.

## Escrita no GitHub

- Repo `adm01-debug/Task_Gifts_V2`, branch `main`, **público** (convertido em 2026-10-29 para ter
  GitHub Actions gratuito — `PENDENCIAS.md`, P-001). Público significa que **todo arquivo versionado é
  legível por qualquer pessoa**, incluindo `.mcp.json` (ver `banco.md` > "Segredo exposto").
- **Escrita: somente MCP `GITHUB - MCP - FOREVER`** (`github_push_files`). O MCP padrão do GitHub
  retorna 403 em write. `github_push_files` sobrescreve o arquivo — mande o conteúdo integral com apenas
  a mudança semântica, e confira depois que o arquivo remoto bate com o que você testou. Ele aceita
  `files` e `delete` no mesmo commit (1 commit atômico).
- Commits: `<tipo>(<escopo>): <assunto>` com assunto ≥ 10 caracteres e sem ponto final; tipos aceitos
  pelo hook `commit-msg` (`scripts/ci/commit-msg-lint.mjs`): `feat fix docs style refactor perf test
  build ci chore security revert`. `infra` existe só como tipo de **branch** (`claude/infra-...`); para o
  commit use `ci:` ou `chore:`. Via MCP o hook não roda — siga o padrão mesmo assim.
- Sessão na nuvem: `git clone` e leitura por `raw.githubusercontent.com` funcionam (repo público), mas
  `git push` volta 403 do proxy quando o repo não está entre as fontes autorizadas da sessão — escreva
  só pelo MCP. Para listar PRs abertas com os arquivos que tocam numa chamada só, use `github_graphql`
  (`pullRequests(states:OPEN){ nodes { number files { nodes { path } } } }`):
  `github_list_pull_requests` devolve o repositório inteiro em cada nó e estoura o contexto.

## Perímetro do GitHub — estado canônico

**Regra:** qualquer mudança nos campos abaixo atualiza **esta tabela** no mesmo PR. Medido em
2026-11-08 por `github_get_repo` + `github_get_branch_protection`.

| Campo | Estado canônico |
|---|---|
| Branch protection — required checks | **1**: `quality` (app id 15368 = GitHub Actions) |
| Branch protection — `strict` (branch atualizada antes do merge) | **`false`** |
| Branch protection — `enforce_admins` | `false` |
| Branch protection — histórico linear | `true` |
| Branch protection — review obrigatório | **0 aprovações** (deliberado: vários agentes com merge próprio), `dismiss_stale_reviews=true` |
| Branch protection — resolução de conversa obrigatória | `true` |
| Branch protection — force push / deleção | ambos **bloqueados** |
| Merge | `allow_squash_merge=true` · `allow_merge_commit=true` · `allow_rebase_merge=true` · `allow_auto_merge=false` · `delete_branch_on_merge=true` |
| Squash | `squash_merge_commit_message=COMMIT_MESSAGES` · `squash_merge_commit_title=COMMIT_OR_PR_TITLE` |
| Secret scanning / push protection | **desligados** |
| Dependabot security updates | **desligado** (o Dependabot de versão está ligado, ver abaixo) |
| Environments / rulesets | nenhum |

Consequências práticas disso:

- **Não há `strict`**: uma PR com CI verde merge mesmo atrasada em relação à `main`. Se o seu merge
  quebrar a `main`, a causa provável é essa — rebase antes de mergear quando outra PR entrou no meio.
- **`allow_auto_merge=false`**: não existe auto-merge aqui; o merge é uma chamada explícita
  (`github_merge_pull_request`, `merge_method: "squash"`).
- **`enforce_admins=false`**: o dono consegue empurrar por cima da proteção. Agente não faz isso.
- **`squash_merge_commit_message=COMMIT_MESSAGES`**: o corpo do commit de squash vem dos commits, não do
  corpo da PR — mais um motivo para 1 commit atômico com mensagem boa.
- **Secret scanning desligado** em repo público: vazamento de credencial **não** dispara alerta nenhum.
  Trate qualquer segredo em arquivo versionado como comprometido.

## Workflows

Hoje existem **2** arquivos em `.github/workflows/`:

- `ci.yml` — job `quality`, `runs-on: ubuntu-latest`, disparado em `push` e `pull_request` nas branches
  `main`/`master`. **É o único check obrigatório.**
- `contexto.yml` — publica a branch gerada `contexto` (ver `docs/agentes/contexto-autonomo.md`). Não
  gateia PR: só roda sobre `refs/heads/main`, em push, no cron de 10 min e em dispatch.

Não há workflow de deploy (o Vercel publica por conta própria) nem de deploy de edge functions.

Passos do job `quality`, em ordem (`.github/workflows/ci.yml`):

| # | Passo | Bloqueia? |
|---:|---|---|
| 1 | `actions/checkout@v7` + `oven-sh/setup-bun@v2` (`bun-version: latest`) | — |
| 2 | `bun install --frozen-lockfile` | ✅ |
| 3 | **Security Audit** — `bun audit --audit-level=high`, falha só com `high`/`critical` de runtime | ✅ |
| 4 | `bun run lint` | ✅ |
| 5 | `bun run typecheck` (projetos app e node explícitos, sem emissão) | ✅ |
| 6 | **Integridade das instruções de agente (GA02)** — `scripts/ci/check-claude-md-integrity.mjs` | ✅ |
| 7 | **Guardas das automações de contexto** — 89 suítes `node:test` dos produtores (`docs/agentes/contexto-autonomo.md`) | ✅ |
| 8 | **Guarda das migrations** — `scripts/db-audit/check-migration-drift.mjs` (`scripts/db-audit/README.md`) | ✅ |
| 9 | `bun run test:ci` (vitest + coverage, thresholds em `vitest.config.ts`) | ✅ |
| 10 | Cache + `bun playwright install --with-deps chromium` | — |
| 11 | **E2E Gate** — `tests/e2e/smoke.spec.ts` + `tests/auth-flow.spec.ts` | ✅ |
| 12 | E2E não-bloqueante — `tests/e2e/happy-paths.spec.ts` | `continue-on-error: true` |
| 13 | Generate Audit PDF (`md-to-pdf audit_report.md`) | `continue-on-error: true` |
| 14 | Upload Artifacts (`ci-artifacts`: PDF, `playwright-report/`, `coverage/`) | `if: always()` |

Fatos que já custaram retrabalho:

- **Em PR do Dependabot os secrets não existem.** O job define
  `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` com fallback de placeholder justamente por isso —
  não remova o fallback, senão todo PR do Dependabot volta a falhar no build.
- **`happy-paths.spec.ts` é `continue-on-error` de propósito**: os casos exigem conta de teste dedicada
  e hoje navegam para rota protegida sem autenticar. Não promova esse passo a bloqueante sem antes criar
  a conta e corrigir os seletores.
- **O gate só cobre rotas públicas e guardas de auth.** Nenhum fluxo logado é verificado em CI; não trate
  CI verde como prova de que uma tela logada funciona.
- **`bun run typecheck` verifica app e node explicitamente**. `tsc --noEmit` sozinho na raiz não verifica
  nada (`tsconfig.json` com `"files": []` + `references`); preserve os dois `-p` no script.
- **Dependabot** (`.github/dependabot.yml`): npm semanal segunda 09:00, limite 10 PRs, grupo único
  `dependencies` restrito a `minor`+`patch`, com majors de `typescript`, `tailwindcss` e
  `@hookform/resolvers` ignorados (upgrade exige migração manual); `github-actions` semanal, limite 5.
  Não desfaça esses `ignore` sem fazer a migração — foi por isso que a PR #18 teve de ser fechada
  (`PENDENCIAS.md`, P-002).
- **Copilot Code Review** roda como check dinâmico e já apareceu vermelho em PR com o `quality` verde.
  Ele **não** é check obrigatório: não bloqueia merge e não é motivo para patch.
- **Ambos os lockfiles estão versionados** (`bun.lock` e `package-lock.json`). O CI usa
  `bun install --frozen-lockfile`: mexeu em dependência sem atualizar o `bun.lock`, o passo 2 falha.

## Guardas do CI que você pode rodar antes do PR

- `node scripts/ci/check-claude-md-integrity.mjs` (GA02; se mexer em `AGENTS.md`, `CLAUDE.md` ou
  `docs/agentes/`: exige os cabeçalhos obrigatórios do `AGENTS.md` e barra o conjunto
  `AGENTS.md` + `CLAUDE.md` + `docs/agentes/*.md` encolher >30%, ou um arquivo vigiado sumir/encolher >50%).
  No CI roda com `CLAUDE_MD_BASE=FETCH_HEAD` depois de `git fetch --depth=1 origin main`; local, sem a
  variável, compara com o `HEAD`.
- `node scripts/ci/commit-msg-lint.mjs <arquivo>` (o mesmo que o hook `commit-msg` chama).
- `npx eslint <arquivos>` e `npx vitest run <caminho>` só no que você tocou.
