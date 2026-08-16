# Dimensão 7 — Infra, CI e Testes

> Documento de detalhe da auditoria de estado — 1.618 casos de teste, pipeline e build.
> Evidência em `arquivo:linha`. Correções da Fase D estão em `ESTADO_ATUAL.md` e em `04-dados-e-runtime.md`.
> Runtime de build/teste = `NAO_VERIFICADO` (node_modules ausente no ambiente da auditoria).

---

# Auditoria — Testes e Infra (task-gifts-v2)

> **Método**: análise estática apenas. `node_modules` NÃO está instalado neste ambiente.
> **Nenhum teste, lint, typecheck ou build foi executado.** Todo comportamento de runtime está
> marcado `NAO_VERIFICADO`. Nenhum arquivo foi editado.

---

## Cobertura de testes (quantitativa)

Inventário completo de arquivos `*.test.*` / `*.spec.*` no repositório (excluindo `node_modules`):

| Grupo | Arquivos | `describe` | `it`/`test` | `expect` | Linhas | Runner que o executa |
|---|---:|---:|---:|---:|---:|---|
| `src/test/*.test.ts(x)` | 122 | 364 | 1552 | 3774 | 21.996 | vitest ✅ |
| `src/tests/unit/*.test.ts(x)` | 16 | 35 | 38 | 81 | 1.012 | vitest ✅ |
| `src/components/shop/__tests__/ProductGridLoading.test.tsx` | 1 | 1 | 3 | 6 | 140 | vitest ✅ |
| `tests/*.spec.ts` + `tests/e2e/*.spec.ts` | 3 | 4 | 17 | 28 | 177 | playwright ✅ |
| `supabase/functions/external-webhook/validation.test.ts` | 1 | 0 | 8 (`Deno.test`) | 11 `assert*` | 99 | **NENHUM** ❌ |
| **TOTAL arquivos de teste** | **143** | 404 | 1618 | — | 23.424 | |
| `src/stories/**` (29 `.stories.tsx` + 1 `.mdx`) | 30 | 0 | 0 | 0 | 7.195 | **NENHUM** ❌ |

Notas de contagem:
- `src/test/` tem 123 entradas; `src/test/setup.ts` (`src/test/setup.ts:1`) não é teste, é o `setupFiles` do vitest → 122 arquivos de teste.
- O escopo informado ("123 arq, ~21.9k linhas") confere: 21.996 linhas medidas em `src/test/`.
- 2 arquivos de teste **fora** do escopo informado foram encontrados e são materiais:
  `src/components/shop/__tests__/ProductGridLoading.test.tsx` (roda) e
  `supabase/functions/external-webhook/validation.test.ts` (não roda).
- `src/stories/` tem **0 `play:` functions** (grep: 0 arquivos). Mesmo com `@storybook/addon-interactions`
  instalado (`package.json:53`), não há nenhuma interação testável. As 7.195 linhas de stories são
  documentação visual, não cobertura.

### Alvos importados (armadilha (e) — ALVO INEXISTENTE)

Resolvi **todos** os specifiers `@/…`, `./…`, `../…` de `import`, `await import()` e `vi.mock()`
dos 139 arquivos vitest contra o disco (extensões `.ts/.tsx/.js/.jsx/index.*`):

**0 alvos inexistentes.** Nenhum teste importa módulo removido. Esta armadilha está limpa no nível
de módulo — mas ver a variante e2e (seletores CSS inexistentes) na tabela abaixo.

---

## Testes que não protegem

