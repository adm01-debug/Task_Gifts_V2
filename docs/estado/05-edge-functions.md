# Dimensão 5 — Edge Functions

> Documento de detalhe da auditoria de estado — 36 funções Deno.
> Evidência em `arquivo:linha`. Correções da Fase D estão em `ESTADO_ATUAL.md` e em `04-dados-e-runtime.md`.
> Runtime de build/teste = `NAO_VERIFICADO` (node_modules ausente no ambiente da auditoria).

---

# Auditoria de Estado — `supabase/functions` (task-gifts-v2)

Escopo: 37 diretórios em `/home/user/task-gifts-v2/supabase/functions` = **36 Edge Functions** + `_shared/` (9 arquivos, 890 linhas). Total medido: **10.002 linhas** de `.ts`.

Método: leitura integral de todos os `index.ts` e de `_shared/*`; `grep` de cada nome de function em `/home/user/task-gifts-v2/src`; cruzamento com `supabase/migrations/*.sql` (`net.http_post`), `supabase/config.toml`, `.env`, `.env.example` e `src/integrations/supabase/types.ts` (schema real). Nenhum arquivo foi editado; nenhuma function foi invocada.

---

## Tabela — 36 Edge Functions

| Edge Function | O que faz | Classificação | Chamador (arquivo:linha ou NENHUM) | Tabelas | API externa | Secrets | Problema |
|---|---|---|---|---|---|---|---|
| **admin-alerts** | Varre 7 heurísticas (inativos, XP zero, streaks, check-in, compras pendentes, certificações, pico de auditoria) e devolve lista de alertas ao admin | 🟨 | `src/hooks/useAdminAlerts.ts:17` (`invokeEdgeSafe("admin-alerts")`) — bloqueado pela allowlist vazia | lê `profiles`, `attendance_records`, `shop_purchases`, `user_certifications`, `audit_logs`; RPC `has_role` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | Só calcula; não persiste nada. Import morto `deno.land/x/xhr` (`admin-alerts/index.ts:1`) |
| **ai-coach** | Chat streaming do coach de gamificação via Lovable AI Gateway (Gemini 2.5 Flash), com prompt de contexto do usuário | ⬛ | **NENHUM** — a única ocorrência é comentário de doc em `src/lib/requestId.ts:9`, não é chamada | nenhuma (só lê o body) | `https://ai.gateway.lovable.dev/v1/chat/completions` (`ai-coach/index.ts:77,156`) | `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SENTRY_DSN`, `UPSTASH_*` | Tabela `ai_coach_messages`=0 em produção; nada persiste conversas. Function nunca é invocada pelo front |
| **ai-course-builder** | Baixa arquivo do bucket `course-uploads`, extrai texto (.txt/.md/PDF ingênuo) e gera trilha+módulos+quiz via IA | 🟨 | `src/services/aiCourseBuilderService.ts:57` | lê/escreve `ai_course_jobs`; escreve `learning_trails`, `trail_modules`, `quiz_questions`, `quiz_options`; storage `course-uploads` | `https://ai.gateway.lovable.dev/v1/chat/completions` (`ai-course-builder/index.ts:130`) | `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | `ai_course_jobs`=0 em produção → nunca executou. Extração de PDF por regex `\(([^)]{2,})\)` (`:106`) é heurística frágil. Sem checagem de papel: qualquer usuário autenticado cria trilhas |
| **birthday-celebrations** | Cron diário: cria `celebrations` de aniversário e de tempo de casa, credita XP/moedas e notifica | ⬛ | **NENHUM** (nenhuma ref em `src/`, nenhum `net.http_post` em migrations, nenhum job pg_cron ativo) | lê `profiles`; escreve `celebrations`, `notifications`; RPC `increment_user_xp_coins` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | **RPC `increment_user_xp_coins` NÃO EXISTE** (`:89` e `:154`; ausente de `types.ts` e das migrations) e o retorno não é checado → recompensa nunca é creditada, mas a function retorna `success:true` |
| **bitrix24-api** | Proxy REST completo para Bitrix24 (crm/tasks/calendar/users/timeman/im/notify + módulo `raw` genérico) | ⬛ | **NENHUM** | lê/escreve `bitrix24_tokens`; escreve `bitrix24_webhook_logs` | `https://{BITRIX24_DOMAIN}/rest/*` e `/oauth/token/` (`:55,91`) | `BITRIX24_CLIENT_ID`, `BITRIX24_CLIENT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_*` | **SEM QUALQUER AUTENTICAÇÃO** (`:111-135` — nenhum `verifyUser`/`verifyServiceRole`). Módulo `raw` (`:401-403`) permite executar qualquer método REST do Bitrix com o token OAuth armazenado. `bitrix24_tokens`=0 → `getValidToken` sempre lança "Bitrix24 não conectado" |
| **bitrix24-oauth** | Fluxo OAuth Bitrix24: `authorize` / `callback` / `refresh` / `status` | ⬛ | **NENHUM** | lê/escreve `bitrix24_tokens` | `https://{BITRIX24_DOMAIN}/oauth/authorize/` e `/oauth/token/` (`:40,62,136`) | `BITRIX24_CLIENT_ID`, `BITRIX24_CLIENT_SECRET`, `BITRIX24_DOMAIN`, `FRONTEND_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | **SEM AUTENTICAÇÃO** (`:9-20`): `action=status` vaza config, `action=refresh` gira tokens de terceiros. `user_id` cai para placeholder `00000000-...` (`:101`). `bitrix24_tokens`=0 |
| **bitrix24-webhook** | Recebe eventos do Bitrix24 (CRM/tasks/users), valida HMAC + idempotência e sincroniza mapeamentos | ⬛ | **NENHUM** (webhook externo; nenhuma evidência de provedor configurado) | escreve `bitrix24_webhook_logs`, `bitrix24_sync_mappings`, `notifications`, `webhook_idempotency`, `quest_assignments`; lê `user_roles`, `custom_quests`; RPC `add_user_xp` | — (recebe) | `BITRIX24_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`, `UPSTASH_*` | **RPC `add_user_xp` NÃO EXISTE** (`:339`) → conclusão de task nunca credita XP. `bitrix24_webhook_logs`/`bitrix24_sync_mappings`/`webhook_idempotency`=0. `config.toml` sem `[functions]` → `verify_jwt` default `true` bloqueia o provedor externo |
| **burn-rate-monitor** | Burn-rate multi-janela estilo Google SRE (1h/5m ≥14.4x, 6h/30m ≥6x) → cria alerta e escala | ⬛ | **NENHUM** (nenhum job pg_cron, nenhuma ref em `src/`) | lê/escreve `security_alerts`; RPC `get_burn_rate` | — (invoca `dispatch-critical-alert` via `sb.functions.invoke`, `:77`) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SLO_TARGET` | Envia `message:` para `dispatch-critical-alert` (`:78`) mas o destino lê `payload.title` (`dispatch-critical-alert/index.ts:66,99`) → título `undefined`. `security_alerts`=0 |
| **checkin-reminders** | Cron: lembretes de check-in 1:1 (hoje/amanhã/atrasado) para gestor e colaborador | ⬛ | **NENHUM** | lê `checkins` (+join `profiles`); lê/escreve `notifications` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Ramo "amanhã" (`:138-176`) e ramo "atrasado" (`:190-215`) não têm deduplicação → geram notificação duplicada a cada execução |
| **churn-prediction** | Monta métricas de engajamento de TODOS os perfis e pede à IA ranking de risco de churn | 🟨 | `src/services/churnPredictionService.ts:35` | lê `profiles`, `attendance_records`, `kudos`, `trail_enrollments`, `user_combos`, `audit_logs` | `https://ai.gateway.lovable.dev/v1/chat/completions` (`:176`) | `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `UPSTASH_*` | Sem checagem de papel: **qualquer usuário autenticado** recebe e-mail + métricas de todos os colegas (`:47` só chama `verifyUser`). N+1: 6 queries por perfil. Nada é persistido |
| **cleanup-old-security-logs** | Chama `rpc('cleanup_old_security_logs')` | ⬛ | **NENHUM** — o job pg_cron homônimo ativo chama a **função SQL**, não esta edge function | RPC `cleanup_old_security_logs` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Duplicata redundante de `cleanup-rate-limit-logs`; a limpeza já roda por pg_cron direto no SQL |
| **cleanup-rate-limit-logs** | Mesma RPC com `p_days_to_keep` + registro em `audit_logs` | ⬛ | **NENHUM** | escreve `audit_logs`; RPC `cleanup_old_security_logs` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Nome não corresponde ao que faz (limpa security logs, não rate-limit logs). Redundante com a anterior |
| **competency-alerts** | Calcula 6 competências heurísticas e cria notificações de gap / dica / celebração | 🟨 | `src/hooks/useCompetencyAlerts.ts:28`, `:48`; `src/services/notificationsService.ts:184` | lê `module_progress`, `quest_assignments`, `user_achievements`, `kudos`, `attendance_streaks`, `profiles`; escreve `notifications` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `UPSTASH_*` | **Lê `profiles.role`** (`:212`, `:234`) — coluna **inexistente** (confirmado em `types.ts`; papéis vivem em `user_roles`). O select falha, `profile` fica `null` → `checkAllUsers` e análise de terceiros dão **403 permanente** |
| **detect-new-device** | Registra fingerprint de dispositivo, gera `security_alert` e e-mail de novo login | 🟨 | `src/hooks/useDeviceDetection.ts:95` | escreve `security_alerts`; lê `profiles`; RPC `register_device` | `https://api.resend.com/emails` (`:161`) | `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SENTRY_DSN` | `security_alerts`=0 → nunca executou. Remetente hardcoded `onboarding@resend.dev` (`:168`) — domínio de sandbox do Resend. `body.userId` é lido (`:34`) e descartado |
| **dispatch-critical-alert** | Escala alertas `high`/`critical` para Slack + notificação in-app de admins | 🟨 | Trigger DB `trigger_dispatch_critical_alert` em `security_alerts` (`supabase/migrations/20260712203400_...sql:18-19`); `burn-rate-monitor/index.ts:77`; `error-budget-monitor/index.ts:133` | lê `user_roles`; escreve `notifications` | Slack Incoming Webhook (`:78`) | `SLACK_ALERT_WEBHOOK_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | O trigger DB envia a **anon key** como Bearer (migration `:11,33`), mas `verifyServiceRole` (`:34`) só aceita service-role/`INTERNAL_FUNCTION_SECRET`/`CRON_SECRET` → **401 em todas as invocações do trigger**. `security_alerts`=0 |
| **error-budget-monitor** | Avalia burn% do orçamento de erros 30d (75%/90%), cria alerta e chama o dispatcher via HTTP | ⬛ | **NENHUM** | lê/escreve `security_alerts`; RPC `get_error_budget_30d` | `${SUPABASE_URL}/functions/v1/dispatch-critical-alert` (`:61,133`) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Único ponto que passa service-role corretamente (`:137`), mas ele próprio não tem chamador. `security_alerts`=0 |
| **external-api** | REST pública com API key/secret: tasks, users, XP/coins, leaderboard, achievements, webhooks, stats (822 linhas, 20+ rotas) | ⬛ | **NENHUM** (consumidores externos; `external_api_keys`=0 em produção) | `external_tasks`, `profiles`, `departments`, `positions`, `achievements`, `user_achievements`, `webhook_subscriptions`, `api_request_logs`; RPCs `validate_api_key`, `process_external_task`, `complete_external_task`, `get_user_stats_api`, `get_leaderboard_api`, `get_executive_metrics` | — (recebe) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `external_api_keys`=0 → `validate_api_key` sempre falha → **100% das requisições retornam 401**. `rate_limit_per_minute` é lido no tipo (`:15`) mas **nunca aplicado**. `POST /users/{email}/add-xp` altera XP/nível por leitura-modificação-escrita sem transação (`:515-521`) → race condition. `verify_jwt` default bloqueia o chamador externo |
| **external-db-bridge** | "Ponte" de telemetria (`emit_telemetry`, `batch_telemetry`, `health`) **e** executor de query genérica | ⬛ | **NENHUM** | escreve `query_telemetry`; **qualquer tabela** via `action:'query'` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | **BYPASS TOTAL DE RLS**: `action:'query'` (`:215-296`) executa `select/insert/update/delete` em **qualquer tabela** com a service-role key, exigindo apenas um JWT de usuário comum (`:92`). Nenhuma allowlist de tabela, nenhuma checagem de papel |
| **external-webhook** | Ingestão de eventos externos (task.*, user.*, achievement.grant, batch.*) com HMAC + anti-replay + idempotência (825 linhas) | ⬛ | **NENHUM** (provedores externos; `external_api_keys`=0) | `external_tasks`, `profiles`, `attendance_settings`, `attendance_records`, `task_penalties`, `achievements`, `user_achievements`, `webhook_subscriptions`, `webhook_idempotency`; RPCs `validate_api_key`, `process_external_task`, `complete_external_task`, `add_user_rewards` | — (recebe); invoca `webhook-dispatcher` (`:813`) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN` | **RPC `add_user_rewards` NÃO EXISTE** (`:722`) → `achievement.grant` não credita nada. `external_api_keys`=0 → sempre 401. `verify_jwt` default bloqueia provedores externos. Tem teste (`external-webhook/validation.test.ts`) mas só de schema |
| **generate-quiz-questions** | Gera N perguntas de quiz a partir do conteúdo de uma trilha via IA | 🟨 | `src/components/quiz/AIQuestionGenerator.tsx:55` | lê `learning_trails`, `trail_modules` | `https://ai.gateway.lovable.dev/v1/chat/completions` (`:144`) | `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `UPSTASH_*` | Não persiste as perguntas (devolve JSON). Sem checagem de papel: qualquer usuário autenticado consome créditos de IA |
| **push-device-revoked** | Push de segurança real para os demais aparelhos do próprio usuário quando uma inscrição é revogada | 🟨 | `src/services/pushSubscriptionService.ts:391` | lê/escreve `push_subscriptions`; escreve `push_notification_logs` | Web Push (endpoints FCM/Mozilla via `npm:web-push@3.6.7`) | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `push_subscriptions`=0 e `push_notification_logs`=0 → nunca executou. Sem VAPID configurado retorna 503 (`:27`) |
| **push-outbox-dispatcher** | Consome a fila `push_outbox` (claim atômico + retry/backoff + invalidação de endpoint) | 🟨 | Migration `supabase/migrations/20260728112123_...sql:242-254` agenda cron `push-outbox-dispatcher` `* * * * *` — **job NÃO consta na lista de pg_cron ativos** | lê/escreve `push_outbox`, `push_subscriptions`; escreve `push_notification_logs`; RPC `claim_push_outbox` | Web Push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | **`push_outbox`=6 linhas represadas** e `push_notification_logs`=0 → a fila enche e nada é entregue. O cron da migration envia **sem header `Authorization`** → `guardInternalRequest` (`:27`) devolveria 401 mesmo se o job estivesse ativo |
| **push-public-key** | Devolve a `VAPID_PUBLIC_KEY` (9 linhas) | 🟨 | `src/services/pushSubscriptionService.ts:66` | nenhuma | — | `VAPID_PUBLIC_KEY` | Sem `VAPID_PUBLIC_KEY` retorna `{publicKey:null}` com HTTP 200 (`:5-8`) — o front não distingue "não configurado" de erro |
| **reward-approval-review** | Heurística determinística de risco de resgate (`risk.ts`, 289 linhas) + parecer de IA limitado a ±15 pontos | 🟨 | `src/services/purchaseGovernanceService.ts:84` | lê/escreve `shop_purchases`; lê `user_roles`, `profiles`, `audit_logs`; escreve `purchase_approvals` | `https://ai.gateway.lovable.dev/v1/chat/completions` (`:65`) | `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | Único caso com governança bem construída (IA nunca decide, `risk.ts` é puro e espelhado em `src/lib/purchaseRisk.ts`). `LOVABLE_API_KEY!` no top-level (`:8`) derruba o módulo se o secret faltar |
| **security-weekly-digest** | Digest semanal de segurança (SLA/MTTR/top tipos) → Slack + notificação in-app | 🟨 | Migration `supabase/migrations/20260712212544_...sql:1-11` agenda cron `security-weekly-digest` `0 13 * * 1` — **job NÃO consta nos pg_cron ativos** | lê `security_alerts`; lê `user_roles`; escreve `notifications` | Slack Incoming Webhook (`:84`) | `SLACK_ALERT_WEBHOOK_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | **Seleciona a coluna `resolved`** (`:46`) — o schema real tem **`is_resolved`** (`types.ts:9001`) → erro PostgREST → **500 garantido**. O `upsert` usa `onConflict:"user_id,type,data"` (`:109`) sem índice único correspondente → 42P10. Cron da migration não envia `Authorization` → 401 em `guardInternalRequest` (`:32`) |
| **send-campaign-push** | Envia push em lote para até 500 usuários respeitando preferências, com retry/backoff e invalidação | 🟨 | `src/services/salesCampaignsService.ts:142` | lê/escreve `push_subscriptions`; escreve `push_notification_logs`; RPCs `user_wants_push_notification`, `increment_push_failures`, `reset_push_failures` | Web Push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `push_subscriptions`=0 e `push_notification_logs`=0 → nunca entregou. Aceita **qualquer JWT** (`:38-41`) e permite notificar 500 `user_ids` arbitrários — sem checagem de papel |
| **send-email-digest** | Monta HTML de resumo semanal com XP/moedas/quests/ranking | ⬛ | **NENHUM** | lê `profiles`, `xp_transactions`, `coin_transactions`, `user_quests`, `user_achievements`, `attendance_streaks` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | **STUB**: o `emailHTML` gerado (`:247`) é descartado; só faz `console.log` (`:250`). Além disso consulta `profiles.full_name` e `profiles.digest_enabled` (`:158-159`) — **nenhuma das duas existe** (`full_name` não existe no schema; `digest_enabled` pertence a `notification_preferences`) → query falha → **500 garantido**. Ranking O(n) carregando todos os perfis por usuário (`:219-224`) |
| **send-email-notifications** | Monta e-mails digest/reminder/celebration com telemetria Sentry detalhada | ⬛ | **NENHUM** | lê `profiles`, `notifications`, `pulse_surveys`, `checkins`, `feedback_requests`, `celebrations`; escreve `audit_logs` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | **STUB que retorna sucesso sem fazer nada**: `console.log("Would send email to ...")` (`:178`) e a resposta admite `"Emails logged. Integrate with email service for actual delivery."` (`:232`). O contador `delivered` conta inserts em `audit_logs`, não e-mails |
| **send-rate-limit-alert** | Bloqueia IP automaticamente, registra violação e notifica admins | ⬛ | **NENHUM** | escreve `rate_limit_logs`, `notifications`; lê `user_roles`, `blocked_ips`; RPC `auto_block_ip` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | `blocked_ips`=0 em produção. `try/catch` em volta de `await supabase.from(...).insert()` (`:78-82`) não captura erro do PostgREST (que retorna em `{error}`, não lança) — o "skipping" nunca dispara |
| **survey-reminders** | Cron: lembra quem não respondeu pesquisas que encerram em ≤3 dias / hoje | ⬛ | **NENHUM** | lê `pulse_surveys`, `profiles`, `pulse_responses`; lê/escreve `notifications` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | Ramo "encerra hoje" (`:110-141`) sem deduplicação → notificação duplicada por execução. Loop N×M sem paginação |
| **trail-recommendations** | Recomenda até 5 trilhas via IA com base em perfil, departamento, gaps de score | 🟨 | `src/components/TrailRecommendations.tsx:55` | lê `profiles`, `team_members`, `trail_enrollments`, `quest_assignments`, `module_progress`, `learning_trails` | `https://ai.gateway.lovable.dev/v1/chat/completions` (`:237`) | `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `UPSTASH_*` | Controle de acesso **é apenas um `console.log`**: `:72-75` detecta que o usuário pediu dados de terceiro, comenta "In a more complex system, we'd check..." e **prossegue mesmo assim** → IDOR. Nada é persistido |
| **verify-geo** | Bloqueio geográfico por país via lookup de IP | ⬛ | **NENHUM** (só citada como exemplo em `.env.example:25`) | lê `geo_settings`, `geo_allowed_countries`; escreve `geo_access_logs` | `http://ip-api.com/json/{ip}` (`:19`) — **HTTP em texto claro** | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Chamada de geolocalização por **HTTP sem TLS** (`:19`) — resposta que decide acesso é interceptável. `catch` final devolve `allowed:true` com HTTP 200 (`:186-194`): qualquer exceção **abre** o bloqueio |
| **verify-ip** | Whitelist de IP na tela de login | 🟨 | `src/components/IpAccessGuard.tsx:38` e `src/pages/Auth.tsx:59` (ambos precedidos de `isFunctionDeployed("verify-ip")` em `IpAccessGuard.tsx:29` / `Auth.tsx:51`) | lê `ip_whitelist`; escreve `ip_access_logs` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `catch` final devolve `allowed:true` (`:139-145`) — falha interna libera acesso. Como a allowlist está vazia, `isFunctionDeployed` já retorna `false` e a guarda de IP **nunca roda no cliente** |
| **webhook-dispatcher** | Entrega webhook assinado (HMAC) com retry exponencial, dupla assinatura em rotação e log de entrega | 🟨 | `src/pages/WebhooksAdmin.tsx:153`; `src/pages/WebhookSubscriptionDetail.tsx:152`, `:207`; `external-webhook/index.ts:813` | lê/escreve `webhook_subscriptions`; escreve `webhook_delivery_logs` | URL arbitrária da assinatura (`:117`) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | **Fallback de assinatura falso** (`:271-284`): se `createHmac` falhar, gera um hash não-criptográfico de 32 bits e o rotula `sha256=` — o destinatário valida uma assinatura forjável. `webhook_subscriptions`/`webhook_delivery_logs`=0. Chamado do front com JWT de usuário, mas exige service-role (`:19`) → **401** |
| **webhook-health-monitor** | Alerta no Sentry quando a taxa de sucesso por assinatura cai abaixo de 90% na última hora | 🟨 | Migration `supabase/migrations/20260712194718_...sql:10-24` agenda `webhook-health-monitor-every-15min` — **job NÃO consta nos pg_cron ativos** | RPC `get_webhook_delivery_stats_1h` | Sentry (opt-in) | `WEBHOOK_HEALTH_THRESHOLD`, `WEBHOOK_HEALTH_MIN_SAMPLE`, `SENTRY_DSN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | O cron manda a **anon key** como Bearer (migration `:5,18`) e `guardInternalRequest` (`:25`) exige service-role → **401**. `webhook_delivery_logs`=0 → nada a medir |
| **weekly-league-processing** | Promove/rebaixa membros de liga por XP semanal, zera XP e notifica | ⬛ | **NENHUM** | lê `leagues`; lê/escreve `league_members`; escreve `league_history`, `notifications` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | **Tabela `league_members` NÃO EXISTE** no schema (ausente de `types.ts`; só existem `leagues` e `league_history`). O erro cai no `continue` (`:61-64`) e a function **retorna `success:true` com 0 promoções** — sucesso sem fazer nada |

### `_shared/` (9 arquivos, não são endpoints)

| Arquivo | O que é | Importadores | Observação |
|---|---|---|---|
| `_shared/security.ts` (131) | CORS, `HttpError`, `verifyUser`, `verifyServiceRole` (comparação em tempo constante), `guardInternalRequest` | 24 | Base de auth de quase tudo; bem escrito |
| `_shared/sentry.ts` (145) | `withSentry`, breadcrumbs, `recordMetric`, `timeStep` | 7 | Import dinâmico de `deno.land/x/sentry` **sem versão pinada** (`:14`) |
| `_shared/rate-limiter.ts` (113) | Rate limit híbrido Upstash + memória | 7 | Fallback em memória é **por isolate** — inútil em serverless multi-instância. Sem Upstash o limite é praticamente inexistente |
| `_shared/clientIp.ts` (61) | Só confia em `cf-connecting-ip`; fail-closed | 4 | Correto e bem documentado |
| `_shared/validation.ts` (108) | Schemas zod dos webhooks | 4 | `zod` importado **sem versão** (`deno.land/x/zod/mod.ts`, `:1`) |
| `_shared/webhookSecurity.ts` (209) | HMAC + anti-replay + idempotência atômica | 2 | Melhor peça de segurança do repo; depende de `webhook_idempotency` (=0) |
| `_shared/cache.ts` (42) | Cache Upstash | **0** | **Código morto** |
| `_shared/rate-limit.ts` (40) | Rate limit Upstash v1 (fail-open) | **0** | **Código morto** — duplicata obsoleta de `rate-limiter.ts` |
| `_shared/sentry_test.ts` (73), `_shared/validation_test.ts` (79) | Testes Deno | — | `validation_test.ts:20-31` tem um `Deno.test` **vazio** (só comentários) que passa sempre |

---

## Functions sem chamador

19 de 36 (53%) não têm nenhum chamador — nem em `src/`, nem em pg_cron ativo, nem em trigger/migration, nem em outra edge function:

1. `ai-coach` — só citada em comentário (`src/lib/requestId.ts:9`)
2. `birthday-celebrations`
3. `bitrix24-api`
4. `bitrix24-oauth`
5. `bitrix24-webhook`
6. `burn-rate-monitor`
7. `checkin-reminders`
8. `cleanup-old-security-logs` — o job pg_cron homônimo chama a função SQL, não a edge
9. `cleanup-rate-limit-logs`
10. `error-budget-monitor`
11. `external-api`
12. `external-db-bridge`
13. `external-webhook`
14. `send-email-digest`
15. `send-email-notifications`
16. `send-rate-limit-alert`
17. `survey-reminders`
18. `verify-geo`
19. `weekly-league-processing`

Casos limítrofes (chamador **declarado** em migration, mas o job **não está** na lista de pg_cron ativos medida em produção — logo, sem chamador efetivo): `security-weekly-digest`, `push-outbox-dispatcher`, `webhook-health-monitor`, `dispatch-critical-alert` (trigger DB).

---

## Secrets exigidos (lista consolidada)

23 variáveis distintas lidas via `Deno.env.get(...)`:

**Injetados automaticamente pelo Supabase (3)**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

**Precisam ser configurados manualmente (20)**

| Secret | Onde é lido | Consequência se ausente |
|---|---|---|
| `LOVABLE_API_KEY` | `ai-coach:69`, `ai-course-builder:7`, `churn-prediction:49`, `generate-quiz-questions:97`, `reward-approval-review:8`, `trail-recommendations:85` | 6 functions de IA quebram (2 delas com `!` no top-level → módulo não carrega) |
| `VAPID_PUBLIC_KEY` | `push-public-key:5`, `push-device-revoked:24`, `push-outbox-dispatcher:30`, `send-campaign-push:24` | Todo o push retorna 503 |
| `VAPID_PRIVATE_KEY` | `push-device-revoked:25`, `push-outbox-dispatcher:31`, `send-campaign-push:25` | idem |
| `VAPID_SUBJECT` | `push-device-revoked:26`, `push-outbox-dispatcher:32`, `send-campaign-push:26` | default `mailto:no-reply@taskgifts.com` |
| `RESEND_API_KEY` | `detect-new-device:25` | E-mail de novo dispositivo silenciosamente não enviado |
| `SLACK_ALERT_WEBHOOK_URL` | `dispatch-critical-alert:58`, `security-weekly-digest:81` | Escalonamento Slack pulado (opt-in) |
| `SENTRY_DSN` | `_shared/sentry.ts:7` | Telemetria vira só `console.log` |
| `SENTRY_ENV` | `_shared/sentry.ts:18` | default `"production"` |
| `UPSTASH_REDIS_REST_URL` | `_shared/rate-limiter.ts:22`, `_shared/rate-limit.ts:7`, `_shared/cache.ts:7,28` | Rate limit cai para memória por isolate (≈ sem rate limit) |
| `UPSTASH_REDIS_REST_TOKEN` | idem | idem |
| `INTERNAL_FUNCTION_SECRET` | `_shared/security.ts:100` | Aceito só service-role |
| `CRON_SECRET` | `_shared/security.ts:101` | idem |
| `BITRIX24_CLIENT_ID` | `bitrix24-oauth:23`, `bitrix24-api:52` | OAuth Bitrix inoperante |
| `BITRIX24_CLIENT_SECRET` | `bitrix24-oauth:24`, `bitrix24-api:53` | idem |
| `BITRIX24_DOMAIN` | `bitrix24-oauth:25` | idem |
| `BITRIX24_WEBHOOK_SECRET` | `bitrix24-webhook:80` | Webhook responde 503 `missing_secret` (fail-closed correto) |
| `FRONTEND_URL` | `bitrix24-oauth:115` | default `https://lovable.dev` |
| `SLO_TARGET` | `burn-rate-monitor:12` | default `99.0` |
| `WEBHOOK_HEALTH_THRESHOLD` | `webhook-health-monitor:10` | default `90` |
| `WEBHOOK_HEALTH_MIN_SAMPLE` | `webhook-health-monitor:11` | default `5` |

