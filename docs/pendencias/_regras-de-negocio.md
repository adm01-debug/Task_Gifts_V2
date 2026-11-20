# Regras de negocio observaveis no codigo (nao-exaustivas)

Economia (xp/coins/level) e escrita direta no client hoje (`src/services/profilesService.ts`: addXp/addCoins). Restringir a policy de profiles sem migrar essas escritas para RPC quebraria: ranking, loja, campanhas, level — regressao. A restricao de coluna so pode entrar junto com a migracao das escritas para RPC segura.

HIBP (senha vazada) e uma etapa de seguranca em cadastro/reset; se o fetch falhar por bloqueio de rede, o fluxo atual deve presumir comportamento seguro (nao travar cadastro). Validado que a correcao de CSP e add-only.

Navegacao segue 3 fontes: AppSidebar (desktop), MobileDrawer (mobile), GlobalBreadcrumbs (traco). Toda rota com pagina propria deve ter entrada; toda entrada deve apontar para rota existente.
