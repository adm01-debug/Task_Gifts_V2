# Linha de base — Task Gifts V2

Data: 2026-11-26 · Main: `b30f52b` (`chore: CI roda testes de seguranca RPC com env real (#69)`) · Zero PRs abertas de outros agentes ao iniciar (apenas as 2 criadas neste goal: #71, #72).

## Gates de qualidade no main b30f52b (evidência real executada nesta sessão)

| Gate | Resultado | Comando |
|---|---|---|
| Instala deps | OK (ranhura 1046 pkgs) | `bun install --frozen-lockfile` |
| typecheck | exit 0 | `bun run typecheck` |
| testes | 1886 pass / 12 skip (64.61% stmts, 141/143 files) exit 0 | `bun run test:ci` |
| lint | 0 errors / 328 warnings exit 0 | `bun run lint` |
| build | exit 1 (guard #61: VITE_SUPABASE_URL/PUBLISHABLE_KEY ausentes no env local; envs sao secrets do CI) | `bun run build` |
| build:dev | exit 0 (PWA 166 entries) | `bun run build:dev` |
| CI main | success (overrun de runner documentado na org, nao falha de codigo) | gh run list |
| Deploy edge main | success (run 44638269317) | gh run list |

## Achados da auditoria (ESTADO_ATUAL.md / docs/estado/09-validacao-e-errata.md) — revalidados neste main

| # | Achado | Status no main b30f52b | Evidência |
|---|---|---|---|
| 0 | `.mcp.json` versionado com token de acesso total ao Supabase | **PERSISTE** | `git ls-files .mcp.json` → presente; URL com hex32 |
| 1 | policy `profiles` UPDATE sem restrição de coluna (economia/autoconcessão) | **PERSISTE** | `20260906120000` `USING/WITH CHECK (auth.uid()=id)`, sem colunas |
| 2 | CSP bloqueia pwnedpasswords (HIBP) | **CORRIGIDO (PR #71)** | vercel.json connect-src + allowlist |
| 3 | Rotas sem nav `/previsoes /chefao /pergunta-do-dia`; rota-fantasma `/bitrix24` | **CORRIGIDO (PR #72)** | AppSidebar/MobileDrawer/Breadcrumbs |
| 4 | 3 lockfiles + sem `packageManager` | Parcial (bun.lock + package-lock.json presentes; sem packageManager) | glob lock* |
| 5 | CSP meta removida (cabeçalho em vercel.json) | OK (não é bug) | index.html sem CSP meta; vercel.json com headers |

## Estrutura de pendências (este diretório)
Um arquivo por item pendente real (estado CONCLUÍDO/AGUARDANDO HUMANO/DESCARTADO). Os itens #2/#3 foram resolvidos via PR; os demais aguardam decisão (DDL/infra = regra 8).

## Revalidação em produção — 2026-11-23 (main `046ebeb`)

Estado de cada achado conferido no banco/API reais, não inferido do código:

| # | Achado | Estado verificado | Evidência |
|---|---|---|---|
| 0 | `.mcp.json` versionado com token | **PERSISTE — AGUARDANDO HUMANO** | `git ls-files .mcp.json` presente; rotação externa (regra 8) |
| 1 | Economia de `profiles` manipulável | **CONCLUÍDO** | RPCs em `pg_proc`; `authenticated` só edita `avatar_url/birth_date/display_name/hire_date`; zero `.from('profiles').update({xp|coins|level})` no client |
| 2 | CSP bloqueia HIBP | **CONCLUÍDO** (PR #71 mergeada) | `vercel.json` connect-src |
| 3 | Rotas sem entrada na nav | **CONCLUÍDO** (PR #72 mergeada) | AppSidebar/MobileDrawer/Breadcrumbs |
| 4 | Lockfiles triplos | **CONCLUÍDO** | main tem só `bun.lock` + `deno.lock`; `package-lock.json` npm órfão foi removido |
| 5 | CSP meta | OK (não é bug) | headers em `vercel.json` |

**CVEs**: 0 alertas Dependabot abertos e SBOM do GitHub lendo 115 pacotes do `bun.lock` real → os 50 CVEs (1 crítica, 24 altas) vinham do `package-lock.json` npm órfão, já removido. Nenhum CVE real no lockfile efetivo.

**Risco residual aberto**: RPCs de economia aceitam `p_amount` arbitrário do próprio usuário (ver `02-...md`, seção "Risco residual") — exige cálculo server-side do prêmio, mudança de arquitetura (regra 8).