---

## Allowlist `VITE_DEPLOYED_EDGE_FUNCTIONS` — veredito

**VEREDITO: a allowlist está VAZIA e o código a interpreta como "bloquear tudo". Nenhuma Edge Function é alcançável a partir do frontend hoje.**

Evidência medida:

1. `/home/user/task-gifts-v2/.env:25` → `VITE_DEPLOYED_EDGE_FUNCTIONS=` (valor vazio).
2. `/home/user/task-gifts-v2/.env.example:26` → a linha está **comentada** (`# VITE_DEPLOYED_EDGE_FUNCTIONS=`).
3. `/home/user/task-gifts-v2/src/lib/edgeAvailability.ts:46-51`:
   ```ts
   export function isFunctionDeployed(fnName: string): boolean {
     const allowlist = getDeployedAllowlist();
     // allowlist vazia = block all (nenhuma função foi deployada ainda).
     if (allowlist.size === 0) return false;
     return allowlist.has(fnName.toLowerCase());
   }
   ```
4. `/home/user/task-gifts-v2/src/lib/requestId.ts:131-144` — `invokeEdgeSafe` faz curto-circuito **antes de qualquer rede** quando `isFunctionDeployed` é falso, devolvendo um 404 sintético `"Edge function 'X' nao encontrada (allowlist)"` com `attempts: 0`.
5. Todas as 17 chamadas de front no repo passam por `invokeEdgeSafe` (nenhuma usa `supabase.functions.invoke` diretamente fora de `requestId.ts:88`).

