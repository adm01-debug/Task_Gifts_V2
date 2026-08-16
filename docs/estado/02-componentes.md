# Dimensão 2 — Componentes

> Documento de detalhe da auditoria de estado — 461 arquivos em src/components.
> Evidência em `arquivo:linha`. Correções da Fase D estão em `ESTADO_ATUAL.md` e em `04-dados-e-runtime.md`.
> Runtime de build/teste = `NAO_VERIFICADO` (node_modules ausente no ambiente da auditoria).

---

## Raiz A

# Auditoria — Lote comproot-A (40 componentes raiz de `src/components`, 9.099 linhas)

Método: leitura integral dos 40 arquivos + grep de importadores em todo `src` (incl. lazy/import()/string).
Todas as linhas citadas foram verificadas. Nenhum arquivo foi editado.

## Tabela

| Componente | Classificação | Consumidores (arquivo:linha) | Origem dos dados | Evidência | O que falta |
|---|---|---|---|---|---|
| AICoachDialog | 🟨 PARCIAL | `src/components/MobileDrawer.tsx:7,256`; `src/components/dashboard/DashboardHeader.tsx:11,204` | `useAICoach` → `fetch` p/ edge fn `ai-coach` (`src/hooks/useAICoach.ts:15,52`) + `usePublishedTrails`, `useCurrentProfile` | Chat real. Mas `copiedIndex`/`handleCopyMessage` (:85,137), `handleRetryMessage` (:148), `isExpanded` (:86), `activeTab` (:87) e imports `Tabs*`/`Badge`/`aiCoachMessageSchema` (:9,10,17) aparecem **1x cada** = declarados e nunca renderizados/usados | Botões copiar/retry/expandir/abas nunca são montados; `aiCoachMessageSchema` importado mas nenhuma validação client-side é executada |
| AchievementSystem | 🟨 PARCIAL | `src/contexts/AchievementNotificationContext.tsx:2`; `src/pages/Index.tsx:10,141` | Props (`achievements[]`) — o Provider é alimentado por `useAchievements.ts:40`, `useBehavioralBadges.ts:37`, `useProfiles.ts:100` | Caminho real = Provider (`Providers.tsx:48`). Já o `useAchievements()` local em `Index.tsx:59` só desestrutura `achievements/hideAchievement/levelUp/closeLevelUp` — **`showAchievement`/`triggerLevelUp` desse hook não são chamados em lugar nenhum do repo** (grep: só a definição em `AchievementSystem.tsx:293,301`) | O `<AchievementContainer>` de `Index.tsx:141` é duplicata permanentemente vazia (state local nunca escrito). Remover ou ligar |
| ActivityComments | ✅ TOTAL | `src/components/SocialFeed.tsx:12,168` | `useActivityComments/useAddComment/useDeleteComment` (:9) | CRUD completo com optimistic delete (:43-48) e auth guard (:35) | — |
| ActivityHeatmap | 🟨 PARCIAL | `src/components/dashboard/DashboardRightColumn.tsx:13,113` | **MOCK**: `useActivityHeatmapData()` (`ActivityHeatmap.tsx:281-303`) — comentário literal `// Hook to generate mock data for demo purposes`, `Math.random()` nas linhas 290 e 293 | `DashboardRightColumn.tsx:13` importa o hook de mock e :113 passa para `<ActivityHeatmap data={activityData} />` no dashboard de produção | Substituir por query real; corrigir bug de precedência em `:99` `if (map.get(k) \|\| 0 > 0)` (avalia `0>0` primeiro) |
| ActivityReactions | ✅ TOTAL | `src/components/SocialFeed.tsx:13,161` | `useToggleReaction` (:6) + `AVAILABLE_REACTIONS` de `activityReactionsService` (:8) | Mutation real, guard de user (:22) | — |
| AnalyticsWidget | 🟨 PARCIAL | `src/components/dashboard/DashboardRightColumn.tsx:10,165` | `useLeaderboard(50)` (:28) — métricas derivadas de profiles | Header diz "Dados em tempo real" (:116) mas é um snapshot de leaderboard. Os `change` são strings-placeholder: `"+ativo"`, `"+acumulado"`, `"${totalUsers} total"` (:58-61) e `positive:true` fixo em 2 dos 4 (:58,61) → seta ↑ sempre verde | Deltas reais (comparação temporal); hoje não existe série histórica |
| AnnouncementsBoard | ✅ TOTAL | `src/components/dashboard/DashboardLeftColumn.tsx:10,81`; `src/pages/Announcements.tsx:2,18` | `useAnnouncements` (:13) — create/markAsRead/react | Todos os handlers ligados (:40-46, :63, :99) + EmptyState (:221) | — |
| AppSidebar | ✅ TOTAL | `src/pages/Index.tsx:6,154`; `src/pages/PersonalStats.tsx:8` | Array estático de navegação (:14-86) — legítimo (config de rotas) | Delega a `SidebarNavGroup/UserStats/Logo/Footer` (:11) | Badge fixo `badge: 2` em "Loja" (:83) é hardcoded |
| AttendanceCalendar | ✅ TOTAL | `src/pages/Attendance.tsx:12,139` | Props `records: AttendanceRecord[]` (:32) | Cálculo real de status/estatísticas (:48-95, :152-166) | — |
| AttendanceModule | 🟨 PARCIAL | `src/components/dashboard/DashboardRightColumn.tsx:6,130` | 6 hooks Supabase: `useAttendanceSettings/useUserStreak/useTodayAttendance/useRecentAttendance/useStreakLeaderboard/useProfiles` (:18-27) | Check-in/out reais (:174,192). Porém `const now = new Date()` (:45) e `currentTime` (:46) são calculados **no render sem `setInterval`** → o relógio de 5xl exibido em :122 fica congelado | Timer de 1s; a tolerância `isWithinTolerance` (:57) também nunca reavalia |
| AutoChallengesWidget | ✅ TOTAL | `src/components/dashboard/DashboardLeftColumn.tsx:11,58` | `useAutoChallenges()` (:18,36) | Progresso, stats e expiração vindos do hook (:64-66,100,115) | — |
| AvatarCustomizer | ✅ TOTAL | `src/components/ProfileAvatarSection.tsx:5,323` | `useAvatarItems/useAvatarConfig/useUnlockItem/usePurchaseItem/useUpdateAvatarConfig` (:10-16) | Equipar/comprar/desbloquear reais (:90-108) | — |
| AvatarPreview | ✅ TOTAL | `src/components/ProfileAvatarSection.tsx:4,133`; `src/pages/Profile.tsx:11,164` | `useAvatarItems/useAvatarConfig` (:3) | Composição real de background/frame/accessory/effect/badge (:57-61) | — |
| BehavioralBadgesWidget | ✅ TOTAL | `src/pages/Achievements.tsx:9,191` | `useBehavioralBadges` + `useUserAchievements` (:1,2) | `triggerCheck` ligado ao botão (:131); catálogo `badgesByCategory` vem do hook (:113) | Cores hex fixas `bg-[#0A0C10]` (:98,116) fogem dos tokens de tema |
| CampaignNotificationPreferences | ✅ TOTAL | `src/pages/Profile.tsx:21,234` | `useTypePreferences` (:8,56) → RPCs `user_wants_*_notification` | Matriz 5 tipos × 3 canais, todos os Switch ligados a `setCell` (:108); `priorityFor` é consumido em `useTypePreferences.ts:185` | — |
| CelebrationEffect | ✅ TOTAL | `src/components/AchievementSystem.tsx:7,62`; `src/pages/Shop.tsx:5,67` | Props `isActive/type` — `Math.random()` é para posição de partículas (:36,43), uso legítimo | Cleanup do timer correto (:75-82) | — |
| CelebrationsBanner | 🟨 PARCIAL | `src/components/dashboard/DashboardLeftColumn.tsx:8,35` | `useCelebrations()` → `todayCelebrations` (:21) | Dados reais. Mas o dismiss (:65) grava só em `useState<Set>` (:22) | Dismiss não persiste — banner reaparece a cada reload/navegação |
| CertificationsPanel | ✅ TOTAL | `src/pages/Profile.tsx:15,222` | `useUserCertifications/useCertifications/useExpiring/useExpired/useRenewCertification` (:11-17) | Renovação real (:214-219); compliance calculado (:227-231) | Botão "Agendar Renovação" (:149) dispara a mesma mutation de "Renovar Agora" — o texto promete agendamento que não existe |
| ChurnPredictionPanel | ✅ TOTAL | `src/pages/ManagerDashboard.tsx:20,126` | `useChurnPrediction()` (:28) → `churnPredictionService` | Predições, summary, error e refetch todos ligados (:219,223-227) | — |
| ComboHistory | ✅ TOTAL | `src/components/dashboard/DashboardRightColumn.tsx:4,104`; `src/pages/PersonalStats.tsx:13,148` | `useComboHistory(7)` (:20) | Preenche dias faltantes com 1.0x explicitamente (:38-63) — não é fake, é default documentado | — |
| ComboIndicator | ✅ TOTAL | `src/components/dashboard/DashboardRightColumn.tsx:3,96`; `src/components/dashboard/DashboardHeader.tsx:14,122` | `useTodayCombo()` + `comboService` (:7,8) | Callback de tier-up registrado/limpo (:26-29) | — |
| CommandPalette | 🟨 PARCIAL | `src/App.tsx:12,322` | Array estático de comandos (:104-146) + `useAuth`/`useTheme` | **2 comandos mortos**: `:137` `querySelector('[data-search-trigger]')?.click()` e `:138` `'[data-notifications-trigger]'` — grep no repo: esses atributos existem em **0 lugares fora dessas 2 linhas** → `?.click()` é no-op silencioso | Adicionar os `data-*` nos gatilhos reais ou remover os 2 itens de menu |
| CompetencyRadar | ✅ TOTAL | `src/pages/Profile.tsx:14,221` | `useCompetencies(targetUserId)` (:32,154) | Toggle radar/barras funcional (:214); gaps/strengths derivados (:176,177) | — |
| ConfirmDialog | 🟨 PARCIAL | `src/components/trails/TrailModuleEditor.tsx:24,365`; `src/pages/Duels.tsx:8,72` | Props puras | O componente é usado. Mas `useConfirm` (:121-157) tem **0 consumidores** (grep: única ocorrência é a própria definição) | Código morto: hook `useConfirm` + a Promise/`resolver` que nunca resolvem para ninguém |
| DailyQuests | 🟨 PARCIAL | `src/components/dashboard/DashboardLeftColumn.tsx:4` (via `DailyQuestsLazy`, export em `:238-239`) | `useAllMissions` + `useClaimMissionReward` (:5) | Missões e claim reais. Mas o rodapé `:230` exibe **`ACTIVE_OPS_STREAK: 7D` hardcoded** e `:232` `V4.0_DELTA` fixo | Ligar o streak ao dado real do perfil |
| DepartmentMissions | ✅ TOTAL | `src/components/dashboard/DashboardLeftColumn.tsx:3` (via `DepartmentMissionsLazy`, `:263-264`) | `useDepartmentMissions(deptId)` + `useDepartments` + `useClaimMissionReward` (:16,17) | Filtro por departamento realmente re-consulta (:120-122); claim real (:127-138) | Rodapé `SYSTEM_OPERATIONAL`/`V4.0.0_STABLE` (:255,257) é decorativo/fixo |
| DepartmentRankings | 🟨 PARCIAL | `src/components/dashboard/DashboardRightColumn.tsx:7,138` | `useDepartments` + `useProfiles` (:14,15) | Comentário literal `// Use profiles as ranking data for now` (:162). Score é fórmula inventada: `Math.round(p.xp*0.8 + p.quests_completed*50 + p.streak*10)` (:170). `metrics:{orders:0,rate:0,time:0}` zerado (:172). O `<Select>` de departamento (:249) **não filtra `rankings`** — só troca rótulos de `departmentMetrics`. As Tabs Semanal/Mensal (:263) escrevem `periodType` que **nunca é lido**. `useAllMissions` importado em `:16` e nunca chamado | Ranking por departamento e por período de verdade; os 20 cards de `departmentMetrics` (:27-58) mostram ícone+label sem nenhum valor |
| ENPSSurveyWidget | ✅ TOTAL | `src/components/dashboard/DashboardRightColumn.tsx:15,89` | `useActiveSurveyForUser` + `useSubmitENPSResponse` (:16) | Submit real (:34-45); esconde-se sem survey ativa (:91) | — |
| ErrorBoundary | ✅ TOTAL | `src/components/PageWrapper.tsx:3,24`; `src/components/Providers.tsx:9,39` | N/A (class component) | Loga via `logger.error` (:30) | — |
| ExecutiveReportPreferenceToggle | ✅ TOTAL | `src/pages/Profile.tsx:24,236` | `useTypePreferences` + `useRBAC` (:2,8) | Gate por admin (:37); ambos os Switch ligados (:64,73) | — |
| FlashSalesBanner | 🟨 PARCIAL | `src/pages/Shop.tsx:6,119` | `useActivePromotions()` (:7,204) + `shopService.getDiscountedPrice` (:73) | **Desconto não é aplicado na compra.** `PromotionCard` chama `onPurchase(promotion.reward_id, discountedPrice)` (:184), mas o contrato `FlashSalesBannerProps.onPurchase` é `(rewardId: string) => void` (:200) e `Shop.tsx:119` faz `rewards?.find(r => r.id === rewardId)` e compra pelo preço cheio | Propagar `discountedPrice` até o `handlePurchase` |
| FloatingActionButton | ✅ TOTAL | `src/pages/Duels.tsx:10,73` | Props `actions[]` | Só renderiza em mobile (:51); handlers e aria completos (:42,130-131) | — |
| GameNotificationPreferences | ✅ TOTAL | `src/pages/Profile.tsx:23,235` | `useTypePreferences` (:8,86) | 7 tipos × 3 canais, todos ligados a `setCell` (:134) | — |
| GlobalErrorBoundary | 🟨 PARCIAL | `src/App.tsx:23,309` | N/A | `onReset` é **callback vazio** com comentário `// Opcional: registrar o erro em algum serviço de telemetria` (:73-75) — diferente do `ErrorBoundary` irmão, que loga em `:30` | Sem telemetria: erros no boundary de topo não chegam ao `logger` |
| GlobalMessageProvider | ✅ TOTAL | `src/components/Providers.tsx:14,42`; `src/hooks/useAuth.tsx:6` | Context próprio | `Math.random()` (:31) é geração de id, uso legítimo; expõe `window.__GLOBAL_MESSAGE_SYSTEM__` (:41) consumido fora de hooks | — |
| GlobalSearch | 🟨 PARCIAL | `src/components/MobileDrawer.tsx:8,236`; `src/components/dashboard/DashboardHeader.tsx:12,200` | `usePublishedTrails/useQuests/useProfiles/useDepartments` + `useFuseSearch` (:11-16) | Busca real. Mas `quickActions` aponta para rotas inexistentes: `"/shop"` (:123) e `"/achievements"` (:124) — `App.tsx` registra `/loja` (:239) e `/conquistas` (:237); o mesmo mapa errado se repete em `actionRoutes` (:80) → cai em `path="*" → NotFound` (`App.tsx:301`). Além disso `case "quest"` navega para `/manager` (:72,83), ignorando o id |
| GoalsWidget | ✅ TOTAL | `src/components/dashboard/DashboardLeftColumn.tsx:7,88` | `useGoals()` (:11,31) | Criação real (:48-57); mescla metas pessoais + empresa (:59) | Lista limitada a 5 (`:206`) sem link "ver todas" |
| HelpTooltip | ✅ TOTAL | `src/components/StatsGrid.tsx:15,214` | Props + dicionário estático `helpTexts` (:48-59) — legítimo (copy de UI) | Acessível (focus ring, `type="button"`) (:27-34) | — |
| InAppNotificationToggle | ✅ TOTAL | `src/pages/Profile.tsx:22,233` | `supabase.from("notification_preferences")` select (:28-32) e upsert (:49-51) | Rollback otimista em falha (:57) | — |
| IpAccessGuard | 🟦 SUGERIDO/INERTE | `src/components/Providers.tsx:10,45` | `invokeEdgeSafe('verify-ip')` (:38) — **mas nunca é alcançado** | `:29` `if (!isFunctionDeployed("verify-ip")) { setIsAllowed(true); return; }`. `edgeAvailability.ts:49-51`: allowlist vazia ⇒ `return false` para tudo. E `.env:25` é literalmente `VITE_DEPLOYED_EDGE_FUNCTIONS=` (vazio) ⇒ **o guard sempre libera sem verificar IP**. Import `supabase` (:6) nunca usado | Popular a allowlist e deployar `verify-ip`; hoje toda a UI de "Acesso Negado" (:95-144) é inalcançável |

## Achados graves

1. **`IpAccessGuard` é um no-op de segurança em produção.** `IpAccessGuard.tsx:29` curto-circuita em `isFunctionDeployed("verify-ip")`; `src/lib/edgeAvailability.ts:49-51` retorna `false` quando a allowlist está vazia; `.env:25` contém `VITE_DEPLOYED_EDGE_FUNCTIONS=` sem valor. Resultado: `setIsAllowed(true)` para todo mundo, `verify-ip` nunca é chamada, e todo o bloco de "Acesso Negado" (`:95-144`) é código inalcançável. O controle de IP existe na UI mas não existe na prática. Agrava: mesmo se a função fosse chamada, todos os caminhos de erro fazem *fail open* (`:47`, `:58`).

2. **Desconto de Flash Sale exibido mas não cobrado.** `FlashSalesBanner.tsx:184` envia `(reward_id, discountedPrice)`, o tipo em `:200` só aceita `(rewardId)`, e `src/pages/Shop.tsx:119` refaz o lookup e compra pelo `price_coins` cheio. O usuário vê "🪙 {discountedPrice}" e "Economize N!" (`:146,157`) e é debitado o valor original — divergência financeira visível ao usuário.

3. **Dado falso (`Math.random()`) alimentando o dashboard de produção.** `ActivityHeatmap.tsx:281-303` é um gerador de mock declarado como tal no comentário `// Hook to generate mock data for demo purposes`, com `Math.random()` em `:290` e `:293`. `DashboardRightColumn.tsx:13` importa esse hook e `:113` o injeta no heatmap anual mostrado a todos os usuários. O "streak" e "atividades em N dias" exibidos são inventados a cada render.

4. **`DepartmentRankings` não ranqueia por departamento nem por período.** Comentário `// Use profiles as ranking data for now` (`:162`); score é a fórmula arbitrária de `:170`; o `<Select>` de departamento (`:249`) só troca rótulos decorativos e o `periodType` das Tabs (`:263`) nunca é lido por nenhuma query. Os 20 KPIs de `departmentMetrics` (`:27-58`) renderizam ícone + label **sem nenhum valor** (`:279-287`). O componente aparenta ser um painel departamental e é, na prática, o leaderboard global de XP com dois controles decorativos.

5. **Rotas quebradas e comandos mortos na navegação.** `GlobalSearch.tsx:80,123,124` navega para `/shop` e `/achievements`, que não existem em `App.tsx` (as rotas reais são `/loja:239` e `/conquistas:237`) → o usuário cai em `NotFound` (`App.tsx:301`). E `CommandPalette.tsx:137,138` dispara `querySelector('[data-search-trigger]')`/`('[data-notifications-trigger]')`, atributos com **zero ocorrências** no repositório — dois itens de menu que não fazem nada.

Menores, mas reais:
- `Index.tsx:141` monta um segundo `<AchievementContainer>` alimentado por `useAchievements()` local (`:59`) cujo `showAchievement`/`triggerLevelUp` nunca são chamados em lugar nenhum — UI permanentemente vazia duplicando o Provider de `Providers.tsx:48`.
- **Dois sistemas de Level Up coexistem**: `AchievementSystem.tsx:200` (`LevelUpCelebration`, renderizado em `:372` via o container morto do `Index`) e `src/components/ui/level-up-celebration.tsx:21` (renderizado por `src/contexts/GamificationContext.tsx:130`). Só o segundo está no caminho vivo.
- `AttendanceModule.tsx:45-46,122`: relógio grande sem `setInterval`, congela no timestamp do render.
- `DailyQuests.tsx:230`: `ACTIVE_OPS_STREAK: 7D` hardcoded fingindo métrica.
- `GlobalErrorBoundary.tsx:73-75`: `onReset` vazio, sem telemetria (o `ErrorBoundary` irmão loga em `:30`).
- `ConfirmDialog.tsx:121-157`: hook `useConfirm` exportado com 0 consumidores.
- `AICoachDialog.tsx`: copiar/retry/expandir/abas e `aiCoachMessageSchema` declarados e nunca usados (cada símbolo aparece 1x no arquivo).
- `CelebrationsBanner.tsx:22,65`: dismiss só em state local, reaparece a cada reload.
- `ActivityHeatmap.tsx:99`: bug de precedência `map.get(k) || 0 > 0` (avalia `0 > 0` antes do `||`).

## Componentes órfãos (⬛)

**Nenhum.** Os 40 componentes têm pelo menos um importador fora do próprio arquivo, verificado por grep em todo `src` (`.ts`/`.tsx`), incluindo os dois casos de re-export/lazy: `DailyQuests` é consumido como `DailyQuestsLazy` (`DailyQuests.tsx:238` → `dashboard/DashboardLeftColumn.tsx:4`) e `DepartmentMissions` como `DepartmentMissionsLazy` (`DepartmentMissions.tsx:263` → `dashboard/DashboardLeftColumn.tsx:3`).

Exports mortos **dentro** de arquivos vivos (não tornam o arquivo órfão, mas são código morto):
- `useConfirm` — `src/components/ConfirmDialog.tsx:121` — 0 consumidores.
- `SkeletonAchievementSystem` — `src/components/AchievementSystem.tsx:313` — 0 consumidores.
- `useActivityHeatmapData` — `src/components/ActivityHeatmap.tsx:281` — 1 consumidor, mas é gerador de mock em produção (ver Achado 3).

---

## Raiz B + navegação/social

# Auditoria de estado — Lote comproot-B