| Armadilha | Arquivo:linha | Explicação |
|---|---|---|
| **(a) TESTE-ESPELHO — total** | `src/test/external-db-bridge.test.ts:5-113` | Comentário no topo confessa: `// Extracted logic from AdminTelemetria + external-db-bridge`. O arquivo (1.099 linhas, 25 `describe`) **não importa um único módulo da aplicação** — só `vitest` e `date-fns`. Redefine 8 funções localmente (`classifySeverity:8`, `validateTelemetryPayload:15`, `severityIcon:33`, `formatDuration:42`, `formatTime:47`, `getTimeThreshold:56`, `buildTelemetryRow:67`, `generateCSVContent:93`). |
| **(a) — prova por shadowing** | `src/test/external-db-bridge.test.ts:47` e `:56` | `formatTime` e `getTimeThreshold` são **exports reais** de `src/pages/AdminTelemetria.tsx:60` e `:44`. O corpo copiado é byte-a-byte idêntico ao original. Trocar a implementação real por `return ""` não quebraria nenhum dos 25 `describe`. |
| **(a) — prova por shadowing** | `src/test/external-db-bridge.test.ts:8` e `:15` | `classifySeverity` e `validateTelemetryPayload` são funções reais de `supabase/functions/external-db-bridge/index.ts:33` e `:40` (usadas em `:113`, `:121`, `:162`, `:176`, `:265`). Cópias idênticas no teste. A edge function real **não tem runner algum**. |
| **(a) TESTE-ESPELHO — auto-declarado** | `src/test/pushFlow.simulation.test.ts:11-13` | Docstring: *"Espelha o comportamento canônico do código real. Se as regras mudarem em `pushSubscriptionService.ts` ou em `send-campaign-push/index.ts`, os specs abaixo devem ser atualizados juntos."* Zero imports da app; 6 funções locais (`isPreviewHost:18`, `isSupported:29`, `simulateSubscribe:56`, `classifyPushOutcome:71`, `isRetryable:78`, `wantsChannel:94`). O `it` final (`:338`) chega a afirmar *"suíte total roda >=900 asserções combinatórias"* — 900 asserções sobre código que não é o de produção. |
| **(a) TESTE-ESPELHO — parcial (~90%)** | `src/test/bingoRpc.simulation.test.ts:4` e `:48` | *"Espelha, em memória, o comportamento canônico das duas funções SQL"* + `/** Réplica determinística do banco necessário para as duas RPCs. */` (classe `BingoDb`). Das 500 linhas, ~449 exercitam a réplica; só `:449-490` tocam `@/services/bingoService` (via `await import()`), e apenas para verificar normalização de string. A lógica de idempotência/pagamento testada é a do teste, não a do Postgres. |
| **(a) TESTE-ESPELHO — parcial (~87%)** | `src/test/telemetry.test.tsx:43-330` | 598 linhas; o único import de app é `TelemetryCharts` (`:5`), usado só em `:333-411` (~78 linhas). O bloco `describe("Telemetry Data Computation")` (`:43`) testa cálculos locais. Pior: **7 blocos `describe` têm nome idêntico** aos de `external-db-bridge.test.ts` (`Duration color thresholds`, `Filter combinations`, `Operation types`, `Severity badge mapping`, `Top offenders computation`, `formatDuration`, `formatTime`) — a mesma lógica-fantasma é testada duas vezes. Ex.: `telemetry.test.tsx:433` é linha idêntica a `external-db-bridge.test.ts:783`. |
| **(a) TESTE-ESPELHO — parcial** | `src/test/engagementDiagnostics.simulation.test.ts:15` e `:30` | `* Réplicas puras da lógica de banco, para simular cenários sem tocar no Postgres.` e `// espelha o WHERE do SQL: normalized IS NOT NULL AND weight > 0`. Funções locais `aggregatePillar`, `npsScore`, `pearson`. |
| **(a) TESTE-ESPELHO — parcial** | `src/test/continuousEngagement.simulation.test.ts:145` | `/** Réplica da agregação que a Fase 2 executará no banco. */` — testa lógica que, pela própria docstring, **ainda não existe** no banco. Teste verde sobre feature futura. |
| **(a) TESTE-ESPELHO — parcial (2 de 5 casos)** | `src/test/certificates.simulation.test.ts:7-14`, casos em `:17` e `:23` | `/** Reproduz o gerador do banco… */ function fakeCode()`. O caso `:17` (`"gera códigos sempre no formato público esperado (500 cenários)"`) asserta `fakeCode(seed)` contra um regex — 500 iterações testando o próprio `fakeCode`. O caso `:23` asserta que a constante local `ALPHABET` (`:5`) não contém `0/O/1/I` — asserção sobre um literal escrito 18 linhas acima. Os 3 casos restantes (`:29`, `:39`, `:45`) usam o alvo real e são válidos. |
| **(b) SUÍTE DESLIGADA + (c) env indefinida** | `src/test/rls.test.ts:18` | `const describeIf = hasEnv ? describe : describe.skip;` com `hasEnv = !!(VITE_SUPABASE_URL && VITE_SUPABASE_ANON_KEY)` (`:8-10`). **`VITE_SUPABASE_ANON_KEY` não existe em lugar nenhum**: o `.env` versionado define `VITE_SUPABASE_PUBLISHABLE_KEY`, não `ANON_KEY`. Logo `hasEnv` é sempre `false` e os **3 casos de RLS estão permanentemente pulados**. |
| **(b) + (c)** | `src/test/rpcAccess.test.ts:22` | Mesmo padrão (`:12-14`). **9 casos de teste** permanentemente pulados (4 `it` + 1 `it` dentro de `for` sobre 5 RPCs, `:26-41`) — cobrindo `get_executive_metrics`, `get_security_stats`, `get_2fa_status`, `validate_reset_token` etc. Comentário em `:9-10` assume que os testes "são pulados para não falhar builds" — o efeito real é que **toda a camada de teste de segurança (12 casos) nunca executou**. |
| **(b) — prova de que nunca rodou** | `src/test/rls.test.ts:38` | `const { error } = await anonClient.from('profiles')…` — **`anonClient` não está declarado neste escopo** (declarado só dentro dos casos `:22` e `:49`). É um `ReferenceError` garantido. O código sobreviveu no repo porque o `describe.skip` impede a execução. |
| **(b) — prova de que nunca rodou** | `src/test/rpcAccess.test.ts:53` | Idêntico: `await anon.rpc(…)` com `anon` não declarado no escopo do caso `get_user_stats_api`. `ReferenceError` latente. |
| **(b) ASSERÇÃO COMENTADA** | `tests/e2e/happy-paths.spec.ts:17` | `// await expect(page).toHaveURL(/.*dashboard/);` — o caso `1. Login Flow` preenche e-mail/senha, clica em submit e **não asserta nada depois**. A única asserção viva (`:8`) é o redirect *antes* do login. O teste passa mesmo que o login esteja 100% quebrado. |
| **(c) ASSERÇÃO VACUAMENTE VERDADEIRA** | `tests/e2e/smoke.spec.ts:64-72` | `service worker/PWA manifest disponível`: todas as asserções estão dentro de `if (manifest && manifest.ok())`. O `webServer` do Playwright roda `bun run dev` (`playwright.config.ts:21`) e o `VitePWA` **não tem `devOptions.enabled`** em `vite.config.ts:14-147` → nenhum SW/manifest é gerado em dev. Além disso o teste busca `/manifest.json`, mas o vite-plugin-pwa emite `manifest.webmanifest`. O `if` nunca é verdadeiro → **teste com zero asserções, sempre verde**. |
| **(c) ASSERÇÃO CONDICIONAL** | `src/test/rls.test.ts:30-34` | `if (error) { console.log(...) } else { expect(data).toBeDefined() }` — qualquer resultado passa. Mesmo se executasse, não protegeria nada. |
| **(c) CORPO VAZIO** | `supabase/functions/external-webhook/validation.test.ts:20-31` | `Deno.test("Bitrix24 Webhook Contract - Invalid (Missing ID)", …)` — o corpo inteiro são **3 linhas de comentário** e nenhuma asserção. Único dos 8 `Deno.test` sem nenhum `assert*`. |
| **(d) SEM RUNNER** | `supabase/functions/external-webhook/validation.test.ts:1-98` | Ver seção de globs abaixo. 8 `Deno.test`, 11 asserções, **nenhum pipeline o executa**. |
| **(d) SEM RUNNER** | `src/stories/**` (30 arquivos, 7.195 linhas) | Sem script `storybook`/`build-storybook` em `package.json:6-16`; sem `test-storybook`; 0 `play:`. Nada os executa nem sequer os compila. |
| **(e) ALVO INEXISTENTE — variante e2e** | `tests/e2e/happy-paths.spec.ts:35`, `:44`, `:53` | Os seletores `.kudos-balance`, `.shop-item` e `.rank-badge` **não existem em nenhum arquivo de `src/`** (grep em `*.tsx`/`*.ts`/`*.css`: 0 ocorrências). Os casos 3, 4 e 5 falham por definição. `.quest-card` (`:26`) existe apenas em `src/components/dashboard/DashboardLeftColumn.tsx`, não na rota `/quests` navegada. |
| **(e) — falha estrutural** | `tests/e2e/happy-paths.spec.ts:20-55` | Os 4 casos navegam para `/quests`, `/kudos`, `/shop`, `/profile` **sem autenticar**. `tests/e2e/smoke.spec.ts:24-33` prova que rota protegida redireciona para `/auth`. Logo os 4 casos falham sempre, mesmo com os seletores corretos. |