**Contradição documental grave**: `.env.example:24` afirma *"Deixe vazio durante desenvolvimento local (todas liberadas)"* e o cabeçalho de `edgeAvailability.ts:10-13` descreve a allowlist como filtro de opt-out — mas o código faz exatamente o contrário (`:49`). Quem seguir o comentário desliga silenciosamente 100% das Edge Functions.

**Consequência prática**: as 13 functions com chamador de frontend nunca chegam a ser invocadas. Isso explica, de forma consistente, todas as tabelas-alvo vazias medidas em produção (`push_subscriptions`, `push_notification_logs`, `ai_coach_messages`, `ai_course_jobs`, `security_alerts`, `webhook_*`…). O sistema de Edge Functions está **integralmente desligado**, pelos dois lados: allowlist vazia no cliente, e nenhum job pg_cron ativo chamando edge function no servidor.

---

## Achados graves

### 1. Bypass total de RLS em `external-db-bridge` (`action: "query"`)
`supabase/functions/external-db-bridge/index.ts:215-296`. Basta um JWT de usuário comum (`:92`, apenas `verifyUser`) para executar `select`, `insert`, `update` ou `delete` em **qualquer tabela** do banco, usando o cliente criado com a **service-role key** (`:88`). Não há allowlist de tabelas, nem checagem de papel, nem restrição por operação. Um colaborador autenticado pode ler `profiles` inteiro, alterar o próprio `coins`/`xp`, inserir linhas em `user_roles`, ou apagar `audit_logs`. A tabela `query_telemetry` é apenas o pretexto declarado da function — a rota `query` não tem relação com telemetria.

