# Dimensão 1 — Páginas e Rotas

> Documento de detalhe da auditoria de estado — 82 páginas, 83 rotas.
> Evidência em `arquivo:linha`. Correções da Fase D estão em `ESTADO_ATUAL.md` e em `04-dados-e-runtime.md`.
> Runtime de build/teste = `NAO_VERIFICADO` (node_modules ausente no ambiente da auditoria).

---

## Lote A — 41 páginas

# Auditoria de Estado — Lote pages-A (41 páginas, 10.343 linhas)

Método: leitura integral dos 41 arquivos + `src/App.tsx` (rotas) + rastreio da camada
`hooks/ → services/ → supabase.from|rpc`. Nada herdado de documentação.

Rotas: **todas as 41 páginas estão registradas em `src/App.tsx`** (linhas 218–300). Nenhuma órfã por rota.

| Página | Rota | Classificação | Evidência (arquivo:linha) | Tabelas/RPC consumidos | O que falta |
|---|---|---|---|---|---|
| Achievements | `/conquistas` (App.tsx:237) | ✅ IMPLEMENTADO_TOTAL | Achievements.tsx:66-67 hooks; :218 `AchievementGrid`; achievementsService.ts:`from("achievements")`,`from("user_achievements")` | `achievements`, `user_achievements`, `profiles`, `kudos`, `trail_enrollments`, `notifications` | Nada crítico. `Operador Nível {Math.floor(progressPercent/10)}` (Achievements.tsx:128) é rótulo cosmético derivado, não o nível real do usuário |
| ActionPlans | `/planos-acao` (App.tsx:271) | ✅ IMPLEMENTADO_TOTAL | ActionPlans.tsx:46-49 queries+mutations; :129 `updatePlan.mutate`; :154 `updateItem.mutate` | `action_plans`, `action_plan_items` (actionPlansService.ts) | — |
| AdminPanel | `/admin` (App.tsx:265) | ✅ IMPLEMENTADO_TOTAL | AdminPanel.tsx:89 stats reais; :163-184 23 `TabsContent` com componentes reais | `profiles`, `departments`, `rewards`, `quiz_questions`, `learning_trails` (via hooks) | Conteúdo de cada aba está fora deste lote (componentes `admin/*` NAO_VERIFICADO) |
| AdminTelemetria | `/admin/telemetria` (App.tsx:281) | ✅ IMPLEMENTADO_TOTAL | AdminTelemetria.tsx:146 `from("query_telemetry")`; :170 delete; :70 CSV real; :96 PDF real (jsPDF) | `query_telemetry` (existe em `integrations/supabase/types.ts`) | Cast `as any` em :146/:171 é desnecessário (tabela tipada) |
| Announcements | `/announcements` (App.tsx:277) | ✅ IMPLEMENTADO_TOTAL | Announcements.tsx:18 delega a `AnnouncementsBoard`; AnnouncementsBoard.tsx `from("announcements")` | `announcements`, `announcement_reads`, `announcement_reactions` | Página é só casca (41 linhas); lógica no componente |
| ApiKeysAdmin | `/admin/api-keys` (App.tsx:280) | ✅ IMPLEMENTADO_TOTAL | ApiKeysAdmin.tsx:48 `listApiKeys`; :58 rotate; :69 toggle; :79 delete | RPC `list_external_api_keys`, `create_external_api_key`, `rotate_external_api_secret`, `set_external_api_key_active`, `delete_external_api_key` | — |
| Attendance | `/ponto` (App.tsx:234) | 🟨 IMPLEMENTADO_PARCIAL | Attendance.tsx:24-29 hooks reais; :94-95 check-in/out mutations OK — **mas** :130-131 `text-${stat.color}` / `text-${stat.color}/20` são classes Tailwind dinâmicas (não geradas no build) | `attendance_records`, `attendance_streaks`, `attendance_settings` | Cores dos 4 KPIs (linhas 121-131) nunca aplicam: Tailwind JIT não enxerga classe interpolada |
| AuctionsAdmin | `/leilao/admin` (App.tsx:245) | ✅ IMPLEMENTADO_TOTAL | AuctionsAdmin.tsx:15 `useAdminAuctions`; :76 `AuctionAdminForm`; :89 `AuctionAuditTrail` | `auctions`, `auction_bids`, `auction_admin_events`; RPC `create_auction_draft`, `publish_auction`, `close_auction`, `cancel_auction` | — |
| AuctionsPage | `/leilao` (App.tsx:244) | ✅ IMPLEMENTADO_TOTAL | AuctionsPage.tsx:14-15 hooks; :73 `BidDialog` | `auctions`, `auction_bids`; RPC `place_auction_bid`, `get_auction_summary` | "Volte em breve" (:55) é empty-state legítimo, não stub |
| AuditLogs | `/audit` (App.tsx:230) | ✅ IMPLEMENTADO_TOTAL | AuditLogs.tsx:19-20 hooks; :22 filtro real; :91 `AuditTable` | `audit_logs`, `profiles` | — |
| Auth | `/auth` (App.tsx:219) | 🟨 IMPLEMENTADO_PARCIAL | Auth.tsx:51 `if (!isFunctionDeployed("verify-ip")) { setIsIpAllowed(true); return; }` + edgeAvailability.ts:48 `if (allowlist.size === 0) return false` + `.env`: `VITE_DEPLOYED_EDGE_FUNCTIONS=` (vazio) | `profiles`; supabase.auth; RPC de lockout; edge `verify-ip` (nunca chamada) | **Gate de IP whitelist está inerte por configuração** — sempre libera. Login/2FA/lockout em si funcionam (:173, :183, :214) |
| BIDashboard | `/bi` (App.tsx:266) | 🟨 IMPLEMENTADO_PARCIAL | BIDashboard.tsx:128-139 `trend={12}`,`trend={18}`,`trend={25}`,`trend={8}` fixos; :66-73 `radarData` com fórmulas inventadas; :115 `<Button>Exportar</Button>` sem `onClick`; :27+:103 `selectedPeriod` nunca entra em query | RPC `get_executive_metrics`, `get_monthly_trends`, `get_department_metrics`; `attendance_records`, `trail_enrollments`, `custom_quests`, `module_progress`, `departments` | Deltas reais; radar com métrica real; handler de export; ligar filtro de período |
| BingoPage | `/bingo` (App.tsx:251) | ✅ IMPLEMENTADO_TOTAL | BingoPage.tsx:58-67 hooks; :97 `syncMutation.mutateAsync`; :118 auto-sync | RPC `get_or_create_bingo_card`, `sync_bingo_card`; `bingo_marks` | — |
| BoardTrailAdminPage | `/tabuleiro/admin` (App.tsx:258) | ✅ IMPLEMENTADO_TOTAL | BoardTrailAdminPage.tsx:151 `saveMutation.mutateAsync`; :177 delete; :89 validação; :90 simulação econômica | RPC `save_board_trail`, `delete_board_trail`, `list_stuck_board_players`, `unblock_board_players`; `board_trails`, `quiz_questions` | — |
| BoardTrailPage | `/tabuleiro` (App.tsx:254) | ✅ IMPLEMENTADO_TOTAL | BoardTrailPage.tsx:61 `advance.mutateAsync(dedupeKey)`; :59 chave de idempotência | RPC `advance_board_trail`, `get_board_trail_leaderboard`, `resolve_board_challenge`; `board_player_states`, `board_trails` | — |
| BossBattlePage | `/chefao` (App.tsx:262) | ✅ IMPLEMENTADO_TOTAL | BossBattlePage.tsx:65-70 hooks/mutations; :199 publish; :209 expire; :217 settle | RPC `settle_boss_battle`, `deal_boss_damage`, `get_boss_battle_leaderboard`; `boss_battles`, `boss_battle_damage` | — |
| BurnRate | `/admin/burn-rate` (App.tsx:288) | ✅ IMPLEMENTADO_TOTAL | BurnRate.tsx:30 `rpc("get_burn_rate")`; :48 `rpc("acknowledge_security_alert")`; :73 `from("security_alerts")`; :92 export CSV real | RPC `get_burn_rate`, `acknowledge_security_alert`; `security_alerts` | — |
| CampaignHistory | `/campanhas/historico` (App.tsx:297) | ✅ IMPLEMENTADO_TOTAL | CampaignHistory.tsx:64-71 query com join real | `campaign_participants`, `sales_campaigns` | — |
| CampaignTeamRanking | `/campanhas/:id/ranking-equipes` (App.tsx:300) | ✅ IMPLEMENTADO_TOTAL | CampaignTeamRanking.tsx:62-70 hooks; :107 ranking derivado de dados reais; :123 `previewTeamShares` | `campaign_teams`, `campaign_team_members`, `campaign_participants`, `campaign_result_rows`; RPC `admin_profile_directory` | Rateio exibido é **projeção** — está rotulado como tal (:348) |
| CampaignTeamsDashboard | `/campanhas/equipes` (App.tsx:298) | ✅ IMPLEMENTADO_TOTAL | CampaignTeamsDashboard.tsx:76-86 `useCampaignTeamsDashboard`; filtros ligados (:124,:138) | `campaign_teams`, `campaign_team_members`, `campaign_team_split_batches`, `sales_campaigns` | — |
| CardAlbumPage | `/album` (App.tsx:249) | ✅ IMPLEMENTADO_TOTAL | CardAlbumPage.tsx:25-30 hooks; :41 `claimReward.mutateAsync` | RPC `claim_card_set_reward`, `get_card_set_rewards`, `open_card_pack`, `propose_card_trade`, `respond_card_trade`; `card_definitions`, `user_cards`, `card_packs`, `card_trades` | — |
| CertificateVerify | `/verificar`, `/verificar/:code` (App.tsx:223-224, público) | ✅ IMPLEMENTADO_TOTAL | CertificateVerify.tsx:41 `certificationsService.verifyCertificate`; certificationsService.ts:357 `rpc('verify_certificate')` | RPC `verify_certificate`; `certifications`, `user_certifications` | — |
| Checkins | `/checkins` (App.tsx:273) | ✅ IMPLEMENTADO_TOTAL | Checkins.tsx:38 `useCheckins` (create/complete/addActionItem/toggle); :57 create; :64 complete | `checkins`, `checkin_templates`, `profiles` | `navigate` importado e nunca usado (:18/:36) — lixo |
| ClimateDiagnostics | `/engajamento/diagnostico` (App.tsx:269) | ✅ IMPLEMENTADO_TOTAL | ClimateDiagnostics.tsx:108-123 7 hooks de RPC; :78 gera plano de ação e navega | RPC `get_engagement_overview`, `get_engagement_pillar_scores`, `get_engagement_factor_scores`, `get_engagement_nps`, `get_engagement_nps_history`, `get_engagement_pillar_benchmark`, `get_engagement_pillar_correlations` | — |
| ContinuousEngagement | `/engajamento` (App.tsx:268) | ✅ IMPLEMENTADO_TOTAL | ContinuousEngagement.tsx:32 `useActiveEngagementCycle`; :42 `ContinuousSurveyWidget` | RPC `get_active_engagement_cycle`, `assign_engagement_questions`, `submit_engagement_answer`, `get_engagement_cycle_progress` | `HIGHLIGHTS` (:12-28) é copy estática de marketing ("10 pilares e 28 fatores") — decorativo, não dado |
| DailyQuiz | `/quiz` (App.tsx:263) | 🟨 IMPLEMENTADO_PARCIAL | DailyQuiz.tsx:71 `useState({magic:false, millionaire:false})` — "✓ Concluído hoje" (:206,:262) vive só em memória; some no reload. Perguntas e score são reais (:78-79, :93) | RPC `get_quiz_play_set`, `grade_quiz_answer`, `quiz_fifty_fifty`, `get_quiz_lifeline`; `quiz_questions`, `quiz_options`, `quiz_scores` | Persistir/consultar a trava diária no servidor. `Math.random()` em :60 é shuffle legítimo |
| DailyWagerPage | `/pergunta-do-dia` (App.tsx:255) | ✅ IMPLEMENTADO_TOTAL | DailyWagerPage.tsx:39-41 hooks; :68 `submitMutation.mutateAsync`; apuração server-side (:256) | RPC `get_daily_wager`, `submit_daily_wager`, `get_wager_leaderboard`; `wager_entries` | — |
| DepartmentWarPage | `/guerra-departamentos` (App.tsx:261) | ✅ IMPLEMENTADO_TOTAL | DepartmentWarPage.tsx:66-84 hooks; :93 settle; :105 sync headcount; :119 status | RPC `settle_department_war`, `sync_department_war_headcount`, `get_department_war_standings`, `get_department_war_feed`; `department_wars`, `department_war_metrics`, `department_war_contributions` | — |
| Duels | `/duelos` (App.tsx:241) | ✅ IMPLEMENTADO_TOTAL | Duels.tsx:30-33 hooks; :43 undo real com `from("direct_duels").update` | `direct_duels`, `profiles` | `navigate` importado e não usado (:23) |
| EngagementReports | `/reports` (App.tsx:229) | 🟨 IMPLEMENTADO_PARCIAL | EngagementReports.tsx:55 `onClick={() => toast.success("Relatório exportado com sucesso!")}` — **não exporta nada**; :62-65 `change="+18%" / "+12%" / "+24%" / "+5pts"` fixos; engagementReportsService.ts:306 `rating: Math.min(5, 3.5 + (completions/10)*0.5)` exibido como "★"; :356 `totalTrainingHours = moduleCompletions * 0.25` ("estimated 15 min each"); :185 fallback `|| 2.5` | `attendance_records`, `trail_enrollments`, `module_progress`, `custom_quests`, `quest_assignments`, `departments`, `profiles`, `team_members`, `user_certifications` | Export real; deltas reais; remover rating sintético; rotular horas como estimativa |
| ErrorBudget | `/admin/error-budget` (App.tsx:287) | ✅ IMPLEMENTADO_TOTAL | ErrorBudget.tsx:129 `rpc("get_error_budget_30d")`; :148 export CSV real | RPC `get_error_budget_30d` | — |
| ExecutiveDashboard | `/executivo` (App.tsx:235) | 🟨 IMPLEMENTADO_PARCIAL | ExecutiveDashboard.tsx:34-44 ROI e "Custo Turnover Evitado (R$)" derivados de fórmula inventada (`totalXp/100 + quests*5 + kudos*2`, `trainingRate*500`, `punctualityRate*300`); :140 `description={\`Ano anterior: ${null}%\`}` renderiza "Ano anterior: null%"; :47-51 eNPS/turnover/absenteísmo/custo-por-contratação = `null` sem fonte; :164 "OKRs Q4 2025" fixo | RPC `get_executive_metrics`, `get_monthly_trends`, `get_department_metrics` | Fonte real para eNPS/turnover/absenteísmo/custo; ROI e economia em R$ não devem ser apresentados como financeiro real; corrigir "null%" |
| ExecutiveMonthlyReport | `/admin/executive-report` (App.tsx:292) | ✅ IMPLEMENTADO_TOTAL | EMR.tsx:82 `from("executive_monthly_reports")`; :113 salva comentário; :173 `rpc("generate_executive_monthly_report")`; :280 cria postmortem; :184 CSV real | `executive_monthly_reports`, `postmortems`; RPC `generate_executive_monthly_report` | — |
| Feedback | `/feedback` (App.tsx:276) | 🟨 IMPLEMENTADO_PARCIAL | Feedback.tsx:82 `<Button size="sm">Responder</Button>` — **sem `onClick`**; :81 exibe `{req.to_user_id}` (UUID cru na tela); `navigate` (:15) nunca usado | `feedback_cycles`, `feedback_requests`, `feedback_responses` | Fluxo de responder feedback não existe na página; resolver nome do usuário |
| ForgotPassword | `/forgot-password` (App.tsx:220) | 🟨 IMPLEMENTADO_PARCIAL | ForgotPassword.tsx:43 `supabase.auth.resetPasswordForEmail` — mas Auth.tsx:147 usa `passwordResetService.requestPasswordReset()` (fluxo de aprovação por gestor) para a mesma intenção | supabase.auth; (Auth.tsx: `profiles` + tabela de reset via service) | **Dois fluxos de reset contraditórios** convivendo; definir qual é o oficial |
| Goals | `/goals` (App.tsx:267) | ✅ IMPLEMENTADO_TOTAL | Goals.tsx:28 `useGoals` (create/update/createKeyResult/delete); :37 create; :72 key result | `goals`, `key_results`, `goal_updates` | `navigate` e imports `Filter/List/Search/Sparkles/TrendingUp` não usados (:2,:26) |
| IncidentMetrics | `/admin/incident-metrics` (App.tsx:290) | ✅ IMPLEMENTADO_TOTAL | IncidentMetrics.tsx:74 `rpc("get_incident_metrics")`; :306 `from("sla_targets")`; :325/:349/:362 update/delete/insert; :127 CSV real | RPC `get_incident_metrics`; `sla_targets` | — |
| Index | `/` (App.tsx:218) | ✅ IMPLEMENTADO_TOTAL | Index.tsx:183 `StatsGrid`; :199/:207 colunas do dashboard; :65-69 side-effects | Indireto via widgets (fora do lote) | Página é orquestradora; conteúdo dos widgets NAO_VERIFICADO |
| Leagues | `/leagues` (App.tsx:274) | 🟨 IMPLEMENTADO_PARCIAL | Leagues.tsx:181-187 `<motion.button>Analyze All Divisions</motion.button>` **sem `onClick`**; :160-189 card "Premium Status" 100% hardcoded ("Daily XP Yield +10%", "Tournament Fee GRÁTIS"); :78-81 "Divisional Perks" promete "até 20% mais XP" e "descontos na Loja" sem backing; :21 `leaderboard` buscado e nunca renderizado nesta página | `leagues`, `user_leagues`, `league_history`, `profiles` | Botão sem ação; benefícios não têm fonte de dados nem regra aplicada |
| LearningTrails | `/trails` (App.tsx:232) | ✅ IMPLEMENTADO_TOTAL | LearningTrails.tsx:38-43 hooks; :77 `enrollMutation.mutateAsync`; :54 pré-requisitos reais | `learning_trails`, `trail_enrollments`, `trail_modules`, `trail_prerequisites`, `module_progress`, `certifications` | :260 `Progress value={(completedCount / trails.length) * 100}` → `NaN` quando `trails.length === 0` |
| LightningQuizPage | `/relampago` (App.tsx:250) | ✅ IMPLEMENTADO_TOTAL | LightningQuizPage.tsx:121 start; :153 answer; :77 finish; :103-115 cronômetro server-authoritative | RPC `start_lightning_round`, `answer_lightning_question`, `finish_lightning_round`; `lightning_quiz_sessions` | — |

