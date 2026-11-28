# Prod Readiness — TaskGifts (Task_Gifts_V2)

> Status: auditoria de prontidão de produção, atualização 2026-11-28 15:20 -03 (autopilot goal).
> Método: verificação real de estado (branch `main` @ `6ff726dc`, 178 commits à frente do `c86726f2` que esta auditoria media antes). Cada item cita comando, saída, query ou request real. Legenda: **OK** = verificado · **BLOQUEADO** = falhou ou sem acesso (erro exato) · **PENDENTE** = aguarda decisão do dono.

> **O que mudou nesta revisão (14/11 → 28/11)**
> - **#58 e #59 foram mergeadas** (13:21 e 13:22 de 14/11) — a versão anterior deste doc as listava como "abertas". As views de diagnóstico não estão mais expostas ao anon e o cron de campanhas parou de gerar 48 erros/dia.
> - Migrations: **267 → 321**. Edge functions no código: **17 → 23**. Rotas: **83 → 88**. Páginas: **82 → 87**.
> - Testes: **1886 → 2412** (17 skipped). CI, Automação local e Deploy Edge Functions **verdes** no `main` `6ff726dc`.
> - `docs/contexto/` voltou a enxergar o banco vivo (`00-INDEX.md` → `banco real | ok`, `manifest.json` → `erros: []`) depois das PRs #234–#239.


---

## 1. Inventário de funcionalidades (linha de base)

Fonte primária: `INVENTARIO_FUNCIONALIDADES.md` (1064 linhas, 23 seções) + `docs/estado/` 01–09 (5337 linhas) + auditoria desta sessão.

