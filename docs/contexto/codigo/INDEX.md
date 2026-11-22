# Contexto do projeto para agentes de IA

GERADO AUTOMATICAMENTE por scripts/ai-context/gerar.mjs — não editar à mão; será sobrescrito.
Publicado em `docs/contexto/codigo/` na branch `contexto` (gerada, nunca abra PR dela) a cada push em `main` e a cada 10 minutos pelo workflow `contexto.yml`; índice único das três fontes em `docs/contexto/00-INDEX.md`. Gere local com `node scripts/ai-context/gerar.mjs`. Commit-base: `2d24251fb198f6c5e9c2cd9b65acc58a668cf298` (2026-11-22T13:37:58-03:00).

## Como usar (leia antes de planejar ou executar qualquer tarefa)
1. **Tela/rota/menu** → `rotas.json` (url/vista/menu → arquivo → hooks → tabelas → edges; `rotas_http_backend` para APIs) e `modulos.json` (módulo inteiro + dependências entre módulos).
2. **Hook/serviço/lógica** → `hooks.json`, `logica.json` (quem usa, o que toca, se tem teste).
3. **Edge function / serverless** → `edge-functions.json` (verify_jwt, tabelas, env, quem chama, órfãs).
4. **Banco** → `banco.json` (colunas, RLS, policies, índices, FKs, triggers, cron jobs, buckets, drift migration×types, uso no código) — visão do código; para o banco vivo use o MCP.
5. **Antes de criar arquivo** → `convencoes.json` (onde ficam as coisas, nomenclatura, alias), `componentes.json` (nomes duplicados, órfãos), `grafo.json` (hubs, ciclos de import) e `grafo-graphify.json` (grafo por AST: comunidades, símbolos mais chamados, comunidade de cada arquivo).
6. **CI/scripts/deploy/env/integrações/permissões/flags** → `ferramentas.json` e `scripts.json`.
7. **Antes de abrir PR** → `testes.json` (o que tem e não tem teste, onde os testes ficam), `baseline.json` (alertas, TODOs, hotspots, últimos commits).
Os JSONs são grandes: filtre com `grep`/`jq` pelo caminho/arquivo/tabela da sua tarefa; não carregue tudo.

## Stack
- linguagens: TypeScript (1128), SQL (271), Markdown (55), JavaScript (24), JSON (14), YAML (9), Python (5), Shell (4)
- linguagem_principal: TypeScript
- framework: React
- backend_http: n/d
- bundler: Vite
- roteador: react-router
- banco: Supabase
- testes: vitest, playwright
- ui: tailwind, radix/shadcn
- estado: react-query
- gerenciador_pacotes: bun
- node: n/d
- python: n/d
- deploy: vercel
- monorepo: n/d
- pastas_fonte: src

## Números
| item | qtd |
|---|---|
| arquivos_total | 1527 |
| arquivos_codigo | 1156 |
| linhas_codigo | 226377 |
| rotas | 83 |
| rotas_http_backend | 0 |
| vistas_por_id | 0 |
| itens_menu | 64 |
| modulos | 71 |
| componentes | 521 |
| hooks | 155 |
| edge_functions | 17 |
| tabelas | 236 |
| migrations | 271 |
| cron_jobs | 22 |
| testes | 161 |
| workflows | 6 |
| scripts | 16 |
| docs_md | 55 |

## Onde ficam as coisas
- telas: src/pages (81), src/components (1)
- componentes: src/components (432), src/pages (82), src/contexts (4)
- hooks: src/hooks (129), src/components (22), src/contexts (4)
- servicos_logica: src/lib (106), src/services (99), src/integrations (3)
- testes: co-localizado (*.test) (145), outro (12), tests/ (3)
- edge_functions: supabase/functions
- migrations: supabase/migrations
- scripts: scripts/maintenance (4), scripts/ci (3), scripts/regras_negocio (3)
- docs: (raiz) (15), docs (2), .github (1)
- nomenclatura: {"componentes":"PascalCase (88%)","hooks":"use + PascalCase","servicos":"camelCase (100%)","edge_functions":"kebab-case (100%)","tabelas":"snake_case (91%)"}
- instruções para agentes no repo: AGENTS.md, CLAUDE.md

