# Dimensão 6 — Integrações

> Documento de detalhe da auditoria de estado — terceiros, webhooks, filas, automações.
> Evidência em `arquivo:linha`. Correções da Fase D estão em `ESTADO_ATUAL.md` e em `04-dados-e-runtime.md`.
> Runtime de build/teste = `NAO_VERIFICADO` (node_modules ausente no ambiente da auditoria).

> ## STATUS ATUAL (2026-11-24) — leia antes das tabelas abaixo
>
> Retrato da **auditoria original**; onde divergir do código, vale o código.
>
> | Afirmação no documento | Estado real hoje |
> |---|---|
> | HIBP "⬛ MORTO / zero chamadores / bloqueado pela CSP" (tabela de integrações, inventário de domínios `src/` e achados secundários) | **Implementado e ligado.** `checkPasswordLeaked` (`src/lib/authValidations.ts:95`) faz fetch com timeout de 4s (`:115-116`) e é chamado por `src/pages/Auth.tsx:195` e `src/components/PasswordStrengthIndicator.tsx:51`. a CSP de produção (`vercel.json:18`) libera `https://api.pwnedpasswords.com` em `connect-src` — a CSP que a auditoria citava (`index.html`) não existe; a efetiva é a do deploy. |
> | `bitrix24-oauth`, `bitrix24-api`, `bitrix24-webhook`, `external-db-bridge` como integrações existentes | **Removidas do repo.** Os achados de proxy REST Bitrix, OAuth Bitrix e executor de query genérica são obsoletos (não há função para corrigir). O link morto `/bitrix24` no menu mobile também já não existe. |
> | CSP atribuída a `index.html:6` em vários achados | **`index.html` não tem CSP** (nenhum `<meta http-equiv="Content-Security-Policy">`). A CSP efetiva é a do deploy, em `vercel.json:18`, que **já libera** `frame-src https://www.youtube.com` e `connect-src … https://api.pwnedpasswords.com`. Portanto o embed de YouTube (`ModuleViewer.tsx:90`) e a chamada do HIBP **não são bloqueados em produção**. |
> | `lovable-tagger` devDependency morta | **Continua valendo** (`package.json:134`, sem import em `vite.config.ts`). |

---

# Auditoria de INTEGRAÇÕES — task-gifts-v2

Método: grep transversal em `src/`, `supabase/functions/`, `supabase/migrations/`, `vite.config.ts`, `index.html`, `.env`, `.env.example`. Somente leitura. Nenhuma API externa chamada. Documentação do projeto ignorada como fonte.

