# Dimensão 5 — Edge Functions

> ## STATUS ATUAL (2026-11-24) — leia antes da tabela abaixo
>
> Este documento é um **retrato da auditoria original** e está **desatualizado** em 5 pontos. Onde ele divergir do código, vale o código.
>
> | Divergência | Estado real hoje |
> |---|---|
> | Tabela lista **36 funções** | ``supabase/functions`` tem **22** diretórios de função (+ `_shared/`). As demais foram podadas. |
> | `bitrix24-api`, `bitrix24-oauth`, `bitrix24-webhook`, `external-db-bridge` aparecem como funções existentes | **Removidas do repositório.** Achados ligados a elas (proxy REST Bitrix, OAuth Bitrix, executor de query genérica) são **obsoletos** — não há o que corrigir. |
> | Pendência 03: HMAC falsificável em `webhook-dispatcher`, fail-open em `verify-ip`, IDOR em `trail-recommendations` | **Parcialmente resolvida — 2 dos 3 itens fechados.** (a) `webhook-dispatcher` hoje é **só saída**: entra por `verifyServiceRole` (`index.ts:30`) e assina o payload enviado (`index.ts:81`, `generateSignature` em `:274-278`) — não existe receptor de webhook de terceiro no repo (grep por header de assinatura de entrada retorna apenas a geração da saída), então "HMAC falsificável de entrada" **não se aplica mais**. (b) `verify-ip` **falha fechado** quando a contagem da whitelist dá erro (`:34-58`, 503) e quando a whitelist está ativa e o IP de origem não é determinável (`:76-92`, 403); **whitelist vazia libera tudo por design** (`:62-73`, documentado em comentário). (c) `trail-recommendations` fecha o IDOR: `userId` de terceiro só passa para `admin`/`manager` (`:74-89`, 403 caso contrário). |
> | Gap que sobra do item (a) | `_shared/webhookSecurity.ts` tem a verificação de entrada pronta e **sem nenhum chamador**: `verifySignedWebhook` (`:84-110`, comparação com `timingSafeEqualBytes` em `:24`), `derivedIdempotencyKey` (`:119`) e `claimIdempotency` (`:133`) não são importados por nenhuma função — a tabela `webhook_idempotency` só é tocada por esse módulo. Enquanto não existir receptor de webhook de entrada, é biblioteca dormente (não é falha de segurança ativa). |
> | HIBP aparece em `06-integracoes.md` como "MORTO" | **Implementado e ligado**: `checkPasswordLeaked` (`src/lib/authValidations.ts:95`, fetch em `:116` com timeout de 4s em `:115`) é chamado por `src/pages/Auth.tsx:195` e `src/components/PasswordStrengthIndicator.tsx:51`; CSP libera `https://api.pwnedpasswords.com` em `vercel.json`. |
>
> Correção estrutural que continua valendo: funções sem chamador no cliente **não estão mortas** quando o disparo é por `pg_cron`/trigger/webhook — ver `07-infra-ci-testes.md`.