## Módulos (menu → domínio)
| módulo | itens de menu | telas/rotas | arquivos | hooks locais | edges | tabelas |
|---|---|---|---|---|---|---|
| components | 0 | 0 | 81 | 217 | 8 | 76 |
| components/accessibility | 0 | 0 | 5 | 2 | 0 | 0 |
| components/admin | 0 | 0 | 46 | 149 | 4 | 66 |
| components/analytics | 0 | 0 | 5 | 0 | 0 | 0 |
| components/auction | 0 | 0 | 7 | 30 | 2 | 10 |
| components/auth | 0 | 0 | 7 | 6 | 1 | 5 |
| components/bi | 0 | 0 | 5 | 2 | 0 | 0 |
| components/board | 0 | 0 | 6 | 15 | 0 | 3 |
| components/boss | 0 | 0 | 9 | 29 | 1 | 10 |
| components/campaigns | 0 | 0 | 11 | 43 | 3 | 21 |
| components/cards | 0 | 0 | 6 | 13 | 1 | 6 |
| components/dashboard | 0 | 0 | 7 | 156 | 3 | 54 |
| components/effects | 0 | 0 | 8 | 1 | 0 | 0 |
| components/engagement | 0 | 0 | 19 | 13 | 0 | 9 |
| components/luckywheel | 0 | 0 | 7 | 16 | 1 | 10 |
| components/manager | 0 | 0 | 10 | 55 | 4 | 35 |
| components/mobile | 0 | 0 | 15 | 11 | 0 | 0 |
| components/navigation | 0 | 1 | 7 | 72 | 3 | 27 |
| components/onboarding | 0 | 0 | 6 | 11 | 1 | 3 |
| components/prediction | 0 | 0 | 17 | 31 | 3 | 14 |
| components/quiz | 0 | 0 | 9 | 39 | 3 | 25 |
| components/rbac | 0 | 0 | 9 | 10 | 1 | 7 |
| components/security | 0 | 0 | 16 | 14 | 3 | 14 |
| components/shop-admin | 0 | 0 | 7 | 23 | 3 | 9 |
| components/sidebar | 0 | 0 | 5 | 20 | 2 | 9 |
| components/trails | 0 | 0 | 5 | 25 | 3 | 22 |
| components/ui | 0 | 0 | 67 | 12 | 0 | 0 |
| hooks | 0 | 0 | 129 | 477 | 9 | 155 |
| lib | 0 | 0 | 106 | 0 | 0 | 16 |
| pages | 46 | 82 | 82 | 473 | 14 | 169 |
| services | 0 | 0 | 96 | 7 | 8 | 162 |
| stories | 0 | 0 | 29 | 5 | 0 | 0 |