### Contagem por armadilha

| Armadilha | Arquivos afetados | Casos de teste afetados (estimativa estática) |
|---|---:|---:|
| (a) TESTE-ESPELHO total (0 imports do alvo) | **2** (`external-db-bridge`, `pushFlow`) | ~150 `it` / 1.441 linhas |
| (a) TESTE-ESPELHO parcial (importa mas replica o núcleo) | **5** (`bingoRpc`, `telemetry`, `engagementDiagnostics`, `continuousEngagement`, `certificates`) | ~1.800 linhas de lógica replicada |
| (a) — sem qualquer import de app (inclui os 2 do (b)) | **4** (`external-db-bridge`, `pushFlow`, `rls`, `rpcAccess`) | — |
| (b) SUÍTE DESLIGADA (`describe.skip`) | **2** (`rls.test.ts:18`, `rpcAccess.test.ts:22`) | **12 casos** (3 + 9) |
| (b) asserção comentada | **1** (`happy-paths.spec.ts:17`) | 1 caso |
| (c) VACUAMENTE VERDADEIRA / condicional / corpo vazio | **4** (`smoke.spec.ts:64`, `rls.test.ts:30`, `rpcAccess` 12 casos dependentes de env, `validation.test.ts:20`) | ~15 casos |
| (d) SEM RUNNER | **31** (1 Deno + 30 stories) | 8 `Deno.test` + 7.195 linhas de story |
| (e) ALVO INEXISTENTE (módulo) | **0** | 0 |
| (e) ALVO INEXISTENTE (seletor e2e) | **1** (`happy-paths.spec.ts`) | 3 casos |

`describe.skip` / `it.skip` / `xit` / `.todo` no repositório inteiro: **2 ocorrências** — ambas o mesmo
padrão `describeIf`. Não há `.only` em lugar nenhum (bom).

**Zero** ocorrências de `expect(true).toBe(true)`, `expect(undefined).toBe(undefined)` ou similares
literais. A vacuidade neste repo é estrutural (env gate, `if` guard, asserção comentada), não literal.

---

## Glob do runner x localização real dos testes

### vitest — `vitest.config.ts:11`
```
include: ["src/**/*.{test,spec}.{ts,tsx}"]
setupFiles: ["./src/test/setup.ts"]
```

| Localização real | Casa o glob? | Arquivos |
|---|---|---:|
| `src/test/*.test.ts(x)` | ✅ sim | 122 |
| `src/tests/unit/*.test.ts(x)` | ✅ sim | 16 |
| `src/components/shop/__tests__/*.test.tsx` | ✅ sim | 1 |
| `tests/*.spec.ts`, `tests/e2e/*.spec.ts` | ❌ não (fora de `src/`) | 3 — correto, são do Playwright |
| `supabase/functions/**/*.test.ts` | ❌ **não** | **1 — órfão** |

