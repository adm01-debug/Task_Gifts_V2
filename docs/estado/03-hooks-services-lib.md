# Dimensão 3 — Lógica (hooks, services e lib)

> Documento de detalhe — 129 hooks, 96 services, 106 módulos de lib.
> Evidência em `arquivo:linha`. Correções da Fase D em `ESTADO_ATUAL.md` e `04-dados-e-runtime.md`.
> Runtime de build/teste = `NAO_VERIFICADO` (node_modules ausente).

---

## Hooks, contexts, constants, utils, types

# Auditoria de estado — `src/hooks` + `src/contexts` + `src/constants` + `src/utils` + `src/types` + `src/styles`

**Repo**: `/home/user/task-gifts-v2` · **Data**: 2026-08-16 · **Método**: leitura + medição estática. Nada aqui vem de documentação.

## Escopo medido

| Diretório | Arquivos | Linhas |
|---|---|---|
| `src/hooks` | 129 (`.ts`/`.tsx`) | 14.320 |
| `src/contexts` | 4 | 516 |
| `src/constants` | 1 | 60 |
| `src/utils` | 3 | 149 |
| `src/types` | 2 | 229 |
| `src/styles` | 1 (`.css`) | 134 |
| **Total lido** | **140** | **~15.4k** |

**486 funções-hook exportadas** em 129 arquivos.

## Como as contagens foram feitas (para você poder refutar)

1. **Chamadores**: parser de `import ... from '...'` com resolução de alias `@/` e de `index.ts`, sobre TODOS os `.ts/.tsx` de `src`. Um hook só conta como "chamado" se o nome dele aparece na *lista de nomes importados* de um arquivo que resolve para o módulo do hook. Isso elimina falsos positivos de substring — foi assim que se descobriu que `useENPS` de `useClimateSurveys.ts:36` está morto (os componentes importam `useENPS.ts`, outro módulo) e que `useQuestStats` é redefinido localmente em `src/pages/PersonalStats.tsx:59`.
2. **Tabelas/RPC/Edge**: quase nenhum hook toca o Supabase direto — eles delegam para `@/services/*`. A coluna lista o I/O do hook **mais o dos serviços que ele importa diretamente** (profundidade 1). Padrões capturados: `.from('x')`, `.rpc('x')`, `functions.invoke('x')`, `invokeEdge/invokeEdgeSafe('x')`, `table: 'x'` (realtime), `storage.from('x')`.
3. Apenas 24 dos 129 hooks importam `@/integrations/supabase/client` diretamente (`grep -c` sobre os imports).

## Resumo por classificação

| Classificação | Arquivos-hook | % |
|---|---|---|
| ✅ IMPLEMENTADO_TOTAL (usado, 0 hooks órfãos, I/O real) | 90 | 70% |
| 🟨 IMPLEMENTADO_PARCIAL (usado, mas com superfície morta) | 35 | 27% |
| 🟦 SUGERIDO_OU_INICIADO | 0 | 0% |
| ⬛ MORTO_OU_ABANDONADO (módulo com 0 importadores) | 4 | 3% |

**No nível de função: 96 de 486 hooks exportados (19,8%) têm ZERO chamadores.**

## Tabela — um arquivo-hook por linha

Legenda da 1ª coluna: `(Nh/M⬛)` = N hooks exportados, M deles sem chamador.