### 2. Duas Edge Functions públicas de integração sem qualquer autenticação
- `bitrix24-api/index.ts:111-135`: nenhum `verifyUser`/`verifyServiceRole`. O módulo `raw` (`:401-403`) repassa **qualquer** método REST do Bitrix24 com o token OAuth corporativo armazenado — leitura/escrita/exclusão de leads, negócios, contatos, tarefas e mensagens.
- `bitrix24-oauth/index.ts:9-20`: sem auth; `action=status` expõe estado de configuração e `action=refresh` gira os tokens OAuth de terceiros.
Ambas são mitigadas hoje apenas por acidente: `supabase/config.toml` tem uma única linha (`project_id`), sem bloco `[functions]`, então `verify_jwt` fica no default `true` e exige ao menos a anon key — que é pública no bundle do frontend.

### 3. Toda a cadeia cron/trigger → Edge Function está quebrada por autenticação, e os jobs sequer estão ativos
Quatro migrations declaram invocação de edge function via `net.http_post`, e **nenhuma** funciona:
- `20260712212544_...sql:1-11` (cron `security-weekly-digest`) e `20260728112123_...sql:242-254` (cron `push-outbox-dispatcher`, `* * * * *`) enviam **sem header `Authorization`** → `guardInternalRequest` responde 401 (`security-weekly-digest/index.ts:32`, `push-outbox-dispatcher/index.ts:27`).
- `20260712194718_...sql:5,18` (cron `webhook-health-monitor-every-15min`) e `20260712203400_...sql:11,33` (trigger `trigger_dispatch_critical_alert`) enviam a **anon key** como Bearer, mas `verifyServiceRole` (`_shared/security.ts:98-102`) só aceita service-role / `INTERNAL_FUNCTION_SECRET` / `CRON_SECRET` → 401.
- Além disso, **nenhum** desses quatro jobs consta na lista de pg_cron ativos medida em produção.
Efeito observável e já medido: `push_outbox` tem **6 linhas represadas** e `push_notification_logs` tem **0** — a fila enche e nada sai. Agravante: as duas migrations acima têm a **anon JWT hardcoded em texto claro no repositório** (`20260712194718_...sql:5` e `20260712203400_...sql:11`).