**Contagem:** ✅ 31 · 🟨 10 · 🟦 0 · ⬛ 0

---

## Achados graves

### 1. Gate de IP whitelist do login está desativado por configuração (segurança)
`src/pages/Auth.tsx:51` — `if (!isFunctionDeployed("verify-ip")) { setIsIpAllowed(true); setIsCheckingIp(false); return; }`
`src/lib/edgeAvailability.ts:48` — `if (allowlist.size === 0) return false;`
`.env` — `VITE_DEPLOYED_EDGE_FUNCTIONS=` (vazio)
A allowlist vazia faz `isFunctionDeployed()` retornar `false` para **toda** função. Consequência: a verificação de IP na tela de login nunca é executada e a página sempre libera o acesso. O `IpWhitelistManager` do AdminPanel pode estar cadastrando regras que nada aplicam. Isso vale para as 36 edge functions do projeto, não só `verify-ip`.

### 2. Botão "Exportar" que finge sucesso sem exportar nada
`src/pages/EngagementReports.tsx:55` — `onClick={() => toast.success("Relatório exportado com sucesso!")}`
Nenhum blob, nenhum download, nenhuma chamada. O usuário recebe confirmação de uma ação que não aconteceu.

### 3. Dados fictícios apresentados como métricas reais
- `src/pages/BIDashboard.tsx:128,136,137,138` — `trend={12}`, `trend={18}`, `trend={25}`, `trend={8}` hardcoded nos KPIs "Total de Usuários", "XP Total", "Quests", "Kudos".
- `src/pages/BIDashboard.tsx:66-73` — radar de departamentos inventado: `produtividade: Math.min(100, (d.xpTotal/10)+40)`, `treinamento: (d.quests*5)+30`, `colaboracao: (d.score/10)+20`, `inovacao: (d.nivelMedio*10)+10`.
- `src/pages/EngagementReports.tsx:62-65` — `change="+18%"`, `"+12%"`, `"+24%"`, `"+5pts"` fixos.
- `src/services/engagementReportsService.ts:306` — `rating: Math.min(5, 3.5 + (stats.completions / 10) * 0.5)` renderizado como avaliação em estrelas (`EngagementReports.tsx:116` — `★ {quest.rating.toFixed(1)}`). Não existe rating de usuário; é o contador de conclusões disfarçado.
- `src/services/engagementReportsService.ts:351-356` — `totalTrainingHours = moduleCompletions * 0.25` (comentário literal: *"estimated 15 min each"*), exibido como "Horas de Treinamento · horas investidas".
- `src/services/engagementReportsService.ts:185` — `avgTime: ... || 2.5` (número mágico de fallback).

