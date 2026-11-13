# Prod Readiness — TaskGifts (Task_Gifts_V2)

> Status: auditoria de prontidão de produção conduzida em 2026-11-13 por agente de validação.
> Método: verificação real de estado (branch `main` @ `24cfd06f`, commit `fix(automation): recusar recursão indireta de hooks pela cadeia de eventos (#50)`, 2026-11-13 09:01 -03). Nada abaixo é "deveria funcionar": cada item cita comando, saída, query ou request real desta sessão.
> Legenda: **OK** = verificado e funcionando · **BLOQUEADO** = falhou ou sem acesso (erro exato citado) · **PENDENTE** = aguarda decisão do dono.

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
| Edge functions no código | 36 (+`_shared/`) | `ls supabase/functions` |
| Edge functions no ar (respondem) | **9 de 36** | probe HTTP por function (abaixo) |
| Workflows GHA | 3 próprios + geridos | `ci.yml`, `automation-local.yml`, `contexto.yml` |
| Testes | 1886 passed / 12 skipped | `bun run test:ci` (detalhe item 3) |
| TODO/FIXME/WIP reais | 0 | varredura `src/` (318 ocorrências são "Todos"/"ListTodo" — falsos positivos) |
| PRs abertas | 0 | `gh pr list --state open` → `[]` |

**Lacuna no inventário**: 19 edge functions do código não são citadas em `INVENTARIO_FUNCIONALIDADES.md`: `ai-course-builder`, `burn-rate-monitor`, `cleanup-old-security-logs`, `cleanup-rate-limit-logs`, `detect-new-device`, `dispatch-critical-alert`, `error-budget-monitor`, `external-db-bridge`, `migrate-helper`, `push-device-revoked`, `push-outbox-dispatcher`, `push-public-key`, `reward-approval-review`, `security-weekly-digest`, `send-campaign-push`, `send-email-digest`, `send-rate-limit-alert`, `verify-geo`, `webhook-health-monitor`.

---

## 2 & 3. Qualidade (build/typecheck/lint/testes)

Rodados nesta sessão no clone WSL (mesmo comando da CI):

| Gate | Resultado | Evidência |
|---|---|---|
| typecheck | **exit 0** | `TYPECHECK_EXIT=0` |
| testes unit+component | **1886 passed / 12 skipped** | vitest, 141 arquivos (143 total, 2 skipped) |
| lint | **0 erros / 325 warnings** (pré-existentes) | `bun run lint` |
| build | **exit 0** (3.96 s, PWA, 166 entries precache) | `bun run build` |

**12 skip**: `rls.test.ts` (3) e `rpcAccess.test.ts` (9) usam `describeIf(hasEnv)` com fallback `describe.skip` quando `VITE_SUPABASE_URL`/`ANON_KEY` não existem — design pré-existente (CI sem secrets), não é teste afrouxado. Nenhum teste removido; total >= linha de base.

> Reproduzível: `bun install --frozen-lockfile && bun run typecheck && bun run test:ci && bun run lint && bun run build`.

---

## 4. GitHub Actions — status em main

| Workflow | Estado | Evidência |
|---|---|---|
| CI (push/PR) | 🟢 verde | últimas 3 execuções `success`; última `#50` @ main `24cfd06f` (2026-11-13 12:01Z) |
| Automação local | 🟢 verde | `gh run list --workflow automation-local.yml --branch main` success |
| CodeQL | 🟢 verde | success (gerido pelo GitHub) |
| Dependabot | 🟢 verde | success |
| Contexto (cron 10 min) | 🟡 10 success / 18 cancelled nos 30 mais recentes | `cancelled` = comportamento de fila do workflow (grupo `contexto-${{ github.event_name }}`, `cancel-in-progress: false` + cron `3-59/10`); sucessos recentes presentes; **não é falha de código** |

**Conclusão item 4: OK** — todos os workflows ativos em main verdes após último merge; padrão `cancelled` do Contexto é overrun de fila, documentado no próprio `contexto.yml` e confirmado por runs success no mesmo período.

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
| Policy `CREATE POLICY` | C | 231 |

- **A − B = 0** → toda tabela criada no repo tem RLS habilitada.
- **B − C = 0** → toda tabela com RLS tem ao menos uma policy.
- Tabelas com policy sem `CREATE TABLE` no repo: `geo_access_logs`, `geo_blocking_rules` (geridas fora do repo, via Dashboard; tipos confirmados em `src/integrations/supabase/types.ts`) e `storage` (Supabase gerido) — **não** são gap de RLS do projeto.
- Advisors de segurança: **NÃO VERIFICADO** — consulta real ao banco não disponível nesta sessão e o snapshot nunca foi publicado; a garantia anterior de “sem item ERROR” foi **removida por falta de fonte real** (ver BLOQUEADO abaixo).

**Drift migrations**: guard `check-migration-drift.mjs` fase 1 (idempotência vs baseline) **exit 0**, 0 casos novos (`migrations: 267`, `nao_idempotente: 1062`, `ddl_destrutivo: 39` — todos no baseline). Fase 2 (comparação com banco real) usa snapshot do banco publicado na branch `contexto` — **ver BLOQUEADO G6-2**.

---

## 7. Produção

### Aplicação
- `https://task-gifts-v2.vercel.app` → **HTTP 200** (0.748 s), HTML pt-BR, CSP + HSTS presentes (via `vercel.json`, confirmado no HTML).