Escopo: 41 componentes na raiz de `src/components` (lista `lotes/comproot-B.txt`) + diretórios
`navigation/`, `sidebar/`, `theme/`, `search/`, `profile/`, `social/`, `notifications/`.

**63 arquivos lidos integralmente** (10.891 linhas). Todos os caminhos abaixo são relativos a
`/home/user/task-gifts-v2/`.

Método de "consumidores": `grep -rn "<Nome>" src` em todo o repo, descontando o próprio arquivo e
barrels. Verificado `lazy()` / `import()` dinâmico antes de declarar morto (`grep -rn "lazy(\|import("`
não retornou nenhum dos órfãos listados).

## Contagem

| Classificação | Qtd |
|---|---|
| ✅ IMPLEMENTADO_TOTAL | 42 |
| 🟨 IMPLEMENTADO_PARCIAL | 15 |
| 🟦 SUGERIDO_OU_INICIADO | 0 |
| ⬛ MORTO_OU_ABANDONADO | 6 |

---

## Tabela

| Componente | Classificação | Consumidores | Origem dos dados | Evidência arquivo:linha | O que falta |
|---|---|---|---|---|---|
| KeyboardShortcutsHelp | ✅ | `src/App.tsx:6`, `src/App.tsx:321` | hook `useKeyboardShortcuts` | `src/components/KeyboardShortcutsHelp.tsx:13` | — |
| KudosRanking | ✅ | `src/components/dashboard/DashboardRightColumn.tsx:9,156` | hooks `useRecentKudos(100)`, `useKudosBadges`, `useProfiles` | `src/components/KudosRanking.tsx:27-29` | Ranking "mensal" derivado de janela fixa de 100 kudos (`KudosRanking.tsx:27` + filtro `:32-35`) — subconta em times ativos |
| LanguageSelector | ✅ | `src/components/sidebar/SidebarFooter.tsx:5,26` | hook `useI18n` | `src/components/LanguageSelector.tsx:28` | — |
| LeagueCard | 🟨 | `src/components/dashboard/DashboardRightColumn.tsx:12,68`; `src/pages/Leagues.tsx:7,68` | hook `useLeagues` (leagues/myLeague/leaderboard) | `src/components/LeagueCard.tsx:22` | Contador de reset do ciclo é **texto fixo** `Cycle reset in 3D 14H` — `LeagueCard.tsx:173`; nada calcula essa data |
| LiveLeaderboard | 🟨 | `src/components/dashboard/DashboardRightColumn.tsx:8,147` | hook `useLeaderboard(10)` + `useAuth` | `src/components/LiveLeaderboard.tsx:29-30` | `trend` (↑/↓/=) não é tendência real: heurística sobre streak/quests — `LiveLeaderboard.tsx:33-37`. Badge "Realtime"/"ACTIVE" é decoração estática — `:169-183` |
| MobileDrawer | 🟨 | `src/components/MobileHeader.tsx:5,97`; `src/pages/Index.tsx:7,149` | `useCurrentProfile`, `useAuth` | `src/components/MobileDrawer.tsx:64-65` | Badges numéricos **hardcoded** fingindo contagem real: `badge: 3` em Quests (`:44`) e `badge: 2` em Loja (`:47`). Fórmula de XP não trata nível 1 (`:76` `xpForLevel(1)=100` ⇒ XP negativo), divergindo de `sidebar/SidebarUserStats.tsx:37-40` que corrige |
| MobileHeader | 🟨 | `src/components/navigation/PageShell.tsx:6,85` | props + `useIsMobile` | `src/components/MobileHeader.tsx:26` | Ponto vermelho de notificação é **estático**, sempre visível, sem ligação com `unreadCount` — `MobileHeader.tsx:89`. Botão rotulado "Notificações" navega para `/profile` — `:84-86` |
| MobilePullToRefresh | ⬛ | **0 importadores** | hook `usePullToRefresh` | `src/components/MobilePullToRefresh.tsx:14`; `grep -rn "MobilePullToRefresh" src` → só o próprio arquivo | Substituído por `src/components/mobile/PullToRefresh`, usado em `navigation/PageShell.tsx:11,143` |
| MoodTrackerWidget | ✅ | `src/components/dashboard/DashboardRightColumn.tsx:14,82` | hook `useMoodTracker` + `services/moodTrackerService` | `src/components/MoodTrackerWidget.tsx:12` | — |
| MyDevelopmentPlanWidget | ✅ | `src/pages/Profile.tsx:28,225` | `useMyDevelopmentPlans`, `useDevelopmentPlan`, `useUpdatePlanAction` | `src/components/MyDevelopmentPlanWidget.tsx:44`, `:122-123` | — |
| MyNineBoxWidget | ✅ | `src/pages/Profile.tsx:27,224` | `useLatestNineBoxEvaluation(user.id)` | `src/components/MyNineBoxWidget.tsx:41` | — |
| NotificationCenter | ✅ | `src/components/dashboard/DashboardHeader.tsx:13,123,202` | `useNotifications` + mutations (mark/delete/clear) | `src/components/NotificationCenter.tsx:171-175` | — |
| OfflineIndicator | ⬛ | **0 usos em JSX** — importado sem ser renderizado | hook `useOnlineStatus` | import em `src/App.tsx:7`; `grep -rn "OfflineIndicator" src` retorna **apenas** essa linha, nenhum `<OfflineIndicator />` | Banner offline nunca aparece; o import é dead code |
| PWAInstallPrompt | ✅ | `src/App.tsx:8`, renderizado em `src/App.tsx:199` | hook `usePWAInstall` + localStorage | `src/components/PWAInstallPrompt.tsx:14`, `:22-23` | — |
| PageTransition (raiz) | ⬛ | **0 importadores** | `useLocation`, `useIsMobile`, `useReducedMotion` | `src/components/PageTransition.tsx:71`; `grep -rn '"@/components/PageTransition"' src` → nada. Todo o app usa `src/components/navigation/PageTransition.tsx` (`src/App.tsx:4`, `navigation/PageShell.tsx:7`) | Arquivo duplicado de 146 linhas, mais completo (reduced-motion, variantes mobile/desktop, focus mgmt `:91-100`) que o que está em uso |
| PageWrapper | ✅ | `src/pages/Duels.tsx:11`, `AdminTelemetria.tsx:18`, `Attendance.tsx:5`, `PersonalStats.tsx:15`, `Announcements.tsx:3`, `Surveys.tsx:3`, `Achievements.tsx:10` | props + `usePerformanceTrack` | `src/components/PageWrapper.tsx:21` | `SectionWrapper` (`:44`) é usado só em `src/pages/Index.tsx:14,180-207` |
| PasswordStrengthIndicator | ✅ | `src/components/auth/AuthFormContent.tsx:6,183`; `src/pages/ResetPassword.tsx:16,277` | `lib/authValidations` (`getPasswordStrength`, `checkPasswordLeaked` — HIBP) | `src/components/PasswordStrengthIndicator.tsx:51,65` | — |
| PeerRecognition | 🟨 | `src/components/dashboard/DashboardLeftColumn.tsx:5,100` (via `PeerRecognitionLazy`) | `useKudosBadges`, `useRecentKudos`, `useGiveKudos`, `useProfiles`, `useFuseSearch` | `src/components/PeerRecognition.tsx:26-28`, `:96-97` | `import { Card... }` colocado **no fim do arquivo**, depois do uso — `PeerRecognition.tsx:133`. UI reduzida a `<input>` cru sem label/nome de badge (`:74-79`); imports mortos (`Send`, `Sparkles`, `X`, `AlertCircle`, `DialogHeader`, `DialogTitle`, `motion`, `AnimatePresence`) em `:1-6` |
| ProfileAvatarSection | ✅ | `src/pages/Profile.tsx:12,218` | hook `useAvatarItems(userId, level, streak)` | `src/components/ProfileAvatarSection.tsx:34` | — |
| ProfileKudosSection | ✅ | `src/pages/Profile.tsx:13,223` | `useKudosReceived`, `useKudosBadges`, `useKudosCount`, `useProfiles` | `src/components/ProfileKudosSection.tsx:22-25` | — |
| Providers | ✅ | `src/App.tsx:20,308,333` | composição de providers | `src/components/Providers.tsx:37-67` | — |
| PulseSurveyWidget | ✅ | `src/components/dashboard/DashboardLeftColumn.tsx:9,91`; `src/pages/Surveys.tsx:2,23` | hook `usePulseSurveys` | `src/components/PulseSurveyWidget.tsx:17` | — |
| PushNotificationHistory | ✅ | `src/pages/Profile.tsx:18,232` | hook `usePushHistory` + `services/pushHistoryService` | `src/components/PushNotificationHistory.tsx:41` | — |
| PushNotificationToggle | ✅ | `src/pages/Profile.tsx:17,229` | `usePushSubscription`, `usePushDevice` | `src/components/PushNotificationToggle.tsx:22,80` | — |
| RankingBadge | ✅ | `src/components/dashboard/DashboardHeader.tsx:15,252`; `src/pages/Profile.tsx:10,165`; `src/hooks/useUserRank.ts:4` (`getRankTier`) | props (`rank`) | `src/components/RankingBadge.tsx:89-96,116` | Export `RankingBadgeInline` (`:281`) tem **0 consumidores** |
| RewardsShop | ✅ | `src/components/dashboard/DashboardRightColumn.tsx:11,174` | `useShopRewards`, `useCurrentProfile` | `src/components/RewardsShop.tsx:51-52` | — |
| SEOHead | ✅ | 9 páginas (`LuckyWheelPage.tsx:11`, `Duels.tsx:13`, `Shop.tsx:18`, `ScratchCardPage.tsx:9`, `BoardTrailPage.tsx:11`, `LearningTrails.tsx:6`, `DepartmentWarPage.tsx:23`, `SocialFeed.tsx:46`, `SequenceProcedureAdminPage.tsx:28`, `Attendance.tsx:6`) | props + constantes | `src/components/SEOHead.tsx:44,62-138` | Os 5 helpers JSON-LD (`createOrganizationSchema` `:146`, `createBreadcrumbSchema` `:158`, `createArticleSchema` `:168`, `createFAQSchema` `:189`, `createProductSchema` `:201`) têm **0 consumidores** |
| SeasonalEventBanner | 🟨 | `src/pages/Index.tsx:12,174` | hook `useActiveSeasonalEvents` | `src/components/SeasonalEventBanner.tsx:13` | Texto `LEGENDARY DROPS DETECTED` é fixo e sempre exibido, sem qualquer verificação de recompensas do evento — `SeasonalEventBanner.tsx:116-119` |
| SectionErrorBoundary | ✅ | `src/components/bi/BITrainingTab.tsx:4`, `BIOKRsTab.tsx:6`, `BIOverviewTab.tsx:7`, `BIDepartmentsTab.tsx:6`, `src/pages/Profile.tsx`, `ManagerDashboard.tsx:128`, `PageWrapper.tsx:2` | props; log via `services/loggingService` | `src/components/SectionErrorBoundary.tsx:31-35` | HOC `withSectionErrorBoundary` (`:81`) com **0 consumidores** |
| SocialFeed (componente) | ✅ | `src/components/dashboard/DashboardLeftColumn.tsx:2,75` | `useSocialFeed`, `useCommentsCounts`, `useActivityReactions` | `src/components/SocialFeed.tsx:29,33-34` | — |
| SoundSettingsCard | ✅ | `src/pages/Profile.tsx:16,228` | `useSoundSettings` (context) + `useSoundEffects` | `src/components/SoundSettingsCard.tsx:22-32` | — |
| StaggeredContainer | 🟨 | `src/components/dashboard/DashboardLeftColumn.tsx:12,23`; `DashboardRightColumn.tsx:16,34` (só `StaggeredContainer` + `StaggeredItemLeft/Right`) | puro apresentacional | `src/components/StaggeredContainer.tsx:48,153,167` | `StaggeredItem` (`:77`) e `StaggeredGrid` (`:92`) exportados com **0 consumidores** |
| StatsGrid | ✅ | `src/pages/Index.tsx:9,183` (+ `QuickActions`) | `useCurrentProfile`, `useUserRank`, `useFirstTimeIndicator` | `src/components/StatsGrid.tsx:242-244` | `import` de Card no meio do arquivo (`:100`) |
| TeamCertificationsPanel | ✅ | `src/pages/ManagerDashboard.tsx:27,128` | `useTeamCertificationStatus`, `useMandatoryCertifications` | `src/components/TeamCertificationsPanel.tsx:11-12` | — |
| TeamChallenges | 🟨 | `src/components/dashboard/DashboardLeftColumn.tsx:6,105` (via `TeamChallengesLazy`) | hook `useActiveDuels` | `src/components/TeamChallenges.tsx:16` | Nome mente sobre o conteúdo: renderiza **Duelos 1v1**, não desafios de equipe (`:27,42`). Convive com outro `TeamChallenges` em `src/components/ui/team-challenges.tsx:97`, renderizado no **mesmo** arquivo em `DashboardLeftColumn.tsx:19,113`. Imports mortos: `AnimatePresence`, `useState`, `useCallback`, `cn`, `Clock`, `Zap`, `ChevronRight`, `Flame`, `Plus`, `differenceInHours/Minutes` (`:1-11`) |
| ThemeToggle | ✅ | `src/components/MobileDrawer.tsx:6,275`; `src/components/dashboard/DashboardHeader.tsx:10,201` | hook `useTheme` | `src/components/ThemeToggle.tsx:12` | — |
| TrailDependencyTree | 🟨 | `src/pages/LearningTrails.tsx:21,241` | `usePublishedTrails`, `useUserEnrollments`, `useTrailPrerequisites` | `src/components/TrailDependencyTree.tsx:288-290` | `stats.standalone` é calculado (`:322-324`) e **nunca renderizado** (badges em `:458-467` não o usam). `TreeContent` montado 2× simultaneamente (dialog `:449` + card `:472`), duplicando a árvore em memória |
| TrailRecommendations | ✅ | `src/pages/LearningTrails.tsx:20,145` | edge function `trail-recommendations` via `invokeEdgeSafe` | `src/components/TrailRecommendations.tsx:54-57` | — |
| UndoToast | 🟨 | `src/pages/Duels.tsx:9` importa `showUndoToast` | `sonner` | `src/components/UndoToast.tsx:24` | Objeto `undoToasts` com 4 helpers (`:55-79`) tem **0 consumidores** |
| WeeklyChallengeCard | ✅ | `src/components/dashboard/DashboardRightColumn.tsx:2,75` | `useWeeklyChallenge`, `useAuth` | `src/components/WeeklyChallengeCard.tsx:16` | Barra de 5 pontos com 3 acesos é decorativa fixa (`:311-313`) |
| WeeklyPerformanceComparison | ✅ | `src/components/dashboard/DashboardRightColumn.tsx:5,122`; `src/pages/PersonalStats.tsx:12,149` | **`supabase.from`** direto: `audit_logs`, `kudos`, `user_combos`, `attendance_records` | `src/components/WeeklyPerformanceComparison.tsx:28,42,53,63,73,84` | — |
| navigation/index.ts | ✅ | `src/pages/AdminTelemetria.tsx:19`, `ExecutiveDashboard.tsx:22`, `SeasonalEventDetail.tsx:15`, `QuizAdmin.tsx:25`, `Feedback.tsx:12`, `ManagerDashboard.tsx:29`, `LuckyWheelPage.tsx:10`, `Duels.tsx:15`, `Shop.tsx:17`, `AuditLogs.tsx:7`, `ScratchCardPage.tsx:8`, `BoardTrailPage.tsx:10`, `LearningTrails.tsx:23` | barrel | `src/components/navigation/index.ts:1-6` | Reexporta `useCurrentRoute`, `routeConfig`, `groupLabels` (`:1`) que ninguém consome |
| navigation/TopLoadingBar | 🟨 | `src/App.tsx:1,319`; `navigation/PageShell.tsx:8,83` | **nenhuma** — timers locais | `src/components/navigation/TopLoadingBar.tsx:14-48` | Progresso **falso**: sobe por `setInterval` de 150 ms (`:30-38`) e "completa" por `setTimeout(300ms)` (`:42`) sem qualquer relação com carregamento real. O próprio código admite: `// This should ideally be triggered by actual content loading` — `:40-41`. Renderizado 2× em telas com PageShell (App `:319` + PageShell `:83`) |
| navigation/DesktopBackButton | ✅ | `navigation/PageShell.tsx:5,96` + 6 páginas | `useSmartBack`, `useHapticFeedback` | `src/components/navigation/DesktopBackButton.tsx:27-28` | — |
| navigation/PageTransition | ✅ | `src/App.tsx:4` (todas as rotas, `:218-...`); `navigation/PageShell.tsx:7,141` | `useLocation` | `src/components/navigation/PageTransition.tsx:13-15` | Sem tratamento de `prefers-reduced-motion` (existe na versão órfã da raiz) |
| navigation/PageShell | 🟨 | 13 páginas (`LuckyWheelPage.tsx:87`, `Duels.tsx:68`, `Shop.tsx:61`, `AuditLogs.tsx:47`, `ScratchCardPage.tsx:73`, `BoardTrailPage.tsx:91`, `LearningTrails.tsx`, …) | props + `useQueryClient`, `useHapticFeedback`, `useScrollRestoration` | `src/components/navigation/PageShell.tsx:61-79` | Badge fixo `Protocolo de Treinamento Elite` renderizado em **toda** página desktop, sem relação com o conteúdo — `PageShell.tsx:122-127` |
| navigation/GlobalBreadcrumbs | 🟨 | `navigation/PageShell.tsx:4,99`; `src/pages/Feedback.tsx:12` | **mapa hardcoded** de 40 rotas | `src/components/navigation/GlobalBreadcrumbs.tsx:45-96` | `routeConfig` é uma segunda fonte de verdade paralela às rotas de `src/App.tsx:218-...`; rota inexistente cai no fallback de segmento cru (`:182-195`). `useCurrentRoute` (`:261`), `routeConfig` e `groupLabels` (`:277`) exportados sem consumidor |
| navigation/MobileBackButton | ✅ | `navigation/index.ts:3`; `src/components/MobileHeader.tsx:6,54` | `useSmartBack`, `useHapticFeedback` | `src/components/navigation/MobileBackButton.tsx:22-23` | — |
| sidebar/index.ts | ✅ | `src/components/AppSidebar.tsx:11` | barrel | `src/components/sidebar/index.ts:1-4` | — |
| sidebar/SidebarLogo | ✅ | `src/components/AppSidebar.tsx:11,106` | hook `useOrganization` (name/tagline/logo_url) | `src/components/sidebar/SidebarLogo.tsx:11-14` | — |
| sidebar/SidebarFooter | ✅ | `src/components/AppSidebar.tsx:11,126` | navegação | `src/components/sidebar/SidebarFooter.tsx:14-15` | — |
| sidebar/SidebarNavGroup | ✅ | `src/components/AppSidebar.tsx:11,114` | props (`items`, `badge`) | `src/components/sidebar/SidebarNavGroup.tsx:22-28` | — |
| sidebar/SidebarUserStats | 🟨 | `src/components/AppSidebar.tsx:11,109` | hook `useCurrentProfile` | `src/components/sidebar/SidebarUserStats.tsx:14` | Bug de estado: `setPrevXP` só executa no ramo em que o XP **não** mudou — `SidebarUserStats.tsx:26-33`. Após o primeiro ganho de XP, `prevXP` congela e todo `+X XP` mostrado passa a ser o delta acumulado desde aquele ponto |
| theme/ThemeInjector | ✅ | `src/components/Providers.tsx:16,51` | hook `useOrganization` (cores, favicon, name) | `src/components/theme/ThemeInjector.tsx:15,19-32` | — |
| search/SearchFilters | ✅ | `src/components/GlobalSearch.tsx:18,171`; `search/SearchResultsList.tsx:14` | props | `src/components/search/SearchFilters.tsx:59-70` | Atalhos `kbd` 1–4 são rótulos visuais (`:101-103`); o handler real vive em `GlobalSearch.tsx` |
| search/SearchResultsList | ✅ | `src/components/GlobalSearch.tsx:19,184` | props (resultados Fuse) | `src/components/search/SearchResultsList.tsx:64-78` | — |
| search/searchUtils | ✅ | `src/components/GlobalSearch.tsx:21-23,53,68,78,129` | `localStorage` (`global-search-history`) | `src/components/search/searchUtils.ts:9,12-38` | — |
| profile/ProfileAchievements | ✅ | `src/pages/Profile.tsx:30,220` | `useAllAchievements`, `useUserAchievements` | `src/components/profile/ProfileAchievements.tsx:38-39` | Exibe só as 18 primeiras conquistas (`:90`) enquanto o contador usa o total (`:61`) |
| profile/ProfileActivityTimeline | 🟨 | `src/pages/Profile.tsx:29,226` | hook `useRecentAuditLogs(10)` | `src/components/profile/ProfileActivityTimeline.tsx:32-33` | Filtro quebrado: busca os **10 logs mais recentes globais** e só depois filtra por `log.user_id === userId` (`:33`). `src/hooks/useAudit.ts:35-39` não recebe filtro de usuário e o `queryKey` (`auditKeys.recent()`) ignora o `limit`. Resultado: a timeline fica vazia para quase todo usuário. Botão "Expandir Log Completo" **sem onClick** — `:168-174` |
| social/ActivityItem | ⬛ | **0 importadores** (as ocorrências em `analytics/AnalyticsBottomSection.tsx:7` e `analytics/ActivityByTypeCard.tsx:5` são uma `interface` homônima, não este componente) | props | `src/components/social/ActivityItem.tsx:27` | Além de órfão, tem 2 botões sem handler: comentar (`:76`) e destaque (`:77`) |
| social/FeedFilters | ⬛ | **0 importadores**; `grep -rn "components/social" src` → nenhum resultado | props | `src/components/social/FeedFilters.tsx:42` | `src/pages/SocialFeed.tsx` **reimplementa** `activityTypeConfig` (`:55`) e `periodConfig` (`:66`) inline em vez de importar daqui |
| social/FeedStatsBar | ⬛ | **0 importadores** | props (`stats`) | `src/components/social/FeedStatsBar.tsx:22` | — |
| notifications/BulkChannelActions | ✅ | `src/components/CampaignNotificationPreferences.tsx:6,83`; `src/components/GameNotificationPreferences.tsx:6,112` | props | `src/components/notifications/BulkChannelActions.tsx:23-27` | — |

