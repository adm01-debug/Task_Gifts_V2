# Pendencias — rotas validas sem entrada na navegacao + rota-fantasma

Estado: **CONCLUIDO** via PR #72

## Causa
Rotas com pagina propria registradas no `App.tsx` sem entrada em AppSidebar/MobileDrawer/GlobalBreadcrumbs: `/previsoes` (PredictionMarketsPage), `/chefao` (BossBattlePage), `/pergunta-do-dia` (DailyWagerPage) — funcionalidades existentes, inacessiveis pelo menu. Em paralelo, entrada "CRM Bitrix24" apontava para `/bitrix24`, sem rota/pagina (404) — rota-fantasma.

## Correcao
- Adicionadas entradas `/previsoes`, `/chefao`, `/pergunta-do-dia` em AppSidebar, MobileDrawer e GlobalBreadcrumbs (padrao de nav do projeto).
- Removida entrada `/bitrix24` e o import Link2 remanescente.
- typecheck exit 0.

## Evidence
PR https://github.com/adm01-debug/Task_Gifts_V2/pull/72 (em CI). 