### 4. Métricas financeiras C-Level derivadas de fórmula inventada
`src/pages/ExecutiveDashboard.tsx:34-44`
```
engagementScore = totalXpEarned/100 + totalQuestsCompleted*5 + totalKudos*2
baseROI         = min(300, 100 + engagementScore)          → "ROI Gamificação %"
trainingSavings = trainingCompletionRate * 500
retentionSavings= punctualityRate * 300
turnoverCostSaved = trainingSavings + retentionSavings     → "Custo Turnover Evitado R$"
```
Valores em reais e percentual de ROI apresentados a diretoria sem qualquer input financeiro real (`ExecutiveDashboard.tsx:128,130`). Somado a isso, `ExecutiveDashboard.tsx:140` renderiza literalmente **"Ano anterior: null%"** porque `previousYear` é `null` (:48).

### 5. Botões sem handler (fio quebrado UI→lógica)
- `src/pages/Feedback.tsx:82` — `<Button size="sm">Responder</Button>` sem `onClick`. Não existe caminho para responder um feedback pendente nesta página. A mesma linha (:81) mostra o UUID cru: `Feedback para {req.to_user_id}`.
- `src/pages/Leagues.tsx:181-187` — `<motion.button ...>Analyze All Divisions</motion.button>` sem `onClick`.
- `src/pages/BIDashboard.tsx:115` — `<Button variant="outline" size="sm"><Download/>Exportar</Button>` sem `onClick`.