## Rotas (url → arquivo)
- `/` [tela] → src/pages/Index.tsx (protegida)
- `/*` [tela] → src/pages/NotFound.tsx
- `/admin` [tela] → src/pages/AdminPanel.tsx (protegida)
- `/admin/api-keys` [tela] → src/pages/ApiKeysAdmin.tsx (protegida)
- `/admin/burn-rate` [tela] → src/pages/BurnRate.tsx (protegida)
- `/admin/error-budget` [tela] → src/pages/ErrorBudget.tsx (protegida)
- `/admin/executive-report` [tela] → src/pages/ExecutiveMonthlyReport.tsx (protegida)
- `/admin/incident-metrics` [tela] → src/pages/IncidentMetrics.tsx (protegida)
- `/admin/permissions` [tela] → src/pages/PermissionsAdmin.tsx (protegida)
- `/admin/postmortems` [tela] → src/pages/Postmortems.tsx (protegida)
- `/admin/reliability` [tela] → src/pages/ReliabilitySLO.tsx (protegida)
- `/admin/runbook/:type` [tela] → src/pages/Runbook.tsx (protegida)
- `/admin/security-digests` [tela] → src/pages/SecurityDigests.tsx (protegida)
- `/admin/security-runbook` [tela] → src/pages/SecurityRunbook.tsx (protegida)
- `/admin/telemetria` [tela] → src/pages/AdminTelemetria.tsx (protegida)
- `/admin/webhooks` [tela] → src/pages/WebhooksAdmin.tsx (protegida)
- `/admin/webhooks/:id` [tela] → src/pages/WebhookSubscriptionDetail.tsx (protegida)
- `/admin/webhooks/executive` [tela] → src/pages/WebhooksExecutive.tsx (protegida)
- `/admin/webhooks/new` [tela] → src/pages/WebhookSubscriptionNew.tsx (protegida)
- `/album` [tela] → src/pages/CardAlbumPage.tsx (protegida)
- `/analytics` [tela] → src/pages/RealTimeAnalytics.tsx (protegida)
- `/announcements` [tela] → src/pages/Announcements.tsx (protegida)
- `/audit` [tela] → src/pages/AuditLogs.tsx (protegida)
- `/auth` [tela] → src/components/navigation/PageTransition.tsx (protegida)
- `/bi` [tela] → src/pages/BIDashboard.tsx (protegida)
- `/bingo` [tela] → src/pages/BingoPage.tsx (protegida)
- `/campanhas` [tela] → src/pages/SalesCampaigns.tsx (protegida)
- `/campanhas/:id` [tela] → src/pages/SalesCampaignDetail.tsx (protegida)
- `/campanhas/:id/ranking-equipes` [tela] → src/pages/CampaignTeamRanking.tsx (protegida)
- `/campanhas/equipes` [tela] → src/pages/CampaignTeamsDashboard.tsx (protegida)
- `/campanhas/historico` [tela] → src/pages/CampaignHistory.tsx (protegida)
- `/checkins` [tela] → src/pages/Checkins.tsx (protegida)
- `/chefao` [tela] → src/pages/BossBattlePage.tsx (protegida)
- `/conquistas` [tela] → src/pages/Achievements.tsx (protegida)
- `/duelos` [tela] → src/pages/Duels.tsx (protegida)
- `/engajamento` [tela] → src/pages/ContinuousEngagement.tsx (protegida)
- `/engajamento/diagnostico` [tela] → src/pages/ClimateDiagnostics.tsx (protegida)
- `/engajamento/nr1` [tela] → src/pages/Nr1Risks.tsx (protegida)
- `/engajamento/opinioes` [tela] → src/pages/OpinionChannel.tsx (protegida)
- `/estatisticas` [tela] → src/pages/PersonalStats.tsx (protegida)
- `/eventos/:eventId` [tela] → src/pages/SeasonalEventDetail.tsx (protegida)
- `/executivo` [tela] → src/pages/ExecutiveDashboard.tsx (protegida)
- `/feed` [tela] → src/pages/SocialFeed.tsx (protegida)
- `/feedback` [tela] → src/pages/Feedback.tsx (protegida)
- `/forgot-password` [tela] → src/pages/ForgotPassword.tsx
- `/goals` [tela] → src/pages/Goals.tsx (protegida)
- `/guerra-departamentos` [tela] → src/pages/DepartmentWarPage.tsx (protegida)
- `/leagues` [tela] → src/pages/Leagues.tsx (protegida)
- `/leilao` [tela] → src/pages/AuctionsPage.tsx (protegida)
- `/leilao/admin` [tela] → src/pages/AuctionsAdmin.tsx (protegida)
- `/loja` [tela] → src/pages/Shop.tsx (protegida)
- `/loja/admin` [tela] → src/pages/ShopAdmin.tsx (protegida)
- `/manager` [tela] → src/pages/ManagerDashboard.tsx (protegida)
- `/memoria` [tela] → src/pages/MemoryGamePage.tsx (protegida)
- `/memoria/admin` [tela] → src/pages/MemoryDeckAdminPage.tsx (protegida)
- `/pergunta-do-dia` [tela] → src/pages/DailyWagerPage.tsx (protegida)
- `/pergunta-do-dia/admin` [tela] → src/pages/WagerQuestionAdminPage.tsx (protegida)
- `/planos-acao` [tela] → src/pages/ActionPlans.tsx (protegida)
- `/ponto` [tela] → src/pages/Attendance.tsx (protegida)
- `/previsoes` [tela] → src/pages/PredictionMarketsPage.tsx (protegida)
- `/previsoes/admin` [tela] → src/pages/PredictionAdminPage.tsx (protegida)
- `/profile` [tela] → src/pages/Profile.tsx (protegida)
- `/quest-builder` [tela] → src/pages/QuestBuilder.tsx (protegida)
- `/quiz` [tela] → src/pages/DailyQuiz.tsx (protegida)
- `/quiz/admin` [tela] → src/pages/QuizAdmin.tsx (protegida)
- `/raspadinha` [tela] → src/pages/ScratchCardPage.tsx (protegida)
- `/relampago` [tela] → src/pages/LightningQuizPage.tsx (protegida)
- `/reports` [tela] → src/pages/EngagementReports.tsx (protegida)
- `/reset-password` [tela] → src/pages/ResetPassword.tsx
- `/roleta` [tela] → src/pages/LuckyWheelPage.tsx (protegida)
- `/roleta/admin` [tela] → src/pages/LuckyWheelAdmin.tsx (protegida)
- `/security` [tela] → src/pages/RateLimitDashboard.tsx (protegida)
- `/security-dashboard` [tela] → src/pages/SecurityDashboard.tsx (protegida)
- `/sequencia` [tela] → src/pages/SequenceGamePage.tsx (protegida)
- `/sequencia/admin` [tela] → src/pages/SequenceProcedureAdminPage.tsx (protegida)
- `/surveys` [tela] → src/pages/Surveys.tsx (protegida)
- `/tabuleiro` [tela] → src/pages/BoardTrailPage.tsx (protegida)
- `/tabuleiro/admin` [tela] → src/pages/BoardTrailAdminPage.tsx (protegida)
- `/torneios` [tela] → src/pages/TournamentsPage.tsx (protegida)
- `/trails` [tela] → src/pages/LearningTrails.tsx (protegida)
- `/trails/:id` [tela] → src/pages/TrailDetail.tsx (protegida)
- `/verificar` [tela] → src/pages/CertificateVerify.tsx
- `/verificar/:code` [tela] → src/pages/CertificateVerify.tsx