> Documento de detalhe da auditoria de estado — 16 funções Deno (na época da auditoria eram 36; as stubs foram podadas).
> Evidência em `arquivo:linha`. Correções da Fase D estão em `ESTADO_ATUAL.md` e em `04-dados-e-runtime.md`.
> **Revisão 2026-11-22**: edge function `ai-coach` validada em produção com JWT de usuário autenticado real (grant por senha): HTTP 200 streaming SSE via OpenRouter (gemini-2.5-flash). `ai_coach_messages` INSERT 201 + SELECT 200 para a própria conta (policy `owns`, consistente com RLS). `generate-quiz-questions` 200 em 7s (rodada anterior). **Pendência 03 encerrada**.
> Runtime de build/teste = `NAO_VERIFICADO` (node_modules ausente no ambiente da auditoria).
> **Data de revisão desta atualização**: 2026-11-11 — secções de segurança (webhook, verify-ip, trail-recommendations) e poda de stubs refletem a `main` (PRs #85-#87, commits `dadc0938`/`fb528b1b`/`166c7d2a`).
> **Revisão de 2026-11-21**: swap Lovable→OpenRouter validado até o gateway (chave responde em openrouter.ai/api/v1/chat/completions, modelo google/gemini-2.5-flash); deploy das 16 edge functions re-rodado verde (run 44934984530); as 3 functions dos deploys falhos (#88/#89/#86) confirmadas ACTIVE e a secret OPENROUTER_API_KEY presente no projeto. O fluxo completo com usuário autenticado em produção segue pendente de validação (exige JWT de admin).

---

# Auditoria de Estado — `supabase/functions` (task-gifts-v2)

Escopo: 37 diretórios em `/home/user/task-gifts-v2/supabase/functions` = **36 Edge Functions** + `_shared/` (9 arquivos, 890 linhas). Total medido: **10.002 linhas** de `.ts`.

Método: leitura integral de todos os `index.ts` e de `_shared/*`; `grep` de cada nome de function em `/home/user/task-gifts-v2/src`; cruzamento com `supabase/migrations/*.sql` (`net.http_post`), `supabase/config.toml`, `.env`, `.env.example` e `src/integrations/supabase/types.ts` (schema real). Nenhum arquivo foi editado; nenhuma function foi invocada.

---

## Tabela — 36 Edge Functions

| Edge Function | O que faz | Classificação | Chamador (arquivo:linha ou NENHUM) | Tabelas | API externa | Secrets | Problema |
|---|---|---|---|---|---|---|---|
| **admin-alerts** | Varre 7 heurísticas (inativos, XP zero, streaks, check-in, compras pendentes, certificações, pico de auditoria) e devolve lista de alertas ao admin | 🟨 | `src/hooks/useAdminAlerts.ts:17` (`invokeEdgeSafe("admin-alerts")`) — bloqueado pela allowlist vazia | lê `profiles`, `attendance_records`, `shop_purchases`, `user_certifications`, `audit_logs`; RPC `has_role` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | Só calcula; não persiste nada. Import morto `deno.land/x/xhr` (`admin-alerts/index.ts:1`) |
| **ai-coach** | Chat streaming do coach de gamificação via OpenRouter (Gemini 2.5 Flash), com prompt de contexto do usuário | ⬛ | `src/hooks/useAICoach.ts` (chat + sugestões) | nenhuma (só lê o body) | `https://openrouter.ai/api/v1/chat/completions` (`ai-coach/index.ts:77,156`) | `OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SENTRY_DSN`, `UPSTASH_*` | `ai_coach_messages` persiste; front usa JWT de sessão + gate de availability |
| **ai-course-builder** | Baixa arquivo do bucket `course-uploads`, extrai texto (.txt/.md/PDF ingênuo) e gera trilha+módulos+quiz via IA | 🟨 | `src/services/aiCourseBuilderService.ts:57` | lê/escreve `ai_course_jobs`; escreve `learning_trails`, `trail_modules`, `quiz_questions`, `quiz_options`; storage `course-uploads` | `https://openrouter.ai/api/v1/chat/completions` (`ai-course-builder/index.ts:130`) | `OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | `ai_course_jobs`=0 em produção → nunca executou. Extração de PDF por regex `\(([^)]{2,})\)` (`:106`) é heurística frágil. Sem checagem de papel: qualquer usuário autenticado cria trilhas |
| **birthday-celebrations** | Cron diário: cria `celebrations` de aniversário e de tempo de casa, credita XP/moedas e notifica | ⬛ | **NENHUM** (nenhuma ref em `src/`, nenhum `net.http_post` em migrations, nenhum job pg_cron ativo) | lê `profiles`; escreve `celebrations`, `notifications`; RPC `increment_user_xp_coins` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | **RPC `increment_user_xp_coins` NÃO EXISTE** (`:89` e `:154`; ausente de `types.ts` e das migrations) e o retorno não é checado → recompensa nunca é creditada, mas a function retorna `success:true` |
| **bitrix24-api** | Proxy REST completo para Bitrix24 (crm/tasks/calendar/users/timeman/im/notify + módulo `raw` genérico) | ⬛ | **NENHUM** | lê/escreve `bitrix24_tokens`; escreve `bitrix24_webhook_logs` | `https://{BITRIX24_DOMAIN}/rest/*` e `/oauth/token/` (`:55,91`) | `BITRIX24_CLIENT_ID`, `BITRIX24_CLIENT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_*` | **SEM QUALQUER AUTENTICAÇÃO** (`:111-135` — nenhum `verifyUser`/`verifyServiceRole`). Módulo `raw` (`:401-403`) permite executar qualquer método REST do Bitrix com o token OAuth armazenado. `bitrix24_tokens`=0 → `getValidToken` sempre lança "Bitrix24 não conectado" |
| **bitrix24-oauth** | Fluxo OAuth Bitrix24: `authorize` / `callback` / `refresh` / `status` | ⬛ | **NENHUM** | lê/escreve `bitrix24_tokens` | `https://{BITRIX24_DOMAIN}/oauth/authorize/` e `/oauth/token/` (`:40,62,136`) | `BITRIX24_CLIENT_ID`, `BITRIX24_CLIENT_SECRET`, `BITRIX24_DOMAIN`, `FRONTEND_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | **SEM AUTENTICAÇÃO** (`:9-20`): `action=status` vaza config, `action=refresh` gira tokens de terceiros. `user_id` cai para placeholder `00000000-...` (`:101`). `bitrix24_tokens`=0 |
| **bitrix24-webhook** | Recebe eventos do Bitrix24 (CRM/tasks/users), valida HMAC + idempotência e sincroniza mapeamentos | ⬛ | **NENHUM** (webhook externo; nenhuma evidência de provedor configurado) | escreve `bitrix24_webhook_logs`, `bitrix24_sync_mappings`, `notifications`, `webhook_idempotency`, `quest_assignments`; lê `user_roles`, `custom_quests`; RPC `add_user_xp` | — (recebe) | `BITRIX24_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`, `UPSTASH_*` | **RPC `add_user_xp` NÃO EXISTE** (`:339`) → conclusão de task nunca credita XP. `bitrix24_webhook_logs`/`bitrix24_sync_mappings`/`webhook_idempotency`=0. `config.toml` sem `[functions]` → `verify_jwt` default `true` bloqueia o provedor externo |
| **burn-rate-monitor** | Burn-rate multi-janela estilo Google SRE (1h/5m ≥14.4x, 6h/30m ≥6x) → cria alerta e escala | ⬛ | Job pg_cron **#31 `burn-rate-monitor-5min`** (`*/5 * * * *`), ativo; **nenhuma migration o cria** (ver §3). Nenhuma ref em `src/` | lê/escreve `security_alerts`; RPC `get_burn_rate` | — (invoca `dispatch-critical-alert` via `sb.functions.invoke`, `:77`) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SLO_TARGET` | Envia `message:` para `dispatch-critical-alert` (`:78`); o destino resolve o título com `payload.title?.trim() || payload.message?.trim() || payload.alert_type || "Alerta de segurança"` (`dispatch-critical-alert/index.ts:37`) — **não** fica `undefined`. `security_alerts`=0 |
| **checkin-reminders** | Cron: lembretes de check-in 1:1 (hoje/amanhã/atrasado) para gestor e colaborador | ⬛ | **NENHUM** | lê `checkins` (+join `profiles`); lê/escreve `notifications` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Ramo "amanhã" (`:138-176`) e ramo "atrasado" (`:190-215`) não têm deduplicação → geram notificação duplicada a cada execução |
| **churn-prediction** | Monta métricas de engajamento de TODOS os perfis e pede à IA ranking de risco de churn | 🟨 | `src/services/churnPredictionService.ts:35` | lê `profiles`, `attendance_records`, `kudos`, `trail_enrollments`, `user_combos`, `audit_logs` | `https://openrouter.ai/api/v1/chat/completions` (`:176`) | `OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `UPSTASH_*` | Sem checagem de papel: **qualquer usuário autenticado** recebe e-mail + métricas de todos os colegas (`:47` só chama `verifyUser`). N+1: 6 queries por perfil. Nada é persistido |
| **cleanup-old-security-logs** | Chama `rpc('cleanup_old_security_logs')` | ⬛ | **NENHUM** — o job pg_cron homônimo ativo chama a **função SQL**, não esta edge function | RPC `cleanup_old_security_logs` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Duplicata redundante de `cleanup-rate-limit-logs`; a limpeza já roda por pg_cron direto no SQL |
| **cleanup-rate-limit-logs** | Mesma RPC com `p_days_to_keep` + registro em `audit_logs` | ⬛ | **NENHUM** | escreve `audit_logs`; RPC `cleanup_old_security_logs` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Nome não corresponde ao que faz (limpa security logs, não rate-limit logs). Redundante com a anterior |
| **competency-alerts** | Calcula 6 competências heurísticas e cria notificações de gap / dica / celebração | 🟨 | `src/hooks/useCompetencyAlerts.ts:28`, `:48`; `src/services/notificationsService.ts:184` | lê `module_progress`, `quest_assignments`, `user_achievements`, `kudos`, `attendance_streaks`, `profiles`; escreve `notifications` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `UPSTASH_*` | **Lê `profiles.role`** (`:212`, `:234`) — coluna **inexistente** (confirmado em `types.ts`; papéis vivem em `user_roles`). O select falha, `profile` fica `null` → `checkAllUsers` e análise de terceiros dão **403 permanente** |
| **detect-new-device** | Registra fingerprint de dispositivo, gera `security_alert` e e-mail de novo login | 🟨 | `src/hooks/useDeviceDetection.ts:95` | escreve `security_alerts`; lê `profiles`; RPC `register_device` | `https://api.resend.com/emails` (`:161`) | `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `SENTRY_DSN` | `security_alerts`=0 → nunca executou. Remetente hardcoded `onboarding@resend.dev` (`:168`) — domínio de sandbox do Resend. `body.userId` é lido (`:34`) e descartado |
| **dispatch-critical-alert** | Escala alertas `high`/`critical` para Slack + notificação in-app de admins | 🟨 | Trigger DB `trigger_dispatch_critical_alert` em `security_alerts` (`supabase/migrations/20260712203400_...sql:18-19`); `burn-rate-monitor/index.ts:77`; `error-budget-monitor/index.ts:133` | lê `user_roles`; escreve `notifications` | Slack Incoming Webhook (`:78`) | `SLACK_ALERT_WEBHOOK_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | ~~O trigger DB envia a anon key como Bearer (migration `:11,33`) → 401 em todas as invocações~~ **Configuração confirmada:** o trigger vivo autentica com `x-internal-secret` lido de `_internal.dispatch_config` (migration `20261220000000_...`, aplicada; ledger 277/277 em 2026-11-24). `security_alerts`=0 porque nenhum alerta `high`/`critical` foi gerado até hoje, ou seja o trigger nunca disparou: a **entrega ponta a ponta não está provada** |
| **error-budget-monitor** | Avalia burn% do orçamento de erros 30d (75%/90%), cria alerta e chama o dispatcher via HTTP | ⬛ | Job pg_cron **#32 `error-budget-monitor-daily`** (`0 12 * * *`), ativo; **nenhuma migration o cria** (ver §3) | lê/escreve `security_alerts`; RPC `get_error_budget_30d` | `${SUPABASE_URL}/functions/v1/dispatch-critical-alert` (`:61,133`) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Único ponto que passa service-role corretamente (`:137`), mas ele próprio não tinha chamador até o job #32 ser criado fora das migrations. `security_alerts`=0 |
| **external-api** | REST pública com API key/secret: tasks, users, XP/coins, leaderboard, achievements, webhooks, stats (822 linhas, 20+ rotas) | ⬛ | **NENHUM** (consumidores externos; `external_api_keys`=0 em produção) | `external_tasks`, `profiles`, `departments`, `positions`, `achievements`, `user_achievements`, `webhook_subscriptions`, `api_request_logs`; RPCs `validate_api_key`, `process_external_task`, `complete_external_task`, `get_user_stats_api`, `get_leaderboard_api`, `get_executive_metrics` | — (recebe) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `external_api_keys`=0 → `validate_api_key` sempre falha → **100% das requisições retornam 401**. `rate_limit_per_minute` é lido no tipo (`:15`) mas **nunca aplicado**. `POST /users/{email}/add-xp` altera XP/nível por leitura-modificação-escrita sem transação (`:515-521`) → race condition. `verify_jwt` default bloqueia o chamador externo |
| **external-db-bridge** | "Ponte" de telemetria (`emit_telemetry`, `batch_telemetry`, `health`) **e** executor de query genérica | ⬛ | **NENHUM** | escreve `query_telemetry`; **qualquer tabela** via `action:'query'` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | **BYPASS TOTAL DE RLS**: `action:'query'` (`:215-296`) executa `select/insert/update/delete` em **qualquer tabela** com a service-role key, exigindo apenas um JWT de usuário comum (`:92`). Nenhuma allowlist de tabela, nenhuma checagem de papel |
| ~~external-webhook~~ | ~~Ingestão de eventos externos~~ | ~~⬛~~ | **REMOVIDA da main** — não existe `supabase/functions/external-webhook`; hoje não há ingestão de eventos externos | — | — | — | Removida. Se um dia houver provedor externo, reconstruir com RPCs/migrações reais (o plano original citava `external_api_keys`, que segue sem uso) |
| **generate-quiz-questions** | Gera N perguntas de quiz a partir do conteúdo de uma trilha via IA | 🟨 | `src/components/quiz/AIQuestionGenerator.tsx:55` | lê `learning_trails`, `trail_modules` | `https://openrouter.ai/api/v1/chat/completions` (`:144`) | `OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `UPSTASH_*` | Não persiste as perguntas (devolve JSON). Sem checagem de papel: qualquer usuário autenticado consome créditos de IA |
| **push-device-revoked** | Push de segurança real para os demais aparelhos do próprio usuário quando uma inscrição é revogada | 🟨 | `src/services/pushSubscriptionService.ts:391` | lê/escreve `push_subscriptions`; escreve `push_notification_logs` | Web Push (endpoints FCM/Mozilla via `npm:web-push@3.6.7`) | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `push_subscriptions`=0 e `push_notification_logs`=0 → nunca executou. Sem VAPID configurado retorna 503 (`:27`) |
| **push-outbox-dispatcher** | Consome a fila `push_outbox` (claim atômico + retry/backoff + invalidação de endpoint) | 🟨 | Migration `supabase/migrations/20260728112123_...sql:242-254` agenda cron `push-outbox-dispatcher` `* * * * *` — **job NÃO consta na lista de pg_cron ativos** | lê/escreve `push_outbox`, `push_subscriptions`; escreve `push_notification_logs`; RPC `claim_push_outbox` | Web Push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | **`push_outbox`=6 linhas represadas** e `push_notification_logs`=0 → a fila enche e nada é entregue. O cron da migration envia **sem header `Authorization`** → `guardInternalRequest` (`:27`) devolveria 401 mesmo se o job estivesse ativo |
| **push-public-key** | Devolve a `VAPID_PUBLIC_KEY` (9 linhas) | 🟨 | `src/services/pushSubscriptionService.ts:66` | nenhuma | — | `VAPID_PUBLIC_KEY` | Sem `VAPID_PUBLIC_KEY` retorna `{publicKey:null}` com HTTP 200 (`:5-8`) — o front não distingue "não configurado" de erro |
| **reward-approval-review** | Heurística determinística de risco de resgate (`risk.ts`, 289 linhas) + parecer de IA limitado a ±15 pontos | 🟨 | `src/services/purchaseGovernanceService.ts:84` | lê/escreve `shop_purchases`; lê `user_roles`, `profiles`, `audit_logs`; escreve `purchase_approvals` | `https://openrouter.ai/api/v1/chat/completions` (`:65`) | `OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | Único caso com governança bem construída (IA nunca decide, `risk.ts` é puro e espelhado em `src/lib/purchaseRisk.ts`). `OPENROUTER_API_KEY!` no top-level (`:8`) derruba o módulo se o secret faltar |
| **security-weekly-digest** | Digest semanal de segurança (SLA/MTTR/top tipos) → Slack + notificação in-app | 🟨 | Migration `supabase/migrations/20260712212544_...sql:1-11` agenda cron `security-weekly-digest` `0 13 * * 1`; em produção o job existe como **#33**, ativo, com `x-internal-secret` (a autenticação da migration foi trocada fora do repositório — ver §3) | lê `security_alerts`; lê `user_roles`; escreve `notifications` | Slack Incoming Webhook (`:84`) | `SLACK_ALERT_WEBHOOK_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | **Os dois defeitos da auditoria já estão corrigidos no código atual:** a seleção usa `is_resolved` (`:57,104,111`) e o `upsert` roda com `ignoreDuplicates: true` **sem** `onConflict` (`:218-219`), com a dedup saindo do índice único de expressão `notifications_user_type_data_unique (user_id, type, (data)::text)` — sem 42P10. O que resta é a autenticação: o cron da migration (`:1,5`) não envia `Authorization` → 401 em `guardInternalRequest` (`:32`); em produção o job #33 envia `x-internal-secret` (ver §3) |
| **send-campaign-push** | Envia push em lote para até 500 usuários respeitando preferências, com retry/backoff e invalidação | 🟨 | `src/services/salesCampaignsService.ts:142` | lê/escreve `push_subscriptions`; escreve `push_notification_logs`; RPCs `user_wants_push_notification`, `increment_push_failures`, `reset_push_failures` | Web Push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `push_subscriptions`=0 e `push_notification_logs`=0 → nunca entregou. Aceita **qualquer JWT** (`:38-41`) e permite notificar 500 `user_ids` arbitrários — sem checagem de papel |
| **send-email-digest** | Monta HTML de resumo semanal com XP/moedas/quests/ranking | ⬛ | **NENHUM** | lê `profiles`, `xp_transactions`, `coin_transactions`, `user_quests`, `user_achievements`, `attendance_streaks` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | **STUB**: o `emailHTML` gerado (`:247`) é descartado; só faz `console.log` (`:250`). Além disso consulta `profiles.full_name` e `profiles.digest_enabled` (`:158-159`) — **nenhuma das duas existe** (`full_name` não existe no schema; `digest_enabled` pertence a `notification_preferences`) → query falha → **500 garantido**. Ranking O(n) carregando todos os perfis por usuário (`:219-224`) |
| **send-email-notifications** | Monta e-mails digest/reminder/celebration com telemetria Sentry detalhada | ⬛ | **NENHUM** | lê `profiles`, `notifications`, `pulse_surveys`, `checkins`, `feedback_requests`, `celebrations`; escreve `audit_logs` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | **STUB que retorna sucesso sem fazer nada**: `console.log("Would send email to ...")` (`:178`) e a resposta admite `"Emails logged. Integrate with email service for actual delivery."` (`:232`). O contador `delivered` conta inserts em `audit_logs`, não e-mails |
| **send-rate-limit-alert** | Bloqueia IP automaticamente, registra violação e notifica admins | ⬛ | **NENHUM** | escreve `rate_limit_logs`, `notifications`; lê `user_roles`, `blocked_ips`; RPC `auto_block_ip` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | `blocked_ips`=0 em produção. `try/catch` em volta de `await supabase.from(...).insert()` (`:78-82`) não captura erro do PostgREST (que retorna em `{error}`, não lança) — o "skipping" nunca dispara |
| **survey-reminders** | Cron: lembra quem não respondeu pesquisas que encerram em ≤3 dias / hoje | ⬛ | **NENHUM** | lê `pulse_surveys`, `profiles`, `pulse_responses`; lê/escreve `notifications` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | Ramo "encerra hoje" (`:110-141`) sem deduplicação → notificação duplicada por execução. Loop N×M sem paginação |
| **trail-recommendations** | Recomenda até 5 trilhas via IA com base em perfil, departamento, gaps de score | 🟩 | `src/components/TrailRecommendations.tsx:55` | lê `profiles`, `team_members`, `trail_enrollments`, `quest_assignments`, `module_progress`, `learning_trails` | `https://openrouter.ai/api/v1/chat/completions` (`:237`) | `OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `UPSTASH_*` | **Corrigido na main**: acesso bloqueado com 403 para quem não é `admin`/`manager` (`trail-recommendations/index.ts:52-56`) — IDOR fechado. Requer `OPENROUTER_API_KEY` para funcionar |
| **verify-geo** | Bloqueio geográfico por país via lookup de IP | ⬛ | **NENHUM** (só citada como exemplo em `.env.example:25`) | lê `geo_settings`, `geo_allowed_countries`; escreve `geo_access_logs` | `http://ip-api.com/json/{ip}` (`:19`) — **HTTP em texto claro** | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Chamada de geolocalização por **HTTP sem TLS** (`:19`) — resposta que decide acesso é interceptável. `catch` final devolve `allowed:true` com HTTP 200 (`:186-194`): qualquer exceção **abre** o bloqueio |
| **verify-ip** | Whitelist de IP na tela de login | 🟩 | `src/components/IpAccessGuard.tsx:38` e `src/pages/Auth.tsx:59` (ambos precedidos de `isFunctionDeployed("verify-ip")` em `IpAccessGuard.tsx:29` / `Auth.tsx:51`) | lê `ip_whitelist`; escreve `ip_access_logs` | — | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | **Corrigido na main (PR #86, commit `fb528b1b`)**: `catch` final devolve `allowed:false` (fail-closed). Único `allowed:true` é whitelist vazia (`:60-65`, comportamento documentado). Allowlist vazia → `isFunctionDeployed` retorna `false` e a guarda não roda no cliente (intencional) |
| **webhook-dispatcher** | Entrega webhook assinado (HMAC) com retry exponencial e log de entrega | 🟩 | `src/pages/WebhooksAdmin.tsx:153`; `src/pages/WebhookSubscriptionDetail.tsx:152`, `:207` | lê/escreve `webhook_subscriptions`; escreve `webhook_delivery_logs` | URL arbitrária da assinatura (`:117`) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET` | **Corrigido na main**: `generateSignature` usa `createHmac('sha256', secret)` puro, sem fallback forjado (`webhook-dispatcher/index.ts:266-270`). Falta configurar `webhook_subscriptions`/segredos para uso real |
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

18 de 36 (50%) não têm nenhum chamador — nem em `src/`, nem em pg_cron ativo, nem em trigger/migration, nem em outra edge function:

> **Esta lista é histórica** (auditoria de 2026-11-08, 36 funções). Onde divergir do estado atual, vale §3: `burn-rate-monitor` (job #31), `error-budget-monitor` (job #32) e `security-weekly-digest` (job #33) **têm chamador** em produção hoje.
1. `birthday-celebrations`
2. `bitrix24-api`
3. `bitrix24-oauth`
4. `bitrix24-webhook`
5. `burn-rate-monitor` — **hoje tem chamador**: job pg_cron #31 (ver §3)
6. `checkin-reminders`
7. `cleanup-old-security-logs` — o job pg_cron homônimo chama a função SQL, não a edge
8. `cleanup-rate-limit-logs`
9. `error-budget-monitor` — **hoje tem chamador**: job pg_cron #32 (ver §3)
10. `external-api`
11. `external-db-bridge`
12. `external-webhook`
13. `send-email-digest`
14. `send-email-notifications`
15. `send-rate-limit-alert`
16. `survey-reminders`
17. `verify-geo`
18. `weekly-league-processing`
Casos limítrofes na auditoria (chamador **declarado** em migration, mas job **ausente** na lista de pg_cron medida então): `security-weekly-digest`, `push-outbox-dispatcher`, `webhook-health-monitor` — **os três viraram jobs ativos hoje** (#30, #33, #34; ver §3). `dispatch-critical-alert` continua sem chamador **declarado em migration**: o único caminho declarado é o trigger DB, que observa `security_alerts`. Os três caminhos existentes gravam em `security_alerts` **antes** de dispatchar — o trigger pela própria tabela, `burn-rate-monitor` insere (`:62-73`) e só então invoca (`:79`), e `error-budget-monitor` insere com dedupe diário (`:80-110`) — e a tabela está vazia hoje. Isso é indício de que nenhum alerta foi criado, **não** prova do histórico. Resolver um alerta não apaga a linha — `SecurityAlertsPanel.tsx:101-110` só faz `update({ is_resolved: true, resolved_at, resolution_notes })` —, então uma tabela vazia significa que nenhuma linha foi **inserida** (ou que houve `DELETE` direto, fora do painel).

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
| `OPENROUTER_API_KEY` | `ai-coach`, `ai-course-builder`, `churn-prediction`, `generate-quiz-questions`, `reward-approval-review`, `trail-recommendations` | Nessas 6 functions de IA (precisam da chave para responder; sem ela retornam erro/fallback) |
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

### 3. Cadeia cron/trigger → Edge Function: corrigida em produção, mas as migrations ainda recriam o defeito
As quatro migrations originais declaram a invocação de edge function via `net.http_post` e **estão erradas** — nenhuma envia `x-internal-secret` ou service-role:
- `20260712212544_...sql:1,5` (cron `security-weekly-digest`) e `20260728112123_...sql:243,247` (cron `push-outbox-dispatcher`, `* * * * *`) enviam **sem header `Authorization`** → `guardInternalRequest` responde 401 (`security-weekly-digest/index.ts:32`, `push-outbox-dispatcher/index.ts:27`).
- `20260712194718_...sql:10,14` (cron `webhook-health-monitor-every-15min`) e `20260712203400_...sql:18,47` (trigger `trigger_dispatch_critical_alert`) enviam a **anon key** (do projeto morto `awzhgfmqwddzgbqzqusc`) como Bearer, mas `verifyServiceRole` (`_shared/security.ts:98-102`) só aceita service-role / `INTERNAL_FUNCTION_SECRET` / `CRON_SECRET` → 401.

**O estado vivo em produção já foi corrigido fora das migrations.** Medido em 2026-11-24, `cron.job` tem os cinco jobs `active=true`, todos apontando para `eidsaqymojyuhprobfpn.supabase.co` e enviando `x-internal-secret` (nenhum usa a anon key):

| jobid | jobname | schedule | criado por migration? |
|---|---|---|---|
| 30 | `push-outbox-dispatcher` | `* * * * *` | sim, mas com a autenticação antiga |
| 31 | `burn-rate-monitor-5min` | `*/5 * * * *` | **não — nenhuma migration o cria** |
| 32 | `error-budget-monitor-daily` | `0 12 * * *` | **não — nenhuma migration o cria** |
| 33 | `security-weekly-digest` | `0 13 * * 1` | sim, mas com a autenticação antiga |
| 34 | `webhook-health-monitor-every-15min` | `*/15 * * * *` | sim, mas com a autenticação antiga |

O trigger `trigger_dispatch_critical_alert` também tem correção versionada: o texto abaixo descreve o SQL de `20261224120000_...sql:47-137` (aplicado segundo a medição da janela que tinha acesso ao banco), **não** uma introspecção por `pg_get_functiondef` desta sessão, que não tem canal de leitura do banco de produção — lê o destino de `_internal.dispatch_config('project_url')` (`:62-65`) e resolve o segredo na ordem Vault `internal_dispatch_secret` (`:78-85`) → `_internal.dispatch_config('dispatch_secret')` (`:87-96`) → `('cron_secret')` (`:100-109`), enviando `x-internal-secret` (`:120`). **Destino e credencial agora saem do repositório**: `20261224110000_...sql:31-40` cria `_internal.dispatch_config` (RLS ligada), `:46-48` grava `project_url` e `:57-72` semeia `cron_secret` copiando o header de um dos cinco jobs de cron medidos — nada de segredo em texto claro no repo. Fora do repositório continua apenas o `internal_dispatch_secret` do Vault, que tem precedência de propósito (cópia estática envelhece e faz a edge responder 401 em silêncio); sem ele e sem as duas chaves de fallback a função emite `RAISE WARNING 'dispatch-critical-alert skipped: segredo ausente...'` (`:111-114`) e não envia o alerta. A URL do projeto resta no corpo só como último fallback, quando a chave `project_url` não existe (`:70-72`): num projeto novo, atualize a linha da tabela em vez de contar com o fallback. A semeadura de `cron_secret` (`20261224110000_...sql:57-72`) copia o header de um dos cinco jobs antigos, entao em banco com `cron.job` vazio a chave fica ausente: semeie `project_url` e `cron_secret` antes de contar com o agendamento, porque sem as duas o bloco de jobs nao agenda nada.

**Resposta HTTP: o que foi verificado, em que janela e de quem.** `net._http_response` tem **457 respostas, todas `status_code=200`**, entre `2026-11-24T08:16Z` e `2026-11-24T14:15Z` (≈6 h). O fuso do banco é `UTC` (`current_setting('TimeZone')`), então o horário do `cron.schedule` é UTC. A distribuição horária identifica os chamadores: **76 respostas/hora** = 60 do `push-outbox-dispatcher` (`* * * * *`) + 12 do `burn-rate-monitor-5min` (`*/5 * * * *`) + 4 do `webhook-health-monitor-every-15min` (`*/15 * * * *`); a hora **12:00 tem 77** — a resposta extra é o `error-budget-monitor-daily` (`0 12 * * *`), logo **#32 está dentro da amostra**. **Não** coberto: `security-weekly-digest` (#33, `0 13 * * 1`), semanal, que não caiu na janela.

**O que `cron.job_run_details.status='succeeded'` prova — e o que não prova.** Prova que o comando SQL que enfileira o `net.http_post` executou. O `net.http_post` é assíncrono e o job não enxerga o status HTTP; a resposta real fica em `net._http_response`. Execuções `succeeded` desde 2026-11-17: #30 10.657, #31 2.131, #32 8, #33 1, #34 710.

**Drift aberto (pendência).** A `20261224110000_...sql:76-132` agenda os cinco jobs (#30 a #34, inclusive #31/#32) com `x-internal-secret` lido de `_internal.dispatch_config` em tempo de execucao, entao o drift do agendamento esta fechado **na base atual, onde `cron_secret` ja existe** (em rebuild, ver a ressalva no fim do paragrafo); o que resta e' que as três que criam #30/#33/#34 gravam a autenticação antiga: `20260712194718_...sql:10,14` e `20260712203400_...sql:18,47` seguem com a anon key do projeto morto **em texto claro**; a segunda é a exceção do trigger — `20261220000000_...sql` (aplicada) reescreve a função com `x-internal-secret` e `20261224120000_...sql` (aplicada) a reescreve de novo lendo URL e segredo de `_internal.dispatch_config`, então o estado final do trigger está correto e o drift é só dos jobs, e `20261109120000_...sql` só troca a URL (o `UPDATE cron.job` é guardado por `EXCEPTION insufficient_privilege`). **Rebuild do zero nao termina no estado correto**: as migrations antigas gravam os comandos com a anon key do projeto morto ou sem credencial nenhuma, entao a semeadura de `cron_secret` (`:57-72`, filtro `command LIKE '%"x-internal-secret"%'`) nao encontra header para copiar, o guard `:95-107` emite `WARNING` e **nenhum dos cinco jobs e agendado** (sobra no maximo o `webhook-health-monitor-every-15min` criado pela migration antiga, com a credencial errada). Num rebuild: aplique `20261224110000` (o passo 0, `:32-40`, cria a tabela `_internal.dispatch_config`; o bloco de jobs avisa e sai sem agendar), insira `cron_secret` na tabela (a `project_url` ja vem do passo 1, `:46-48`) e reexecute o passo 3 inteiro, de `:76` a `END $outer$` em `:132`, para agendar os cinco. O guard existe justamente para nao gravar job que tomaria 401 para sempre.

**Fila de push.** `push_outbox` tem 15 linhas `skipped`, `push_notification_logs` 0 e `push_subscriptions` **0** — **não** é fila entupida: o dispatcher roda e responde 200, marcando `skipped` porque ninguém aceitou push no navegador.
### 4. Functions divergentes do schema — a maioria foi podada da main
Confirmado contra `src/integrations/supabase/types.ts`:
- **Podadas da main** (não existem mais em `supabase/functions`): `birthday-celebrations`, `bitrix24-webhook`, `external-webhook`, `weekly-league-processing`, `send-email-digest`. (`security-weekly-digest` **não** foi podada — existe em `supabase/functions/security-weekly-digest`, está publicada (responde 200) e é o job de cron #33.) As RPCs `increment_user_xp_coins`/`add_user_xp`/`add_user_rewards` citadas na auditoria deixaram de ser referenciadas por functions vivas; a escrita de XP/coins passou a ser restrita a RPCs dedicadas (ver pendência 02 — perfis UPDATE).
- **`competency-alerts`** — a leitura de `profiles.role` nas linhas de checagem de admin foi **corrigida na main**: agora usa o RPC `has_role` (`user_roles`), igual ao padrão do próprio `admin-alerts/index.ts`. Verificado: `profiles` não tem coluna `role`; roles vivem em `user_roles`. RLS de `profiles` permite que qualquer usuário leia `profiles` (policy "Users can view all profiles"), mas a coluna `role` não existe ali.
- **`external_api_keys`** segue no schema/migrations (foi criada), mas sem reprocessamento ativo. **`league_members` NÃO existe** — verificado nas migrations (sem `CREATE TABLE league_members`); a function `weekly-league-processing` (podada) lia essa tabela inexistente.

### 5. Segurança de webhook e de acesso — itens auditados e tratados na main

**Resolvidos na main (verificado em `arquivo:linha`):**

- **Assinatura HMAC** — `webhook-dispatcher` usa `createHmac('sha256', secret)` puro, sem qualquer fallback forjado. `generateSignature` (`webhook-dispatcher/index.ts:266-270`) só devolve `'sha256=' + hmac.digest('hex')`. O antigo fallback de hash não-criptográfico foi removido.
- **Fail-open de `verify-ip`** — `catch` final devolve `allowed:false` (fail-closed). `allowed:true` ocorre apenas nos casos legítimos: whitelist vazia (`verify-ip/index.ts:60-65`) ou IP autenticamente cadastrado na allowlist (`verify-ip/index.ts:93-116`). Fix mergeado via PR #86 (commit `fb528b1b`). `verify-geo` foi removida da main (não existe `supabase/functions/verify-geo`).
- **IDOR de `trail-recommendations`** — o controle de acesso agora bloqueia com 403 quem não é `admin`/`manager` (`trail-recommendations/index.ts:52-56`); o antigo comentário "In a more complex system..." e o prosseguimento sem check foram substituídos.


**Validação de 2026-11-21 — swap OpenRouter + deploys íntegros (evidência real):**

- **Gateway OpenRouter operacional** — chamada real a `openrouter.ai/api/v1/chat/completions` com `OPENROUTER_API_KEY` respondeu "Ok" (modelo `google/gemini-2.5-flash`), provando que a credencial que mantinha zeradas `ai_course_jobs`/`ai_coach_messages` está funcional. **Escopo da evidência**: valida o gateway e a credencial; o fluxo completo (gerar curso/quiz com usuário autenticado em produção) segue pendente — exige perfil admin autenticado para emitir JWT real.
- **Deploy das 16 edge functions verde** — workflow `deploy-edge-functions.yml` (run `44934984530`, branch `main`) concluído com sucesso após corrigir a `SUPABASE_ACCESS_TOKEN` do CI para um PAT válido.
- **Functions dos deploys falhos ativas** — `competency-alerts` v6, `verify-ip` v5, `admin-alerts` v4, `webhook-dispatcher` v4, `ai-coach` v5, `ai-course-builder` v7, `churn-prediction` v6, `generate-quiz-questions` v5, `reward-approval-review` v7, `trail-recommendations` v5 (Management API, status `ACTIVE`, `verify_jwt=true`).
- **Secret `OPENROUTER_API_KEY`** confirmada no projeto (8 secrets no total; `LOVABLE_API_KEY` nunca existiu em produção).
- **Edge `ai-coach` validada em produção (2026-11-22)** — chamada direta com JWT de usuário autenticado real (grant por senha): HTTP 200 streaming SSE via OpenRouter (gemini-2.5-flash, provedor Google AI Studio); `ai_coach_messages` INSERT 201 + SELECT 200 para a própria conta, consistente com a policy `owns` + apenas-admin. Correção no front (PR #98): `src/hooks/useAICoach.ts` passou a enviar o JWT de sessão do usuário (`session?.access_token`) em vez do `VITE_SUPABASE_PUBLISHABLE_KEY` e a respeitar o gate de availability (`isFunctionDeployed`/`isEdgeSkillsDisabled`/`isEdgeAvailable`), consistente com `invokeEdgeSafe`. Validação no navegador com usuário real em produção ainda pendente.
**Podadas da main (não existem mais em `supabase/functions`, eram stubs/tables inexistentes):** `send-email-notifications`, `send-email-digest`, `verify-geo`, `weekly-league-processing` e `external-webhook`. As funções de email eram stubs que logavam e descartavam o HTML; sem elas não há mais retorno falso de `delivered/success:true`. (**`security-weekly-digest` NÃO foi podada** — existe em `supabase/functions` e é o job #33. **`competency-alerts` NÃO foi podada** — foi corrigida nesta sessão; ver item "Resolvidos na main" acima/abaixo.)


---

**Atualização 2026-11-23 — PR #106 mergeada + VAPID keys configuradas (evidência real):**

**BUG_0001 resolvido** — get_error_budget_30d levantava P0001: access_denied: admin only para service_role (pois has_role(auth.uid(), 'admin') retornava NULL com auth.uid() = NULL e o guard antigo levantava exceção). Corrigido: guard canônico (NULL → passa, não-admin → 42501) + renomear coluna status_code → response_status na query interna. Verificado: error-budget-monitor retorna HTTP 200 {"ok":true,...} em produção.

**BUG_0002 resolvido** — get_webhook_delivery_stats_1h retornava 0 linhas porque current_setting('request.jwt.claim.role')='service_role' é sempre NULL fora do PostgREST. Corrigido: guard canônico sem GUC. Verificado: webhook-health-monitor retorna HTTP 200 em produção.

**BUG_0003 resolvido** — 	rigger_dispatch_critical_alert() apontava para https://awzhgfmqwddzgbqzqusc.supabase.co (projeto errado) com JWT anon daquele projeto; erifyServiceRole só aceita service-role/INTERNAL_FUNCTION_SECRET/CRON_SECRET. Reescrita: URL correta (eidsaqymojyuhprobfpn.supabase.co), autenticação via x-internal-secret lido de _internal.dispatch_config (schema criado com REVOKE ALL para públicos). Vault (ault.decrypted_secrets) descartado — pgsodium sem root key acessível via Management API.

**VAPID keys configuradas** — push-outbox-dispatcher retornava HTTP 503 "VAPID keys not configured" em cada cron run; 15 linhas em push_outbox com status='skipped'. Gerado par VAPID P-256 e configurados VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:admin@taskgifts.com.br) nas edge function secrets. Verificado: push-outbox-dispatcher retorna HTTP 200 {"processed":0} (antes: 503). As 15 linhas skipped foram resetadas para pending e processadas; sent=0, skipped=15 — esperado, pois push_subscriptions tem 0 registros (nenhum usuário aceitou push no browser ainda).

**Todos os 3 monitores SRE verificados ao vivo:**
- error-budget-monitor → HTTP 200 {"ok":true,"evaluated":[...],"created":0} ✓
- webhook-health-monitor → HTTP 200 {"checked":0,"degraded":0,...} ✓
- urn-rate-monitor → HTTP 200 {"ok":true,"triggered":[],...} ✓