### 6. Card "Premium Status" e "Divisional Perks" totalmente hardcoded
`src/pages/Leagues.tsx:78-81` e `:160-189` — promete "até 20% mais XP em todas as atividades", "descontos em itens raros na Loja", "Daily XP Yield +10%", "Tournament Fee GRÁTIS". Nenhum desses valores vem de `leagues`/`user_leagues` nem é aplicado em regra alguma no código lido. É copy fixa vendendo benefício que o sistema não implementa nesta camada.

### 7. Dois fluxos de recuperação de senha contraditórios
- `src/pages/ForgotPassword.tsx:43` — `supabase.auth.resetPasswordForEmail(...)` (e-mail automático com link).
- `src/pages/Auth.tsx:147` — `passwordResetService.requestPasswordReset()` + toast *"Aguarde a aprovação do seu gestor"*.
Ambos alcançáveis pelo usuário (rota `/forgot-password` e a aba interna do `/auth`), com semânticas incompatíveis. Existe ainda um `PasswordResetApprovalPanel` no AdminPanel (`AdminPanel.tsx:184`) que só faz sentido para o segundo fluxo.

### 8. Trava diária do Quiz existe só na memória do browser
`src/pages/DailyQuiz.tsx:71,102,116` — `completedToday` é `useState` local. O selo "✓ Concluído hoje" desaparece a cada reload e a página não consulta o servidor para saber se o quiz do dia já foi jogado.

### 9. Classes Tailwind dinâmicas que nunca são geradas
`src/pages/Attendance.tsx:130-131` — `` className={`text-3xl font-bold text-${stat.color}`} `` e `` text-${stat.color}/20 ``. Tailwind não faz varredura de string interpolada; os 4 KPIs (Taxa Pontualidade, Dias Pontuais, Dias Atrasados, XP Ganho) ficam sem a cor pretendida.

### 10. Divisão por zero visível
`src/pages/LearningTrails.tsx:260` — `<Progress value={(completedCount / trails.length) * 100} />` produz `NaN` quando não há trilhas publicadas.

---

## Não verificado
- Conteúdo dos componentes referenciados pelas páginas (`components/admin/*`, `components/dashboard/*`, `components/bi/*`, `components/board/*`, `components/boss/*`, `components/cards/*`, `components/engagement/*` etc.) — fora do escopo deste lote.
- Existência real das tabelas/RPCs no banco em produção: verificado apenas que estão referenciadas no código e (amostragem) presentes em `src/integrations/supabase/types.ts`.

---

## Lote B — 41 páginas + mapa de rotas

# Auditoria de estado — LOTE B (41 páginas) + MAPA DE ROTAS GLOBAL

Repo: `/home/user/task-gifts-v2` · Data: 2026-08-16 · Método: leitura direta de arquivos + verificação
das RPCs contra o banco real (MCP `supabase_db_list_functions`, schema `public`) e contra
`supabase/migrations/` (262 arquivos). Nada foi herdado de README/INVENTARIO.

Arquivos de roteamento existentes no projeto: **apenas `src/App.tsx`**
(`grep -rl "createBrowserRouter|<Routes>|<Route "` retorna só `src/App.tsx`). `src/main.tsx` não
declara rotas — só monta `<App/>` e inicializa Sentry (`src/main.tsx:62-66`).

---

## Mapa de rotas

Fonte única: `src/App.tsx:218-301`. Guard universal: `ProtectedRoute`
(`src/components/rbac/ProtectedRoute.tsx:40-129`) — sem `user` → `Navigate` para `/auth`
(`ProtectedRoute.tsx:64-67`); com `requiredRole` → checa via `useRBAC().canAccess`
(`ProtectedRoute.tsx:103`) e renderiza tela "Acesso Negado" (`ProtectedRoute.tsx:105-126`).
**83 rotas declaradas · 82 componentes distintos · todos existem em `src/pages/`.**