### playwright — `playwright.config.ts:4`
```
testDir: './tests'      (testMatch default: **/*.@(spec|test).?(c|m)[jt]s?(x)`)
```

| Localização real | Casa? | Arquivos |
|---|---|---:|
| `tests/auth-flow.spec.ts` | ✅ sim | 1 |
| `tests/e2e/happy-paths.spec.ts`, `tests/e2e/smoke.spec.ts` | ✅ sim (recursivo) | 2 |
| `src/**` | ❌ não | — correto, sem sobreposição com vitest |

### Veredito sobre os globs

**Os globs `src/test` vs `src/tests` vs `tests/e2e` estão CORRETOS e não se sobrepõem.**
A duplicação de diretórios (`src/test` e `src/tests`) é feia e confunde, mas `src/**` cobre os dois e
`./tests` cobre o e2e. Não há teste vitest perdido dentro de `src/`, nem spec Playwright perdido dentro
de `tests/`.

**Existe exatamente uma órfã real:** `supabase/functions/external-webhook/validation.test.ts`.
Não casa com `src/**` (vitest) nem fica em `./tests` (playwright); usa `Deno.test` + import remoto
`https://deno.land/std@0.168.0/testing/asserts.ts`, que o vitest/jsdom não executaria nem se casasse.
Não há script `deno test` em `package.json:6-16` nem step de Deno no CI. São **8 testes de contrato de
webhook (Bitrix24, External, Dispatcher, versionamento v1/v2) que nunca rodaram**.

**Ressalva que domina tudo:** o glob local estar certo é irrelevante em CI, porque
`.github/workflows/ci.yml` é YAML inválido e **nenhum step executa** (próxima seção). Na prática,
hoje, **0 dos 143 arquivos de teste roda em CI.**

---

## CI — análise do YAML inválido

**Confirmado.** `python3 yaml.safe_load('.github/workflows/ci.yml')` →
```
ParserError: while parsing a block collection
  in ".github/workflows/ci.yml", line 13, column 8
expected <block end>, but found '<block sequence start>'
  in ".github/workflows/ci.yml", line 25, column 9
```

### Onde a indentação quebra, linha a linha

Medição exata da indentação (contagem de espaços à esquerda) das 52 linhas:

| Linhas | Indent | Conteúdo | Situação |
|---|---:|---|---|
| 1, 3, 9 | **1** | `name: CI`, `on:`, `jobs:` | Chaves raiz deslocadas 1 espaço. Legal em YAML (mapping raiz indentado) **desde que consistente** — e aqui é. |
| 2, 8, 15, 18, 21, 24 | **1** | linha "em branco" contendo **um espaço** | Resíduo do mesmo deslocamento. Inofensivo. |
| 4, 6, 10 | 3 | `push:`, `pull_request:`, `quality:` | consistente (raiz+2) |
| 5, 7, 11, 12 | 5 | `branches:`, `runs-on:`, `steps:` | consistente |
| **13, 14, 16, 19, 22** | **7** | `- uses: actions/checkout@v4` … `- name: Type Check` | **Itens da sequência `steps` ancorados na coluna 8 (indent 7).** É aqui que o parser abre o *block collection* — daí a mensagem "in line 13, column 8". |
| 17, 20, 23 | 9 | `run: bun install` / `run: bun run lint` / `run: bun run typecheck` | filhos dos itens acima, consistentes |
| **25** | **8** | `- name: Unit Tests` | ⛔ **A QUEBRA.** Novo `-` na coluna 9 (indent 8), **1 espaço mais fundo** que os itens 13–22. YAML interpreta isso como *início de uma nova sequência aninhada* dentro do último item de mapping, o que é ilegal onde ele aparece → `expected <block end>, but found '<block sequence start>' in line 25, column 9`. |
| 26, 29, 32, 35, 46, 47 | 10 | `run:` / `uses:` / `with:` | filhos do bloco deslocado |
| **27, 30, 33, 44, 52** | **0** | linhas em branco **sem** o espaço | A partir da linha 27 o "espaço fantasma" das linhas em branco desaparece — evidência de que o arquivo foi editado/colado em dois momentos distintos. |
| 28, 31, 34, 45 | **8** | `- name: Install Playwright Browsers`, `- name: E2E Tests`, `- name: Generate Audit PDF`, `- name: Upload Artifacts` | mesmo indent 8 quebrado |
| 36–43, 48–51 | 12–16 | corpo do heredoc e do `path: \|` | irrelevante, o parse já morreu |

**Resumo da quebra:** o arquivo tem um deslocamento global de +1 espaço nas linhas 1–24 (incluindo as
"linhas em branco" que contêm um espaço). A partir da linha 25 o deslocamento **desaparece nas linhas
em branco** mas **os itens de `steps` ganham +1** (7 → 8). O ponto exato de ruptura é a fronteira
**linha 24 → linha 25**.

### Consequência: quais steps nunca executam

Um workflow com YAML inválido **não é parseado pelo GitHub Actions**. Nenhum job é criado, nenhum
runner é alocado, e a execução é marcada como falha imediata ("Invalid workflow file"). Portanto:

| # | Step | Linha | Executa? |
|---:|---|---:|---|
| 1 | `actions/checkout@v4` | 13 | ❌ nunca |
| 2 | `oven-sh/setup-bun@v1` | 14 | ❌ nunca |
| 3 | Install dependencies (`bun install`) | 16-17 | ❌ nunca |
| 4 | **Lint** (`bun run lint`) | 19-20 | ❌ nunca |
| 5 | **Type Check** (`bun run typecheck`) | 22-23 | ❌ nunca |
| 6 | **Unit Tests** (`bun run test`) | 25-26 | ❌ nunca |
| 7 | Install Playwright Browsers | 28-29 | ❌ nunca |
| 8 | **E2E Tests** (`bun playwright test`) | 31-32 | ❌ nunca |
| 9 | Generate Audit PDF (`md-to-pdf`) | 34-43 | ❌ nunca |
| 10 | Upload Artifacts | 45-51 | ❌ nunca |

**Não é "os testes falham" — é que nada, absolutamente nada, roda.** Isso explica de forma completa
os 372 workflow runs com 100% de `failure` na amostra (30/30): todo push/PR em `main`/`master`
(`ci.yml:3-7`) dispara um run que morre no parse. Nenhum desses 372 runs jamais executou `bun install`.

**Consequência secundária, mais grave que a primária:** como o CI nunca chegou a rodar `bun run test`,
as regressões acumuladas nos testes (os 12 casos de segurança pulados, os 3 e2e com seletor inexistente,
os 2 `ReferenceError` latentes) **nunca foram sinalizadas a ninguém**. O sinal vermelho constante do CI
mascara o fato de que o conteúdo dos testes também está degradado.

### Correção mínima (não aplicada — auditoria é read-only)
Remover o espaço inicial das linhas 1–24 e realinhar os itens de `steps` das linhas 25, 28, 31, 34, 45
de indent 8 para indent 6 (e seus filhos de 10 → 8, 12 → 10, 14 → 12). Um `yamllint` / `actionlint`
em pre-commit evitaria a recorrência.

---

## Infra e build

Legenda: ✅ ok · 🟨 funciona com risco/inconsistência · 🟦 configurado mas inerte/não exercitado · ⬛ quebrado

| Item | Arquivo:linha | Estado | Avaliação |
|---|---|:--:|---|
| **GitHub Actions CI** | `.github/workflows/ci.yml:25` | ⬛ | YAML inválido. 0 de 10 steps executam. 372 runs, 100% failure na amostra. Não há job de deploy — o CI é só quality gate, e o gate está desligado. |
| **Único pipeline de CI** | `.github/workflows/` | ⬛ | Só existe `ci.yml`. Não há `deploy.yml`, `vercel.json`, `netlify.toml`, `Dockerfile`, `fly.toml`. |
| **Pipelines de deploy concorrentes** | `package.json:19,118`, `.lovable/plan.md`, `.mcp.json` | 🟨 | Não há dois pipelines de deploy no repo. Há **um deploy fora do repo**: a plataforma Lovable (deps `@lovable.dev/cloud-auth-js`, `lovable-tagger`, diretório `.lovable/`). Concorrência real = **Lovable publica sem passar pelo CI do GitHub**, e o CI do GitHub (que seria o gate) está morto. Efeito líquido: **deploy sem nenhum portão de qualidade**. |
| **`typecheck` é no-op** | `tsconfig.json:16-24` + `package.json:11` | ⬛ | `"files": []` + `"references"` faz de `tsconfig.json` um *solution file*. `tsc --noEmit` (sem `--build`) **não resolve as references** → compila **zero arquivos** e sai com código 0. O script `typecheck` passa vacuamente. Correção seria `tsc -b --noEmit` ou apontar para `tsconfig.app.json`. `NAO_VERIFICADO` em runtime (sem `node_modules`), mas é comportamento documentado do TypeScript. |
| **`strict` divergente entre tsconfigs** | `tsconfig.json:6-7` vs `tsconfig.app.json:20-21` | 🟨 | Raiz: `noUnusedLocals: true`, `noUnusedParameters: true`. App: ambos `false`. Como o raiz não compila nada, os valores permissivos do app são os únicos que valeriam — as flags estritas da raiz são decorativas. |
| **ESLint** | `eslint.config.js:23` | 🟨 | `"@typescript-eslint/no-unused-vars": "off"` desliga a regra que mais pega código morto — justamente o tipo de resíduo encontrado nos testes. Sem `eslint-plugin-storybook`, sem `eslint-plugin-playwright`, sem `plugin:vitest`. `ignores: ["dist"]` apenas. |
| **husky pre-commit** | `.husky/pre-commit:1` | 🟨 | Conteúdo: `npx lint-staged`. Instalado via `"prepare": "husky"` (`package.json:14`). Modo do arquivo é **644 (não executável)** e `.git/hooks/` contém **apenas os `.sample`** — ou seja, no clone atual **o hook não está instalado**; só passa a existir após um `npm/bun install` que dispare `prepare`. |
| **lint-staged — `vitest related`** | `package.json:126-130` | 🟨 | `*.{ts,tsx}` → `eslint --fix` + `vitest related --run`. `vitest related` resolve o grafo de imports: como 2 arquivos de teste **não importam nada da app** (`external-db-bridge`, `pushFlow`), eles **nunca serão selecionados** por nenhuma alteração de código-fonte. O gate local tem o mesmo ponto cego dos testes-espelho. |
| **lint-staged — `prettier`** | `package.json:131-133` | ⬛ | `"*.json": ["prettier --write"]` mas **`prettier` não está em `dependencies` nem `devDependencies`**. Qualquer commit tocando um `.json` cai em `npx prettier` → download on-the-fly ou falha do hook. Além disso não há `.prettierrc`, então o formato aplicado é o default, divergente do restante do repo. |
| **dependabot** | `.github/dependabot.yml:1-18` | 🟨 | Bem formado (npm semanal segunda 09:00 com `groups: ["*"]`; github-actions semanal). Mas agrupar **todas** as deps num único PR (`patterns: ["*"]`, limite 10) produz PRs gigantes e infusíveis — e como o CI está quebrado, **todo PR do dependabot chega vermelho** e é irrevisável. Contribui diretamente para os 372 runs falhos. |
| **PWA — configurado** | `vite.config.ts:14-147` | ✅ | `VitePWA` está de fato configurado: `registerType: "autoUpdate"`, manifest completo (nome, ícones 64/192/512, screenshots wide+narrow, 3 shortcuts), `workbox` com `globPatterns` e 4 regras de `runtimeCaching` (Google Fonts, gstatic, API Supabase StaleWhileRevalidate, imagens CacheFirst). **Sim, gera Service Worker** — no `vite build`. |
| **PWA — inerte em dev/teste** | `vite.config.ts:14` (ausência de `devOptions`) | 🟦 | Sem `devOptions: { enabled: true }`, o SW e o manifest **não existem em `bun run dev`**. Como o Playwright sobe justamente o dev server (`playwright.config.ts:21`), o único teste de PWA (`tests/e2e/smoke.spec.ts:64`) nunca encontra o manifest e passa vazio. **A PWA nunca foi validada por nenhum teste.** |
| **PWA — nome do manifest** | `tests/e2e/smoke.spec.ts:66` vs vite-plugin-pwa | 🟨 | O teste pede `/manifest.json`; o plugin emite `manifest.webmanifest`. Mesmo em build o assert erraria o alvo. |
| **PWA — ícones** | `vite.config.ts:33-44` | 🟨 | Referencia `/pwa-192x192.png` e `/pwa-512x512.png`. Não verifiquei presença em `public/` como bloqueante, mas o `includeAssets` (`:16`) lista só `favicon.ico`, `placeholder.svg`, `og-image.jpg` — os PNGs do PWA não estão no `includeAssets`. |
| **CSP x PWA** | `index.html:6` | 🟨 | CSP inline declara `worker-src 'self' blob:` e `manifest-src 'self'` (ok para SW), mas `script-src` inclui `'unsafe-inline' 'unsafe-eval'` — o que anula boa parte do valor da CSP. Fora do meu escopo de segurança; registrado como fato. |
| **Storybook — config** | `.storybook/main.ts:4`, `preview.ts:1-48` | 🟦 | Config válida: stories em `../src/**/*.{mdx,stories.*}`, 3 addons, framework `react-vite`, alias `@`→`/src`, decorator de tema dark/light. Nada de errado no arquivo. |
| **Storybook — sem script** | `package.json:6-16` | ⬛ | **Não existe `"storybook"` nem `"build-storybook"`.** Não há como iniciar nem buildar o Storybook por script. 30 arquivos / 7.195 linhas de stories inalcançáveis. Nenhum step de CI o builda (e o CI não roda de todo jeito). |
| **Storybook — versões incompatíveis** | `package.json:51-56, 93` | ⬛ | `storybook@^10.1.11`, `@storybook/react@^10.1.11`, `@storybook/react-vite@^10.1.11`, `@storybook/addon-a11y@^10.1.11` **misturados com** `@storybook/addon-essentials@^8.6.14`, `@storybook/addon-interactions@^8.6.14`, `@storybook/blocks@^8.6.14`. `addon-essentials` e `addon-interactions` foram absorvidos pelo core a partir do SB 9 e não existem como addons no SB 10. O `.storybook/main.ts:5-9` os lista explicitamente → **o Storybook não subiria mesmo se houvesse script**. `NAO_VERIFICADO` (sem install), mas o desalinhamento major 8↔10 é inequívoco. |
| **`postinstall` patch-recharts** | `package.json:15`, `scripts/patch-recharts.cjs:1-58` | 🟨 | **O que faz:** reescreve `node_modules/recharts/{lib,es6}/util/LogUtils.js`, inserindo um early-return antes de `console.warn(msg)` para suprimir o aviso *"maybe you don't need to use a ResponsiveContainer"*. Usa marcador `// project-patch:…` (`:17`) para ser idempotente. **É frágil, sim, mas com atenuantes:** (+) idempotente via `MARKER` (`:42`); (+) não falha o install — `existsSync` (`:37`) e `includes(ANCHOR)` (`:46`) apenas emitem `console.warn` e seguem; (+) escopo minúsculo. (−) Depende de um **caminho interno** (`util/LogUtils.js`) e de uma **string literal exata** (`console.warn(msg);`) que qualquer patch do recharts pode mudar — nesse caso o patch silenciosamente para de aplicar e o ruído volta sem aviso. (−) Muta `node_modules`, portanto **não sobrevive a cache de CI** que restaura `node_modules` sem rodar `postinstall`. (−) Solução correta seria `patch-package`/`pnpm patch` (versionado e verificável) ou simplesmente filtrar o warning no `setup.ts`. (−) O CI usa `bun install` (`ci.yml:17`) — `bun` executa `postinstall` de scripts do próprio projeto, mas isso é `NAO_VERIFICADO` aqui. |
| **Aliases do Vite** | `vite.config.ts:149-153`, `vitest.config.ts:15-17`, `.storybook/main.ts:22-25`, `tsconfig.app.json:22-26` | 🟨 | Todos mapeiam `@` → `src`, então funcionam. Mas em **4 formas diferentes**: `path.resolve(__dirname,"./src")` (vite), idem (vitest), string literal `"/src"` (storybook), `"./src/*"` (tsconfig). Playwright não tem alias (não precisa). Risco: qualquer alias novo precisa ser replicado em 4 lugares e nada valida a sincronia. |
| **`.filter(Boolean)` órfão** | `vite.config.ts:148` | 🟨 | O array de plugins não contém nenhuma entrada condicional; `.filter(Boolean)` é resíduo do template Lovable, onde havia `mode === "development" && componentTagger()`. |
| **`lovable-tagger` declarado e não usado** | `package.json:118` | 🟨 | Grep no repo inteiro (excluindo lockfiles): **única ocorrência é a própria linha do `package.json`**. Nunca importado. Dependência morta — e é o resíduo que explica o `.filter(Boolean)` acima. |
| **Deps de teste/dev em `dependencies`** | `package.json:51-56, 59-62, 76, 93, 98` | 🟨 | `@storybook/*`, `storybook`, `vitest`, `jsdom`, `@testing-library/{dom,jest-dom,react,user-event}` estão em **`dependencies`**, não `devDependencies`. Não vaza para o bundle (Vite faz tree-shaking pelo grafo de imports), mas infla `npm ci --omit=dev` e confunde auditoria de supply chain. |
| **`manualChunks` estático** | `vite.config.ts:154-167` | ✅ | 6 chunks nomeados (vendor, ui, charts, animation, supabase, query). Razoável. Sem `chunkSizeWarningLimit` ajustado. |
| **`build` sem sourcemaps nem target** | `vite.config.ts:154` | 🟨 | Sem `sourcemap: true`, mas há `@sentry/react` e `@sentry/browser` nas deps (`package.json:47-49`) — **stack traces do Sentry em produção virão minificadas e inúteis**. Não há upload de sourcemap no CI (que também não roda). |
| **Sentry duplicado/conflitante** | `package.json:47-50` | 🟨 | `@sentry/browser@^10`, `@sentry/react@^10`, `@sentry/deno@^10` e `@sentry/tracing@^7.120.4` — o `@sentry/tracing` v7 é pacote **deprecado** e incompatível com o SDK v10 (tracing foi integrado ao core). |
| **`.env` versionado** | `.gitignore` (sem entrada `.env`), `git ls-files` → `.env` | ⬛ | `.env` está **rastreado no git** e **não está no `.gitignore`**. Contém `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_DEPLOYED_EDGE_FUNCTIONS`. Fora do meu escopo (segredos), mas **materialmente relevante para testes**: é por causa da divergência `PUBLISHABLE_KEY` vs `ANON_KEY` que 12 testes de segurança estão mortos. |
| **`.env` vs `.env.example` divergentes** | `.env` vs `.env.example` | ⬛ | `.env.example` documenta `VITE_SUPABASE_ANON_KEY`, `VITE_APP_ENV`, `VITE_APP_NAME`, `VITE_BITRIX_WEBHOOK_URL`, `VITE_ENABLE_ANALYTICS`, `VITE_ENABLE_DEBUG` — **nenhuma delas existe no `.env` real**. E `VITE_SUPABASE_PROJECT_ID`/`PUBLISHABLE_KEY`/`DEPLOYED_EDGE_FUNCTIONS` do `.env` real **não estão no example**. Interseção: só `VITE_SUPABASE_URL`. |
| **CI: step "Generate Audit PDF"** | `ci.yml:34-43` | 🟨 | Gera PDF de `audit_report.md` (4.320 bytes, existe) usando `md-to-pdf` — que baixa **Chromium via Puppeteer** em todo run. Custo alto num pipeline de qualidade; deveria ser job separado/manual. Como nada roda, é hipotético. |
| **`components.json` (shadcn)** | `components.json:1-20` | ✅ | Coerente com `tailwind.config.ts`, `src/index.css` e os aliases `@/components`, `@/lib/utils`, `@/hooks`. Sem divergências. |
| **`index.html`** | `index.html:6` | ✅ (estrutura) | Presente, com CSP inline. Sem `<link rel="manifest">` explícito — correto, o vite-plugin-pwa injeta no build. |
| **`playwright.config.ts`** | `playwright.config.ts:6-8, 20-24` | ✅ | `forbidOnly` em CI, `retries: 2` em CI, `workers: 1` em CI, `reuseExistingServer` só fora de CI. Configuração sã. Único senão: um só projeto (`chromium`), sem cobertura cross-browser/mobile. |
| **`vitest.config.ts`** | `vitest.config.ts:12-13` | 🟨 | `testTimeout: 60000` e `hookTimeout: 30000` — timeouts altíssimos para testes de lógica pura. Mascaram lentidão e loops. Sem `coverage` configurado → **não há métrica de cobertura em lugar nenhum**. Sem `pool`/`threads` tuning para 1.618 casos. |
| **`src/test/setup.ts`** | `src/test/setup.ts:3-23` | ✅ | Polyfills mínimos e corretos: `matchMedia` e `ResizeObserver` (necessário para recharts). Sem `cleanup()` explícito, mas o Testing Library v16 faz auto-cleanup com `globals: true`. |

