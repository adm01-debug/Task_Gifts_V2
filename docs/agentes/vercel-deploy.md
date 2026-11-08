# Vercel e deploy — referência para agentes

Ler quando for confirmar um deploy, mexer em env vars do Vercel, domínio ou headers de segurança.

| O que | Valor |
|---|---|
| Projeto | `task-gifts-v2` (`prj_1A90yGrM8KbAdPij1YkocIdQqinO`) |
| Team | `juca` / slug `juca1` (`team_QyN41X0q8hrqhW80AwokbFLv`) |
| URL de produção | **https://task-gifts-v2.vercel.app** (também `task-gifts-v2-juca1.vercel.app` e `task-gifts-v2-git-main-juca1.vercel.app`) |
| Domínio próprio | **não há** — só os aliases `*.vercel.app` |
| Framework / build / output | Vite · `bun run build` · `dist/` · Node **24.x** |
| Proteção | `ssoProtection = all_except_custom_domains` — as URLs `*.vercel.app` **exigem login na Vercel**; ferramenta externa (e agente) não consegue abrir a produção sem sessão |
| MCP Vercel | ferramentas `mcp__Vercel__*` — escrita = ação de produção. Passe `idOrName: "task-gifts-v2"` **sem** `teamId`: com `teamId` explícito a API deste token responde 404 |

## Deploy

- **Front (Vercel):** deploy automático na `main` — **merge em `main` = deploy em produção**. Não há
  workflow de deploy no GitHub; o Vercel escuta o repo direto. Depois do merge, confirme com
  `mcp__Vercel__get_project` (campo `latestDeployment`: `readyState: "READY"`, `target: "production"`) ou
  `mcp__Vercel__list_deployments`.
- **Edge functions:** **não** passam pelo Vercel nem por CI. É `supabase functions deploy` manual —
  ver `docs/agentes/edge-functions.md`.
- **SPA pura:** `vercel.json` reescreve `/(.*)` → `/index.html`. **Não existe função serverless neste
  projeto** — nenhuma rota de API roda no Vercel.
- Rollback: `mcp__Vercel__request_rollback` (ou promover um deploy anterior). Nunca editar produção à mão.

## Headers de segurança — `vercel.json`

Toda resposta leva `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (câmera/microfone/geo negados),
HSTS `max-age=63072000; includeSubDomains; preload` e **CSP**.

A CSP permite `script-src 'self' 'unsafe-inline' https://*.supabase.co https://*.sentry.io` e
`connect-src` para `*.supabase.co` (+ `wss:`), `*.sentry.io` e Google Fonts. Consequências:

- domínio novo consumido pelo front (gateway de IA, CDN, API externa) **precisa entrar no `connect-src`**
  ou a chamada morre no browser sem erro de rede óbvio;
- `'unsafe-inline'` em `script-src` anula boa parte do valor da CSP — não é motivo para afrouxar mais;
- `frame-ancestors 'none'` + `X-Frame-Options: DENY`: nada deste app pode ser embutido em iframe.

## Regras de env vars no Vercel

- `VITE_*` vai para o bundle e é **público** — nunca segredo com prefixo `VITE_`.
- **Nunca** colocar chave de servidor (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`,
  `POSTGRES_*`, OPENAI/ANTHROPIC/RESEND/VAPID): não há serverless aqui, então nada no Vercel consegue
  usá-las — só aumentam a superfície de vazamento. Chave de servidor é secret de Edge Function.
- O front lê exatamente: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
  `VITE_DEPLOYED_EDGE_FUNCTIONS`, `VITE_SENTRY_DSN`, `VITE_APP_VERSION`.

### Estado medido em 2026-11-08 (`mcp__Vercel__filter_project_envs`) — 2 problemas abertos

1. **A chave que o código lê não está configurada.** Existem `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` (production+preview), mas **não** existe `VITE_SUPABASE_PUBLISHABLE_KEY` —
   que é a variável que `src/integrations/supabase/client.ts:6` consome. `VITE_SUPABASE_ANON_KEY` não é
   lida por nenhum arquivo de `src/`. Se o bundle de produção está funcionando, é por algum caminho que
   não está no projeto do Vercel. **NÃO VERIFICADO** em produção: o `ssoProtection` impede baixar o
   bundle para conferir. Confirmar isso é pré-requisito de qualquer diagnóstico de "não carrega/401".
2. **Segredos de servidor presentes**, vindos da integração Supabase (`configurationId icfg_l6F3…`),
   todos em `production`: `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`,
   `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DATABASE`, `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_JWT_SECRET`,
   `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. As `NEXT_PUBLIC_*` são
   resíduo de template Next.js — este projeto é Vite. Remoção é **decisão do dono** (quebra a integração
   se algo depender dela): não apague por conta própria.

Outras vars existentes (production+preview), sem leitor em `src/`: `VITE_BITRIX_WEBHOOK_URL`,
`VITE_APP_NAME`, `VITE_APP_ENV`, `VITE_ENABLE_ANALYTICS`, `VITE_ENABLE_DEBUG` — vêm do `.env.example`,
que está desatualizado em relação ao código.