| Rota | Componente | Guard | Existe? |
|---|---|---|---|
| `/` | Index | ProtectedRoute (auth) | ✅ `src/pages/Index.tsx` |
| `/auth` | Auth | Pública (redirect p/ `/` se logado, `App.tsx:219`) | ✅ |
| `/forgot-password` | ForgotPassword | Pública (redirect se logado, `App.tsx:220`) | ✅ |
| `/reset-password` | ResetPassword | Pública (redirect se logado, `App.tsx:221`) | ✅ |
| `/verificar` | CertificateVerify | **Pública sem guard** (`App.tsx:223`, intencional — comentário `App.tsx:222`) | ✅ |
| `/verificar/:code` | CertificateVerify | **Pública sem guard** (`App.tsx:224`) | ✅ |
| `/security` | RateLimitDashboard | ProtectedRoute+admin (`App.tsx:225`) | ✅ |
| `/profile` | Profile | ProtectedRoute (auth) | ✅ |
| `/manager` | ManagerDashboard | ProtectedRoute+manager | ✅ |
| `/quest-builder` | QuestBuilder | ProtectedRoute+manager | ✅ |
| `/reports` | EngagementReports | ProtectedRoute+manager | ✅ |
| `/audit` | AuditLogs | ProtectedRoute+admin | ✅ |
| `/analytics` | RealTimeAnalytics | **ProtectedRoute (auth) — sem role** (`App.tsx:231`) | ✅ |
| `/trails` | LearningTrails | ProtectedRoute (auth) | ✅ |
| `/trails/:id` | TrailDetail | ProtectedRoute (auth) | ✅ |
| `/ponto` | Attendance | ProtectedRoute (auth) | ✅ |
| `/executivo` | ExecutiveDashboard | ProtectedRoute+admin | ✅ |
| `/feed` | SocialFeed | ProtectedRoute (auth) | ✅ |
| `/conquistas` | Achievements | ProtectedRoute (auth) | ✅ |
| `/estatisticas` | PersonalStats | ProtectedRoute (auth) | ✅ |
| `/loja` | Shop | ProtectedRoute (auth) | ✅ |
| `/eventos/:eventId` | SeasonalEventDetail | ProtectedRoute (auth) | ✅ |
| `/duelos` | Duels | ProtectedRoute (auth) | ✅ |
| `/roleta` | LuckyWheelPage | ProtectedRoute (auth) | ✅ |
| `/roleta/admin` | LuckyWheelAdmin | ProtectedRoute+admin | ✅ |
| `/leilao` | AuctionsPage | ProtectedRoute (auth) | ✅ |
| `/leilao/admin` | AuctionsAdmin | ProtectedRoute+admin | ✅ |
| `/previsoes` | PredictionMarketsPage | ProtectedRoute (auth) | ✅ |
| `/previsoes/admin` | PredictionAdminPage | ProtectedRoute+admin | ✅ |
| `/raspadinha` | ScratchCardPage | ProtectedRoute (auth) | ✅ |
| `/album` | CardAlbumPage | ProtectedRoute (auth) | ✅ |
| `/relampago` | LightningQuizPage | ProtectedRoute (auth) | ✅ |
| `/bingo` | BingoPage | ProtectedRoute (auth) | ✅ |
| `/memoria` | MemoryGamePage | ProtectedRoute (auth) | ✅ |
| `/sequencia` | SequenceGamePage | ProtectedRoute (auth) | ✅ |
| `/tabuleiro` | BoardTrailPage | ProtectedRoute (auth) | ✅ |
| `/pergunta-do-dia` | DailyWagerPage | ProtectedRoute (auth) | ✅ |
| `/sequencia/admin` | SequenceProcedureAdminPage | ProtectedRoute+admin | ✅ |
| `/memoria/admin` | MemoryDeckAdminPage | ProtectedRoute+admin | ✅ |
| `/tabuleiro/admin` | BoardTrailAdminPage | ProtectedRoute+admin | ✅ |
| `/pergunta-do-dia/admin` | WagerQuestionAdminPage | ProtectedRoute+admin | ✅ |
| `/torneios` | TournamentsPage | ProtectedRoute (auth) | ✅ |
| `/guerra-departamentos` | DepartmentWarPage | ProtectedRoute (auth) | ✅ |
| `/chefao` | BossBattlePage | ProtectedRoute (auth) | ✅ |
| `/quiz` | DailyQuiz | ProtectedRoute (auth) | ✅ |
| `/quiz/admin` | QuizAdmin | ProtectedRoute+manager | ✅ |
| `/admin` | AdminPanel | ProtectedRoute+admin | ✅ |
| `/bi` | BIDashboard | ProtectedRoute+manager | ✅ |
| `/goals` | Goals | ProtectedRoute (auth) | ✅ |
| `/engajamento` | ContinuousEngagement | ProtectedRoute (auth) | ✅ |
| `/engajamento/diagnostico` | ClimateDiagnostics | ProtectedRoute+manager | ✅ |
| `/engajamento/opinioes` | OpinionChannel | ProtectedRoute (auth) | ✅ |
| `/planos-acao` | ActionPlans | ProtectedRoute+manager | ✅ |
| `/engajamento/nr1` | Nr1Risks | ProtectedRoute+manager | ✅ |
| `/checkins` | Checkins | ProtectedRoute+manager | ✅ |
| `/leagues` | Leagues | ProtectedRoute (auth) | ✅ |
| `/surveys` | Surveys | ProtectedRoute (auth) | ✅ |
| `/feedback` | Feedback | ProtectedRoute (auth) | ✅ |
| `/announcements` | Announcements | ProtectedRoute (auth) | ✅ |
| `/security-dashboard` | SecurityDashboard | **ProtectedRoute (auth) — sem role** (`App.tsx:278`) | ✅ |
| `/admin/permissions` | PermissionsAdmin | ProtectedRoute+admin | ✅ |
| `/admin/api-keys` | ApiKeysAdmin | ProtectedRoute+admin | ✅ |
| `/admin/telemetria` | AdminTelemetria | ProtectedRoute+admin | ✅ |
| `/admin/webhooks` | WebhooksAdmin | ProtectedRoute+admin | ✅ |
| `/admin/webhooks/executive` | WebhooksExecutive | ProtectedRoute+admin | ✅ |
| `/admin/security-runbook` | SecurityRunbook | ProtectedRoute+admin | ✅ |
| `/admin/security-digests` | SecurityDigests | ProtectedRoute+admin | ✅ |
| `/admin/reliability` | ReliabilitySLO | ProtectedRoute+admin | ✅ |
| `/admin/error-budget` | ErrorBudget | ProtectedRoute+admin | ✅ |
| `/admin/burn-rate` | BurnRate | ProtectedRoute+admin | ✅ |
| `/admin/runbook/:type` | Runbook | ProtectedRoute+admin | ✅ |
| `/admin/incident-metrics` | IncidentMetrics | ProtectedRoute+admin | ✅ |
| `/admin/postmortems` | Postmortems | ProtectedRoute+admin | ✅ |
| `/admin/executive-report` | ExecutiveMonthlyReport | ProtectedRoute+admin | ✅ |
| `/admin/webhooks/new` | WebhookSubscriptionNew | ProtectedRoute+admin (`App.tsx:293`) | ✅ |
| `/admin/webhooks/:id` | WebhookSubscriptionDetail | ProtectedRoute+admin (`App.tsx:294`) | ✅ |
| `/loja/admin` | ShopAdmin | ProtectedRoute+admin | ✅ |
| `/campanhas` | SalesCampaigns | ProtectedRoute (auth) | ✅ |
| `/campanhas/historico` | CampaignHistory | ProtectedRoute (auth) | ✅ |
| `/campanhas/equipes` | CampaignTeamsDashboard | ProtectedRoute (auth) | ✅ |
| `/campanhas/:id` | SalesCampaignDetail | ProtectedRoute (auth) | ✅ |
| `/campanhas/:id/ranking-equipes` | CampaignTeamRanking | ProtectedRoute (auth) | ✅ |
| `*` | NotFound | **Sem `ProtectedRoute` e sem `PageTransition`** (`App.tsx:301`) | ✅ |

### (a) Páginas SEM rota (órfãs)
**Nenhuma.** `ls src/pages` = 82 arquivos; componentes distintos referenciados em `<Route element>` = 82;
`comm -23 allpages routed` = vazio.

### (b) Rotas apontando para componente inexistente
**Nenhuma.** `comm -13 allpages routed` = vazio. Todos os 82 `lazy(() => import("./pages/X"))`
(`App.tsx:30-109`) e os 2 imports eager (`App.tsx:26-27`) resolvem para arquivos existentes.

### (c) Protegidas vs públicas
- **Públicas (6 rotas / 5 componentes):** `/auth`, `/forgot-password`, `/reset-password`
  (as três com redirect para `/` se já logado, `App.tsx:219-221`), `/verificar`, `/verificar/:code`
  (sem qualquer guard, por design — comentário `App.tsx:222`), e o catch-all `*` → NotFound.
