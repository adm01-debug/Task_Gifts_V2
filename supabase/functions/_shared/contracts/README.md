# Contratos das Edge Functions

Um contrato por função em `supabase/functions/<nome>/` (o teste `registry.contract.spec.ts` falha se uma
pasta ficar sem contrato ou sem fixtures). Cada contrato (`<nome>.ts`) declara:

| Campo | Significado |
|---|---|
| `request` | schema zod do corpo JSON. `EmptyBodySchema` quando a função ignora o corpo (GET/cron). |
| `query` | schema dos query params, só quando a função os lê (`migrate-helper`). |
| `response` | forma da resposta 2xx (documentação + teste de forma). |
| `methods` / `auth` | métodos aceitos além de OPTIONS e modo de autenticação (`user`, `service`, `access-key`, `none`). |
| `versions` / `validate` | só em contratos versionados (`webhook-dispatcher`): versões aceitas e validador próprio. |
| `bodyRequired` | se a função devolve 422 sem corpo útil. |

## Formato único de erro de validação — HTTP 422

Toda falha de validação devolve (ver `../validation.ts`):

```json
{
  "error": "A validação dos dados falhou: 1 campo(s) inválido(s)",
  "code": "VALIDATION_ERROR",
  "message": "A validação dos dados falhou: 1 campo(s) inválido(s)",
  "fields": [{ "field": "user_ids.1", "message": "Invalid uuid", "code": "invalid_string" }],
  "requestId": "opcional"
}
```

- `code`: `VALIDATION_ERROR` (campo inválido), `INVALID_JSON` (corpo não é JSON), `UNSUPPORTED_VERSION`
  (contrato versionado: versão desconhecida ou já descontinuada).
- `fields[].field` é o caminho do campo (`event.type`, `user_ids.2`); `(body)` quando o problema é o corpo inteiro.
- `error` repete `message` porque o front lê `payload.error ?? payload.message` (`src/lib/edgeErrors.ts`).

No handler: `const parsed = await parseJsonBody(req, Schema, { headers: corsHeaders, requestId }); if (!parsed.ok) return parsed.response;`

**Quem devolve 422 de fato:** as 11 funções que leem corpo ou query (`bodyRequired: true` e as de corpo
opcional) chamam `parseJsonBody`/`validateQuery`. As 5 sem corpo — `admin-alerts`, `churn-prediction`,
`push-outbox-dispatcher`, `push-public-key`, `verify-ip` — **ignoram o corpo da requisição**: o contrato
`EmptyBodySchema` documenta isso e é verificado em teste, mas elas não respondem 422 (um corpo estranho
simplesmente não é lido). Mudar isso mexeria no contrato de quem as chama (inclusive o `pg_cron`).

**Destino de notificação:** `url` em `send-campaign-push` e `push-device-revoked` usa `destinoUrl()`
(`common.ts`), que aceita caminho do app (`/campanhas/<id>`, o que o front envia) ou URL `http(s)` e
recusa `javascript:`/`data:`. Um `z.string().url()` ali fazia a função devolver 422 e o push ser
descartado em silêncio.

## Testes

- **vitest (roda no CI, job `quality`)** — `bun run test:contracts` ou `bun run test`:
  `validation.contract.spec.ts` (formato 422), `registry.contract.spec.ts` (todas as funções × fixtures de
  payload válido, campo ausente, tipo incorreto, valor vazio, corpo não-objeto) e
  `webhook-versioning.contract.spec.ts` (v1/v2, depreciação, sunset). Sufixo `.spec.ts` de propósito: o
  workflow `.github/workflows/deno.yml` roda `deno test` em todo `*test.ts` de `supabase/functions`. Fixtures em `_fixtures/index.ts`.
  O import `https://deno.land/x/zod@v3.25/mod.ts` resolve para `zod/v3` por alias em `vitest.config.ts`.
  `_fixtures/responses.ts` guarda uma amostra 2xx real por função (copiada do `return` do handler): o
  teste do registro exige amostra válida **e** inválida para toda função que declara `response`.
- **Deno (runtime real) — roda no CI** pelo workflow `.github/workflows/deno.yml` (job "Tipos e testes das Edge
  Functions": `deno check` de todo `index.ts` + `deno test` de todo `*test.ts`): `validation_test.ts`,
  `sentry_test.ts` e `contracts/contracts_test.ts`. Local: `bun run test:edge` (usa `bunx deno@2`).
- Type-check das funções: `bunx deno@2 check supabase/functions/*/index.ts` (precisa de acesso a esm.sh).

## Adicionar uma função nova

1. Criar `supabase/functions/<nome>/index.ts` usando `parseJsonBody` (ou `validateQuery`).
2. Criar `contracts/<nome>.ts` com `defineContract(...)` e registrar em `contracts/index.ts`.
3. Adicionar fixtures em `_fixtures/index.ts` (válido, ausente, tipo errado, vazio, não-objeto).
4. `bun run test:contracts` verde; `bun run test:edge` verde; deploy manual (ver `docs/agentes/edge-functions.md`).
