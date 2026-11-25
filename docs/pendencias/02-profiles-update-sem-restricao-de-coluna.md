# Pendencias — policy profiles UPDATE sem restricao de coluna (economia)

Estado: **CONCLUIDO — migration aplicada em producao e verificada no banco real** (PR #78 mergeada). Resta 1 risco residual documentado abaixo (exige decisao de arquitetura, regra 8).

## Causa
A policy `Users can update own profile` (`supabase/migrations/20260906120000_posvalidacao_fixes.sql`) e `FOR UPDATE TO authenticated USING/WITH CHECK (auth.uid()=id)` sem lista de colunas. Qualquer autenticado pode alterar xp/coins/level do proprio perfil, burlando a economia (autoconcessao de pontuacao/recompensa).

## Impacto no negocio
Usuario consegue inflar a propria pontuacao, coins e nivel, distorcendo rankings, compras na loja, campanhas e metas. A economia do programa perde credibilidade.

## Acao necessaria
Restringir a policy para colunas editaveis pelo proprio usuario (ex: avatar_url, nome_display, biografia), movendo a escrita de xp/coins/level para RPC segura com gating de servidor (`security definer`) ou trigger. O front atual grava xp/coins/level direto via client em `profilesService.ts` (addXp/addCoins) — co-existencia temporaria necessaria, sem quebrar features.

## Por que nao feito nesta sessao
E DDL em producao que altera politica de seguranca de objeto existente e exige coordenacao com as features que hoje escrevem economia direto no client (perderiam escrever = regressao). Precisa de migration + alteracao no front para RPC. Regra 8/custo/arquitetura.

## Solucao implementada
- Migration `supabase/migrations/20261218000000_profiles_economia_rpcs.sql`: 5 RPCs `SECURITY DEFINER` (`add_xp`, `add_coins`, `spend_coins`, `increment_streak`, `increment_quests_completed`) com `REVOKE ALL FROM PUBLIC, anon` + `GRANT EXECUTE TO authenticated`; `REVOKE UPDATE (xp, coins, level, streak, best_streak, quests_completed, last_access_at) ON public.profiles FROM authenticated`; `GRANT UPDATE` allowlist (`display_name, avatar_url, birth_date, hire_date`) + `GRANT SELECT` allowlist mantido.
- Front migrado: `profilesService` (addXp/addCoins/incrementStreak/incrementQuestsCompleted), `avatarService.purchaseItem` e `shopService.purchaseReward` (spend_coins via RPC), `achievementsService.unlockAchievement` e `seasonalEventsService.claimReward` (add_xp/add_coins via RPC), `onboardingService.claimReward` (add_xp + add_coins via RPC). UPDATE client permanece so para colunas seguras (display_name, avatar_url, birth_date, hire_date).
- Testes: `profiles.test.ts` (5) e `achievements.test.ts` (2) com mock de `rpc`; guard anon das 5 RPCs em `src/test/rpcAccess.test.ts`.
- Migration NAO aplicada em banco real ainda.

## Validacao local (desta sessao)
- typecheck (app + node): EXIT=0; eslint nos arquivos tocados: 0 erros (apenas warnings de `no-explicit-any` via `as any` nas chamadas RPC e `no-useless-assignment` pre-existente em seasonalEventsService:138).
- Suite completa vitest: **141 passed | 2 skipped (1888 tests pass)**.
- `achievements.test.ts` atualizado: trocou mock de `update` por `rpc` (`add_xp`/`add_coins`), usando `vi.hoisted`.
- Migration NAO aplicada em banco real ainda — requer OK (regra 8) antes do merge/apply.

## Verificacao em producao (2026-11-23, main `046ebeb`, projeto `eidsaqymojyuhprobfpn`)

Consulta direta ao banco (MCP Supabase) — evidencia real, nao inferida:

| Checagem | Resultado |
|---|---|
| RPCs `add_xp`, `add_coins`, `spend_coins`, `increment_streak`, `increment_quests_completed` | **existem** (5/5 em `pg_proc`) |
| Grants de UPDATE em `authenticated` | apenas `avatar_url`, `birth_date`, `display_name`, `hire_date` (4 colunas) — `xp/coins/level/streak/best_streak/quests_completed/last_access_at` **revogados** |
| `anon` | ainda tem UPDATE em todas as colunas, **porem sem policy de UPDATE** → RLS (`relrowsecurity=true`) bloqueia; nao exploravel |
| Policies em `profiles` | INSERT/SELECT/UPDATE apenas para `authenticated`; UPDATE com `USING/WITH CHECK (auth.uid()=id)` |
| Assinaturas das RPCs vs chamadas do front | identicas (`p_user_id`, `p_amount`, `p_source`); 10 call sites conferidos |
| Escrita de economia direto no client | **zero** ocorrencias de `.from('profiles').update({xp|coins|level|streak|...})` |
| Gates das RPCs (corpo das funcoes) | `add_coins`/`spend_coins`/`add_xp` exigem `auth.uid() = p_user_id`; `add_xp` tambem aceita autor de `kudos` (destinatario) — comportamento intencional |

Conclusao: a via de autoconcessao por `UPDATE` direto esta fechada em producao e nenhuma feature ficou sem conseguir escrever economia.

## Risco residual (nao e regressao introduzida; e o proximo passo de arquitetura)

As RPCs sao `SECURITY DEFINER` e aceitam `p_amount` arbitrario. Como `auth.uid() = p_user_id` e valido para o proprio usuario, um usuario com o console aberto ainda pode chamar `rpc('add_xp', {p_user_id: <ele mesmo>, p_amount: 999999})` e inflar a propria pontuacao — a origem do ganho nao e verificada no servidor.

Fechar isso exige o premio ser calculado no servidor (edge function com `service_role`, ou trigger sobre o evento que gera o ganho) e as RPCs de escrita passarem a `service_role`-only. E mudanca de arquitetura da economia + toca todas as features que hoje premiam no client → **regra 8** (decisao do dono).


## Leitura de PII fechada (2026-11-25, PR `fix: profiles SELECT por allowlist`)

A pendencia acima tratava da **escrita**. Na mesma tabela havia um furo de **leitura**, medido no banco real:

| Checagem (probe com usuario descartavel, `authenticated`) | Antes | Depois |
|---|---|---|
| `has_table_privilege('authenticated','public.profiles','SELECT')` | `true` (todas as 21 colunas) | `false` |
| `has_column_privilege(...,'cpf','SELECT')` | `true` | `false` |
| `GET /rest/v1/profiles?select=id,display_name,cpf,personal_email,phone,employee_id,contract_type&id=eq.<outro usuario>` | **200** com CPF, e-mail pessoal, telefone, matricula e tipo de contrato de OUTRO colaborador | **403** `42501 permission denied` |
| `GET /rest/v1/profiles?select=*` | 200 | **403** |
| `GET /rest/v1/profiles?select=id,display_name,avatar_url,xp,coins` (leaderboards, duels, rankings) | 200 | 200 |
| `GET /rest/v1/profiles_public` (view do front) | 200 | 200 |
| `POST /rest/v1/rpc/get_my_profile_private` (proprios dados) | 200 | 200 |
| `POST /rest/v1/rpc/admin_profile_directory` (nao-admin) | — | 403 `insufficient_privilege` |
| `PATCH /rest/v1/profiles` em `display_name` / em `coins` / em `cpf` | 204 / 403 / 403 | 204 / 403 / 403 |
| `anon` em `public.profiles` (SELECT/UPDATE/DELETE) | `true` (RLS negava linhas) | `false` (defesa em profundidade) |

Causa: a migration `20260728184034` ja revogava `SELECT`, e `20261218000000:214` tinha allowlist de colunas, mas o estado vivo era um `GRANT` de tabela (concede todas as colunas) — o allowlist nao surtia efeito e `cpf`/`personal_email`/`phone`/`employee_id`/`contract_type` eram legiveis por qualquer usuario logado. O ledger conter a versao nao prova que o SQL rodou; o reparo foi feito a partir da medicao de `has_*_privilege`.

Aplicado por `20261226200000_profiles_select_colunas_sensiveis.sql`: `REVOKE SELECT` de tabela em `authenticated`, `REVOKE ALL` em `anon` e `GRANT SELECT` no allowlist de `PROFILE_SAFE_COLUMNS`. Front ajustado onde o `select` nao era explicito: `profilesService.update` (`select(PROFILE_SAFE_COLUMNS)`) e `engagementReportsService` (`select("id", { head: true })`).