- **Só autenticação (`ProtectedRoute` sem role): 39 rotas.**
- **`requiredRole="manager"`: 9 rotas** — `/manager`, `/quest-builder`, `/reports`, `/quiz/admin`,
  `/bi`, `/engajamento/diagnostico`, `/planos-acao`, `/engajamento/nr1`, `/checkins`.
- **`requiredRole="admin"`: 29 rotas.**
- Nenhuma rota usa `requiredPermission`, `requiredPermissions`, `minLevel` ou `requireAll`, embora
  `ProtectedRoute` suporte todos (`ProtectedRoute.tsx:41-47`) — capacidade RBAC granular construída
  e 100 % não utilizada no roteamento.

---

## Páginas órfãs
Nenhuma no sistema inteiro (verificado sobre as 82 páginas, não só o lote B).
Contraponto: **`/security` e `/security-dashboard` são duas rotas para o mesmo domínio**, com guards
diferentes, e há **imports mortos de painéis admin em `SecurityDashboard`** — ver "Achados graves".

---

## Tabela de classificação — LOTE B (41 páginas)

Legenda de origem: `sb.from/rpc` = chamada direta no arquivo; `hook→service` = via hook em `src/hooks`
verificado como tendo acesso a dados; `edge` = `invokeEdgeSafe`.

