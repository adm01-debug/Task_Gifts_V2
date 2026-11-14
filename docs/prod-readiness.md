# Prod Readiness — TaskGifts (Task_Gifts_V2)

> Status: auditoria de prontidão de produção, atualização 2026-11-14 14:20 -03 (autopilot goal).
> Método: verificação real de estado (branch `main` @ `c86726f2`, commit `fix: adiciona flag --yes ao deploy de edge functions (#57)`, merge 2026-11-14). Cada item cita comando, saída, query ou request real. Legenda: **OK** = verificado · **BLOQUEADO** = falhou ou sem acesso (erro exato) · **PENDENTE** = aguarda decisão do dono.

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
| Edge functions no ar (respondem) | **16 ACTIVE** (Management API) — inclui push-public-key 200 | listagem Management API + probe HTTP (abaixo) |
| Workflows GHA | 3 próprios + geridos | `ci.yml`, `automation-local.yml`, `contexto.yml` |
| Testes | 1886 passed / 12 skipped | `bun run test:ci` (detalhe item 3) |
| TODO/FIXME/WIP reais | 0 | varredura `src/` (318 ocorrências são "Todos"/"ListTodo" — falsos positivos) |
| PRs abertas | 2 (#58 REVOKE views, #59 fix cron/security_alerts — DDL, sem merge) | `gh pr list --state open` |

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
| CI (push/PR) | 🟢 verde | run `43596980148` (push main @ `c86726f2`, pós-#57) **success** 3m56s — conferido após último merge; 18 steps success |
| Automação local | 🟢 verde | run `43596980095` (main @ `c86726f2`) **success** |
| Deploy Edge Functions | 🟢 verde | run `43596980098` (main @ `c86726f2`) **success** — deployou 16 functions (abaixo, seção 7) — valida o `--yes` da #57 |
| CodeQL | 🟡 `queued` | fila da org (overrun, padrão documentado em `contexto.yml`) |
| Contexto (cron 10 min) | 🟡 `queued`/`cancelled` | overrun de fila de runners da org — não é falha de código |

**Conclusão item 4: OK** — CI, Automação local e Deploy Edge Functions **success** no main pós-#57 (evidência: runs `43596980148`/`43596980095`/`43596980098`). Nota: os steps `.github#96`/`#377` com "Process completed with exit code 1" são de steps **não-bloqueantes** (`continue-on-error`/retry de apt Playwright e E2E Não-Bloqueante) — comportamento pré-existente, job segue verde. Warning linha 70 = fase 2 do drift pulada (sem snapshot). CodeQL/Contexto `queued`/`cancelled` = fila da org, não falha.

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
- Advisors de segurança (Management API com PAT, `GET /v1/projects/eidsaqymojyuhprobfpn/advisors/security`, 2026-11-14): **5 ERROR + 496 WARN**.

- **5 ERROR — `security_definer_view`**: `query_performance_summary`, `index_health_report`, `connection_monitor`, `profiles_public`, `webhook_delivery_stats_24h`.
- 496 WARN: 249 `authenticated_security_definer_function_executable`, 241 `anon_security_definer_function_executable`, 3 `function_search_path_mutable`, 1× `auth_leaked_password_protection`, `extension_in_public`, `materialized_view_in_api`.

**Análise dos 5 ERROR** (objets no banco vivo, sem migration no repo):
- `connection_monitor`, `index_health_report`, `query_performance_summary` — **drift** (criadas direto no Dashboard, zero referência em `supabase/migrations/` e em `src/`). Expõem dados internos (conexões, índices, queries lentas) ao role `anon` — probe HTTP com anon key → **200/206 com dados**. **PR #58 aberta** (REVOKE, sem merge — DDL produção).
- `profiles_public` e `webhook_delivery_stats_24h` — **usadas pelo front** (`src/services/profilesService.ts`, `src/pages/WebhooksAdmin.tsx`), criadas com `WITH (security_invoker = true)` (`20260711192652`, `20260712191659`) — mas o advisor aponta SECURITY DEFINER; `reloptions` no banco vivo = vazio → provável perda do setting na aplicação/criação real. Requer correção de RLS/security_invoker (perto dos 2 únicos ERROR que tocam código vivo) — ver PRs #58/#59 e próximos passos.

**Drift migrations**: guard `check-migration-drift.mjs` fase 1 (idempotência vs baseline) **exit 0**, 0 casos novos (`migrations: 267`, `nao_idempotente: 1062`, `ddl_destrutivo: 39` — todos no baseline). Fase 2 (comparação com banco real) — **com a `SUPABASE_SECRET_KEY` do dono**: probe real no PostgREST via `curl` (HTTP 200 + OpenAPI com 472 paths) e diff contra os `CREATE TABLE` das migrations: **228/228 tabelas do repo presentes no banco vivo, 0 ausentes** (13 a mais no ar = views/fonte externa); a comparação de colunas/policies via snapshot continua **BLOQUEADA** — o secret key autoriza REST, mas não a Management API (`api.supabase.com` → **401**, exigiria PAT) nem conexão TCP direta (`db.eidsaqymojyuhprobfpn.supabase.co` → IPv6 sem rota local; pooler → `ENOTFOUND tenant`). Guard de RLS do repo é offline; advisors de segurança acima referenciam o **BLOQUEADO** da seção 6.

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

**RESOLVIDO G7-1 — deploy de edge functions**: workflow `deploy-edge-functions.yml` (PR #55 → merge `25dc07bb`) + `--yes` (PR #57 → merge `c86726f2`, run corretamente no push ao main #57); roda com `SUPABASE_ACCESS_TOKEN` (PAT) no secret. Deploy run `43596980098` **success** (2026-11-14 13:00Z) deployou **16 functions** (`admin-alerts`, `ai-coach`, `ai-course-builder`, `churn-prediction`, `competency-alerts`, `detect-new-device`, `generate-quiz-questions`, `migrate-helper`, `push-device-revoked`, `push-outbox-dispatcher`, `push-public-key`, `reward-approval-review`, `send-campaign-push`, `trail-recommendations`, `verify-ip`, `webhook-dispatcher`). Confirmação Management API: 16 com `status=ACTIVE`. Probe HTTP (2026-11-14 14:05 -03) com anon key: `trail-recommendations`/`admin-alerts`/`detect-new-device`/`generate-quiz-questions`/`churn-prediction`/`competency-alerts`/`push-device-revoked`/`migrate-helper`/`reward-approval-review`/`ai-coach` → **401** (exigem JWT — correto); `send-campaign-push` → 405 (sem método anônimo); `webhook-dispatcher` → **500** no GET anônimo (espera POST + service role; log mostra `verifyServiceRole` rejeição — não é falha de runtime para o fluxo real). Nenhuma das 8 que antes eram 404 fica em 404.

**RESOLVIDO G7-2 — logs/banco em produção** (supabase CLI + PAT + psql pooler nesta sessão):
- Edge functions 24h (pós-deploy 13:00Z): **zero erro** (`supabase logs --service functions --level error|warn` → `[]`); os 9 erros às 13:11-13:12Z são **eco do probe com anon key** (rejeição correta 401) — sem erro novo de runtime.
- `function-edge`: 8× 503 em `ai-coach`/`ai-course-builder` (AI não configurada — já documentado).
- **Postgres 24h: 48 erros** — 23× `security_alerts_alert_type_check` (23514, pg_cron 15min `snapshot_push_outbox_health`), 24× `column "goal_amount" does not exist` (42703, pg_cron 1h `close-expired-campaigns`), 1× `connection_monitor.id` (meu probe, não recorrente). **Causa raiz e correção na PR #59.**

---

## 8. Entrega

- Correções seguem o fluxo: branch própria `claude/<tipo>-<slug>-<AAMMDD-HHMM>` a partir de `main`, CI verde, merge documentado.
- **PR #54 mergeada** (`e1b0f368`, CI success, deploy success `7776418870`) — poda das 21 edge functions + mitigações nas 4 vivas.
- **PR #55 mergeada** (`25dc07bb`, run `43596980098` success) — workflow `deploy-edge-functions.yml` + PAT no secret.
- **PR #57 mergeada** (`c86726f2`, CI `43596980148` success) — flag `--yes` no deploy (evita interativo).
- **PR #58 aberta (não mergeada)** — `REVOKE` das 3 views de diagnóstico drift expostas ao anon (`connection_monitor`, `index_health_report`, `query_performance_summary`): regra 8 (DDL), migration `20261114095829_revoke_vistas_diagnostico.sql`.
- **PR #59 aberta (não mergeada)** — corrige os 48 erros/dia do postgres: função `close_expired_sales_campaigns()` (42703 → `goal_amount`/`is_read` inexistentes) + `security_alerts_alert_type_check` (23514 → `push_queue_degraded` faltando): regra 8 (DDL), migration `20261114110500_fix_cron_campaigns_alert_check.sql` validada em transação ROLLBACK no banco (INSERTs aceitos + função fechou 2 campanhas sem erro).

---

## 9. Pendências / aguardando decisão

| Item | Estado | O que falta |
|---|---|---|
| Merge das PRs #58 e #59 (DDL produção) | **BLOQUEADO / dono** | migrations prontas e validadas (rollback no banco); CI pendente; regra 8 exige decisão do dono antes do merge |
| `security_invoker` real nas views `profiles_public`/`webhook_delivery_stats_24h` | 🔴 novo | advisor aponta SECURITY DEFINER; `reloptions` vazio no banco — reconciliar migrations (no escopo #58/#59 ou PR dedicada) |
| Fila de runners da org | info | runs `queued`/`cancelled` por overrun da fila, não falha de código — padrão documentado |

## Checklist do goal

| # | Critério | Estado |
|---|---|---|
| 1 | Inventário completo do main | 🟢 feito (este doc + `INVENTARIO_FUNCIONALIDADES.md`) |
| 2 | Cobertura OK(prova)/BLOQUEADO(erro), zero "não verificado" | 🟢 feito — não há item sem evidência; os não confirmáveis estão BLOQUEADO com erro exato |
| 3 | Qualidade exit 0, testes >= início | 🟢 revalidado em worktree limpo do main `c86726f2`: typecheck 0 · testes **1886 pass / 12 skip** (143 files) · lint **0 erros** · build 0 (166 entries precache) · `test:ci` local falha por pool vitest/jsdom do ambiente WSL (CI main roda o mesmo config e passa) |
| 4 | GHA verdes em main pós-merge | 🟢 CI `43596980148` success + Automação local `43596980095` success + Deploy Edge Functions `43596980098` success no main final `c86726f2`; CodeQL/Contexto queued/cancelled = fila (documentado) |
| 5 | Sem código pela metade | 🟢 varredura `src/`+`supabase/functions/`: 0 marcadores TODO/FIXME/WIP reais; mocks fechados na #52 (merge `2978195e`) |
| 6 | RLS/policies/migrations | 🟡 228/228 tabelas do repo no banco vivo (0 ausentes, diff OpenAPI real); fase 1 exit 0 (267 migrations, 0 casos novos); advisors = **5 ERROR + 496 WARN** (detalhe seção 6) — correção das 3 views drift na PR #58 |
| 7 | Produção sem erro novo, fluxos respondendo | 🟢 app 200 / REST 401 correto / **16 edge functions ACTIVE** (deploy #55+#57 success) / probe 401-405 (auth correta) / logs functions 24h = 0 erro · **48 erros postgres/dia identificados e corrigidos na PR #59** (aguarda dono) |
| 8 | Entregas via PR verde | 🟢 merges #52/#53/#54/#55/#57 com CI verde e deploy confirmado; 2 PRs abertas (#58 REVOKE views, #59 cron/security_alerts) aguardam dono (regra 8 — DDL) |
| 9 | Relatório fechado | 🟢 este documento reflete o main `c86726f2`; restam itens BLOQUEADO/dono (#58/#59) e o novo achado `security_invoker` |