| Hook | Classificação | Nº chamadores (+ arquivo:linha de 1) | Tabelas/RPC/Edge acessados | Evidência | Problema |
|---|---|---|---|---|---|
| `use-mobile.tsx` (2h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 25 · `src/App.tsx:14` | — (sem I/O direto) | `src/hooks/use-mobile.tsx` · 25 módulos importam | — |
| `use-toast.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 22 · `src/components/ui/use-toast.ts:1` | — (sem I/O direto) | `src/hooks/use-toast.ts` · 22 módulos importam | — |
| `useAchievements.ts` (4h/2⬛) | 🟨 IMPLEMENTADO_PARCIAL | 6 · `src/components/profile/ProfileAchievements.tsx:5` | **T**: achievements, kudos, notifications, profiles, trail_enrollments, user_achievements | `src/hooks/useAchievements.ts` · 4 módulos importam | useUnlockAchievement:24 e useCheckComboAchievements:54 mortos; desbloqueio real ocorre via achievementsService chamado dos services. |
| `useActionPlanGenerator.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/pages/ClimateDiagnostics.tsx:20` | **RPC**: generate_action_plan_from_factor | `src/hooks/useActionPlanGenerator.ts` · 1 módulos importam | — |
| `useActionPlans.ts` (4h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 4 · `src/pages/ActionPlans.tsx:16` | **T**: action_plan_items, action_plans | `src/hooks/useActionPlans.ts` · 1 módulos importam | — |
| `useActivityComments.ts` (4h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 4 · `src/components/ActivityComments.tsx:9` | **T**: activity_comments, profiles | `src/hooks/useActivityComments.ts` · 2 módulos importam | — |
| `useActivityReactions.ts` (2h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 2 · `src/components/SocialFeed.tsx:11` | **T**: activity_reactions | `src/hooks/useActivityReactions.ts` · 2 módulos importam | — |
| `useAdminAlerts.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/admin/AdminAlertsPanel.tsx:6` | **EDGE**: admin-alerts | `src/hooks/useAdminAlerts.ts` · 1 módulos importam | Depende 100% da edge function `admin-alerts`; sem fallback se a função não estiver deployada. |
| `useAdminUsers.ts` (11h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 15 · `src/components/admin/UsersManager.tsx:18` | **T**: team_members, user_roles | `src/hooks/useAdminUsers.ts` · 3 módulos importam | — |
| `useAICoach.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/AICoachDialog.tsx:11` | **T**: ai_coach_messages<br>**EDGE**: ai-coach | `src/hooks/useAICoach.ts` · 1 módulos importam | Depende da edge `ai-coach` + tabela ai_coach_messages. |
| `useAnnouncements.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 2 · `src/components/AnnouncementsBoard.tsx:13` | **T**: announcement_reactions, announcement_reads, announcements<br>**RPC**: increment_announcement_views | `src/hooks/useAnnouncements.ts` · 2 módulos importam | — |
| `useAttendance.ts` (8h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 13 · `src/components/AttendanceModule.tsx:18` | **T**: attendance_records, attendance_settings, attendance_streaks | `src/hooks/useAttendance.ts` · 2 módulos importam | useTeamAttendance:120 morto. |
| `useAuctions.ts` (10h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 9 · `src/pages/AuctionsPage.tsx:8` | **T**: auction_admin_events, auction_bids, auctions<br>**RPC**: cancel_auction, close_auction, create_auction_draft, get_auction_summary, place_auction_bid, publish_auction | `src/hooks/useAuctions.ts` · 6 módulos importam | useAuctionSummary:38 morto (RPC get_auction_summary sem consumidor). |
| `useAudit.ts` (4h/3⬛) | 🟨 IMPLEMENTADO_PARCIAL | 3 · `src/components/profile/ProfileActivityTimeline.tsx:5` | **T**: audit_logs | `src/hooks/useAudit.ts` · 5 módulos importam | 3/4 mortos: useAuditLogsByUser:12, useAuditLogsByAction:20, useAuditLogsByEntity:27. Filtros de auditoria por usuario/acao/entidade não chegam a ser usados apesar de AuditFilters.tsx existir. |
| `useAuth.tsx` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 96 · `src/App.tsx:22` | — (sem I/O direto) | `src/hooks/useAuth.tsx` · 97 módulos importam | — |
| `useAutoChallenges.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/AutoChallengesWidget.tsx:18` | **T**: profiles, profiles_public, user_challenges<br>**RPC**: get_my_profile_private | `src/hooks/useAutoChallenges.ts` · 1 módulos importam | — |
| `useAvatar.ts` (5h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 9 · `src/components/ProfileAvatarSection.tsx:6` | **T**: avatar_items, profiles, user_avatar_config, user_avatar_items | `src/hooks/useAvatar.ts` · 4 módulos importam | — |
| `useBehavioralBadges.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/BehavioralBadgesWidget.tsx:1` | — (sem I/O direto) | `src/hooks/useBehavioralBadges.ts` · 1 módulos importam | — |
| `useBingo.ts` (3h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 3 · `src/pages/BingoPage.tsx:24` | **T**: bingo_marks<br>**RPC**: get_or_create_bingo_card, sync_bingo_card | `src/hooks/useBingo.ts` · 1 módulos importam | — |
| `useBoardTrail.ts` (13h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 14 · `src/pages/BoardTrailPage.tsx:17` | **T**: board_player_states, board_trails, quiz_questions<br>**RPC**: advance_board_trail, delete_board_trail, get_board_challenge_stats, get_board_trail_leaderboard, list_stuck_board_players, resolve_board_challenge, save_board_trail, unblock_board_players | `src/hooks/useBoardTrail.ts` · 6 módulos importam | — |
| `useBossBattles.ts` (7h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 7 · `src/pages/BossBattlePage.tsx:21` | **T**: boss_battle_damage, boss_battles<br>**RPC**: deal_boss_damage, get_boss_battle_leaderboard, settle_boss_battle | `src/hooks/useBossBattles.ts` · 3 módulos importam | — |
| `useBossWinRateGoals.ts` (4h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 5 · `src/components/boss/BossExecutiveSummaryCard.tsx:24` | **T**: boss_win_rate_goals<br>**RPC**: run_boss_win_rate_alerts | `src/hooks/useBossWinRateGoals.ts` · 2 módulos importam | — |
| `useCampaignImports.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/campaigns/CampaignImportHistory.tsx:7` | **T**: campaign_result_imports, campaign_result_rows<br>**RPC**: admin_profile_directory, apply_campaign_import, revert_campaign_import | `src/hooks/useCampaignImports.ts` · 1 módulos importam | — |
| `useCampaignTeams.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 2 · `src/components/campaigns/CampaignTeamsPanel.tsx:27` | **T**: campaign_team_members, campaign_team_split_batches, campaign_team_split_entries, campaign_teams, profiles_public<br>**RPC**: award_campaign_team_split, recalc_campaign_teams, revert_campaign_team_split | `src/hooks/useCampaignTeams.ts` · 2 módulos importam | — |
| `useCampaignTeamsDashboard.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/pages/CampaignTeamsDashboard.tsx:35` | **T**: campaign_participants, campaign_progress_events, campaign_team_members, campaign_team_split_batches, campaign_team_split_entries, campaign_teams, notification_preferences, notifications, profiles_public, sales_campaigns, team_members<br>**RPC**: award_campaign_team_split, recalc_campaign_progress, recalc_campaign_teams, revert_campaign_team_split, user_wants_in_app_notification<br>**EDGE**: send-campaign-push | `src/hooks/useCampaignTeamsDashboard.ts` · 1 módulos importam | — |
| `useCelebrations.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 2 · `src/components/CelebrationsBanner.tsx:2` | **T**: celebrations, profiles | `src/hooks/useCelebrations.ts` · 2 módulos importam | — |
| `useCertifications.ts` (9h/2⬛) | 🟨 IMPLEMENTADO_PARCIAL | 8 · `src/components/CertificationsPanel.tsx:11` | **T**: certifications, team_members, user_certifications<br>**RPC**: verify_certificate | `src/hooks/useCertifications.ts` · 3 módulos importam | useIssueCertification:71 e useCheckExpiringCertifications:106 mortos — não ha UI para emitir certificado nem para disparar a checagem de vencimento. |
| `useCheckins.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/pages/Checkins.tsx:14` | **T**: checkin_templates, checkins | `src/hooks/useCheckins.ts` · 1 módulos importam | — |
| `useChurnPrediction.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 3 · `src/components/ChurnPredictionPanel.tsx:28` | **EDGE**: churn-prediction | `src/hooks/useChurnPrediction.ts` · 3 módulos importam | Depende 100% da edge `churn-prediction`. |
| `useClickOutside.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/dashboard/DashboardHeader.tsx:24` | — (sem I/O direto) | `src/hooks/useClickOutside.ts` · 1 módulos importam | — |
| `useClimateSurveys.ts` (9h/9⬛) | ⬛ MORTO_OU_ABANDONADO | 0 · — | **T**: climate_pillar_scores, climate_question_answers, climate_survey_questions, climate_survey_responses, climate_surveys | `src/hooks/useClimateSurveys.ts` · 0 módulos importam | MODULO NUNCA IMPORTADO. 9/9 hooks mortos. Toda a CRUD de pesquisa de clima (criar survey, criar pergunta, submeter resposta) não tem UI. `useENPS` aqui e homonimo do modulo useENPS.ts (colisao de nome que mascara o obito). |
| `useCombo.ts` (3h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 2 · `src/components/ComboIndicator.tsx:7` | **T**: achievements, kudos, notifications, profiles, trail_enrollments, user_achievements, user_combos | `src/hooks/useCombo.ts` · 2 módulos importam | useRegisterComboAction:41 morto — o unico escritor do combo pela camada de hooks. A escrita real acontece em services (questsService.ts:244, kudosService.ts:216, trailsService.ts:255, attendanceService.ts). |
| `useCompetencies.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 2 · `src/components/CompetencyRadar.tsx:32` | **T**: attendance_streaks, kudos, module_progress, quest_assignments, user_achievements | `src/hooks/useCompetencies.ts` · 2 módulos importam | Nome duplicado com useDevelopmentPlans.ts:123 (implementacoes diferentes). Risco de divergencia de dados na mesma tela. |
| `useCompetencyAlerts.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/pages/Index.tsx:21` | **EDGE**: competency-alerts | `src/hooks/useCompetencyAlerts.ts` · 1 módulos importam | — |
| `useContinuousEngagement.ts` (4h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 4 · `src/components/engagement/ContinuousSurveyWidget.tsx:13` | **RPC**: assign_engagement_questions, get_active_engagement_cycle, get_engagement_cycle_progress, submit_engagement_answer | `src/hooks/useContinuousEngagement.ts` · 2 módulos importam | useEngagementProgress:25 morto (RPC get_engagement_cycle_progress sem consumidor). |
| `useDailyWager.ts` (4h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 5 · `src/pages/DailyWagerPage.tsx:14` | **T**: wager_entries<br>**RPC**: get_daily_wager, get_wager_leaderboard, submit_daily_wager | `src/hooks/useDailyWager.ts` · 4 módulos importam | — |
| `useDebounce.ts` (3h/2⬛) | 🟨 IMPLEMENTADO_PARCIAL | 3 · `src/components/GlobalSearch.tsx:15` | — (sem I/O direto) | `src/hooks/useDebounce.ts` · 3 módulos importam | useDebouncedCallback:35 e useThrottledCallback:72 mortos. |
| `useDepartments.ts` (10h/6⬛) | 🟨 IMPLEMENTADO_PARCIAL | 30 · `src/components/DepartmentRankings.tsx:14` | **T**: departments, team_members | `src/hooks/useDepartments.ts` · 27 módulos importam | 6/10 mortos. Gestao de membros de departamento (useAddTeamMember:81, useRemoveTeamMember:101, useSetManager:114) morta — foi reimplementada em useAdminUsers.ts (useAssignDepartment:117, useSetDepartmentManager:180). Duplicacao viva. |
| `useDepartmentWars.ts` (11h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 10 · `src/pages/DepartmentWarPage.tsx:26` | **T**: department_war_contributions, department_war_departments, department_war_metrics, department_wars, departments<br>**RPC**: get_department_war_feed, get_department_war_standings, settle_department_war, sync_department_war_headcount | `src/hooks/useDepartmentWars.ts` · 3 módulos importam | useUpdateDepartmentWar:145 morto — não ha edicao de guerra apos criada. |
| `useDevelopmentPlans.ts` (11h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 14 · `src/components/admin/DevelopmentPlanManager.tsx:23` | **T**: competencies, development_plan_actions, development_plans | `src/hooks/useDevelopmentPlans.ts` · 6 módulos importam | useCreateCompetency:130 morto. `useCompetencies` esta duplicado aqui (linha 123) e em useCompetencies.ts:9 com implementacoes DIFERENTES; ambos vivos, consumidores distintos. |
| `useDeviceDetection.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 3 · `src/components/security/DevicesPanel.tsx:16` | **T**: new_device_alerts, user_devices<br>**EDGE**: detect-new-device | `src/hooks/useDeviceDetection.ts` · 3 módulos importam | getUserDevices/getUnreadAlerts engolem erro e devolvem [] (linhas 130 e 146); registerDevice devolve `{isNewDevice:false, isTrusted:false}` no catch (linha 115) — falha de deteccao de dispositivo novo vira silencio. |
| `useDuels.ts` (8h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 8 · `src/pages/Duels.tsx:18` | **T**: direct_duels, profiles | `src/hooks/useDuels.ts` · 3 módulos importam | — |
| `useEngagementDiagnostics.ts` (7h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 7 · `src/pages/ClimateDiagnostics.tsx:22` | **RPC**: get_engagement_factor_scores, get_engagement_nps, get_engagement_nps_history, get_engagement_overview, get_engagement_pillar_benchmark, get_engagement_pillar_correlations, get_engagement_pillar_scores | `src/hooks/useEngagementDiagnostics.ts` · 1 módulos importam | — |
| `useEngagementReports.ts` (7h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 9 · `src/pages/EngagementReports.tsx:16` | **T**: attendance_records, custom_quests, departments, module_progress, profiles, quest_assignments, team_members, trail_enrollments, user_certifications | `src/hooks/useEngagementReports.ts` · 2 módulos importam | — |
| `useENPS.ts` (11h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 12 · `src/components/admin/ENPSDashboard.tsx:30` | **T**: engagement_snapshots, enps_responses, enps_surveys<br>**RPC**: calculate_enps_score, generate_engagement_snapshot | `src/hooks/useENPS.ts` · 4 módulos importam | useENPSSurvey:13 morto. |
| `useExecutiveMetrics.ts` (3h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 6 · `src/pages/ExecutiveDashboard.tsx:21` | **RPC**: get_department_metrics, get_executive_metrics, get_monthly_trends | `src/hooks/useExecutiveMetrics.ts` · 2 módulos importam | — |
| `useFeedback.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/ui/button.tsx:7` | — (sem I/O direto) | `src/hooks/useFeedback.ts` · 1 módulos importam | — |
| `useFeedback360.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 2 · `src/components/admin/FeedbackCycleManager.tsx:24` | **T**: feedback_cycles, feedback_requests, feedback_responses | `src/hooks/useFeedback360.ts` · 2 módulos importam | — |
| `useFirstTimeIndicator.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/StatsGrid.tsx:16` | — (sem I/O direto) | `src/hooks/useFirstTimeIndicator.ts` · 1 módulos importam | — |
| `useFuseSearch.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 11 · `src/components/PeerRecognition.tsx:17` | — (sem I/O direto) | `src/hooks/useFuseSearch.ts` · 12 módulos importam | — |
| `useGoalBetFilter.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/hooks/useGoalBetUrlSync.ts:9` | — (sem I/O direto) | `src/hooks/useGoalBetFilter.ts` · 1 módulos importam | — |
| `useGoalBetSuggestion.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/prediction/SettleMarketDialog.tsx:16` | **T**: campaign_participants, campaign_progress_events, notification_preferences, notifications, profiles_public, sales_campaigns, team_members<br>**RPC**: recalc_campaign_progress, user_wants_in_app_notification<br>**EDGE**: send-campaign-push | `src/hooks/useGoalBetSuggestion.ts` · 1 módulos importam | — |
| `useGoalBetUrlSync.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/pages/PredictionMarketsPage.tsx:27` | — (sem I/O direto) | `src/hooks/useGoalBetUrlSync.ts` · 1 módulos importam | — |
| `useGoals.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 3 · `src/components/GoalsWidget.tsx:11` | **T**: goal_updates, goals, key_results | `src/hooks/useGoals.ts` · 3 módulos importam | — |
| `useHaptics.ts` (2h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 27 · `src/components/AchievementSystem.tsx:5` | — (sem I/O direto) | `src/hooks/useHaptics.ts` · 30 módulos importam | — |
| `useHighPotentials.ts` (3h/2⬛) | 🟨 IMPLEMENTADO_PARCIAL | 1 · `src/components/manager/HighPotentialsPanel.tsx:28` | **T**: attendance_records, checkins, development_plan_actions, development_plans, goals, kudos, mentorship_pairs, mood_entries, nine_box_evaluations, profiles, trail_enrollments, user_certifications | `src/hooks/useHighPotentials.ts` · 1 módulos importam | 2/3 mortos: useHighPotentials:5 e useTopHighPotentials:13. So a variante manual (useHighPotentialsManual:21) e usada. |
| `useI18n.ts` (2h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 2 · `src/components/LanguageSelector.tsx:15` | — (sem I/O direto) | `src/hooks/useI18n.ts` · 3 módulos importam | i18n e uma casca. `I18nProvider` e montado em Providers.tsx:34 mas `useI18nContext` (linha 152) tem 0 consumidores; LanguageSelector.tsx:28 chama useI18n() direto, criando estado LOCAL proprio. Nenhum componente da app renderiza `t.*`. Trocar idioma não muda nada na tela. |
| `useIpWhitelist.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/admin/IpWhitelistManager.tsx:2` | **T**: ip_access_logs, ip_whitelist<br>**RPC**: is_ip_whitelisted, log_ip_access | `src/hooks/useIpWhitelist.ts` · 1 módulos importam | — |
| `useKeyboardShortcuts.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/KeyboardShortcutsHelp.tsx:3` | — (sem I/O direto) | `src/hooks/useKeyboardShortcuts.ts` · 1 módulos importam | — |
| `useKudos.ts` (7h/2⬛) | 🟨 IMPLEMENTADO_PARCIAL | 8 · `src/components/ProfileKudosSection.tsx:9` | **T**: kudos, kudos_badges, profiles | `src/hooks/useKudos.ts` · 3 módulos importam | useKudosGiven:78 e useDeleteKudos:123 mortos — não ha tela de kudos enviados nem de remocao. |
| `useLeaderboard.ts` (4h/4⬛) | ⬛ MORTO_OU_ABANDONADO | 0 · — | **T**: profiles, profiles_public<br>**RPC**: get_my_profile_private | `src/hooks/useLeaderboard.ts` · 0 módulos importam | MODULO NUNCA IMPORTADO. 4/4 mortos. `useLeaderboard` duplicado em useProfiles.ts:54 — e desse que os componentes importam (LiveLeaderboard.tsx:6). |
| `useLeagues.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 3 · `src/components/LeagueCard.tsx:7` | **T**: league_history, league_members, leagues, profiles, user_leagues | `src/hooks/useLeagues.ts` · 3 módulos importam | — |
| `useLightningQuiz.ts` (4h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 4 · `src/pages/LightningQuizPage.tsx:14` | **T**: lightning_quiz_sessions<br>**RPC**: answer_lightning_question, finish_lightning_round, start_lightning_round | `src/hooks/useLightningQuiz.ts` · 1 módulos importam | — |
| `useListenToRankChanges.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/pages/Index.tsx:20` | **T**: notifications<br>**EDGE**: competency-alerts | `src/hooks/useListenToRankChanges.ts` · 1 módulos importam | — |
| `useLoginLockout.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/pages/Auth.tsx:6` | **RPC**: check_login_lockout, log_login_attempt, reset_login_attempts | `src/hooks/useLoginLockout.ts` · 1 módulos importam | Fail-open: se a RPC check_login_lockout falhar, checkLockout retorna null (linhas 34 e 43) e `isLocked` fica false (linha 130). O bloqueio de UI some em caso de erro de rede. |
| `useLuckyWheel.ts` (11h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 13 · `src/pages/LuckyWheelPage.tsx:14` | **T**: lucky_wheel_payout_snapshots, lucky_wheel_prize_audit, lucky_wheel_prizes, lucky_wheel_spins, profiles_public<br>**RPC**: get_lucky_wheel_prizes_display, get_lucky_wheel_status, spin_lucky_wheel | `src/hooks/useLuckyWheel.ts` · 7 módulos importam | — |
| `useMemoryGame.ts` (9h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 10 · `src/pages/MemoryGamePage.tsx:13` | **T**: memory_decks, memory_pairs, memory_sessions<br>**RPC**: finish_memory_session, get_memory_leaderboard, start_memory_session | `src/hooks/useMemoryGame.ts` · 3 módulos importam | — |
| `useMissions.ts` (6h/3⬛) | 🟨 IMPLEMENTADO_PARCIAL | 5 · `src/components/DepartmentMissions.tsx:16` | **T**: department_missions, department_rankings, user_mission_progress | `src/hooks/useMissions.ts` · 3 módulos importam | 3/6 mortos: useUpdateMissionProgress:64, useDepartmentRankings:93, useAllRankings:102. As tabelas department_rankings/user_mission_progress so tem leitura por outras vias. |
| `useMoodTracker.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 2 · `src/components/MoodTrackerWidget.tsx:7` | **T**: mood_entries, team_members | `src/hooks/useMoodTracker.ts` · 2 módulos importam | — |
| `useNavigationHelpers.ts` (2h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 5 · `src/components/navigation/DesktopBackButton.tsx:5` | — (sem I/O direto) | `src/hooks/useNavigationHelpers.ts` · 5 módulos importam | — |
| `useNetworkStatus.ts` (2h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 1 · `src/components/mobile/NetworkStatusBar.tsx:5` | — (sem I/O direto) | `src/hooks/useNetworkStatus.ts` · 1 módulos importam | useNetworkStatus:43 morto; so useNetworkPendingIndicator:158 e consumido. |
| `useNineBox.ts` (6h/2⬛) | 🟨 IMPLEMENTADO_PARCIAL | 6 · `src/components/admin/NineBoxMatrix.tsx:17` | **T**: nine_box_evaluations<br>**RPC**: get_nine_box_distribution | `src/hooks/useNineBox.ts` · 5 módulos importam | useNineBoxDistribution:13 (RPC get_nine_box_distribution) e useUpdateNineBoxEvaluation:55 mortos — não existe edicao de avaliacao 9-box nem uso da RPC de distribuicao. |
| `useNotifications.ts` (6h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 5 · `src/components/NotificationCenter.tsx:26` | **T**: notifications<br>**EDGE**: competency-alerts | `src/hooks/useNotifications.ts` · 1 módulos importam | useSendNotification:217 morto — envio manual de notificacao não tem UI. |
| `useNr1Risk.ts` (3h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 3 · `src/pages/Nr1Risks.tsx:18` | **RPC**: generate_action_plan_from_nr1_category, get_engagement_factor_scores, get_engagement_nps, get_engagement_nps_history, get_engagement_overview, get_engagement_pillar_benchmark, get_engagement_pillar_correlations, get_engagement_pillar_scores, get_nr1_risk_matrix, get_nr1_summary | `src/hooks/useNr1Risk.ts` · 1 módulos importam | — |
| `useOnboarding.ts` (4h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 5 · `src/components/onboarding/OnboardingModal.tsx:14` | **T**: onboarding_progress, profiles | `src/hooks/useOnboarding.ts` · 2 módulos importam | — |
| `useOneOnOnePreparation.ts` (2h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 1 · `src/pages/Checkins.tsx:20` | **T**: checkins, development_plan_actions, development_plans, goals, kudos, mood_entries, nine_box_evaluations, profiles | `src/hooks/useOneOnOnePreparation.ts` · 1 módulos importam | useOneOnOnePreparation:5 morto; so a variante manual e usada. |
| `useOnlineStatus.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/OfflineIndicator.tsx:3` | — (sem I/O direto) | `src/hooks/useOnlineStatus.ts` · 1 módulos importam | — |
| `useOpinions.ts` (7h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 6 · `src/pages/OpinionChannel.tsx:17` | **T**: opinion_responses, opinions<br>**RPC**: generate_action_plan_from_opinion, get_opinion_feed, respond_to_opinion, set_opinion_status, toggle_opinion_support | `src/hooks/useOpinions.ts` · 3 módulos importam | useSetOpinionStatus:75 morto (RPC set_opinion_status sem consumidor). |
| `useOrganization.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 4 · `src/components/admin/OrganizationSettings.tsx:10` | **T**: org_members, org_theme_history, organizations<br>**STG**: org-assets | `src/hooks/useOrganization.ts` · 4 módulos importam | — |
| `usePasswordResetRealtime.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/admin/PasswordResetApprovalPanel.tsx:46` | **T**: password_reset_requests | `src/hooks/usePasswordResetRealtime.ts` · 1 módulos importam | — |
| `usePDI.ts` (1h/1⬛) | ⬛ MORTO_OU_ABANDONADO | 0 · — | **T**: development_plan_actions, pdi_checkins, pdi_mentors, pdi_templates | `src/hooks/usePDI.ts` · 0 módulos importam | MODULO NUNCA IMPORTADO. Arrasta junto todo `src/services/pdiService.ts` (único importador). `pdi_templates`, `pdi_mentors`, `pdi_checkins` ficam sem qualquer consumidor no cliente. |
| `usePDIAlerts.ts` (2h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 1 · `src/components/admin/PDIAlertsPanel.tsx:26` | **T**: certifications, development_plan_actions, development_plans, nine_box_evaluations, profiles, user_certifications | `src/hooks/usePDIAlerts.ts` · 1 módulos importam | usePDIAlertCounts:269 morto. Arquivo de 279 linhas com regra de alerta inteira no cliente (le certifications, development_plans, nine_box_evaluations, profiles direto). |
| `usePerformanceTrack.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/PageWrapper.tsx:4` | — (sem I/O direto) | `src/hooks/usePerformanceTrack.ts` · 1 módulos importam | — |
| `usePermissions.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 3 · `src/components/admin/RolePermissionsManager.tsx:25` | **T**: permissions, role_permissions, roles, user_roles | `src/hooks/usePermissions.ts` · 3 módulos importam | Implementacao concorrente a useRBAC.ts. Carrega userPermissions via useEffect+setState (fora do react-query, sem cache/invalidacao) — janela em que hasPermission() retorna false para tudo. |
| `usePositions.ts` (21h/6⬛) | 🟨 IMPLEMENTADO_PARCIAL | 15 · `src/components/admin/PositionsManager.tsx:15` | **T**: penalty_rules, position_task_templates, positions, task_penalties, task_scores, user_positions<br>**RPC**: apply_task_penalty, complete_task_score | `src/hooks/usePositions.ts` · 2 módulos importam | 6/21 mortos, incluindo TODO o fluxo de task scores do colaborador: useTaskScores:160, useMyTaskScores:167, useCompleteTaskScore:174 (RPC complete_task_score) e useApplyPenalty:203 (RPC apply_task_penalty). As tabelas task_scores/task_penalties so sao lidas pelo admin. |
| `usePredictionMarkets.ts` (9h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 13 · `src/components/prediction/OracleLeaderboard.tsx:14` | **T**: prediction_admin_events, prediction_markets, prediction_stakes<br>**RPC**: create_prediction_market, get_prediction_odds_history, get_prediction_oracle_aggregates, place_prediction_stake, settle_prediction_market, transition_prediction_market | `src/hooks/usePredictionMarkets.ts` · 10 módulos importam | — |
| `useProfiles.ts` (9h/4⬛) | 🟨 IMPLEMENTADO_PARCIAL | 35 · `src/components/prediction/OracleLeaderboard.tsx:15` | **T**: profiles, profiles_public<br>**RPC**: get_my_profile_private | `src/hooks/useProfiles.ts` · 35 módulos importam | 4 mutations mortas (useUpdateProfile:62, useAddXp:80, useAddCoins:108, useIncrementStreak:124). O ganho de XP/moedas acontece via profilesService.addXp chamado direto pelos services (ex: src/services/trailsService.ts:261). useUpdateProfile não tem NENHUM caminho equivalente na UI. |
| `usePullToRefresh.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/MobilePullToRefresh.tsx:4` | — (sem I/O direto) | `src/hooks/usePullToRefresh.ts` · 1 módulos importam | — |
| `usePulseSurveys.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 2 · `src/components/PulseSurveyWidget.tsx:11` | **T**: pulse_responses, pulse_surveys | `src/hooks/usePulseSurveys.ts` · 2 módulos importam | — |
| `usePurchaseGovernance.ts` (3h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 3 · `src/components/shop-admin/PurchaseGovernanceDialog.tsx:28` | **T**: profiles, purchase_approvals<br>**RPC**: review_purchase<br>**EDGE**: reward-approval-review | `src/hooks/usePurchaseGovernance.ts` · 1 módulos importam | — |
| `usePushDevice.ts` (3h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 4 · `src/components/PushNotificationToggle.tsx:10` | **T**: notifications, push_subscriptions, push_sync_events<br>**RPC**: get_account_devices, revoke_device_by_fingerprint, revoke_push_device<br>**EDGE**: push-device-revoked, push-public-key | `src/hooks/usePushDevice.ts` · 4 módulos importam | — |
| `usePushHistory.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/PushNotificationHistory.tsx:11` | **T**: push_notification_logs, push_subscriptions | `src/hooks/usePushHistory.ts` · 1 módulos importam | — |
| `usePushNotifications.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/hooks/useSecurityPushNotifications.ts:4` | — (sem I/O direto) | `src/hooks/usePushNotifications.ts` · 1 módulos importam | — |
| `usePushSubscription.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/PushNotificationToggle.tsx:9` | **T**: notifications, push_subscriptions, push_sync_events<br>**RPC**: get_account_devices, revoke_device_by_fingerprint, revoke_push_device<br>**EDGE**: push-device-revoked, push-public-key | `src/hooks/usePushSubscription.ts` · 1 módulos importam | — |
| `usePWAInstall.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/PWAInstallPrompt.tsx:5` | — (sem I/O direto) | `src/hooks/usePWAInstall.ts` · 1 módulos importam | — |
| `useQuests.ts` (15h/14⬛) | 🟨 IMPLEMENTADO_PARCIAL | 1 · `src/components/GlobalSearch.tsx:12` | **T**: custom_quests, quest_assignments, quest_steps | `src/hooks/useQuests.ts` · 1 módulos importam | 14/15 mortos (so `useQuests` e usado, por GlobalSearch.tsx:12). Toda a CRUD de quests (create/update/delete/assign/complete) esta morta; QuestBuilder.tsx:55 escreve direto em `custom_quests` com supabase, e QuestsList.tsx chama questsService direto. `useQuestStats` foi reimplementado localmente em src/pages/PersonalStats.tsx:59. |
| `useQuizQuestions.ts` (8h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 10 · `src/pages/DailyQuiz.tsx:12` | **T**: quiz_options, quiz_questions<br>**RPC**: get_quiz_lifeline, get_quiz_play_set, grade_quiz_answer, quiz_fifty_fifty | `src/hooks/useQuizQuestions.ts` · 5 módulos importam | useQuizQuestionsWithOptions:35 morto. |
| `useQuizScores.ts` (3h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 2 · `src/components/quiz/QuizDailyRanking.tsx:6` | **T**: profiles, quiz_scores | `src/hooks/useQuizScores.ts` · 2 módulos importam | useUserTodayScores:46 morto. |
| `useQuizStats.ts` (4h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 5 · `src/components/quiz/QuizCategoryStats.tsx:1` | **T**: quiz_answers, quiz_questions<br>**RPC**: get_quiz_category_stats | `src/hooks/useQuizStats.ts` · 5 módulos importam | — |
| `useRBAC.ts` (3h/2⬛) | 🟨 IMPLEMENTADO_PARCIAL | 21 · `src/components/ExecutiveReportPreferenceToggle.tsx:2` | **T**: role_permissions, roles, user_roles | `src/hooks/useRBAC.ts` · 28 módulos importam | useHasPermission:277 e useCanAccess:282 mortos. Convive com usePermissions.ts (outra implementacao de RBAC, 3 consumidores) — duas fontes de verdade para permissao. |
| `useReducedMotion.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/PageTransition.tsx:5` | — (sem I/O direto) | `src/hooks/useReducedMotion.ts` · 1 módulos importam | — |
| `useSalesCampaigns.ts` (2h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 5 · `src/components/prediction/GoalBetDialog.tsx:26` | **T**: campaign_participants, campaign_progress_events, notification_preferences, notifications, profiles_public, sales_campaigns, team_members<br>**RPC**: recalc_campaign_progress, user_wants_in_app_notification<br>**EDGE**: send-campaign-push | `src/hooks/useSalesCampaigns.ts` · 5 módulos importam | — |
| `useScratchCards.ts` (3h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 2 · `src/pages/ScratchCardPage.tsx:13` | **T**: scratch_cards<br>**RPC**: grant_scratch_card, reveal_scratch_card | `src/hooks/useScratchCards.ts` · 1 módulos importam | useGrantScratchCard:31 morto (RPC grant_scratch_card sem consumidor na UI). |
| `useScrollDirection.ts` (2h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 3 · `src/components/mobile/MobileHidingHeader.tsx:4` | — (sem I/O direto) | `src/hooks/useScrollDirection.ts` · 3 módulos importam | — |
| `useScrollHeader.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 5 · `src/components/mobile/MobilePageLayout.tsx:7` | — (sem I/O direto) | `src/hooks/useScrollHeader.ts` · 5 módulos importam | — |
| `useSeasonalEvents.ts` (3h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 3 · `src/components/SeasonalEventBanner.tsx:8` | **T**: profiles, seasonal_challenges, seasonal_events, user_seasonal_progress | `src/hooks/useSeasonalEvents.ts` · 2 módulos importam | — |
| `useSecurityPushNotifications.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 2 · `src/components/security/SecurityNotificationsToggle.tsx:7` | **T**: blocked_ips, login_attempts, new_device_alerts, security_alerts | `src/hooks/useSecurityPushNotifications.ts` · 2 módulos importam | — |
| `useSEO.ts` (3h/2⬛) | 🟨 IMPLEMENTADO_PARCIAL | 19 · `src/pages/Duels.tsx:14` | — (sem I/O direto) | `src/hooks/useSEO.ts` · 19 módulos importam | useCanonicalUrl:143 e useShouldIndex:151 mortos. |
| `useSequenceGame.ts` (9h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 9 · `src/pages/SequenceGamePage.tsx:12` | **T**: sequence_attempts, sequence_procedures<br>**RPC**: get_sequence_play_set, get_sequence_procedure_stats, save_sequence_procedure, submit_sequence_attempt | `src/hooks/useSequenceGame.ts` · 3 módulos importam | — |
| `useShop.ts` (15h/2⬛) | 🟨 IMPLEMENTADO_PARCIAL | 18 · `src/components/RewardsShop.tsx:4` | **T**: profiles, shop_promotions, shop_purchases, shop_rewards | `src/hooks/useShop.ts` · 11 módulos importam | useUpdatePurchaseStatus:135 e useShopRewardsByCategory:33 mortos. Aprovacao/mudanca de status de compra pela loja passa por usePurchaseGovernance/reward-approval-review. |
| `useSocialFeed.ts` (2h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 2 · `src/components/SocialFeed.tsx:8` | **T**: audit_logs, profiles | `src/hooks/useSocialFeed.ts` · 2 módulos importam | useUserFeed:52 morto (feed por usuario não tem tela). |
| `useSoundEffects.tsx` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 17 · `src/components/SoundSettingsCard.tsx:9` | — (sem I/O direto) | `src/hooks/useSoundEffects.tsx` · 17 módulos importam | 705 linhas, maior hook do repo. Usa Math.random() nas linhas 271, 368, 436, 539, 613, 678 — legitimo (variacao de frequencia do WebAudio), não e dado falso. |
| `useSuccession.ts` (4h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 3 · `src/components/manager/SuccessionPanel.tsx:7` | **T**: departments, positions, profiles, user_positions | `src/hooks/useSuccession.ts` · 1 módulos importam | useSuccessionPlan:13 morto. |
| `useSwipeBack.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 2 · `src/components/mobile/MobilePageLayout.tsx:8` | — (sem I/O direto) | `src/hooks/useSwipeBack.ts` · 2 módulos importam | — |
| `useSwipeNavigation.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/App.tsx:19` | — (sem I/O direto) | `src/hooks/useSwipeNavigation.ts` · 1 módulos importam | — |
| `useTheme.tsx` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 2 · `src/components/CommandPalette.tsx:21` | — (sem I/O direto) | `src/hooks/useTheme.tsx` · 3 módulos importam | — |
| `useTournaments.ts` (5h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 5 · `src/pages/TournamentsPage.tsx:16` | **RPC**: get_tournament_bracket, join_tournament, list_tournaments, report_tournament_match, start_tournament | `src/hooks/useTournaments.ts` · 1 módulos importam | — |
| `useTradingCards.ts` (8h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 8 · `src/pages/CardAlbumPage.tsx:12` | **T**: card_definitions, card_packs, card_trades, user_cards<br>**RPC**: claim_card_set_reward, get_card_set_rewards, open_card_pack, propose_card_trade, respond_card_trade | `src/hooks/useTradingCards.ts` · 3 módulos importam | — |
| `useTrails.ts` (19h/7⬛) | 🟨 IMPLEMENTADO_PARCIAL | 23 · `src/components/GlobalSearch.tsx:11` | **T**: certifications, learning_trails, module_progress, trail_enrollments, trail_modules, trail_prerequisites | `src/hooks/useTrails.ts` · 9 módulos importam | 7/19 mortos: useCreateTrail:133, useUpdateTrail:206, useDeleteTrail:219, useAddPrerequisite:248, useRemovePrerequisite:264, useCheckPrerequisites:238, useTrailsByDepartment:24. Nao existe UI para criar/editar/apagar trilha nem para gerenciar pre-requisitos. |
| `useTwoFactor.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 3 · `src/components/auth/TwoFactorSetup.tsx:2` | **T**: user_two_factor | `src/hooks/useTwoFactor.ts` · 3 módulos importam | — |
| `useTypePreferences.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 4 · `src/components/ExecutiveReportPreferenceToggle.tsx:8` | **T**: notification_preferences | `src/hooks/useTypePreferences.ts` · 4 módulos importam | — |
| `useUnsavedChanges.ts` (2h/2⬛) | ⬛ MORTO_OU_ABANDONADO | 0 · — | — (sem I/O direto) | `src/hooks/useUnsavedChanges.ts` · 0 módulos importam | MODULO NUNCA IMPORTADO. Guarda de navegacao/beforeunload existe mas nunca e montada: formularios podem perder dados sem aviso. |
| `useUserRank.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 4 · `src/components/StatsGrid.tsx:7` | **T**: profiles | `src/hooks/useUserRank.ts` · 4 módulos importam | — |
| `useViewTransition.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/mobile/MobilePageLayout.tsx:9` | — (sem I/O direto) | `src/hooks/useViewTransition.ts` · 1 módulos importam | — |
| `useWagerAdmin.ts` (6h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 6 · `src/pages/WagerQuestionAdminPage.tsx:25` | **T**: wager_budget_settings, wager_questions<br>**RPC**: list_wager_questions, save_wager_question | `src/hooks/useWagerAdmin.ts` · 2 módulos importam | — |
| `useWagerIntegrityReviews.ts` (3h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 3 · `src/components/wager/WagerIntegrityCard.tsx:11` | **T**: profiles_public, wager_integrity_review_events, wager_integrity_reviews | `src/hooks/useWagerIntegrityReviews.ts` · 1 módulos importam | — |
| `useWarLeadership.ts` (2h/1⬛) | 🟨 IMPLEMENTADO_PARCIAL | 1 · `src/components/war/WarLeadershipAlert.tsx:4` | **RPC**: get_user_department_id | `src/hooks/useWarLeadership.ts` · 1 módulos importam | useMyDepartmentId:17 morto. |
| `useWebAuthn.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 2 · `src/components/security/PasskeysPanel.tsx:25` | **T**: webauthn_challenges, webauthn_credentials<br>**RPC**: get_passkeys_by_email, user_has_passkeys | `src/hooks/useWebAuthn.ts` · 2 módulos importam | — |
| `useWeeklyChallenge.ts` (1h/0⬛) | ✅ IMPLEMENTADO_TOTAL | 1 · `src/components/WeeklyChallengeCard.tsx:7` | **T**: notifications, profiles, profiles_public, weekly_challenges<br>**RPC**: get_my_profile_private<br>**EDGE**: competency-alerts | `src/hooks/useWeeklyChallenge.ts` · 1 módulos importam | — |

---

## Hooks órfãos (⬛)

### A. Módulos inteiros sem nenhum importador — 4 arquivos, 305 linhas mortas

| Arquivo | Linhas | Hooks | Prova | O que morre junto |
|---|---|---|---|---|
| `src/hooks/useClimateSurveys.ts` | 112 | 9 | `grep -rn "useClimateSurveys" src/` → só o próprio arquivo | CRUD completa de pesquisa de clima: `useCreateClimateSurvey:44`, `useUpdateClimateSurvey:60`, `useCreateSurveyQuestion:77`, `useSubmitSurveyResponse:93`. Tabelas `climate_surveys`, `climate_survey_questions`, `climate_survey_responses`, `climate_question_answers`, `climate_pillar_scores` ficam sem escrita por esta via. |
| `src/hooks/useLeaderboard.ts` | 63 | 4 | `grep -rn "hooks/useLeaderboard" src/` → 0 resultados | `useWeeklyLeaderboard:25`, `useMonthlyLeaderboard:37`, `useAllTimeLeaderboard:48`, `useLeaderboard:60`. Os consumidores importam o homônimo de `useProfiles.ts:54` (`src/components/LiveLeaderboard.tsx:6`). |
| `src/hooks/usePDI.ts` | 81 | 1 | `grep -rn "hooks/usePDI[\"']" src/` → 0 resultados | `usePDI:5`. Arrasta junto todo o `src/services/pdiService.ts`, cujo único importador é este hook. Tabelas `pdi_templates`, `pdi_mentors`, `pdi_checkins` ficam **sem nenhum consumidor no cliente**. |
| `src/hooks/useUnsavedChanges.ts` | 53 | 2 | `grep -rn "useUnsavedChanges\|useFormDirtyState" src/` → só o próprio arquivo | `useUnsavedChanges:10` (guarda `beforeunload`) e `useFormDirtyState:45`. Nenhum formulário do app avisa antes de descartar alterações. |

### B. Funções-hook órfãs dentro de módulos vivos — 92 funções

| Hook órfão | Local |
|---|---|
| `useUnlockAchievement` | src/hooks/useAchievements.ts:24 |
| `useCheckComboAchievements` | src/hooks/useAchievements.ts:54 |
| `useTeamAttendance` | src/hooks/useAttendance.ts:120 |
| `useAuctionSummary` | src/hooks/useAuctions.ts:38 |
| `useAuditLogsByUser` | src/hooks/useAudit.ts:12 |
| `useAuditLogsByAction` | src/hooks/useAudit.ts:20 |
| `useAuditLogsByEntity` | src/hooks/useAudit.ts:27 |
| `useIssueCertification` | src/hooks/useCertifications.ts:71 |
| `useCheckExpiringCertifications` | src/hooks/useCertifications.ts:106 |
| `useClimateSurveys` | src/hooks/useClimateSurveys.ts:5 |
| `useClimateSurvey` | src/hooks/useClimateSurveys.ts:12 |
| `useSurveyQuestions` | src/hooks/useClimateSurveys.ts:20 |
| `usePillarScores` | src/hooks/useClimateSurveys.ts:28 |
| `useENPS` | src/hooks/useClimateSurveys.ts:36 |
| `useCreateClimateSurvey` | src/hooks/useClimateSurveys.ts:44 |
| `useUpdateClimateSurvey` | src/hooks/useClimateSurveys.ts:60 |
| `useCreateSurveyQuestion` | src/hooks/useClimateSurveys.ts:77 |
| `useSubmitSurveyResponse` | src/hooks/useClimateSurveys.ts:93 |
| `useRegisterComboAction` | src/hooks/useCombo.ts:41 |
| `useEngagementProgress` | src/hooks/useContinuousEngagement.ts:25 |
| `useDebouncedCallback` | src/hooks/useDebounce.ts:35 |
| `useThrottledCallback` | src/hooks/useDebounce.ts:72 |
| `useDepartment` | src/hooks/useDepartments.ts:21 |
| `useDepartmentWithMembers` | src/hooks/useDepartments.ts:29 |
| `useTeamMembers` | src/hooks/useDepartments.ts:37 |
| `useAddTeamMember` | src/hooks/useDepartments.ts:81 |
| `useRemoveTeamMember` | src/hooks/useDepartments.ts:101 |
| `useSetManager` | src/hooks/useDepartments.ts:114 |
| `useUpdateDepartmentWar` | src/hooks/useDepartmentWars.ts:145 |
| `useCreateCompetency` | src/hooks/useDevelopmentPlans.ts:130 |
| `useENPSSurvey` | src/hooks/useENPS.ts:13 |
| `useHighPotentials` | src/hooks/useHighPotentials.ts:5 |
| `useTopHighPotentials` | src/hooks/useHighPotentials.ts:13 |
| `useI18nContext` | src/hooks/useI18n.ts:152 |
| `useKudosGiven` | src/hooks/useKudos.ts:78 |
| `useDeleteKudos` | src/hooks/useKudos.ts:123 |
| `useWeeklyLeaderboard` | src/hooks/useLeaderboard.ts:25 |
| `useMonthlyLeaderboard` | src/hooks/useLeaderboard.ts:37 |
| `useAllTimeLeaderboard` | src/hooks/useLeaderboard.ts:48 |
| `useLeaderboard` | src/hooks/useLeaderboard.ts:60 |
| `useUpdateMissionProgress` | src/hooks/useMissions.ts:64 |
| `useDepartmentRankings` | src/hooks/useMissions.ts:93 |
| `useAllRankings` | src/hooks/useMissions.ts:102 |
| `useNetworkStatus` | src/hooks/useNetworkStatus.ts:43 |
| `useNineBoxDistribution` | src/hooks/useNineBox.ts:13 |
| `useUpdateNineBoxEvaluation` | src/hooks/useNineBox.ts:55 |
| `useSendNotification` | src/hooks/useNotifications.ts:217 |
| `useOneOnOnePreparation` | src/hooks/useOneOnOnePreparation.ts:5 |
| `useSetOpinionStatus` | src/hooks/useOpinions.ts:75 |
| `usePDI` | src/hooks/usePDI.ts:5 |
| `usePDIAlertCounts` | src/hooks/usePDIAlerts.ts:269 |
| `useActivePositions` | src/hooks/usePositions.ts:13 |
| `useTaskScores` | src/hooks/usePositions.ts:160 |
| `useMyTaskScores` | src/hooks/usePositions.ts:167 |
| `useCompleteTaskScore` | src/hooks/usePositions.ts:174 |
| `useApplyPenalty` | src/hooks/usePositions.ts:203 |
| `useUserTaskStats` | src/hooks/usePositions.ts:267 |
| `useUpdateProfile` | src/hooks/useProfiles.ts:62 |
| `useAddXp` | src/hooks/useProfiles.ts:80 |
| `useAddCoins` | src/hooks/useProfiles.ts:108 |
| `useIncrementStreak` | src/hooks/useProfiles.ts:124 |
| `useQuest` | src/hooks/useQuests.ts:27 |
| `useMyQuests` | src/hooks/useQuests.ts:35 |
| `useQuestSteps` | src/hooks/useQuests.ts:45 |
| `useQuestAssignments` | src/hooks/useQuests.ts:53 |
| `useMyAssignments` | src/hooks/useQuests.ts:61 |
| `useQuestStats` | src/hooks/useQuests.ts:71 |
| `useCreateQuest` | src/hooks/useQuests.ts:80 |
| `useUpdateQuest` | src/hooks/useQuests.ts:111 |
| `useDeleteQuest` | src/hooks/useQuests.ts:149 |
| `useArchiveQuest` | src/hooks/useQuests.ts:160 |
| `useActivateQuest` | src/hooks/useQuests.ts:172 |
| `useAssignQuest` | src/hooks/useQuests.ts:184 |
| `useUpdateQuestProgress` | src/hooks/useQuests.ts:198 |
| `useCompleteQuest` | src/hooks/useQuests.ts:211 |
| `useQuizQuestionsWithOptions` | src/hooks/useQuizQuestions.ts:35 |
| `useUserTodayScores` | src/hooks/useQuizScores.ts:46 |
| `useHasPermission` | src/hooks/useRBAC.ts:277 |
| `useCanAccess` | src/hooks/useRBAC.ts:282 |
| `useGrantScratchCard` | src/hooks/useScratchCards.ts:31 |
| `useCanonicalUrl` | src/hooks/useSEO.ts:143 |
| `useShouldIndex` | src/hooks/useSEO.ts:151 |
| `useShopRewardsByCategory` | src/hooks/useShop.ts:33 |
| `useUpdatePurchaseStatus` | src/hooks/useShop.ts:135 |
| `useUserFeed` | src/hooks/useSocialFeed.ts:52 |
| `useSuccessionPlan` | src/hooks/useSuccession.ts:13 |
| `useTrailsByDepartment` | src/hooks/useTrails.ts:24 |
| `useCreateTrail` | src/hooks/useTrails.ts:133 |
| `useUpdateTrail` | src/hooks/useTrails.ts:206 |
| `useDeleteTrail` | src/hooks/useTrails.ts:219 |
| `useCheckPrerequisites` | src/hooks/useTrails.ts:238 |
| `useAddPrerequisite` | src/hooks/useTrails.ts:248 |
| `useRemovePrerequisite` | src/hooks/useTrails.ts:264 |
| `useUnsavedChanges` | src/hooks/useUnsavedChanges.ts:10 |
| `useFormDirtyState` | src/hooks/useUnsavedChanges.ts:45 |
| `useMyDepartmentId` | src/hooks/useWarLeadership.ts:17 |

**Total: 96 hooks exportados com 0 chamadores (19,8% de 486).**

---

## Inventário de tabelas/RPC/edge functions referenciados

Consolidado a partir dos 129 hooks + toda a cadeia de serviços que eles importam (`@/services`, `@/lib`, `@/integrations`), profundidade ilimitada. Nomes exatos, prontos para cruzar com o banco vivo.

### Tabelas / views (160)

| | | | |
|---|---|---|---|
| `achievements` | `action_plan_items` | `action_plans` | `activity_comments` |
| `activity_reactions` | `ai_coach_messages` | `announcement_reactions` | `announcement_reads` |
| `announcements` | `attendance_records` | `attendance_settings` | `attendance_streaks` |
| `auction_admin_events` | `auction_bids` | `auctions` | `audit_logs` |
| `avatar_items` | `bingo_marks` | `blocked_ips` | `board_player_states` |
| `board_trails` | `boss_battle_damage` | `boss_battles` | `boss_win_rate_goals` |
| `campaign_participants` | `campaign_progress_events` | `campaign_result_imports` | `campaign_result_rows` |
| `campaign_team_members` | `campaign_team_split_batches` | `campaign_team_split_entries` | `campaign_teams` |
| `card_definitions` | `card_packs` | `card_trades` | `celebrations` |
| `certifications` | `checkin_templates` | `checkins` | `climate_pillar_scores` |
| `climate_question_answers` | `climate_survey_questions` | `climate_survey_responses` | `climate_surveys` |
| `competencies` | `custom_quests` | `department_missions` | `department_rankings` |
| `department_war_contributions` | `department_war_departments` | `department_war_metrics` | `department_wars` |
| `departments` | `development_plan_actions` | `development_plans` | `direct_duels` |
| `engagement_snapshots` | `enps_responses` | `enps_surveys` | `feedback_cycles` |
| `feedback_requests` | `feedback_responses` | `goal_updates` | `goals` |
| `ip_access_logs` | `ip_whitelist` | `key_results` | `kudos` |
| `kudos_badges` | `league_history` | `league_members` | `leagues` |
| `learning_trails` | `lightning_quiz_sessions` | `login_attempts` | `lucky_wheel_payout_snapshots` |
| `lucky_wheel_prize_audit` | `lucky_wheel_prizes` | `lucky_wheel_spins` | `memory_decks` |
| `memory_pairs` | `memory_sessions` | `mentorship_pairs` | `module_progress` |
| `mood_entries` | `new_device_alerts` | `nine_box_evaluations` | `notification_preferences` |
| `notifications` | `onboarding_progress` | `opinion_responses` | `opinions` |
| `org_members` | `org_theme_history` | `organizations` | `password_reset_requests` |
| `pdi_checkins` | `pdi_mentors` | `pdi_templates` | `penalty_rules` |
| `permissions` | `position_task_templates` | `positions` | `prediction_admin_events` |
| `prediction_markets` | `prediction_stakes` | `profiles` | `profiles_public` |
| `pulse_responses` | `pulse_surveys` | `purchase_approvals` | `push_notification_logs` |
| `push_subscriptions` | `push_sync_events` | `quest_assignments` | `quest_steps` |
| `quiz_answers` | `quiz_options` | `quiz_questions` | `quiz_scores` |
| `role_permissions` | `roles` | `sales_campaigns` | `scratch_cards` |
| `seasonal_challenges` | `seasonal_events` | `security_alerts` | `sequence_attempts` |
| `sequence_procedures` | `shop_promotions` | `shop_purchases` | `shop_rewards` |
| `task_penalties` | `task_scores` | `team_members` | `trail_enrollments` |
| `trail_modules` | `trail_prerequisites` | `user_achievements` | `user_avatar_config` |
| `user_avatar_items` | `user_cards` | `user_certifications` | `user_challenges` |
| `user_combos` | `user_devices` | `user_leagues` | `user_mission_progress` |
| `user_positions` | `user_roles` | `user_seasonal_progress` | `user_two_factor` |
| `wager_budget_settings` | `wager_entries` | `wager_integrity_review_events` | `wager_integrity_reviews` |
| `wager_questions` | `webauthn_challenges` | `webauthn_credentials` | `weekly_challenges` |

### Funções RPC (116)

| | | | |
|---|---|---|---|
| `admin_profile_directory` | `advance_board_trail` | `answer_lightning_question` | `apply_campaign_import` |
| `apply_task_penalty` | `assign_engagement_questions` | `award_campaign_team_split` | `calculate_enps_score` |
| `cancel_auction` | `check_login_lockout` | `claim_card_set_reward` | `close_auction` |
| `complete_task_score` | `create_auction_draft` | `create_prediction_market` | `deal_boss_damage` |
| `delete_board_trail` | `finish_lightning_round` | `finish_memory_session` | `generate_action_plan_from_factor` |
| `generate_action_plan_from_nr1_category` | `generate_action_plan_from_opinion` | `generate_engagement_snapshot` | `get_account_devices` |
| `get_active_engagement_cycle` | `get_auction_summary` | `get_board_challenge_stats` | `get_board_trail_leaderboard` |
| `get_boss_battle_leaderboard` | `get_card_set_rewards` | `get_daily_wager` | `get_department_metrics` |
| `get_department_war_feed` | `get_department_war_standings` | `get_engagement_cycle_progress` | `get_engagement_factor_scores` |
| `get_engagement_nps` | `get_engagement_nps_history` | `get_engagement_overview` | `get_engagement_pillar_benchmark` |
| `get_engagement_pillar_correlations` | `get_engagement_pillar_scores` | `get_executive_metrics` | `get_lucky_wheel_prizes_display` |
| `get_lucky_wheel_status` | `get_memory_leaderboard` | `get_monthly_trends` | `get_my_profile_private` |
| `get_nine_box_distribution` | `get_nr1_risk_matrix` | `get_nr1_summary` | `get_opinion_feed` |
| `get_or_create_bingo_card` | `get_passkeys_by_email` | `get_prediction_odds_history` | `get_prediction_oracle_aggregates` |
| `get_quiz_category_stats` | `get_quiz_lifeline` | `get_quiz_play_set` | `get_sequence_play_set` |
| `get_sequence_procedure_stats` | `get_tournament_bracket` | `get_user_department_id` | `get_wager_leaderboard` |
| `grade_quiz_answer` | `grant_scratch_card` | `increment_announcement_views` | `is_ip_whitelisted` |
| `join_tournament` | `list_stuck_board_players` | `list_tournaments` | `list_wager_questions` |
| `log_ip_access` | `log_login_attempt` | `open_card_pack` | `place_auction_bid` |
| `place_prediction_stake` | `propose_card_trade` | `publish_auction` | `quiz_fifty_fifty` |
| `recalc_campaign_progress` | `recalc_campaign_teams` | `report_tournament_match` | `reset_login_attempts` |
| `resolve_board_challenge` | `respond_card_trade` | `respond_to_opinion` | `reveal_scratch_card` |
| `revert_campaign_import` | `revert_campaign_team_split` | `review_purchase` | `revoke_device_by_fingerprint` |
| `revoke_push_device` | `run_boss_win_rate_alerts` | `save_board_trail` | `save_sequence_procedure` |
| `save_wager_question` | `set_opinion_status` | `settle_boss_battle` | `settle_department_war` |
| `settle_prediction_market` | `spin_lucky_wheel` | `start_lightning_round` | `start_memory_session` |
| `start_tournament` | `submit_daily_wager` | `submit_engagement_answer` | `submit_sequence_attempt` |
| `sync_bingo_card` | `sync_department_war_headcount` | `toggle_opinion_support` | `transition_prediction_market` |
| `unblock_board_players` | `user_has_passkeys` | `user_wants_in_app_notification` | `verify_certificate` |

### Edge Functions (9)

| | | | |
|---|---|---|---|
| `admin-alerts` | `ai-coach` | `churn-prediction` | `competency-alerts` |
| `detect-new-device` | `push-device-revoked` | `push-public-key` | `reward-approval-review` |
| `send-campaign-push` |  |  |  |

### Storage buckets (1)

`org-assets`

---

## `src/contexts` (4 arquivos, 516 linhas)

| Arquivo | Classificação | Chamadores | Evidência | Problema |
|---|---|---|---|---|
| `AchievementNotificationContext.tsx` (90L) | ✅ IMPLEMENTADO_TOTAL | 4 (`src/hooks/useProfiles.ts:5`, `useBehavioralBadges.ts:5`, `useAchievements.ts`, `Providers.tsx`) | `useAchievementNotification` em `useProfiles.ts:84` | — |
| `GamificationContext.tsx` (139L) | 🟨 IMPLEMENTADO_PARCIAL | Provider montado em `src/components/Providers.tsx:47`; **`useGamification` (linha 27) e `useGamificationSafe` (linha 36) têm 0 consumidores** | `grep -rn "useGamification" src/` → só o próprio arquivo | Os dois hooks públicos do contexto estão mortos. A única ponte viva é um **global no `window`**: `GamificationContext.tsx:115` grava `window.__GAMIFICATION_CONTEXT__` e `src/services/behavioralBadges/index.ts:144` lê de volta. Contexto React usado como singleton global — quebra SSR/testes e é invisível ao type-checker (`as any` na linha 115). |
| `OnboardingTourContext.tsx` (213L) | ✅ IMPLEMENTADO_TOTAL | 5 (`src/App.tsx`, `src/pages/Index.tsx:23`, `TourSpotlight.tsx:5`, `TourLauncher.tsx:14`, `tours/dashboardTour.ts`) | `useTour(dashboardTour)` em `src/pages/Index.tsx:69` | Só existe 1 tour (`dashboardTour`) para 213 linhas de motor de tours. |
| `SoundSettingsContext.tsx` (74L) | ✅ IMPLEMENTADO_TOTAL | 2 (`Providers.tsx`, `SoundSettingsCard.tsx:8`) | `useSoundSettings()` em `SoundSettingsCard.tsx:22` | — |

## `src/utils`, `src/constants`, `src/types`, `src/styles`

| Arquivo | Classificação | Chamadores | Evidência | Problema |
|---|---|---|---|---|
| `src/utils/colorContrast.ts` (82L) | 🟨 IMPLEMENTADO_PARCIAL | 2 | `src/components/admin/OrganizationSettings.tsx:13`, `src/components/theme/ThemeInjector.tsx:3` | `meetsWCAG_AA` (linha 51) tem **0 importadores** — a checagem de contraste WCAG existe mas nunca é executada. |
| `src/utils/formatters.ts` (49L) | ⬛ MORTO_OU_ABANDONADO | **0** | `grep -rn "@/utils/formatters" src/` → 0 resultados | Arquivo inteiro morto: `formatCurrency:8`, `formatNumber:18`, `formatDate:25`, `formatRelativeTime:33`. Duplica `formatNumber/formatDate/formatRelativeTime` que estão vivos dentro de `src/hooks/useI18n.ts:88-121`. |
| `src/utils/validators.ts` (18L) | ⬛ MORTO_OU_ABANDONADO | **0** | `grep -rn "@/utils/validators" src/` → 0 resultados | `isValidEmail:8` e `isStrongPassword:17` nunca chamados. **Não há validação de força de senha em nenhum ponto do app.** |
| `src/constants/texts.ts` (60L) | ⬛ MORTO_OU_ABANDONADO | **0** | `grep -rn "@/constants" src/` → 0 resultados | `DASHBOARD_TEXTS:5`, `COMMON_TEXTS:33`, `GAMIFICATION_TEXTS:51` — catálogo de strings criado e nunca adotado; textos ficaram hardcoded nos componentes. |
| `src/types/charts.ts` (128L) | 🟨 IMPLEMENTADO_PARCIAL | 4 arquivos | `src/pages/BIDashboard.tsx:18`, `src/components/AnalyticsWidget.tsx:7` | 6 dos 13 tipos têm 0 importadores: `BitrixTimemanSettings:42`, `BitrixTimemanReport:50`, `BitrixUnreadCounters:60`, `BitrixChatInfo:67`, `BitrixUserStatus:78`, `ShopPurchaseRow:87`, `ProfileBasic:122`. Os 5 tipos `Bitrix*` sugerem integração Bitrix24 abandonada no front (existem edge functions `bitrix24-api`, `bitrix24-oauth`, `bitrix24-webhook` em `supabase/functions/`). |
| `src/types/goals.ts` (101L) | 🟨 IMPLEMENTADO_PARCIAL | 1 | `src/components/goals/GoalCard.tsx:12` importa `Goal`, `KeyResult` | `GoalUpdate:84` não é importado deste módulo — existe um `GoalUpdate` **concorrente** em `src/services/goalsService.ts:38`, que é o realmente usado (`goalsService.ts:261`). Dois tipos com o mesmo nome e definições separadas. |
| `src/styles/accessibility.css` (134L) | ✅ IMPLEMENTADO_TOTAL | 1 | `src/index.css:2` → `@import './styles/accessibility.css'` | — |

---

## Achados graves

### 1. ⬛ O subsistema de i18n é uma casca: trocar de idioma não muda nada na tela

`I18nProvider` **é** montado (`src/components/Providers.tsx:34`), mas `useI18nContext` (`src/hooks/useI18n.ts:152`) tem **0 consumidores**. Pior: `src/components/LanguageSelector.tsx:28` chama `useI18n()` **diretamente**, e `useI18n` é `useState` local (`useI18n.ts:70`) — ou seja, o seletor cria uma instância de estado **independente** da que o Provider publica. Nenhum componente do app renderiza `t.*`: `grep -rn "translations" src/` fora de `useI18n.ts` retorna só `LanguageSelector.tsx:16` (importa apenas o *tipo* `SupportedLocale`) e `src/test/i18n.test.ts`. Existem 3 locales completos em `src/i18n/translations.ts` cobertos por teste (`src/test/i18n.test.ts:21`) — o catálogo está pronto, a UI nunca foi ligada.

### 2. ⬛ CRUD de pesquisa de clima e de quests estão mortas, e os dados entram por caminhos paralelos não-tipados

- `src/hooks/useClimateSurveys.ts` (112L, 9 hooks) **não é importado por ninguém**. Isso mata `useCreateClimateSurvey:44`, `useCreateSurveyQuestion:77` e `useSubmitSurveyResponse:93`. `climateSurveyService` só sobrevive porque 6 componentes importam dele a constante `PILLAR_LABELS` (ex.: `src/components/engagement/diagnostics/PillarHeatmap.tsx:2`). O `ClimateDiagnostics.tsx` lê `get_engagement_*` sobre tabelas `climate_*` que **nenhuma tela desta camada alimenta** — a única ingestão viva é `useContinuousEngagement.ts:33` (`submit_engagement_answer`).
- `src/hooks/useQuests.ts`: **14 de 15 hooks mortos**. `useCreateQuest:80`, `useUpdateQuest:111`, `useDeleteQuest:149`, `useAssignQuest:184`, `useCompleteQuest:211` — nada disso é chamado. Em vez disso, `src/pages/QuestBuilder.tsx:55` escreve **direto** `supabase.from("custom_quests").insert(...)` e `QuestBuilder.tsx:64` em `quest_steps`, ignorando toda a camada de hooks/serviço (sem invalidação de cache, sem as regras de XP de `questsService.ts:250`).

### 3. 🟨 Duas implementações concorrentes de RBAC, e quatro colisões de nome de hook

- `useRBAC.ts:98` (21 importadores, lê `user_roles`→`roles`→`role_permissions` via react-query) **convive** com `usePermissions.ts:7` (3 importadores, lê via `permissionsService`, com `userPermissions` carregado em `useEffect`+`setState` **fora** do react-query — `usePermissions.ts:28-32`). São duas fontes de verdade para "o usuário pode X". Os wrappers de conveniência `useHasPermission:277` e `useCanAccess:282` do `useRBAC` estão mortos.
- Colisões de nome medidas com `grep -rhno "export function (use\w*)" src/hooks/* | sort | uniq -d`:
  - `useLeaderboard` → `useLeaderboard.ts:60` (morto) vs `useProfiles.ts:54` (vivo).
  - `useCompetencies` → `useCompetencies.ts:9` (usado por `CompetencyRadar.tsx:32`) vs `useDevelopmentPlans.ts:123` (usado por `PlanDetailView.tsx:22`) — **implementações diferentes, ambas vivas**.
  - `useENPS` → `useClimateSurveys.ts:36` (morto) vs o módulo `useENPS.ts` (vivo). Esta colisão mascarava o óbito do arquivo inteiro numa busca por substring.
  - `useQuestStats` → `useQuests.ts:71` (morto) vs cópia local em `src/pages/PersonalStats.tsx:59`.

### 4. 🟨 Escritas críticas expostas por hooks que ninguém chama — a lógica migrou para os services e os hooks viraram carcaça

96 hooks (19,8%) têm 0 chamadores, e a concentração é justamente em mutações:

| Área | Hooks mortos | Onde a escrita realmente acontece |
|---|---|---|
| Perfil / XP / moedas | `useUpdateProfile:62`, `useAddXp:80`, `useAddCoins:108`, `useIncrementStreak:124` | `profilesService.addXp` chamado direto em `src/services/trailsService.ts:261`, `questsService.ts:250`, `kudosService.ts:222`, `missionsService.ts:217`, `attendanceService.ts:237`, `salesCampaignsService.ts:412`. **`useUpdateProfile` não tem equivalente algum** — não há caminho de edição de perfil nesta camada. |
| Combo | `useRegisterComboAction:41` | `comboService.registerAction` em `questsService.ts:244`, `kudosService.ts:216`, `trailsService.ts:255` |
| Trilhas (admin) | `useCreateTrail:133`, `useUpdateTrail:206`, `useDeleteTrail:219`, `useAddPrerequisite:248`, `useRemovePrerequisite:264` | **em lugar nenhum** — não existe UI de criação/edição de trilha nem de pré-requisitos |
| Task scores / penalidades | `useTaskScores:160`, `useMyTaskScores:167`, `useCompleteTaskScore:174`, `useApplyPenalty:203`, `useUserTaskStats:267` | **em lugar nenhum** — RPCs `complete_task_score` e `apply_task_penalty` sem consumidor |
| Certificações | `useIssueCertification:71`, `useCheckExpiringCertifications:106` | **em lugar nenhum** |
| Membros de departamento | `useAddTeamMember:81`, `useRemoveTeamMember:101`, `useSetManager:114` | reimplementado em `useAdminUsers.ts:117/160/180` |

**Consequência verificada — 7 RPCs sem nenhum chamador vivo em todo o `src`.** Cada uma existe no serviço, mas o método do serviço só é invocado pelo hook morto:

| RPC | Método de serviço | Único chamador (morto) |
|---|---|---|
| `get_auction_summary` | `src/services/auctionService.ts:172` (`summary`) | `useAuctions.ts:42` (`useAuctionSummary:38`) |
| `get_engagement_cycle_progress` | `src/services/continuousEngagementService.ts:120` | `useContinuousEngagement.ts:28` (`useEngagementProgress:25`) |
| `get_nine_box_distribution` | `src/services/nineBoxService.ts:108` | `useNineBox.ts:16` (`useNineBoxDistribution:13`) |
| `grant_scratch_card` | `src/services/scratchCardService.ts:59` | `useScratchCards.ts:35` (`useGrantScratchCard:31`) |
| `set_opinion_status` | `src/services/opinionsService.ts:115` | `useOpinions.ts:79` (`useSetOpinionStatus:75`) |
| `complete_task_score` | `src/services/positionsService.ts:322` | `usePositions.ts:179` (`useCompleteTaskScore:174`) |
| `apply_task_penalty` | `src/services/positionsService.ts:358` | `usePositions.ts:214` (`useApplyPenalty:203`) |

**E 3 tabelas totalmente órfãs no cliente**: `pdi_templates`, `pdi_mentors`, `pdi_checkins`. Todo o `src/services/pdiService.ts` (linhas 43, 51, 57, 64, 70, 77, 82, 88) é importado por **um único arquivo — `src/hooks/usePDI.ts:2` — que ninguém importa**. Também sem acesso direto vivo: `climate_surveys`, `climate_survey_questions`, `climate_survey_responses`, `climate_question_answers`, `climate_pillar_scores` — os `.from()` sobre elas estão todos em `src/services/climateSurveyService.ts` (linhas 71, 89, 103, 132, 146, 170, 194, 205, 225), cujo único importador de *métodos* era `useClimateSurveys.ts`; os 6 componentes que importam esse serviço pegam apenas a constante `PILLAR_LABELS`.

### 5. 🟨 Falhas silenciosas em caminhos de segurança + ausência quase total de teste de hook

- **Fail-open no lockout de login**: `src/hooks/useLoginLockout.ts:32-35` e `:41-43` — se a RPC `check_login_lockout` falhar (rede, RLS, RPC ausente), `checkLockout` retorna `null`, `lockoutStatus` fica `null` e `isLocked` cai para `false` (`useLoginLockout.ts:130`). O bloqueio visual some exatamente no cenário de erro. (A defesa real depende de o servidor barrar; o cliente não é a última linha, mas também não sinaliza a degradação.)
- **Detecção de dispositivo novo degrada para "tudo normal"**: `src/hooks/useDeviceDetection.ts:113-115` — no `catch` de `registerDevice` devolve `{ isNewDevice: false, deviceId: null, isTrusted: false }`. Como `src/hooks/useAuth.tsx:70` chama `registerDevice(...).catch(...)` e descarta o resultado, uma falha da edge `detect-new-device` é indistinguível de "dispositivo conhecido". Idem `getUserDevices:130` e `getUnreadAlerts:146`, que engolem erro e retornam `[]` — o painel de dispositivos mostra "nenhum dispositivo" em vez de erro.
- **`useUnsavedChanges.ts` nunca montado** (módulo com 0 importadores): a guarda `beforeunload`/navegação existe, mas nenhum formulário do app avisa antes de descartar alterações.
- **Cobertura de teste dos hooks ≈ 1,6%**: `grep -rln "renderHook" src/` → **2 arquivos** (`src/test/useTypePreferences.test.tsx`, `src/tests/unit/device.test.ts`) para 129 arquivos de hook. Os 122 arquivos de teste em `src/test/` (majoritariamente `*.simulation.test.ts`) exercitam lógica pura de serviço, não os hooks.

### Observação de contraste (para não parecer que é tudo ruim)

`src/hooks/useTypePreferences.ts` (242L) é o oposto do padrão acima: fila de serialização de escritas (`chainRef`, linha 82), guarda de unmount (`mountedRef`, linha 72), aborta a escrita se a leitura prévia falhar, merge aditivo em JSONB — e é o **único** hook com teste dedicado. `useSoundEffects.tsx` usa `Math.random()` nas linhas 271/368/436/539/613/678, mas é variação legítima de frequência do WebAudio, **não** dado falso. Não foi encontrado nenhum `TODO`, `FIXME`, mock, array hardcoded fingindo dado, nem `catch {}` vazio em todo `src/hooks` (`grep -rniE "todo|fixme|mock|stub|placeholder" src/hooks/` → 1 resultado, um `@ts-ignore` legítimo em `useViewTransition.ts:12`).

---

## Services — lote A

# Auditoria — Camada de Serviços, Lote A (50 arquivos, 10.240 linhas)

Escopo: `/tmp/claude-0/-home-user-task-gifts-v2/08301a4b-c9ec-50bf-af29-db1eea6f292b/scratchpad/lotes/services-A.txt`.
Método: leitura integral dos 50 arquivos + grep de chamadores em `/home/user/task-gifts-v2/src` +
verificação das RPCs contra `supabase/migrations` + verificação das tabelas contra o banco real
(MCP `SUPABASE - TASK GIFTS - V2`, `db_list_tables` schema `public`).

**Contagem:** ✅ 24 | 🟨 23 | 🟦 0 | ⬛ 3

---

## Tabela

| Service | Classificação | Chamadores | Tabelas/RPC/Edge/URL externa | Evidência arquivo:linha | Problema |
|---|---|---|---|---|---|
| achievementsService | 🟨 | `src/hooks/useAchievements.ts`, `src/hooks/useCombo.ts` | T: achievements, user_achievements, profiles, notifications, trail_enrollments, kudos | `src/services/achievementsService.ts:95-109` | Crédito de XP/moedas por read-modify-write no cliente (`profile.xp + reward`) — corrida perde prêmios. `:76-79` conquista inexistente devolve `{success:false}` silencioso. `hasAchievement` só uso interno |
| actionPlanGeneratorService | ✅ | `src/hooks/useActionPlanGenerator.ts` | RPC: generate_action_plan_from_factor | `src/services/actionPlanGeneratorService.ts:29` | — |
| actionPlansService | ✅ | `src/pages/ActionPlans.tsx`, `src/hooks/useActionPlans.ts`, 2 componentes | T: action_plans, action_plan_items | `src/services/actionPlansService.ts:78,100,119,135` | Sem `create`/`delete` — criação só via RPC do generator |
| activityCommentsService | ✅ | `src/hooks/useActivityComments.ts` | T: activity_comments, profiles | `src/services/activityCommentsService.ts:22,33,55,77,99` | Leitura degrada para `[]`/`{}` em erro (`:48`, `:70`) — falha invisível ao usuário |
| activityReactionsService | ✅ | `src/components/ActivityReactions.tsx`, `src/hooks/useActivityReactions.ts` | T: activity_reactions | `src/services/activityReactionsService.ts:28,75,85,93` | `toggleReaction` é check-then-act (`:74-97`), sem unique constraint client-side |
| adminService | ✅ | `src/components/admin/AdminMetricsDashboard.tsx` | T: attendance_records, quiz_scores, trail_enrollments, profiles | `src/services/adminService.ts:9,25,41,56` | Sem `limit` nas 4 queries — cresce sem teto |
| aiCoachService | 🟨 | `src/hooks/useAICoach.ts` | T: ai_coach_messages | `src/services/aiCoachService.ts:17,35,51` | Serviço só persiste histórico; a chamada de IA está fora dele, por `fetch` cru em `src/hooks/useAICoach.ts:15,54,133` (`${VITE_SUPABASE_URL}/functions/v1/ai-coach`) sem passar por `invokeEdgeSafe`. `clearHistory` engole o erro e devolve `false` (`:55-57`) |
| aiCourseBuilderService | ✅ | `src/components/trails/AICourseBuilderDialog.tsx` | T: ai_course_jobs; Storage bucket `course-uploads`; Edge: **ai-course-builder** | `src/services/aiCourseBuilderService.ts:24,35,42,57` | `listMyJobs` (`:78`) sem chamador |
| announcementsService | ✅ | `src/components/AnnouncementsBoard.tsx`, `src/hooks/useAnnouncements.ts` | T: announcements, announcement_reads, announcement_reactions, profiles; RPC: increment_announcement_views | `src/services/announcementsService.ts:56,72,81,167,177` | `updateAnnouncement` (`:138`) sem chamador. `markAsRead` (`:166-179`) ignora erro do upsert e da RPC |
| apiKeysService | ✅ | `src/pages/ApiKeysAdmin.tsx`, `CreateApiKeyDialog.tsx`, `IssuedCredentialDialog.tsx` | RPC: list_external_api_keys, create_external_api_key, rotate_external_api_secret, set_external_api_key_active, delete_external_api_key | `src/services/apiKeysService.ts:48,59,73,81,86` | Segredo só trafega na emissão; nada a apontar |
| attendanceService | 🟨 | `src/components/AttendanceCalendar.tsx`, `src/hooks/useAttendance.ts` | T: attendance_settings, attendance_streaks, attendance_records | `src/services/attendanceService.ts:57,88,116,160,208,264,324,347` | `checkIn` (`:143-299`) orquestra 8 escritas em tabelas diferentes sem transação: falha no meio deixa registro sem XP/streak. Settings padrão hardcoded quando não há linha (`:71-82`) |
| auctionService | ✅ | `src/pages/AuctionsPage.tsx`, `src/hooks/useAuctions.ts`, 4 componentes | T: auctions, auction_bids, auction_admin_events; RPC: get_auction_summary, place_auction_bid, create_auction_draft, publish_auction, close_auction, cancel_auction | `src/services/auctionService.ts:143,159,172,184,200,217,240,255,263,272` | Economia toda em RPC SECURITY DEFINER com `dedupeKey` — padrão correto |
| auditService | 🟨 | `src/hooks/useAudit.ts` | T: audit_logs | `src/services/auditService.ts:66-73` | **`const { error } = insert(...)` nunca é verificado + `catch {}` vazio.** Toda falha de auditoria é invisível. `getByDateRange` (`:124`) e `logProfileUpdate` (`:199`) sem chamador |
| autoChallengesService | 🟨 | `src/hooks/useAutoChallenges.ts` | T: user_challenges | `src/services/autoChallengesService.ts:169,174,179` | `Math.random()` escolhe os desafios da semana no cliente → dois dispositivos geram listas diferentes. `:235` desestrutura `error` e nunca checa. `:223` em falha de insert devolve desafios só em memória (progresso não persiste) |
| avatarService | 🟨 | `src/components/AvatarCustomizer.tsx`, `src/hooks/useAvatar.ts` | T: avatar_items, user_avatar_items, user_avatar_config, profiles | `src/services/avatarService.ts:140-161` | **`purchaseItem` debita moedas no cliente** (`select coins` → `update coins - price`): corrida permite comprar de graça. `:230` erro só vira `logger.warn`. Tabela `avatar_items` com 0 linhas no banco → catálogo vazio |
| behavioralBadgesService | ✅ | `src/hooks/useBehavioralBadges.ts` → `src/components/BehavioralBadgesWidget.tsx` | (barrel) | `src/services/behavioralBadgesService.ts:1-3` | Arquivo é só `export *` de `src/services/behavioralBadges/{types,badges,index}.ts` (fora deste lote) |
| bingoService | ✅ | `src/hooks/useBingo.ts` | T: bingo_marks; RPC: get_or_create_bingo_card, sync_bingo_card | `src/services/bingoService.ts:68,79,89` | — |
| boardTrailService | ✅ | `src/hooks/useBoardTrail.ts` | T: board_trails, board_player_states, quiz_questions (+quiz_options); RPC: advance_board_trail, resolve_board_challenge, get_board_trail_leaderboard, get_board_challenge_stats, save_board_trail, delete_board_trail, list_stuck_board_players, unblock_board_players | `src/services/boardTrailService.ts:102,117,145,171,188,225,240,254,267,299,319,331,349` | Gabarito não trafega (`:190` seleciona `quiz_options(id,text,order_index)` sem `is_correct`) — correto |
| bossBattleService | 🟨 | `src/pages/BossBattlePage.tsx`, `src/hooks/useBossBattles.ts` | T: boss_battles, boss_battle_damage; RPC: deal_boss_damage, settle_boss_battle, get_boss_battle_leaderboard | `src/services/bossBattleService.ts:107,124,154,167,179,201,224,242` | **`dealDamage` (`:193`) não tem nenhum chamador em `src/`** — a mecânica central de dano nunca é acionada pela aplicação; a RPC existe mas está órfã |
| bossWinRateGoalService | ✅ | `src/hooks/useBossWinRateGoals.ts` | T: boss_win_rate_goals; RPC: run_boss_win_rate_alerts | `src/services/bossWinRateGoalService.ts:57,83,89,90,93,111,127` | `save` faz select-then-insert/update para o caso global (`:82-95`) — corrida pode duplicar |
| campaignImportService | 🟨 | `src/pages/CampaignTeamRanking.tsx`, `src/hooks/useCampaignImports.ts`, 2 componentes | T: campaign_result_imports, campaign_result_rows; RPC: admin_profile_directory, apply_campaign_import, revert_campaign_import | `src/services/campaignImportService.ts:61,66,79,119,155,167,174,181,222` | `const db = supabase as any` (`:61`) desliga a tipagem do PostgREST em todo o arquivo. `:190` e `:259` engolem erro e devolvem `[]` (importação parece vazia em vez de falhar). `resolveParsed` (`:85`) e `listRows` (`:195`) sem chamador |
| campaignTeamsService | 🟨 | `src/hooks/useCampaignTeams.ts`, `useCampaignTeamsDashboard.ts`, `CampaignTeamSplitTrail.tsx` | T: campaign_teams, campaign_team_members, campaign_team_split_batches, campaign_team_split_entries; V: profiles_public; RPC: recalc_campaign_teams, award_campaign_team_split, revert_campaign_team_split | `src/services/campaignTeamsService.ts:108,114,135,157,175,184,203,213,224,241,250,261,270,278,295,314` | `const db = supabase as any` (`:108`). 5 catches devolvem `[]`/Map vazio (`:122,142,167,196,287,304`) — erro de RLS vira "sem equipes". `listMembers` (`:184`) ignora erro do fetch de perfis |
| celebrationsService | 🟨 | `src/hooks/useCelebrations.ts` | T: celebrations, profiles | `src/services/celebrationsService.ts:35,54,73,87,109,119,173` | `generateAnnualCelebrations` (`:117`), `updateProfileDates` (`:99`) e `getCelebrationIcon` (`:181`) **sem nenhum chamador** — aniversários/tempo de casa nunca são gerados pelo app (existe edge `birthday-celebrations`, não verificada neste lote) |
| certificationsService | 🟨 | `src/pages/CertificateVerify.tsx`, `src/components/CertificationsPanel.tsx`, `CertificateActions.tsx`, `src/hooks/useCertifications.ts` | T: certifications, user_certifications, team_members; RPC: verify_certificate | `src/services/certificationsService.ts:52,64,75,84,102,129,158,171,203,220,294,297,308,317,327,357` | **N+1 severo**: `getTeamCertificationStatus` (`:315-332`) faz 2 queries por membro e **rebusca a lista de certificações obrigatórias dentro do loop** (`:326`). Subquery `await` dentro do `.eq()` (`:296-303`). `validity_months * 30 dias` (`:167`) aproxima mês como 30 dias |
| checkinsService | ✅ | `src/pages/Checkins.tsx`, `src/hooks/useCheckins.ts`, `CheckinCard.tsx`, `CheckinDetailDialog.tsx` | T: checkin_templates, checkins | `src/services/checkinsService.ts:58,74,92,113,131,156,177,195` | `.or()` com interpolação de string (`:76,94`) — valor vem de `auth.getUser()`, risco baixo. `getCheckinHistory` (`:193`) sem chamador |
| churnPredictionService | ✅ | `src/components/ChurnPredictionPanel.tsx`, `src/hooks/useChurnPrediction.ts` | Edge: **churn-prediction** (→ `https://ai.gateway.lovable.dev`) | `src/services/churnPredictionService.ts:34` | Sem fallback/mock — falha propaga corretamente |
| climateSurveyService | ⬛ | **Só o tipo `ClimatePillar` e a constante `PILLAR_LABELS` são consumidos.** O objeto `climateSurveyService` é usado exclusivamente por `src/hooks/useClimateSurveys.ts`, que **não tem nenhum consumidor** | T: climate_surveys, climate_survey_questions, climate_survey_responses, climate_question_answers, climate_pillar_scores | `src/services/climateSurveyService.ts:71,89,104,117,132,146,171,193,205,225`; hook morto: `src/hooks/useClimateSurveys.ts:8,15,23,31,39,49,65,82,101` | Todo o CRUD de pesquisa de clima é **código morto em runtime**. Confirmado no banco: `climate_surveys`, `climate_survey_responses`, `climate_question_answers` com **0 linhas**. `submitResponse` (`:168-201`) insere resposta + respostas em 2 passos sem transação (`:193` falha ⇒ resposta órfã) |
| comboService | 🟨 | `src/components/ComboIndicator.tsx`, `ComboHistory.tsx`, `src/hooks/useCombo.ts`, `attendanceService`, `kudosService` | T: user_combos | `src/services/comboService.ts:29,47,115,141` | **`registerAction` (`:90-134`) é read-modify-write** no cliente: duas ações concorrentes leem o mesmo `actions_count` e o multiplicador/bônus de XP é contado duas vezes. `:122` `new Date().toISOString() || ""` — `\|\|` inútil |
| competencyService | 🟨 | `src/components/manager/TeamCompetencyDashboard.tsx`, `src/hooks/useCompetencies.ts` | T: module_progress, quest_assignments, user_achievements, kudos, attendance_streaks | `src/services/competencyService.ts:14,30,44,56,62` | Os 6 scores são **fórmulas heurísticas arbitrárias no cliente** (`:75` `len*10 + avg*0.5`, `:111` `kudos*15`, `:121` `streak*5 + dias*2`, `:136` `ach*20 + kudos*5`, `:149` `modulos*12`) sem calibração nem persistência. Os 5 erros de query são ignorados (só `data` é desestruturado) |
| continuousEngagementService | ✅ | `src/hooks/useContinuousEngagement.ts`, `ContinuousSurveyWidget.tsx`, `AnswerInput.tsx` | RPC: get_active_engagement_cycle, assign_engagement_questions, get_engagement_cycle_progress, submit_engagement_answer | `src/services/continuousEngagementService.ts:96,106,120,132` | — |
| dailyWagerService | ✅ | `src/hooks/useDailyWager.ts` | T: wager_entries (+wager_questions); RPC: get_daily_wager, submit_daily_wager, get_wager_leaderboard | `src/services/dailyWagerService.ts:39,49,64,83` | — |
| departmentWarAdminService | 🟨 | `src/hooks/useDepartmentWars.ts` | T: departments, department_wars, department_war_metrics, department_war_departments; RPC: sync_department_war_headcount | `src/services/departmentWarAdminService.ts:43,80,106,117,127,136,153,182` | **`headcount: 0` hardcoded** (`:59`) contradizendo o comentário "efetivo real calculado no banco" (`:40`) — o select só traz `id, name`. Criação multi-tabela sem transação, com delete compensatório manual (`:104-138`) que pode falhar e deixar guerra órfã. Erro da RPC de headcount ignorado (`:127`). `buildDraftFrom` (`:194`) sem chamador |
| departmentWarService | ✅ | `src/pages/DepartmentWarPage.tsx`, `src/hooks/useDepartmentWars.ts` | T: department_wars, department_war_metrics, department_war_contributions; RPC: get_department_war_standings, get_department_war_feed, settle_department_war, sync_department_war_headcount | `src/services/departmentWarService.ts:103,119,139,161,179,200,215` | — |
| departmentsService | ✅ | `src/components/admin/DepartmentsManager.tsx`, `DepartmentDialogs.tsx`, `src/hooks/useDepartments.ts` | T: departments, team_members | `src/services/departmentsService.ts:16,26,37,48,59,71,81,91,106,116` | — |
| developmentPlanService | 🟨 | `src/components/MyDevelopmentPlanWidget.tsx`, `DevelopmentPlanManager.tsx`, `PlanDetailView.tsx`, `src/hooks/useDevelopmentPlans.ts` | T: development_plans, development_plan_actions, competencies | `src/services/developmentPlanService.ts:79,97,106,126,137,149,167,185,197,207,228` | `PRIORITY_COLORS` (`:69-74`) usa cores Tailwind cruas (`bg-gray-100`…), contrariando o padrão de token semântico adotado em `actionPlansService.ts:67-73`. `:212` `.or()` com interpolação de `departmentId` vindo do chamador — sem sanitização |
| duelsService | 🟨 | `src/components/duels/DuelCard.tsx`, `src/hooks/useDuels.ts` | T: direct_duels, profiles | `src/services/duelsService.ts:43,58,74,86,103,117,139,147,167,176,186,204,216,228,238,249,258,277,300` | **`completeDuel` (`:247`) e `updateDuelProgress` (`:226`) não têm nenhum chamador** → duelos são criados/aceitos mas **nunca são resolvidos**; `xp_reward`/`coin_reward` nunca são creditados (não há nenhum crédito no serviço). Toda a lógica de vencedor roda no cliente com `update` direto (`:276-287`) — qualquer participante pode se declarar vencedor |
| engagementDiagnosticsService | ✅ | `src/pages/ClimateDiagnostics.tsx`, `src/hooks/useEngagementDiagnostics.ts`, `useNr1Risk.ts`, `nr1RiskService`, 6 componentes | RPC: get_engagement_overview, get_engagement_pillar_scores, get_engagement_factor_scores, get_engagement_nps, get_engagement_nps_history, get_engagement_pillar_correlations, get_engagement_pillar_benchmark | `src/services/engagementDiagnosticsService.ts:104,113,122,131,146,159,175` | Anonimato imposto no banco (`MIN_RESPONDENTS` `:12` é só rótulo de UI) |
| engagementReportsService | 🟨 | `src/hooks/useEngagementReports.ts` | T: trail_enrollments, quest_assignments, departments, team_members, attendance_records, module_progress, custom_quests, user_certifications, profiles | `src/services/engagementReportsService.ts:114,185,246,306,357,397` | **Números inventados** (detalhe em "Achados graves"): `rating` fabricado por fórmula (`:306`), abandono = 30% arbitrário (`:114`), 15 min por atividade (`:246,357`), fallback `2.5h` (`:185`), piso artificial de 10 no score (`:397`). Além disso: 4 queries × N meses (`:80-106`), 4 queries por departamento (`:132-178`), 2 queries × 7 dias (`:229-242`), 1 query por quest (`:323-327`) |
| enpsService | 🟨 | `src/hooks/useENPS.ts` | T: enps_surveys, enps_responses, engagement_snapshots; RPC: calculate_enps_score, generate_engagement_snapshot | `src/services/enpsService.ts:69,86,91,107,132,143,155,164,180,191,203,233,251,262` | **N+1**: `getSurveys` (`:84-100`) dispara 1 count + 1 RPC por pesquisa; `getActiveSurveyForUser` (`:272-277`) faz 1 query por pesquisa dentro do loop. Duas fontes concorrentes de eNPS: RPC `calculate_enps_score` (`:92`) e cálculo local (`:215`) — podem divergir. `hasResponded` só uso interno |
| executiveService | ✅ | `src/hooks/useExecutiveMetrics.ts` | RPC: get_executive_metrics, get_monthly_trends, get_department_metrics | `src/services/executiveService.ts:48,59,70` | — |
| feedback360Service | ⬛ | **ZERO** — `grep -rn "feedback360" src tests` fora do próprio arquivo: nenhum resultado | T: feedback_cycles, feedback_evaluations, feedback_questions, feedback_results | `src/services/feedback360Service.ts:67,82,102,123,135,147,159,171,189,202` | 213 linhas totalmente órfãs. O hook `src/hooks/useFeedback360.ts` importa `feedbackService` (outro serviço, outro conjunto de tabelas). Consequência: `feedback_evaluations`, `feedback_questions`, `feedback_results` nunca são lidas/escritas pelo app (0 linhas no banco) |
| feedbackService | 🟨 | `src/pages/Feedback.tsx`, `src/hooks/useFeedback360.ts` | T: feedback_cycles, feedback_requests, feedback_responses | `src/services/feedbackService.ts:64,81,106,131,154,169,194,199,218,235` | `commonStrengths`/`commonImprovements` (`:282-283`) são apenas `slice(0,5)` da lista bruta — **não há análise de frequência**, o nome mente. `:247` descarta o `error`. `submitFeedback` (`:193-210`) marca `submitted` **antes** de inserir a resposta, sem rollback. `getFeedbackResponse` (`:216`) sem chamador |
| goalsService | 🟨 | `src/hooks/useGoals.ts` | T: goals, key_results, goal_updates | `src/services/goalsService.ts:79,90,99,114,126,140,152,165,174,190,197,208,226,244,255` | `recalculateGoalProgress` (`:224-251`) recalcula e reescreve o progresso no cliente, sem transação nem verificação de erro no `update` final. `:208` insert em `goal_updates` sem checagem de erro — histórico pode sumir silenciosamente. `:236` divide por `target_value` sem guarda contra 0 (→ `Infinity`/`NaN`) |
| highPotentialService | 🟨 | `src/components/manager/HighPotentialsPanel.tsx`, `src/hooks/useHighPotentials.ts` | T: profiles, goals, trail_enrollments, development_plans, development_plan_actions, user_certifications, kudos, attendance_records, mood_entries, checkins, nine_box_evaluations, mentorship_pairs | `src/services/highPotentialService.ts:213,222,235,237,238,415` | **5 métricas hardcoded**: `taskOnTimeRate: 85` (`:213`), `feedbacksGiven: 0` (`:222`), `teamChallengesParticipated: 0` (`:235`), `xpGained30Days: 0` (`:237`), `levelUpsLast90Days: 0` (`:238`) — todas entram no score final com peso. **N+1 catastrófico**: `:415` itera 50 perfis × ~12 queries em `getUserMetrics` = até ~600 round-trips por chamada. Filtro por departamento é feito em memória depois de buscar todos os perfis (`:397-411`) |
| ipWhitelistService | ✅ | `src/hooks/useIpWhitelist.ts` | T: ip_whitelist, ip_access_logs; RPC: is_ip_whitelisted, log_ip_access | `src/services/ipWhitelistService.ts:40,52,69,82,95,106,121` | Regex IPv6 é reconhecidamente simplificada (`:141`) |
| kudosService | 🟨 | `src/components/PeerRecognition.tsx`, `src/hooks/useKudos.ts` | T: kudos, kudos_badges, profiles | `src/services/kudosService.ts:56,66,79,101,121,137,154,159,174,271` | **7 blocos `try/catch` que só logam** (`:200,208,223,246,254,262`): se XP, notificação, auditoria, missão ou conquista falharem, o kudos é dado do mesmo jeito e ninguém sabe. XP creditado via `profilesService.addXp` no cliente (`:222`). `getKudosReceived`/`getKudosGiven` (`:127-148`) devolvem `from_profile/to_profile/badge` sempre `null` — campos do tipo nunca preenchidos |
| leaguesService | 🟨 | `src/pages/Leagues.tsx`, `src/components/admin/LeaguesManager.tsx`, `src/hooks/useLeagues.ts` | T: leagues, user_leagues, league_history, profiles | `src/services/leaguesService.ts:51,64,95,125,139,153,165,174,195,214,230,241,251,258,273,281,295,306,318` | **`addWeeklyXP` (`:228`) só é chamado por si mesmo (recursão `:237`) e por teste** — o XP semanal de liga nunca é alimentado pelo app; e é read-modify-write (`:229-245`), sujeito a corrida. `getPromotionZone` (`:248`) e `getDemotionZone` (`:271`) sem chamador. `console.warn` cru (`:108`) em vez do `logger`. `getDemotionZone` ignora o erro (`:280`) |
| lightningQuizService | ✅ | `src/pages/LightningQuizPage.tsx`, `src/hooks/useLightningQuiz.ts` | T: lightning_quiz_sessions; RPC: start_lightning_round, answer_lightning_question, finish_lightning_round | `src/services/lightningQuizService.ts:78,87,100,110` | Gabarito e crédito 100% server-side — padrão correto |
| loggingService | 🟨 | 57 arquivos (`logger`, 478 referências) | nenhum | `src/services/loggingService.ts:80-81` | **Sink externo nunca implementado**: `// In production, you could send errors to an external service here`. O repo já tem `@sentry/react` em uso (`src/lib/requestId.ts:19`), mas o `logger` não o alimenta — erros de produção morrem no `console` e num array em memória de 100 itens (`:20,34-36`) |
| luckyWheelService | ✅ | `src/pages/LuckyWheelPage.tsx`, `LuckyWheelAdmin.tsx`, `src/hooks/useLuckyWheel.ts`, `LuckyWheel.tsx` | T: lucky_wheel_prizes, lucky_wheel_spins, lucky_wheel_prize_audit, lucky_wheel_payout_snapshots; V: profiles_public; RPC: get_lucky_wheel_prizes_display, get_lucky_wheel_status, spin_lucky_wheel | `src/services/luckyWheelService.ts:63,73,87,100,137,151,164,183,202,226,266,283` | Sorteio/crédito em RPC com `dedupeKey`, `weight` omitido do tipo exposto ao jogador (`:28`) — padrão correto |

---

## Integrações externas detectadas

**Nenhum dos 50 serviços faz `fetch`/`axios` direto para terceiros.** Verificado por
`grep -nE "fetch\(|axios|https?://"` nos 50 arquivos: zero ocorrências. Todo o tráfego sai por
`@/integrations/supabase/client` (PostgREST/RPC) ou por Edge Functions.

| Integração | Como é acionada do lote A | Domínio externo real | Credencial | Está no `.env.example`? |
|---|---|---|---|---|
| Supabase (PostgREST + RPC + Storage) | `supabase.from/.rpc/.storage` em 47 dos 50 serviços | `${VITE_SUPABASE_URL}` (`https://<projeto>.supabase.co`) | `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` | ⚠️ **parcial** — `.env.example:8` declara `VITE_SUPABASE_ANON_KEY`, mas o código lê `VITE_SUPABASE_PUBLISHABLE_KEY` (nome divergente) |
| LLM — Lovable AI Gateway (`google/gemini-2.5-flash`) | `churnPredictionService.getPredictions()` → Edge `churn-prediction` (`src/services/churnPredictionService.ts:34`) e `aiCourseBuilderService.triggerBuild()` → Edge `ai-course-builder` (`src/services/aiCourseBuilderService.ts:57`) | `https://ai.gateway.lovable.dev/v1/chat/completions` (`supabase/functions/churn-prediction/index.ts:176`, `supabase/functions/ai-course-builder/index.ts:130`) | `LOVABLE_API_KEY` (secret de Edge Function: `churn-prediction/index.ts:49`, `ai-course-builder/index.ts:7`) | ❌ **não** — segredo de servidor, não é `VITE_*`; nenhuma menção no `.env.example` |
| LLM — mesma gateway, via `fetch` cru | Chamador do `aiCoachService` (fora do lote, mas é o par do serviço): `src/hooks/useAICoach.ts:15,54,133` monta `${VITE_SUPABASE_URL}/functions/v1/ai-coach` com `fetch` direto | idem (via Edge `ai-coach`) | idem | ❌ |
| Sentry | `src/lib/requestId.ts:19,34,61` (usado indiretamente por `churnPredictionService` e `aiCourseBuilderService` via `invokeEdgeSafe`) | `sentry.io` (DSN em `VITE_SENTRY_DSN`) | `VITE_SENTRY_DSN` | ❌ **ausente do `.env.example`** |
| Bitrix24 | **nenhum serviço do lote A toca Bitrix** | — | `VITE_BITRIX_WEBHOOK_URL` está em `.env.example:11` mas **`grep -rn "VITE_BITRIX" src` = 0 resultados** | ⚠️ variável declarada e não usada |

### Divergências `.env.example` × código (medido)

- Usadas no código e **ausentes** do `.env.example`: `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SENTRY_DSN`, `VITE_APP_VERSION`.
- Declaradas no `.env.example` e **não usadas** em `src/`: `VITE_SUPABASE_ANON_KEY` (só em `src/test/rls.test.ts:9`), `VITE_BITRIX_WEBHOOK_URL`, `VITE_APP_NAME`, `VITE_APP_ENV`, `VITE_ENABLE_ANALYTICS`, `VITE_ENABLE_DEBUG`.

### Verificação de existência (não confiei na documentação)

- **63 RPCs** distintas referenciadas pelos 50 serviços: **todas** encontradas em `supabase/migrations/` (script de verificação: 0 `MISSING_IN_MIGRATIONS`).
- **2 Edge Functions** invocadas: `ai-course-builder` e `churn-prediction` — ambas existem em `supabase/functions/`.
- **Todas as tabelas** referenciadas existem no banco real (MCP `db_list_tables`, schema `public`, RLS ativa em 100% delas). `profiles_public` é VIEW (`supabase/migrations/20260711192623_*.sql:5`), não tabela.

---

## Services órfãos

### ⬛ Órfãos totais (0 chamadores)

| Service | Linhas | Prova |
|---|---|---|
| `src/services/feedback360Service.ts` | 213 | `grep -rn "feedback360" src tests` (excluindo o próprio arquivo) → **0 resultados**. Todas as 10 funções mortas |
| `src/services/climateSurveyService.ts` (objeto de runtime) | 250 | O objeto só é usado em `src/hooks/useClimateSurveys.ts:8-101`; esse hook tem **0 consumidores** (`grep -rl "hooks/useClimateSurveys" src` → 0). Sobrevivem apenas `PILLAR_LABELS` (`:55`) e o type `ClimatePillar` (`:5`), importados por 6 componentes + 3 serviços |
| `src/services/bossBattleService.ts::dealDamage` | (método) | `grep -rn "dealDamage" src` fora do serviço → **0**. O núcleo do Boss Battle nunca é invocado |

### Métodos mortos confirmados (0 chamadores internos e externos)

`duelsService.completeDuel` (`:247`) · `duelsService.updateDuelProgress` (`:226`) ·
`leaguesService.addWeeklyXP` (`:228`, só recursão + teste) · `leaguesService.getPromotionZone` (`:248`) ·
`leaguesService.getDemotionZone` (`:271`) · `celebrationsService.generateAnnualCelebrations` (`:117`) ·
`celebrationsService.updateProfileDates` (`:99`) · `celebrationsService.getCelebrationIcon` (`:181`) ·
`auditService.getByDateRange` (`:124`) · `auditService.logProfileUpdate` (`:199`) ·
`announcementsService.updateAnnouncement` (`:138`) · `aiCourseBuilderService.listMyJobs` (`:78`) ·
`campaignImportService.resolveParsed` (`:85`) · `campaignImportService.listRows` (`:195`) ·
`checkinsService.getCheckinHistory` (`:193`) · `departmentWarAdminService.buildDraftFrom` (`:194`) ·
`feedbackService.getFeedbackResponse` (`:216`).

### Hooks mortos que ainda importam serviços do lote

`src/hooks/useClimateSurveys.ts` — 0 consumidores.

---

## Achados graves

### 1. Relatório de engajamento entrega números inventados como se fossem dados

`src/services/engagementReportsService.ts` é o pior caso do lote. Seis valores fabricados chegam à UI
sem nenhuma marcação de estimativa:

- `:306` — `rating: Math.min(5, 3.5 + (stats.completions / 10) * 0.5)`. **Não existe nenhuma tabela de
  avaliação de quest no banco**; a "nota" é uma função do número de conclusões. Um quest com 30
  conclusões sempre exibe 5,0.
- `:114` — `abandoned: Math.round(abandoned * 0.3)` com o comentário `// Estimate 30% of incomplete as truly abandoned`.
- `:246` e `:357` — horas de treinamento = `atividades * 0.25` (15 min chutados por atividade).
- `:185` — `avgTime: Math.round(avgTimeHours * 10) / 10 || 2.5` — quando o cálculo dá 0, mostra 2,5 h.
- `:397` — `engagementScore: Math.max(engagementScore, 10)` com `// Minimum 10`: uma empresa com
  engajamento real zero exibe 10.

### 2. Economia de XP/moedas mutada no cliente por read-modify-write

Quatro serviços do lote debitam/creditam saldo lendo e reescrevendo pelo PostgREST, sem RPC atômica e
sem `CHECK` de saldo no update — o oposto do padrão correto que `auctionService`, `luckyWheelService`,
`boardTrailService`, `dailyWagerService` e `lightningQuizService` já adotam (RPC `SECURITY DEFINER` +
`dedupeKey`):

- `src/services/avatarService.ts:140-161` — `purchaseItem`: `select coins` → `update coins - price` →
  `insert item`. Duas compras simultâneas passam pela mesma verificação e o item pode ser adquirido
  com saldo insuficiente; se o `insert` falhar depois do débito (`:160`), as moedas somem.
- `src/services/achievementsService.ts:95-109` — `update xp: profile.xp + reward`.
- `src/services/comboService.ts:90-134` — `registerAction` incrementa `actions_count` a partir de um
  valor lido antes; sob concorrência o multiplicador de combo (até 3,0×) é aplicado duas vezes.
- `src/services/leaguesService.ts:228-246` — `addWeeklyXP` (que, ironicamente, ninguém chama).

### 3. Auditoria falha em silêncio absoluto

`src/services/auditService.ts:66-73`: o `insert` em `audit_logs` desestrutura `error` e **nunca o
verifica**; o `catch {}` (`:71`) é vazio, com o comentário `// Silently fail`. Combinado com
`audit_logs` tendo 0 linhas no banco, não há como distinguir "nada aconteceu" de "toda escrita de
auditoria está sendo rejeitada por RLS". Esse serviço é chamado em `attendanceService.ts:275` e
`kudosService.ts:206-207`, ou seja, cobre justamente as operações que mexem em XP.

### 4. Mecânicas inteiras construídas e nunca conectadas

- **Boss Battle**: `bossBattleService.dealDamage` (`src/services/bossBattleService.ts:193`) — RPC
  `deal_boss_damage` existe na migration, o serviço existe, a página `BossBattlePage.tsx` existe, mas
  **nenhum arquivo em `src/` chama `dealDamage`**. Nunca se causa dano.
- **Duelos**: `duelsService.completeDuel` (`:247`) e `updateDuelProgress` (`:226`) sem chamador —
  duelos ficam eternamente `active`, e `xp_reward`/`coin_reward` (`:16-17`) nunca são pagos por
  nenhum caminho do serviço.
- **Feedback 360**: `feedback360Service.ts` inteiro órfão; `feedback_evaluations`,
  `feedback_questions` e `feedback_results` com 0 linhas no banco.
- **Pesquisa de clima**: `climateSurveyService` alcançável só por um hook sem consumidores.
- **Celebrações automáticas**: `generateAnnualCelebrations` (`src/services/celebrationsService.ts:117`)
  sem chamador — aniversários/tempo de casa não são gerados pelo app.

### 5. N+1 em escala de produção nos painéis de gestão

Três serviços fazem loops de queries que crescem com a base de usuários e não têm paginação:

- `src/services/highPotentialService.ts:415` — `for (const profile of filteredProfiles.slice(0, 50))`
  e cada iteração chama `getUserMetrics`, que dispara ~12 queries (`:79,113,119,125,133,143,150,156,162,169,176,183,192`).
  **~600 round-trips por render do painel de altos potenciais.** Ainda por cima busca todos os perfis
  sem filtro no servidor (`:393-397`) e filtra por departamento em memória (`:407`).
- `src/services/certificationsService.ts:315-332` — 2 queries por membro da equipe, e a lista de
  certificações obrigatórias é rebuscada **dentro do loop** (`:326`) em vez de uma vez fora.
- `src/services/enpsService.ts:84-100` — 1 count + 1 RPC por pesquisa em `getSurveys`;
  `:272-277` — 1 query por pesquisa ativa em `getActiveSurveyForUser`.

---

## Observações menores (com evidência)

- `Math.random()` no lote: apenas `src/services/autoChallengesService.ts:169,174,179` (seleção dos
  desafios semanais). Nenhum outro serviço usa aleatoriedade no cliente.
- Nenhum `TODO`, `FIXME`, `mock`, `stub` ou `placeholder` encontrado nos 50 arquivos
  (`grep -nEi "TODO|FIXME|XXX|HACK|mock|stub|placeholder|dummy|hardcod|fake"` → só as 3 linhas de
  `Math.random` acima e um comentário em `lightningQuizService.ts:73`). Os valores fixos do item 1 e 5
  estão escritos como código normal, **sem nenhuma marcação** — não seriam encontrados por busca de TODO.
- `supabase as any` desliga a tipagem em 2 arquivos: `campaignImportService.ts:61` e
  `campaignTeamsService.ts:108`.
- `console.warn` cru contornando o `logger`: `src/services/leaguesService.ts:108`.
- Interpolação de string em filtros PostgREST `.or()`: `checkinsService.ts:76,94`,
  `duelsService.ts:45,76`, `highPotentialService.ts:195` (valores de `auth.getUser()`, risco baixo) e
  `developmentPlanService.ts:212` (valor vindo do chamador — sem sanitização).
- Tabelas com 0 linhas no banco que sustentam serviços do lote (indício de feature nunca ativada):
  `avatar_items`, `certifications`, `kudos_badges`, `checkin_templates`, `competencies`, `celebrations`,
  `climate_surveys`, `enps_surveys`, `feedback_evaluations`, `feedback_results`, `boss_battles`,
  `campaign_teams`, `audit_logs`, `attendance_records`.

---

## Services — lote B

# Auditoria — Camada de Serviços, Lote B (46 arquivos, 10.674 linhas)

Método: leitura integral dos 46 arquivos listados em `lotes/services-B.txt`; contagem de
importadores por `grep -rl` em `/home/user/task-gifts-v2/src` (1º e 2º grau); verificação de
`.from()/.rpc()/functions.invoke()/fetch()`; conferência de `.env` e `.env.example`.

Legenda: ✅ IMPLEMENTADO_TOTAL · 🟨 IMPLEMENTADO_PARCIAL · 🟦 SUGERIDO_OU_INICIADO · ⬛ MORTO_OU_ABANDONADO

---

## Tabela

| Service | Classificação | Chamadores | Tabelas/RPC/Edge/URL externa | Evidência arquivo:linha | Problema |
|---|---|---|---|---|---|
| memoryGameService.ts | ✅ | `src/hooks/useMemoryGame.ts` → `pages/MemoryGamePage.tsx`, `pages/MemoryDeckAdminPage.tsx`, `components/memory/MemoryLeaderboard.tsx` | tab: `memory_decks`, `memory_pairs`, `memory_sessions`; rpc: `start_memory_session`, `finish_memory_session`, `get_memory_leaderboard` | memoryGameService.ts:71,85,98,107,121,141 | `applyPairDiff` faz delete+N updates+insert sequenciais sem transação (memoryGameService.ts:225-259): falha no meio deixa baralho inconsistente. |
| missionsService.ts | 🟨 | 9 arquivos (`questsService.ts:5`, `trailsService.ts:3`, hooks/páginas) | tab: `department_missions`, `user_mission_progress`, `department_rankings` | missionsService.ts:81,116,145,232 | Recompensa creditada no cliente via `profilesService.addXp/addCoins` (missionsService.ts:217-221) sem checagem transacional de `claimed`. `incrementByMetricKey` engole toda exceção (missionsService.ts:277-279). Filtro `or()` monta string com interpolação (missionsService.ts:87). N+1: loop de `getOrCreateProgress`+`updateProgress` por missão (missionsService.ts:273-276). |
| moodTrackerService.ts | 🟨 | `hooks/useMoodTracker.ts`, `components/MoodTrackerWidget.tsx` → `components/admin/MoodAnalytics.tsx` | tab: `mood_entries`, `team_members` | moodTrackerService.ts:60,84,105,135,142 | `is_anonymous` é gravado (moodTrackerService.ts:113) mas **nunca respeitado** em `getTeamMoodStats` — o método seleciona `*` e empilha a entrada inteira, incluindo `user_id` e `note` (moodTrackerService.ts:143,155-162). Anonimato é apenas nominal. |
| nineBoxService.ts | 🟨 | 8 arquivos (`components/admin/NineBoxMatrix.tsx`, `pdiGeneratorService.ts:2`, etc.) | tab: `nine_box_evaluations`; rpc: `get_nine_box_distribution` | nineBoxService.ts:46,61,85,96,108,119 | **Parâmetro `departmentId` de `getEvaluations` é declarado e nunca usado** — a query não filtra por departamento (nineBoxService.ts:44-56); só `period` é aplicado. Chamador que passa departamento recebe a base inteira. |
| notificationsService.ts | 🟨 | 14 arquivos (`profilesService.ts:4`, `questsService.ts:3`, `shopService.ts:3`, …) | tab: `notifications`; edge: `competency-alerts` | notificationsService.ts:26,182-185 | `triggerCompetencyAnalysis` chama `invokeEdgeSafe("competency-alerts")`, que hoje é **curto-circuitado sem rede** pela allowlist vazia (ver "Achados graves" #1). O `await` descarta o resultado — a falha é invisível ao chamador. |
| nr1RiskService.ts | ✅ | 7 arquivos (páginas/componentes de diagnóstico) | rpc: `get_nr1_risk_matrix`, `get_nr1_summary`, `generate_action_plan_from_nr1_category` | nr1RiskService.ts:98,107,141 | Nenhum. Regras de risco duplicadas em TS espelham a função SQL propositalmente e estão documentadas (nr1RiskService.ts:41-58). |
| onboardingService.ts | 🟨 | 4 arquivos (hooks/componentes de onboarding) | tab: `onboarding_progress`, `profiles` | onboardingService.ts:127,193,206-219 | `claimReward` faz **read-modify-write de `profiles.xp/coins` direto do cliente** (onboardingService.ts:206-219): corrida entre abas e economia gravável pelo navegador. Erros de leitura viram `return null`/`false` silencioso (onboardingService.ts:132-135). |
| oneOnOnePreparationService.ts | 🟨 | `hooks/useOneOnOnePreparation.ts` → `pages/Checkins.tsx`; `components/checkins/OneOnOnePreparationPanel.tsx` | tab: `profiles`, `checkins`, `mood_entries`, `goals`, `development_plans`, `development_plan_actions`, `kudos`, `nine_box_evaluations` | oneOnOnePreparationService.ts:111,118,128,136,144,155,163,171 | Campo `churnRisk` do contrato **nunca é populado** (declarado em :47-50, ausente do objeto montado em :202-241). N+1: uma query de `profiles` por kudos dentro de `Promise.all` (oneOnOnePreparationService.ts:190-199). 8 round-trips sequenciais por preparação. Nenhum erro de query é tratado — todos os `data` são desestruturados sem `error`. |
| opinionsService.ts | ✅ | `hooks/useOpinions.ts` → `pages/OpinionChannel.tsx`, `OpinionComposer.tsx`, `OpinionTreatmentDialog.tsx` | tab: `opinions`, `opinion_responses`; rpc: `get_opinion_feed`, `toggle_opinion_support`, `respond_to_opinion`, `set_opinion_status`, `generate_action_plan_from_opinion` | opinionsService.ts:34,60,82,101,115,127,143 | Cast `supabase as any` (opinionsService.ts:25) remove tipagem — assumido como dívida documentada. |
| organizationService.ts | 🟨 | `hooks/useOrganization.ts` → `ThemeInjector.tsx`, `SidebarLogo.tsx`, `CertificateActions.tsx`; `components/admin/OrganizationSettings.tsx` | tab: `organizations`, `org_members`, `org_theme_history`; storage: bucket `org-assets` | organizationService.ts:36,46,69,88,93 | **Catch silencioso**: `getOrganizationByHostname` e `getMyOrganization` retornam `null` tanto para "não existe" quanto para erro/negação de RLS (organizationService.ts:40,50,57) — falha de tema/branding é indistinguível de ausência. `uploadAsset` devolve `path` cru quando a URL assinada falha (organizationService.ts:94), gerando `<img>` quebrado. |
| passwordResetService.ts | 🟨 | `components/admin/PasswordResetApprovalPanel.tsx`, `pages/Auth.tsx` | tab: `password_reset_requests`, `profiles`; rpc: `request_password_reset`, `approve_password_reset`, `reject_password_reset` | passwordResetService.ts:35,51,80,108,149,162 | N+1 em três métodos: um SELECT de `profiles` por solicitação dentro de `for` (passwordResetService.ts:60-70, 90-98, 122-140). `hasPendingRequest` e `getPendingCount` **engolem o erro** e devolvem `false`/`0` (passwordResetService.ts:186,200) — indisponibilidade vira "não há pendências". Mutação por `Object.assign` sobre a linha do banco (:68,97,129). |
| pdiGeneratorService.ts | ✅ | `components/admin/ninebox/BoxDetailView.tsx` → `NineBoxMatrix.tsx` | tab: `development_plans`, `development_plan_actions` | pdiGeneratorService.ts:129,158 | Plano e ações inseridos em duas chamadas sem transação (pdiGeneratorService.ts:128-162): falha na 2ª deixa plano órfão sem ações. Templates hardcoded são de projeto, não stub. |
| pdiService.ts | ✅ | `hooks/usePDI.ts` → `components/admin/PDIAlertsPanel.tsx`, `hooks/usePDIAlerts.ts` | tab: `pdi_templates`, `pdi_mentors`, `pdi_checkins`, `development_plan_actions` | pdiService.ts:43,64,82,108 | `getTemplateById` devolve `null` em erro (pdiService.ts:52), e `applyTemplate` traduz isso em "Template not found" (pdiService.ts:96) — mascara falha de rede como dado ausente. |
| permissionsService.ts | 🟨 | `hooks/usePermissions.ts` → `PermissionsManager.tsx`, `RolePermissionsManager.tsx`, `pages/PermissionsAdmin.tsx` | tab: `permissions`, `roles`, `role_permissions`, `user_roles` | permissionsService.ts:41,53,59,70,86,95-135 | **Autorização computada no cliente**: `checkUserPermission`/`getUserPermissions` montam a decisão no navegador com N+1 (`getRolePermissions` por papel, permissionsService.ts:103-108, 123-132) — só serve como UI hint. `assignRoleToUser`/`removeRoleFromUser` fazem INSERT/DELETE direto em `user_roles` (permissionsService.ts:86,91): escalonamento de privilégio se a RLS não barrar. **Duplicação integral com `rbacService.ts`** (mesmas tabelas, mesmas funções, semânticas divergentes). |
| positionsService.ts | ✅ | 3 arquivos (hooks/páginas de cargos e tarefas) | tab: `positions`, `position_task_templates`, `user_positions`, `task_scores`, `task_penalties`, `penalty_rules`; rpc: `complete_task_score`, `apply_task_penalty` | positionsService.ts:112,172,234,279,322,358,375 | Pontuação e penalidade passam por RPC (bom). `assignUserPosition` faz UPDATE de `is_primary` + INSERT sem transação (positionsService.ts:249-261). Bloco "BITRIX24 INTEGRATION" (positionsService.ts:451-488) só grava `source:'bitrix24'` e `bitrix_task_id` — **não há chamada HTTP a Bitrix24 nesta camada**. |
| predictionMarketService.ts | ✅ | 30 arquivos (o mais consumido do lote) | tab: `prediction_markets`, `prediction_options`, `prediction_stakes`, `prediction_admin_events`; rpc: `place_prediction_stake`, `settle_prediction_market`, `create_prediction_market`, `transition_prediction_market`, `get_prediction_odds_history`, `get_prediction_oracle_aggregates` | predictionMarketService.ts:109,123,140,154,167,189,203,231,258 | Nenhum. Toda a economia é server-side via RPC; conversão explícita de `bigint`/`numeric` string→number (predictionMarketService.ts:263-274). Referência de qualidade do lote. |
| predictiveFeedbackService.ts | ⬛ | **Apenas `src/test/predictiveFeedback.test.ts`** — nenhum componente, hook ou página importa | nenhum I/O (módulo puro) | predictiveFeedbackService.ts:1-127; único importador confirmado por grep em `/src` | Motor determinístico completo e testado, **sem nenhum ponto de consumo em produção**. O comentário promete uso "em widgets do dashboard, no AI Coach e em alertas de gestor" (predictiveFeedbackService.ts:10-11) — nada disso existe. |
| profilesService.ts | 🟨 | 19 arquivos (`questsService`, `shopService`, `trailsService`, `missionsService`, `salesCampaignsService`, hooks) | tab: `profiles`, `profiles_public`; rpc: `get_my_profile_private` | profilesService.ts:54,64,74,87,98,106,120,129-161 | **Núcleo do problema de economia**: `addXp` e `addCoins` fazem read-modify-write no cliente (profilesService.ts:130-142, 158-160) — duas ações concorrentes perdem XP; e um UPDATE arbitrário de `xp`/`coins` sai do navegador. Fórmula de nível hardcoded `floor(xp/1000)+1` (profilesService.ts:135), divergente de qualquer tabela de níveis. Comentário sobre XP decay é um TODO em prosa, sem código (profilesService.ts:138-140). `getById` engole erro e devolve `null` (profilesService.ts:67-70), fazendo `addXp` lançar "Profile not found" para falha de rede. |
| pulseSurveysService.ts | 🟨 | `hooks/usePulseSurveys.ts` → `components/PulseSurveyWidget.tsx`; `components/admin/SurveyCreator.tsx` | tab: `pulse_surveys`, `pulse_responses` | pulseSurveysService.ts:69,80,98,143,160,175,181 | **Retorno hardcoded**: `completion_rate: 0, // Would need total eligible users` (pulseSurveysService.ts:236) — a UI exibe sempre 0% de adesão. `is_anonymous` existe na pesquisa (:134) mas `submitResponse` sempre grava `user_id` (pulseSurveysService.ts:162) e `getActiveSurveys` cruza respostas por `user_id` (:82): a anonimidade não é técnica. |
| purchaseGovernanceService.ts | 🟨 | `hooks/usePurchaseGovernance.ts` → `components/shop-admin/PurchaseGovernanceDialog.tsx` | tab: `purchase_approvals`, `profiles`; rpc: `review_purchase`; **edge: `reward-approval-review` (IA)** | purchaseGovernanceService.ts:53,69,83-86,106 | `analyzeRisk` depende da edge function de IA que hoje está bloqueada pela allowlist vazia → lança `Error("Edge function 'reward-approval-review' nao encontrada (allowlist)")` (requestId.ts:132-144). A decisão (`review`) via RPC funciona; a análise de risco por IA, não. |
| pushHistoryService.ts | 🟨 | `hooks/usePushHistory.ts` → `components/PushNotificationHistory.tsx` | tab: `push_notification_logs`, `push_subscriptions` | pushHistoryService.ts:34,55 | **Catch silencioso duplo**: ambos os métodos capturam qualquer erro e devolvem `[]` (pushHistoryService.ts:43-46, 61-64) — falha de RLS/rede é renderizada como "nenhum histórico". Cast `supabase as any` (:25). |
| pushSubscriptionService.ts | 🟨 | `hooks/usePushSubscription.ts`, `hooks/usePushDevice.ts` → `PushNotificationToggle.tsx`, `push/PushDeviceList.tsx`, `push/PushSyncHistory.tsx` | tab: `push_subscriptions`, `push_sync_events`, `notifications`; rpc: `get_account_devices`, `revoke_push_device`, `revoke_device_by_fingerprint`; **edge: `push-public-key` (VAPID), `push-device-revoked`** | pushSubscriptionService.ts:32,66,104,219,252,312,316,369,391 | **Push está inoperante na configuração atual**: `getPublicKey` chama a edge `push-public-key`, bloqueada pela allowlist → retorna `null` → `subscribe()` aborta com `reason:"vapid_not_configured"` (pushSubscriptionService.ts:64-72, 79-80). O broadcast de revogação (`push-device-revoked`, :391) idem. Sete catches devolvem `[]`/`null`/`false` (:69,175,207,226,239,292,351). |
| questsService.ts | 🟨 | 4 arquivos (hooks/páginas de quests) | tab: `custom_quests`, `quest_steps`, `quest_assignments` | questsService.ts:35,121,164,218-293 | **Stub que finge sucesso**: todo o pipeline de recompensa de `completeQuest` (combo, XP, moedas, contador, notificação, missões, conquistas) está dentro de um `try` cujo `catch` apenas loga (questsService.ts:237-290). Se qualquer etapa falhar, a função **retorna sucesso** com `comboResult: null` e o usuário fica sem XP. Economia creditada pelo cliente via `profilesService` (:250,254,258). |
| quizQuestionsService.ts | ✅ | 5 arquivos (`components/quiz/*`, admin de perguntas) | tab: `quiz_questions`, `quiz_options`; rpc: `get_quiz_play_set`, `grade_quiz_answer`, `quiz_fifty_fifty`, `get_quiz_lifeline` | quizQuestionsService.ts:50,80,280,293,303,327 | Correção e ajudas são server-side, o gabarito não trafega antes do envio (quizQuestionsService.ts:248-251) — bom. `if (qError) throw` duplicado (quizQuestionsService.ts:198 e 201) e `updateQuestion` apaga+reinsere opções sem transação (:206-223), quebrando FKs de `quiz_answers`. |
| quizService.ts | 🟨 | `hooks/useQuizScores.ts` → `pages/DailyQuiz.tsx`, `components/quiz/QuizDailyRanking.tsx` | tab: `quiz_scores`, `profiles` | quizService.ts:39,63,87,123 | **Pontuação enviada pelo cliente**: `saveScore` insere `score`, `correct_answers`, `streak_bonus`, `time_bonus` com valores arbitrários vindos do navegador (quizService.ts:38-50) — o ranking diário é forjável. **Catch silencioso**: erro no INSERT vira `return null` sem log (quizService.ts:52-54); `getDailyRanking`/`getUserTodayScores` devolvem `[]` em erro (:67-69, 129-131). Ranking agregado no cliente (:72-113) — não escala. |
| quizStatsService.ts | 🟨 | `hooks/useQuizStats.ts` → 5 componentes de quiz | tab: `quiz_answers`, `quiz_questions`; rpc: `get_quiz_category_stats` | quizStatsService.ts:34,54,77,105,119 | `recordAnswer` grava `is_correct` **afirmado pelo cliente** (quizStatsService.ts:39) enquanto existe a RPC `grade_quiz_answer` server-side — estatísticas de dificuldade são contaminadas. `getHardestQuestions` baixa **toda** a tabela `quiz_answers` sem filtro nem limite e agrega no navegador (quizStatsService.ts:104-110). Todos os erros viram `[]`/zeros. |
| rbacService.ts | 🟨 | 4 arquivos (`hooks/useRBAC`, admin de papéis) | tab: `profiles`, `permissions`, `roles`, `role_permissions`, `user_roles` | rbacService.ts:54,75,135,190,250,284,305,329-378 | **Duplicação integral de `permissionsService.ts`** sobre as mesmas 4 tabelas, com regras divergentes (`super_admin` em permissionsService.ts:104 vs. `admin.full` em rbacService.ts:377). Autorização computada no cliente (:329-378). `setUserRoles`/`setRolePermissions` fazem DELETE-then-INSERT sem transação (:305-325, 224-244): falha no INSERT deixa o usuário **sem nenhum papel**. Catches devolvem `[]` (:64-67, 82-85, 369-372). |
| salesCampaignsService.ts | 🟨 | 7 arquivos (`components/campaigns/*`, hooks) | tab: `sales_campaigns`, `campaign_participants`, `campaign_progress_events`, `notifications`, `notification_preferences`, `profiles_public`, `team_members`; rpc: `user_wants_in_app_notification`, `recalc_campaign_progress`; **edge: `send-campaign-push`** | salesCampaignsService.ts:90,106,160,203,291,336,386,398,142 | **Corrida de progresso**: `logProgress` lê `progress`, soma `delta` e faz upsert no cliente (salesCampaignsService.ts:361-384) — dois eventos simultâneos perdem um. Recompensa creditada no cliente (:412-413). **Regras de split declaradas e nunca implementadas**: `type:"flat"`, `type:"top_only"`, `global_bonus_xp`, `global_bonus_coins`, `top_n` aparecem só no tipo (salesCampaignsService.ts:22-30) — grep em `/src` não encontra nenhuma leitura; `logProgress` só usa `xp_per_unit`/`coin_per_unit` (:410-411). Catches vazios sem log em 3 pontos (:338-340, 462-464, 505-507). Push depende de edge bloqueada. |
| scratchCardService.ts | ✅ | `hooks/useScratchCards.ts`, `pages/ScratchCardPage.tsx` | tab: `scratch_cards`; rpc: `grant_scratch_card`, `reveal_scratch_card` | scratchCardService.ts:46,59,72 | Nenhum. Sorteio e crédito 100% em RPC SECURITY DEFINER (documentado em :38-42). |
| seasonalEventsService.ts | 🟨 | `hooks/useSeasonalEvents.ts` → `SeasonalEventBanner.tsx`, `pages/SeasonalEventDetail.tsx` | tab: `seasonal_events`, `seasonal_challenges`, `user_seasonal_progress`, `profiles` | seasonalEventsService.ts:48,70,102,124,159,168,176-191 | **Resgate duplicável**: `claimReward` **não verifica** `completed_at` nem `claimed` antes de creditar — apenas faz `update({claimed:true})` e soma XP/moedas ao perfil (seasonalEventsService.ts:156-193). Chamar N vezes credita N vezes. XP/moedas gravados por read-modify-write do cliente (:176-191). `incrementProgress` também é RMW não-atômico (:123-153). `badge_name`/`badge_icon` são lidos (:160) e descartados — badge nunca é concedido. |
| securityService.ts | 🟨 | `components/security/BlockedIPsPanel.tsx`, `components/security/RateLimitRulesPanel.tsx` | tab: `blocked_ips`, `rate_limit_rules` | securityService.ts:38,46,52,59,70,76,83,89 | CRUD puro sem nenhuma validação de formato de IP/CIDR nem de limites (`requests_per_minute` etc. aceitos como vierem, securityService.ts:66-80). Casts `as unknown as` contornam a tipagem gerada em todos os writes (:53,71,77,90). As regras só são consumidas pela edge `send-rate-limit-alert` — **nenhum código em `/src` aplica bloqueio**; é painel de configuração, não de enforcement. |
| sequenceGameService.ts | ✅ | `hooks/useSequenceGame.ts` → `pages/SequenceGamePage.tsx`, `pages/SequenceProcedureAdminPage.tsx`, `components/sequence/SequenceProcedureStatsCard.tsx` | tab: `sequence_procedures`, `sequence_steps`, `sequence_attempts`; rpc: `get_sequence_play_set`, `submit_sequence_attempt`, `save_sequence_procedure`, `get_sequence_procedure_stats` | sequenceGameService.ts:59,81,111,127,238,264 | Nenhum. Gabarito e crédito server-side; salvamento transacional em RPC única, com justificativa (sequenceGameService.ts:214-218). |
| shopService.ts | 🟨 | 12 arquivos (`hooks/useShop.ts`, loja e shop-admin) | tab: `shop_rewards`, `shop_purchases`, `shop_promotions`, `profiles` | shopService.ts:84,110,132,157,164,171,272,325,394 | **Compra não-atômica e gravável pelo cliente**: `purchaseReward` verifica saldo/estoque no navegador (shopService.ts:143,152), debita `profiles.coins` por UPDATE direto (:157-160), decrementa `stock` (:163-168) e só então cria o `shop_purchases` (:171-180) — **sem rollback**. Falha no INSERT queima moedas e estoque. Concorrência permite gastar o mesmo saldo duas vezes. **Promoção nunca aplicada na compra**: `getDiscountedPrice` (:465-477) só é usada em `components/FlashSalesBanner.tsx:73` para exibição; `purchaseReward` cobra `price_coins` cheio (:151). Cores de raridade hardcoded em Tailwind (:224-253). |
| socialFeedService.ts | ✅ | `hooks/useSocialFeed.ts` → `pages/SocialFeed.tsx`; `components/SocialFeed.tsx` | tab: `audit_logs`, `profiles` | socialFeedService.ts:71,85,127,138 | Cores hardcoded (`text-yellow-500`, `text-purple-500`, …) fora do design system (socialFeedService.ts:22,28,33,38,43,48,53). |
| successionService.ts | 🟨 | 4 arquivos (páginas/componentes de sucessão) | tab: `positions`, `user_positions`, `profiles`, `departments` (+ `highPotentialService`) | successionService.ts:54,62,68,75,103-105,149,165 | **Retorno hardcoded que invalida o módulo**: `const successorCount = 0; const readyNowCount = 0; const readySoonCount = 0;` (successionService.ts:103-105). Consequência determinística: `riskLevel` é **sempre** `'critical'` (:107-112), e `getOverallSuccessionHealth` sempre reporta `coveredPositions: 0`, `atRiskPositions: 0`, `criticalPositions: total`, `benchStrength: 0` (:350-361). O painel de sucessão exibe dados fictícios. `tenure` é derivado de `profiles.created_at` (data de cadastro no app), não de admissão (:89-92). N+1: query de `user_positions` por candidato (:164-169). |
| tournamentService.ts | ✅ | 3 arquivos (páginas/componentes de torneio) | rpc: `list_tournaments`, `get_tournament_bracket`, `join_tournament`, `start_tournament`, `report_tournament_match` | tournamentService.ts:86,95,106,117,132 | Nenhum. 100% RPC SECURITY DEFINER, sem acesso direto a tabela. |
| tradingCardsService.ts | ✅ | 4 arquivos (álbum de cartas) | tab: `card_definitions`, `user_cards`, `card_packs`, `card_trades`; rpc: `open_card_pack`, `propose_card_trade`, `respond_card_trade`, `get_card_set_rewards`, `claim_card_set_reward` | tradingCardsService.ts:103,117,130,147,162,177,192,209,220 | Nenhum. Sorteio, troca e prêmio de coleção server-side. |
| trailsService.ts | 🟨 | 8 arquivos (trilhas, admin de trilhas, certificações) | tab: `learning_trails`, `trail_modules`, `trail_enrollments`, `module_progress`, `trail_prerequisites`, `certifications` | trailsService.ts:108,142,158,193,240,286,322,432-443 | **Recompensa da trilha nunca é concedida**: `xp_reward`, `coin_reward`, `badge_name` só são gravados em `createTrail` (trailsService.ts:348-350); ao atingir 100% (`updateEnrollmentProgress`, :295-333) o código audita, incrementa missões, checa conquistas e emite certificado — **nunca credita o XP/moedas/badge da trilha**. Só o XP do módulo é dado (:261). Quatro catches que só logam e seguem (:262-264, 270-272, 308-310, 315-317, 330-332) — falha de XP é invisível. `reorderModules` faz um UPDATE por item em loop, sem transação (:435-442). |
| twoFactorService.ts | 🟨 | `hooks/useTwoFactor.ts` → `TwoFactorSetup.tsx`, `ReauthProvider.tsx`, `pages/SecurityDashboard.tsx`; `pages/Auth.tsx` | tab: `user_two_factor` | twoFactorService.ts:29,98-102,137-173,180-183 | Ver "Achados graves" #2. Resumo: `Math.random()` para códigos de backup (:29); segredo TOTP **lido para o navegador** e validado no cliente (:98-102, 138-142, 162-172); `verifyToken` **retorna `true` quando a query falha** (:144-146) — fail-open; `disable()` grava `verified_at: ""` numa coluna de timestamp (:182). |
| wagerAdminService.ts | ✅ | 7 arquivos (admin da Pergunta do Dia) | tab: `wager_questions`; rpc: `list_wager_questions`, `save_wager_question` | wagerAdminService.ts:94,117,163 | Nenhum. Validação dupla (cliente em `lib/wagerAuthoring` + banco), parsing defensivo de toda linha (:64-89). |
| wagerBudgetService.ts | ✅ | `hooks/useWagerAdmin.ts`; `src/test/wagerBudgetSettings.test.ts` | tab: `wager_budget_settings` | wagerBudgetService.ts:43,74 | Nenhum. Clamps espelham CHECK constraints com justificativa (:20). |
| wagerIntegrityReviewEventService.ts | ✅ | 3 arquivos (painel antifraude) | tab: `wager_integrity_review_events`, `profiles_public` | wagerIntegrityReviewEventService.ts:48,74 | Nenhum. Trilha somente-leitura; falha ao resolver nomes degrada sem derrubar o histórico (:77-79). |
| wagerIntegrityReviewService.ts | ✅ | 5 arquivos (painel antifraude) | tab: `wager_integrity_reviews` | wagerIntegrityReviewService.ts:72,104 | Nenhum. Upsert com `onConflict` explícito e normalização defensiva (:47-66). |
| webauthnService.ts | 🟨 | `hooks/useWebAuthn.ts` → `components/security/PasskeysPanel.tsx`, `pages/SecurityDashboard.tsx`; `components/auth/PasskeyLogin.tsx` | tab: `webauthn_challenges`, `webauthn_credentials`; rpc: `get_passkeys_by_email`, `user_has_passkeys` | webauthnService.ts:104,112,200,243,254,304-340,401 | Ver "Achados graves" #3. A cerimônia WebAuthn é **inteiramente client-side e sem verificação criptográfica**: `authenticate()` nunca valida a assinatura contra `public_key`, nunca confere o challenge salvo, e `clientDataJSON` é parseado (:316) e **descartado sem uso** — origem/tipo/challenge não são checados. O `success:true` sai de um simples `SELECT` por `credential_id` (:304-312, 340). Mitigado na prática por `PasskeyLogin.tsx:39-46`, que exige uma sessão real do Supabase antes de liberar o fluxo. |
| weeklyChallengesService.ts | 🟨 | `hooks/useWeeklyChallenge.ts` → `components/WeeklyChallengeCard.tsx` | tab: `weekly_challenges`, `profiles` | weeklyChallengesService.ts:26,47,74,86,99,123,130 | **O próprio vencedor credita o prêmio**: `completeChallenge` só grava `status`/`winner_id` (:81-94); o XP e as moedas são adicionados pelo hook, no navegador do ganhador (`hooks/useWeeklyChallenge.ts:209-210`). `updateXpGained` **sobrescreve** o valor em vez de somar (:75). `findOpponent` baixa **todos** os perfis ordenados por XP para achar 1 oponente (:98-101) e sorteia com `Math.random()` (:123). Interpolação de `userId` no filtro `.or()` (:28,132). |
| xpBalancingService.ts | ⬛ | **Apenas `src/test/xpBalancing.test.ts`** — nenhum importador em produção | nenhum I/O (módulo puro) | xpBalancingService.ts:1-173; único importador confirmado por grep em `/src` | Motor completo (Gini, mediana, classificação de economia, recomendações) sem **nenhuma** tela de admin que o consuma. Recomendações são calculadas e jamais exibidas ou aplicadas. |

---

## Integrações externas detectadas

**Nenhum `fetch()`, `axios` ou URL de terceiro aparece nos 46 arquivos do lote.** Comprovação:
`grep -nE "fetch\(|axios|https?://"` sobre a lista completa retorna zero linhas. Toda saída externa
é intermediada por Edge Functions do Supabase, via `invokeEdgeSafe` (`src/lib/requestId.ts`).

| Edge Function invocada | Serviço / linha | Natureza do terceiro | Origem da credencial | Consta em `.env.example`? |
|---|---|---|---|---|
| `competency-alerts` | notificationsService.ts:184 | análise de competências (server-side) | nenhuma no cliente — segredos ficam na edge | n/a (nome só citado no comentário de exemplo da allowlist, `.env.example:24`) |
| `reward-approval-review` | purchaseGovernanceService.ts:84 | **IA / LLM** (análise de risco de resgate) | chave do provedor de IA vive na edge; **nenhuma env var de IA existe em `.env.example`** | ❌ não |
| `push-public-key` | pushSubscriptionService.ts:66 | **VAPID / Web Push** — devolve a chave pública | par VAPID armazenado como secret da edge | ❌ não (nenhum `VAPID_*` em `.env.example`) |
| `push-device-revoked` | pushSubscriptionService.ts:391 | **Web Push** (broadcast de revogação) | idem VAPID | ❌ não |
| `send-campaign-push` | salesCampaignsService.ts:142 | **Web Push** (campanhas) | idem VAPID | ❌ não |

Domínio único de saída em runtime: **`https://eidsaqymojyuhprobfpn.supabase.co`** (`.env:3`,
`VITE_SUPABASE_URL`) — REST/RPC/Storage/Functions. Telemetria: **Sentry** via `@sentry/react`,
importado por `src/lib/requestId.ts:19` e acionado em toda invocação de edge
(`requestId.ts:33-40, 47-60`); nenhuma variável `VITE_SENTRY_DSN` existe em `.env.example` nem em `.env`.

**Bitrix24**: `.env.example:11` declara `VITE_BITRIX_WEBHOOK_URL=https://promobrindes.bitrix24.com.br/rest/1/seu-webhook/`,
mas **essa variável não existe em `.env`** e **nenhum arquivo deste lote a lê**. `positionsService.ts:451-488`
apenas persiste `bitrix_task_id`/`source:'bitrix24'` em `task_scores`; a integração HTTP real, se houver,
está nas edge functions `bitrix24-api` / `bitrix24-oauth` / `bitrix24-webhook`.

---

## Services órfãos

Nenhum arquivo do lote tem 0 importadores. Dois têm **importador exclusivamente de teste** — mortos em produção:

| Service | Único importador | Prova |
|---|---|---|
| `src/services/predictiveFeedbackService.ts` | `src/test/predictiveFeedback.test.ts` | `grep -rl "services/predictiveFeedbackService"` em `/src` retorna 1 arquivo, sob `src/test/` |
| `src/services/xpBalancingService.ts` | `src/test/xpBalancing.test.ts` | `grep -rl "services/xpBalancingService"` em `/src` retorna 1 arquivo, sob `src/test/` |

Exports órfãos dentro de services vivos (a função existe, ninguém chama o caminho útil):

- `shopService.getDiscountedPrice` (shopService.ts:465) — usada só para **exibir** preço em
  `components/FlashSalesBanner.tsx:73`; `purchaseReward` (shopService.ts:151) ignora promoções.
- `salesCampaignsService.SalesCampaign["split_rule"]` — variantes `"flat"`, `"top_only"`,
  `global_bonus_xp`, `global_bonus_coins`, `top_n` (salesCampaignsService.ts:22-30) não são lidas
  em lugar nenhum de `/src`.
- `trailsService` — `LearningTrail.xp_reward/coin_reward/badge_name` (trailsService.ts:18-21)
  nunca são creditados na conclusão.
- `oneOnOnePreparationService.OneOnOneContext.churnRisk` (oneOnOnePreparationService.ts:47-50) —
  campo do contrato nunca preenchido.
- `seasonalEventsService` — `badge_name`/`badge_icon` selecionados (seasonalEventsService.ts:160)
  e descartados.

---

## Achados graves

### 1. 🔴 Allowlist de Edge Functions vazia desliga 5 integrações do lote (e as 36 do projeto)

`.env:22` contém `VITE_DEPLOYED_EDGE_FUNCTIONS=` (vazio). `src/lib/edgeAvailability.ts:47-51`:

```
if (allowlist.size === 0) return false;   // "allowlist vazia = block all"
```

`invokeEdgeSafe` curto-circuita **antes de qualquer rede** e devolve erro 404 sintético
(`src/lib/requestId.ts:131-144`). Impacto medido neste lote:

- `pushSubscriptionService.getPublicKey()` → `null` → `subscribe()` aborta com
  `"vapid_not_configured"` (pushSubscriptionService.ts:66-72, 79-80). **Push notifications
  estão 100% inoperantes**, mas toda a UI de dispositivos/permissão continua visível.
- `purchaseGovernanceService.analyzeRisk()` lança exceção (purchaseGovernanceService.ts:88).
- `notificationsService.triggerCompetencyAnalysis()`, `push-device-revoked`, `send-campaign-push`
  viram no-ops silenciosos (notificationsService.ts:184; pushSubscriptionService.ts:391;
  salesCampaignsService.ts:142-154 — este último ainda engole o erro no catch).

Agrava: `.env.example:20` documenta o comportamento **oposto** ("Deixe vazio durante
desenvolvimento local (todas liberadas)") enquanto `.env:14` diz "NENHUMA FUNÇÃO LISTADA =
TODAS BLOQUEADAS". As 36 funções existem em `supabase/functions/`.

### 2. 🔴 2FA verificável e forjável no cliente, com códigos de backup previsíveis

`src/services/twoFactorService.ts`:

- **`Math.random()` para segredo de segurança** (:26-33): 8 códigos de backup de 6 caracteres
  gerados por `Math.random().toString(36)` — não criptográfico e previsível. Note que o mesmo
  arquivo usa `OTPAuth.Secret({size:20})` corretamente para o TOTP (:22), o que evidencia o descuido.
- **Segredo TOTP trafega para o navegador**: `verifyAndEnable` (:98-102) e `verifyToken` (:138-142)
  fazem `SELECT totp_secret` — quem tem sessão lê o próprio segredo e gera códigos válidos offline
  para sempre. Códigos de backup também são lidos em claro (:140,149).
- **Fail-open**: `verifyToken` retorna `true` se a query falhar por qualquer motivo:
  `if (error || !data?.is_enabled) { return true; // 2FA not enabled, allow access }` (:144-146).
  Uma negação de RLS ou erro de rede **libera o acesso**.
- **Bug de tipo**: `disable()` grava `verified_at: ""` (:182) numa coluna timestamp — string vazia
  não é um timestamp válido em Postgres; a desativação do 2FA provavelmente falha em runtime.
- Códigos de backup são armazenados em texto plano (:85,153-157).

### 3. 🔴 WebAuthn sem verificação criptográfica — cerimônia decorativa

`src/services/webauthnService.ts:276-351`. O fluxo de autenticação:

1. gera challenge e insere em `webauthn_challenges` **sem `user_id`** (:243-246);
2. chama `navigator.credentials.get()`;
3. busca a credencial por `credential_id` (:304-309);
4. lê o contador dos bytes 33-36 do `authenticatorData` (:318-319);
5. retorna `{ success: true, userId: credential.user_id }` (:340).

O que **não** acontece em momento nenhum: verificação da assinatura (`response.signature`) contra
`credential.public_key` — a coluna é gravada em `register` (:203) e **jamais lida**; validação de
que o challenge da resposta é o que foi emitido; validação de `origin` e `type`. A linha 316
faz `JSON.parse` do `clientDataJSON` para uma variável que nunca é usada — a intenção existia,
a checagem não. O registro (:200-208) também aceita a attestation sem verificação.

Mitigação real: `components/auth/PasskeyLogin.tsx:39-46` exige `supabase.auth.getSession()`
válida antes de liberar, então o passkey **não emite sessão**. Ou seja, o recurso não é
explorável para login hoje, mas também **não autentica nada** — é um gate cosmético.

### 4. 🔴 Economia de XP/moedas gravável e corrompível pelo cliente

O padrão read-modify-write sobre `profiles.xp/coins` a partir do navegador se repete em 6 serviços
do lote, com `profilesService` como núcleo:

| Local | Linha | Efeito |
|---|---|---|
| `profilesService.addXp` / `addCoins` | profilesService.ts:130-142, 158-160 | lê, soma, faz UPDATE — duas ações concorrentes perdem XP |
| `onboardingService.claimReward` | onboardingService.ts:206-219 | UPDATE direto de `xp`/`coins` |
| `seasonalEventsService.claimReward` | seasonalEventsService.ts:176-191 | idem, **sem checar `claimed`/`completed_at`** → resgate repetível N vezes |
| `shopService.purchaseReward` | shopService.ts:157-168 | débito de moedas + baixa de estoque **antes** do INSERT, sem rollback (:171-183) |
| `salesCampaignsService.logProgress` | salesCampaignsService.ts:361-384, 412-413 | progresso e prêmio somados no cliente |
| `useWeeklyChallenge` (via este lote) | weeklyChallengesService.ts:81-94 + `hooks/useWeeklyChallenge.ts:209-210` | o próprio vencedor credita o próprio prêmio |

Somando: `quizService.saveScore` aceita `score`/`streak_bonus`/`time_bonus` arbitrários do cliente
(quizService.ts:38-50) e `quizStatsService.recordAnswer` aceita `is_correct` afirmado pelo cliente
(quizStatsService.ts:39) — **apesar de já existir** a RPC `grade_quiz_answer` que corrige no servidor
(quizQuestionsService.ts:293). O contraste é gritante com `predictionMarketService`,
`scratchCardService`, `tradingCardsService`, `tournamentService` e `sequenceGameService`, que fazem
tudo por RPC `SECURITY DEFINER`.

### 5. 🔴 Retornos hardcoded que fazem módulos inteiros exibirem dados falsos

- **Sucessão**: `successionService.ts:103-105` fixa `successorCount = 0`, `readyNowCount = 0`,
  `readySoonCount = 0`. Consequência determinística: `riskLevel` é sempre `'critical'` (:107-112)
  e `getOverallSuccessionHealth` sempre devolve `coveredPositions: 0` / `benchStrength: 0`
  (:350-359) — **para qualquer base de dados**. `findSuccessorCandidates` existe e funciona
  (:146-204), mas seu resultado nunca alimenta esses contadores. O painel de sucessão é ficção.
- **Pesquisas de clima**: `pulseSurveysService.ts:236` retorna
  `completion_rate: 0, // Would need total eligible users` — a taxa de adesão é sempre 0%.
- **Trilhas**: recompensa da trilha (`xp_reward`, `coin_reward`, `badge_name`) nunca é creditada
  na conclusão (trailsService.ts:295-333); apenas o XP do módulo (:261).
- **9-Box**: `getEvaluations(departmentId, period)` ignora `departmentId` (nineBoxService.ts:44-56)
  — filtro de departamento não tem efeito.

### 6. 🟠 (bônus) Catch silencioso sistêmico + autorização duplicada

`questsService.completeQuest` envolve **todo** o pipeline de recompensa num `try/catch` que só loga
e **retorna sucesso** (questsService.ts:237-290) — o usuário completa a quest e não recebe nada,
sem nenhum sinal. O mesmo padrão degradante aparece em `trailsService` (5 catches), `pushHistoryService`
(2 catches → `[]`), `passwordResetService` (:186,200 → `false`/`0`), `organizationService`
(:40,50,57 → `null`), `quizService` (:52,67,129), `rbacService` (:64,82,369) e
`salesCampaignsService` (3 catches vazios, sem log: :338, :462, :505).

E `permissionsService.ts` × `rbacService.ts` são **duas implementações concorrentes** de RBAC sobre
as mesmas tabelas (`permissions`, `roles`, `role_permissions`, `user_roles`), com regras de bypass
divergentes — `super_admin` (permissionsService.ts:104) vs. `admin.full` (rbacService.ts:377) —
ambas computando autorização no cliente com N+1.

---

## src/lib + integrations + i18n

# Auditoria de estado — `src/lib` + `src/integrations` + `src/i18n`

**Escopo medido:** 106 arquivos em `src/lib` (21.940 linhas), 3 em `src/integrations` (13.026 linhas), 1 em `src/i18n` (944 linhas). **Total 110 arquivos.**
**Método:** leitura direta + `grep` de consumidores em todo `src/` (import estático, import dinâmico `import("...")` e re-export). Nenhum arquivo foi editado.

**Legenda de classificação**
- ✅ = consumido em runtime, sem defeito medido
- 🟨 = consumido, mas com problema/risco medido
- 🟦 = sem evidência suficiente para classificar
- ⬛ = MORTO (zero consumidores em runtime; só teste ou nada)

**Convenção da coluna Consumidores:** `P=n` consumidores de produção (components/pages/hooks/services/lib), `T=n` arquivos de teste. `P=0` ⇒ ⬛.

---

## Achado estrutural nº 0 (contexto para ler a tabela)

`src/lib` **não é camada de dados**. Medição: apenas **6 dos 106 arquivos** citam `supabase` (`grep -rn "supabase" src/lib/*.ts` → 20 linhas em 6 arquivos), e só **3** fazem I/O real de tabela:

| Arquivo | Linha | Acesso |
|---|---|---|
| `src/lib/luckyWheelBudget.ts` | 54, 79, 101 | `from("lucky_wheel_settings")`, `from("lucky_wheel_settings_audit")` |
| `src/lib/luckyWheelBudgetWhatIf.ts` | 182, 212 | `from("lucky_wheel_whatif_snapshots")` (via `import()` dinâmico nas linhas 176 e 210) |
| `src/lib/slaTargets.ts` | 145, 156 | `from("sla_targets")` |
| `src/lib/requestId.ts` | 88 | `supabase.functions.invoke` (wrapper genérico de Edge Function) |
| `src/lib/edgeErrors.ts` | 6, 187 | só comentário + leitura do `Response` anexado (sem I/O próprio) |
| `src/lib/trailAuthoring.ts` | 2 | só `import type { Json }` |

**Zero `.rpc(...)` em todo `src/lib`.** As 4 tabelas citadas existem em `types.ts` (verificado contra a lista extraída). Todo o resto de `src/lib` é lógica pura — na maioria, **espelhos em TypeScript de RPCs/triggers SQL** ("motor puro", "espelho determinístico"), declarados como tal nos próprios docblocks.

---

## Módulos de src/lib

| Módulo | Classificação | Consumidores | Acessa | Evidência | Problema |
|---|---|---|---|---|---|
| `auctionAdmin.ts` (307) | ✅ | P=3 T=3 | puro (espelha RPCs `close_auction`/`cancel_auction`/`settle_auction`) | `src/components/auction/AuctionAdminForm.tsx:20` | espelho de SQL — divergência silenciosa possível (ver Achados) |
| `auctionEngine.ts` (103) | ⬛ | P=0 T=1 | puro (espelha `place_auction_bid`/`settle_auction`) | único ref: `src/test/auction.simulation.test.ts` | **MORTO em runtime**: só teste consome |
| `authValidations.ts` (120) | 🟨 | P=2 T=0 | **fetch externo** `https://api.pwnedpasswords.com/range/` | `src/components/PasswordStrengthIndicator.tsx:3`; `src/pages/Auth.tsx:15`; fetch em `authValidations.ts:94` | falha silenciosa: `!response.ok` e `catch` retornam `{isLeaked:false}` (`:100-102`, `:116-118`) — senha vazada passa como limpa se a API cair |
| `bingoEngine.ts` (121) | ✅ | P=2 T=1 | puro (espelha RPC `sync_bingo_card`) | `src/services/bingoService.ts:3` | espelho de SQL |
| `boardChallenge.ts` (95) | ✅ | P=1 T=1 | puro (espelha `resolve_board_challenge`) | `src/components/board/BoardChallengeDialog.tsx:15` | espelho de SQL |
| `boardStats.ts` (157) | ✅ | P=5 T=3 | puro | `src/components/board/BoardLeaderboard.tsx:7` | — |
| `boardStatsExport.ts` (130) | ✅ | P=2 T=1 | puro (CSV) | `src/components/board/BoardChallengeReport.tsx:13` | — |
| `boardStatsPdf.ts` (144) | ✅ | P=1 T=1 | puro + `import("jspdf")` dinâmico | `src/components/board/BoardChallengeReport.tsx:63` | — |
| `boardTrail.ts` (271) | ✅ | P=6 T=2 | puro (espelha `advance_board_trail`) | `src/components/board/BoardPath.tsx:4` | espelho de SQL |
| `boardTrailAuthoring.ts` (369) | ✅ | P=2 T=1 | puro | `src/components/board/BoardTileRow.tsx:14` | — |
| `bossAlerts.ts` (123) | ⬛ | P=0 T=1 | puro | único ref: `src/test/bossAlerts.simulation.test.ts` | **MORTO em runtime** |
| `bossAutoHooks.ts` (219) | ⬛ | P=0 T=1 | puro (espelha `trg_boss_damage_*`) | único ref: `src/test/bossAutoHooks.simulation.test.ts` | **MORTO em runtime** |
| `bossBattle.ts` (245) | ✅ | P=8 T=2 | puro | `src/components/boss/BossBattleAdminDialog.tsx:26` | espelho de RPC SECURITY DEFINER |
| `bossBattlePlanner.ts` (276) | ✅ | P=1 T=1 | puro | `src/components/boss/BossBattleAdminDialog.tsx:32` | — |
| `bossDepartmentComparison.ts` (180) | ✅ | P=7 T=3 | puro | `src/components/boss/BossExecutiveSummaryCard.tsx:25` | — |
| `bossDepartmentComparisonExport.ts` (119) | ✅ | P=1 T=1 | puro (CSV) | `src/components/boss/BossDepartmentComparisonCard.tsx:25` | — |
| `bossExecutiveSummary.ts` (259) | ✅ | P=1 T=0 | puro | `src/components/boss/BossExecutiveSummaryCard.tsx:30` | sem teste dedicado |
| `bossHistory.ts` (247) | ✅ | P=14 T=8 | puro | `src/components/boss/BossTrendChart.tsx:14` | hub do domínio Chefão |
| `bossHistoryExport.ts` (103) | ✅ | P=1 T=1 | puro (CSV) | `src/components/boss/BossHistoryCard.tsx:20` | — |
| `bossHistoryTrend.ts` (154) | ✅ | P=2 T=1 | puro | `src/components/boss/BossTrendChart.tsx:13` | — |
| `bossLeaderboard.ts` (154) | ✅ | P=1 T=1 | puro | `src/components/boss/BossContributorsCard.tsx:8` | — |
| `bossReport.ts` (339) | ✅ | P=2 T=2 | puro (CSV) | `src/components/boss/BossConsolidatedReportCard.tsx:24` | — |
| `bossReportPdf.ts` (117) | ✅ | P=1 T=0 | puro + jsPDF dinâmico | `src/components/boss/BossConsolidatedReportCard.tsx:90` | sem teste dedicado |
| `bossWinRateGoals.ts` (200) | ✅ | P=3 T=1 | puro | `src/components/boss/BossWinRateGoalsCard.tsx:27` | — |
| `campaignImport.ts` (728) | ✅ | P=3 T=1 | puro (parse CSV/XLSX) | `src/components/campaigns/CampaignReconciliationPanel.tsx:23` | maior arquivo puro do lib; template hardcoded em `:355` (`vendedor@empresa.com;...`) — é exemplo de modelo, aceitável |
| `campaignTeamHealth.ts` (251) | ✅ | P=2 T=1 | puro | `src/components/campaigns/CampaignTeamHealthAlert.tsx:4` | — |
| `campaignTeamMetrics.ts` (177) | ✅ | P=2 T=1 | puro | `src/hooks/useCampaignTeamsDashboard.ts:14` | — |
| `campaignTeamSplit.ts` (215) | ✅ | P=1 T=1 | puro (espelha `award_campaign_team_split`) | `src/pages/CampaignTeamRanking.tsx:24` | espelho de SQL |
| `campaignTeamSplitRevert.ts` (136) | ⬛ | P=0 T=1 | puro (espelha `revert_campaign_team_split`) | único ref: `src/test/campaignTeamSplitRevert.simulation.test.ts` | **MORTO em runtime** — a reversão de rateio não tem UI |
| `cardPackNotifications.ts` (84) | ⬛ | P=0 T=1 | puro (espelha `trg_card_pack_notify`) | único ref: `src/test/cardPackNotifications.simulation.test.ts` | **MORTO em runtime** |
| `cardPackTriggers.ts` (152) | ⬛ | P=1 T=2 | puro (espelha `trg_card_pack_*`) | único consumidor não-teste: `src/lib/cardPackNotifications.ts:20` — que também é morto | **MORTO transitivamente** (falso-positivo evitado: o único "P" é um módulo morto) |
| `cardSetRewards.ts` (244) | ✅ | P=4 T=1 | puro (espelha `claim_card_set_reward`) | `src/components/cards/SetRewardsPanel.tsx:6` | espelho de SQL |
| `certificatePdf.ts` (152) | ✅ | P=1 T=1 | puro + `import("jspdf")`/`import("qrcode")` | `src/components/certifications/CertificateActions.tsx:7` | — |
| `climateBenchmark.ts` (319) | 🟨 | P=4 T=3 | puro | `src/components/engagement/diagnostics/BenchmarkComparison.tsx:25`; import invertido em `climateBenchmark.ts:507` (`@/services/climateSurveyService`) | inversão de camada: `lib` → `services` |
| `csvExport.ts` (30) | ✅ | P=13 T=0 | puro | `src/components/board/BoardChallengeReport.tsx:14` | utilitário CSV realmente usado (13 consumidores) — contrasta com `exportReports.ts` |
| `dailyWager.ts` (211) | ✅ | P=2 T=1 | puro (espelha `submit_daily_wager`) | `src/services/dailyWagerService.ts:3` | espelho de SQL |
| `departmentWar.ts` (314) | ✅ | P=5 T=1 | puro | `src/components/war/WarLeadershipAlert.tsx:6` | — |
| `departmentWarConfig.ts` (421) | ✅ | P=3 T=1 | puro (espelha `settle_department_war`) | `src/components/war/DepartmentWarConfigDialog.tsx:24` | espelho de SQL |
| `deviceFingerprint.ts` (94) | ✅ | P=3 T=1 | puro | `src/hooks/usePushDevice.ts:6` | — |
| `deviceLabel.ts` (199) | ✅ | P=5 T=1 | puro | `src/components/PushNotificationToggle.tsx:15` | — |
| `edgeAvailability.ts` (108) | 🟨 | P=3 T=0 | `sessionStorage` + `localStorage` + env `VITE_DEPLOYED_EDGE_FUNCTIONS` | `src/components/IpAccessGuard.tsx:8`; lógica em `edgeAvailability.ts:46-51` | **FEATURE FLAG DESLIGADA** — allowlist vazia ⇒ `isFunctionDeployed()` retorna `false` para tudo (`:48`). `.env:25` está `VITE_DEPLOYED_EDGE_FUNCTIONS=` (vazio). Sem teste dedicado. |
| `edgeErrors.ts` (235) | ✅ | P=1 T=2 | puro (lê `Response` de `FunctionsHttpError`) | `src/lib/requestId.ts:12` | — |
| `engagementInsights.ts` (347) | 🟨 | P=1 T=1 | puro | `src/components/engagement/diagnostics/AutoInsights.tsx:16`; import em `:643` | depende de `@/lib/climateBenchmark` que depende de `@/services` (inversão transitiva) |
| `errorMessages.ts` (104) | ✅ | P=6 T=0 | `sonner` (toast) | `src/components/board/BoardChallengeDialog.tsx:16` | dicionário de mensagens hardcoded (pt-BR) — por design; sem teste |
| `exportReports.ts` (537) | ⬛ | **P=0 T=0** | puro (CSV/Excel/PDF genérico) | `grep -rn "exportReports" src/` ⇒ **nenhum resultado** | **MORTO TOTAL — 537 linhas, zero referências no repo inteiro.** Exporta `exportToCSV`, `exportToExcel`, `exportToPDF`, `exportReport`, `createTeamPerformanceReport`, `createEngagementReport` (`:72,:122,:181,:407,:427,:486`) |
| `goalBetCountdown.ts` (88) | 🟨 | P=1 T=1 | puro | `src/components/prediction/GoalBetCountdownBadge.tsx:7`; import em `:1` | inversão de camada `lib`→`services` |
| `goalBetExposure.ts` (110) | 🟨 | P=3 T=1 | puro | `src/components/prediction/GoalBetExposureAlert.tsx:3` | inversão de camada `lib`→`services` (`:1-4`) |
| `goalBetFilter.ts` (70) | 🟨 | P=5 T=1 | puro | `src/components/prediction/GoalBetFilterBar.tsx:7` | inversão de camada (`:1-4`) |
| `goalBetHistory.ts` (104) | 🟨 | P=2 T=2 | puro | `src/components/prediction/GoalBetHistoryPanel.tsx:4` | inversão de camada (`:3-6`) |
| `goalBetHistoryCsv.ts` (78) | ✅ | P=1 T=1 | puro (CSV) | `src/components/prediction/GoalBetHistoryPanel.tsx:8` | — |
| `goalBetOrdering.ts` (54) | 🟨 | P=1 T=1 | puro | `src/pages/PredictionMarketsPage.tsx:29` | inversão de camada (`:1`) |
| `goalBetPosition.ts` (138) | 🟨 | P=3 T=1 | puro | `src/components/prediction/MyGoalBetPosition.tsx:3` | inversão de camada (`:1-4`) |
| `goalBetSearch.ts` (64) | 🟨 | P=1 T=1 | puro | `src/pages/PredictionMarketsPage.tsx:30` | inversão de camada (`:1`) |
| `goalBetSettlement.ts` (177) | ✅ | P=2 T=1 | puro (espelha `settle_prediction_market`) | `src/hooks/useGoalBetSuggestion.ts:8` | espelho de SQL |
| `goalBetShowcase.ts` (59) | ✅ | P=1 T=1 | puro | `src/components/campaigns/CampaignGoalBetPanel.tsx:15` | — |
| `goalBetStakePreview.ts` (127) | 🟨 | P=1 T=1 | puro | `src/components/prediction/StakeDialog.tsx:17` | inversão de camada (`:1`) |
| `goalBetUrlState.ts` (72) | ✅ | P=1 T=1 | puro (URLSearchParams) | `src/hooks/useGoalBetUrlSync.ts:8` | — |
| `goalBetting.ts` (194) | ✅ | P=2 T=2 | puro (espelha `create_prediction_market`) | `src/components/prediction/GoalBetDialog.tsx:39` | espelho de SQL |
| `lightningQuizScoring.ts` (82) | ✅ | P=1 T=1 | puro (espelha `finish_lightning_round`) | `src/pages/LightningQuizPage.tsx:25` | espelho de SQL |
| `luckyWheelAudit.ts` (261) | ✅ | P=2 T=1 | puro (lê `lucky_wheel_prize_audit` já carregado) | `src/components/luckywheel/LuckyWheelAuditTrail.tsx:14` | — |
| `luckyWheelBudget.ts` (113) | 🟨 | P=2 T=1 | **`lucky_wheel_settings`, `lucky_wheel_settings_audit`** + `localStorage` | `src/components/luckywheel/LuckyWheelWindowComparison.tsx:21`; SQL em `:54,:79,:101`; `STORAGE_KEY` em `:914`(doc)/`:14` | **duas fontes de verdade**: teto persiste em `localStorage` E no banco; divergência silenciosa possível |
| `luckyWheelBudgetWhatIf.ts` (220) | ✅ | P=1 T=2 | **`lucky_wheel_whatif_snapshots`** via `import()` dinâmico | `src/components/luckywheel/LuckyWheelWindowComparison.tsx:29`; SQL em `:176-182,:210-212` | import dinâmico do client (falso-negativo de grep evitado) |
| `luckyWheelComparisonAlerts.ts` (179) | ✅ | P=2 T=1 | puro | `src/components/luckywheel/LuckyWheelWindowComparison.tsx:22` | — |
| `luckyWheelOdds.ts` (310) | ✅ | P=4 T=6 | puro (espelha `spin_lucky_wheel`) | `src/components/luckywheel/LuckyWheelPayoutPanel.tsx:12` | espelho de SQL; 6 suítes de teste |
| `luckyWheelPayout.ts` (539) | ✅ | P=3 T=3 | puro | `src/components/luckywheel/LuckyWheelPayoutPanel.tsx:20` | — |
| `luckyWheelPayoutAlerts.ts` (189) | ✅ | P=1 T=1 | puro (espelha `raise_lucky_wheel_payout_alerts`) | `src/lib/luckyWheelPayoutHistory.ts:12` (que tem P=4) | espelho de SQL |
| `luckyWheelPayoutComparison.ts` (399) | ✅ | P=3 T=4 | puro (estatística: z-test, Welch, Cohen's d) | `src/components/luckywheel/LuckyWheelWindowComparison.tsx:35` | — |
| `luckyWheelPayoutHistory.ts` (440) | ✅ | P=4 T=5 | puro (lê `lucky_wheel_payout_snapshots` já carregado) | `src/components/luckywheel/LuckyWheelPayoutTrend.tsx:22` | — |
| `memoryDeckAuthoring.ts` (202) | ✅ | P=3 T=1 | puro | `src/hooks/useMemoryGame.ts:3` | — |
| `memoryGame.ts` (149) | ✅ | P=3 T=1 | puro (espelha `finish_memory_session`) | `src/components/memory/MemoryBoard.tsx:4` | espelho de SQL |
| `notificationTypePrefs.ts` (109) | ✅ | P=5 T=2 | puro (formato de `notification_preferences.type_preferences`) | `src/components/ExecutiveReportPreferenceToggle.tsx:9` | contrato JSONB acoplado a 3 RPCs `user_wants_*_notification` |
| `npsHistory.ts` (182) | ✅ | P=3 T=1 | puro (saneia RPC `get_engagement_nps_history`) | `src/components/engagement/diagnostics/NpsHistoryChart.tsx:23` | — |
| `nr1Export.ts` (125) | 🟨 | P=1 T=1 | puro (CSV via `csvExport`) | `src/pages/Nr1Risks.tsx:21`; import em `:1082-1089` | inversão de camada `lib`→`services` (`@/services/nr1RiskService`) |
| `opinionChannel.ts` (422) | ✅ | P=6 T=1 | puro (guarda de anonimato + SLA) | `src/components/engagement/opinions/OpinionTreatmentDialog.tsx:29` | guarda de anonimato só no cliente — defesa em profundidade, servidor é a fonte |
| `playerResume.ts` (155) | ✅ | P=1 T=1 | `localStorage` | `src/components/lms/ModuleViewer.tsx:24` | estado local por dispositivo — por design |
| `predictionAdmin.ts` (272) | ✅ | P=7 T=3 | puro (espelha 4 RPCs de mercado) | `src/components/prediction/GoalBetDialog.tsx:30` | espelho de SQL |
| `predictionMarket.ts` (254) | ✅ | P=1 T=1 | puro (espelha `place_prediction_stake`/`settle_prediction_market`) | `src/services/predictionMarketService.ts:3` | espelho de regra **monetária** — maior risco de divergência |
| `predictionOddsHistory.ts` (186) | ✅ | P=1 T=1 | puro (replay de `prediction_stakes`) | `src/components/prediction/OddsHistoryChart.tsx:20` | decisão explícita: sem tabela de snapshot |
| `predictionOracle.ts` (274) | ✅ | P=2 T=1 | puro | `src/components/prediction/OracleLeaderboard.tsx:22` | — |
| `predictionWatchdog.ts` (160) | ✅ | P=2 T=2 | puro (espelha `check_prediction_markets_health()`) | `src/components/prediction/PredictionWatchdogPanel.tsx:7` | espelho de SQL |
| `purchaseRisk.ts` (298) | ✅ | P=3 T=1 | puro (espelha Edge Function `reward-approval-review`) | `src/components/shop-admin/PurchaseGovernanceDialog.tsx:33` | espelho de Edge Function — que está bloqueada pela allowlist (ver Achados) |
| `pushDevices.ts` (439) | ✅ | P=4 T=4 | puro (normaliza `push_subscriptions`) | `src/components/push/PushDeviceList.tsx:27` | — |
| `pushOutbox.ts` (83) | ⬛ | P=0 T=1 | puro (espelha `claim_push_outbox` + `push-outbox-dispatcher`) | único ref: `src/test/pushOutbox.simulation.test.ts`. (`src/components/security/PushOutboxHealthPanel.tsx` importa `pushOutboxHealth`, não este) | **MORTO em runtime** |
| `pushOutboxHealth.ts` (148) | ✅ | P=1 T=1 | puro (saneia RPC `get_push_outbox_health`) | `src/components/security/PushOutboxHealthPanel.tsx:13` | — |
| `requestId.ts` (188) | 🟨 | P=16 T=1 | **`supabase.functions.invoke`** (todas as Edge Functions) | `src/components/TrailRecommendations.tsx:12`; curto-circuito em `requestId.ts:131-144` | **`invokeEdgeSafe` retorna 404 sintético sem tocar a rede quando `isFunctionDeployed()` é falso** — e com `.env:25` vazio isso vale para 100% das funções. `Math.random()` em `:72` (fallback de UUID) e `:105` (jitter de backoff) — ambos legítimos |
| `runbooks.ts` (261) | ✅ | P=2 T=1 | puro (conteúdo estático) | `src/components/prediction/PredictionWatchdogPanel.tsx:6` | 100% hardcoded por design: `owner:` em `:49,:78,:104,:128,:148,:207` são strings de papéis, não pessoas |
| `sequenceGame.ts` (218) | ✅ | P=4 T=1 | puro (espelha `submit_sequence_attempt`) | `src/components/sequence/SequenceStepList.tsx:5` | espelho de SQL |
| `sequenceProcedureAuthoring.ts` (202) | ✅ | P=1 T=1 | puro (espelha `save_sequence_procedure`) | `src/pages/SequenceProcedureAdminPage.tsx:49` | espelho de SQL |
| `sequenceProcedureStats.ts` (201) | ✅ | P=3 T=2 | puro (saneia RPC `get_sequence_procedure_stats`) | `src/components/sequence/SequenceProcedureStatsCard.tsx:27` | — |
| `sequenceProcedureStatsExport.ts` (270) | ✅ | P=1 T=1 | puro (CSV/PDF) | `src/components/sequence/SequenceProcedureStatsCard.tsx:32` | — |
| `slaTargets.ts` (159) | ✅ | P=1 T=1 | **`sla_targets`** (select + upsert) | `src/components/security/SlaTargetEditor.tsx:12`; SQL em `:145,:156` | um dos 3 módulos de `lib` que escrevem no banco — I/O misturado com motor puro |
| `tournamentBracket.ts` (210) | ✅ | P=2 T=1 | puro | `src/components/tournament/TournamentBracketView.tsx:7` | — |
| `tradingCards.ts` (326) | ✅ | P=6 T=2 | puro (espelha `open_card_pack`/`respond_card_trade`) | `src/components/cards/PackList.tsx:5` | espelho de SQL |
| `trailAuthoring.ts` (309) | ✅ | P=2 T=0 | `import type { Json }` de types.ts | `src/components/trails/ModuleDraftForm.tsx:19` | sem teste dedicado apesar do docblock dizer "exhaustively simulated in tests" (`:1402`) |
| `utils.ts` (6) | ✅ | P=214 T=0 | puro (`cn()`) | `src/components/AutoChallengesWidget.tsx:21` | módulo mais consumido do repo |
| `validations.ts` (353) | 🟨 | P=2 T=0 | puro (24 schemas Zod) | `src/components/PeerRecognition.tsx:16` (`kudosMessageSchema`); `src/components/AICoachDialog.tsx:17` (`aiCoachMessageSchema`) | docblock diz "All forms should use these schemas" (`:1421`) mas **só 2 dos 24 schemas são importados** — centralização abandonada |
| `wagerAuthoring.ts` (213) | ✅ | P=5 T=1 | puro (espelha `save_wager_question`) | `src/hooks/useWagerAdmin.ts:4` | espelho de SQL |
| `wagerBulkImport.ts` (312) | ✅ | P=1 T=2 | puro (parse CSV RFC 4180) | `src/components/wager/WagerBulkImportDialog.tsx:22` | — |
| `wagerIntegrity.ts` (288) | ✅ | P=5 T=2 | puro (antifraude estatístico) | `src/components/wager/WagerIntegrityCard.tsx:26` | — |
| `wagerIntegrityExport.ts` (195) | 🟨 | P=1 T=1 | puro (CSV) | `src/components/wager/WagerIntegrityCard.tsx:31` | inversão de camada `lib`→`services` |
| `wagerLeaderboard.ts` (114) | ✅ | P=8 T=2 | puro | `src/components/wager/WagerIntegrityCard.tsx:27` | — |
| `wagerMonthlyExposure.ts` (166) | 🟨 | P=1 T=1 | puro | `src/components/wager/WagerMonthlyExposureCard.tsx:14` | inversão de camada `lib`→`services` |
| `wagerScheduleExport.ts` (106) | 🟨 | P=2 T=1 | puro (CSV round-trip) | `src/lib/wagerBulkImport.ts:20` | inversão de camada `lib`→`services` (`@/services/wagerAdminService`) |
| `warAutoHooks.ts` (261) | ⬛ | P=0 T=1 | puro (espelha triggers SQL da Guerra) | único ref: `src/test/warAutoHooks.simulation.test.ts` | **MORTO em runtime** |
| `warFeed.ts` (150) | ✅ | P=2 T=1 | puro (normaliza `jsonb`) | `src/components/war/WarLiveFeed.tsx:8` | — |
| `warLeadership.ts` (249) | ✅ | P=2 T=1 | puro | `src/components/war/WarLeadershipAlert.tsx:5` | — |

### Contagem por classificação (`src/lib`, 106 arquivos)

| Classificação | Qtde | % |
|---|---|---|
| ✅ | 76 | 71,7% |
| 🟨 | 21 | 19,8% |
| 🟦 | 0 | 0% |
| ⬛ | 9 | 8,5% |

---

## src/integrations e src/i18n (4 arquivos)

| Arquivo | Classificação | Consumidores | Acessa | Evidência | Problema |
|---|---|---|---|---|---|
| `src/integrations/supabase/client.ts` (16) | ✅ | usado em todo o repo | cria client Supabase | `client.ts:5-6` lê `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` | sem chave hardcoded (bom); sem guarda para env ausente — `createClient(undefined, undefined)` quebraria em runtime |
| `src/integrations/supabase/types.ts` (12.972) | ✅ | tipo gerado | contrato de 233 tabelas, 2 views, 224 funções, 19 enums | `types.ts:16` (Tables), `:11201` (Views), `:11278` (Functions), `:12665` (Enums) | arquivo gerado; ver seções de contrato abaixo |
| `src/integrations/lovable/index.ts` (38) | ✅ | 🟦 não medido fora do escopo | `@lovable.dev/cloud-auth-js` → OAuth Google/Apple → `supabase.auth.setSession` | `index.ts:14-35` | auto-gerado ("Do not modify") |
| `src/i18n/translations.ts` (944) | 🟨 | P=2 T=1 | puro (dicionário 3 locales) | `translations.ts:243` (`pt-BR`), `:476` (`en-US`), `:709` (`es-ES`), `:944` (`defaultLocale`). Consumidores: `src/hooks/useI18n.ts`, `src/components/LanguageSelector.tsx`, `src/test/i18n.test.ts` | **i18n construído e não adotado**: os 3 locales estão completos, o provider está montado (`src/components/Providers.tsx:32-34,:45`), mas **nenhum componente ou página importa `useI18nContext`** (`grep -rl 'from "@/hooks/useI18n"' src` ⇒ só `Providers.tsx` e o teste). A UI inteira é pt-BR hardcoded. O seletor de idioma em `src/components/sidebar/SidebarFooter.tsx:26` troca um estado que quase nada consome |

---

## Tabelas declaradas em types.ts

**233 tabelas** (bloco `Tables` em `src/integrations/supabase/types.ts:16-11200`; contagem cruzada por 233 blocos `Row: {`).

1. `achievements`
2. `action_plan_items`
3. `action_plan_updates`
4. `action_plans`
5. `activity_comments`
6. `activity_reactions`
7. `ai_coach_messages`
8. `ai_course_jobs`
9. `announcement_reactions`
10. `announcement_reads`
11. `announcements`
12. `api_request_logs`
13. `attendance_records`
14. `attendance_settings`
15. `attendance_streaks`
16. `auction_admin_events`
17. `auction_bids`
18. `auctions`
19. `audit_logs`
20. `avatar_items`
21. `bingo_board_tasks`
22. `bingo_boards`
23. `bingo_cards`
24. `bingo_marks`
25. `bitrix24_sync_mappings`
26. `bitrix24_tokens`
27. `bitrix24_webhook_logs`
28. `blocked_ips`
29. `board_moves`
30. `board_player_states`
31. `board_tiles`
32. `board_trails`
33. `boss_battle_damage`
34. `boss_battle_rewards`
35. `boss_battles`
36. `boss_win_rate_goals`
37. `campaign_participants`
38. `campaign_progress_events`
39. `campaign_result_imports`
40. `campaign_result_rows`
41. `campaign_team_members`
42. `campaign_team_split_batches`
43. `campaign_team_split_entries`
44. `campaign_teams`
45. `card_definitions`
46. `card_packs`
47. `card_set_claims`
48. `card_trades`
49. `celebrations`
50. `certifications`
51. `checkin_templates`
52. `checkins`
53. `climate_benchmarks`
54. `climate_pillar_scores`
55. `climate_question_answers`
56. `climate_survey_questions`
57. `climate_survey_responses`
58. `climate_surveys`
59. `competencies`
60. `custom_badges`
61. `custom_quests`
62. `custom_ranks`
63. `custom_titles`
64. `demographic_attributes`
65. `department_missions`
66. `department_rankings`
67. `department_war_contributions`
68. `department_war_departments`
69. `department_war_metrics`
70. `department_war_results`
71. `department_wars`
72. `departments`
73. `development_plan_actions`
74. `development_plans`
75. `direct_duels`
76. `engagement_action_playbooks`
77. `engagement_answers`
78. `engagement_cycles`
79. `engagement_factors`
80. `engagement_question_assignments`
81. `engagement_question_pool`
82. `engagement_snapshots`
83. `enps_responses`
84. `enps_surveys`
85. `executive_monthly_reports`
86. `external_api_keys`
87. `external_tasks`
88. `feedback_cycles`
89. `feedback_evaluations`
90. `feedback_questions`
91. `feedback_requests`
92. `feedback_responses`
93. `feedback_results`
94. `gamification_themes`
95. `geo_access_logs`
96. `geo_allowed_countries`
97. `geo_blocking_rules`
98. `geo_settings`
99. `goal_updates`
100. `goals`
101. `ip_access_logs`
102. `ip_whitelist`
103. `key_results`
104. `kudos`
105. `kudos_badges`
106. `league_history`
107. `leagues`
108. `learning_trails`
109. `level_configs`
110. `lightning_quiz_answers`
111. `lightning_quiz_questions`
112. `lightning_quiz_sessions`
113. `login_attempts`
114. `lucky_wheel_payout_snapshots`
115. `lucky_wheel_prize_audit`
116. `lucky_wheel_prizes`
117. `lucky_wheel_settings`
118. `lucky_wheel_settings_audit`
119. `lucky_wheel_spins`
120. `lucky_wheel_whatif_snapshots`
121. `memory_decks`
122. `memory_pairs`
123. `memory_sessions`
124. `mentorship_mission_progress`
125. `mentorship_missions`
126. `mentorship_pairs`
127. `mentorship_requests`
128. `module_progress`
129. `mood_entries`
130. `new_device_alerts`
131. `nine_box_evaluations`
132. `notification_preferences`
133. `notification_templates`
134. `notifications`
135. `nr1_factor_mappings`
136. `nr1_risk_categories`
137. `onboarding_progress`
138. `opinion_responses`
139. `opinion_supports`
140. `opinion_tags`
141. `opinions`
142. `org_members`
143. `org_theme_history`
144. `organizations`
145. `password_reset_requests`
146. `pdi_checkins`
147. `pdi_mentors`
148. `pdi_templates`
149. `penalty_rules`
150. `permission_groups`
151. `permissions`
152. `position_competencies`
153. `position_task_templates`
154. `positions`
155. `postmortem_actions`
156. `postmortems`
157. `prediction_admin_events`
158. `prediction_markets`
159. `prediction_options`
160. `prediction_stakes`
161. `profiles`
162. `pulse_responses`
163. `pulse_surveys`
164. `purchase_approvals`
165. `push_notification_logs`
166. `push_outbox`
167. `push_outbox_health_snapshots`
168. `push_subscriptions`
169. `push_sync_events`
170. `query_telemetry`
171. `quest_assignments`
172. `quest_steps`
173. `quiz_answers`
174. `quiz_options`
175. `quiz_questions`
176. `quiz_scores`
177. `rate_limit_logs`
178. `rate_limit_rules`
179. `role_permissions`
180. `roles`
181. `runbook_executions`
182. `sales_campaigns`
183. `scratch_card_prizes`
184. `scratch_cards`
185. `seasonal_challenges`
186. `seasonal_events`
187. `security_alerts`
188. `sequence_attempts`
189. `sequence_procedures`
190. `sequence_steps`
191. `session_logs`
192. `shop_promotions`
193. `shop_purchases`
194. `shop_rewards`
195. `sla_targets`
196. `task_penalties`
197. `task_scores`
198. `team_members`
199. `tournament_matches`
200. `tournament_participants`
201. `tournaments`
202. `trail_enrollments`
203. `trail_modules`
204. `trail_prerequisites`
205. `user_achievements`
206. `user_avatar_config`
207. `user_avatar_items`
208. `user_cards`
209. `user_certifications`
210. `user_challenges`
211. `user_combos`
212. `user_competency_assessments`
213. `user_demographic_values`
214. `user_devices`
215. `user_leagues`
216. `user_mission_progress`
217. `user_permission_groups`
218. `user_positions`
219. `user_roles`
220. `user_seasonal_progress`
221. `user_titles`
222. `user_two_factor`
223. `wager_budget_settings`
224. `wager_entries`
225. `wager_integrity_review_events`
226. `wager_integrity_reviews`
227. `wager_questions`
228. `webauthn_challenges`
229. `webauthn_credentials`
230. `webhook_delivery_logs`
231. `webhook_idempotency`
232. `webhook_subscriptions`
233. `weekly_challenges`

### Views declaradas (2)

Bloco `Views` em `types.ts:11201-11277`:

1. `profiles_public`
2. `webhook_delivery_stats_24h`

---

## Funções/RPC declaradas em types.ts

**224 funções** (bloco `Functions` em `src/integrations/supabase/types.ts:11278-12664`; contagem cruzada por 224 ocorrências de `Args:`). As 6 primeiras com prefixo `_` são helpers internos (não deveriam ser chamáveis pelo cliente, mas estão no contrato tipado do `public`).

1. `_card_rarity_value`
2. `_card_set_milestone_split`
3. `_grant_card_pack_internal`
4. `_guard_manager_or_admin_if_user`
5. `_require_admin`
6. `_require_manager_or_admin`
7. `acknowledge_security_alert`
8. `admin_profile_directory`
9. `advance_board_trail`
10. `answer_lightning_question`
11. `apply_boss_damage_internal`
12. `apply_campaign_import`
13. `apply_task_penalty`
14. `approve_password_reset`
15. `assign_engagement_questions`
16. `auto_block_ip`
17. `auto_lock_prediction_markets`
18. `auto_promote_expired_webhook_secrets`
19. `auto_unblock_board_players`
20. `award_campaign_team_split`
21. `bingo_metric_value`
22. `bulk_rotate_webhook_secrets`
23. `calculate_enps_score`
24. `calculate_enps_score_impl`
25. `can_handle_opinion`
26. `cancel_auction`
27. `cancel_webhook_secret_rotation`
28. `check_api_key_rotation_overdue`
29. `check_boss_win_rate_alerts`
30. `check_boss_win_rate_alerts_impl`
31. `check_login_lockout`
32. `check_overdue_postmortem_actions`
33. `check_prediction_markets_health`
34. `check_sla_breaches_and_alert`
35. `check_webhook_sla_and_alert`
36. `chi_square_critical`
37. `claim_card_set_reward`
38. `claim_push_outbox`
39. `cleanup_expired_challenges`
40. `cleanup_expired_idempotency_keys`
41. `cleanup_old_security_logs`
42. `close_auction`
43. `close_expired_auctions`
44. `close_expired_sales_campaigns`
45. `complete_external_task`
46. `complete_task_score`
47. `create_auction_draft`
48. `create_external_api_key`
49. `create_prediction_market`
50. `deal_boss_damage`
51. `delete_board_trail`
52. `delete_external_api_key`
53. `engagement_min_respondents`
54. `enqueue_push`
55. `erf_inverse`
56. `expire_card_trades`
57. `finish_lightning_round`
58. `finish_memory_session`
59. `generate_action_plan_from_factor`
60. `generate_action_plan_from_nr1_category`
61. `generate_action_plan_from_opinion`
62. `generate_certificate_code`
63. `generate_engagement_snapshot`
64. `generate_executive_monthly_report`
65. `get_2fa_status`
66. `get_account_devices`
67. `get_active_engagement_cycle`
68. `get_alert_heatmap_30d`
69. `get_alert_mttr_by_type_7d`
70. `get_auction_summary`
71. `get_board_challenge_stats`
72. `get_board_trail_leaderboard`
73. `get_boss_battle_leaderboard`
74. `get_burn_rate`
75. `get_card_set_rewards`
76. `get_daily_wager`
77. `get_department_metrics`
78. `get_department_war_feed`
79. `get_department_war_standings`
80. `get_engagement_cycle_progress`
81. `get_engagement_factor_scores`
82. `get_engagement_factor_scores_impl`
83. `get_engagement_nps`
84. `get_engagement_nps_history`
85. `get_engagement_nps_history_impl`
86. `get_engagement_nps_impl`
87. `get_engagement_overview`
88. `get_engagement_overview_impl`
89. `get_engagement_pillar_benchmark`
90. `get_engagement_pillar_benchmark_impl`
91. `get_engagement_pillar_correlations`
92. `get_engagement_pillar_correlations_impl`
93. `get_engagement_pillar_scores`
94. `get_engagement_pillar_scores_impl`
95. `get_error_budget_30d`
96. `get_executive_metrics`
97. `get_incident_metrics`
98. `get_leaderboard_api`
99. `get_lucky_wheel_prizes_display`
100. `get_lucky_wheel_status`
101. `get_memory_leaderboard`
102. `get_monthly_trends`
103. `get_my_profile_private`
104. `get_nine_box_distribution`
105. `get_nr1_risk_matrix`
106. `get_nr1_risk_matrix_impl`
107. `get_nr1_summary`
108. `get_nr1_summary_impl`
109. `get_opinion_feed`
110. `get_or_create_bingo_card`
111. `get_passkeys_by_email`
112. `get_prediction_odds_history`
113. `get_prediction_oracle_aggregates`
114. `get_push_outbox_health`
115. `get_push_outbox_health_trend`
116. `get_quiz_category_stats`
117. `get_quiz_lifeline`
118. `get_quiz_play_set`
119. `get_reliability_slo`
120. `get_reliability_timeline`
121. `get_security_digest_history`
122. `get_security_stats`
123. `get_sequence_play_set`
124. `get_sequence_procedure_stats`
125. `get_tournament_bracket`
126. `get_user_department_id`
127. `get_user_stats_api`
128. `get_wager_leaderboard`
129. `get_webhook_delivery_hourly_24h`
130. `get_webhook_delivery_logs`
131. `get_webhook_delivery_stats_1h`
132. `get_webhook_delivery_stats_24h`
133. `get_webhook_executive_metrics_7d`
134. `grade_quiz_answer`
135. `grant_card_pack`
136. `grant_scratch_card`
137. `has_role`
138. `increment_announcement_views`
139. `increment_push_failures`
140. `ingest_war_event`
141. `is_country_allowed`
142. `is_department_manager`
143. `is_ip_blocked`
144. `is_ip_whitelisted`
145. `is_org_admin`
146. `is_org_member`
147. `join_tournament`
148. `list_external_api_keys`
149. `list_stuck_board_players`
150. `list_tournaments`
151. `list_wager_questions`
152. `log_auction_admin_event`
153. `log_geo_access`
154. `log_ip_access`
155. `log_login_attempt`
156. `log_runbook_step`
157. `open_card_pack`
158. `place_auction_bid`
159. `place_prediction_stake`
160. `process_external_task`
161. `promote_webhook_secret`
162. `propose_card_trade`
163. `publish_auction`
164. `quiz_fifty_fifty`
165. `raise_lucky_wheel_window_alerts`
166. `recalc_campaign_progress`
167. `recalc_campaign_progress_impl`
168. `recalc_campaign_teams`
169. `recalc_campaign_teams_impl`
170. `register_device`
171. `register_war_contribution`
172. `reject_password_reset`
173. `report_tournament_match`
174. `request_password_reset`
175. `requeue_push_outbox`
176. `reset_login_attempts`
177. `reset_push_failures`
178. `resolve_board_challenge`
179. `respond_card_trade`
180. `respond_to_opinion`
181. `reveal_scratch_card`
182. `revert_campaign_import`
183. `revert_campaign_team_split`
184. `review_purchase`
185. `revoke_device_by_fingerprint`
186. `revoke_push_device`
187. `rotate_external_api_secret`
188. `rotate_webhook_secret`
189. `run_boss_win_rate_alerts`
190. `save_board_trail`
191. `save_sequence_procedure`
192. `save_wager_question`
193. `set_external_api_key_active`
194. `set_opinion_status`
195. `settle_auction`
196. `settle_boss_battle`
197. `settle_department_war`
198. `settle_prediction_market`
199. `settle_tournament_rewards`
200. `snapshot_lucky_wheel_payout`
201. `snapshot_push_outbox_health`
202. `spin_lucky_wheel`
203. `start_lightning_round`
204. `start_memory_session`
205. `start_tournament`
206. `submit_daily_wager`
207. `submit_engagement_answer`
208. `submit_sequence_attempt`
209. `sync_bingo_card`
210. `sync_department_war_headcount`
211. `toggle_opinion_support`
212. `tournament_place_winner`
213. `tournament_propagate_byes`
214. `tournament_seed_order`
215. `transition_prediction_market`
216. `unblock_board_players`
217. `update_certification_statuses`
218. `user_has_passkeys`
219. `user_wants_email_notification`
220. `user_wants_in_app_notification`
221. `user_wants_push_notification`
222. `validate_api_key`
223. `validate_reset_token`
224. `verify_certificate`

---

## Refactors abandonados

### 1. `src/lib/exportReports.ts` (537 linhas) — substituído por `csvExport.ts` + 9 exportadores por domínio

Evidência:
- `grep -rn "exportReports" src/` ⇒ **zero resultados**. Nenhum import estático, nenhum `import()` dinâmico, nenhum re-export.
- Exporta uma API genérica completa: `exportToCSV` (`:72`), `exportToExcel` (`:122`), `exportToPDF` (`:181`), `exportReport` (`:407`), `createTeamPerformanceReport` (`:427`), `createEngagementReport` (`:486`).
- O que roda de verdade é `src/lib/csvExport.ts` (30 linhas, **13 consumidores de produção**, ex. `src/components/board/BoardChallengeReport.tsx:14`) mais 9 exportadores específicos por domínio: `boardStatsExport`, `boardStatsPdf`, `bossHistoryExport`, `bossDepartmentComparisonExport`, `bossReportPdf`, `goalBetHistoryCsv`, `nr1Export`, `sequenceProcedureStatsExport`, `wagerIntegrityExport`, `wagerScheduleExport`.

**Padrão clássico**: módulo genérico criado primeiro, abandonado, e a solução real virou "um exportador por tela". O genérico continua no bundle-source e no `tsc`.

### 2. `src/i18n/translations.ts` (944 linhas) — infraestrutura completa, adoção ~zero

Evidência:
- 3 locales completos (`:243` pt-BR, `:476` en-US, `:709` es-ES), ~230 chaves cada.
- Provider montado na árvore: `src/components/Providers.tsx:32-34` e `:45`.
- Seletor de idioma renderizado: `src/components/sidebar/SidebarFooter.tsx:26`.
- **Mas**: `grep -rl 'from "@/hooks/useI18n"' src` ⇒ apenas `src/components/Providers.tsx` e `src/test/i18n.test.ts`. **Nenhuma página/componente consome `useI18nContext`.** As ~159 ocorrências de `t(`/`{ t }` em `src/components` + `src/pages` são de outras bibliotecas/variáveis, não deste sistema.
- Resultado: trocar o idioma no seletor não traduz a aplicação.

### 3. `src/lib/validations.ts` (353 linhas, 24 schemas Zod) — centralização abandonada

Evidência:
- Docblock: *"Centralized Zod validation schemas for the entire application / All forms should use these schemas"* (`:1-4`).
- **Apenas 2 dos 24 schemas são importados** em todo o repo: `kudosMessageSchema` (`src/components/PeerRecognition.tsx:16`) e `aiCoachMessageSchema` (`src/components/AICoachDialog.tsx:17`).
- Em paralelo existe `src/lib/authValidations.ts` (schemas de auth, 2 consumidores) e `src/utils/validators.ts` — três lugares para a mesma responsabilidade.

### 4. Motores "espelho" de gatilhos automáticos que nunca foram ligados

`bossAutoHooks.ts` (219), `warAutoHooks.ts` (261), `cardPackTriggers.ts` (152) e `cardPackNotifications.ts` (84) são espelhos TypeScript de triggers SQL (`trg_boss_damage_*`, `trg_card_pack_*`) e existem **exclusivamente para simulação em teste** — nenhum caminho de runtime os alcança. Ou os triggers rodam só no banco (e o espelho é documentação executável, aceitável), ou foram construídos para um plano de execução no cliente que nunca aconteceu. Não é possível decidir qual apenas com o código do frontend: 🟦 quanto à intenção, ⬛ quanto ao runtime.

---

## Módulos órfãos

**9 módulos de `src/lib` (1.475 linhas, 6,7% da camada) sem nenhum consumidor de runtime.**

| Módulo | LOC | Situação | Prova |
|---|---|---|---|
| `exportReports.ts` | 537 | **zero referências no repo** | `grep -rn "exportReports" src/` ⇒ vazio |
| `warAutoHooks.ts` | 261 | só teste | `src/test/warAutoHooks.simulation.test.ts` |
| `bossAutoHooks.ts` | 219 | só teste | `src/test/bossAutoHooks.simulation.test.ts` |
| `cardPackTriggers.ts` | 152 | só teste + módulo morto | `src/test/cardPackTriggers.simulation.test.ts`; `src/lib/cardPackNotifications.ts:20` (também morto) |
| `campaignTeamSplitRevert.ts` | 136 | só teste | `src/test/campaignTeamSplitRevert.simulation.test.ts` |
| `bossAlerts.ts` | 123 | só teste | `src/test/bossAlerts.simulation.test.ts` |
| `auctionEngine.ts` | 103 | só teste | `src/test/auction.simulation.test.ts` |
| `cardPackNotifications.ts` | 84 | só teste | `src/test/cardPackNotifications.simulation.test.ts` |
| `pushOutbox.ts` | 83 | só teste | `src/test/pushOutbox.simulation.test.ts` (atenção: `src/components/security/PushOutboxHealthPanel.tsx:13` importa `pushOutboxHealth`, módulo diferente) |

**Falsos-negativos checados e descartados:** import dinâmico (`import("@/lib/...")`) — só `luckyWheelBudgetWhatIf.ts:176,:210` usa e é para o client Supabase, não para módulos de lib; re-export via `index.ts` — **não existe `src/lib/index.ts`** (`ls src/lib` confirma 106 arquivos, nenhum barrel); referência por string dinâmica — nenhuma ocorrência.

**Módulos sem teste dedicado** (risco diferente: rodam em produção sem rede de segurança): `authValidations`, `csvExport`, `edgeAvailability`, `errorMessages`, `trailAuthoring`, `utils`, `validations`, `bossExecutiveSummary` (259 linhas), `bossReportPdf` (117 linhas).

---

## Achados graves

### 🔴 1. TODAS as Edge Functions estão desligadas por allowlist vazia

- `src/lib/edgeAvailability.ts:46-51`:
  ```
  export function isFunctionDeployed(fnName: string): boolean {
    const allowlist = getDeployedAllowlist();
    // allowlist vazia = block all (nenhuma função foi deployada ainda).
    if (allowlist.size === 0) return false;
  ```
- `src/lib/requestId.ts:130-144`: `invokeEdgeSafe` chama `isFunctionDeployed(fnName)` e, se falso, **retorna um erro 404 sintético (`"Edge function 'X' nao encontrada (allowlist)"`, `attempts: 0`) sem tocar a rede**.
- **`.env:25` contém `VITE_DEPLOYED_EDGE_FUNCTIONS=` (valor vazio).** O `.env.example:25-26` documenta o formato (`verify-ip,verify-geo,ai-coach,admin-alerts`) mas a linha real está em branco.
- Consequência medida: **17 arquivos** usam `invokeEdgeSafe`; `src/lib/requestId.ts` tem 16 consumidores de produção. Todas essas chamadas falham em silêncio com um 404 fabricado. Nada em `src/` usa `supabase.functions.invoke` direto (0 ocorrências fora de `requestId.ts:88`), ou seja **não há caminho alternativo** — a camada de Edge Functions do produto está 100% inerte com o `.env` atual.
- Agrava: `src/lib/purchaseRisk.ts` (298 linhas, governança de resgate) é o espelho da Edge Function `reward-approval-review`, que está entre as bloqueadas.

### 🔴 2. `src/lib/exportReports.ts` — 537 linhas de código morto absoluto

Zero referências no repositório inteiro. Maior bloco de código morto contíguo do escopo. Ver "Refactors abandonados #1".

### 🟠 3. Verificação de senha vazada falha em aberto (fail-open)

`src/lib/authValidations.ts:94` chama `https://api.pwnedpasswords.com/range/${prefix}` (único fetch externo de todo `src/lib`). Nas linhas `:100-102` (`if (!response.ok)`) e `:116-118` (`catch`) o retorno é `{ isLeaked: false, occurrences: 0 }` — indistinguível de "senha limpa". Se a API estiver fora, bloqueada por CSP/rede corporativa ou com rate-limit, **toda senha vazada é aceita silenciosamente** e a UI (`src/components/PasswordStrengthIndicator.tsx:3`) mostra aprovação. Não há telemetria do erro.

### 🟠 4. `lucky_wheel_settings` tem duas fontes de verdade

`src/lib/luckyWheelBudget.ts` grava o teto de moedas por giro **no banco** (`:54`, `:101` em `lucky_wheel_settings`, auditoria em `:79`) **e** em `localStorage` (`STORAGE_KEY = "lucky_wheel_coins_per_spin_budget"`, `:14`). O docblock chama isso de "persistência local tolerante a falhas" (`:5-6`), mas o efeito prático é que um admin com `localStorage` desatualizado enxerga e simula com um teto diferente do que está no banco — e `luckyWheelBudgetWhatIf.ts` / `luckyWheelComparisonAlerts.ts` derivam alertas econômicos desse valor.

### 🟠 5. 50+ motores "espelho" de SQL sem verificação automática de paridade

Medição: `src/lib` é 99% puro (só 3 arquivos fazem I/O de tabela; **zero `.rpc()`**). A maior parte dos 21,9k linhas são reimplementações determinísticas de RPCs `SECURITY DEFINER` e triggers — os próprios docblocks dizem "Qualquer mudança na função SQL DEVE ser refletida aqui (e vice-versa)" (`campaignTeamSplit.ts:416`, `campaignTeamSplitRevert.ts:430`) e "qualquer divergência aqui indica risco de fraude ou vazamento de moedas" (`auctionEngine.ts:20`, `predictionMarket.ts:1149`).
**Não existe nenhum mecanismo que compare os dois lados.** Os testes exercitam o espelho TypeScript contra ele mesmo. Módulos que espelham regra **monetária** e estão nessa condição: `predictionMarket`, `auctionEngine` (⬛ morto), `campaignTeamSplit`, `campaignTeamSplitRevert` (⬛ morto), `bossBattle`, `cardSetRewards`, `tradingCards`, `luckyWheelOdds`, `dailyWager`, `departmentWarConfig`, `memoryGame`, `sequenceGame`, `lightningQuizScoring`, `boardTrail`, `boardChallenge`. Esta é a maior superfície de risco silencioso do escopo — e é exatamente o que a comparação com o banco vivo (233 tabelas / 224 funções abaixo) deve cruzar.

### Menções secundárias

- **Inversão de camada**: 13 arquivos de `src/lib` importam de `@/services/*` (`goalBet*` ×8, `climateBenchmark:507`, `nr1Export`, `wagerIntegrityExport`, `wagerMonthlyExposure`, `wagerScheduleExport`). `lib` deveria ser a camada mais baixa.
- **i18n inerte**: 944 linhas, 3 locales, provider montado, seletor renderizado, **zero componentes consumindo**.
- **`validations.ts`**: 24 schemas, 2 usados.
- **`client.ts:5-6`** não valida `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`; ausência produz falha opaca em runtime.
- **`Math.random()`**: exatamente 2 ocorrências em todo `src/lib` — `requestId.ts:72` (fallback de UUID quando `crypto.randomUUID` não existe) e `requestId.ts:105` (jitter de backoff). Ambas legítimas. **Nenhum `TODO`, `FIXME`, `HACK`, `@deprecated`, mock ou stub em todo `src/lib`** (`grep -rnE "Math\.random\(\)|TODO|FIXME|HACK|XXX:|@deprecated|mock|stub|placeholder|not implemented|coming soon"` ⇒ 4 hits, 2 deles a palavra "TODOS" em texto português).