| Página | Rota | Classificação | Evidência arquivo:linha | Tabelas/RPC | O que falta |
|---|---|---|---|---|---|
| LuckyWheelAdmin | `/roleta/admin` (admin) | ✅ IMPLEMENTADO_TOTAL | `LuckyWheelAdmin.tsx:24-29` (4 hooks CRUD), `:30-36` odds lib | hook→`useLuckyWheel` (11 refs, `src/hooks/useLuckyWheel.ts`) | — |
| LuckyWheelPage | `/roleta` (auth) | ✅ IMPLEMENTADO_TOTAL | `LuckyWheelPage.tsx:27-29`, spin real `:45`, trata `already_spun` `:49` | `spin_lucky_wheel`, `get_lucky_wheel_status`, `get_lucky_wheel_prizes_display` (as 3 existem no banco) | — |
| ManagerDashboard | `/manager` (manager) | 🟨 IMPLEMENTADO_PARCIAL | hardcode `questsTotal: 50` `:47`; `department: "Geral"` `:50`; deltas fixos `change="+5%"` `:88`, `change="+2"` `:89`; botões sem `onClick` `:119-120`; import morto `DesktopBackButton` `:29` | hook→`useProfiles`, `useDepartments` | Departamento real por perfil (filtro `:54` nunca casa); metas reais; ligar "Enviar Reconhecimento" e "Exportar Relatório" |
| MemoryDeckAdminPage | `/memoria/admin` (admin) | ✅ IMPLEMENTADO_TOTAL | `MemoryDeckAdminPage.tsx:15-20` (CRUD baralhos/pares) | hook→`useMemoryGame` (11 refs) | — |
| MemoryGamePage | `/memoria` (auth) | ✅ IMPLEMENTADO_TOTAL | `MemoryGamePage.tsx:13-19` start/finish sessão; empty state honesto `:93` | `start_memory_session`, `finish_memory_session`, `get_memory_leaderboard` (existem) | — |
| NotFound | `*` (pública) | ✅ IMPLEMENTADO_TOTAL | `NotFound.tsx:14-80`; log só em DEV `:10-12` | n/a (sem dados por design) | — |
| Nr1Risks | `/engajamento/nr1` (manager) | ✅ IMPLEMENTADO_TOTAL | `Nr1Risks.tsx:48-52` matriz+resumo+geração de plano; export CSV `:66-74` e PDF `:76-84` | `get_nr1_risk_matrix`, `get_nr1_summary`, `generate_action_plan_from_nr1_category` (existem) | imports mortos `Button`/`MobilePageLayout`/`Nr1RiskMatrix`? — **não**, `Nr1RiskMatrix` é usado; só limpeza menor |
| OpinionChannel | `/engajamento/opinioes` (auth) | ✅ IMPLEMENTADO_TOTAL | `OpinionChannel.tsx:53-59` feed mine/queue + toggle apoio; gate RBAC interno `:47-48` | `get_opinion_feed`, `toggle_opinion_support` (existem) | import morto `MobilePageLayout` (`:4`) |
| PermissionsAdmin | `/admin/permissions` (admin) | ✅ IMPLEMENTADO_TOTAL | `PermissionsAdmin.tsx:25` `usePermissions`; contagem real `:31-33` | `sb.from("user_roles")` + hook `usePermissions` (8 refs) | 5 imports mortos (`:4-6`) |
| PersonalStats | `/estatisticas` (auth) | ✅ IMPLEMENTADO_TOTAL | 3 queries próprias `:33`, `:49`, `:64`; gráficos alimentados `:135-140`, `:151` | `audit_logs`, `user_achievements`, `quest_assignments` | imports mortos `AppSidebar` `:8`, `MobilePageLayout` `:10` |
| Postmortems | `/admin/postmortems` (admin) | ✅ IMPLEMENTADO_TOTAL | leitura `:313`, `:329`; CRUD ações `:735`, `:751`, `:766`, `:775`; update `:919`, `:943` | `postmortems`, `postmortem_actions` | imports mortos `Input` `:8`, `Textarea` `:10` |
| PredictionAdminPage | `/previsoes/admin` (admin) | ✅ IMPLEMENTADO_TOTAL | `PredictionAdminPage.tsx:44-45`; watchdog real `:62-71` | hook→`usePredictionMarkets`; `create_prediction_market`, `transition_prediction_market`, `settle_prediction_market` (existem) | — |
| PredictionMarketsPage | `/previsoes` (auth) | ✅ IMPLEMENTADO_TOTAL | `:18-19` mercados+apostas; exposição `:22`, ordenação `:29`, busca `:30` | hook→`usePredictionMarkets` (7 refs) | "Volte em breve" `:143` é empty state legítimo, não placeholder |
| Profile | `/profile` (auth) | 🟨 IMPLEMENTADO_PARCIAL | fetch real `:80-84`, update nome `:109-112`; **botão Configurações só faz toast "em breve"** `:147` | `sb.from("profiles")` (`PROFILE_SAFE_COLUMNS`) | Tela/rota de configurações do perfil; imports mortos `Button` `:2`, `Input` `:3`, `MobilePageLayout` `:41` |
| QuestBuilder | `/quest-builder` (manager) | ✅ IMPLEMENTADO_TOTAL | insert quest `:55-60` + steps `:64-66`; validação `:49-51`; erro tratado `:73-76` | `custom_quests`, `quest_steps` | — |
| QuizAdmin | `/quiz/admin` (manager) | ✅ IMPLEMENTADO_TOTAL | `QuizAdmin.tsx:26-29` CRUD completo + toggle; stats `:9-11` | hook→`useQuizQuestions` (8 refs); `get_quiz_category_stats` (existe) | — |
| RateLimitDashboard | `/security` (admin) | ✅ IMPLEMENTADO_TOTAL | `:63` stats, `:72` cleanup; 5 painéis reais `:277-293` | `get_security_stats`, `cleanup_old_security_logs` (existem, com `_require_admin()`) | 8 imports mortos (`:4`, `:8`, `:9`) — sobra de refatoração |
| RealTimeAnalytics | `/analytics` (**auth, sem role**) | 🟨 IMPLEMENTADO_PARCIAL | dados reais `:44-45`; realtime channel `:49-50`; mas rota sem role e `backFallback="/admin"` `:110` | `audit_logs` (RLS: admin vê tudo, manager vê time, user só o próprio — verificado no banco) | Guard `requiredRole="admin"`; hoje um usuário comum vê "Monitoramento do sistema"/"Usuários mais ativos" com só os próprios logs — número enganoso, não vazamento |
| ReliabilitySLO | `/admin/reliability` (admin) | ✅ IMPLEMENTADO_TOTAL | `:49` `get_reliability_slo`, `:61` `get_reliability_timeline`; export CSV `:129` | ambas RPCs **existem no banco** | Casts `(supabase.rpc as any)` `:49`, `:61` — tipos não gerados |
| ResetPassword | `/reset-password` (pública) | ✅ IMPLEMENTADO_TOTAL | sessão `:43`/`:72`, `setSession` `:91`, `updateUser` `:120`, `signOut` `:140`; zod+react-hook-form `:4-6` | `supabase.auth` | imports mortos `Input` `:9`, `FormField` `:11` |
| Runbook | `/admin/runbook/:type` (admin) | ✅ IMPLEMENTADO_TOTAL | conteúdo estático `getRunbook` `:94` (`src/lib/runbooks.ts`, 261 linhas — documentação, por design); execução real: timeline `:102-106`, `log_runbook_step` `:120-122`, notas `:152` | `runbook_executions`, `log_runbook_step` (existe) | import morto `Textarea` `:10`; conteúdo do runbook não editável por UI |
| SalesCampaignDetail | `/campanhas/:id` (auth) | ✅ IMPLEMENTADO_TOTAL | `useSalesCampaign` `:4`; enroll em massa `:279`; painéis reais `:15-19` | hook→`useSalesCampaigns` (11 refs); `apply_campaign_import`, `recalc_campaign_progress` (existem) | imports mortos `Input` `:9`, `CampaignProgressChart` `:15`, `CampaignImportDialog` `:16`, `CampaignTeamsPanel` `:18` — **componentes de negócio importados e não renderizados** |
| SalesCampaigns | `/campanhas` (auth) | ✅ IMPLEMENTADO_TOTAL | `:25` lista real, filtro depto `:34-38`, gate criação `:28` | hook→`useSalesCampaigns` | — |
| ScratchCardPage | `/raspadinha` (auth) | ✅ IMPLEMENTADO_TOTAL | `:40-41`; reveal real `:51`, trata `no_prizes` `:55` | `reveal_scratch_card`, `grant_scratch_card` (existem) | — |
| SeasonalEventDetail | `/eventos/:eventId` (auth) | ✅ IMPLEMENTADO_TOTAL | `:12` detalhe + claim de recompensa | hook→`useSeasonalEvents` (5 refs) | imports mortos `CardHeader`/`CardTitle` `:8` |
| SecurityDashboard | `/security-dashboard` (**auth, sem role**) | 🟨 IMPLEMENTADO_PARCIAL | `:57` `get_security_stats` (RPC exige admin no servidor), aba "Avançado" `:151-153` sem gate cliente; **3 painéis admin importados e nunca renderizados** `:18`, `:20`, `:21` | `get_security_stats`, `cleanup_old_security_logs`, `user_devices`, `new_device_alerts` | Guard admin na rota ou gate por aba; remover/renderizar painéis órfãos; `securityScore` `:98-106` é fórmula heurística local (não é dado de servidor) |
| SecurityDigests | `/admin/security-digests` (admin) | 🟨 IMPLEMENTADO_PARCIAL | leitura OK `:47`; **mutation `:57` chama `acknowledge_security_digest`, RPC que NÃO existe** — botão ativo em `:196` | `get_security_digest_history` ✅ existe / `acknowledge_security_digest` ❌ **ausente do banco e de todas as 262 migrations** | Criar a RPC (o `SELECT` já retorna `ack_count`/`acknowledged_by_me`/`acknowledgments`, `:24-25` — lado de escrita nunca foi feito) |
| SecurityRunbook | `/admin/security-runbook` (admin) | ✅ IMPLEMENTADO_TOTAL | `:262` MTTR por tipo, `:285` `sla_targets`; heatmap `:9`; export CSV `:12` | `get_alert_mttr_by_type_7d` (existe), `sla_targets` | imports mortos `Input` `:8`, `SlaTargetEditor` `:10` — **editor de SLA importado e não renderizado** |
| SequenceGamePage | `/sequencia` (auth) | ✅ IMPLEMENTADO_TOTAL | `:12-17` procedimentos/histórico/submit | `get_sequence_play_set`, `submit_sequence_attempt` (existem) | — |
| SequenceProcedureAdminPage | `/sequencia/admin` (admin) | ✅ IMPLEMENTADO_TOTAL | `:32-37` CRUD; stats `:30` | `save_sequence_procedure`, `get_sequence_procedure_stats` (existem) | — |
| Shop | `/loja` (auth) | ✅ IMPLEMENTADO_TOTAL | `:10` rewards+compra, `:11` saldo, `:15` service | hook→`useShop` (15 refs) | "TODOS" `:143` é rótulo de filtro, não TODO; import morto `Skeleton` `:22` |
| ShopAdmin | `/loja/admin` (admin) | ✅ IMPLEMENTADO_TOTAL | casca de 56 linhas, mas delega a 3 managers reais `:4-6` / `:42`,`:46`,`:50` — RewardsManager 216 ln/9 refs, PurchasesManager 182 ln/4, PromotionsManager 221 ln/11 | via componentes | — |
| SocialFeed | `/feed` (auth) | ✅ IMPLEMENTADO_TOTAL | `:77` feed real (100 itens), filtros por tipo/período/data `:101-131` | hook→`useSocialFeed` | imports mortos `SectionErrorBoundary` `:43`, `MobilePageLayout` `:44`, `CalendarComponent` `:42` |
| Surveys | `/surveys` (auth) | ✅ IMPLEMENTADO_TOTAL | casca de 41 linhas `:10-41` delegando a `PulseSurveyWidget` (242 linhas, com acesso a dados) `:23` | via componente | Página em si é só layout — risco baixo, mas nenhuma lógica própria |
| TournamentsPage | `/torneios` (auth) | ✅ IMPLEMENTADO_TOTAL | `:16-22` join/start/report/bracket | `list_tournaments`, `join_tournament`, `start_tournament`, `report_tournament_match`, `get_tournament_bracket` (todas existem) | — |
| TrailDetail | `/trails/:id` (auth) | ✅ IMPLEMENTADO_TOTAL | `:120-128` trilha+módulos+progresso+enroll+complete; gate autoria `:134-135` | hook→`useTrails` (20 refs) | import morto `Progress` `:11`; `simulation` `:28` é um tipo de módulo, não simulação de dado |
| WagerQuestionAdminPage | `/pergunta-do-dia/admin` (admin) | ✅ IMPLEMENTADO_TOTAL | `:25-31` CRUD + orçamento; import em massa `:20`, integridade `:22`, export `:42` | `save_wager_question`, `list_wager_questions` (existem) | "Simulação de exposição" `:464` é cálculo de orçamento, não mock; import morto `WagerMonthlyExposureCard` `:21` |
| WebhookSubscriptionDetail | `/admin/webhooks/:id` (admin) | ✅ IMPLEMENTADO_TOTAL | `:70` assinatura, `:84` alertas, `:128` `get_webhook_delivery_logs`, reenvio via edge `:152`/`:207` | `webhook_subscriptions`, `security_alerts`, `get_webhook_delivery_logs` (existe), edge `webhook-dispatcher` (existe) | Cast manual de `supabase.rpc` `:128-132` |
| WebhookSubscriptionNew | `/admin/webhooks/new` (admin) | ✅ IMPLEMENTADO_TOTAL | insert real `:93`; geração de segredo `:12` | `webhook_subscriptions` | import morto `Textarea` `:9` |
| WebhooksAdmin | `/admin/webhooks` (admin) | ✅ IMPLEMENTADO_TOTAL | `:74`, `:85`, `:104` (3 RPCs), `:116` assinaturas, teste via edge `:153` | as 3 RPCs existem; edge `webhook-dispatcher` existe | imports mortos `Checkbox` `:14`, **`EditWebhookDialog` `:18` e `BulkRotateDialog` `:19` importados e não renderizados** — edição e rotação em massa inacessíveis por esta tela |
| WebhooksExecutive | `/admin/webhooks/executive` (admin) | ✅ IMPLEMENTADO_TOTAL | `:52` métricas 7d + gráficos `:10` | `get_webhook_executive_metrics_7d` (existe) | — |