---

## Achados graves

1. **`OfflineIndicator` é importado mas nunca renderizado** — `src/App.tsx:7` traz o componente e
   `grep -rn "OfflineIndicator" src` não encontra nenhum `<OfflineIndicator />` em lugar nenhum do
   repo. Todo o fluxo de banner offline + toasts de reconexão (`src/components/OfflineIndicator.tsx:21-34`,
   `:36-48`) está morto em produção. O usuário nunca é avisado de que perdeu conexão por este
   componente.

2. **`profile/ProfileActivityTimeline` mostra a timeline errada (quase sempre vazia)** — o componente
   recebe `userId` mas consome `useRecentAuditLogs(10)`, que busca os 10 logs **globais** mais recentes
   (`src/hooks/useAudit.ts:35-39`, sem filtro de usuário), e só então filtra em memória por
   `log.user_id === userId` (`src/components/profile/ProfileActivityTimeline.tsx:33`). Em qualquer base
   com mais de um usuário ativo o resultado é a tela de "Sem registros detectados" (`:88-102`). Agrava:
   o `queryKey` `auditKeys.recent()` não inclui o `limit`, então o cache colide com outros consumidores
   do mesmo hook. Botão "Expandir Log Completo" (`:168-174`) é um noop sem `onClick`.

3. **`navigation/TopLoadingBar` é uma barra de progresso falsa, renderizada em duplicidade** — o
   progresso vem de `setInterval` de 150 ms (`src/components/navigation/TopLoadingBar.tsx:30-38`) e o
   "concluído" de um `setTimeout(300)` fixo (`:42`), sem qualquer vínculo com fetch, Suspense ou
   react-query. O comentário em `:40-41` assume isso explicitamente. Além disso é montada duas vezes em
   toda página que usa PageShell: `src/App.tsx:319` e `src/components/navigation/PageShell.tsx:83`.

4. **Diretório `src/components/social/` inteiro é órfão, com lógica duplicada na página que deveria
   consumi-lo** — `ActivityItem.tsx`, `FeedFilters.tsx` e `FeedStatsBar.tsx` somam 243 linhas e
   `grep -rn "components/social" src` não retorna **nenhum** import. Pior: `src/pages/SocialFeed.tsx`
   redeclara `activityTypeConfig` (`:55`) e `periodConfig` (`:66`) — exatamente os mapas exportados em
   `src/components/social/FeedFilters.tsx:13,24`. A refatoração foi extraída e nunca conectada.

5. **Dados fabricados apresentados como reais na UI** —
   - `src/components/MobileDrawer.tsx:44` (`badge: 3` em "Quests") e `:47` (`badge: 2` em "Loja"):
     contadores fixos no array de navegação, indistinguíveis de badges reais para o usuário.
   - `src/components/MobileHeader.tsx:89`: ponto de notificação não lida sempre aceso, sem ligação com
     `unreadCount`; e o botão "Notificações" leva para `/profile` (`:84`).
   - `src/components/LeagueCard.tsx:173`: "Cycle reset in **3D 14H**" como texto literal.
   - `src/components/SeasonalEventBanner.tsx:118`: "LEGENDARY DROPS DETECTED" sempre exibido.
   - `src/components/navigation/PageShell.tsx:122-127`: selo "Protocolo de Treinamento Elite" em todas
     as páginas desktop.

### Achados secundários relevantes

- **`src/components/PageTransition.tsx` (146 linhas) órfão e mais completo que o substituto em uso.**
  A versão viva (`src/components/navigation/PageTransition.tsx`, 36 linhas) não trata
  `prefers-reduced-motion` nem variantes mobile — recursos que existem no arquivo morto (`:47-52`,
  `:71-88`) e foram perdidos.
- **Dois componentes distintos chamados `TeamChallenges` renderizados lado a lado** em
  `src/components/dashboard/DashboardLeftColumn.tsx:105` (`@/components/TeamChallenges`, que na verdade
  lista Duelos 1v1) e `:113` (`@/components/ui/team-challenges`).
- **Divergência no cálculo de XP por nível**: `src/components/MobileDrawer.tsx:76` produz XP negativo no
  nível 1; `src/components/sidebar/SidebarUserStats.tsx:37-40` corrige o mesmo cálculo. Duas fórmulas
  duplicadas, uma errada.
- **`SidebarUserStats` congela `prevXP`** (`:26-33`) — `setPrevXP` só roda no ramo em que o XP não mudou.
- **`GlobalBreadcrumbs.routeConfig`** (`:45-96`) é um mapa manual de 40 rotas paralelo às rotas reais de
  `src/App.tsx`, sujeito a drift silencioso.
- **`TrailDependencyTree` monta a árvore duas vezes** (dialog `:449` + card `:472`) e calcula
  `stats.standalone` (`:322-324`) que nunca é exibido.
- **Exports públicos sem nenhum consumidor** (código morto dentro de arquivos vivos):
  `RankingBadgeInline` (`RankingBadge.tsx:281`), `StaggeredItem`/`StaggeredGrid`
  (`StaggeredContainer.tsx:77,92`), `undoToasts` (`UndoToast.tsx:55`), `withSectionErrorBoundary`
  (`SectionErrorBoundary.tsx:81`), `useCurrentRoute`/`routeConfig`/`groupLabels`
  (`GlobalBreadcrumbs.tsx:261,277`) e os 5 helpers JSON-LD de `SEOHead.tsx:146,158,168,189,201`.
- **`PeerRecognition.tsx:133`**: declaração `import` no fim do arquivo, após todo o uso.

---

## Componentes órfãos (⬛)

| Arquivo | Linhas | Evidência de 0 importadores | Observação |
|---|---|---|---|
| `src/components/MobilePullToRefresh.tsx` | 60 | `grep -rn "MobilePullToRefresh" src` → só o próprio arquivo (`:7,14,19`) | Duplicado por `src/components/mobile/PullToRefresh`, usado em `navigation/PageShell.tsx:11,143` |
| `src/components/OfflineIndicator.tsx` | 115 | Único hit fora do arquivo é o import em `src/App.tsx:7`; **nenhum** `<OfflineIndicator />` no repo | Importado sem ser montado — funcionalidade offline inexistente |
| `src/components/PageTransition.tsx` | 146 | `grep -rn '"@/components/PageTransition"' src` → vazio; App e PageShell usam `navigation/PageTransition` | Versão superior (reduced-motion, mobile variants, focus mgmt) abandonada |
| `src/components/social/ActivityItem.tsx` | 89 | `grep -rn "components/social" src` → vazio | Hits de `ActivityItem` em `analytics/*` são `interface` homônima |
| `src/components/social/FeedFilters.tsx` | 114 | idem | Lógica reimplementada inline em `src/pages/SocialFeed.tsx:55,66` |
| `src/components/social/FeedStatsBar.tsx` | 40 | idem | — |

**Total morto medido: 564 linhas** (6 arquivos), sem contar os exports órfãos dentro de arquivos vivos.
Nenhum `lazy()` ou `import()` dinâmico referencia qualquer um deles
(`grep -rn "lazy(\|import(" src --include=*.ts --include=*.tsx` filtrado por esses nomes → 0 resultados).

---

## Admin e BI

# Auditoria de Estado — Núcleo ADMIN / BI
Repo: `/home/user/task-gifts-v2` · Escopo: `src/components/{admin,shop-admin,rbac,audit,webhooks,bi,executive,analytics}`
Data da medição: 2026-08-16 · Método: leitura direta de arquivo + grep de consumidores + rastreio da origem do dado até tabela/RPC/edge function.

**Arquivos no escopo: 77** (74 `.tsx` + 3 `index.ts`) — todos inspecionados.

Legenda: ✅ IMPLEMENTADO_TOTAL · 🟨 IMPLEMENTADO_PARCIAL · 🟦 SUGERIDO_OU_INICIADO · ⬛ MORTO_OU_ABANDONADO

---

## Tabela de componentes