---

## Achados graves

### 1. ⬛ O CI nunca executou um único comando — 372 runs, 100% de falha no parse
`.github/workflows/ci.yml:25` quebra o YAML (`- name: Unit Tests` em indent 8 contra indent 7 dos itens
das linhas 13–22; agravado pelo deslocamento global de +1 espaço nas linhas 1–24). Workflow inválido não
gera job. **Os 10 steps — checkout, install, lint, typecheck, unit tests, playwright, e2e, PDF, artifacts
— nunca rodaram nenhuma vez.** Isso não é "o CI está vermelho": é que os 143 arquivos de teste,
1.618 casos e 3.889 asserções deste repositório **jamais foram executados por uma máquina de CI**. Todo
o sinal de qualidade do projeto é ficção.

### 2. ⬛ O `typecheck` também é um no-op — o segundo portão está igualmente vazio
`tsconfig.json:16-24` declara `"files": []` com `"references"`. `tsc --noEmit` (`package.json:11`), sem
`--build`, **não segue references e compila zero arquivos**, saindo com sucesso. Portanto, mesmo que
alguém conserte o YAML do CI amanhã, o step "Type Check" continuará passando sem verificar nada. Dois
portões (CI + typecheck) que parecem existir e não existem — o pior modo de falha possível, porque
inspira confiança.

