# Pendencias — policy profiles UPDATE sem restricao de coluna (economia)

Estado: **IMPLEMENTADO — PR aberta** (DDL em banco de producao = regra 8; precisa aplicar migration + merge apos OK)

## Causa
A policy `Users can update own profile` (`supabase/migrations/20260906120000_posvalidacao_fixes.sql`) e `FOR UPDATE TO authenticated USING/WITH CHECK (auth.uid()=id)` sem lista de colunas. Qualquer autenticado pode alterar xp/coins/level do proprio perfil, burlando a economia (autoconcessao de pontuacao/recompensa).

## Impacto no negocio
Usuario consegue inflar a propria pontuacao, coins e nivel, distorcendo rankings, compras na loja, campanhas e metas. A economia do programa perde credibilidade.

## Acao necessaria
Restringir a policy para colunas editaveis pelo proprio usuario (ex: avatar_url, nome_display, biografia), movendo a escrita de xp/coins/level para RPC segura com gating de servidor (`security definer`) ou trigger. O front atual grava xp/coins/level direto via client em `profilesService.ts` (addXp/addCoins) — co-existencia temporaria necessaria, sem quebrar features.

## Por que nao feito nesta sessao
E DDL em producao que altera politica de seguranca de objeto existente e exige coordenacao com as features que hoje escrevem economia direto no client (perderiam escrever = regressao). Precisa de migration + alteracao no front para RPC. Regra 8/custo/arquitetura.

## Solucao implementada
- Migration `supabase/migrations/20261218000000_profiles_economia_rpcs.sql`: 5 RPCs `SECURITY DEFINER` (`add_xp`, `add_coins`, `spend_coins`, `increment_streak`, `increment_quests_completed`) com `REVOKE ALL FROM PUBLIC, anon` + `GRANT EXECUTE TO authenticated`; `REVOKE UPDATE (xp, coins, level, streak, best_streak, quests_completed, last_access_at) ON public.profiles FROM authenticated`; `GRANT SELECT` allowlist mantido.
- Front migrado: `profilesService` (addXp/addCoins/incrementStreak/incrementQuestsCompleted), `avatarService.purchaseItem` e `shopService.purchaseReward` (spend_coins via RPC), `onboardingService.claimReward` (add_xp + add_coins via RPC). UPDATE client permanece so para colunas seguras (display_name, avatar_url, birth_date, hire_date).
- Testes: `profiles.test.ts` (5) e `shop.test.ts` (3) reescritos com mock de `rpc`; guard anon das 5 RPCs adicionado a `src/test/rpcAccess.test.ts`.
- Validacao local: typecheck (app+node) EXIT=0, eslint 0 erros, suíte completa 1888 passed | 17 skipped. Migration nao aplicada em banco real ainda.
