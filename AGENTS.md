# AGENTS.md — Task Gifts V2

Regras do dono para qualquer agente de IA; vencem `docs/estado/`, `ESTADO_ATUAL.md` e os demais
relatórios da raiz (histórico). Detalhe em `docs/agentes/<tema>.md`; divergiu da realidade → corrija
no mesmo PR do fix. Responda sempre em PT-BR.

Sistema: **Plataforma de gamificação e engajamento corporativo — Promo Brindes**.
Repo `adm01-debug/Task_Gifts_V2`, branch `main`, **público**. Produção: https://task-gifts-v2.vercel.app

## Postura
- O dono não é dev: decide negócio; o agente executa a engenharia inteira via MCP. Nunca passo manual do
  dono nem pedir que ele revise diff.
- Qualidade + velocidade, mínimo de tokens. Decida como dev sênior; pergunte só com custo, arquitetura,
  dado destrutivo em produção, trade-off de negócio ou item "chame o dono". Para ler, não peça permissão.
- Verdade acima de validação: não sabe → diga; falhou → diga. Afirmação sobre código cita evidência
  (arquivo:linha, diff, saída de comando); sem evidência = "NÃO VERIFICADO" + motivo; nunca "testado" sem
  ter rodado. Branch/commit/PR não provam nada — leia o código.
- Diff mínimo, zero churn: causa raiz, não reescrita; não refatore, renomeie ou comente o que não foi pedido;
  não reescreva arquivo inteiro para mudar 3 linhas. Dependência nova ou bump major só se indispensável
  (avise na PR; `.github/dependabot.yml` já ignora majors de `typescript`, `tailwindcss` e `@hookform/resolvers`).
- `APROVADO` = execute o plano como descrito, sem reconfirmar.
- Uma tarefa por vez, cada uma com sua branch/PR. Outro bug → "Próximos passos". Travou → reporte o erro
  exato e pare; não contorne regra. Releia o pedido antes de concluir.
- Tokens: leia só o trecho necessário; grafo antes de busca por texto; exploração ampla → subagente;
  nenhuma tool "por garantia"; não gere código que não será aplicado.
- Segredos nunca em código, commit ou resposta — só em env/secret do serviço (edge: `supabase secrets set`
  ou painel do Supabase; front: env var do Vercel, e `VITE_*` é público). **Este repo é público:** qualquer
  credencial em arquivo versionado está exposta ao mundo (ver `docs/agentes/banco.md` > "Segredo exposto").
  Nunca imprima nem commite `.env`, `service_role` ou a URL do gateway do `.mcp.json`.

## Bugs e funcionalidades
- Diagnóstico antes de patch: logs e estado real, ponto exato (arquivo:linha), causa; várias causas → liste
  todas, corrija a pedida.
- Antes da PR: lint/typecheck/testes do que tocou. Só erro seu conta; erro herdado da `main` → "Próximos passos".
- "Pronto" = PR mergeada + deploy confirmado + comportamento verificado (log, query ou request real); faltou
  um → diga onde parou.
- Funcionalidade pronta = integrada ponta a ponta (rota registrada em `src/App.tsx`, entrada na UI,
  hook/service chamado, edge function **deployada e na allowlist** `VITE_DEPLOYED_EDGE_FUNCTIONS`, tabela com
  RLS, estados erro/loading/vazio, submit), sem mock, hardcode ou TODO. Pela metade não é pronto; não cabe na
  sessão → entregue o funcional e liste o que falta, em ordem, com arquivos. Nunca deixe código morto ou
  feature "quase" sem dizer.
- Cuidado específico deste repo: há feature completa no código e **inalcançável em produção** (edge sem
  deploy, `verify_jwt` ligado, rota não registrada, link para rota inexistente). Antes de dizer "existe",
  confira o caminho inteiro — ver `docs/agentes/edge-functions.md` e `docs/agentes/regras-dominio.md`.

## Comunicação
- Resultado primeiro, só o que muda decisão do dono. Sem introdução, recapitulação, narração, hedging,
  disclaimer, lição de moral ou cortesia. Efeito no negócio; técnica só se perguntarem. Resposta e plano
  proporcionais ao tamanho do fix; não despeje log — cite a linha que importa. Caminhos, comandos e links
  completos. Destrutivo de verdade: uma linha ("isso apaga X, sem volta — confirma?").
- Toda execução fecha com exatamente 3 "Próximos passos" (`N. [título] — [por quê] · [arquivo]`), por
  impacto, do que você viu, executáveis via MCP, para não-dev; nada de genérico ("adicionar testes",
  "melhorar documentação", "revisar segurança"). É um menu: `1`, `1 e 3`, `APROVADO 2`, "todos" ou o bloco
  devolvido = executar na ordem, sem reconfirmar. Só consulta, já rejeitadas ou nada pendente →
  `Próximos passos: nada pendente neste escopo.`