### 4. Quatro functions divergem do schema real e falham de forma silenciosa ou permanente
Confirmado contra `src/integrations/supabase/types.ts`:
- **RPCs inexistentes** (nem em `types.ts` nem nas migrations): `increment_user_xp_coins` (`birthday-celebrations/index.ts:89` e `:154`), `add_user_xp` (`bitrix24-webhook/index.ts:339`), `add_user_rewards` (`external-webhook/index.ts:722`). Nenhum dos três retornos é checado → **XP e moedas nunca são creditados**, mas as functions respondem `success: true`.
- **Tabela inexistente**: `weekly-league-processing/index.ts:56` consulta `league_members` — o schema só tem `leagues` e `league_history`. O erro cai no `continue` (`:61-64`) e a function retorna `success:true, promotions:0` — sucesso sem fazer nada.
- **Colunas inexistentes**: `security-weekly-digest/index.ts:46` seleciona `resolved` (o schema tem `is_resolved`); `send-email-digest/index.ts:158-159` seleciona `full_name` (não existe em lugar nenhum) e filtra por `digest_enabled` (pertence a `notification_preferences`, não a `profiles`); `competency-alerts/index.ts:212,234` lê `profiles.role` (papéis vivem em `user_roles`, como o próprio `admin-alerts/index.ts:28-30` documenta) → o caminho de admin dá **403 permanente**.