| Componente | Classificação | Consumidores | Tabelas/RPC | Evidência arquivo:linha | O que falta |
|---|---|---|---|---|---|
| admin/AdminAlertsPanel.tsx | 🟨 | pages/AdminPanel.tsx | edge fn `admin-alerts` | `hooks/useAdminAlerts.ts:17` → `invokeEdgeSafe("admin-alerts")`; bloqueado em `lib/requestId.ts:131` + `lib/edgeAvailability.ts:49` com `.env:25 VITE_DEPLOYED_EDGE_FUNCTIONS=` (vazio) | Painel sempre cai no ramo de erro `admin/AdminAlertsPanel.tsx:46-60`. Requer publicar a função no allowlist |
| admin/AdminChangeHistory.tsx | ✅ | pages/AdminPanel.tsx | `audit_logs` (+ `profiles` via useProfiles) | `admin/AdminChangeHistory.tsx:99-116` | — |
| admin/AdminMetricsDashboard.tsx | ✅ | pages/AdminPanel.tsx | `adminService.getAttendanceStats/getQuizActivity/getTrailEnrollments/getUserSignups`, `profiles`, `departments`, `team_members` | `admin/AdminMetricsDashboard.tsx:17-47`, cálculo real em `:58-112` | — |
| admin/AdminTabsList.tsx | ✅ | pages/AdminPanel.tsx | — (estático, é navegação) | `admin/AdminTabsList.tsx:8-31` | — |
| admin/AnnouncementPublisher.tsx | 🟨 | pages/AdminPanel.tsx | `announcements` via useAnnouncements | criar persiste `:43-63`; `view_count` real `:242` | Botões Editar/Excluir **sem onClick** — `admin/AnnouncementPublisher.tsx:228` e `:231` |
| admin/CelebrationManager.tsx | 🟨 | pages/AdminPanel.tsx | `celebrations` via useCelebrations | `admin/CelebrationManager.tsx:46-52` | XP/Coins do formulário são **descartados** (ver Achados). 3 dos 4 contadores nunca saem de 0 (ver Métricas fictícias) |
| admin/CreateApiKeyDialog.tsx | ✅ | pages/ApiKeysAdmin.tsx | `createApiKey` (apiKeysService) | `admin/CreateApiKeyDialog.tsx:41-59` | — |
| admin/DepartmentsManager.tsx | ✅ | pages/AdminPanel.tsx | `departments`, `team_members` | `admin/DepartmentsManager.tsx:60-90` (mutateAsync + try/catch reais) | — |
| admin/DevelopmentPlanManager.tsx | ✅ | pages/AdminPanel.tsx | `development_plans` | `admin/DevelopmentPlanManager.tsx:38-40`, delete `:146` | — |
| admin/ENPSDashboard.tsx | ✅ | pages/AdminPanel.tsx | `enps_surveys`, `engagement_snapshots`, RPC `generate_engagement_snapshot` | `admin/ENPSDashboard.tsx:64-68`; RPC em `services/enpsService.ts:251` | — |
| admin/ENPSTrendChart.tsx | 🟨 | admin/ENPSDashboard.tsx:215 | `engagement_snapshots` | `admin/ENPSTrendChart.tsx:43-61` | `<SelectItem value="">` em `:111` (Radix rejeita value vazio); ícone `Download` importado `:9` sem botão de export |
| admin/FeedbackCycleManager.tsx | 🟨 | pages/AdminPanel.tsx | `feedback_cycles` via useFeedback360 | criar persiste `:42-49` (`services/feedback360Service.ts:102`) | `questions: []` fixo em `:48` (sem editor de perguntas); Editar `:226` e Excluir `:229` **sem onClick** |
| admin/GoalsManager.tsx | 🟦 | pages/AdminPanel.tsx | **NENHUMA** | `admin/GoalsManager.tsx:36-64` (3 templates hardcoded), `:67` `useState(defaultTemplates)`, `:75-88`, `:102`, `:112` só mexem em estado local | Persistência inteira. Ver Achado #1 |
| admin/IpWhitelistManager.tsx | 🟨 | pages/AdminPanel.tsx | `ip_whitelist`, `ip_access_logs` | CRUD real em `hooks/useIpWhitelist.ts:19-58` | Controle **não é aplicado** na config atual (Achado #3); aba de logs sempre vazia |
| admin/IssuedCredentialDialog.tsx | ✅ | pages/ApiKeysAdmin.tsx | — (exibe credencial em memória) | `admin/IssuedCredentialDialog.tsx:25-36` | — |
| admin/LeaguesManager.tsx | ✅ | pages/AdminPanel.tsx | `leagues` via useLeagues | create/update/delete `:48-81` | — |
| admin/MoodAnalytics.tsx | 🟨 | pages/AdminPanel.tsx | `mood_entries` (só do usuário logado) | `admin/MoodAnalytics.tsx:24` usa `moodHistory` = `getMyMoodHistory(30)` (`hooks/useMoodTracker.ts:16`) | Métricas fictícias e escopo errado — Achado #2 |
| admin/NineBoxMatrix.tsx | ✅ | pages/AdminPanel.tsx | `nine_box_evaluations` | `admin/NineBoxMatrix.tsx:57-63` | — |
| admin/OrganizationSettings.tsx | 🟨 | pages/AdminPanel.tsx | `organizations` (+ storage de assets) | save real `:72-99` → `organizationService.updateOrganization(:90)` | Grava HSL (`:84-86 hexToHslString`) mas relê no `<input type="color">` (`:62`, `ColorField:28-32`) que exige `#rrggbb` → cores nunca reaparecem após salvar |
| admin/PDIAlertsPanel.tsx | 🟨 | pages/AdminPanel.tsx, pages/ManagerDashboard.tsx | `development_plans`, `development_plan_actions`, `nine_box_evaluations`, `user_certifications` (`hooks/usePDIAlerts.ts:65,123,165,204`) | contadores reais `admin/PDIAlertsPanel.tsx:122-126` | Botão `ChevronRight` de cada alerta **sem onClick nem wrapper** — `admin/PDIAlertsPanel.tsx:101` (alerta não navega para lugar nenhum) |
| admin/PasswordResetApprovalPanel.tsx | ✅ | pages/AdminPanel.tsx | `passwordResetService.approveRequest/rejectRequest` | `admin/PasswordResetApprovalPanel.tsx:67-95` (com onError e checagem de `result.success`) | — |
| admin/PenaltyRulesManager.tsx | ✅ | pages/AdminPanel.tsx | `penalty_rules`, `task_penalties` | `admin/PenaltyRulesManager.tsx:56-68` (mutateAsync), toggle `:104-109` | `isLoading` desestruturado em `:21` e nunca usado |
| admin/PermissionsManager.tsx | 🟨 | pages/PermissionsAdmin.tsx | `permissions`, `roles`, `role_permissions` | `admin/PermissionsManager.tsx:21-30` | `assignPermission`/`removePermission` são `mutation.mutate` (fire-and-forget, `hooks/usePermissions.ts:79-80`); o switch atualiza estado local mesmo se o INSERT falhar |
| admin/PositionsManager.tsx | ✅ | pages/AdminPanel.tsx | `positions`, `position_task_templates`, `user_positions` | `admin/PositionsManager.tsx:57-105` (mutateAsync) | — |
| admin/RolePermissionsManager.tsx | 🟨 | pages/PermissionsAdmin.tsx | `role_permissions` | UI completa; save em `:246-273` | **Falso sucesso**: `Promise.all` sobre `mutate()` (void) — Achado #4 |
| admin/SurveyCreator.tsx | 🟨 | pages/AdminPanel.tsx | `pulse_surveys`, `pulse_responses` | criar persiste `:59-66`; fechar `:83-89` | 3 perguntas **hardcoded** em `:53-57` sem editor; botão Ver resultados `:243` e Excluir `:263` **sem onClick** |
| admin/UsersManager.tsx | ✅ | pages/AdminPanel.tsx | `profiles`, `user_roles`, `team_members` (+ bulk) | `admin/UsersManager.tsx:108-143`, bulk `:267-270` | — |
| admin/departments/DepartmentDialogs.tsx | ✅ | admin/DepartmentsManager.tsx | — (apresentacional) | `admin/departments/DepartmentDialogs.tsx:41-51` | — |
| admin/departments/DepartmentMembersList.tsx | ✅ | admin/DepartmentsManager.tsx | — (apresentacional) | `admin/departments/DepartmentMembersList.tsx:37-70` | — |
| admin/enps/ENPSSubComponents.tsx | 🟨 | admin/ENPSDashboard.tsx | `enps_surveys`, `enps_responses`, RPC `calculate_enps_score` (`services/enpsService.ts:92`) | criar `:80-88`; stats `:199` | `<SelectItem value="">` em `:114` (bug Radix); `useUpdateENPSSurvey` importado `:29` e nunca usado |
| admin/metrics/AdminMetricsCharts.tsx | ⬛ | **NENHUM** | — | `admin/metrics/AdminMetricsCharts.tsx:32` (grep global: zero importadores; sem `lazy()`) | Duplicata parcial de `metrics/MetricsCharts.tsx` — remover |
| admin/metrics/MetricsCharts.tsx | ✅ | admin/AdminMetricsDashboard.tsx:139 | — (apresentacional) | `admin/metrics/MetricsCharts.tsx:26-32` | — |
| admin/ninebox/BoxDetailView.tsx | ✅ | admin/NineBoxMatrix.tsx | `pdiGeneratorService.generatePDIFromNineBox` | `admin/ninebox/BoxDetailView.tsx:82-97` | — |
| admin/ninebox/CreateEvaluationForm.tsx | ✅ | admin/NineBoxMatrix.tsx | `nine_box_evaluations` | `admin/ninebox/CreateEvaluationForm.tsx:40-49` (mutateAsync) | — |
| admin/pdi/CreatePlanForm.tsx | ✅ | admin/DevelopmentPlanManager.tsx | `development_plans` | `admin/pdi/CreatePlanForm.tsx:32-38` | — |
| admin/pdi/PlanDetailView.tsx | ✅ | admin/DevelopmentPlanManager.tsx | `development_plans`, `development_plan_actions` | `admin/pdi/PlanDetailView.tsx:16-23,56-66` | — |
| admin/permissions/PermissionModuleAccordion.tsx | ⬛ | **NENHUM** | — | `admin/permissions/PermissionModuleAccordion.tsx:39` (zero importadores; `RolePermissionsManager` reimplementa o accordion inline) | Remover ou passar a usar |
| admin/positions/AssignmentsTab.tsx | ✅ | admin/PositionsManager.tsx | `user_positions` (via props) | `admin/positions/AssignmentsTab.tsx:31-36`, remove `:103` | — |
| admin/telemetry/TelemetryCharts.tsx | ✅ | pages/AdminTelemetria.tsx, test/telemetry.test.tsx | `query_telemetry` (via props da página) | `admin/telemetry/TelemetryCharts.tsx:30-86` | `SEVERITY_COLORS` (`:21-26`) declarado e nunca usado |
| admin/telemetry/TelemetryStatsCards.tsx | ✅ | pages/AdminTelemetria.tsx | idem (props) | `admin/telemetry/TelemetryStatsCards.tsx:12-18` | — |
| admin/telemetry/TelemetryTable.tsx | ⬛ | **NENHUM** | — | `admin/telemetry/TelemetryTable.tsx:13` (zero importadores; a página renderiza a tabela inline) | Remover |
| admin/telemetry/TopOffendersCard.tsx | ✅ | pages/AdminTelemetria.tsx | idem (props) | `admin/telemetry/TopOffendersCard.tsx:9-31` | — |
| admin/users/BulkActionsBar.tsx | ✅ | admin/UsersManager.tsx:187 | — (apresentacional) | `admin/users/BulkActionsBar.tsx:26-37` | — |
| admin/users/UserDialogs.tsx | ✅ | admin/users/index.ts → UsersManager | — (apresentacional) | `admin/users/UserDialogs.tsx:31-35`, handlers vêm do pai | — |
| admin/users/UserRow.tsx | ✅ | admin/UsersManager.tsx:228 | — (apresentacional) | `admin/users/UserRow.tsx:133-163` (todos os itens do menu com onClick) | — |
| admin/users/index.ts | ✅ | admin/UsersManager.tsx:26, UserRow.tsx:24 | — | `admin/users/index.ts:1-10` | — |
| shop-admin/PromotionFormDialog.tsx | ✅ | shop-admin/PromotionsManager.tsx | — (form) | `shop-admin/PromotionFormDialog.tsx:60-88` (tem `useEffect` de resync) | — |
| shop-admin/PromotionsManager.tsx | ✅ | pages/ShopAdmin.tsx | `shop_promotions`, `shop_rewards` | `shop-admin/PromotionsManager.tsx:50-83` | — |
| shop-admin/PurchaseGovernanceDialog.tsx | 🟨 | shop-admin/PurchasesManager.tsx:175 | RPC `review_purchase` (`services/purchaseGovernanceService.ts:106`), `purchase_approvals` (`:53`), edge `reward-approval-review` (`:83`) | decisão real `shop-admin/PurchaseGovernanceDialog.tsx:82-87` | Botão "Analisar com IA" (`:110-124`) inoperante na config atual — o allowlist vazio bloqueia a edge function |
| shop-admin/PurchasesManager.tsx | ✅ | pages/ShopAdmin.tsx | `shop_purchases` (+ risk_level/risk_score reais da tabela) | `shop-admin/PurchasesManager.tsx:25,142-149` | — |
| shop-admin/RewardFormDialog.tsx | 🟨 | shop-admin/RewardsManager.tsx | — (form) | `shop-admin/RewardFormDialog.tsx:57-70` | `useState` inicializado uma única vez, **sem `useEffect` de resync** (ao contrário do PromotionFormDialog); o componente nunca desmonta (`RewardsManager.tsx:182`, sem `key`) → editar recompensa abre formulário vazio/obsoleto |
| shop-admin/RewardsManager.tsx | ✅ | pages/ShopAdmin.tsx | `shop_rewards` | `shop-admin/RewardsManager.tsx:47-74` | — |
| shop-admin/index.ts | ⬛ | **NENHUM** | — | `shop-admin/index.ts:1-5`; grep por `from "@/components/shop-admin"` = 0 (páginas importam os arquivos direto) | Barrel morto |
| rbac/AccessControl.tsx | ✅ | rbac/index.ts, pages/RateLimitDashboard.tsx | `useRBAC` | `rbac/AccessControl.tsx:49-87` | — |
| rbac/PermissionMatrixTab.tsx | ✅ | rbac/RBACDashboard.tsx:36 | `rbacService.getRoles/getPermissions/getRolePermissions` | `rbac/PermissionMatrixTab.tsx:9-30` | Query N+1 (um fetch por role, `:23-26`) |
| rbac/PermissionsTab.tsx | ✅ | rbac/RBACDashboard.tsx:35 | `permissions` | `rbac/PermissionsTab.tsx:10-13` | — |
| rbac/ProtectedRoute.tsx | ✅ | App.tsx, 4 páginas, tests/unit/access.test.tsx | `useAuth` + `useRBAC` | `rbac/ProtectedRoute.tsx:51-52,103-126` | — |
| rbac/RBACDashboard.tsx | ✅ | pages/AdminPanel.tsx:34 (via barrel) | — (composição) | `rbac/RBACDashboard.tsx:27-38` | — |
| rbac/RBACProvider.tsx | ⬛ | só reexportado em `rbac/index.ts:11` | — | grep global `RBACProvider`: apenas a definição e o reexport; **nunca montado** (ausente de `App.tsx`) | Provider nunca usado → cada `useRBAC()` refaz as queries |
| rbac/RolesTab.tsx | ✅ | rbac/RBACDashboard.tsx:34 | `roles`, `role_permissions` | `rbac/RolesTab.tsx:70-80` (mutations com onError) | — |
| rbac/UserRolesTab.tsx | ✅ | rbac/RBACDashboard.tsx:37 | `user_roles` | `rbac/UserRolesTab.tsx:27-37` | — |
| rbac/index.ts | 🟨 | pages/AdminPanel.tsx:34 | — | `rbac/index.ts:1-12` | Reexporta `RBACProvider`/`useRBACContext` que ninguém consome |
| audit/AuditFilters.tsx | ✅ | pages/AuditLogs.tsx | — (apresentacional, dados via props) | `audit/AuditFilters.tsx:45-49` | — |
| audit/AuditTable.tsx | ✅ | pages/AuditLogs.tsx | `audit_logs` (via props) | `audit/AuditTable.tsx:65-118` | Duplica `actionLabels` (`:12-22`) em vez de importar de `AuditFilters.tsx:43` |
| webhooks/BulkRotateDialog.tsx | ✅ | pages/WebhooksAdmin.tsx | RPC `bulk_rotate_webhook_secrets` | `webhooks/BulkRotateDialog.tsx:61-68` | Secret gerado no browser (`:23-27`) e trafegado como parâmetro de RPC |
| webhooks/EditWebhookDialog.tsx | ✅ | pages/WebhooksAdmin.tsx | `webhook_subscriptions`, RPCs `rotate_webhook_secret` / `promote_webhook_secret` | `webhooks/EditWebhookDialog.tsx:55-59,87-91,110-112` | idem observação do secret client-side |
| bi/BIChartComponents.tsx | ✅ | 4 tabs BI + pages/BIDashboard.tsx | — (apresentacional) | `bi/BIChartComponents.tsx:17-61` | O `trend` que ele renderiza (`:32-39`) recebe constantes do BIDashboard — ver Métricas fictícias |
| bi/BIDepartmentsTab.tsx | 🟨 | pages/BIDashboard.tsx:151 | RPC `get_department_metrics` (`services/executiveService.ts:70`) | `bi/BIDepartmentsTab.tsx:40` | Recebe `radarData` sintético (Achado #5); "XP Total" reconstruído com `dept.xpTotal * 1000` em `:162` depois de `Math.round(x/1000)` em `pages/BIDashboard.tsx:51` → perda de precisão |
| bi/BIOKRsTab.tsx | 🟨 | pages/BIDashboard.tsx:153 | RPC `get_executive_metrics` | `bi/BIOKRsTab.tsx:20` | Metas (70/95/95/50) são constantes em `pages/BIDashboard.tsx:60-63`; divisão por `okrData.length` sem guarda em `:79` |
| bi/BIOverviewTab.tsx | ✅ | pages/BIDashboard.tsx:150 | RPCs `get_monthly_trends`, `get_department_metrics` + `useWeeklyEngagement` | `bi/BIOverviewTab.tsx:31`; origem em `pages/BIDashboard.tsx:44-57` | — |
| bi/BITrainingTab.tsx | ✅ | pages/BIDashboard.tsx:152 | `useCompletionTrend`, RPC `get_executive_metrics` | `bi/BITrainingTab.tsx:29` | `?? 0`/`|| 0` mascaram ausência (`:70,77,84,91`): sem dado exibe "0" indistinguível de zero real |
| executive/ExecutiveMetricCard.tsx | ✅ | pages/ExecutiveDashboard.tsx | — (apresentacional) | `executive/ExecutiveMetricCard.tsx:68-84` — trata `null` como "Não disponível"/"Requer integração" (honesto) | Recebe valores fabricados do consumidor (Achado #5) |
| analytics/ActivityByTypeCard.tsx | ✅ | pages/RealTimeAnalytics.tsx:138 | `audit_logs` (`pages/RealTimeAnalytics.tsx:82-86`) | `analytics/ActivityByTypeCard.tsx:16-17` | `Math.max(...[])` = `-Infinity` se lista vazia (`:17`) |
| analytics/AnalyticsBottomSection.tsx | ⬛ | **NENHUM** | — | `analytics/AnalyticsBottomSection.tsx:25` (zero importadores; duplica `ActivityByTypeCard` + `MostActiveUsersCard`) | Remover |
| analytics/AnalyticsChartTabs.tsx | ✅ | pages/RealTimeAnalytics.tsx:135 | `audit_logs` (`:59-80`) | `analytics/AnalyticsChartTabs.tsx:32` | — |
| analytics/AnalyticsStatsCards.tsx | ✅ | pages/RealTimeAnalytics.tsx:134 | `audit_logs` (`:94-105`) | `analytics/AnalyticsStatsCards.tsx:17-24` | — |
| analytics/MostActiveUsersCard.tsx | ✅ | pages/RealTimeAnalytics.tsx:139 | `audit_logs` + `profiles` (`:88-92`) | `analytics/MostActiveUsersCard.tsx:20` | — |

### Contagem
| Classificação | Qtd |
|---|---|
| ✅ IMPLEMENTADO_TOTAL | 50 |
| 🟨 IMPLEMENTADO_PARCIAL | 20 |
| 🟦 SUGERIDO_OU_INICIADO | 1 |
| ⬛ MORTO_OU_ABANDONADO | 6 |
| **Total** | **77** |

---

## Métricas potencialmente fictícias

Todas verificadas linha a linha. Ordenadas por gravidade.

1. **Badges de tendência do BI ("+12%", "+18%", "+25%", "+8%") — CONSTANTES.**
   `pages/BIDashboard.tsx:128` `trend={12}`, `:136` `trend={18}`, `:137` `trend={25}`, `:138` `trend={8}`.
   Renderizados como variação percentual real em `bi/BIChartComponents.tsx:32-39`. Nunca mudam, não vêm de série temporal alguma.

2. **Radar de Competências (BI → Departamentos) — fórmulas inventadas.**
   `pages/BIDashboard.tsx:66-73`:
   `produtividade: Math.min(100, (d.xpTotal / 10) + 40)` · `treinamento: Math.min(100, (d.quests * 5) + 30)` · `colaboracao: Math.min(100, (d.score / 10) + 20)` · `inovacao: Math.min(100, (d.nivelMedio * 10) + 10)`.
   Nenhuma dessas dimensões existe no banco; são transformações arbitrárias com offsets fixos (+40, +30, +20, +10) que garantem um radar "cheio" mesmo com dados zerados. Exibido como "Análise multidimensional por departamento" (`bi/BIDepartmentsTab.tsx:111`).

3. **"ROI Gamificação" (%) e "Custo Turnover Evitado" (R$) — dinheiro fabricado.**
   `pages/ExecutiveDashboard.tsx:34-43`:
   `engagementScore = totalXpEarned/100 + questsCompleted*5 + kudos*2`; `baseROI = min(300, 100 + engagementScore)`;
   `trainingSavings = trainingCompletionRate * 500`; `retentionSavings = punctualityRate * 300`;
   `turnoverCostSaved = trainingSavings + retentionSavings`.
   Apresentado como valor monetário com `prefix="R$ "` em `:130`. Não há tabela de custos, folha, ou contratações no cálculo — o "R$" é XP e pontualidade multiplicados por constantes mágicas.

4. **"Por Departamento" no Mood Analytics — array hardcoded.**
   `admin/MoodAnalytics.tsx:52-58`:
   `teamMoodData = { engineering: {avg:3.8, participants:12, total:15}, sales:{4.2,8,10}, marketing:{3.5,5,6}, hr:{4.0,3,4} }` — departamentos em inglês que não existem no `departments` do sistema. Renderizado em `:214-233` como "Comparação entre equipes".

5. **"Participação: 78%" — literal.**
   `admin/MoodAnalytics.tsx:162` `<p className="text-2xl font-bold">78%</p>`. Nunca calculado.

6. **Distribuição de humor "da equipe" é o humor do próprio admin.**
   `admin/MoodAnalytics.tsx:24` consome `moodHistory`, que é `moodTrackerService.getMyMoodHistory(30)` (`hooks/useMoodTracker.ts:16`) — apenas o usuário logado. Os cards "Humor Médio" (`:96`), "Tendência" (`:124`), "Registros" (`:144`) e a "Distribuição de Humor / Como a equipe está se sentindo" (`:174-201`) são calculados sobre esses ~30 registros pessoais. O hook **já expõe** `teamStats` (`hooks/useMoodTracker.ts:26,44` → `getTeamMoodStats`) e o componente simplesmente não o usa.

7. **Contadores de Celebrações que nunca saem de zero.**
   `admin/CelebrationManager.tsx:217` itera `["birthday","anniversary","achievement","promotion"]`, mas o enum real é `'birthday' | 'work_anniversary' | 'milestone' | 'custom'` (`services/celebrationsService.ts:6`). Três dos quatro cards exibem permanentemente `0`, e as celebrações reais de tipo `work_anniversary`/`milestone`/`custom` caem em `typeLabels[...]`/`typeIcons[...]` indefinidos (`:74-88`, usados em `:256-262`).

8. **Metas ("Meta: 70/95/95/50/200/1200/50000/20/30/100") — todas constantes de código.**
   `pages/BIDashboard.tsx:60-63,129-131,139`; `pages/ExecutiveDashboard.tsx:40-42,46-64,162`. Não há tabela de metas; nenhum admin consegue alterá-las pela UI. O selo "✓ Atingida" (`executive/ExecutiveMetricCard.tsx:81`) é medido contra número hardcoded.

9. **"Ano anterior: null%".**
   `pages/ExecutiveDashboard.tsx:140` interpola `peopleMetrics.turnover.previousYear`, que é literalmente `null` (`:48`). A descrição do card renderiza a string `"Ano anterior: null%"`.

10. **Filtro de período do BI é decorativo.**
    `pages/BIDashboard.tsx:27` `selectedPeriod` e o `<Select>` em `:103-111` (7d/30d/90d/12m) nunca entram em nenhuma query — `useExecutiveMetrics()/useMonthlyTrends()/useDepartmentMetrics()` (`:30-32`) não recebem parâmetro. Mesmo padrão em `admin/MoodAnalytics.tsx:25,71-80` (`period` nunca usado).

11. **Botão "Exportar" do BI sem handler.**
    `pages/BIDashboard.tsx:115` `<Button variant="outline" size="sm"><Download …/>Exportar</Button>` — sem `onClick`.

12. **`|| 0` / `?? 0` mascarando ausência de dado (não é fraude, mas é indistinguível de zero real).**
    `bi/BITrainingTab.tsx:70,77,84,91,96`; `pages/BIDashboard.tsx:128-139`; `pages/ExecutiveDashboard.tsx:49-66`. Contraste: `executive/ExecutiveMetricCard.tsx:72-73` faz certo (`null` → "Não disponível").

> Nada de `Math.random()` em dado exibido. As três ocorrências (`pages/ExecutiveDashboard.tsx:133` e `:154`) estão apenas em larguras de `<Skeleton>` durante o loading — inofensivas.

---

## Achados graves

### #1 — `GoalsManager` não persiste absolutamente nada, mas confirma sucesso
`admin/GoalsManager.tsx` está montado como aba "Goals" do Admin (`admin/AdminTabsList.tsx:18`, consumido por `pages/AdminPanel.tsx`). Não importa nenhum hook, serviço ou `supabase`.
- `:36-64` — três "Templates de Metas/OKRs" hardcoded (incluindo *"Meta de Vendas da Equipe — Atingir R$ 100.000 no trimestre"*), apresentados ao admin como se fossem dados do sistema.
- `:67` `const [templates, setTemplates] = useState<GoalTemplate[]>(defaultTemplates)`.
- `:75-88` criar/editar → só `setTemplates` + `toast.success("Template criado!")`.
- `:102-103` excluir → `setTemplates(filter)` + `toast.success("Template removido!")`.
- `:112-113` duplicar → idem.
**Impacto:** o admin recebe confirmação de gravação e perde tudo no próximo F5. Não existe tabela de templates de metas envolvida.

### #2 — `MoodAnalytics` apresenta dado individual como dado de equipe, misturado com mock
`admin/MoodAnalytics.tsx` é a aba "Mood" do Admin. Subtítulo: *"Acompanhe o bem-estar da equipe"* (`:69`).
- A base de todos os gráficos é o histórico pessoal do admin logado (`:24` + `hooks/useMoodTracker.ts:16` `getMyMoodHistory(30)`), não da equipe.
- O comentário `// Mock team data for demonstration` em `:52` precede o bloco `teamMoodData` (`:53-58`) renderizado como "Por Departamento / Comparação entre equipes" (`:209-233`).
- "Participação 78%" literal em `:162`.
**Impacto:** decisão de RH sobre clima organizacional tomada em cima de 4 departamentos inventados e do humor de uma única pessoa. O dado real de equipe existe e está sendo ignorado (`teamStats`).

### #3 — Whitelist de IPs: tela de segurança sem enforcement na configuração atual
`admin/IpWhitelistManager.tsx` faz CRUD real em `ip_whitelist`. A aplicação da regra acontece em `src/components/IpAccessGuard.tsx` / `src/pages/Auth.tsx` chamando a edge function `verify-ip`. Porém:
- `src/components/IpAccessGuard.tsx:29-33` — `if (!isFunctionDeployed("verify-ip")) { setIsAllowed(true); return; }`
- `src/lib/edgeAvailability.ts:46-51` — allowlist vazia ⇒ **retorna `false` para tudo** ("allowlist vazia = block all").
- `.env:25` — `VITE_DEPLOYED_EDGE_FUNCTIONS=` (**vazio**).
⇒ hoje o guard sempre libera. Além disso o caminho de erro também é *fail open* (`IpAccessGuard.tsx:46-48` e `:57-58`).
Consequências adicionais: `ip_access_logs` só é escrito por `supabase/functions/verify-ip/index.ts:64,109`, logo a aba "Logs de Acesso" do painel será **sempre vazia**; e `ipWhitelistService.checkIpWhitelisted` (`services/ipWhitelistService.ts:104-110`) não tem nenhum chamador em `src/`. A função `is_ip_whitelisted` também não é referenciada por nenhuma policy RLS (grep em `supabase/migrations/`).
**Impacto:** controle de acesso por IP é, na prática, decorativo — e mesmo quando ligado é uma checagem client-side, contornável.

### #4 — `RolePermissionsManager` reporta "Permissões atualizadas com sucesso!" sem esperar (nem verificar) a gravação
`admin/RolePermissionsManager.tsx:256-273`:
```
await Promise.all([
  ...toAdd.map((permId) => assignPermission({ roleId: selectedRole, permissionId: permId })),
  ...toRemove.map((permId) => removePermission({ roleId: selectedRole, permissionId: permId })),
]);
setOriginalPermissions(new Set(rolePermissions));
toast.success("Permissões atualizadas com sucesso!");
```
`assignPermission`/`removePermission` são `mutation.mutate` — retornam `void` (`hooks/usePermissions.ts:79-80`). O `Promise.all` resolve imediatamente sobre `[undefined, …]`; o `catch` de `:268` é inalcançável para falhas de banco; e as mutations não têm `onError` (`hooks/usePermissions.ts:34-50`), então uma negativa de RLS falha **silenciosamente**.
`setOriginalPermissions` em `:265` ainda apaga o baseline, de modo que "Descartar" (`:276-279`) passa a restaurar o estado errado e o botão de salvar some.
Mesmo defeito, versão mais branda, em `admin/PermissionsManager.tsx:21-29` (atualiza `rolePermissions` local sem aguardar).
**Impacto:** administrador acredita ter revogado/concedido permissões que continuam como estavam. É o pior lugar possível para um falso positivo.

### #5 — Dashboards C-Level publicam número financeiro fabricado como se fosse dado real
`pages/ExecutiveDashboard.tsx:34-43` gera "ROI Gamificação" e "Custo Turnover Evitado (R$)" a partir de XP, quests, kudos, `trainingCompletionRate * 500` e `punctualityRate * 300` — constantes sem origem documentada. Renderizados por `executive/ExecutiveMetricCard.tsx` com `prefix="R$ "` (`:130`) e comparados a metas hardcoded (`target: 50000`).
No mesmo dashboard, dois cards trazem a legenda **"dados reais"** (`:132` "Últimos 6 meses - dados reais" e `:153` "Score de engajamento - dados reais"), o que reforça, por contraste, a leitura de que os cartões financeiros também são reais.
No BI, o mesmo padrão: `pages/BIDashboard.tsx:66-73` (radar sintético) e `:128-138` (trends constantes).
**Impacto:** o único público desses números é a diretoria, e são exatamente os números sem lastro.

### Menções honrosas (não entram no top 5, mas quebram funcionalidade)
- **Allowlist de edge functions vazia derruba features inteiras.** `.env:25` vazio + `src/lib/requestId.ts:131` ⇒ toda `invokeEdgeSafe` retorna 404 sintético. No escopo isso mata: `AdminAlertsPanel` (sempre em estado de erro, `hooks/useAdminAlerts.ts:17`) e o botão "Analisar com IA" da governança de resgates (`services/purchaseGovernanceService.ts:83`).
- **Recompensas de celebração descartadas.** `admin/CelebrationManager.tsx:38-39` coleta `xp_reward`/`coin_reward` no formulário, mas `handleSubmit` (`:46-52`) não os envia e `CelebrationInsert` (`services/celebrationsService.ts:22-28`) sequer possui esses campos. O card depois exibe `celebration.xp_reward` vindo do default do banco (`:277`) — parece que gravou.
- **Editar recompensa abre formulário vazio.** `shop-admin/RewardFormDialog.tsx:57-70` inicializa o state uma vez e não tem `useEffect` de sincronização; o componente é montado permanentemente em `shop-admin/RewardsManager.tsx:182` sem `key`.
- **6 botões de ação sem handler nenhum:** `admin/AnnouncementPublisher.tsx:228,231` (editar/excluir anúncio), `admin/SurveyCreator.tsx:243,263` (ver resultados/excluir pesquisa), `admin/FeedbackCycleManager.tsx:226,229` (editar/excluir ciclo 360°), `admin/PDIAlertsPanel.tsx:101` (abrir alerta).
- **`<SelectItem value="">` (Radix lança em runtime):** `admin/ENPSTrendChart.tsx:111` e `admin/enps/ENPSSubComponents.tsx:114`.
- **Cores da organização não fazem round-trip.** `admin/OrganizationSettings.tsx:84-86` grava HSL; `:62-64` relê para `<input type="color">` que só aceita hex.
- **4 UIs concorrentes para a mesma coisa (permissões de role):** `admin/PermissionsManager.tsx`, `admin/RolePermissionsManager.tsx`, `rbac/RolesTab.tsx` (dialog) e a órfã `admin/permissions/PermissionModuleAccordion.tsx`.

---

## Gamificação

# Auditoria — Núcleo de Gamificação (`src/components/`)

**Escopo:** boss/, prediction/, quiz/, luckywheel/, wager/, board/, auction/, cards/, war/, duels/, tournament/, memory/, scratchcard/, weekly/, achievements/, shop/
**Medição:** 81 arquivos (75 `.tsx` + 6 `index.ts`), **12.156 linhas** — todos lidos.
**Método:** leitura integral + grep de consumidores + cruzamento com contagem real de linhas do banco de produção.

---

## Tabela de classificação

| Feature/Componente | Classificação | Consumidores | Tabelas | Tem dado? | Evidência arquivo:linha | O que falta |
|---|---|---|---|---|---|---|
| **boss/BossBattleAdminDialog** (343 l) | 🟨 | `pages/BossBattlePage.tsx` (rota `/chefao`, `App.tsx:262`) | `boss_battles` via `useCreateBossBattle` | ❌ 0 linhas | `boss/BossBattleAdminDialog.tsx:71,127` | Nunca foi convocada uma batalha. Rota ausente do menu |
| **boss/BossExecutiveSummaryCard** (278 l) | 🟨 | `BossBattlePage.tsx` | `boss_battles`, `boss_win_rate_goals` | ❌ 0/0 | `boss/BossExecutiveSummaryCard.tsx:68,78` | KPIs, alertas e metas por depto. calculam sobre array vazio |
| **boss/BossWinRateGoalsCard** (277 l) | 🟨 | `BossBattlePage.tsx` | `boss_win_rate_goals` | ❌ 0 | `boss/BossWinRateGoalsCard.tsx:75-78` | `if (result.rows.length === 0) return null` → componente nunca renderiza |
| **boss/BossConsolidatedReportCard** (216 l) | 🟨 | `BossBattlePage.tsx` | `boss_battles` | ❌ 0 | `boss/BossConsolidatedReportCard.tsx:65,162` | Export CSV/PDF (jsPDF lazy) sem uma única batalha concluída |
| **boss/BossHistoryCard** (215 l) | 🟨 | `BossBattlePage.tsx` | `boss_battles` | ❌ 0 | `boss/BossHistoryCard.tsx:86` `if (totalConcluded === 0) return null` | Idem |
| **boss/BossDepartmentComparisonCard** (174 l) | 🟨 | `BossBattlePage.tsx` | `boss_battles` | ❌ 0 | `boss/BossDepartmentComparisonCard.tsx:91` `if (result.rows.length < 2) return null` | Idem |
| **boss/BossContributorsCard** (159 l) | 🟨 | `BossBattlePage.tsx` | `boss_battle_damage` via `useBossLeaderboard` | ❌ 0 | `boss/BossContributorsCard.tsx:91` | Ranking com polling ativo sobre tabela vazia |
| **boss/BossTrendChart** (108 l) | 🟨 | interno: `BossHistoryCard.tsx:21,157` | `boss_battles` | ❌ 0 | `boss/BossTrendChart.tsx:37` `if (active.length < 2) return null` | Idem |
| **boss/BossDamageSourcesCard** (80 l) | 🟨 | `BossBattlePage.tsx` | nenhuma (props) | ❌ (sem batalha, nunca montado) | `boss/BossDamageSourcesCard.tsx:43-44` | Puro display de regras |
| **prediction/PredictionMarketCard** (151 l) | 🟨 | `PredictionMarketsPage.tsx`, `campaigns/CampaignGoalBetPanel.tsx` | `prediction_markets`, `prediction_options` | ❌ 0/0 | `prediction/PredictionMarketCard.tsx:30-35,81` | Motor de odds com rake pronto, nenhum mercado criado |
| **prediction/GoalBetDialog** (334 l) | 🟨 | `PredictionAdminPage.tsx` | `prediction_markets` (RPC) + `sales_campaigns` | ❌ 0 | `prediction/GoalBetDialog.tsx:58,149` | Aposta de meta sobre campanhas — nunca usada |
| **prediction/CreateMarketDialog** (236 l) | 🟨 | `PredictionAdminPage.tsx` | `prediction_markets` | ❌ 0 | `prediction/CreateMarketDialog.tsx:47,73` | Validação espelhada do servidor, 0 mercados |
| **prediction/StakeDialog** (176 l) | 🟨 | `PredictionMarketsPage.tsx`, `CampaignGoalBetPanel.tsx` | `prediction_stakes` | ❌ 0 | `prediction/StakeDialog.tsx:49,81` | Dedupe key + preview de multiplicador, 0 aportes |
| **prediction/OracleLeaderboard** (167 l) | 🟨 | `PredictionMarketsPage.tsx` | `prediction_stakes` (agregado) | ❌ 0 | `prediction/OracleLeaderboard.tsx:98,146` | Ranking "supera o consenso" sem nenhum mercado apurado |
| **prediction/OddsHistoryChart** (162 l) | 🟨 | interno: `PredictionMarketCard.tsx:8,145` | `prediction_stakes` (buckets) | ❌ 0 | `prediction/OddsHistoryChart.tsx:54,87` | Replay determinístico de cotações, série vazia |
| **prediction/SettleMarketDialog** (134 l) | 🟨 | `PredictionAdminPage.tsx` | RPC settle + `useGoalBetSuggestion` | ❌ 0 | `prediction/SettleMarketDialog.tsx:28-33` | Apuração com sugestão automática, nunca executada |
| **prediction/GoalBetHistoryPanel** (132 l) | 🟨 | `PredictionMarketsPage.tsx` | `prediction_stakes` | ❌ 0 | `prediction/GoalBetHistoryPanel.tsx:40` `if (history.items.length === 0) return null` | ROI/CSV do apostador |
| **prediction/PredictionAdminRow** (101 l) | 🟨 | `PredictionAdminPage.tsx` | `prediction_admin_events` | ❌ 0 | `prediction/PredictionAdminRow.tsx:36,49` | Máquina de estados publish/lock/settle/void ociosa |
| **prediction/MyGoalBetPosition** (93 l) | 🟨 | `PredictionMarketsPage.tsx`, `CampaignGoalBetPanel.tsx` | `prediction_stakes` | ❌ 0 | `prediction/MyGoalBetPosition.tsx:20` `return null` | — |
| **prediction/PredictionOverviewCards** (92 l) | 🟨 | `PredictionAdminPage.tsx` | derivado de `prediction_markets` | ❌ 0 | `prediction/PredictionOverviewCards.tsx:23-50` | 4 KPIs sempre zerados |
| **prediction/GoalBetCountdownBadge** (61 l) | 🟨 | interno: `PredictionMarketCard.tsx:9,59` | — | ❌ | `prediction/GoalBetCountdownBadge.tsx:36` | `setInterval` de 30 s nunca disparado |
| **prediction/PredictionWatchdogPanel** (57 l) | 🟨 | `PredictionAdminPage.tsx` | motor puro `predictionWatchdog` | ❌ 0 | `prediction/PredictionWatchdogPanel.tsx:25` `return null` | Vigilância de "moedas imobilizadas" sem moedas |
| **prediction/GoalBetSearchInput** (64 l) | 🟨 | `PredictionMarketsPage.tsx` | — | ❌ | `prediction/GoalBetSearchInput.tsx:16` | Busca sobre lista vazia |
| **prediction/GoalBetFilterBar** (56 l) | 🟨 | `PredictionMarketsPage.tsx` | — | ❌ | `prediction/GoalBetFilterBar.tsx:17` | Contadores sempre 0 |
| **prediction/GoalBetExposureAlert** (50 l) | 🟨 | `PredictionMarketsPage.tsx`, `StakeDialog.tsx:18,161` | — | ❌ | `prediction/GoalBetExposureAlert.tsx:18` `return null` | — |
| **quiz/MagicCardQuiz** (374 l) | ✅ | `pages/DailyQuiz.tsx:8,319` | `quiz_questions`, `quiz_options`, `quiz_answers` | ✅ 12/48/5 | `quiz/MagicCardQuiz.tsx:196,209` — correção server-side via `quizPlayService.gradeAnswer` | Uso mínimo (5 respostas totais) |
| **quiz/MillionaireQuiz** (158 l) | 🟨 | `DailyQuiz.tsx:9,331` | mesmas + `quiz_scores` | ⚠️ 1 score total | `quiz/MillionaireQuiz.tsx:64,80` | Escada de prêmio até 1.000.000 gravada como `score` no mesmo ranking do Magic (escalas incompatíveis) |
| **quiz/MillionaireHelpers** (157 l) | 🟨 | interno: `MillionaireQuiz.tsx:10` | RPC `getQuizLifeline` | ⚠️ | `quiz/MillionaireHelpers.tsx:12` `PRIZE_LADDER` hardcoded; `:94` `Math.random()` na frase do amigo | Prêmios não vêm de config |
| **quiz/QuizDailyRanking** (210 l) | 🟨 | `DailyQuiz.tsx:10,310` | `quiz_scores` | ⚠️ 1 linha | `quiz/QuizDailyRanking.tsx:110,156` | Ranking de 1 jogador |
| **quiz/QuizCategoryStats** (216 l) | 🟨 | `pages/QuizAdmin.tsx` | `quiz_answers` agregado | ⚠️ 5 | `quiz/QuizCategoryStats.tsx:21,37,157` | Gráfico cai no empty-state |
| **quiz/HardestQuestionsRanking** (131 l) | 🟨 | `QuizAdmin.tsx` | `quiz_answers` | ❌ efetivo | `quiz/HardestQuestionsRanking.tsx:15,44` — exige mín. 3 respostas/pergunta; há 5 no total | Volume |
| **quiz/QuestionFormDialog** (180 l) | 🟨 | `QuizAdmin.tsx` | `quiz_questions`/`quiz_options` | ✅ 12 perguntas | **`quiz/QuestionFormDialog.tsx:165` `<SelectItem value="">`** | **BUG: Radix Select 2.2.5 lança exceção com value vazio** |
| **quiz/QuestionStatsInline** (59 l) | 🟨 | `QuizAdmin.tsx` | `quiz_answers` | ⚠️ 5 | `quiz/QuestionStatsInline.tsx:11,17` | Mostra "Sem respostas" na maioria |
| **quiz/AIQuestionGenerator** (281 l) | 🟦 | `QuizAdmin.tsx` | Edge Function `generate-quiz-questions` | ❓ sem evidência | `quiz/AIQuestionGenerator.tsx:52-55` | Não há como provar uso; grava em `quiz_questions` (12 linhas, origem indeterminada) |
| **luckywheel/LuckyWheel** (124 l) | ✅ | `pages/LuckyWheelPage.tsx` | `lucky_wheel_prizes` | ✅ 11 | `luckywheel/LuckyWheel.tsx:36,56` — sorteio 100 % server-side | — |
| **luckywheel/LuckyWheelHistory** (54 l) | 🟨 | `LuckyWheelPage.tsx` | `lucky_wheel_spins` | ⚠️ 2 giros | `luckywheel/LuckyWheelHistory.tsx:7,24` | Volume irrisório |
| **luckywheel/LuckyWheelAuditTrail** (179 l) | ✅ | `pages/LuckyWheelAdmin.tsx` | `lucky_wheel_prize_audit` | ✅ 11 | `luckywheel/LuckyWheelAuditTrail.tsx:92,95` | — |
| **luckywheel/LuckyWheelPayoutPanel** (261 l) | 🟨 | `LuckyWheelAdmin.tsx` | `lucky_wheel_spins` + prizes | ⚠️ 2 giros | `luckywheel/LuckyWheelPayoutPanel.tsx:101,244` (χ²) | Reconciliação estatística sobre n=2: χ² sem significado |
| **luckywheel/LuckyWheelPayoutTrend** (296 l) | 🟨 | `LuckyWheelAdmin.tsx` | snapshots diários (tabela **não consta** no inventário medido) | ❌/❓ | `luckywheel/LuckyWheelPayoutTrend.tsx:76,175` "Ainda sem snapshots no período" | Cron das 4 h precisa existir/rodar |
| **luckywheel/LuckyWheelWindowComparison** (444 l) | 🟨 | `LuckyWheelAdmin.tsx` | snapshots + budget/what-if (tabelas **não** no inventário) | ❌/❓ | `luckywheel/LuckyWheelWindowComparison.tsx:87,94` teste t de Welch; `:82` `loadBudget()` = localStorage | 444 l de inferência estatística sobre 2 giros; teto persistido em localStorage como fallback |
| **wager/WagerIntegrityCard** (387 l) | 🟨 | `pages/WagerQuestionAdminPage.tsx` | `wager_entries`, `wager_integrity_reviews` | ❌ 0/0 | `wager/WagerIntegrityCard.tsx:78-81,144` | Antifraude completo (triagem, notas, histórico de eventos, CSV) sem uma única aposta |
| **wager/WagerBulkImportDialog** (206 l) | 🟨 | `WagerQuestionAdminPage.tsx` | `wager_questions` | ❌ 0 | `wager/WagerBulkImportDialog.tsx:35,68` | Importador CSV com preview e detecção de conflito — nada importado |
| **wager/WagerMonthlyExposureCard** (174 l) | 🟨 | `WagerQuestionAdminPage.tsx` | `wager_questions` | ❌ 0 | `wager/WagerMonthlyExposureCard.tsx:89,141` "Nenhuma pergunta agendada" | Projeção de orçamento sem perguntas |
| **wager/WagerLeaderboardCard** (130 l) | 🟨 | `pages/DailyWagerPage.tsx` | `wager_entries` | ❌ 0 | `wager/WagerLeaderboardCard.tsx:37,75` | Ranking vazio permanente |
| **board/BoardTileRow** (199 l) | 🟨 | `pages/BoardTrailAdminPage.tsx` | `board_tiles` | ⚠️ 15 casas / 1 trilha | `board/BoardTileRow.tsx:38,29` (usa sentinela `__none__` — correto) | Editor OK; 1 trilha só |
| **board/BoardChallengeReport** (169 l) | 🟨 | `pages/BoardTrailPage.tsx`, `lib/boardStats.ts` | RPC `board_challenge_stats` | ⚠️ 3 movimentos | `board/BoardChallengeReport.tsx:48,117` | Calibração de dificuldade com amostra de 1 jogador |
| **board/BoardStuckPlayersPanel** (148 l) | 🟨 | `BoardTrailAdminPage.tsx` | `board_player_states` | ⚠️ 1 jogador | `board/BoardStuckPlayersPanel.tsx:38,42` | Desbloqueio em massa para 1 pessoa |
| **board/BoardChallengeDialog** (144 l) | 🟨 | `BoardTrailPage.tsx` | RPC resolve + `board_moves` | ⚠️ 3 moves | `board/BoardChallengeDialog.tsx:37,50` | Dedupe key correta; volume nulo |
| **board/BoardLeaderboard** (91 l) | 🟨 | `BoardTrailPage.tsx` | `board_player_states` | ⚠️ 1 | `board/BoardLeaderboard.tsx:23,41` | Ranking de 1 |
| **board/BoardPath** (91 l) | 🟨 | `BoardTrailPage.tsx` | `board_tiles` | ⚠️ 15 | `board/BoardPath.tsx:34` | — |
| **auction/AuctionAdminForm** (230 l) | ✅ | `pages/AuctionsAdmin.tsx` | `auctions` + `shop_rewards` | ✅ 3 leilões | `auction/AuctionAdminForm.tsx:53,81`; `:22-23` sentinela documentada | — |
| **auction/AuctionAdminTable** (155 l) | ✅ | `AuctionsAdmin.tsx` | `auctions` | ✅ 3 | `auction/AuctionAdminTable.tsx:43-45,81` | — |
| **auction/BidDialog** (130 l) | ✅ | `pages/AuctionsPage.tsx` | `auction_bids` | ✅ 9 lances | `auction/BidDialog.tsx:44,62` — dedupe key por abertura | — |
| **auction/AuctionCard** (90 l) | ✅ | `AuctionsPage.tsx` | `auctions`/`auction_bids` | ✅ | `auction/AuctionCard.tsx:23-28` | — |
| **auction/AuctionCountdown** (38 l) | ✅ | interno: `AuctionCard.tsx:6,46`, `AuctionAdminTable.tsx:18,99` | — | ✅ | `auction/AuctionCountdown.tsx:22` | — |
| **auction/AuctionAuditTrail** (111 l) | 🟨 | `AuctionsAdmin.tsx` | `auction_admin_events` (**não consta** no inventário medido) | ❓ | `auction/AuctionAuditTrail.tsx:55,79` | Tabela não verificada |
| **cards/PackList** (92 l) | ✅ | `pages/CardAlbumPage.tsx` | `card_packs`, `user_cards` | ✅ 6/14 | `cards/PackList.tsx:25,28` | — |
| **cards/CardTile** (61 l) | ✅ | `CardAlbumPage.tsx` | `card_definitions` | ✅ 12 | `cards/CardTile.tsx:22` | — |
| **cards/CollectionProgressBar** (36 l) | ✅ | `CardAlbumPage.tsx` | derivado de `user_cards` | ✅ 14 | `cards/CollectionProgressBar.tsx:9` | — |
| **cards/TradeInbox** (123 l) | 🟨 | `CardAlbumPage.tsx` | `card_trades` | ❌ 0 | `cards/TradeInbox.tsx:33,48` "Nenhuma proposta de troca" | Nunca houve troca; motor de revalidação atômica ocioso |
| **cards/SetRewardsPanel** (149 l) | 🟨 | `CardAlbumPage.tsx` | `card_set_claims` | ❌ 0 | `cards/SetRewardsPanel.tsx:27,45` | Marcos de coleção nunca resgatados |
| **war/DepartmentWarConfigDialog** (484 l) | ✅ | `pages/DepartmentWarPage.tsx` | `department_wars` | ✅ 1 guerra | `war/DepartmentWarConfigDialog.tsx:68,121`; `:38-46` presets de métrica hardcoded | Presets de métrica fixos em código |
| **war/WarLiveFeed** (110 l) | ✅ | `DepartmentWarPage.tsx` | `department_war_contributions` | ✅ 14 | `war/WarLiveFeed.tsx:20,22` | — |
| **war/WarLeadershipAlert** (81 l) | 🟨 | `DepartmentWarPage.tsx` | derivado (client-side watch) | ⚠️ 1 guerra | `war/WarLeadershipAlert.tsx:38,40` `return null` | Só narra com ≥2 deptos pontuando |
| **duels/DuelCard** (128 l) | 🟨 | `pages/Duels.tsx` | `direct_duels` | ⚠️ 1 duelo | `duels/DuelCard.tsx:18,25` | Um único duelo em produção |
| **duels/CreateDuelDialog** (71 l) | 🟨 | `Duels.tsx` | `direct_duels` | ⚠️ 1 | `duels/CreateDuelDialog.tsx:19,23` | Idem |
| **tournament/TournamentBracketView** (166 l) | ✅ | `pages/TournamentsPage.tsx` | `tournaments`, `tournament_matches`, `tournament_participants` | ✅ 2/3/4 | `tournament/TournamentBracketView.tsx:27,54` | Volume pequeno mas real |
| **memory/MemoryBoard** (70 l) | 🟨 | `pages/MemoryGamePage.tsx` | `memory_decks`, `memory_pairs` | ✅ 2/16 · sessões ⚠️1 | `memory/MemoryBoard.tsx:16` | 1 partida concluída |
| **memory/MemoryLeaderboard** (85 l) | 🟨 | `MemoryGamePage.tsx` | `memory_sessions` | ⚠️ 1 | `memory/MemoryLeaderboard.tsx:27,42` | Ranking de 1 |
| **scratchcard/ScratchSurface** (136 l) | ✅ | `pages/ScratchCardPage.tsx:11,115` | `scratch_cards`, `scratch_card_prizes` | ✅ 8/7 | `scratchcard/ScratchSurface.tsx:17` — prêmio já sorteado no servidor | — |
| **weekly/WeeklyMetricCards** (98 l) | ⬛ | **NENHUM** — zero importadores em todo o `src/` | nenhuma (recebe props) | n/a | `weekly/WeeklyMetricCards.tsx:34`; grep em `src/**/*.{ts,tsx}` retorna só a própria definição | Código morto: deletar ou ligar a `weekly_challenges` (3 linhas) |
| **achievements/AchievementGrid** (227 l) | 🟨 | `pages/Achievements.tsx` | `achievements`, `user_achievements` | ✅ 15/13 | `achievements/AchievementGrid.tsx:212` `<button>` **sem `onClick`**; `:135` `.replace()` gera cor CSS inválida; `:111` `bg-[#0A0C10]` | Botão Compartilhar morto; bug de cor; tema fixo escuro |
| **shop/RewardCard** (185 l) | 🟨 | `pages/Shop.tsx`, `stories/gamification/XPRewards.stories.tsx` | `shop_rewards` → `shop_purchases` | rewards ✅ 12 · **compras ❌ 0** | `shop/RewardCard.tsx:162` `onPurchase`; `:42` `bg-[#0d0e14]` | Nenhuma compra jamais concluída |
| **shop/PurchaseHistory** (146 l) | 🟨 | `Shop.tsx` | `shop_purchases` | ❌ 0 | `shop/PurchaseHistory.tsx:22,37` — sempre cai no empty-state | Idem; `:39,:81` cor fixa |
| **shop/__tests__/ProductGridLoading.test.tsx** (139 l) | 🟨 | vitest | mocks | n/a | `shop/__tests__/ProductGridLoading.test.tsx:78` `expect(gridSkeletons.length).toBe(64)` | Asserção com número mágico 8×8; quebra a qualquer ajuste de skeleton |

---

## Features dormentes (código pronto, tabela vazia)

Ordenadas por linhas de código desperdiçadas.

| # | Feature | Linhas | Arquivos | Tabelas vazias | Rota |
|---|---|---:|---:|---|---|
| 1 | **Mercados de Previsão / Aposta de Meta** | **2.032** | 17 | `prediction_markets`, `prediction_options`, `prediction_stakes`, `prediction_admin_events` | `/previsoes`, `/previsoes/admin` (`App.tsx:246-247`) — **fora do menu** |
| 2 | **Batalha de Chefão** | **1.850** | 9 | `boss_battles`, `boss_battle_damage`, `boss_battle_rewards`, `boss_win_rate_goals` | `/chefao` (`App.tsx:262`) — **fora do menu** |
| 3 | **Pergunta do Dia / Wager** | **897** (+578 da página admin) | 4 | `wager_entries`, `wager_questions`, `wager_integrity_reviews` | `/pergunta-do-dia`, `/pergunta-do-dia/admin` (`App.tsx:255,259`) — **fora do menu** |
| 4 | **Analytics da Roleta** (payout/tendência/janelas) | **1.001** | 3 | snapshots + budget + what-if (tabelas **nem aparecem** no inventário do banco) | `/roleta/admin` |
| 5 | **Loja — ciclo de compra** | **331** | 2 | `shop_purchases`, `shop_promotions` | `/loja` (no menu) |
| 6 | **Trocas de cartas** | 123 | 1 | `card_trades` | `/album` |
| 7 | **Recompensas por coleção completa** | 149 | 1 | `card_set_claims` | `/album` |

**Total dormente medido: ≈ 6.383 das 12.156 linhas do escopo (52,5 %).**

Dormência "por baixo volume" (tabela com dado, mas 1 registro — pilotos que não viraram operação): board/ (1 jogador, 3 movimentos), memory/ (1 sessão), duels/ (1 duelo), quiz scores (1), luckywheel spins (2).

---

## Achados graves

### 1. Três subsistemas inteiros são inalcançáveis pela navegação (≈4.779 linhas)
`/chefao`, `/previsoes` e `/pergunta-do-dia` têm rota registrada em `App.tsx:246,247,255,259,262` mas **não constam** em `components/AppSidebar.tsx:14-86` nem em `components/MobileDrawer.tsx:27-53`. Só se chega neles digitando a URL. Isso explica mecanicamente por que as 11 tabelas dessas features estão em 0: não há caminho de descoberta para o usuário. É a causa raiz mais barata de corrigir de toda a auditoria.

### 2. `quiz/QuestionFormDialog.tsx:165` — crash em runtime no único fluxo com conteúdo real
```tsx
<SelectItem value="">Todos</SelectItem>
```
Com `@radix-ui/react-select` ^2.2.5 (`package.json:37`) um `SelectItem` com `value=""` lança exceção ao montar o `SelectContent`. O formulário de criação/edição de perguntas — que alimenta a **única** feature de gamificação com conteúdo real (12 perguntas, 48 opções) — quebra ao abrir o seletor de departamento. O padrão correto já está documentado e aplicado em dois vizinhos: `auction/AuctionAdminForm.tsx:22-23` (`/** Valor sentinela: Radix Select não aceita value="" */ const NO_REWARD = "none"`) e `board/BoardTileRow.tsx:29` (`const NO_CHALLENGE = "__none__"`). A regra é conhecida pelo time e violada aqui. (Mesmo defeito fora do escopo em `admin/enps/ENPSSubComponents.tsx:114`, `admin/ENPSTrendChart.tsx:111`, `admin/NineBoxMatrix.tsx:120`.)

### 3. `shop_purchases = 0` — a economia de moedas não tem ralo
Existem 12 recompensas em `shop_rewards` e dezenas de mecanismos de emissão de moedas em todo o escopo (roleta, raspadinha, cartas, tabuleiro, leilão, quiz, guerra). **Nenhuma compra jamais foi concluída.** `shop/PurchaseHistory.tsx:37` cai permanentemente no empty-state e `shop/RewardCard.tsx:162` (`onPurchase`) nunca teve efeito persistido. Uma economia que só emite e nunca resgata é inflacionária por construção — e o leilão (`auction/AuctionAdminForm.tsx:88,194`), que promete "entrega automática via pedido pendente na loja", depende justamente desse caminho que nunca rodou.

### 4. Antifraude e reconciliação estatística construídos sobre amostra inexistente
- `wager/WagerIntegrityCard.tsx` — 387 linhas de triagem de anomalias (filtros por desfecho, notas persistidas, histórico de eventos, export CSV auditável) apontando para `wager_entries` = **0**.
- `luckywheel/LuckyWheelWindowComparison.tsx` — 444 linhas de teste t de Welch com beta incompleta exata (`:94`), simulação what-if e auditoria de teto, sobre **2 giros** registrados.
- `luckywheel/LuckyWheelPayoutPanel.tsx:244` — χ² por setor com n=2.

É esforço de engenharia de nível estatístico aplicado a zero sinal. Pior: `LuckyWheelWindowComparison.tsx:82` usa `loadBudget()` (localStorage) como fonte de verdade de fallback para o teto de moedas por giro — um parâmetro econômico que fica no navegador de quem abriu a tela por último.

### 5. `achievements/AchievementGrid.tsx` — botão morto e cor CSS inválida na feature mais usada
Com 15 conquistas e 13 desbloqueios, é uma das poucas features com uso real — e tem dois defeitos visíveis:
- **`:212-214`** — `<button className="...">` envolvendo `<Share2 />` **sem `onClick`, sem `aria-label`**. É o único `onClick` vazio de todo o escopo: promete compartilhamento e não faz nada.
- **`:132-137`** — `config.color.replace('text-', 'rgba(').replace('-400', ',0.4)')` produz strings como `rgba(slate,0.4)` / `rgba(cyan,0.4)`, que não são cores CSS válidas; o `animate` de `borderColor` do Framer Motion simplesmente não anima.
- **`:111`** `bg-[#0A0C10]` fixo (mesmo padrão em `shop/RewardCard.tsx:42` e `shop/PurchaseHistory.tsx:39,81`) — quebra o tema claro nessas telas.

### Menções honrosas (bugs de economia, não de crash)
- **`pages/DailyQuiz.tsx:98`** — `streak_bonus: score - (correctAnswers * 100)` assume 100 pontos por pergunta, mas `quiz/QuestionFormDialog.tsx:154` permite pontuação arbitrária por pergunta. Com perguntas de 200/300 pontos (valores que o próprio `AIQuestionGenerator.tsx:97` gera), o bônus registrado fica **negativo ou inflado**.
- **`quiz/MillionaireHelpers.tsx:12`** — `PRIZE_LADDER` vai até 1.000.000 e é gravado como `score` em `quiz_scores` (`pages/DailyQuiz.tsx:110`), o mesmo campo somado no `total_score` do ranking diário compartilhado com o Magic Cards (~centenas de pontos). Uma partida de Show do Milhão apaga o ranking inteiro.
- **`pages/DailyQuiz.tsx:71-74,102,116`** — `completedToday` é estado React local: o limite "uma vez por dia" evapora a cada reload.
- **`shop/__tests__/ProductGridLoading.test.tsx:78`** — `expect(gridSkeletons.length).toBe(64)` com comentário "8 cards * 8 animated elements each": teste acoplado à estrutura interna do skeleton.

---

## RH e Gestão

# Auditoria de estado — Núcleo RH / Gestão de Pessoas (`src/components/`)

**Escopo medido:** 88 arquivos / 13.302 linhas em `engagement/ campaigns/ manager/ trails/ lms/ onboarding/ checkins/ goals/ succession/ positions/ certifications/ attendance/ quest-builder/ sequence/ copilot/ dashboard/ stats/ push/`. Todos lidos integralmente.

**Método:** grep de consumidores em todo `src/`, leitura de `services/*` para mapear tabela/RPC, cruzamento com a contagem de linhas do banco de produção fornecida. Regra de ouro aplicada: código completo + tabela vazia = 🟨, nunca ✅.

| Feature/Componente | Classificação | Consumidores | Tabelas / RPC | Tem dado? | Evidência arquivo:linha | O que falta |
|---|---|---|---|---|---|---|
| **ENGAGEMENT** |
| Pesquisa contínua (widget de coleta) | 🟨 | `pages/ContinuousEngagement.tsx` | `get_active_engagement_cycle`, `submit_engagement_answer` → `engagement_cycles`(1), `engagement_question_assignments`(24), `engagement_answers`(**0**) | Parcial — ciclo e 24 perguntas atribuídas, **zero respostas** | `engagement/ContinuousSurveyWidget.tsx:20-99`; `services/continuousEngagementService.ts` rpc `submit_engagement_answer` | Caminho de escrita nunca gravou em produção; validar RLS/erro silencioso no `catch {}` de `ContinuousSurveyWidget.tsx:96` |
| AnswerInput (7 formatos: slider/stars/emoji/cards/bool/%/texto) | 🟨 | `ContinuousSurveyWidget.tsx:143` | via `engagement_answers`(0) | Não | `engagement/AnswerInput.tsx:20-39` | Nada no código; falta uso real |
| PillarHeatmap | 🟨 | `pages/ClimateDiagnostics.tsx:44` | rpc `get_engagement_pillar_scores` → `engagement_answers`(0) | Não | `engagement/diagnostics/PillarHeatmap.tsx:15-45`; migration `20260726160221…sql:24-47` | Depende de respostas + ≥5 respondentes |
| FactorRanking + "Gerar plano" | 🟨 | `pages/ClimateDiagnostics.tsx:41` | rpc `get_engagement_factor_scores` → `engagement_factors`(0), `engagement_answers`(0) | Não | `engagement/diagnostics/FactorRanking.tsx:74-116` | `engagement_factors` sem seed → ranking sempre vazio |
| NpsCards (eNPS/LNPS) | 🟨 | `pages/ClimateDiagnostics.tsx:42` | rpc `get_engagement_nps` | Não (`enps_surveys`=0, `enps_responses`=0) | `engagement/diagnostics/NpsCards.tsx:25-58` | Nenhuma pesquisa eNPS aplicada |
| NpsHistoryChart | 🟨 | `pages/ClimateDiagnostics.tsx:43` | rpc `get_engagement_nps_history` | Não | `engagement/diagnostics/NpsHistoryChart.tsx:53-78` (empty state pronto) | Série histórica nunca terá ponto sem respostas |
| BenchmarkComparison (mercado) | 🟨 | `pages/ClimateDiagnostics.tsx:34` | rpc `get_engagement_pillar_benchmark` → `climate_benchmarks`(**0**) | Não | `engagement/diagnostics/BenchmarkComparison.tsx:97-111` | Tabela de benchmark de mercado **nunca populada** — o seletor setor/porte não tem base alguma |
| CorrelationInsights | 🟨 | `pages/ClimateDiagnostics.tsx:40` | rpc `get_engagement_pillar_correlations` | Não | `engagement/diagnostics/CorrelationInsights.tsx:14-17` (`if top.length===0 return null`) | Componente some silenciosamente hoje |
| AutoInsights (motor de insights) | 🟨 | `pages/ClimateDiagnostics.tsx:32` | puro, sobre `overview/pillars/factors/benchmark/nps` (todos vazios) | Não | `engagement/diagnostics/AutoInsights.tsx:93-98` | Motor completo alimentado por zeros |
| AnonymityGuardNotice | 🟨 | `ClimateDiagnostics.tsx:31`, `Nr1Risks.tsx` | `MIN_RESPONDENTS = 5` | — | `services/engagementDiagnosticsService.ts:12`; `engagement/diagnostics/AnonymityGuardNotice.tsx:14` | **É a tela que o usuário sempre vê** (ver Achados graves #1) |
| ScoreBadge | 🟨 | interno (PillarHeatmap/FactorRanking) | — | Não | `engagement/diagnostics/ScoreBadge.tsx:10` | — |
| Matriz de risco NR-1 + RiskLevelBadge | 🟨 | `pages/Nr1Risks.tsx`, `hooks/useNr1Risk.ts` | rpc `get_nr1_risk_matrix`, `get_nr1_summary`, `generate_action_plan_from_nr1_category` | Não (deriva de `engagement_answers`=0) | `engagement/nr1/Nr1RiskMatrix.tsx:24-98`; migration `20260726161512…sql:66` | Compliance NR-1 completo em UI, sem nenhum dado de origem |
| Planos de ação 5W2H (card + lista) | 🟨 | `pages/ActionPlans.tsx` | `action_plans`(**0**), `action_plan_items`(0), `action_plan_updates`(0) | Não | `engagement/plans/ActionPlanCard.tsx:21-76`; `plans/ActionPlanItemList.tsx:36-123` | Nenhum plano criado, apesar de 3 gatilhos de geração no código (fator, NR-1, opinião) |
| Canal de opiniões (composer/card/tratativa) | 🟨 | `pages/OpinionChannel.tsx` | `opinions`(0), `opinion_responses`(0), `opinion_supports`(0); `sla_targets`(8) tem dado | Não | `engagement/opinions/OpinionComposer.tsx:35-65`; `opinions/OpinionTreatmentDialog.tsx:42-64` | SLA configurado (8 linhas) mas nenhuma manifestação enviada |
| EngagementCharts (StatCard/ChartCard/StrugglingAreas) | 🟨 | `pages/EngagementReports.tsx` | props do page | Parcial | `engagement/EngagementCharts.tsx:75` (`Math.random()` no skeleton), `:137-147` (4 recomendações **hardcoded**) | Bloco "Recomendações de Melhoria" é texto fixo, não derivado de dado |
| **CAMPAIGNS** |
| CampaignCard + CreateCampaignDialog | ✅ | `pages/SalesCampaigns.tsx` | `sales_campaigns`(**5**), `departments`(4) | **Sim** | `campaigns/CampaignCard.tsx:33-106`; `CreateCampaignDialog.tsx:16-54` | — |
| CampaignProgressChart | 🟨 | `pages/SalesCampaignDetail.tsx` | `campaign_progress_events`(**0**) | Não | `campaigns/CampaignProgressChart.tsx:60-67` | 5 campanhas existem mas nenhum evento de progresso foi registrado |
| Equipes de campanha + rateio `team_split` | 🟨 | `pages/SalesCampaignDetail.tsx` | `campaign_teams`(0), `campaign_team_members`(0) | Não | `campaigns/CampaignTeamsPanel.tsx:49-130`; `CampaignTeamHealthAlert.tsx:18` | Diagnóstico de saúde, rateio e podium prontos e nunca exercitados |
| Trilha de auditoria do rateio (+ reversão + CSV) | 🟨 | `campaigns/CampaignTeamsPanel.tsx:153` | `campaign_team_split_batches`, `_entries`, rpc `revert_campaign_team_split` | Não | `campaigns/CampaignTeamSplitTrail.tsx:92-189` | 373 linhas de compliance sem um lote sequer |
| Importação de resultados + reconciliação | 🟨 | `pages/SalesCampaignDetail.tsx` | `campaign_result_imports`(0), `campaign_result_rows`(0), rpc `apply_campaign_import` | Não | `campaigns/CampaignImportDialog.tsx:36-141`; `CampaignReconciliationPanel.tsx:43-89`; `CampaignImportHistory.tsx:26` (`if imports.length===0 return null`) | Fluxo CSV/XLSX completo (fuzzy match, override manual, reversão) nunca usado |
| MyCampaignBadgeCard | 🟨 | `pages/Profile.tsx` | `campaign_participants`(**0**) | Não | `campaigns/MyCampaignBadgeCard.tsx:21-32` | Sempre renderiza o estado "Aceite e conclua uma campanha" |
| CampaignGoalBetPanel (aposta de meta) | 🟦 | `pages/SalesCampaignDetail.tsx` | `prediction_markets` (**não medido**) | Indeterminado | `campaigns/CampaignGoalBetPanel.tsx:26-41`; `services/predictionMarketService.ts:109` | Sem contagem de `prediction_markets` no levantamento — não classificável |
| **MANAGER** |
| ManagerComponents (StatCard/TeamMemberRow/DepartmentCard/AtRiskAlert) | 🟨 | `pages/ManagerDashboard.tsx` | `profiles`(6), `departments`(4) | Sim (base) | `manager/ManagerComponents.tsx:106` — botão **"Ver Detalhes" sem `onClick`** | Botão morto no alerta de risco; `TeamMemberRow` divide por `questsTotal` sem guarda (`:41`) |
| SuccessionPanel + PositionsList + PlanDetails | 🟨 | `pages/ManagerDashboard.tsx` | `positions`(**0**), `user_positions`(0) | Não | `manager/SuccessionPanel.tsx:76-80` — classes Tailwind **dinâmicas** `from-${stat.color}/10`, `bg-${stat.color}/20`, `text-${stat.color}` | JIT não gera essas classes → KPIs sem cor em prod (ver Achados #3) |
| HighPotentialsPanel | 🟨 | `pages/ManagerDashboard.tsx` | `nine_box_evaluations`(0), `development_plans`(0), `kudos`(0), `mood_entries`(0), `trail_enrollments`(0), `attendance_records`(0), `checkins`(0), `user_certifications`(0), `mentorship_pairs`(0); só `goals`(3)/`profiles`(6) têm dado | Quase nada | `manager/HighPotentialsPanel.tsx:40-44`; `services/highPotentialService.ts` (12 tabelas, 10 vazias) | Score de 6 fatores calculado sobre zeros → ranking sem significado |
| TeamCompetencyDashboard + RecommendationsDialog | 🟨 | `pages/ManagerDashboard.tsx` | `module_progress`(0), `kudos`(0), `attendance_streaks`(0), `quest_assignments`(n/m), `user_achievements`(n/m) | Não | `manager/TeamCompetencyDashboard.tsx:68-70` (chave publicável como Bearer), `:43` (`getTopByLevel(20)` = top global, não a equipe) | Ver Achados #4 |
| AICopilotDashboard (alertas + sugestões) | 🟨 | `pages/ManagerDashboard.tsx` | `development_plans`(0), `nine_box_evaluations`(0), `goals`(3), churn (derivado) | Quase nada | `manager/AICopilotDashboard.tsx:41-113`; dispensa só em estado local `:39,140` | Alertas descartados voltam no refresh (sem persistência) |
| ManagerConsolidatedDashboard | 🟨 | `pages/ManagerDashboard.tsx` | idem acima | Não | `manager/ManagerConsolidatedDashboard.tsx:34-52` | Painel 9-Box sempre 0 em todas as 9 células |
| QuestsList / QuestCard / QuestStatsModal | 🟨 | `pages/ManagerDashboard.tsx` (QuestsList) | `custom_quests`, `quest_steps`, `quest_assignments` (**não medidos**) | Indeterminado | `manager/QuestsList.tsx:22-29`; `services/questsService.ts:35` | Sem contagem dessas tabelas no levantamento |
| **TRAILS / LMS** |
| Catálogo de trilhas (TrailCard + TrailStatsCards) | 🟨 | `pages/LearningTrails.tsx` | `learning_trails`(**3**), `trail_enrollments`(**0**), `trail_prerequisites`(0) | Parcial — catálogo sim, matrícula **zero** | `trails/TrailCard.tsx:29-33`; `TrailStatsCards.tsx:12-18` | 3 trilhas publicadas, ninguém matriculado. UI de bloqueio por pré-requisito nunca dispara |
| Editor de módulos (TrailModuleEditor + ModuleDraftForm) | ✅ | `pages/TrailDetail.tsx` | `trail_modules`(**12**) | **Sim** | `trails/TrailModuleEditor.tsx:78-181`; `ModuleDraftForm.tsx:36` | Único fluxo de autoria com produção real comprovada (12 módulos) |
| ModuleViewer (player: vídeo/texto/quiz/flashcard/checklist) | 🟨 | `pages/TrailDetail.tsx`, `TrailModuleEditor.tsx:358` (preview) | `module_progress`(**0**); retomada em localStorage | Não | `lms/ModuleViewer.tsx:559-605`; `lib/playerResume` | 854 linhas (a maior peça do escopo) sem um único módulo concluído |
| AICourseBuilderDialog (gerar trilha por IA) | 🟨 | `pages/LearningTrails.tsx` | `ai_course_jobs`(**0**), edge function `triggerBuild` | Não | `trails/AICourseBuilderDialog.tsx:86-95`; polling `:52` | Nenhum job criado — a geração por IA nunca rodou em prod |
| **ONBOARDING** |
| OnboardingWidget + OnboardingModal | ✅ | `pages/Index.tsx` | `onboarding_progress`(**2**) | **Sim** | `onboarding/OnboardingWidget.tsx:12-28`; `OnboardingModal.tsx:28-119` | — |
| TourSpotlight + TourLauncher + dashboardTour | ✅ | `App.tsx` (ambos), `pages/Index.tsx` (tour) | localStorage (sem tabela) | Sim (não depende de DB) | `onboarding/TourSpotlight.tsx:24`; `TourLauncher.tsx:25`; `tours/dashboardTour.ts:3-96` | — |
| goalsTour / trailsTour / allTours | ⬛ | **nenhum** (só reexportados em `index.ts`) | — | Não | `onboarding/tours/dashboardTour.ts:98,128,151`; `onboarding/index.ts:4` | Tours definidos e nunca registrados em nenhuma rota |
| **CHECKINS** |
| CheckinCard + página de 1:1 | 🟨 | `pages/Checkins.tsx` | `checkins`(**0**), `checkin_templates`(**0**) | Não | `checkins/CheckinCard.tsx:33-90` | Zero 1:1 agendados; sem templates cadastrados |
| CheckinDetailDialog | ⬛ | **nenhum** | `checkins`(0) | Não | `checkins/CheckinDetailDialog.tsx:23`; `pages/Checkins.tsx:7,13,25` importa `Dialog`/`Checkbox`/`moodEmojis` e refaz o diálogo inline | 95 linhas órfãs + lógica duplicada na página |
| OneOnOnePreparationPanel (IA) | 🟨 | `pages/Checkins.tsx:21` | `checkins`(0), `development_plans`(0), `mood_entries`(0), `kudos`(0), `nine_box`(0), `goals`(3) | Quase nada | `checkins/OneOnOnePreparationPanel.tsx:34-61`; `services/oneOnOnePreparationService.ts` | Pauta gerada a partir de 7 tabelas, 6 vazias |
| **GOALS** |
| GoalCard (OKR + Key Results) | ✅ | `pages/Goals.tsx` | `goals`(**3**), `key_results`(**10**) | **Sim** | `goals/GoalCard.tsx:75-282` | Funciona, mas paleta **hardcoded dark-only**: `bg-[#0A0C10]`, `text-white`, `text-slate-400/500/700` (`:88,115,124,137,158`) → ilegível no tema claro |
| **SUCCESSION / POSITIONS / CERTIFICATIONS / ATTENDANCE** |
| PositionsList / SuccessionPlanDetails | 🟨 | `manager/SuccessionPanel.tsx:104-124` | `positions`(0), `user_positions`(0) | Não | `succession/PositionsList.tsx:15-22`; `SuccessionPlanDetails.tsx:74-83` | Empty states são o único caminho executável hoje |
| PositionFormDialog / TaskTemplateFormDialog | 🟨 | `components/admin/PositionsManager.tsx` | `positions`(**0**) | Não | `positions/PositionFormDialog.tsx:28`; `TaskTemplateFormDialog.tsx:35-73` | CRUD pronto (inclusive penalidades de XP) e nenhum cargo cadastrado |
| CertificateActions (PDF + QR de verificação) | 🟨 | `components/CertificationsPanel.tsx` | `user_certifications`(**0**), `certifications`(0) | Não | `certifications/CertificateActions.tsx:26-28` (`if !code \|\| !cert return null`) | Componente sempre retorna `null` em produção |
| AttendanceCharts | 🟨 | `pages/Attendance.tsx` | `attendance_records`(**0**), `attendance_settings`(0), `attendance_streaks`(0) | Não | `attendance/AttendanceCharts.tsx:20-32` | Gráficos com arrays vazios; `formatter` usa `any` (`:51`) |
| **QUEST-BUILDER** |
| BasicInfo/Advanced/Steps + IconPicker + QuestStepEditor + QuestPreview | 🟨 | `pages/QuestBuilder.tsx` | `custom_quests`/`quest_steps` (**não medidos**) | Indeterminado | `quest-builder/QuestFormSections.tsx:34,105,189`; `QuestStepEditor.tsx:20`; `QuestPreview.tsx:33` | Sem contagem dessas tabelas |
| **SEQUENCE (SOP)** |
| SequenceStepList (jogo de ordenação) | ✅ | `pages/SequenceGamePage.tsx` | `sequence_procedures`(**3**), `sequence_steps`(**20**) | **Sim** (conteúdo) | `sequence/SequenceStepList.tsx:17-24` | Conteúdo real publicado; tentativas não medidas |
| SequenceProcedureStatsCard (+ CSV/PDF) | 🟨 | `pages/SequenceProcedureAdminPage.tsx` | `sequence_attempts` (não medido) via `useSequenceProcedureStats` | Indeterminado | `sequence/SequenceProcedureStatsCard.tsx:76,198` (branch `attempts === 0`) | Sem contagem de tentativas |
| **COPILOT** |
| CopilotAlertSection (Urgent/Compact) + CopilotSuggestions | 🟨 | `manager/AICopilotDashboard.tsx:19-22` | fontes vazias (ver AICopilot) | Não | `copilot/CopilotAlertSection.tsx:59,118`; `CopilotSuggestions.tsx:20-21` | — |
| CopilotAlertCard.tsx | ⬛ | **nenhum** | — | — | `copilot/CopilotAlertCard.tsx:50`; duplica `CopilotAlertSection.tsx:24-52` (`getAlertStyle`/`getAlertIconColor`/`CopilotAlert` idênticos) | 115 linhas duplicadas e órfãs |
| **DASHBOARD** |
| DashboardHeader | ✅ | `pages/Index.tsx` | `profiles`, `useUserRank` | Sim | `dashboard/DashboardHeader.tsx:40-49` | **`<MiniStreakTracker streak={7} />` hardcoded** (`:195`) — streak falso no header desktop |
| DashboardLeftColumn / DashboardRightColumn | ✅ | `pages/Index.tsx` | orquestradores (~35 widgets) | Sim | `dashboard/DashboardLeftColumn.tsx:21`; `DashboardRightColumn.tsx:30` | Muitos widgets filhos apontam para tabelas vazias (`kudos`, `mood_entries`, `celebrations`, `enps_surveys`) |
| DashboardFooter | 🟨 | `pages/Index.tsx` | **nenhuma** | Não | `dashboard/DashboardFooter.tsx:30,35,40,57` — "Systems Online", "Security: Max", "Latency: 12ms", "Engine v4.2.0" | Telemetria 100% fictícia exibida como status real |
| LazyWidget | ✅ | `pages/Index.tsx`, colunas | — | Sim | `dashboard/LazyWidget.tsx:18-52` | — |
| DashboardTabs + useDashboardTabs | ⬛ | **nenhum** (nem em `dashboard/index.ts`) | — | Não | `dashboard/DashboardTabs.tsx:33,142`; `dashboard/index.ts:1-5` não o exporta | 163 linhas mortas; ainda contém `useState(() => {…})` usado como `useEffect` (`:152-157`) |
| **STATS / PUSH** |
| PersonalStatsCharts | 🟨 | `pages/PersonalStats.tsx` | `user_achievements`/`quest_assignments` (não medidos) | Indeterminado | `stats/PersonalStatsCharts.tsx:43-51` | Sem contagem dessas tabelas |
| PushDeviceList | 🟨 | `pages/Profile.tsx`, `pages/SecurityDashboard.tsx` | `push_subscriptions`/devices (não medidos) | Indeterminado | `push/PushDeviceList.tsx:61-62` | Sem contagem |
| PushSyncHistory | 🟨 | `pages/Profile.tsx` | histórico de sync (não medido) | Indeterminado | `push/PushSyncHistory.tsx:31-33` | Sem contagem |

---

## Features dormentes

Código completo, rota registrada em `App.tsx`, zero linhas na tabela de destino — prontas para "ligar" com dado, não para declarar entregues:

1. **Diagnóstico de clima completo** (`/engajamento/diagnostico`, `App.tsx:269`) — 9 componentes, 7 RPCs, `engagement_answers` = 0.
2. **Benchmark de mercado** — `climate_benchmarks` = 0; o seletor setor/porte (`BenchmarkComparison.tsx:56-79`) não tem base nenhuma.
3. **Matriz de risco NR-1** (`App.tsx:272`) — compliance legal inteiro em UI, sem fonte de dado.
4. **Planos de ação 5W2H** (`App.tsx:271`) — 3 geradores automáticos (fator, NR-1, opinião) e `action_plans` = 0.
5. **Canal de opiniões** (`App.tsx:270`) — SLA já configurado (`sla_targets`=8), `opinions` = 0.
6. **Coleta contínua de engajamento** — 24 perguntas atribuídas, 0 respostas: dormente **no meio do funil**.
7. **Equipes + rateio coletivo de campanha** — painel, diagnóstico de saúde, auditoria e reversão prontos; `campaign_teams` = 0.
8. **Importação/reconciliação de resultados de campanha** — parser CSV/XLSX, fuzzy match e reversão transacional; `campaign_result_imports` = 0.
9. **Matrículas e player de trilha** — 3 trilhas e 12 módulos publicados, `trail_enrollments` = 0 e `module_progress` = 0.
10. **Geração de trilha por IA** — `ai_course_jobs` = 0.
11. **Check-ins 1:1 + preparação por IA** (`App.tsx:273`) — `checkins` = 0, `checkin_templates` = 0.
12. **Sucessão + cargos + tarefas por cargo** — `positions` = 0 e `user_positions` = 0 travam SuccessionPanel, PositionsManager e HighPotentials.
13. **Certificados (PDF + QR)** — `user_certifications` = 0; `CertificateActions` sempre retorna `null`.
14. **Ponto / assiduidade** — `attendance_records` = 0.
15. **High Potentials e 9-Box** — `nine_box_evaluations` = 0; painel consolidado do gestor mostra 9 zeros.

## Achados graves

**1. O diagnóstico de clima é estruturalmente inalcançável neste tenant, não apenas vazio.**
`MIN_RESPONDENTS = 5` (`services/engagementDiagnosticsService.ts:12`) e a mesma regra no banco (`engagement_min_respondents()` → 5, migration `20260726160221…sql:1-3`, aplicada em `WHERE respondents >= …` na linha 46). Com `profiles = 6` e `departments = 4`, qualquer recorte por departamento precisaria de ≥5 dos ~1,5 colaboradores do departamento. Mesmo que as respostas passassem a existir, a tela só mostraria `AnonymityGuardNotice`. Nove componentes (~1.100 linhas) e sete RPCs ficam inertes por design.

**2. O funil de engajamento está partido no meio — e o erro é engolido.**
`engagement_question_assignments = 24` e `engagement_answers = 0`: perguntas foram distribuídas e nenhuma resposta chegou ao banco. O handler de envio tem `catch {}` vazio (`engagement/ContinuousSurveyWidget.tsx:96-98`) delegando ao hook, então uma falha recorrente de RLS/RPC em `submit_engagement_answer` não deixaria rastro na UI além de um toast. É a causa-raiz única de 6 das 15 features dormentes.

**3. `SuccessionPanel` gera classes Tailwind dinâmicas que o JIT não compila.**
`manager/SuccessionPanel.tsx:76-80`: `` className={`bg-gradient-to-br from-${stat.color}/10 to-${stat.color}/5`} ``, `` `bg-${stat.color}/20` ``, `` `text-${stat.color}` ``. Tailwind faz varredura estática do fonte — `from-green-500/10`, `bg-red-500/20` etc. nunca entram no bundle. Os 4 cards de KPI de sucessão renderizam sem cor nem fundo em produção. Bug visual silencioso, invisível em dev com JIT permissivo.

**4. `TeamCompetencyDashboard` chama edge function com a chave publicável e trata o top-20 global como "minha equipe".**
`manager/TeamCompetencyDashboard.tsx:68-70` envia `Authorization: Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` para `/functions/v1/trail-recommendations` em vez do JWT da sessão — a função não consegue identificar o solicitante nem aplicar RLS/rate-limit por usuário (o código já trata 429/402, o que sugere cobrança por chamada). Na linha 43, `profilesService.getTopByLevel(20)` (`services/profilesService.ts:103-110`: `profiles` ordenado por `level`, sem filtro algum) é usado como a equipe do gestor — qualquer gestor vê os 20 maiores níveis da organização inteira, não seus liderados.

**5. ~373 linhas mortas em 3 arquivos, um deles duplicando lógica ativa.**
- `dashboard/DashboardTabs.tsx` (163 linhas): zero consumidores, nem sequer exportado por `dashboard/index.ts`; contém `useState(() => { … setActiveTab(saved) })` (`:152-157`) usado como se fosse `useEffect` — set-state dentro do inicializador.
- `copilot/CopilotAlertCard.tsx` (115 linhas): órfão e cópia literal de `copilot/CopilotAlertSection.tsx:24-52` (mesmo tipo `CopilotAlert`, mesmos `getAlertStyle`/`getAlertIconColor`). Duas fontes da verdade para o mesmo estilo de alerta.
- `checkins/CheckinDetailDialog.tsx` (95 linhas): órfão, enquanto `pages/Checkins.tsx` importa `Dialog`, `Checkbox` e `moodEmojis` (`:7,13,25`) e reimplementa o mesmo diálogo inline.

**Menções honrosas (não entram no top 5):** `manager/ManagerComponents.tsx:106` — botão "Ver Detalhes" do alerta de risco sem `onClick`; `dashboard/DashboardFooter.tsx:30-57` — "Systems Online / Security: Max / Latency: 12ms / Engine v4.2.0" totalmente fabricado; `dashboard/DashboardHeader.tsx:195` — `streak={7}` hardcoded; `goals/GoalCard.tsx:88-158` — paleta dark-only com hex e `text-slate-*` fixos, quebrando o tema claro; `engagement/EngagementCharts.tsx:137-147` — as 4 "Recomendações de Melhoria" são texto fixo apresentado como análise.

---

## UI, Segurança, Auth e Mobile

# Auditoria de estado — `src/components/{security,auth,effects,mobile,accessibility,ui}`

Repo: `/home/user/task-gifts-v2` · data da medição: 2026-08-16
Método: leitura integral de security/ (16), auth/ (7), effects/ (8), mobile/ (15), accessibility/ (5) = **51 arquivos**.
ui/ (67 arquivos) auditado **em altitude** (inventário + grep de importadores + inspeção pontual), conforme escopo.
Evidências de backend (fora do escopo, citadas como prova): `src/services/*`, `src/hooks/*`, `src/pages/Auth.tsx`, `src/lib/edgeAvailability.ts`, `supabase/migrations/*`, `supabase/functions/verify-ip/index.ts`.

Legenda: ✅ IMPLEMENTADO_TOTAL · 🟨 IMPLEMENTADO_PARCIAL · 🟦 SUGERIDO_OU_INICIADO · ⬛ MORTO_OU_ABANDONADO

---

## Segurança e Auth

### `src/components/security/` (16 arquivos, 3.285 linhas)

| Arquivo | Consumidores (grep) | Tabela / RPC / Edge | Estado real medido | Cls |
|---|---|---|---|---|
| `index.ts` (12 ln) | **NENHUM** — nenhum arquivo importa `@/components/security` (grep global vazio); todos os consumidores usam caminho direto | — | Barrel de 11 exports sem um único importador. `ReauthProvider`/`useReauth` só existem aqui (`index.ts:8`) | ⬛ |
| `SecurityAlertsPanel.tsx` (416) | `pages/SecurityDashboard.tsx`, `pages/RateLimitDashboard.tsx` | `security_alerts` SELECT `:63-67`, UPDATE `:103-110`, realtime INSERT `:75-94` | Código completo (filtros, runbook, resolução). **`security_alerts` = 0 linhas em produção** → painel sempre vazio; realtime nunca dispara | 🟨 |
| `PasskeysPanel.tsx` (353) | `pages/SecurityDashboard.tsx` | via `useWebAuthn` → `webauthn_credentials` (`services/webauthnService.ts:112,200,305,327,356,373,387`) | CRUD completo de passkeys. **`webauthn_credentials` = 0** → lista sempre vazia. Texto afirmativo "Não pode ser roubado por phishing" (`:261`) sobre um recurso sem verificação de assinatura no servidor (ver Achado #2) | 🟨 |
| `BlockedIPsPanel.tsx` (285) | `SecurityAdminTab.tsx:6`, `pages/RateLimitDashboard.tsx`, `pages/SecurityDashboard.tsx` | `blocked_ips` via `securityService.getBlockedIPs/blockIP/unblockIP` (`services/securityService.ts:38,46,52`) | UI de bloqueio manual funcional. **`blocked_ips` = 0** → nenhum IP bloqueado; nenhum enforcement no cliente lê esta tabela | 🟨 |
| `RateLimitRulesPanel.tsx` (272) | `SecurityAdminTab.tsx:8`, `pages/RateLimitDashboard.tsx`, `pages/SecurityDashboard.tsx` | `rate_limit_rules` (`services/securityService.ts:59,70,76,83,89`) | CRUD de regras completo. **`rate_limit_rules` = 0 e `rate_limit_logs` = 0** → nenhuma regra cadastrada, nenhum log. O switch "Ativo" (`:230-233`) liga uma regra que não existe | 🟨 |
| `ReauthProvider.tsx` (244) | **NENHUM** — `grep -rn "useReauth\|ReauthProvider"` retorna só `index.ts:8` e o próprio arquivo | `supabase.auth.signInWithPassword` `:70`; `useTwoFactor.verifyToken` `:104` | Provider de re-autenticação para ações sensíveis **nunca montado na árvore React**. `requireReauth` nunca é chamado. Nenhuma ação sensível do app exige reauth | ⬛ |
| `SessionsPanel.tsx` (242) | `pages/SecurityDashboard.tsx`, `pages/RateLimitDashboard.tsx` | `session_logs` SELECT `:44-48`, UPDATE `:56-62`, `:77-84` | "Encerrar sessão" apenas grava `is_active=false` em `session_logs` — **não revoga o JWT** nem chama `auth.admin.signOut`. É um flag cosmético. **`session_logs` = 0** → tabela vazia; `import { useMemo }` (`:1`) não usado | 🟨 |
| `DevicesPanel.tsx` (196) | `pages/SecurityDashboard.tsx` | `user_devices`, `new_device_alerts` via `hooks/useDeviceDetection.ts:124,139,155,167,182` | Confiar/remover dispositivo implementado. **`user_devices` = 0, `new_device_alerts` = 0** → sempre "Nenhum dispositivo registrado" | 🟨 |
| `LoginAttemptsPanel.tsx` (149) | `SecurityAdminTab.tsx:7`, `pages/RateLimitDashboard.tsx`, `pages/SecurityDashboard.tsx` | `login_attempts` SELECT `:31-36`, `refetchInterval: 30000` `:39` | Único controle com dado real: **`login_attempts` = 1 linha**. Alimentado por `hooks/useLoginLockout.ts:54` (`log_login_attempt`) | 🟨 |
| `SecurityOverviewTab.tsx` (165) | `pages/SecurityDashboard.tsx` | Nenhuma — 100% props | Componente puramente apresentacional. **Problema: o score circular (`:36-46`) e o card "Sua conta está bem protegida!" (`:111-116`) derivam de contadores que hoje são todos 0** — a ausência de alertas é lida como segurança | ✅ (código) / ver Achado #4 |
| `PushOutboxHealthPanel.tsx` (231) | `SecurityAdminTab.tsx:9` | RPC `get_push_outbox_health` `:56`, RPC `requeue_push_outbox` `:67` — ambas existem nas migrations | Painel completo e funcional, com mutation de reenfileiramento real. Não é controle de segurança (é saúde de fila de push) | ✅ |
| `PushOutboxHealthTrend.tsx` (144) | `SecurityAdminTab.tsx:10` | RPC `get_push_outbox_health_trend` `:47` (existe) | Série 48h + regressão linear local (`:29-41`). Funcional | ✅ |
| `SecurityNotificationsToggle.tsx` (223) | `pages/SecurityDashboard.tsx` | `localStorage['security-notification-prefs']` `:23,37`; `useSecurityPushNotifications` | **Os 4 toggles não controlam nada.** `grep -rn "security-notification-prefs"` só encontra este arquivo. `hooks/useSecurityPushNotifications.ts:91,119,139,164` assina os 4 canais (`security_alerts`, `new_device_alerts`, `blocked_ips`, `login_attempts`) **incondicionalmente**. Desligar um switch não filtra nenhuma notificação | 🟨 |
| `SlaTargetEditor.tsx` (146) | `pages/SecurityRunbook.tsx` | `sla_targets` via `lib/slaTargets.ts:145,156` (tabela existe) | Validação pura + persistência real. Funcional | ✅ |
| `AlertHeatmap.tsx` (139) | `pages/SecurityRunbook.tsx` | RPC `get_alert_heatmap_30d` `:25` (existe) | Heatmap + export CSV funcional. Com `security_alerts` = 0, renderiza "Sem alertas no período. 🎉" (`:93-95`) | 🟨 |
| `SecurityAdminTab.tsx` (68) | `pages/SecurityDashboard.tsx` | Composição de 5 painéis | Apenas composição/tabs | ✅ |

### `src/components/auth/` (7 arquivos, 934 linhas)

| Arquivo | Consumidores | Tabela / RPC / Edge | Estado real medido | Cls |
|---|---|---|---|---|
| `AuthFormContent.tsx` (273) | `pages/Auth.tsx` | — (props) | Formulário login/signup/forgot + lockout visual. Lockout real vem de `hooks/useLoginLockout.ts:28` (RPC `check_login_lockout`) | ✅ |
| `TwoFactorSetup.tsx` (228) | `pages/SecurityDashboard.tsx`, `pages/Profile.tsx` | `user_two_factor` via `services/twoFactorService.ts:70,82,124,177` | UI de setup TOTP completa (QR via `qrcode`, secret, backup codes). Escreve `totp_secret` e `backup_codes` **em texto puro** na tabela. **`user_two_factor` = 0 linhas** → nenhum usuário ativou | 🟨 |
| `TwoFactorVerify.tsx` (108) | `AuthFormContent.tsx:7` | — (callback) | InputOTP + auto-submit. Corretamente delega a verificação. **O verificador a jusante é furado** — ver Achado #1 | 🟨 |
| `AuthScreens.tsx` (100) | `pages/Auth.tsx` | — (props) | `IpCheckingScreen`/`IpBlockedScreen`/`AuthLoadingScreen`. **`IpBlockedScreen` é inalcançável na configuração atual** — ver Achado #3 | 🟨 |
| `PasskeyLogin.tsx` (95) | **NENHUM** | `webauthnService.authenticate` + `supabase.auth.getSession` `:39` | **Zero importadores.** Além disso, o próprio código documenta que a biometria não emite sessão (`:35-46`): se não houver sessão prévia do backend, aborta. Ou seja, mesmo que fosse montado, **login por passkey nunca funcionaria** | ⬛ |
| `GoogleOAuthButton.tsx` (42) | `pages/Auth.tsx` | — (callback `onClick`) | Botão puro; o handler está em `pages/Auth.tsx` | ✅ |
| `AuthBranding.tsx` (88) | `pages/Auth.tsx` | — | Branding + background animado. Features listadas (`:33-38`) são texto de marketing estático | ✅ |

### Veredito dos 6 controles de segurança

**1. 2FA / TOTP — 🟨 (com bypass total no login)**
- UI existe: `auth/TwoFactorSetup.tsx` (setup), `auth/TwoFactorVerify.tsx` (verificação).
- Grava em **`user_two_factor`** (`services/twoFactorService.ts:37,70,82,99,125,139,155,177,191`) — colunas `totp_secret` (texto puro), `backup_codes` (array texto puro).
- TOTP real via `otpauth` (`twoFactorService.ts:3,54-63,108-117`) — não é mock.
- **0 linhas em produção** → nenhum usuário tem 2FA; o gate nunca é exercido.
- **Bypass:** `pages/Auth.tsx:185` faz `supabase.auth.signOut()` **antes** de `handle2FAVerify`. `twoFactorService.verifyToken` (`:138-146`) então roda como `anon`; a RLS de SELECT em `user_two_factor` é `TO authenticated USING (auth.uid() = user_id)` (`supabase/migrations/20251231024756_...sql:17-20`) → a query falha → `if (error || !data?.is_enabled) return true;` (`:144-146`) → **qualquer código de 6 dígitos passa**.
- **Backup codes com `Math.random()`** (`twoFactorService.ts:26-33`) — 6 chars base36, ~31 bits, não-criptográfico.

**2. WebAuthn / Passkeys — 🟨 (registro), ⬛ (login)**
- UI: `security/PasskeysPanel.tsx` (registro/rename/remove) e `auth/PasskeyLogin.tsx` (**órfão, 0 importadores**).
- Tabelas: **`webauthn_credentials`** e **`webauthn_challenges`** (`services/webauthnService.ts:104,112,200,217,243,305,327,336,356,373,387`), RPCs `get_passkeys_by_email` e `user_has_passkeys` (existem nas migrations).
- **`webauthn_credentials` = 0, `webauthn_challenges` = 0** → nada registrado.
- **A "verificação" é falsa:** `webauthnService.authenticate` (`:271-345`) **nunca verifica `response.signature` contra `public_key`**, e o `clientDataJSON` é parseado (`:311`) mas o `challenge` **nunca é comparado**. A única checagem é o contador anti-replay (`:314-319`).
- Mitigado apenas por acidente: `PasskeyLogin.tsx:39-46` exige sessão Supabase pré-existente, o que torna o login por passkey **inoperante** em vez de inseguro.

**3. IP whitelist / Geo-blocking — 🟨 → efetivamente ⬛ na config atual**
- UI de whitelist: `components/admin/IpWhitelistManager.tsx` (fora do meu escopo) via `hooks/useIpWhitelist.ts` → `services/ipWhitelistService.ts:40,52,69,82,95` (`ip_whitelist`, `ip_access_logs`) + RPCs `is_ip_whitelisted`, `log_ip_access`.
- Telas de bloqueio: `auth/AuthScreens.tsx` (`IpCheckingScreen`, `IpBlockedScreen`).
- Edge: `supabase/functions/verify-ip/index.ts`, `supabase/functions/verify-geo/index.ts`.
- **Todas as tabelas vazias**: `ip_whitelist`=0, `blocked_ips`=0, `geo_allowed_countries`=0, `geo_blocking_rules`=0, `ip_access_logs`=0, `geo_access_logs`=0 (`geo_settings`=1).
- **Fail-open explícito no servidor**: `verify-ip/index.ts:48-58` — whitelist com 0 ativos → `allowed: true, reason: 'whitelist_empty'`; erro de contagem → `allowed: true` (`:36-45`).
- **Fail-open explícito no cliente, e pior**: `.env:25` tem `VITE_DEPLOYED_EDGE_FUNCTIONS=` **vazio**; `lib/edgeAvailability.ts:49` retorna `false` quando a allowlist está vazia; `pages/Auth.tsx:51-55` então faz `setIsIpAllowed(true)` **sem sequer chamar a edge function**. Também `:61-68` e `:74-77` fazem fail-open em erro/exceção.
- Resultado: `IpBlockedScreen` é código inalcançável.

**4. Rate limiting — 🟨 → nada ativo**
- UI: `security/RateLimitRulesPanel.tsx` (CRUD completo), `pages/RateLimitDashboard.tsx`.
- Tabela: `rate_limit_rules` (`services/securityService.ts:59-93`).
- **`rate_limit_rules` = 0 e `rate_limit_logs` = 0** → nenhuma regra cadastrada, nenhuma requisição jamais contabilizada.
- Nenhum ponto do frontend consulta `rate_limit_rules` para aplicar limite; a tabela é só administrada. Enforcement existiria em edge (`send-rate-limit-alert`, `cleanup-rate-limit-logs`) mas com 0 regras nada é aplicado.

**5. Audit logs / session logs / alertas — 🟨 → sem dado**
- `security_alerts` = 0 → `SecurityAlertsPanel.tsx` e `AlertHeatmap.tsx` sempre vazios; o realtime `INSERT` (`SecurityAlertsPanel.tsx:75-94`) nunca dispara.
- `session_logs` = 0 → `SessionsPanel.tsx` sempre vazio; além disso "Encerrar Todas" (`:75-95`) só marca flag, **não invalida sessões**.
- `audit_logs` = 0 → consumido por `components/admin/AdminChangeHistory.tsx`, `services/auditService.ts` (fora do escopo), sem dado.
- `login_attempts` = 1 → **único sinal vivo**, alimentado por `useLoginLockout`.

**6. Devices / new-device alerts — 🟨 → sem dado**
- UI: `security/DevicesPanel.tsx` + bloco "Acessos Recentes de Novos Dispositivos" em `SecurityOverviewTab.tsx:121-139`.
- Tabelas: `user_devices`, `new_device_alerts` (`hooks/useDeviceDetection.ts:124,139,155,167,182`).
- **Ambas = 0** → nenhum dispositivo rastreado, nenhum alerta. `SecurityOverviewTab.tsx:62` exibe "0 registrados" como se fosse estado saudável.

---

## Mobile / Effects / Acessibilidade

### `mobile/` (15 arquivos, 1.815 linhas)

| Arquivo | Consumidores (grep, exclui stories) | Estado | Cls |
|---|---|---|---|
| `MobileBottomNav.tsx` (285) | `App.tsx`, `pages/Index.tsx`, `MobilePageLayout.tsx:12` | Nav + bottom sheet arrastável. **Rotas hardcoded** (`:15-31`) sem checagem de permissão — "Painel Admin" `/admin` (`:29`) aparece para todo usuário. **Dot de notificação sempre visível** (`:265-270`), não ligado a contador algum | 🟨 |
| `MobilePageLayout.tsx` (206) | 14 páginas (`Profile`, `SocialFeed`, `Leagues`, `DailyQuiz`, …) | Layout mobile completo. `PullToRefresh` faz `window.location.reload()` (`:184`) com comentário `"Simple reload for now"` — refresh não-granular | 🟨 |
| `PullToRefresh.tsx` (103) | `components/navigation/PageShell.tsx`, `MobilePageLayout.tsx:10` | Funcional, com háptico | ✅ |
| `ScrollToTopFAB.tsx` (54) | `App.tsx`, `MobilePageLayout.tsx:13` | Funcional | ✅ |
| `NetworkStatusBar.tsx` (66) | `App.tsx` | Funcional via `useNetworkPendingIndicator` | ✅ |
| `SwipeableCard.tsx` (187) | **só stories** | Componente completo, sem uso em produção | 🟦 |
| `SwipeableListItem.tsx` (163) | **só stories** | Idem | 🟦 |
| `GestureHandler.tsx` (145) | **NENHUM** | Órfão. Prop `onPinch` declarada (`:18`) e **nunca desestruturada nem implementada**. Exporta um `useSwipeBack` próprio (`:137-145`) que **colide conceitualmente** com `@/hooks/useSwipeBack` (o realmente usado) | ⬛ |
| `LazyImage.tsx` (156) | **NENHUM** | Órfão. Com `nativeLazy=true` (default) o IntersectionObserver é curto-circuitado (`:53-56`) — a lógica de observer é código morto no caminho padrão | ⬛ |
| `MobileSkeleton.tsx` (145) | **NENHUM** (6 presets exportados) | Órfão completo — `ui/skeleton.tsx` cobre o caso | ⬛ |
| `SwipeablePage.tsx` (92) | **NENHUM** | Órfão; `MobilePageLayout` reimplementou o swipe-back inline (`:72-107`) | ⬛ |
| `MobileHidingHeader.tsx` (71) | **NENHUM** | Órfão | ⬛ |
| `MobileInput.tsx` (51) | **NENHUM** | Órfão | ⬛ |
| `HapticWrapper.tsx` (68) | **NENHUM** | `withHapticFeedback` e `useHapticClick` sem nenhum consumidor | ⬛ |
| `index.ts` (23) | **NENHUM** | Barrel sem importadores; todos usam caminho direto | ⬛ |

**Resumo mobile: 4 ✅ / 2 🟨 / 2 🟦 / 7 ⬛.** Metade do diretório (≈900 linhas) é código não referenciado.

### `effects/` (8 arquivos, 1.883 linhas)

Todos têm consumidor. `Math.random()` presente é **puramente cosmético** (posição/velocidade de partículas), não decide recompensa:

| Arquivo | Consumidor | Observação | Cls |
|---|---|---|---|
| `AnimatedLevelIndicator.tsx` (277) | `components/StatsGrid.tsx` | Som via `useSoundEffects`; guard `hasPlayedSound` | ✅ |
| `AnimatedTrophyIndicator.tsx` (261) | `StatsGrid.tsx` | Idem | ✅ |
| `AnimatedCoinsIndicator.tsx` (238) | `StatsGrid.tsx` | Idem. Não aceita `playSound` (dispara sempre que `coins>=100`, `:17`) — inconsistente com os irmãos | ✅ |
| `AnimatedFireIndicator.tsx` (225) | `StatsGrid.tsx` | Idem | ✅ |
| `AnimatedXPParticles.tsx` (159) | `StatsGrid.tsx` | 6× `Math.random()` cosmético | ✅ |
| `MiniConfetti.tsx` (204) | `StatsGrid.tsx` | 8× `Math.random()`; `:167` chama `Math.random()` **dentro do `style` de render** (borda 50%/2px) → valor muda a cada re-render | ✅ |
| `ComboExplosion.tsx` (225) | `components/ComboIndicator.tsx` | Também exporta `ComboShockwave` (`:197`) — **sem consumidor** | ✅ (parcial: 1 export morto) |
| `WeeklyChallengeVictory.tsx` (294) | `components/WeeklyChallengeCard.tsx` | `canvas-confetti` em 4 rajadas | ✅ |

### `accessibility/` (5 arquivos, 558 linhas)

| Arquivo | Consumidores | Estado | Cls |
|---|---|---|---|
| `AccessibilityProvider.tsx` (175) | **montado** em `components/Providers.tsx:11,43` | Contexto real: persiste em `localStorage['accessibility-settings']`, aplica classes `reduce-motion`/`high-contrast`/`font-large`/`focus-visible-enabled` no `<html>` (`:89-120`). **`screenReaderMode` e `hapticsEnabled` são gravados mas nunca aplicados** no efeito de `:89-120` | 🟨 |
| `SkipLinks.tsx` (56) | `App.tsx:10,320` | Montado e funcional. **Depende de alvos `#main-content`, `#main-nav`, `#search-input`** (`:16-18`) — não verifiquei a existência de todos os âncoras | 🟨 |
| `AccessibilitySettings.tsx` (201) | **só `index.ts` e `stories/accessibility/`** | UI de configuração de acessibilidade **sem rota/página no app** — usuário não tem como abrir | ⬛ |
| `FocusTrap.tsx` (122) | **só `index.ts`** | Implementação completa de focus trap, **zero uso** (Radix já faz trap nos dialogs) | ⬛ |
| `index.ts` (4) | `App.tsx:10`, `Providers.tsx:11`, `shop/__tests__/…` | Barrel usado | ✅ |

---

## UI primitives (altitude)

67 arquivos, 9.656 linhas. Classificação por origem:

**shadcn/ui padrão (49)** — `accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip, use-toast`
Ressalva: `skeleton.tsx` (700 ln, 36 exports) e `sidebar.tsx` (643 ln) estão listados como shadcn mas o primeiro foi **massivamente estendido** (ver abaixo).

**Customizados / não-shadcn (18):**

| Arquivo | ln | Consumidores | Nota | Cls |
|---|---|---|---|---|
| `skeleton.tsx` | 700 | 153 | shadcn base (~15 ln) + **36 variantes de domínio** (`SkeletonDuel`, `SkeletonKudos`, `SkeletonMission`, `SkeletonCertification`…). Muito usado | ✅ |
| `micro-interactions.tsx` | 471 | **0** | 12 exports (`Ripple`, `PressableButton`, `HeartLike`, `AnimatedNumber`, `FloatingReward`, `AnimatedProgress`, `Shakeable`, `BounceIn`, `GlowPulse`, `StaggerContainer`, `StaggerItem`, `useRipple`). **Nenhum importador, nem em stories** | ⬛ |
| `loading-state.tsx` | 395 | 2 (`admin/MoodAnalytics`, `quiz/QuizDailyRanking`) + reexport em `states.ts` | Subutilizado | 🟨 |
| `daily-challenges.tsx` | 394 | `dashboard/DashboardRightColumn.tsx:53` — **sem props** | `sampleChallenges` hardcoded (`:49`, default em `:252`) → **dados fictícios no dashboard** | 🟨 |
| `power-ups.tsx` | 366 | `dashboard/DashboardLeftColumn.tsx:51` — **sem props** | `defaultPowerUps` (`:34`) + `userCoins = 500` hardcoded (`:87`) | 🟨 |
| `gamified-toast.tsx` | 336 | `contexts/GamificationContext.tsx` | Em uso | ✅ |
| `team-challenges.tsx` | 334 | `DashboardLeftColumn.tsx:113` — **sem props** | `defaultChallenges` hardcoded (`:45`, `:98`) | 🟨 |
| `weekly-goals-tracker.tsx` | 327 | `DashboardRightColumn.tsx:61` — **sem props** | `defaultGoals` (`:29`) + `daysRemaining = 3` (`:89`) hardcoded | 🟨 |
| `level-up-celebration.tsx` | 326 | `contexts/GamificationContext.tsx` | Em uso; `Math.random()` cosmético | ✅ |
| `lucky-drop.tsx` | 324 | `DashboardLeftColumn.tsx:30` (`LuckyDropTrigger`) | **Sorteio 100% client-side** (`:61-75`) e `handleClaim` com **corpo vazio, só comentários** (`:260-263`) → recompensa nunca persistida | 🟨 |
| `micro-quest-card.tsx` | 316 | `DashboardLeftColumn.tsx:48` — **sem props** | `sampleMicroQuests` hardcoded (`:233`, `:278`) | 🟨 |
| `daily-login-bonus.tsx` | 295 | `DashboardLeftColumn.tsx:41` — **sem props** | `currentStreak = 4` e `defaultRewards` hardcoded (`:28`, `:42-43`) | 🟨 |
| `streak-tracker.tsx` | 274 | `DashboardRightColumn.tsx:44` (sem props) e `DashboardHeader.tsx:195` (`MiniStreakTracker streak={7}`) | `defaultStreakData` (`:24`) + **`streak={7}` literal no header** | 🟨 |
| `command-trigger.tsx` | 241 | `App.tsx`, `dashboard/DashboardHeader.tsx` | Em uso. `FloatingCommandHint` (`:161`) sem consumidor | ✅ |
| `responsive-dialog.tsx` | 211 | **0** | 8 exports, nenhum importador | ⬛ |
| `empty-state.tsx` | 128 | 14 | Bem adotado | ✅ |
| `spinner.tsx` | 52 | **0** | Órfão | ⬛ |
| `all-select-item.tsx` | 15 | 9 | Em uso | ✅ |
| `states.ts` | 9 | 1 (`pages/Feedback.tsx`) | Barrel de reexport quase morto | 🟦 |

### Órfãos em `ui/` — ZERO importadores no repo inteiro (incl. stories e testes)

Medido com `grep -rl "ui/<nome>\"\|ui/<nome>'"` + verificação de imports relativos internos ao diretório:

1. `ui/aspect-ratio.tsx` (5 ln) — shadcn
2. `ui/carousel.tsx` (224) — shadcn
3. `ui/context-menu.tsx` (178) — shadcn
4. `ui/hover-card.tsx` (27) — shadcn
5. `ui/menubar.tsx` (207) — shadcn
6. `ui/navigation-menu.tsx` (120) — shadcn
7. `ui/pagination.tsx` (81) — shadcn
8. **`ui/sidebar.tsx` (643)** — shadcn; o app usa `components/sidebar/` (dir próprio) via `components/AppSidebar.tsx:11`
9. **`ui/micro-interactions.tsx` (471)** — customizado
10. **`ui/responsive-dialog.tsx` (211)** — customizado
11. `ui/spinner.tsx` (52) — customizado
12. `ui/use-toast.ts` (3) — 21 arquivos importam `@/hooks/use-toast`, **nenhum** importa `@/components/ui/use-toast`

**Quase-órfão:** `ui/resizable.tsx` (37) — só `stories/layout/Containers.stories.tsx:5`.

**Total morto em `ui/`: ~2.259 linhas (≈23% do diretório).**

---

## Achados graves

### 1. 🔴 Bypass completo do 2FA no login (código, não configuração)
`pages/Auth.tsx:185` chama `supabase.auth.signOut()` antes de exibir a tela de verificação. `services/twoFactorService.ts:138-146`:
```ts
const { data, error } = await supabase.from("user_two_factor")
  .select("totp_secret, backup_codes, is_enabled").eq("user_id", userId).single();
if (error || !data?.is_enabled) {
  return true; // 2FA not enabled, allow access
}
```
Nesse ponto o cliente é `anon`. A RLS de SELECT é `TO authenticated USING (auth.uid() = user_id)` (`supabase/migrations/20251231024756_983ec7a4-23bf-410d-b0f6-9d33d9a60fbc.sql:17-20`) → a query nunca retorna a linha → **`verifyToken` retorna `true` para qualquer código**, e `Auth.tsx:216` conclui o login. A UI (`TwoFactorSetup.tsx:112-122` "Ativado", `SecurityOverviewTab.tsx:55-57` "MFA Ativado") afirma proteção que não existe. Só não está sendo explorado porque `user_two_factor` tem **0 linhas** — o branch nunca é alcançado hoje.
*Agravantes:* `totp_secret` e `backup_codes` gravados em texto puro (`twoFactorService.ts:72-73,84-86`); backup codes gerados com `Math.random()` (`:26-33`).

### 2. 🔴 WebAuthn sem verificação criptográfica de assinatura
`services/webauthnService.ts:271-345` (`authenticate`): busca a credencial pelo `credential_id`, checa o contador (`:314-319`) e **retorna `success: true` com o `user_id`** — sem nunca verificar `response.signature` contra `credential.public_key`, e sem comparar o `challenge` do `clientDataJSON` (parseado em `:311`, descartado). Qualquer cliente que conheça um `credential_id` válido obteria `success`. Isso não é explorável hoje por dois acidentes: `webauthn_credentials` = 0 e `auth/PasskeyLogin.tsx:39-46` exige uma sessão Supabase pré-existente (tornando o fluxo inoperante). `security/PasskeysPanel.tsx:260-261` anuncia ao usuário "Mais seguro que senhas tradicionais / Não pode ser roubado por phishing".

### 3. 🔴 IP whitelist / geo-blocking desativados por fail-open em duas camadas
- **Cliente:** `.env:25` → `VITE_DEPLOYED_EDGE_FUNCTIONS=` (vazio). `lib/edgeAvailability.ts:48-50`: allowlist vazia ⇒ `isFunctionDeployed()` = `false`. `pages/Auth.tsx:51-55`: nesse caso `setIsIpAllowed(true)` **sem chamar a edge function**. Erro (`:61-68`) e exceção (`:74-77`) também liberam.
- **Servidor:** `supabase/functions/verify-ip/index.ts:48-58` — `ip_whitelist` com 0 ativos ⇒ `allowed: true`; erro de contagem ⇒ `allowed: true` (`:36-45`).
- Todas as tabelas relacionadas vazias (`ip_whitelist`, `blocked_ips`, `geo_allowed_countries`, `geo_blocking_rules`, `ip_access_logs`, `geo_access_logs` = 0).
- Consequência: `auth/AuthScreens.tsx:43-92` (`IpBlockedScreen`) é **código inalcançável**, e `IpCheckingScreen` nunca chega a validar nada. O painel `components/admin/IpWhitelistManager.tsx` sugere um controle ativo que está integralmente desligado.

### 4. 🟠 Dashboard de segurança comunica "protegido" a partir de tabelas vazias
`security/SecurityOverviewTab.tsx:111-116` renderiza **"Sua conta está bem protegida! / Todas as configurações de segurança recomendadas estão ativas"** quando `!stats?.unresolved_alerts` e não há dispositivos não-confiáveis. Com `security_alerts`=0, `user_devices`=0, `session_logs`=0, `blocked_ips`=0, `rate_limit_logs`=0, essas condições são satisfeitas **por ausência de telemetria**, não por segurança. Os 5 cards de `:141-162` exibem `0` com legendas "Últimas 24h"/"Ativos agora". Somado: `SecurityNotificationsToggle.tsx:145-199` — os 4 switches gravam em `localStorage['security-notification-prefs']` (`:37`) que **nenhum outro arquivo lê** (grep global); `hooks/useSecurityPushNotifications.ts:91,119,139,164` assina os 4 canais incondicionalmente. E `SessionsPanel.tsx:56-62,77-84` "encerra" sessões apenas marcando `is_active=false` — **não revoga JWT**.

### 5. 🟠 Dashboard principal renderiza gamificação 100% fictícia
Sete widgets são montados **sem nenhuma prop**, caindo nos defaults hardcoded, e **nenhum deles toca o Supabase** (grep por `supabase|useQuery` nos 7 arquivos: zero ocorrências):
- `DashboardLeftColumn.tsx:30` `<LuckyDropTrigger />` → sorteio client-side `Math.random()` (`ui/lucky-drop.tsx:61-75`) e `handleClaim` **com corpo vazio** (`:260-263`) — recompensa nunca persistida
- `:41` `<DailyLoginBonus />` → `currentStreak = 4` (`ui/daily-login-bonus.tsx:42`)
- `:48` `<MicroQuestsList />` → `sampleMicroQuests` (`ui/micro-quest-card.tsx:233,278`)
- `:51` `<PowerUps />` → `defaultPowerUps` + `userCoins = 500` (`ui/power-ups.tsx:34,85,87`)
- `:113` `<TeamChallengesNew />` → `defaultChallenges` (`ui/team-challenges.tsx:45,98`)
- `DashboardRightColumn.tsx:44,53,61` → `defaultStreakData` / `sampleChallenges` / `defaultGoals`
- `DashboardHeader.tsx:195` → `<MiniStreakTracker streak={7} />` literal

### Menções honrosas (não entram no top 5)
- **`security/ReauthProvider.tsx` (244 ln) nunca montado** — `grep -rn "useReauth\|ReauthProvider"` só encontra `index.ts:8`. Nenhuma ação sensível do app pede re-autenticação, apesar do componente existir pronto.
- **`components/security/index.ts` tem zero importadores** — 11 exports órfãos; os consumidores reais usam caminhos diretos.
- **`accessibility/AccessibilitySettings.tsx` sem rota** — a única UI de acessibilidade do produto não é alcançável pelo usuário (só via Storybook).
- **~3.150 linhas mortas no meu escopo**: ~2.259 em `ui/` (12 órfãos) + ~750 em `mobile/` (7 órfãos) + `ReauthProvider` (244) + `PasskeyLogin` (95) + `FocusTrap` (122) + `AccessibilitySettings` (201).

---

## Contagem final

**Arquivos lidos integralmente: 51** (security 16, auth 7, effects 8, mobile 15, accessibility 5).
**Arquivos de `ui/` inventariados em altitude: 67.**

| Classificação | security | auth | effects | mobile | a11y | ui (custom) | Total |
|---|---|---|---|---|---|---|---|
| ✅ IMPLEMENTADO_TOTAL | 5 | 3 | 8 | 4 | 1 | 5 | **26** |
| 🟨 IMPLEMENTADO_PARCIAL | 9 | 3 | 0 | 2 | 2 | 9 | **25** |
| 🟦 SUGERIDO_OU_INICIADO | 0 | 0 | 0 | 2 | 0 | 1 | **3** |
| ⬛ MORTO_OU_ABANDONADO | 2 | 1 | 0 | 7 | 2 | 3 | **15** |

(Coluna `ui (custom)` cobre os 18 componentes não-shadcn; os 12 órfãos shadcn estão listados na seção de órfãos e não entram nesta tabela.)

---

