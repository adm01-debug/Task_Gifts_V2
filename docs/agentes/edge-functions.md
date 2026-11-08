# Edge Functions (Supabase) — referência para agentes

Ler quando mexer em qualquer coisa de `supabase/functions/`, ou quando uma chamada de edge voltar 404,
401 ou simplesmente não sair do front.

| O que | Valor |
|---|---|
| Runtime | Deno, no projeto Supabase **`eidsaqymojyuhprobfpn`** (ver `banco.md`) |
| Quantidade | **37** funções (cada uma com `index.ts`) + `_shared/` |
| Deploy | **manual**, `supabase functions deploy <nome> --project-ref eidsaqymojyuhprobfpn`. Não há workflow nem passo de CI |
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
3. **Deploy de fato.** Sem workflow, a única prova de que a função está publicada é consulta ao projeto
   (dashboard do Supabase ou `supabase functions list`). Arquivo no repo não é deploy.

## Inventário por área

- **Segurança/acesso:** `verify-ip` (lê `ip_whitelist`, grava `ip_access_logs`), `verify-geo` (lê
  `geo_settings` + `geo_allowed_countries`, grava `geo_access_logs`, consulta `ip-api.com` **em HTTP
  puro**), `detect-new-device`, `cleanup-old-security-logs`, `cleanup-rate-limit-logs`,
  `send-rate-limit-alert`, `security-weekly-digest`, `dispatch-critical-alert`, `admin-alerts`.
- **Notificação:** `send-email-notifications`, `send-email-digest`, `send-campaign-push`,
  `push-outbox-dispatcher`, `push-public-key`, `push-device-revoked` (secrets `RESEND_API_KEY`,
  `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).
- **IA:** `ai-coach`, `ai-course-builder`, `generate-quiz-questions`, `trail-recommendations`,
  `churn-prediction` (gateway de LLM / chave de provedor em secret).
- **Integração externa:** `bitrix24-oauth`, `bitrix24-api`, `bitrix24-webhook`, `external-api`,
  `external-webhook`, `external-db-bridge`, `webhook-dispatcher`, `webhook-health-monitor`.
- **Rotina de negócio:** `birthday-celebrations`, `checkin-reminders`, `survey-reminders`,
  `competency-alerts`, `weekly-league-processing`, `reward-approval-review`, `burn-rate-monitor`,
  `error-budget-monitor`, `migrate-helper`.

## Ao editar uma função

- Código compartilhado em `supabase/functions/_shared/` — não duplique CORS/validação.
- Teste de edge **não roda em nenhum runner**: `supabase/functions/external-webhook/validation.test.ts`
  usa `Deno.test` e não casa com o glob do vitest (`src/**`) nem com o do Playwright (`./tests`), e não
  há `deno test` em script nem em CI. Se você precisa de prova, rode `deno test` à mão e cole a saída na
  PR; não diga "testado" porque o CI ficou verde.
- Dependência de schema: confira a tabela/RPC no banco **antes** (ver `banco.md` — o código assume
  objetos que a auditoria de 2026-08 não encontrou: `email_outbox`, `push_devices`,
  `webhook_deliveries`, `public.security_logs`).
- `.claude/prompts/deploy-edge-functions.md` é o briefing que o dono usou para preparar o banco para as
  funções: serve de checklist de dependências (tabelas, RPCs, extensões, buckets, secrets), não de
  procedimento de deploy. Ele fala em "36 funções" e usa `--project-ref eidsaqymo` abreviado — hoje são
  **37** e o ref completo é `eidsaqymojyuhprobfpn`.