**Descoberta estrutural que contamina quase todas as integrações do frontend** (detalhada em Achados graves #1): existe um *kill-switch* global de Edge Functions em `src/lib/edgeAvailability.ts:45-50` e a variável que o alimenta está **vazia** em `.env:25`. Com allowlist vazia o código retorna `false` (= bloquear tudo), então **100% das chamadas do frontend a Edge Functions são curto-circuitadas antes da rede**.

---

## Quadro de integrações

| Integração | Classificação | Onde está o código (arquivo:linha) | Credencial/secret | Chamador | Evidência de uso real | O que falta |
|---|---|---|---|---|---|---|
| **Supabase (cliente frontend)** | ✅ IMPLEMENTADO_TOTAL | `src/integrations/supabase/client.ts:5-6,11` | `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` — **vêm de env var, NÃO hardcoded**; presentes em `.env:2-3` | Todo o app (83 rotas em `src/App.tsx`) | Cliente criado com sessão persistente `src/integrations/supabase/client.ts:12-16`; tabelas de negócio com dados | Nada. Único ponto: `.env` está versionado no git (ver Achado #4) |
| **Supabase (Edge Functions runtime)** | 🟨 PARCIAL | 36 funções em `supabase/functions/`; secrets em 36 ocorrências de `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | pg_cron (`supabase/migrations/…`) e frontend via `invokeEdgeSafe` | Código completo e maduro (retry, idempotência, HMAC) | `supabase/config.toml` tem **1 linha só** (`project_id`) — sem bloco `[functions]`, logo `verify_jwt=true` para todas; e o frontend está bloqueado pela allowlist |
| **Sentry — frontend** | 🟨 PARCIAL | `src/main.tsx:14,18-58`; breadcrumbs de edge em `src/lib/requestId.ts:19,34,48,61` | `VITE_SENTRY_DSN` (`src/main.tsx:14`) — **ausente de `.env` e de `.env.example`** | `main.tsx` no bootstrap, guardado por `if (SENTRY_DSN)` (`src/main.tsx:18`) | Init bem configurado (mask PII, sampling por ambiente, `beforeSend`, `denyUrls`). CSP já libera `https://*.sentry.io` (`vercel.json:18`) | Definir `VITE_SENTRY_DSN`. Hoje o `if` é sempre falso → **Sentry nunca inicializa**. Sem `Sentry.ErrorBoundary` em `src/App.tsx` |
| **Sentry — edge functions** | 🟨 PARCIAL | `supabase/functions/_shared/sentry.ts:1-28` (import dinâmico de `https://deno.land/x/sentry/index.ts`) | `SENTRY_DSN`, `SENTRY_ENV` (`_shared/sentry.ts:7,18`) | `withSentry(...)` em 6 funções: `external-webhook:18`, `webhook-dispatcher:8`, `send-email-notifications:13`, `bitrix24-webhook:51`, `ai-coach:49`, `detect-new-device:16`, `webhook-health-monitor:23` | Testes unitários reais em `_shared/sentry_test.ts:4,23,41,58` | `SENTRY_DSN` não configurado ⇒ `getSentry()` retorna `null` (`_shared/sentry.ts:8`) e tudo vira `console.log`. Import sem versão pinada (`deno.land/x/sentry` sem `@x.y.z`) |
| **Sentry — pacotes npm** | 🟦 SUGERIDO (deps mortas) | `package.json` deps `@sentry/browser@^10.53.1`, `@sentry/deno@^10.53.1`, `@sentry/tracing@^7.120.4` | — | Nenhum | grep por `@sentry/tracing`, `@sentry/browser`, `@sentry/deno` em `src/` e `supabase/`: **zero ocorrências** | Remover as 3. Só `@sentry/react` é usado. `@sentry/tracing@7` é pacote **deprecado** e de major diferente do resto (v10) — conflito confirmado, sem uso |
| **Web Push / VAPID** | 🟨 PARCIAL (fila e VAPID OK; zero assinantes) | `supabase/functions/push-outbox-dispatcher/index.ts:30-36`, `send-campaign-push/index.ts:24-30`, `push-device-revoked/index.ts:24-28`, `push-public-key/index.ts:5`; cliente em `src/services/pushSubscriptionService.ts:44,66,82-90` | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (default `mailto:no-reply@taskgifts.com`) | Cron `push-outbox-dispatcher` a cada minuto (`migrations/20260728112123…sql:243-252`); frontend via `invokeEdgeSafe("push-public-key")` (`pushSubscriptionService.ts:66`) | `push_outbox=21`, **todas `skipped`** (fila drenada pelo job #30); `push_subscriptions=0` | (a) ~~a chave pública é buscada pela edge fn bloqueada pela allowlist ⇒ `getPublicKey()` sempre `null`~~ **CORRIGIDO em 2026-11-24 quanto à chave, não quanto à assinatura:** `push-public-key` responde **200** com a chave VAPID pública (`{"publicKey":"BIo5zu6…"}`) e está em `config.toml:9-10` com `verify_jwt=false` — a chave é servível. A **assinatura** (`pushSubscriptionService.ts:66-90`) depende de navegador + sessão e continua não exercitada (`push_subscriptions`=0); (b) ~~o cron não envia `Authorization` ⇒ 401~~ **CORRIGIDO:** o job #30 envia `x-internal-secret` de `_internal.dispatch_config.cron_secret` (`cron.job.command`), aceito por `guardInternalRequest` (`push-outbox-dispatcher/index.ts:27`) — `net._http_response` nas últimas 2h: 152 de 152 respostas 200. O que falta é **assinante**, não fiação |
| **PWA / Service Worker** | 🟨 PARCIAL | `vite.config.ts:4,14-147` (`VitePWA`, `registerType:"autoUpdate"`, manifest completo, workbox runtimeCaching) | — | Plugin no build | Manifest com ícones/shortcuts/screenshots; `public/pwa-192x192.png`, `pwa-512x512.png`, `offline.html` existem | **Três** service workers em `public/`: `sw.js` (315 linhas), `sw-push.js` (96), `push-sw.js` (32). O VitePWA gera `dist/sw.js` que **colide com `public/sw.js`**. O app só registra `/push-sw.js` (`pushSubscriptionService.ts:44,82`) — os outros dois são órfãos |
| **E-mail — Resend** | 🟨 PARCIAL | `supabase/functions/detect-new-device/index.ts:25,100,161-173` | `RESEND_API_KEY` (única ocorrência no repo) | `invokeEdgeSafe` em `src/hooks/useDeviceDetection.ts:91` | Único ponto que realmente chama `https://api.resend.com/emails` | Remetente é `onboarding@resend.dev` (`detect-new-device/index.ts:168`) — domínio *sandbox* do Resend, só entrega para o dono da conta. Sem domínio verificado, sem `RESEND_API_KEY` em `.env.example` |
| **E-mail — digest/notifications** | ⬛ MORTO_OU_ABANDONADO (stub) | `supabase/functions/send-email-digest/index.ts:247-254`, `send-email-notifications/index.ts:172-178` | **Nenhuma** — não lê nenhum secret de e-mail | Nenhum chamador (nem frontend, nem cron) | `send-email-digest:249` `// Log the digest (in production, integrate with email service)`; `send-email-notifications:172` `// In production, you would integrate with an email service like Resend, SendGrid…` + `:178` `console.log("Would send email to …")` | Integração de e-mail inteira. Hoje só monta HTML e escreve no console |
| **IA / LLM (OpenRouter)** | 🟨 PARCIAL | `ai-coach/index.ts:69,77,84,156,163`; `ai-course-builder/index.ts:7,130,137`; `trail-recommendations/index.ts:85,237,244`; `churn-prediction/index.ts:49,176,183`; `generate-quiz-questions/index.ts:97,144,151`; `reward-approval-review/index.ts:8,65,72` | `OPENROUTER_API_KEY` (6 usos) | `invokeEdgeSafe("ai-course-builder")` (`src/services/aiCourseBuilderService.ts:57`), `("competency-alerts")`, etc. — bloqueados pela allowlist. **Coaches (sugestões e chat) usam `fetch` direto em `src/hooks/useAICoach.ts:54,133` → NÃO passam pela allowlist** | Endpoint: `https://openrouter.ai/api/v1/chat/completions`. Modelos: `google/gemini-2.5-flash` (5 funções) e `google/gemini-2.5-flash-lite` (`ai-coach:84`). `ai_coach_messages=0`, `ai_course_jobs=0` | Provedor **não é OpenAI/Anthropic direto** — é o OpenRouter (roteador de modelos). `OPENROUTER_API_KEY` ausente de `.env.example`. Nenhum tráfego: tabelas zeradas |
| **Webhooks de SAÍDA** | 🟨 PARCIAL | `supabase/functions/webhook-dispatcher/index.ts` (285 linhas), `webhook-health-monitor/index.ts` | Segredos por assinatura em tabela (`webhook_subscriptions`); `WEBHOOK_HEALTH_THRESHOLD`, `WEBHOOK_HEALTH_MIN_SAMPLE`, `SLO_TARGET` | Só a UI admin: `src/pages/WebhooksAdmin.tsx:153`, `WebhookSubscriptionDetail.tsx:152,207` — via `invokeEdgeSafe` (bloqueado) | `webhook_subscriptions=0`, `webhook_delivery_logs=0`, `webhook_idempotency=0` | **Nenhum trigger de banco dispara `webhook-dispatcher`**: grep por `webhook-dispatcher` em `supabase/migrations/*.sql` = 0 resultados. Não há produtor automático de eventos — só o botão manual do admin |
| **Webhooks de ENTRADA** | 🟨 PARCIAL | `external-webhook/index.ts` (825 linhas), `external-api/index.ts` (822), `external-db-bridge/index.ts` (308) | `x-api-key` + `x-api-secret` (`external-api/index.ts:36,42`), tabela `external_api_keys` | Externo (nenhum caller interno) | `external_api_keys=0`, `external_tasks=0`, `api_request_logs=0` | Sem `[functions.*] verify_jwt=false` no `config.toml`, o gateway do Supabase exige JWT **antes** do código rodar ⇒ um parceiro com api-key nunca chega ao handler. Nenhuma key emitida |
| **Bitrix24 (CRM)** | ⬛ MORTO_OU_ABANDONADO | `bitrix24-oauth/index.ts` (209 linhas, OAuth completo: authorize/callback/refresh/status), `bitrix24-api/index.ts` (429), `bitrix24-webhook/index.ts` (379, HMAC fail-closed em `:75-91`) | `BITRIX24_CLIENT_ID`, `BITRIX24_CLIENT_SECRET`, `BITRIX24_DOMAIN`, `BITRIX24_WEBHOOK_SECRET`, `FRONTEND_URL` | **NENHUM.** grep `-i bitrix` em `src/*.ts(x)` → só tipos (`src/types/charts.ts:41-78`), labels de menu e colunas de tabela. Zero `invokeEdge*("bitrix24-…")`. Zero em migrations | `bitrix24_tokens`, `bitrix24_sync_mappings`, `bitrix24_webhook_logs` todas **vazias** | Tudo. O OAuth está tecnicamente completo mas **não há nenhuma UI que o inicie**: `src/components/MobileDrawer.tsx:53` linka `/bitrix24`, rota que **não existe** em `src/App.tsx`. `src/services/positionsService.ts:452,479` (`createBitrixTaskScore`/`getBitrixTaskScore`) têm **zero chamadores**. `VITE_BITRIX_WEBHOOK_URL` está no `.env.example:11` e nunca é lido pelo código |
| **Geo / IP (ip-api.com)** | 🟨 PARCIAL | `supabase/functions/verify-geo/index.ts:16-36` — `fetch("http://ip-api.com/json/…")` | **Nenhuma** (serviço grátis, 45 req/min, sem key) | `invokeEdgeSafe("verify-ip")` em `src/components/IpAccessGuard.tsx:38` e `src/pages/Auth.tsx:59` (bloqueados). `verify-geo` **não tem chamador nenhum** no frontend | `verify-ip/index.ts:49-59` e `verify-geo:61-73` são *fail-open* (liberam se lista vazia ou erro) | (a) chamada em **HTTP puro**, não HTTPS (`verify-geo:19`) — IP do usuário trafega em claro; (b) sem chave/plano, rate limit de 45 rpm derruba a proteção sob carga; (c) `verify-geo` órfão |
| **Lovable — `@lovable.dev/cloud-auth-js`** | ✅ IMPLEMENTADO_TOTAL (código+chamador) | `src/integrations/lovable/index.ts:3,5,12-37` | Nenhum secret explícito (config interna do SDK) | `src/pages/Auth.tsx:14` — botão de OAuth Google/Apple | `signInWithOAuth` faz `supabase.auth.setSession(result.tokens)` (`index.ts:31`) | Sem evidência medida de logins por esse caminho. Cria dependência de infra Lovable para autenticação social |
| **Lovable — `lovable-tagger`** | ⬛ MORTO | devDependency em `package.json` | — | Nenhum | `vite.config.ts:12-148` **não importa nem usa** `componentTagger`; sobrou apenas o `.filter(Boolean)` na linha 148 (resto de um plugin condicional removido) | Remover a dependência |
| **Upstash Redis (rate limit / cache)** | 🟨 PARCIAL | `_shared/rate-limiter.ts:22-23`, `_shared/rate-limit.ts:7-8`, `_shared/cache.ts:7-8,28-29` | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Módulos compartilhados usados pelas edge functions | Código de fallback presente quando as vars faltam | Secrets não documentados em `.env.example`; sem eles o rate limit distribuído degrada silenciosamente |
| **Slack (alertas)** | 🟨 PARCIAL | `security-weekly-digest/index.ts:81`, `dispatch-critical-alert/index.ts:57-58` | `SLACK_ALERT_WEBHOOK_URL` (opt-in, ambos comentam "opt-in") | Cron `security-weekly-digest` (`migrations/20260712212544…sql:1-11`) | Cron existe e aponta para a URL do projeto | O cron do `security-weekly-digest` **não manda `Authorization`** e a função usa `guardInternalRequest` ⇒ 401. Secret não documentado |
| **Have I Been Pwned (HIBP)** | ✅ IMPLEMENTADO_TOTAL | `src/lib/authValidations.ts:95` (`checkPasswordLeaked`), fetch em `:116` para `https://api.pwnedpasswords.com/range/{prefix}` (k-anonymity, correto), com timeout de 4s (`:115`) e degradação graciosa (fail-open declarado: indisponibilidade do HIBP não bloqueia cadastro) | Nenhuma (API pública) | `src/pages/Auth.tsx:195` e `src/components/PasswordStrengthIndicator.tsx:51` | A CSP efetiva (`vercel.json:18`) inclui `https://api.pwnedpasswords.com` em `connect-src` — não há bloqueio em produção |
| **YouTube (embed de vídeo em trilhas)** | ✅ IMPLEMENTADO_TOTAL | `src/components/lms/ModuleViewer.tsx:79,90` (`iframe src=https://www.youtube.com/embed/…`) | — | Viewer de módulo LMS | Código funcional de parse de videoId | **Não é bloqueado em produção**: a CSP efetiva (`vercel.json:18`) declara `frame-src https://www.youtube.com`. A auditoria olhou `index.html`, que não tem CSP alguma |
| **FCM (`fcm.googleapis.com`)** | 🟦 SUGERIDO/RESÍDUO | 2 ocorrências em `src/` (comentários/fixtures de teste de endpoint Web Push) | — | Nenhum | — | Não é uma integração FCM real; é o host padrão de endpoints Web Push do Chrome citado em teste |

---

## Secrets exigidos pelas edge functions

Extraídos por `grep -rhno "Deno\.env\.get(...)" supabase/functions/` (contagem = nº de ocorrências no código):

| Secret | Ocorrências | Onde/para quê |
|---|---|---|
| `SUPABASE_URL` | 36 | Todas as funções |
| `SUPABASE_SERVICE_ROLE_KEY` | 36 | Todas; também é um dos tokens aceitos por `verifyServiceRole` (`_shared/security.ts:98`) |
| `OPENROUTER_API_KEY` | 6 | 6 funções de IA (OpenRouter) |
| `VAPID_PUBLIC_KEY` | 4 | Web Push (4 funções) |
| `UPSTASH_REDIS_REST_URL` | 4 | rate-limit + cache |
| `UPSTASH_REDIS_REST_TOKEN` | 4 | rate-limit + cache |
| `SUPABASE_ANON_KEY` | 4 | inclui `bitrix24-oauth/index.ts:89` |
| `VAPID_SUBJECT` | 3 | Web Push (default `mailto:no-reply@taskgifts.com`) |
| `VAPID_PRIVATE_KEY` | 3 | Web Push |
| `SLACK_ALERT_WEBHOOK_URL` | 2 | `security-weekly-digest`, `dispatch-critical-alert` |
| `BITRIX24_CLIENT_SECRET` | 2 | `bitrix24-oauth` |
| `BITRIX24_CLIENT_ID` | 2 | `bitrix24-oauth` |
| `WEBHOOK_HEALTH_THRESHOLD` | 1 | `webhook-health-monitor` |
| `WEBHOOK_HEALTH_MIN_SAMPLE` | 1 | `webhook-health-monitor` |
| `SLO_TARGET` | 1 | `error-budget-monitor` |
| `SENTRY_ENV` | 1 | `_shared/sentry.ts:18` |
| `SENTRY_DSN` | 1 | `_shared/sentry.ts:7` |
| `RESEND_API_KEY` | 1 | `detect-new-device/index.ts:25` |
| `INTERNAL_FUNCTION_SECRET` | 1 | `_shared/security.ts:99` |
| `FRONTEND_URL` | 1 | `bitrix24-oauth/index.ts:115` (fallback `https://lovable.dev`) |
| `CRON_SECRET` | 1 | `_shared/security.ts:100` |
| `BITRIX24_WEBHOOK_SECRET` | 1 | `bitrix24-webhook/index.ts:80` |
| `BITRIX24_DOMAIN` | 1 | `bitrix24-oauth/index.ts:25` |

**Total: 23 secrets distintos.** Nenhum deles aparece em `.env.example` (o arquivo só documenta vars `VITE_*` do frontend). Não há nenhum `supabase/.env.example` nem doc de secrets de servidor no repo.

---

## Env vars do frontend

Extraídas por `grep -rhno "import\.meta\.env\.[A-Za-z0-9_]*" src/`:

| Var | Usos | Onde | Presente em `.env`? | Presente em `.env.example`? |
|---|---|---|---|---|
| `MODE` (builtin Vite) | 1 | `src/main.tsx:15` | n/a | n/a |
| `DEV` (builtin Vite) | 5 | vários | n/a | n/a |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | 4 | `src/integrations/supabase/client.ts:6` | ✅ `.env:2` | ❌ **ausente** |
| `VITE_SUPABASE_URL` | 3 | `src/integrations/supabase/client.ts:5` | ✅ `.env:3` | ✅ `.env.example:7` |
| `VITE_SENTRY_DSN` | 1 | `src/main.tsx:14` | ❌ **ausente** | ❌ **ausente** |
| `VITE_DEPLOYED_EDGE_FUNCTIONS` | 1 | `src/lib/edgeAvailability.ts:35` | ⚠️ `.env:25` presente porém **vazia** | comentada em `.env.example:26` |
| `VITE_APP_VERSION` | 1 | `src/main.tsx:22` (release do Sentry) | ❌ **ausente** | ❌ **ausente** |

Além disso, `process.env.VITE_SUPABASE_ANON_KEY` é usado apenas em testes (`src/test/rls.test.ts:9`, `src/test/rpcAccess.test.ts:13`) — não no app.

---

## Divergências `.env.example` × código

### (a) Usadas no código mas AUSENTES do `.env.example`
1. **`VITE_SUPABASE_PUBLISHABLE_KEY`** — 🔴 crítico. É a chave que o cliente realmente lê (`src/integrations/supabase/client.ts:6`). O `.env.example:8` documenta `VITE_SUPABASE_ANON_KEY`, **nome que o app nunca lê**. Quem seguir o `.env.example` ao pé da letra sobe um app com `createClient(url, undefined)`.
2. **`VITE_SENTRY_DSN`** — sem ela o Sentry do frontend nunca liga (`src/main.tsx:18`).
3. **`VITE_APP_VERSION`** — release tag do Sentry (`src/main.tsx:22`).
4. **Os 23 secrets de edge function** listados acima (`SENTRY_DSN`, `RESEND_API_KEY`, `OPENROUTER_API_KEY`, `VAPID_*`, `BITRIX24_*`, `UPSTASH_*`, `SLACK_ALERT_WEBHOOK_URL`, `INTERNAL_FUNCTION_SECRET`, `CRON_SECRET`, `FRONTEND_URL`, `SLO_TARGET`, `WEBHOOK_HEALTH_*`) — nenhum documentado em lugar nenhum do repo.

### (b) Declaradas no `.env.example` mas NUNCA usadas no código
| Var | Linha | Situação |
|---|---|---|
| `VITE_SUPABASE_ANON_KEY` | `.env.example:8` | Nome errado — o app usa `VITE_SUPABASE_PUBLISHABLE_KEY`. Só aparece em testes |
| `VITE_BITRIX_WEBHOOK_URL` | `.env.example:11` | Zero ocorrências em `src/` — resíduo de integração Bitrix nunca conectada ao frontend |
| `VITE_APP_NAME` | `.env.example:14` | Zero ocorrências |
| `VITE_APP_ENV` | `.env.example:15` | Zero ocorrências (o código usa `import.meta.env.MODE`) |
| `VITE_ENABLE_ANALYTICS` | `.env.example:18` | Zero ocorrências |
| `VITE_ENABLE_DEBUG` | `.env.example:19` | Zero ocorrências (o código usa `import.meta.env.DEV`) |

### (c) Divergência de *semântica* (pior que ausência)
`.env.example:24` afirma: *"Deixe vazio durante desenvolvimento local (**todas liberadas**)"*.
O código faz o **oposto** — `src/lib/edgeAvailability.ts:47-48`:
```ts
// allowlist vazia = block all (nenhuma função foi deployada ainda).
if (allowlist.size === 0) return false;
```
O `.env:7` já corrige o texto ("NENHUMA FUNÇÃO LISTADA = …"), mas o `.env.example` continua ensinando o contrário.

### (d) Var presente no `.env` e nunca lida
`VITE_SUPABASE_PROJECT_ID` (`.env:1`) — zero ocorrências em `src/` e em `vite.config.ts`.

---

## Domínios externos encontrados

**Em `supabase/functions/` (servidor — chamadas reais):**
| Domínio | Ocorrências | Papel |
|---|---|---|
| `https://esm.sh` | 34 | CDN de módulos (supabase-js) |
| `https://deno.land` | 33 | std lib + Sentry (`deno.land/x/sentry`, **sem versão pinada**) |
| `https://openrouter.ai` | 7 | Gateway LLM (6 funções de IA) |
| `https://api.resend.com` | 1 | E-mail transacional (`detect-new-device`) |
| `https://lovable.dev` | 1 | Fallback de `FRONTEND_URL` (`bitrix24-oauth:115`) |
| `http://ip-api.com` | 1 | **Geolocalização por IP em HTTP puro** (`verify-geo:19`) |
| `https://{BITRIX24_DOMAIN}` | 2 | OAuth Bitrix (`bitrix24-oauth:40,62,136`) — host vem de env var |
| `https://awzhgfmqwddzgbqzqusc.supabase.co` | vários (migrations) | URL do projeto hardcoded nos crons |

**Em `src/` (browser):**
| Domínio | Ocorrências | Papel |
|---|---|---|
| `https://i.pravatar.cc` | 14 | Avatares fake em Storybook (`src/stories/…`) |
| `https://www.youtube.com` | 2 | Embed de vídeo LMS (`ModuleViewer.tsx:90`) — liberado pela CSP de produção (`vercel.json:18`, `frame-src`) |
| `https://fcm.googleapis.com` | 2 | Endpoints Web Push em testes/fixtures |
| `https://api.pwnedpasswords.com` | 1 | HIBP (`authValidations.ts:116`, k-anonymity) — **chamado** por `Auth.tsx:195` e `PasswordStrengthIndicator.tsx:51`; liberado na CSP de `vercel.json` |
| `https://fonts.googleapis.com` / `gstatic.com` | 1 + workbox | Fontes (liberadas na CSP e cacheadas por workbox) |
| `https://taskgifts.app`, `https://app.exemplo.com`, `https://push.example`, `https://a.com` | 2+2+2+2 | Placeholders / fixtures de teste |
| `github.com`, `twitter.com`, `linkedin.com`, `schema.org` | 1 cada | Links estáticos / metadados |

---

## Achados graves

### 🔴 1 — Kill-switch global desliga TODAS as Edge Functions no frontend
`src/lib/edgeAvailability.ts:45-50`:
```ts
export function isFunctionDeployed(fnName: string): boolean {
  const allowlist = getDeployedAllowlist();
  if (allowlist.size === 0) return false;   // vazia = bloqueia tudo
  return allowlist.has(fnName.toLowerCase());
}
```
`.env:25` → `VITE_DEPLOYED_EDGE_FUNCTIONS=` (**vazia**).
`src/lib/requestId.ts:131-140` faz o curto-circuito antes de qualquer request (`kind: "not_found"`, status 404 sintético).

**Verificação de cobertura:** o único uso de `supabase.functions.invoke` em todo o `src/` está dentro de `src/lib/requestId.ts:88` — ou seja, **não existe rota de escape**. Todos os 17 call-sites usam `invokeEdgeSafe` (`IpAccessGuard.tsx:38`, `Auth.tsx:59`, `useAdminAlerts.ts:17`, `useDeviceDetection.ts:91`, `useCompetencyAlerts.ts:27,47`, `TrailRecommendations.tsx:54`, `AIQuestionGenerator.tsx:52`, `churnPredictionService.ts:34`, `purchaseGovernanceService.ts:83`, `aiCourseBuilderService.ts:57`, `salesCampaignsService.ts:142`, `notificationsService.ts:184`, `pushSubscriptionService.ts:66,391`, `WebhooksAdmin.tsx:153`, `WebhookSubscriptionDetail.tsx:152,207`).

**Consequência medida:** explica diretamente `push_subscriptions=0`, `ai_coach_messages=0`, `ai_course_jobs=0`, `webhook_delivery_logs=0`. Não são features inacabadas — são features **desligadas por uma variável vazia**. Correção: 1 linha no `.env`.

### 🟢 2 — CORRIGIDO em 2026-11-24: os crons de Edge Function autenticam com `x-internal-secret` e recebem 200
`supabase/functions/_shared/security.ts:96-112` (`verifyServiceRole`) só aceita `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_FUNCTION_SECRET` ou `CRON_SECRET`. `guardInternalRequest` (`:120-130`) devolve 401 para qualquer outra coisa. Guardam 6 funções: `push-outbox-dispatcher`, `security-weekly-digest`, `webhook-health-monitor`, `burn-rate-monitor`, `error-budget-monitor`, `cleanup-old-security-logs`. **Estado medido:** os jobs vivos (#30 `push-outbox-dispatcher`, #31, #32, #33 `security-weekly-digest`, #34) enviam `x-internal-secret` resolvido de `_internal.dispatch_config.cron_secret` (`cron.job.command`) — a autenticação da função está resolvida. O HTTP de #30/#31/#32/#34 é 200 (152 de 152 nas últimas 2h; distribuição horária que prova o chamador em `05-edge-functions.md:207`). **#33 não está coberto:** é semanal (`0 13 * * 1`), não caiu na janela, e o `succeeded` dele prova só que o SQL enfileirou o `net.http_post` (`05-edge-functions.md:209`).

Mas os crons que as chamam:
- `migrations/20260728112123…sql:246-251` (`push-outbox-dispatcher`, `* * * * *`) — `headers := jsonb_build_object('Content-Type','application/json')`, **sem Authorization** nesse arquivo — mas o job vivo #30 foi recriado com `x-internal-secret` (`cron.job.command`) e recebe **200** a cada minuto (`net._http_response` nas últimas 2h: 152 de 152).
- `migrations/20260712212544…sql:5-10` (`security-weekly-digest`) — idem, **sem Authorization** nesse arquivo; o job vivo #33 foi recriado com `x-internal-secret` (`cron.job.command`) e a execução de 2026-11-23T13:00:00Z terminou `succeeded` — isso prova o **agendamento**, não a resposta HTTP, que não foi observada na janela medida.
- `migrations/20260712194718…sql:5,13-20` (`webhook-health-monitor`) — envia `Bearer <anon key>`, que **não está** na lista de segredos aceitos ⇒ 401 **se esse SQL fosse o que roda**; o job vivo #34 foi recriado com `x-internal-secret` (`cron.job.command`) e tem **738 execuções, 0 falhas**.

**Diagnóstico anterior, medido como falso em 2026-11-24:** supunha-se que a fila enchia porque o consumidor nunca autenticava. A fila **é drenada** pelo job #30 (11.078 execuções, 0 falhas) e as 21 linhas estão `skipped` por `push_subscriptions`=0 — nenhum push saiu por falta de assinante, não por 401.

### 🟡 3 — `supabase/config.toml` desliga `verify_jwt` em 9 funções (as externas ficam de fora)
O arquivo inteiro é `project_id = "awzhgfmqwddzgbqzqusc"`. Sem bloco `[functions.<nome>]`, o gateway do Supabase exige JWT válido **antes** de o handler rodar. Isso invalida por construção todos os endpoints projetados para chamadores externos sem JWT:
- `bitrix24-webhook` — o Bitrix24 assina com HMAC (`index.ts:75-91`), não com JWT Supabase. O webhook de entrada é inatingível.
- `external-api` / `external-webhook` / `external-db-bridge` — autenticam por `x-api-key`/`x-api-secret` (`external-api/index.ts:36,42`), que o gateway nunca deixa chegar.
- `push-outbox-dispatcher`, `security-weekly-digest` chamados por `net.http_post` — **CORRIGIDO em 2026-11-24:** as duas estão em `supabase/config.toml` com `verify_jwt=false` (`:11-13` e `:15-16`), então o gateway não exige JWT; isso é **independente** do `x-internal-secret`, que é validado no handler por `guardInternalRequest`. O dispatcher recebe 200 a cada minuto; o digest é semanal e não foi observado na janela (ver `05-edge-functions.md:207-209`).

Ou seja: **1.955 linhas de código de integração externa (external-webhook 825 + external-api 822 + external-db-bridge 308) estão atrás de uma porta que só abre para JWT do próprio app.** Consistente com `external_api_keys=0`, `external_tasks=0`, `api_request_logs=0`.

### 🔴 4 — `.env` com credenciais reais está versionado no git; `.gitignore` não menciona `env`
`git ls-files --error-unmatch .env` → retorna `.env` (**tracked**). `grep -n "env" .gitignore` → **nenhuma linha**. O próprio `.env.example:29` avisa *"IMPORTANTE: Nunca commitar o arquivo .env com valores reais!"* — e o repo faz exatamente isso.
Agravante: a **anon JWT do projeto está hardcoded em migration versionada** — `supabase/migrations/20260712194718…sql:5`, e a URL do projeto (`awzhgfmqwddzgbqzqusc.supabase.co`) aparece hardcoded em vários crons. (Anon key é publicável por design, mas fixá-la em SQL impede rotação sem migration nova.)

### 🔴 5 — Bitrix24: OAuth completo, zero superfície de acionamento (código órfão de ponta a ponta)
1.017 linhas em 3 edge functions (`bitrix24-oauth` 209, `bitrix24-api` 429, `bitrix24-webhook` 379), com OAuth authorize/callback/refresh/status, HMAC fail-closed e idempotência — **e nenhum chamador em lugar nenhum**:
- `src/`: zero `invokeEdge*("bitrix24-…")`;
- `supabase/migrations/`: zero referências;
- a UI aponta para uma rota inexistente — `src/components/MobileDrawer.tsx:53` linka `/bitrix24`, e `grep -i bitrix src/App.tsx` (83 rotas) retorna **vazio** ⇒ link morto no menu mobile;
- `src/services/positionsService.ts:452,479` (`createBitrixTaskScore`, `getBitrixTaskScore`) têm zero chamadores;
- `.env.example:11` documenta `VITE_BITRIX_WEBHOOK_URL`, var que o código nunca lê.

Todas as tabelas (`bitrix24_tokens`, `bitrix24_sync_mappings`, `bitrix24_webhook_logs`) estão vazias — coerente: **não existe caminho de execução que as escreva**.

---

### Achados secundários relevantes
- **Sentry nunca inicializa** (frontend e edge): `VITE_SENTRY_DSN` e `SENTRY_DSN` ausentes ⇒ toda a observabilidade cara construída (`withSentry` em 7 funções, breadcrumbs correlacionados por `x-request-id`, `recordMetric`, `timeStep`) degrada para `console.log`. Custo de ativação: 2 variáveis.
- **Conflito de versão Sentry confirmado**: `@sentry/tracing@^7.120.4` (major 7, pacote deprecado) convive com `@sentry/react|browser|deno@^10.53.1`. Os três pacotes não-`react` têm **zero imports** no repo.
- **E-mail é 90% stub**: `send-email-digest` e `send-email-notifications` não leem nenhum secret de e-mail e apenas logam (`send-email-notifications:172-178`). O único envio real (`detect-new-device`) usa `onboarding@resend.dev`, domínio sandbox que só entrega ao dono da conta Resend.
- **3 service workers em `public/`** (`sw.js`, `sw-push.js`, `push-sw.js`) enquanto o VitePWA gera seu próprio `sw.js` — colisão de nome no build; o app só registra `/push-sw.js`.
- **A CSP que a auditoria citava não existe**: `index.html` não tem `meta` de CSP; a efetiva é `vercel.json:18` e ela **já libera** `frame-src https://www.youtube.com` (YouTube em `ModuleViewer.tsx:90`) e `connect-src … https://api.pwnedpasswords.com` (`authValidations.ts:116`, chamado em `Auth.tsx:195`).
- **`verify-geo` chama `http://ip-api.com` sem TLS** (`verify-geo:19`) e é *fail-open* em erro; a função sequer tem chamador no frontend.
- **`lovable-tagger`** é devDependency morta: `vite.config.ts` não a importa (sobrou só o `.filter(Boolean)` na linha 148).