## Rotas HTTP de backend
- (nenhum)

## Vistas por id (menu/ViewRouter → arquivo)
- (nenhum)

## Edge functions
- `admin-alerts` — tabelas: attendance_records, audit_logs, profiles, shop_purchases, user_certifications; chamada por 1 arquivo(s) do front
- `ai-coach` — tabelas: -; chamada por 1 arquivo(s) do front
- `ai-course-builder` — tabelas: ai_course_jobs, learning_trails, quiz_options, quiz_questions, trail_modules; chamada por 1 arquivo(s) do front
- `churn-prediction` — tabelas: attendance_records, audit_logs, kudos, profiles, trail_enrollments, user_combos, user_roles; chamada por 1 arquivo(s) do front
- `competency-alerts` — tabelas: attendance_streaks, kudos, module_progress, notifications, profiles, quest_assignments, user_achievements; chamada por 2 arquivo(s) do front
- `detect-new-device` — tabelas: profiles, security_alerts; chamada por 1 arquivo(s) do front
- `generate-quiz-questions` — tabelas: learning_trails, trail_modules; chamada por 1 arquivo(s) do front
- `migrate-helper` (verify_jwt=false) — tabelas: -; chamada por 0 arquivo(s) do front
- `push-device-revoked` — tabelas: push_notification_logs, push_subscriptions; chamada por 1 arquivo(s) do front
- `push-outbox-dispatcher` — tabelas: push_notification_logs, push_outbox, push_subscriptions; chamada por 0 arquivo(s) do front, por SQL/cron
- `push-public-key` (verify_jwt=false) — tabelas: -; chamada por 1 arquivo(s) do front
- `reward-approval-review` — tabelas: audit_logs, profiles, purchase_approvals, shop_purchases, user_roles; chamada por 1 arquivo(s) do front
- `send-campaign-push` — tabelas: push_notification_logs, push_subscriptions; chamada por 1 arquivo(s) do front
- `trail-recommendations` — tabelas: learning_trails, module_progress, profiles, quest_assignments, team_members, trail_enrollments, user_roles; chamada por 2 arquivo(s) do front
- `verify-ip` — tabelas: ip_access_logs, ip_whitelist; chamada por 2 arquivo(s) do front
- `webhook-dispatcher` — tabelas: webhook_delivery_logs, webhook_subscriptions; chamada por 0 arquivo(s) do front
- `webhook-ping` — tabelas: webhook_subscriptions; chamada por 2 arquivo(s) do front