### 5. Segurança de webhook e de acesso construída para falhar aberta
- **Assinatura HMAC falsificável**: `webhook-dispatcher/index.ts:266-284` — se `createHmac` lançar, o fallback calcula um hash não-criptográfico de 32 bits (`hash = ((hash << 5) - hash) + data[i]`) e o entrega ao destinatário rotulado como `sha256=`. Qualquer consumidor que valide essa assinatura estará validando um valor trivialmente forjável.
- **Fail-open no controle de acesso**: `verify-ip/index.ts:139-145` e `verify-geo/index.ts:186-194` devolvem `allowed: true` em qualquer exceção não tratada; `verify-geo` ainda resolve a geolocalização por **HTTP sem TLS** (`:19`, `http://ip-api.com/...`), tornando interceptável o dado que decide o bloqueio.
- **IDOR admitido em comentário**: `trail-recommendations/index.ts:72-75` detecta que o usuário está pedindo dados de outra pessoa, registra `console.log`, escreve *"In a more complex system, we'd check if authenticatedUser is a manager of bodyUserId"* e **prossegue mesmo assim**.
- **Stubs que retornam sucesso**: `send-email-notifications/index.ts:178` (`console.log("Would send email to ...")`) e `:232` (`"Emails logged. Integrate with email service for actual delivery."`); `send-email-digest/index.ts:247-250` gera o HTML e o descarta. Ambas contabilizam `delivered` e respondem `success: true` sem enviar um único e-mail.
