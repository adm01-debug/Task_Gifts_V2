# Regras de domínio que o código não deixa óbvio — referência para agentes

Ler quando mexer em resgate/loja, apostas (Pergunta do Dia), ligas, push/e-mail, integração Bitrix24
ou qualquer tela que dependa de edge function.

## O que "existe" aqui pode não estar ligado

Este repo tem feature completa e inalcançável em produção. Antes de afirmar que algo funciona,
percorra o caminho inteiro: rota em `src/App.tsx` → entrada na UI → hook/service → edge na allowlist e
deployada → tabela existente com RLS. Casos já confirmados:

- **Bitrix24 é código órfão.** As três edges existem (`bitrix24-oauth`, `bitrix24-api`,
  `bitrix24-webhook`), mas **não há nenhum chamador em `src/`** (grep por `bitrix24-`: zero) e
  **não existe rota `/bitrix24`** — e `src/components/MobileDrawer.tsx:53` linka justamente para ela
  ("CRM Bitrix24"). Link morto no menu mobile. Qualquer tarefa de Bitrix24 começa por decidir a rota,
  não por mexer na edge.
- **Allowlist/kill-switch de edge.** `VITE_DEPLOYED_EDGE_FUNCTIONS` e
  `localStorage["edge-skills:disabled"]` desligam chamadas **sem nenhum sinal** — nem request, nem log.
  Detalhe em `docs/agentes/edge-functions.md`.
- **`verify_jwt` liga/desliga endpoint externo** (`supabase/config.toml`): só `migrate-helper` está
  aberto. Webhook assinado por HMAC ou `x-api-key` nunca chega ao handler.

## Resgate de recompensa — governança com dupla aprovação

`src/services/purchaseGovernanceService.ts`:

- Todo resgate tem **trilha auditável** em `purchase_approvals` (ações: `first_approval`, segunda
  aprovação, rejeição) — o histórico é lido do mais recente ao mais antigo.
- A análise de risco (`RiskAnalysisResult`) devolve `score`, `level`, `factors`,
  `recommendation` (`approve | review | reject`), `requires_dual_approval` e `ai_available`.
- `requires_dual_approval` é decidido pela análise, **não** pela UI: quando ele é verdadeiro, a primeira
  aprovação deixa o resgate em `awaiting_second_approval` e **não libera nada**. Tela que trata
  "aprovado" como terminal depois da primeira aprovação está errada.
- A análise roda na edge **`reward-approval-review`**. Com `ai_available: false` o fluxo continua sem a
  parte de IA — não transforme isso em erro de tela.

## Pergunta do Dia (wager) — orçamento é espelho do banco

`src/services/wagerBudgetService.ts`: configuração única com `monthlyCoinBudget` (padrão **20.000**) e
`expectedPlayers` (padrão **30**). `clampBudget`/`clampPlayers` existem para **espelhar os CHECK
constraints do banco** (teto 10.000.000 e 100.000, piso 0, inteiro).

**Mudar o limite = mudar os dois juntos:** o `CHECK` na migration e o clamp no service. Mexer só no
front deixa o banco rejeitando silenciosamente; mexer só no banco deixa o front truncando valor válido.
Há ainda revisão de integridade separada (`wagerIntegrityReviewService.ts`,
`wagerIntegrityReviewEventService.ts`) — não misture orçamento com integridade.

## Fila de notificação

Push e e-mail são **assíncronos por fila** (`push_outbox` / `email_outbox`) consumidos por edge
(`push-outbox-dispatcher`, `send-email-notifications`, `send-email-digest`, `send-campaign-push`).
Consequências:

- "enviei a notificação" no front = **inseri na fila**, nada mais. A prova de entrega é a linha da fila
  mudando de estado, não o toast.
- Se a fila só cresce, o problema é o consumidor (deploy, JWT, secret `VAPID_*`/`RESEND_API_KEY`), não o
  produtor. Esse já foi o caso: a auditoria de 2026-08 mediu `push_outbox` acumulando com zero entregas.
- `push-public-key` serve a chave VAPID pública; `push-device-revoked` trata dispositivo revogado.
  Mexer em chave VAPID invalida as subscriptions existentes — é operação com o dono.

## Processamento semanal / cron

`weekly-league-processing`, `survey-reminders`, `checkin-reminders`, `birthday-celebrations`,
`competency-alerts`, `burn-rate-monitor`, `error-budget-monitor` e os `cleanup-*` rodam por agenda
(`pg_cron` + `pg_net`), não por ação de usuário. Os jobs estão **definidos em migrations com URL e chave
fixas no SQL** (ver `banco.md`): trocar domínio ou chave exige migration nova, e um job pode estar
falhando há meses sem que nada apareça na UI. Diagnóstico de "a liga não virou" começa em
`cron.job_run_details`, não no front.

## UI

- Tema dark/light vem do `next-themes` com decorator espelhado em `.storybook/preview.ts` — use token do
  `tailwind.config.ts`/`src/index.css`, nunca cor literal, senão quebra num dos temas.
- `src/integrations/supabase/types.ts` é **gerado**: coluna nova no banco só aparece no tipo depois de
  regerar. Não edite à mão para "resolver" erro de tipo.
- Renomear rótulo ≠ renomear rota: rota é contrato com link externo, favorito e PWA shortcut
  (`vite.config.ts` declara shortcuts no manifest). Mudou caminho → trate o antigo com redirect.