## Fluxo Git — detalhe em `docs/agentes/github-ci.md`
- Repo `adm01-debug/Task_Gifts_V2`, `main`, público. Escrita no GitHub: MCP **`GITHUB - MCP - FOREVER`**
  (`github_push_files`: `files` + `delete` num commit); `git push`/`gh` só em repo autorizado na sessão.
- Nunca commite em `main`. Só escreva em branch que **você** criou nesta sessão; branch alheia ou já
  existente é somente leitura. Antes do push, confira que o último commit é seu.
- PR aberta nos mesmos arquivos → pare e avise o dono (liste via `github_graphql`).
- Branch de `main` atualizado: `claude/<fix|feat|chore|infra>-<slug>-<AAMMDD-HHMM>`.
- Commit PT-BR, 1 atômico, `<tipo>(<escopo>): <assunto ≥10 chars, sem ponto>`; tipos só os do hook
  `commit-msg` (`scripts/ci/commit-msg-lint.mjs`): `feat fix docs style refactor perf test build ci chore
  security revert` (não há `infra:` — branch `infra` → `ci:`/`chore:`).
- PR sempre: título = o que muda; corpo = causa + o que foi verificado, com evidência. Preencha o
  `.github/PULL_REQUEST_TEMPLATE.md` com o que você realmente rodou — checkbox marcada sem execução é mentira.
- Mergeie sem aprovação (squash, apague a branch) PR sua pronta: CI verde (check obrigatório `quality`), sem
  conflito, escopo comum (front, edge, docs, config). **Deixe aberta e chame o dono**: DDL/migration em
  produção; CI/workflows, segredos, Dockerfile, branch protection; deleção de dado, arquitetura ou custo;
  conflito com PR de outro agente.
- Conflito: rebase em `main`; `--force-with-lease` só na sua branch. `main` não aceita force-push nem
  deleção (branch protection) e exige histórico linear.
- Merge = produção: o Vercel publica automaticamente no push da `main`. Confira o deploy e reporte. CI
  vermelha → leia o resumo da falha antes de qualquer patch; do seu merge → `fix:` em branch nova na mesma
  sessão.
- Fim: link da PR + estado.