### 3. ⬛ Toda a camada de teste de segurança está morta por uma variável de ambiente que não existe
`src/test/rls.test.ts:18` e `src/test/rpcAccess.test.ts:22` usam
`describeIf = hasEnv ? describe : describe.skip` com `hasEnv` dependendo de **`VITE_SUPABASE_ANON_KEY`**.
Essa variável **não existe**: o `.env` versionado define `VITE_SUPABASE_PUBLISHABLE_KEY`. Resultado:
**12 casos de teste** cobrindo RLS de `profiles`/`kudos` e controle de acesso de 9 RPCs administrativos
(`get_executive_metrics`, `get_security_stats`, `get_2fa_status`, `validate_reset_token`, …) estão
permanentemente pulados. A prova de que nunca rodaram está no próprio código: `rls.test.ts:38` e
`rpcAccess.test.ts:53` referenciam `anonClient`/`anon` **não declarados naquele escopo** — `ReferenceError`
certo, que sobreviveu no repositório porque o `.skip` nunca deixou a linha executar.

### 4. ⬛ ~2.900 linhas de teste testam cópias do código, não o código — com prova de shadowing
`src/test/external-db-bridge.test.ts` (1.099 linhas, 25 `describe`, zero imports da aplicação) declara
no cabeçalho `// Extracted logic from AdminTelemetria + external-db-bridge` (`:5`) e redefine 8 funções.
Três delas — `formatDuration:42`, `formatTime:47`, `getTimeThreshold:56` — são **exports reais e
byte-idênticos** de `src/pages/AdminTelemetria.tsx:55,60,44`; outras duas — `classifySeverity:8`,
`validateTelemetryPayload:15` — são cópias de `supabase/functions/external-db-bridge/index.ts:33,40`.
`src/test/pushFlow.simulation.test.ts:11` confessa o mesmo em português. Somando os mirrors parciais
(`telemetry.test.tsx` ~520/598 linhas, `bingoRpc` ~449/500, `engagementDiagnostics`,
`continuousEngagement`, `certificates`), há **~2.900 linhas de suíte que continuariam verdes se a
implementação real fosse deletada**. Agravante: `lint-staged` usa `vitest related` (`package.json:129`),
que resolve o grafo de imports — **arquivos sem import do alvo nunca serão selecionados** por mudança
no código-fonte, então o gate local tem exatamente o mesmo ponto cego.