## Cron jobs (pg_cron / vercel)
- `api-key-rotation-overdue-weekly` 0 9 * * 1 (20260728210216_01d79f58-57ea-48d9-a859-ef3ddf891190.sql)
- `auto-lock-prediction-markets` */5 * * * * (20260728114514_7f6f6bd8-8c0c-4762-9f48-2e4474ed0b2b.sql)
- `auto-promote-expired-webhook-secrets` 0 3 * * * (20260712200006_664f7c03-75c3-4a12-9b8d-1d6da5c917d2.sql)
- `board-auto-unblock-daily` 0 4 * * * (20260728175346_9062e6fd-34a2-4490-82cd-d4877f2beafd.sql)
- `check-prediction-markets-health` */15 * * * * (20260728115201_58fcd8a8-c7ad-4a49-863c-74e07cdbc8e5.sql)
- `close-expired-auctions` */5 * * * * (20260728103701_298e9bca-0b39-4dba-aef0-058a9b24a556.sql)
- `close-expired-sales-campaigns` 15 0 * * * (20260723150852_6048cf0f-c3a4-48e7-9f40-e2b293b020b9.sql)
- `daily-cleanup-idempotency` 25 3 * * * (20260712115320_24a903a0-f49b-4374-b87b-b0775838c874.sql)
- `daily-cleanup-security-logs-30d` 20 3 * * * (20260712115320_24a903a0-f49b-4374-b87b-b0775838c874.sql)
- `daily-cleanup-security-logs-90d` 15 3 * * * (20260712115320_24a903a0-f49b-4374-b87b-b0775838c874.sql)
- `exec_monthly_report_generation` 0 6 1 * * (20260712222455_cdcbc232-1f35-4c6c-9c2c-0e4bf903e241.sql)
- `expire-card-trades-daily` 15 3 * * * (20260728121542_4ac8cbd1-0d6d-410d-8734-4fd032804ddc.sql)
- `lucky-wheel-payout-snapshot` 0 7 * * * (20260727211017_30d9a02a-0c84-4b45-8702-4bab7e71f005.sql)
- `lucky-wheel-window-alerts` 5 6 * * * (20260727213924_1ac322ab-1677-4094-96a8-c1ad0812647f.sql)
- `postmortem_overdue_daily_check` 0 9 * * * (20260712222316_d8f7eabc-3e3b-437f-b041-70b9f3b88f9b.sql)
- `push-outbox-dispatcher` * * * * * → edge push-outbox-dispatcher (20260728112123_ea25bb13-aa3c-4f75-9892-c58e2785e70b.sql)
- `push-outbox-health-snapshot` */15 * * * * (20260728112815_fd49db87-3ae3-448d-b394-dfe7f248adae.sql)
- `security-weekly-digest` 0 13 * * 1 → edge security-weekly-digest (20260712212544_f5c57b6a-8da7-4609-9178-803cbf5741f6.sql)
- `sla_breach_weekly_check` 0 8 * * 1 (20260712222009_147eee74-b689-46b7-b92b-d903d1e4754b.sql)
- `webhook-health-monitor-every-15min` */15 * * * * (20260712194718_bff07c8c-5744-4682-bba1-33f9ca2a1ecb.sql)
- `webhook-sla-daily-check` 0 4 * * * (20260712203117_fac39bdd-c966-4e9e-96f4-feee404f2a82.sql)
- `weekly-cleanup-expired-challenges` 30 3 * * 0 (20260712115320_24a903a0-f49b-4374-b87b-b0775838c874.sql)

## Integrações externas
- SDKs: Sentry, Supabase, react-query, zod
- hosts mais citados: openrouter.ai, edge.local, fcm.googleapis.com, i.pravatar.cc, taskgifts.app, www.youtube.com, a.com, api.pwnedpasswords.com, api.resend.com, app.exemplo.com, eidsaqymojyuhprobfpn.supabase.co, example.test, exemplo.com, linkedin.com, maintenance.invalid
- webhooks recebidos: migrate-helper, push-public-key
- env de integração (só nomes): CRON_SECRET, INTERNAL_FUNCTION_SECRET, OPENROUTER_API_KEY, RESEND_API_KEY, SENTRY_DSN, SENTRY_ENV, UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL, VITE_BITRIX_WEBHOOK_URL, VITE_SENTRY_DSN

