# Edge Functions (Supabase) — referência para agentes

Ler quando mexer em qualquer coisa de `supabase/functions/`, ou quando uma chamada de edge voltar 404,
401 ou simplesmente não sair do front.

| O que | Valor |
|---|---|
| Runtime | Deno, no projeto Supabase **`eidsaqymojyuhprobfpn`** (ver `banco.md`) |
| Quantidade | **16** funções (cada uma com `index.ts`) + `_shared/` — 21 foram podadas no PR #54 (`e1b0f36`); o briefing `.claude/prompts/deploy-edge-functions.md` ainda fala em 36/37 |
| Deploy | **automático em push na `main` que toque `supabase/functions/**`** via `.github/workflows/deploy-edge-functions.yml` (`supabase functions deploy --project-ref eidsaqymojyuhprobfpn --yes`, exige o secret `SUPABASE_ACCESS_TOKEN`; também por `workflow_dispatch` com lista de funções). Logo, **merge de PR que toca edge = deploy em produção** — confira o run do workflow e reporte. Manual: `supabase functions deploy <nome> --project-ref eidsaqymojyuhprobfpn` |
| Secrets | painel do Supabase ou `supabase secrets set` — **nunca** no Vercel, nunca em arquivo versionado |
| Gate de JWT | `supabase/config.toml` — só `[functions.migrate-helper] verify_jwt = false` |
| Gate no front | allowlist `VITE_DEPLOYED_EDGE_FUNCTIONS` (`src/lib/edgeAvailability.ts`) |

## As três portas que derrubam uma chamada antes do handler

Uma função pode estar 100% implementada e nunca executar. Antes de debugar o código, cheque as três
camadas, nesta ordem:

1. **Allowlist do front.** `src/lib/edgeAvailability.ts:35` lê `VITE_DEPLOYED_EDGE_FUNCTIONS` (lista
   separada por vírgula). Função fora da lista é **curto-circuitada sem request de rede** — nenhum log,
   nenhum erro no console, nada no Supabase. Lista vazia/ausente = nenhuma função liberada por esse
   caminho. Há ainda um kill-switch manual: `localStorage["edge-skills:disabled"]` desliga **todos** os
   pontos de chamada (`src/lib/requestId.ts:128`). Consumidores: `src/components/IpAccessGuard.tsx`,
   `src/pages/Auth.tsx`, `src/lib/requestId.ts`.
   **Deployou função nova? O deploy não termina até a allowlist ser atualizada** (env var do Vercel +
   `.env` local), senão o front continua sem chamar.
2. **`verify_jwt` do gateway do Supabase.** `supabase/config.toml` declara `verify_jwt = false` apenas
   para `migrate-helper`. Para todas as outras, o gateway exige JWT válido **antes** de o handler rodar.
   Isso invalida por construção todo endpoint pensado para chamador externo sem JWT:
   - `bitrix24-webhook` — o Bitrix24 assina com HMAC, não com JWT do Supabase;
   - `external-api`, `external-webhook`, `external-db-bridge` — autenticam por `x-api-key`/`x-api-secret`,
     que o gateway nunca deixa chegar;
   - `push-outbox-dispatcher`, `security-weekly-digest` e afins chamados por `net.http_post` do `pg_cron`
     sem header de JWT.
   Mexer nisso é mudança de perímetro: `verify_jwt = false` expõe a função à internet, e a autenticação
   passa a ser responsabilidade inteira do handler. **Chame o dono antes.**
3. **Deploy de fato.** O workflow `deploy-edge-functions.yml` publica no push da `main`, mas só se o secret
   `SUPABASE_ACCESS_TOKEN` existir e o run ficar verde — a prova é o run do workflow ou consulta ao projeto
   (dashboard do Supabase ou `supabase functions list`). Arquivo no repo não é deploy.

## Inventário por área (16 funções em `main`)

- **Segurança/acesso:** `verify-ip` (lê `ip_whitelist`, grava `ip_access_logs`; sem corpo),
  `detect-new-device` (JWT; corpo `fingerprint`/`userAgent`), `admin-alerts` (JWT admin; sem corpo).
- **Notificação (Web Push):** `send-campaign-push`, `push-device-revoked` (JWT), `push-outbox-dispatcher`
  (segredo interno, chamada pelo `pg_cron`), `push-public-key` (pública, `verify_jwt=false`); secrets
  `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`; `RESEND_API_KEY` só em `detect-new-device`.