### 5. ⬛ A camada e2e é decorativa: 4 dos 5 "happy paths" são impossíveis e o teste de PWA é vazio
`tests/e2e/happy-paths.spec.ts`: o caso `1. Login Flow` tem a **única asserção pós-login comentada**
(`:17`) — passa mesmo com o login totalmente quebrado. Os casos 2–5 (`:20-55`) navegam para `/quests`,
`/kudos`, `/shop`, `/profile` **sem autenticar**, e `smoke.spec.ts:24-33` prova que rota protegida
redireciona para `/auth`; além disso os seletores `.kudos-balance` (`:35`), `.shop-item` (`:44`) e
`.rank-badge` (`:53`) **não existem em nenhum arquivo de `src/`**. Em paralelo,
`tests/e2e/smoke.spec.ts:64-72` (único teste de PWA do repo) encapsula todas as asserções em
`if (manifest && manifest.ok())`, com dois motivos independentes para nunca entrar: o `VitePWA` não tem
`devOptions.enabled` (`vite.config.ts:14`) e o Playwright roda contra `bun run dev`
(`playwright.config.ts:21`); e o teste pede `/manifest.json` quando o plugin emite `manifest.webmanifest`.
**A PWA — 134 linhas de configuração de manifest, workbox e runtime caching — nunca foi exercitada por
teste algum.**