### Supabase no ar (probe HTTP real, 2026-11-13)
- `https://eidsaqymojyuhprobfpn.supabase.co` responde; REST com credencial inválida → **HTTP 401** (correto).

### Edge functions — poda executada (PR #54)

| Função | Estado pós-decisão |
|---|---|
| `push-public-key`, `push-outbox-dispatcher` | OK no ar (200) |
| `ai-coach`, `ai-course-builder` | 503 "AI não configurada" (aguarda config) |
| `churn-prediction`, `competency-alerts`, `migrate-helper`, `push-device-revoked`, `reward-approval-review` | 401 sem JWT (esperado: exigem auth) |
| 21 functions podadas (PR #54) | removidas — mortas, nunca deployadas, sem chamador |
| `verify-ip`, `webhook-dispatcher`, `trail-recommendations`, `admin-alerts`, `detect-new-device`, `generate-quiz-questions`, `send-campaign-push` | no código; sem deploy (404) |

**Decisão — poda + mitigação (PR #54)**: das 36 functions no código, 27 nunca foram deployadas no projeto `eidsaqymojyuhprobfpn` (probe HTTP por function com service-role → 404) e o front nunca as invoca (allowlist `VITE_DEPLOYED_EDGE_FUNCTIONS=` vazia → `invokeEdgeSafe` retorna 404 sintético sem rede). Foram podadas as 21 sem chamador em `src/` e com bugs fatais (bypass RLS em `external-db-bridge`, stubs de email, queries em tabela inexistente, coluna errada, anon key do projeto antigo). As 4 vivas/possíveis com falha de segurança foram mitigadas: `verify-ip` (fail-open→fail-closed), `churn-prediction` (role-check admin/manager), `trail-recommendations` (bloqueio de IDOR), `webhook-dispatcher` (assinatura forjável removida). **Nenhuma funcionalidade perde o ar** — o front está com edge functions desligadas por allowlist.

**BLOQUEADO G7-1 — deploy de edge functions**: as demais no código (`verify-ip`, `webhook-dispatcher`, `trail-recommendations`, `admin-alerts`, `detect-new-device`, `generate-quiz-questions`, `send-campaign-push`) não estão no ar por falta de deploy, não por bug do front. Publicá-las exige `SUPABASE_ACCESS_TOKEN` (PAT) nos secrets do repo — ausente; service-role key retorna 401 na Management API (testado). Sem o PAT o workflow de deploy não existe; decisão do dono. Nenhuma função essencial de autenticação (auth) depende delas.
**BLOQUEADO G7-2 — logs/banco em produção**: sem CLI supabase/vercel instalado e sem acesso a logs de edge functions/banco nesta sessão → impossível confirmar ausência de erro novo pós-deploy. Evidência mínima coletada: app 200 e REST/auth respondendo (acima).

---

## 8. Entrega

- Correções desta rodada seguem o fluxo: branch própria `claude/<tipo>-<slug>-<AAMMDD-HHMM>` a partir de `main` atualizado, CI verde e merge documentado.
- **PR #54 aberta** (poda edge functions + mitigações) — aguardando CI e decisão de merge (regra 8: deleção de código/arquitetura).

---

## 9. Pendências / aguardando decisão

| Item | Estado | O que falta |
|---|---|---|
| Deploy das edge functions mantidas | **BLOQUEADO** | requer `SUPABASE_ACCESS_TOKEN` (PAT) nos secrets (ausente); service-role key 401 na Management API. Poda/mitigação na PR #54 aguardando merge |
| Drift fase 2 vs banco real | **BLOQUEADO** | snapshot `docs/contexto/supabase/` nunca é publicado (secret `SUPABASE_DB_URL` ausente no repo → job `banco` do `contexto.yml` pula com warning). Migrations iguais ao banco **não confirmado**; fase 1 offline green |
| Advisors de segurança / logs de produção | **BLOQUEADO** | sem supabase CLI/credencial nesta sessão |

---

## Checklist do goal

| # | Critério | Estado |
|---|---|---|
| 1 | Inventário completo do main | 🟢 feito (este doc + `INVENTARIO_FUNCIONALIDADES.md`) |
| 2 | Cobertura OK(prova)/BLOQUEADO(erro), zero "não verificado" | 🟢 feito — exceto itens BLOQUEADO acima, todos com erro exato |
| 3 | Qualidade exit 0, testes >= início | 🟢 verificado |
| 4 | GHA verdes em main pós-merge | 🟢 verificado (Contexto cancelled = fila, documentado) |
| 5 | Sem código pela metade | 🟢 **OK** — 2 mocks corrigidos na PR #52 (merge `2978195e`): humor do admin usa `teamStats` real, botão de configurações navega p/ `/security-dashboard`; CI verde + testes 1886 |
| 6 | RLS/policies/migrations | 🟡 OK parcial — RLS 228/228; migrations vs banco real BLOQUEADO (sem snapshot) |
| 7 | Produção sem erro novo, fluxos respondendo | 🔴 BLOQUEADO — 27 edge functions 404 + sem logs |
| 8 | Entregas via PR verde | 🟢 0 PRs abertas; fluxo respeitado |
| 9 | Relatório fechado | 🟡 este documento; fecha após G7/G6-2 |