## Permissões / papéis
- papéis no código: admin (13), alert (9), user (9), manager (8), system (6), button (5), status (5), assistant (3), group (3), grid (2), navigation (2), radio (2), radiogroup (2), Cargos (1), banner (1), contentinfo (1), dialog (1), gridcell (1), img (1), link (1), list (1), listitem (1), long (1), menu (1), menuitem (1), presentation (1), region (1), robot (1), role_assigned (1), separator (1), short (1), tab (1)
- enums de papel: app_role: admin|manager|employee
- guards: src/components/IpAccessGuard.tsx, src/components/engagement/diagnostics/AnonymityGuardNotice.tsx, src/components/rbac/AccessControl.tsx, src/components/rbac/ProtectedRoute.tsx · rotas protegidas: 78 · públicas: /*, /forgot-password, /reset-password, /verificar, /verificar/:code
- feature flags: nenhuma

## Alertas (baseline.json → alertas)
- rotas_sem_arquivo: 0
- componentes_ambiguos: 0
- menu_sem_destino: 18 — ex.: Ações Rápidas -> quick-actions, Acompanhe o Progresso -> goal-progress, Bem-vindo ao Dashboard! 🎉 -> welcome
- edges_orfas: 0
- edges_chamadas_sem_pasta: 0
- tabelas_sem_rls: 1 — ex.: lucky_wheel_prizes
- tabelas_usadas_sem_definicao: 0
- tabelas_com_drift_migration_vs_types: 11 — ex.: achievements, engagement_factors, lucky_wheel_prizes
- rpcs_sem_definicao: 1 — ex.: get_lucky_wheel_status
- componentes_orfaos: 24 — ex.: src/components/admin/metrics/AdminMetricsCharts.tsx, src/components/admin/permissions/PermissionModuleAccordion.tsx, src/components/admin/telemetry/TelemetryTable.tsx
- componentes_com_nome_duplicado: 8 — ex.: CopilotAlert, LevelUpCelebration, PageTransition
- scripts_orfaos: 0
- env_usadas_nao_declaradas: 6 — ex.: DEV, MODE, NODE_ENV
- ciclos_de_import: 2
- possiveis_segredos_no_codigo: 0

## Grafo de código (graphify)
- 10025 nós · 27905 arestas · 621 comunidades · grafo do commit `2d24251f`
- comunidades maiores: lucide-react (282), react (232), badge.tsx (214), App.tsx (162), client.ts (146), cn (136), useAuth (115), SecurityDashboard.tsx (106), useToast (100), mobile/index.ts (91), WagerIntegrityCard.tsx (90), skeleton.tsx (88)
- símbolos mais chamados: cn() (src/lib/utils.ts), useAuth() (src/hooks/useAuth.tsx), useIsMobile() (src/hooks/use-mobile.tsx), q() (scripts/supabase_snapshot/snapshot.py), useDepartments() (src/hooks/useDepartments.ts), useToast() (src/hooks/use-toast.ts), useRBAC() (src/hooks/useRBAC.ts), useProfiles() (src/hooks/useProfiles.ts), useSEO() (src/hooks/useSEO.ts), useSoundEffects() (src/hooks/useSoundEffects.tsx), .collect() (scripts/supabase_snapshot/test_snapshot.py), excluded_sql() (scripts/supabase_snapshot/snapshot.py)
- consulta local: `graphify query "<pergunta>"`, `graphify path "<A>" "<B>"`, `graphify explain "<X>"`

## Hotspots (arquivos mais alterados, 90 dias)
- package.json (21)
- bun.lock (13)
- .github/workflows/ci.yml (12)
- AGENTS.md (5)
- docs/estado/05-edge-functions.md (5)
- docs/prod-readiness.md (5)
- vercel.json (5)
- .github/workflows/contexto.yml (4)
- RELATORIO_CI.md (4)
- docs/agentes/github-ci.md (4)
- docs/agentes/mapa-repo.md (4)
- scripts/automation.mjs (4)
- supabase/functions/webhook-dispatcher/index.ts (4)
- .env.example (3)
- .github/workflows/automation-local.yml (3)

## Workflows
- `automation-local.yml` — Automação local (pull_request, push, workflow_dispatch)
- `ci.yml` — CI (pull_request, push)
- `contexto.yml` — Contexto para agentes de IA (10 min) (push, schedule, workflow_dispatch; cron 3 * * * *)
- `deno.yml` — Edge Functions (Deno) (pull_request, push, workflow_dispatch)
- `dependency-review.yml` — Dependency Review (pull_request)
- `deploy-edge-functions.yml` — Deploy Edge Functions (push, workflow_dispatch)

## Scripts npm
- `maintenance:doctor`: `sh scripts/maintenance/run.sh doctor --root .`
- `maintenance:check`: `sh scripts/maintenance/run.sh check --root . --ref origin/main`
- `maintenance:heal`: `sh scripts/maintenance/run.sh heal --root . --ref origin/main`
- `test:maintenance`: `node --test scripts/maintenance/maintenance.unit.mjs`
- `dev`: `vite`
- `build`: `node scripts/ci/check-supabase-env.mjs && vite build`
- `build:dev`: `vite build --mode development`
- `lint`: `eslint .`
- `typecheck`: `tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json`
- `test:guard-env`: `node --test scripts/ci/check-supabase-env.unit.mjs`
- `test`: `vitest run`
- `test:ci`: `vitest run --coverage --reporter=verbose`
- `test:contracts`: `vitest run supabase/functions`
- `test:edge`: `bunx --bun deno@2 test --allow-env --allow-read --allow-net=deno.land,esm.sh,registry.npmjs.org supabase/functions/_shared`
- `preview`: `vite preview`
- `prepare`: `husky`
- `graph:setup`: `bash scripts/graphify/setup.sh`
- `postinstall`: `node ./scripts/patch-recharts.cjs`
- `contexto:codigo`: `node scripts/ai-context/gerar.mjs --out docs/contexto/codigo`
- `contexto:regras`: `python3 scripts/regras_negocio/generate.py --repo . --out docs/contexto/regras --profile regras --index-path docs/contexto/00-INDEX.md --no-pointer`
- `contexto:test`: `node --test scripts/ai-context/gerar.unit.mjs scripts/ci/contexto-indice.unit.mjs scripts/ci/contexto-publicacao.unit.mjs scripts/ci/regras-negocio.unit.mjs scripts/ci/supabase-snapshot.unit.mjs`
- `db:guard`: `node scripts/db-audit/check-migration-drift.mjs --snapshot docs/contexto/supabase`
- `db:guard:test`: `node --test scripts/ci/check-migration-drift.unit.mjs`
- `automation:doctor`: `node scripts/automation.mjs doctor`
- `automation:test`: `node scripts/automation.mjs test`
- `automation:check`: `node scripts/automation.mjs check --ref HEAD`
- `automation:heal`: `node scripts/automation.mjs heal --ref origin/main`
- `automation:nightly`: `node scripts/automation.mjs nightly --ref origin/main`
- `automation:graph`: `node scripts/automation.mjs graph`
- `automation:status`: `node scripts/automation.mjs graph status`
- `automation:install-hooks`: `node scripts/automation.mjs install-hooks`
- `automation:uninstall-hooks`: `node scripts/automation.mjs uninstall-hooks`

## Documentos (raiz e docs/)
- `.github/PULL_REQUEST_TEMPLATE.md` (33 linhas)
- `AGENTS.md` — AGENTS.md — Task Gifts V2 (145 linhas)
- `AUDIT_INVENTORY_CHECKLIST.md` — ✅ Checklist de Inventário Auditável (24 linhas)
- `CLAUDE.md` (2 linhas)
- `DESIGN_SYSTEM_REPORT.md` — 📊 Task Gifts - Relatório Completo do Design System (360 linhas)
- `ENTERPRISE_AUDIT_REPORT.md` — 🏆 Relatório de Auditoria de Software Enterprise (111 linhas)
- `ESTADO_ATUAL.md` — Estado Atual do Sistema — TaskGifts v2 (494 linhas)
- `GAMIFICATION_AUDIT_REPORT.md` — 🎮 Auditoria de Gamificação - Status de Implementação (44 linhas)
- `INVENTARIO_FUNCIONALIDADES.md` — 📋 INVENTÁRIO COMPLETO DE FUNCIONALIDADES E FERRAMENTAS (1065 linhas)
- `PADROES_LAYOUT_UX.md` — 📐 PADRÕES DE LAYOUT/UX - TASK GIFTS (1584 linhas)
- `PENDENCIAS.md` — PENDÊNCIAS (37 linhas)
- `README.md` — Task Gifts V2 — Plataforma de Gamificação Corporativa (85 linhas)
- `RELATORIO_CI.md` — RELATÓRIO CI — Task_Gifts_V2 (79 linhas)
- `SYSTEM_INVENTORY_AUDIT.md` — 📊 Relatório de Auditoria Enterprise & Inventário Minucioso do Sistema (81 linhas)
- `SYSTEM_RELIABILITY_AUDIT.md` — 🛡️ Relatório de Auditoria de Confiabilidade e Robustez (Versão 10/10) (49 linhas)
- `audit_report.md` — 📊 Relatório de Auditoria Enterprise & Inventário Minucioso do Sistema (81 linhas)
- `docs/AUTOMACAO_LOCAL.md` — Automação local — Task_Gifts_V2 (82 linhas)
- `docs/prod-readiness.md` — Prod Readiness — TaskGifts (Task_Gifts_V2) (162 linhas)
- subpastas de docs/: docs/estado (11), docs/pendencias (8), docs/agentes (7), docs/contexto (2)


## Últimos commits
- 2026-11-22 `2d24251` feat(edge): ponte admin para webhook-dispatcher (webhook-ping) (#102)
- 2026-11-22 `e5fb530` fix(edge): aceita url de app no push e ajusta contrato de versao do webhook (#101)
- 2026-11-22 `03d0d59` fix(webhook-dispatcher): devolve 401 em vez de 500 ao rejeitar token sem permissao (#100)
- 2026-11-22 `d04ac2d` feat(edge): contratos zod, 422 unico e versionamento v1/v2 dos webhooks (#99)
- 2026-11-22 `b042057` fix: usa JWT de sessao no AI coach em vez do publishable key (#98)
- 2026-11-22 `0134cf0` fix(deps): corrige CVE alto zod transitivo via override chromium-bidi (#97)
- 2026-11-22 `6fd6436` docs(edge-functions): encerra pendencia 03 com validacao em producao (#96)
- 2026-11-22 `6925771` fix(auth): bloqueia senha vazada (HIBP) no cadastro (#95)
- 2026-11-22 `16748b9` fix(e2e): happy-paths com rotas/UI reais e credenciais de teste por env (#94)
- 2026-11-21 `d50f0a1` chore(docs): evidencia validacao HIBP range API (pendencia 03) (#93)
- 2026-11-21 `2eace82` fix(deps): fecha CVEs moderados uuid/glob/postcss-selector-parser via overrides (#92)
- 2026-11-21 `4ce5f92` chore(docs): documenta validacao do swap OpenRouter e deploys integros (#91)
- 2026-11-21 `08928cc` feat(edge): move API de IA de Lovable para OpenRouter nas 6 edge functions
- 2026-11-21 `f095e46` fix: checa admin via rpc has_role em competency-alerts (e atualiza doc 05) (#88)
- 2026-11-21 `f76c9b7` fix: corrige typo de tipo no catch do log de ip_access_logs (#89)

## Arquivos deste diretório
- `docs/contexto/codigo/rotas.json`
- `docs/contexto/codigo/modulos.json`
- `docs/contexto/codigo/componentes.json`
- `docs/contexto/codigo/hooks.json`
- `docs/contexto/codigo/edge-functions.json`
- `docs/contexto/codigo/banco.json`
- `docs/contexto/codigo/ferramentas.json`
- `docs/contexto/codigo/scripts.json`
- `docs/contexto/codigo/testes.json`
- `docs/contexto/codigo/logica.json`
- `docs/contexto/codigo/grafo.json`
- `docs/contexto/codigo/grafo-arestas.json`
- `docs/contexto/codigo/convencoes.json`
- `docs/contexto/codigo/grafo-graphify.json`
- `docs/contexto/codigo/baseline.json`
- `docs/contexto/codigo/manifest.json` (commit, data, hashes, erros — único arquivo com data/hora)