## Banco — ler `docs/agentes/banco.md` antes de SQL, migration ou deploy
- **Em uso (produção): `eidsaqymojyuhprobfpn`** — é o que o app lê em `VITE_SUPABASE_URL` e o que o MCP
  `supabase` do `.mcp.json` alcança. `supabase/config.toml:1` está alinhado com produção (corrigido no PR #33).
- SQL pelo MCP **`supabase`** (gateway em `.mcp.json`) — tem acesso total (DDL e DML). O ledger
  `supabase_migrations.schema_migrations` **existe** e fecha com o repo (281 versões para 281 arquivos,
  0 fora do padrão — medido em 2026-11-24T17:46Z, ver `docs/agentes/banco.md`), mas ele só prova que a
  versão foi **marcada** como aplicada, não que o SQL de cada arquivo rodou: o estado real é a verdade
  (`pg_get_functiondef`,
  `pg_policies`, `information_schema`).
- MCPs de nome parecido disponíveis na sessão que **não são deste projeto** (confira qual carregou):
  `pgxfvjmuubtbowutlide` ("SUPABASE - GESTÃO DE CLIENTES", CRM) e `doufsxqlfjyuvxuezpln`
  ("SUPABASE - GESTÃO DE PRODUTOS", Catálogo) — **só leitura**, nunca migration a partir deste repo.
- Diagnóstico = produção só leitura; teste de comportamento de banco = Postgres descartável. DDL só pelo
  fluxo de `banco.md` (arquivo em `supabase/migrations/` → PR → merge → deploy do código → apply; nunca de
  branch aberta). Migration idempotente (`IF NOT EXISTS` / `ON CONFLICT`). Destrutivo, segredos e rotação:
  só com o dono.

## Serviços
- **Edge Functions (Supabase)** — ler `docs/agentes/edge-functions.md` ao mexer em qualquer função de
  `supabase/functions/`. 37 funções (cada uma com `index.ts`) + `_shared`. **Não há workflow de deploy**: é `supabase functions deploy`
  manual. `supabase/config.toml` só desliga JWT em `migrate-helper` — toda outra função exige JWT do app,
  o que torna webhook externo (Bitrix24, `external-*`) inalcançável. O front só chama função listada em
  `VITE_DEPLOYED_EDGE_FUNCTIONS` (`src/lib/edgeAvailability.ts`).
- **Vercel** — ler `docs/agentes/vercel-deploy.md` ao confirmar deploy ou mexer em env/domínio. Projeto
  `task-gifts-v2`, team `juca` (`juca1`). Merge em `main` = deploy do front. SPA pura (`vercel.json` reescreve
  tudo para `/index.html`): **não há serverless**, logo nenhum segredo de servidor deveria existir lá —
  e existem (ver o doc). `VITE_*` entra no bundle e é público.
- **GitHub/CI** — ler `docs/agentes/github-ci.md` ao mexer em settings, branch protection ou
  `.github/workflows/`. Um único workflow (`ci.yml`, job `quality`) e ele é o único check obrigatório.
- **Regras de domínio** — ler `docs/agentes/regras-dominio.md` ao mexer em kudos, loja/resgates, missões,
  trilhas, ligas, push/e-mail ou integração Bitrix24.
- **Contexto autônomo** — ler `docs/agentes/contexto-autonomo.md` ao mexer em `scripts/ai-context/`,
  `scripts/regras_negocio/`, `scripts/supabase_snapshot/` ou `.github/workflows/contexto.yml`. Três
  produtores regeneram o estado REAL (código, banco ao vivo, regras de negócio) a cada 10 min e publicam na
  branch **`contexto`**; o job `banco` está desligado até o secret `SUPABASE_DB_URL` existir.

## Stack e comandos — detalhe em `docs/agentes/mapa-repo.md`
- Vite 8 + React 19 + TS 5.9 (`src/`), Supabase (`supabase/functions/`, `supabase/migrations/`),
  Vitest (`src/**/*.{test,spec}.{ts,tsx}`), Playwright (`tests/`), Storybook 10 (`.storybook/`),
  **bun 1.4** (`bun install --frozen-lockfile`), Node 24 no Vercel. `package-lock.json` também está
  versionado, mas o CI e o Vercel usam `bun.lock` — mexeu em dependência, atualize o `bun.lock`.
- `bun run lint` · `bun run test` (vitest) · `bun run test:ci` (coverage, thresholds em `vitest.config.ts`) ·
  `bun playwright test tests/e2e/smoke.spec.ts tests/auth-flow.spec.ts` (o gate do CI).
- **`bun run typecheck` verifica app e configuração Vite** com `-p tsconfig.app.json` e
  `-p tsconfig.node.json`, sem emitir arquivos. Preserve os projetos explícitos: `tsconfig.json` tem
  `"files": []` + `references`, e `tsc --noEmit` sozinho não segue essas referências.
- `postinstall` roda `scripts/patch-recharts.cjs`, que **muta `node_modules`** (silencia um `console.warn`
  do recharts); cache de CI que restaura `node_modules` sem rodar `postinstall` perde o patch.
- Hooks do husky: `pre-commit` (`npx lint-staged` → `eslint --fix` + `vitest related` nos `.ts/.tsx`,
  `prettier --write` nos `.json`), `commit-msg` (`scripts/ci/commit-msg-lint.mjs`).
- Guarda do CI que você pode rodar antes do PR: `node scripts/ci/check-claude-md-integrity.mjs` (GA02 — se
  mexer em `AGENTS.md` ou `docs/agentes/`: exige os cabeçalhos do `AGENTS.md` e barra o conjunto
  `AGENTS.md` + `CLAUDE.md` + `docs/agentes/*.md` encolher >30%).
- **Antes de qualquer tarefa**, leia o contexto gerado (é mais novo que qualquer relatório da raiz):
  `git fetch origin contexto && git show origin/contexto:docs/contexto/00-INDEX.md`. Ele diz qual fonte
  é dona de cada fato e o frescor de cada uma. Gerar local: `bun run contexto:codigo` / `contexto:regras`.
- Antes de buscar por texto: `docs/agentes/mapa-repo.md` diz onde fica cada coisa. `docs/estado/`,
  `ESTADO_ATUAL.md`, `INVENTARIO_FUNCIONALIDADES.md`, `RELATORIO_CI.md` e os `*_AUDIT*.md` da raiz são
  auditoria de **2026-08**: contexto, **não** fonte de verdade (vários achados já foram corrigidos).
- Automação em `scripts/<nome>/` com README (leia antes de alterar); nunca em `supabase/` nem `src/`.

## Grafo de código (graphify)
Grafo em `graphify-out/` (`bun run graph:setup`; detalhes em `docs/agentes/mapa-repo.md`). Quando
`graphify-out/graph.json` existir: `graphify query "<pergunta>"`, `graphify path "<A>" "<B>"`,
`graphify explain "<conceito>"` antes de buscar por texto; `GRAPH_REPORT.md` só para revisão ampla.
Alterou código ou o report não é do HEAD atual → `graphify update .` (só AST, sem custo de API). Em nuvem
o grafo é gerado em segundo plano (`.claude/hooks/session-start.sh`) — siga sem ele até terminar.
