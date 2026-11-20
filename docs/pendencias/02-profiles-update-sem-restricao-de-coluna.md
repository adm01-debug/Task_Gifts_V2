# Pendencias — policy profiles UPDATE sem restricao de coluna (economia)

Estado: **AGUARDANDO HUMANO** (DDL em banco de producao = regra 8)

## Causa
A policy `Users can update own profile` (`supabase/migrations/20260906120000_posvalidacao_fixes.sql`) e `FOR UPDATE TO authenticated USING/WITH CHECK (auth.uid()=id)` sem lista de colunas. Qualquer autenticado pode alterar xp/coins/level do proprio perfil, burlando a economia (autoconcessao de pontuacao/recompensa).

## Impacto no negocio
Usuario consegue inflar a propria pontuacao, coins e nivel, distorcendo rankings, compras na loja, campanhas e metas. A economia do programa perde credibilidade.

## Acao necessaria
Restringir a policy para colunas editaveis pelo proprio usuario (ex: avatar_url, nome_display, biografia), movendo a escrita de xp/coins/level para RPC segura com gating de servidor (`security definer`) ou trigger. O front atual grava xp/coins/level direto via client em `profilesService.ts` (addXp/addCoins) — co-existencia temporaria necessaria, sem quebrar features.

## Por que nao feito nesta sessao
E DDL em producao que altera politica de seguranca de objeto existente e exige coordenacao com as features que hoje escrevem economia direto no client (perderiam escrever = regressao). Precisa de migration + alteracao no front para RPC. Regra 8/custo/arquitetura.