---

### Menções honrosas (não entraram no top 5)

- **`supabase/functions/external-webhook/validation.test.ts`** — 8 `Deno.test` de contrato de webhook
  (Bitrix24/External/Dispatcher, versionamento v1/v2) que **nenhum glob alcança** (`vitest` cobre só
  `src/**`, Playwright só `./tests`, e não há `deno test` em script nem em CI). Um dos 8 (`:20-31`) tem
  o corpo composto **inteiramente de comentários**, sem uma única asserção.
- **Storybook inalcançável** — 30 arquivos / 7.195 linhas, **sem script `storybook` nem `build-storybook`**
  em `package.json`, e com `@storybook/addon-essentials@8` + `addon-interactions@8` listados em
  `.storybook/main.ts:5-9` contra um core `storybook@10` — addons que não existem mais no SB 10.
- **`prettier` fantasma no pre-commit** — `package.json:131-133` chama `prettier --write` em `*.json`
  sem `prettier` declarado em nenhuma seção de dependências e sem `.prettierrc`.
- **Deploy sem portão** — não há dois pipelines de deploy concorrentes no repo (só `ci.yml`, que não
  faz deploy). Mas a plataforma Lovable (`.lovable/`, `@lovable.dev/cloud-auth-js`, `lovable-tagger`)
  publica **fora** do GitHub Actions. Com o CI morto, **o deploy acontece sem nenhum gate de qualidade**.
- **`lovable-tagger`** declarado em `package.json:118` e **nunca importado** (grep: 1 ocorrência, a
  própria declaração) — resíduo que também explica o `.filter(Boolean)` inerte em `vite.config.ts:148`.
- **`.env` rastreado no git** e ausente do `.gitignore`; divergente do `.env.example` em **6 de 7
  variáveis** — a causa raiz do achado #3.

---

## Estado de verificação

| Verificação | Status |
|---|---|
| Parse do `ci.yml` via `python3 yaml.safe_load` | ✅ MEDIDO (ParserError reproduzido) |
| Indentação linha a linha do `ci.yml` | ✅ MEDIDO (52 linhas) |
| Inventário e contagem de arquivos/`describe`/`it`/`expect`/linhas | ✅ MEDIDO |
| Resolução de todos os specifiers de import contra o disco | ✅ MEDIDO (0 alvos ausentes) |
| Shadowing de exports reais por defs locais em testes | ✅ MEDIDO (3 hits) |
| Existência dos seletores CSS do e2e em `src/` | ✅ MEDIDO (3 ausentes) |
| Match dos globs vitest/playwright vs localização real | ✅ MEDIDO |
| Variáveis presentes em `.env` / `.env.example` | ✅ MEDIDO (nomes apenas) |
| **Execução de testes / lint / typecheck / build** | ⛔ **NAO_VERIFICADO** — `node_modules` ausente |
| **Comportamento em runtime do `tsc --noEmit` com `files: []`** | ⛔ **NAO_VERIFICADO** — inferência estática |
| **Incompatibilidade Storybook 8↔10 em runtime** | ⛔ **NAO_VERIFICADO** — inferência por versão |
| **Se `bun install` dispara o `postinstall`** | ⛔ **NAO_VERIFICADO** |
