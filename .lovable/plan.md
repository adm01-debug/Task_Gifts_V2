## Contexto verificado

Análise do site da Applause (campanhas de incentivo comercial + marketplace de prêmios + governança) cruzada com o que já existe no projeto:

Já temos (confirmado em código):
- `sales_campaigns` com `split_rule`, metas global/individual, ranking e participantes (`src/services/salesCampaignsService.ts`).
- Loja de recompensas com promoções e histórico (`src/services/shopService.ts`, `src/pages/Shop.tsx`, `ShopAdmin.tsx`).
- Feed social, notificações multi-canal (in-app/push/e-mail), quizzes, missões, trilhas, webhooks com HMAC.

Lacunas reais frente à Applause (nenhuma existe hoje no código lido):
1. **Ingestão de resultados de vendas** — o progresso das campanhas não tem entrada em massa; a Applause vende "upload de planilha + integrações (Salesforce/HubSpot/Mtrix)".
2. **Metas coletivas por equipe** — hoje só existe meta global e individual; falta meta por equipe/loja com rateio.
3. **Governança de resgate** — resgates não têm fluxo de aprovação, justificativa, rastreabilidade nem análise por IA ("aprovação com IA", "compliance automático").

## Plano — executar um item de cada vez

### Item 1 — Motor de ingestão de resultados (planilha + API)
- Migração: tabela `campaign_result_imports` (arquivo, autor, status, linhas ok/erro, resumo) e `campaign_result_rows` (identificador do vendedor, valor, data, `dedupe_key` único) com GRANTs + RLS restrita a admin/gestor.
- `dedupe_key` único por (campanha, vendedor, referência externa) garante **idempotência**: reenviar a mesma planilha não duplica progresso.
- Parser CSV/XLSX no cliente com validação Zod linha a linha; pré-visualização com erros antes de confirmar.
- RPC `apply_campaign_import` (SECURITY DEFINER, transacional) que aplica as linhas válidas em `campaign_participants.progress`, recalcula `progress_global`, ranking e dispara notificações de marco.
- UI: `CampaignImportDialog` em `SalesCampaignDetail` com upload, mapeamento de colunas, preview, relatório de erros e reversão do lote.

### Item 2 — Metas coletivas por equipe
- Migração: `campaign_teams` e `campaign_team_members`, com meta por equipe e agregação automática.
- Ranking de equipes ao lado do ranking individual, com pódio e barra de progresso coletivo.
- Regra de rateio de prêmio coletivo estendendo `split_rule` (novo tipo `team_split`).

### Item 3 — Governança de resgate + análise por IA
- Migração: `shop_purchases.approval_status` (`pending|approved|rejected|auto_approved`), `approved_by`, `approval_reason`, `risk_score`, `risk_flags` + tabela de trilha de auditoria imutável.
- Edge Function `reward-approval-review`: avalia cada resgate (valor atípico, velocidade de acúmulo, histórico, saldo) e retorna score + justificativa via Lovable AI; auto-aprova abaixo do limiar, encaminha o resto para revisão humana.
- Fila de aprovação em `ShopAdmin` com motivo obrigatório na rejeição e devolução automática das moedas.
- Painel de compliance: exportação CSV auditável de todos os resgates com quem aprovou, quando e por quê.

### Item 4 — Validação
- Suítes de simulação combinatória: `campaignImport.simulation.test.ts` (planilhas hostis, encoding, duplicatas, valores negativos, colunas faltantes) e `rewardApproval.simulation.test.ts` (limiares, saldo insuficiente, corridas de aprovação dupla).
- Verificação de RLS por papel para as novas tabelas.

## Detalhes técnicos

- Todas as tabelas novas em `public` recebem `GRANT` explícito + RLS antes de qualquer policy; leitura anônima não é concedida em nenhuma delas.
- A aplicação do lote roda em RPC transacional para evitar progresso parcial em caso de falha no meio da planilha.
- Parsing pesado fica no cliente (import dinâmico da lib) para não inflar o bundle inicial; o servidor revalida os dados recebidos.
- Nenhum valor monetário/de moeda é escrito direto pelo cliente — sempre via RPC `SECURITY DEFINER` com verificação de papel.

## Fora de escopo (a confirmar depois)
Conectores nativos Salesforce/HubSpot — o webhook genérico com HMAC já existente cobre a entrada por API; conectores dedicados seriam uma fase própria.
