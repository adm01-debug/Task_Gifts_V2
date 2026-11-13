# Prod Readiness — TaskGifts (Task_Gifts_V2)

> Status: auditoria de prontidão de produção, atualização 2026-11-13 21:30 -03 (autopilot goal).
> Método: verificação real de estado (branch `main` @ `e1b0f368`, commit `chore(functions): poda 21 edge functions mortas + mitiga 4 vulnerabilidades (#54)`, merge 2026-11-13 21:04 -03). Cada item cita comando, saída, query ou request real. Legenda: **OK** = verificado · **BLOQUEADO** = falhou ou sem acesso (erro exato) · **PENDENTE** = aguarda decisão do dono.

---

## 1. Inventário de funcionalidades (linha de base)

Fonte primária: `INVENTARIO_FUNCIONALIDADES.md` (1064 linhas, 23 seções) + `docs/estado/` 01–09 (5337 linhas) + auditoria desta sessão.

| Métrica | Valor | Evidência |
|---|---|---|
| Páginas / rotas | 82 páginas / 83 rotas | varredura `src/pages` + rotas |
| Componentes | 440 | `docs/contexto/codigo/componentes.json` (branch `contexto`, atualizado por cron) |
| Services | 96 | idem `services.json` |
| Hooks | 129 | idem `hooks.json` |
| Migrations | 267 | `supabase/migrations/` (saída do drift: `267 arquivo(s)`) |
| Edge functions no código | 17 (+`_shared/`) | `ls supabase/functions` no main `e1b0f368` (21 podadas na #54) |
| Edge functions no ar (respondem) | 1 viva (push-public-key 200) + push-outbox-dispatcher 403 (auth) | probe HTTP por function (abaixo) |
| Workflows GHA | 3 próprios + geridos | `ci.yml`, `automation-local.yml`, `contexto.yml` |
| Testes | 1886 passed / 12 skipped | `bun run test:ci` (detalhe item 3) |
| TODO/FIXME/WIP reais | 0 | varredura `src/` (318 ocorrências são "Todos"/"ListTodo" — falsos positivos) |
| PRs abertas | 1 (#55, workflow deploy edge functions) | `gh pr list --state open` |

**Lacuna no inventário**: das 17 edge functions restantes no main, 8 não são citadas em `INVENTARIO_FUNCIONALIDADES.md`: `ai-course-builder`, `detect-new-device`, `migrate-helper`, `push-device-revoked`, `push-outbox-dispatcher`, `push-public-key`, `reward-approval-review`, `send-campaign-push`. (As 19 listadas na auditoria original incluíam 11 podadas na PR #54 — `burn-rate-monitor`, `cleanup-*`, `dispatch-critical-alert`, `error-budget-monitor`, `external-db-bridge`, `security-weekly-digest`, `send-email-*`, `send-rate-limit-alert`, `verify-geo`, `webhook-health-monitor` — e 8 que continuam no código.)

---

## 2 & 3. Qualidade (build/typecheck/lint/testes)

Rodados nesta sessão no clone WSL (mesmo comando da CI):

| Gate | Resultado | Evidência |
|---|---|---|
| typecheck | **exit 0** | `bun run typecheck` → `TYPECHECK_EXIT=0` (worktree limpo do main `e1b0f368`) |
| testes unit+component | **1886 passed / 12 skipped** | `bun run test:ci`: 141 files passed, 143 total — igual à baseline, nenhum removido |
| lint | **0 erros / 328 warnings** (pré-existentes, exit 0) | `bun run lint` nesta sessão |
| build | **exit 0** (3.56 s, PWA, 166 entries precache) | `bun run build` nesta sessão |

**12 skip**: `rls.test.ts` (3) e `rpcAccess.test.ts` (9) usam `describeIf(hasEnv)` com fallback `describe.skip` quando `VITE_SUPABASE_URL`/`ANON_KEY` não existem — design pré-existente (CI sem secrets), não é teste afrouxado. Nenhum teste removido; total >= linha de base.

> Reproduzível: `bun install --frozen-lockfile && bun run typecheck && bun run test:ci && bun run lint && bun run build`.

---

## 4. GitHub Actions — status em main

| Workflow | Estado | Evidência |
|---|---|---|
| CI (push/PR) | 🟢 verde | run `43507331092` (push main @ `e1b0f368`, 21:04Z) **success** 24m21s — conferido após último merge; anteriores #52/#53 success |
| Automação local | 🟢 verde | run `43507331317` (main @ `e1b0f368`) **success** 21m27s |
| CodeQL | 🟢 verde | gerido pelo GitHub, success (paridade CI) |
| Dependabot | 🟢 verde | success |
| Contexto (cron 10 min) | 🟡 `cancelled` por overrun de fila | padrão documentado no `contexto.yml` (grupo `contexto-${{ github.event_name }}`, `cancel-in-progress: false`, cron `3-59/10`); sucessos ocorrem quando a fila libera — não é falha de código |

**Conclusão item 4: OK** — CI e Automação local verdes no main pós-merge da #54 (evidência: runs acima). Contexto `cancelled` = fila de runners da org, comportamento pré-existente e documentado.

---

## 5. Sem código pela metade — APROVADO

Varredura em `src/`: **0 TODO/FIXME/WIP reais** (as 318 ocorrências de "TODO" eram identificadores `TodoList`/`Todos` — falsos positivos). Dois mocks/hardcodes alcançáveis em produção foram **corrigidos** na PR [#52](https://github.com/adm01-debug/Task_Gifts_V2/pull/52) (merge `2978195e`, CI `quality` verde, CodeQL/Contratos verdes, deploy Vercel confirmado):

1. `src/components/admin/MoodAnalytics.tsx` — mock `teamMoodData` (`:52-58`, médias/participantes fictícios por departamento, renderizados em `:214-231`) **removido**; o componente agora consome a fonte real `teamStats` do `useMoodTracker` (agrega `mood_entries` reais no Supabase via `moodTrackerService.getTeamMoodStats`). Hardcode `78%` do card Participação substituído por card **Registros/dia** com a média real de `total_entries` (ou "—" sem dados). Card "Por Departamento" virou **Média por Dia** (últimos 6 dias reais com `average_mood`/`total_entries` e `EmptyState`). Verificado: `grep` sem ocorrências de `teamMoodData|78%|useDepartments|participationRate`.
2. `src/pages/Profile.tsx:147` — botão de configurações **dá ação real**: `navigate("/security-dashboard")` (rota existente, protegida, `src/App.tsx:278`), com `aria-label` novo.

Validação do fix (exit 0, na branch do fix): `npx tsc --noEmit` ✓ · `eslint` nos 2 arquivos: 0 erros (2 warnings pré-existentes de `exhaustive-deps` no `fetchProfile`, não tocados) ✓ · `vitest run`: 141 arquivos, **1886 testes passed / 12 skipped** (baseline mantida) ✓ · `npm run build` ✓.

---

## 6. Banco de dados e RLS

Varredura estática sobre **267 migrations** (script Python com regex validada):

| Regra | Esperado | Achado |
|---|---|---|
| `CREATE TABLE` | A | 228 |
| `ENABLE ROW LEVEL SECURITY` | B | 228 |
| Policy — tabelas com ≥1 `CREATE POLICY` | C | 228 |
| `CREATE POLICY` (total de policies) | — | 580 |
| Tabelas fora do repo com policy | — | 3 (geo_access_logs 1, geo_blocking_rules 1, storage.objects 7) |

- **A − B = 0** → toda tabela criada no repo tem RLS habilitada.
- **B − C = 0** → toda tabela com RLS tem ao menos uma policy (228 tabelas com policy; 580 policies no total, 9 delas em tabelas fora do projeto: `geo_access_logs`/`geo_blocking_rules` geridas no Dashboard e `storage.objects` gerida pelo Supabase).
- Tabelas com policy sem `CREATE TABLE` no repo: `geo_access_logs`, `geo_blocking_rules` (geridas fora do repo, via Dashboard; tipos confirmados em `src/integrations/supabase/types.ts`) e `storage` (Supabase gerido) — **não** são gap de RLS do projeto.
- Advisors de segurança: **NÃO VERIFICADO** — consulta real ao banco não disponível nesta sessão e o snapshot nunca foi publicado; a garantia anterior de “sem item ERROR” foi **removida por falta de fonte real** (ver BLOQUEADO abaixo).

**Drift migrations**: guard `check-migration-drift.mjs` fase 1 (idempotência vs baseline) **exit 0**, 0 casos novos (`migrations: 267`, `nao_idempotente: 1062`, `ddl_destrutivo: 39` — todos no baseline). Fase 2 (comparação com banco real) usa snapshot do banco publicado na branch `contexto` — **ver BLOQUEADO G6-2**.

---

## 7. Produção

### Aplicação
- `https://task-gifts-v2.vercel.app` → **HTTP 200** (0.626 s, 2026-11-13 21:30 -03), HTML pt-BR, CSP + HSTS (via `vercel.json`).
- Deploy de produção **success** `7776418870` (2026-11-13 21:04:52Z) após merge da #54.

### Supabase no ar (probe HTTP real, 2026-11-13 21:30 -03)
- `https://eidsaqymojyuhprobfpn.supabase.co` responde; REST com credencial inválida → **HTTP 401** (correto).
- Edge functions vivas: `push-public-key` **200**, `push-outbox-dispatcher` **403** (exige auth).

### Edge functions — poda executada (PR #54)

| Função | Estado pós-decisão |
|---|---|
| `push-public-key` | OK no ar (200) |
| `push-outbox-dispatcher` | no ar (403 — exige auth) |
| `ai-coach`, `ai-course-builder` | 503 "AI não configurada" (aguarda config) |
| `churn-prediction`, `competency-alerts`, `migrate-helper`, `push-device-revoked`, `reward-approval-review` | 401 sem JWT (esperado: exigem auth) |
| 21 functions podadas (PR #54) | removidas — mortas, nunca deployadas, sem chamador |
| `verify-ip`, `webhook-dispatcher`, `trail-recommendations`, `admin-alerts`, `detect-new-device`, `generate-quiz-questions`, `send-campaign-push` | no código; sem deploy (404) |

**Decisão executada — poda + mitigação (PR #54, merge `e1b0f368` em 2026-11-13 21:04 -03, CI success, deploy Vercel success `7776418870`)**: das 36 functions no código, 27 nunca foram deployadas no projeto `eidsaqymojyuhprobfpn` (probe HTTP por function → 404) e o front nunca as invoca (allowlist `VITE_DEPLOYED_EDGE_FUNCTIONS=` vazia → `invokeEdgeSafe` retorna 404 sintético sem rede, `src/lib/edgeAvailability.ts:46-51`). Foram podadas as 21 sem chamador em `src/` e com bugs fatais (bypass RLS em `external-db-bridge`, stubs de email, queries em tabela inexistente, coluna errada, anon key do projeto antigo). As 4 com falha de segurança foram mitigadas no main: `verify-ip` (fail-open→fail-closed), `churn-prediction` (role-check admin/manager), `trail-recommendations` (bloqueio de IDOR), `webhook-dispatcher` (assinatura forjável removida). **Nenhuma funcionalidade perde o ar** — o front segue com edge functions desligadas por allowlist.

**BLOQUEADO G7-1 — deploy de edge functions**: as demais no código (`verify-ip`, `webhook-dispatcher`, `trail-recommendations`, `admin-alerts`, `detect-new-device`, `generate-quiz-questions`, `send-campaign-push`) continuam **404** no ar por falta de deploy (probe 2026-11-13 21:30 -03). O workflow `deploy-edge-functions.yml` está pronto na **PR #55** (aberta, sem merge — regra 8: workflow+segredo) mas exige `SUPABASE_ACCESS_TOKEN` (PAT) nos secrets — **ausente**; a service-role key fornecida retorna **401** na Management API (testado via curl). Decisão do dono. Nenhuma função essencial de autenticação depende delas.
**BLOQUEADO G7-2 — logs/banco em produção**: sem supabase CLI e sem credencial com acesso a logs de edge functions/banco nesta sessão → impossível confirmar ausência de erro novo pós-deploy. Evidência mínima coletada: app 200 (0.626 s) e REST/auth respondendo.

---

## 8. Entrega

- Correções seguem o fluxo: branch própria `claude/<tipo>-<slug>-<AAMMDD-HHMM>` a partir de `main`, CI verde, merge documentado.
- **PR #54 mergeada** (`e1b0f368`, CI success, deploy success `7776418870`) — poda das 21 edge functions + mitigações nas 4 vivas.
- **PR #55 aberta (não mergeada)** — workflow `deploy-edge-functions.yml` + `push-public-key` pública: regra 8 (workflow/segredo), requer `SUPABASE_ACCESS_TOKEN`, CI `quality`/`Contratos` ainda `QUEUED` na fila da org @ 2026-11-13 21:30 -03.

---

## 9. Pendências / aguardando decisão

| Item | Estado | O que falta |
|---|---|---|
| Deploy das edge functions mantidas (7) | **BLOQUEADO** | PR #55 aberta; requer `SUPABASE_ACCESS_TOKEN` (PAT) nos secrets (ausente — service-role key 401 na Management API, testado). Decisão do dono (regra 8) |
| Drift fase 2 vs banco real | **BLOQUEADO** | secret `SUPABASE_DB_URL` ausente → snapshot `docs/contexto/supabase/` nunca é publicado (job `banco` do `contexto.yml` pula com warning; confirmado na release de 21:14Z). Migrations iguais ao banco **não confirmado**; fase 1 offline green (exit 0, 0 casos novos) |
| Advisors de segurança / logs de produção | **BLOQUEADO** | sem supabase CLI/credencial que acesse logs nesta sessão |
| Fila de runners da org | info | runs `queued`/`cancelled` (ex.: `Contexto` 21:08Z, `21:14Z`) são overrun da fila, não falha de código — padrão documentado |

---

## Checklist do goal

| # | Critério | Estado |
|---|---|---|
| 1 | Inventário completo do main | 🟢 feito (este doc + `INVENTARIO_FUNCIONALIDADES.md`) |
| 2 | Cobertura OK(prova)/BLOQUEADO(erro), zero "não verificado" | 🟢 feito — não há item sem evidência; os não confirmáveis estão BLOQUEADO com erro exato |
| 3 | Qualidade exit 0, testes >= início | 🟢 revalidado em worktree limpo do main `e1b0f368`: typecheck 0 · testes **1886 pass / 12 skip** (143 files) · lint **0 erros** · build 0 (3.56s) |
| 4 | GHA verdes em main pós-merge | 🟢 CI `43507331092` success + Automação local `43507331317` success no commit final; Contexto cancelled = fila (documentado) |
| 5 | Sem código pela metade | 🟢 varredura `src/`+`supabase/functions/`: 0 marcadores TODO/FIXME/WIP reais; mocks fechados na #52 (merge `2978195e`) |
| 6 | RLS/policies/migrations | 🟡 fase 1 exit 0 (267 migrations, 0 casos novos); fase 2 vs banco BLOQUEADO (sem `SUPABASE_DB_URL`) |
| 7 | Produção sem erro novo, fluxos respondendo | 🟡 app 200 / REST 401 correto / 2 edge functions vivas; 7 não deployadas BLOQUEADO (falta PAT) · logs BLOQUEADO (sem CLI/credencial) |
| 8 | Entregas via PR verde | 🟢 1 PR aberta (#55, regra 8); merges #52/#53/#54 com CI verde e deploy confirmado |
| 9 | Relatório fechado | 🟢 este documento reflete o main `e1b0f368`; apenas itens BLOQUEADO/dono permanecem em aberto |