**Contagem do lote B:** ✅ 36 · 🟨 5 · 🟦 0 · ⬛ 0.

Varredura ativa de smells no lote inteiro (41 arquivos, 11 909 linhas):
`Math.random()` → **0 ocorrências**. `TODO`/`FIXME`/`HACK`/`XXX` reais → **0**
(único match, `SalesCampaignDetail.tsx:279`, é a palavra "TODOS" em texto de confirmação).
`mock`/`dummy`/`fake`/`stub`/`WIP`/"em desenvolvimento" → **0**.
`onClick={() => {}}` → **0**. "em breve" → **2**: `Profile.tsx:147` (placeholder real) e
`PredictionMarketsPage.tsx:143` (empty state legítimo). Botões sem handler → **2**
(`ManagerDashboard.tsx:119-120`); todos os demais candidatos estavam dentro de
`<Link>`/`<PopoverTrigger>`/`<CollapsibleTrigger>` e foram descartados após inspeção.

---

## Achados graves

**1. `acknowledge_security_digest` não existe — botão de "marcar digest como revisado" quebrado.**
`src/pages/SecurityDigests.tsx:57` chama a RPC atrás de um cast `(supabase.rpc as any)` (com
`eslint-disable` na linha `:56`), o que silenciou o erro de tipo. Verificação: 0 ocorrências em
`supabase/migrations/` (262 arquivos), 0 em `src/integrations/supabase/types.ts`, e **ausente da lista
de funções do banco de produção** (`supabase_db_list_functions`, schema `public`). O botão está
renderizado e habilitado em `SecurityDigests.tsx:195-196`; todo clique cai no `onError` `:65-67`.
O lado de leitura já espera o recurso (`get_security_digest_history` retorna `ack_count`,
`acknowledged_by_me`, `acknowledgments` — tipados em `:24-25`), ou seja, a feature está metade
construída. **O cast `as any` é o mecanismo que permitiu isso chegar a produção.**

**2. `/security-dashboard` é rota admin sem guard admin.**
`src/App.tsx:278` registra `SecurityDashboard` com `<ProtectedRoute>` sem `requiredRole`, enquanto o
gêmeo `/security` → `RateLimitDashboard` exige admin (`App.tsx:225`). A página expõe uma aba
"Avançado" (`SecurityDashboard.tsx:127`, `:151-153`) com `SecurityAdminTab` incluindo a mutation de
`cleanup_old_security_logs` (`:84-96`) e estatísticas globais (`top_blocked_ips`, `:41`). **Não é
vazamento** — confirmei que `get_security_stats` chama `PERFORM public._require_admin()`
(`supabase/migrations/20260711194726_*.sql:69`) e a RLS de `audit_logs` é correta —, mas qualquer
usuário autenticado alcança uma central de segurança que lhe devolve erro/vazio, e o gate depende
100 % do servidor. Falta defesa em profundidade no cliente.

**3. Componentes de negócio importados e nunca renderizados (funcionalidade inacessível).**
Não são imports de UI genérica; são features inteiras penduradas:
`WebhooksAdmin.tsx:18` `EditWebhookDialog` e `:19` `BulkRotateDialog` (editar webhook e rotação em
massa de segredos — a RPC `bulk_rotate_webhook_secrets` **existe no banco**);
`SecurityRunbook.tsx:10` `SlaTargetEditor` (edição de metas de SLA, com a tabela `sla_targets` lida
em `:285`); `SalesCampaignDetail.tsx:15-18` `CampaignProgressChart`, `CampaignImportDialog`,
`CampaignTeamsPanel`; `SecurityDashboard.tsx:18/20/21` `BlockedIPsPanel`, `RateLimitRulesPanel`,
`LoginAttemptsPanel`. Backend pronto, UI desconectada.

**4. `ManagerDashboard` calcula métricas de equipe sobre dados fabricados no cliente.**
`src/pages/ManagerDashboard.tsx:47` fixa `questsTotal: 50` para todo mundo e `:50` fixa
`department: "Geral"` para todo perfil. Consequência direta: o filtro de departamento (`:54`) compara
contra `"Geral"` e **retorna zero membros para qualquer departamento selecionado** no Select que é
populado com departamentos reais (`:78`). Além disso a "Taxa de Conclusão" (`:56`, `:88`) é
`questsCompleted / 50` — um número inventado — e os deltas `"+5%"` (`:88`) e `"+2"` (`:89`) são
constantes de layout exibidas como variação real. Dois botões de ação rápida não têm handler
(`:119-120`).

**5. `/analytics` promete visão de sistema e entrega escopo pessoal para não-admin.**
`src/App.tsx:231` protege `RealTimeAnalytics` só por autenticação, embora a própria página se declare
subordinada ao admin (`backFallback="/admin"`, `RealTimeAnalytics.tsx:110`) e se intitule
"Monitoramento de atividade do sistema" (`:124`) com card "Usuários mais ativos" (`:139`). A RLS de
`audit_logs` (verificada no banco: policies `Admins can view all` / `Managers can view team` /
`Users can view own`) faz um colaborador comum ver apenas os próprios registros — os KPIs
(`:100-105`) e o ranking (`:88-92`) então exibem números corretos para o *dado retornado* mas
falsos para o *rótulo apresentado*. Risco de decisão errada, não de vazamento.

**Observação transversal:** `ProtectedRoute` suporta `requiredPermission`, `requiredPermissions` e
`minLevel` (`src/components/rbac/ProtectedRoute.tsx:41-47`, `:70-76`) e o sistema tem uma
`PermissionsAdmin` funcional gerindo permissões granulares — mas **nenhuma das 83 rotas usa qualquer
uma dessas opções**. Todo o RBAC de roteamento se resume a `requiredRole` "admin"/"manager".