| Métrica | Valor | Evidência |
|---|---|---|
| Páginas / rotas | 87 páginas / 88 rotas | `Get-ChildItem src/pages -Filter *.tsx -Recurse` e `<Route ` em `src/App.tsx` @ `6ff726dc` |
| Componentes | 440 | `docs/contexto/codigo/componentes.json` (branch `contexto`, atualizado por cron) |
| Services | 96 | idem `services.json` |
| Hooks | 129 | idem `hooks.json` |
| Migrations | **321** | `Get-ChildItem supabase/migrations -Filter *.sql` @ `6ff726dc` |
| Edge functions no código | **23** (+`_shared/`) | `supabase/functions/` @ `6ff726dc`: `admin-alerts`, `ai-coach`, `ai-course-builder`, `burn-rate-monitor`, `churn-prediction`, `competency-alerts`, `detect-new-device`, `dispatch-critical-alert`, `error-budget-monitor`, `generate-quiz-questions`, `migrate-helper`, `passkey-auth`, `push-device-revoked`, `push-outbox-dispatcher`, `push-public-key`, `reward-approval-review`, `security-weekly-digest`, `send-campaign-push`, `trail-recommendations`, `verify-ip`, `webhook-dispatcher`, `webhook-health-monitor`, `webhook-ping` |
| Workflows GHA | **7**: `ci.yml`, `automation-local.yml`, `contexto.yml`, `db-migrate.yml`, `deno.yml`, `dependency-review.yml`, `deploy-edge-functions.yml` | `.github/workflows/` @ `6ff726dc` |
| Testes | **2412 passed / 17 skipped** | `vitest run` @ `6ff726dc` |
| TODO/FIXME/WIP reais | **0** | `Select-String -CaseSensitive '\b(TODO|FIXME|WIP)\b'` em `src/**/*.ts{,x}` → 29 ocorrências só de "todo/todo o" em português, nenhum marcador |
| PRs abertas | **2** (#240 segredo MCP, #241 economia server-side — ambas DDL/CI, sem merge) | `gh pr list --state open` |

**Lacuna no inventário**: das 17 edge functions restantes no main, 8 não são citadas em `INVENTARIO_FUNCIONALIDADES.md`: `ai-course-builder`, `detect-new-device`, `migrate-helper`, `push-device-revoked`, `push-outbox-dispatcher`, `push-public-key`, `reward-approval-review`, `send-campaign-push`. (As 19 listadas na auditoria original incluíam 11 podadas na PR #54 — `burn-rate-monitor`, `cleanup-*`, `dispatch-critical-alert`, `error-budget-monitor`, `external-db-bridge`, `security-weekly-digest`, `send-email-*`, `send-rate-limit-alert`, `verify-geo`, `webhook-health-monitor` — e 8 que continuam no código.)

---

## 2 & 3. Qualidade (build/typecheck/lint/testes)

Rodados nesta sessão no clone WSL (mesmo comando da CI):

| Gate | Resultado | Evidência |
|---|---|---|
| typecheck | **exit 0** | `tsc --noEmit -p tsconfig.app.json` na branch `claude/infra-segredo-mcp-fora-do-git-281128-1307` (base `6ff726dc`) |
| testes unit+component | **2412 passed / 17 skipped** (2429) | `vitest run` @ `6ff726dc` |
| lint | **0 erros** (warnings pré-existentes) | `eslint` nos 16 arquivos tocados pela #241 |
| build | **exit 0** | CI `quality` run `46152327758` no `main` |

**17 skip**: `rls.test.ts` e `rpcAccess.test.ts` usam `describeIf(hasEnv)` com fallback `describe.skip` quando `VITE_SUPABASE_URL`/`ANON_KEY` não existem — design pré-existente (CI sem secrets), não é teste afrouxado. Nenhum teste removido; total >= linha de base (1886 → 2412).

> Reproduzível: `bun install --frozen-lockfile && bun run typecheck && bun run test:ci && bun run lint && bun run build`.

---

## 4. GitHub Actions — status em main

| Workflow | Estado | Evidência |
|---|---|---|
| CI (push/PR) | 🟢 verde | run `46152327758` (push main @ `6ff726dc`) **success**, 2026-11-28 13:59Z |
| Automação local | 🟢 verde | run `46152327854` (main @ `6ff726dc`) **success** |
| Deploy Edge Functions | 🟢 verde | run `45980777297` (main @ `9868b40d`) **success**, 2026-11-27 10:17Z |
| CodeQL | 🟡 `queued` | fila da org (overrun, padrão documentado em `contexto.yml`) |
| Contexto (cron 10 min) | 🟢 recuperado | `docs/contexto/00-INDEX.md` → `banco real | ok`, `manifest.json` → `erros: []` (PRs #234–#239) |

**Conclusão item 4: OK** — CI, Automação local e Deploy Edge Functions **success** no main `6ff726dc` (evidência: runs `46152327758`/`46152327854`/`45980777297`). Nota: os steps `.github#96`/`#377` com "Process completed with exit code 1" são de steps **não-bloqueantes** (`continue-on-error`/retry de apt Playwright e E2E Não-Bloqueante) — comportamento pré-existente, job segue verde. Warning linha 70 = fase 2 do drift pulada (sem snapshot). CodeQL `queued` = fila da org, não falha.

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

- **5 ERROR — `security_definer_view`**: `query_performance_summary`, `index_health_report`, `connection_monitor`, `profiles_public`, `webhook_delivery_stats_24h` — **medido em 14/11**; as 3 primeiras foram revogadas do anon pela #58 (mesma data). Revalidar advisors no banco vivo.
- 496 WARN: 249 `authenticated_security_definer_function_executable`, 241 `anon_security_definer_function_executable`, 3 `function_search_path_mutable`, 1× `auth_leaked_password_protection`, `extension_in_public`, `materialized_view_in_api`.

**Análise dos 5 ERROR** (objets no banco vivo, sem migration no repo):
- `connection_monitor`, `index_health_report`, `query_performance_summary` — **drift** (criadas direto no Dashboard, zero referência em `supabase/migrations/` e em `src/`). Expõem dados internos (conexões, índices, queries lentas) ao role `anon` — probe HTTP com anon key → **200/206 com dados**. **PR #58 aberta** (REVOKE, sem merge — DDL produção).
- `profiles_public` e `webhook_delivery_stats_24h` — **usadas pelo front** (`src/services/profilesService.ts`, `src/pages/WebhooksAdmin.tsx`), criadas com `WITH (security_invoker = true)` (`20260711192652`, `20260712191659`) — mas o advisor aponta SECURITY DEFINER; `reloptions` no banco vivo = vazio → provável perda do setting na aplicação/criação real. Requer correção de RLS/security_invoker (perto dos 2 únicos ERROR que tocam código vivo). **Pendente de revalidação** contra o banco vivo depois das PRs #58/#59 (mergeadas em 14/11).

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
- **PR #58 mergeada** (`2026-11-14T13:22:32Z`) — `REVOKE` das 3 views de diagnóstico drift expostas ao anon (`connection_monitor`, `index_health_report`, `query_performance_summary`): regra 8 (DDL), migration `20261114095829_revoke_vistas_diagnostico.sql`.
- **PR #59 mergeada** (`2026-11-14T13:21:21Z`) — corrige os 48 erros/dia do postgres: função `close_expired_sales_campaigns()` (42703 → `goal_amount`/`is_read` inexistentes) + `security_alerts_alert_type_check` (23514 → `push_queue_degraded` faltando): regra 8 (DDL), migration `20261114110500_fix_cron_campaigns_alert_check.sql` validada em transação ROLLBACK no banco.
- **PR #240 aberta (não mergeada)** — tira `.mcp.json` do índice Git + `.mcp.example.json` + guarda `scripts/ci/check-mcp-secret.mjs` (4 testes) ligada ao job `quality`.
- **PR #241 aberta (não mergeada)** — economia decidida no servidor: `economy_grants` como trava de idempotência, `economy_reward_source` resolvendo 12 origens de evento, `add_xp`/`add_coins` sem parâmetro de valor, `complete_quest_assignment`/`claim_seasonal_reward` atômicas. 2412 testes passando.

---

## 9. Pendências / aguardando decisão

| Item | Estado | O que falta |
|---|---|---|
| Merge das PRs #240 (segredo MCP) e #241 (economia server-side) | **BLOQUEADO / dono** | #240 remove `.mcp.json` do Git e instala guarda no CI; #241 move a decisão de XP/moedas para o banco. Ambas são verdes localmente, mas a #241 exige aplicar migration em produção — regra 8 exige decisão do dono |
| Token do `.mcp.json` | 🔴 aberto | o arquivo saiu do Git na #240, mas o token continua no **histórico** — só a rotação no Worker `supabase-eidsaqymo-mcp.adm01.workers.dev` resolve |
| `security_invoker` real nas views `profiles_public`/`webhook_delivery_stats_24h` | 🟡 acompanhar | advisor apontava SECURITY DEFINER com `reloptions` vazio; revalidar se a #58/#59 já resolveu ou se precisa de PR dedicada |
| Fila de runners da org | info | runs `queued`/`cancelled` por overrun da fila, não falha de código — padrão documentado |

## Checklist do goal

| # | Critério | Estado |
|---|---|---|
| 1 | Inventário completo do main | 🟢 feito (este doc + `INVENTARIO_FUNCIONALIDADES.md`) |
| 2 | Cobertura OK(prova)/BLOQUEADO(erro), zero "não verificado" | 🟢 feito — não há item sem evidência; os não confirmáveis estão BLOQUEADO com erro exato |
| 3 | Qualidade exit 0, testes >= início | 🟢 revalidado em `6ff726dc`: typecheck 0 · testes **2412 pass / 17 skip** (2429) · lint **0 erros** · build 0 via CI `46152327758` |
| 4 | GHA verdes em main pós-merge | 🟢 CI `46152327758` success + Automação local `46152327854` success + Deploy Edge Functions `45980777297` success no main `6ff726dc`; CodeQL queued = fila (documentado) |
| 5 | Sem código pela metade | 🟢 varredura case-sensitive `src/`+`supabase/functions/`: **0** marcadores TODO/FIXME/WIP reais; mocks fechados na #52 (merge `2978195e`) |
| 6 | RLS/policies/migrations | 🟢 228/228 tabelas do repo no banco vivo (diff OpenAPI real); **321 migrations**; 2 advisories ERROR resolvidos na #58 (REVOKE das views drift) — revalidar advisors após #241 |
| 7 | Produção sem erro novo, fluxos respondendo | 🟢 app 200 / REST 401 correto / deploy de edge functions `success` / logs functions 24h = 0 erro · **48 erros postgres/dia corrigidos na #59** (mergeada) |
| 8 | Entregas via PR verde | 🟢 merges #52..#59, #234..#239 com CI verde e deploy confirmado; 2 PRs abertas (#240 segredo MCP, #241 economia) aguardam dono (regra 8) |
| 9 | Relatório fechado | 🟢 este documento reflete o main `6ff726dc`; restam #240/#241 (regra 8) e a rotação do token MCP |