- **IA (OpenRouter, secret `OPENROUTER_API_KEY`):** `ai-coach`, `ai-course-builder`,
  `generate-quiz-questions`, `trail-recommendations`, `churn-prediction`, `reward-approval-review`.
- **Integração externa:** `webhook-dispatcher` (service role; entrega assinada por HMAC aos assinantes de
  `webhook_subscriptions`; contrato versionado v1/v2 — ver abaixo).
- **Rotina de negócio / utilitário:** `competency-alerts`, `migrate-helper` (`verify_jwt=false`, chave de
  acesso fixa no código e `?action=credentials` devolve `service_role` — **risco conhecido, decisão do dono**).
- **Podadas no PR #54 (não existem mais, embora relatórios antigos as citem):** `bitrix24-*`, `external-*`,
  `verify-geo`, `cleanup-*`, `send-email-*`, `send-rate-limit-alert`, `security-weekly-digest`,
  `dispatch-critical-alert`, `webhook-health-monitor`, `birthday-celebrations`, `checkin-reminders`,
  `survey-reminders`, `weekly-league-processing`, `burn-rate-monitor`, `error-budget-monitor`.

## Contratos e validação (422 único)

- Todo corpo/query de entrada é validado por um schema zod em `supabase/functions/_shared/contracts/<nome>.ts`
  (registro em `contracts/index.ts`; leia `contracts/README.md`). Falha de validação em **qualquer** função
  devolve **HTTP 422** no formato `{ error, code, message, fields[{field,message,code}], requestId? }`
  (`_shared/validation.ts`: `parseJsonBody`, `validateQuery`). Códigos: `VALIDATION_ERROR`,
  `INVALID_JSON`, `UNSUPPORTED_VERSION`. O front já trata 4xx genérico via `payload.error`
  (`src/lib/edgeErrors.ts`), por isso `error` repete `message`.
- Função nova sem contrato quebra `registry.contract.test.ts` no CI — é intencional.

## Versionamento do webhook-dispatcher

- **v1** (sem `version`): `{ subscription_id, event_type, payload }`. **Depreciado**: aceito até
  `WEBHOOK_V1_SUNSET` (2027-05-31T00:00Z, em `contracts/webhook-dispatcher.ts`); toda resposta a um corpo
  v1 traz `Deprecation`, `Sunset` e `Link; rel="deprecation"`. Depois da data → 422 `UNSUPPORTED_VERSION`.
- **v2** (`version: "v2"`): `{ version, subscription_id, event: { type, id?, occurred_at? }, payload, metadata? }`.
  Normaliza para o mesmo caminho interno; o envelope entregue ao assinante continua `{ event, timestamp, data }`
  e ganha `id`/`occurred_at`/`metadata` **só quando v2 os informa** (aditivo, não quebra assinantes).
- Toda resposta carrega `X-Contract-Version`. Front (`WebhooksAdmin.tsx`, `WebhookSubscriptionDetail.tsx`)
  ainda envia v1 — migrar para v2 antes do sunset.

## Ao editar uma função

- Código compartilhado em `supabase/functions/_shared/` — não duplique CORS/validação.
- Testes: os **contratos** rodam no job `quality` pelo vitest (`supabase/functions/**/*.contract.spec.ts`,
  incluídos em `vitest.config.ts`; `bun run test:contracts`). Os testes **Deno** (`_shared/*_test.ts`,
  `_shared/contracts/contracts_test.ts`) e o `deno check` de todo `index.ts` rodam no workflow
  `.github/workflows/deno.yml` (job "Tipos e testes das Edge Functions") em PR/push que toque
  `supabase/functions/**` ou `package.json` — ele roda `deno test` em **todo `*test.ts`**, por isso os testes
  vitest usam o sufixo `.spec.ts`. Local: `bun run test:edge` e `bunx deno@2 check supabase/functions/*/index.ts`
  (precisa alcançar esm.sh). Teste verde não prova o comportamento em produção: confira o run de deploy.
- Dependência de schema: confira a tabela/RPC no banco **antes** (ver `banco.md` — o código assume
  objetos que a auditoria de 2026-08 não encontrou: `email_outbox`, `push_devices`,
  `webhook_deliveries`, `public.security_logs`).
- `.claude/prompts/deploy-edge-functions.md` é o briefing que o dono usou para preparar o banco para as
  funções: serve de checklist de dependências (tabelas, RPCs, extensões, buckets, secrets), não de
  procedimento de deploy. Ele fala em "36 funções" e usa `--project-ref eidsaqymo` abreviado — hoje são
  **37** e o ref completo é `eidsaqymojyuhprobfpn`.
