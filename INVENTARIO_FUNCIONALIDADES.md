# 📋 INVENTÁRIO COMPLETO DE FUNCIONALIDADES E FERRAMENTAS
## Sistema TaskGifts - Plataforma de Gamificação Corporativa

---

## 🏗️ ARQUITETURA E STACK TECNOLÓGICO

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **React** | ^18.3.1 | Framework principal |
| **TypeScript** | - | Tipagem estática |
| **Vite** | - | Build tool e dev server |
| **Tailwind CSS** | - | Estilização utility-first |
| **React Router DOM** | ^6.30.1 | Roteamento SPA |
| **TanStack React Query** | ^5.83.0 | Gerenciamento de estado servidor/cache |
| **Framer Motion** | ^11.18.2 | Animações e transições |
| **Radix UI** | Múltiplos | Componentes primitivos acessíveis |
| **Shadcn/UI** | - | Sistema de componentes |
| **Lucide React** | ^0.462.0 | Ícones |
| **Recharts** | ^2.15.4 | Gráficos e visualizações |
| **date-fns** | ^3.6.0 | Manipulação de datas |
| **Zod** | ^3.25.76 | Validação de schemas |
| **React Hook Form** | ^7.61.1 | Gerenciamento de formulários |
| **Sonner** | ^1.7.4 | Sistema de toasts |
| **canvas-confetti** | ^1.9.4 | Efeitos de confete |
| **cmdk** | ^1.1.1 | Command palette |
| **next-themes** | ^0.3.0 | Gerenciamento de tema dark/light |

### Backend (Lovable Cloud / Supabase)
| Tecnologia | Uso |
|------------|-----|
| **Supabase** | BaaS (Backend as a Service) |
| **PostgreSQL** | Banco de dados relacional |
| **Supabase Auth** | Autenticação |
| **Supabase Realtime** | Comunicação em tempo real |
| **Supabase Edge Functions** | Funções serverless (Deno) |
| **Row Level Security (RLS)** | Segurança a nível de linha |

### PWA (Progressive Web App)
| Tecnologia | Uso |
|------------|-----|
| **vite-plugin-pwa** | ^1.2.0 | Plugin PWA para Vite |
| **Service Workers** | Offline support |
| **Web Push Notifications** | Notificações push |

### Testes
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Vitest** | ^4.0.16 | Framework de testes |
| **Testing Library** | ^16.3.1 | Testes de componentes React |
| **jsdom** | ^27.3.0 | Ambiente DOM para testes |

---

## 🔐 SEGURANÇA E AUTENTICAÇÃO

### 1. Sistema de Autenticação
| Funcionalidade | Arquivo Principal | Ferramentas |
|----------------|-------------------|-------------|
| Login/Signup | `src/pages/Auth.tsx` | Supabase Auth, React Hook Form, Zod |
| Contexto de Auth | `src/hooks/useAuth.tsx` | React Context, Supabase |
| Rota Protegida | `src/components/ProtectedRoute.tsx` | React Router DOM |
| Indicador de Força de Senha | `src/components/PasswordStrengthIndicator.tsx` | Algoritmo customizado |

### 2. Autenticação de Dois Fatores (2FA)
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Setup 2FA | `src/components/auth/TwoFactorSetup.tsx` | otpauth, QRCode |
| Verificação 2FA | `src/components/auth/TwoFactorVerify.tsx` | TOTP, input-otp |
| Serviço 2FA | `src/services/twoFactorService.ts` | otpauth ^9.4.1 |
| Hook 2FA | `src/hooks/useTwoFactor.ts` | React Query |
| Códigos de Backup | Gerados automaticamente | crypto/random |

### 3. Controle de Acesso (RBAC)
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Hook RBAC | `src/hooks/useRBAC.ts` | React Query, Supabase |
| Componente AccessControl | `src/components/rbac/AccessControl.tsx` | React |
| ProtectedRoute RBAC | `src/components/rbac/ProtectedRoute.tsx` | React Router |
| Dashboard RBAC | `src/components/rbac/RBACDashboard.tsx` | Recharts |
| Provider RBAC | `src/components/rbac/RBACProvider.tsx` | React Context |
| Serviço RBAC | `src/services/rbacService.ts` | Supabase |
| Roles | admin, manager, employee | DB Tables |
| Permissões Granulares | Por módulo/ação | DB Tables |

### 4. Whitelist de IP
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Edge Function | `supabase/functions/verify-ip/index.ts` | Deno, Supabase |
| Guard Component | `src/components/IpAccessGuard.tsx` | React |
| Hook | `src/hooks/useIpWhitelist.ts` | React Query |
| Serviço | `src/services/ipWhitelistService.ts` | Supabase |
| Manager Admin | `src/components/admin/IpWhitelistManager.tsx` | Shadcn UI |
| Logs de Acesso | `ip_access_logs` table | PostgreSQL |

### 5. Reset de Senha com Aprovação
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Serviço | `src/services/passwordResetService.ts` | Supabase |
| Hook | `src/hooks/usePasswordResetRequests.ts` | React Query |
| Realtime Hook | `src/hooks/usePasswordResetRealtime.ts` | Supabase Realtime |
| Painel Admin | `src/components/admin/PasswordResetApprovalPanel.tsx` | Shadcn UI |
| Funções DB | `request_password_reset`, `approve_password_reset` | PL/pgSQL |

### 6. Auditoria
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Logs de Auditoria | `src/pages/AuditLogs.tsx` | React, Recharts |
| Serviço | `src/services/auditService.ts` | Supabase |
| Hook | `src/hooks/useAudit.ts` | React Query |

---

## 🎮 GAMIFICAÇÃO

### 1. Sistema de XP e Níveis
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Perfil de Usuário | `src/services/profilesService.ts` | Supabase |
| Hook de Perfis | `src/hooks/useProfiles.ts` | React Query |
| Indicador de XP | `src/components/effects/AnimatedXPParticles.tsx` | Framer Motion |
| Indicador de Nível | `src/components/effects/AnimatedLevelIndicator.tsx` | Framer Motion |

### 2. Sistema de Moedas (Coins)
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Loja Virtual | `src/pages/Shop.tsx` | React |
| Admin da Loja | `src/pages/ShopAdmin.tsx` | React |
| Serviço | `src/services/shopService.ts` | Supabase |
| Hook | `src/hooks/useShop.ts` | React Query |
| Indicador Animado | `src/components/effects/AnimatedCoinsIndicator.tsx` | Framer Motion |

### 3. Sistema de Conquistas (Achievements)
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/Achievements.tsx` | React |
| Sistema | `src/components/AchievementSystem.tsx` | React |
| Serviço | `src/services/achievementsService.ts` | Supabase |
| Hook | `src/hooks/useAchievements.ts` | React Query |
| Contexto de Notificação | `src/contexts/AchievementNotificationContext.tsx` | React Context |

### 4. Sistema de Streaks
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Indicador Animado | `src/components/effects/AnimatedFireIndicator.tsx` | Framer Motion |
| Lógica | Integrado em `profiles` table | PostgreSQL |

### 5. Sistema de Combos
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Indicador | `src/components/ComboIndicator.tsx` | React |
| Histórico | `src/components/ComboHistory.tsx` | React |
| Serviço | `src/services/comboService.ts` | Supabase |
| Hook | `src/hooks/useCombo.ts` | React Query |
| Explosão Visual | `src/components/effects/ComboExplosion.tsx` | Framer Motion |

### 6. Leaderboard e Rankings
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Leaderboard Live | `src/components/LiveLeaderboard.tsx` | Supabase Realtime |
| Rankings por Departamento | `src/components/DepartmentRankings.tsx` | React |
| Badge de Ranking | `src/components/RankingBadge.tsx` | React |
| Hook de Leaderboard | `src/hooks/useLeaderboard.ts` | React Query |
| Listener de Mudanças | `src/hooks/useListenToRankChanges.ts` | Supabase Realtime |

### 7. Sistema de Ligas
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/Leagues.tsx` | React |
| Card de Liga | `src/components/LeagueCard.tsx` | React |
| Admin | `src/components/admin/LeaguesManager.tsx` | React |
| Serviço | `src/services/leaguesService.ts` | Supabase |
| Hook | `src/hooks/useLeagues.ts` | React Query |
| Edge Function | `supabase/functions/weekly-league-processing/index.ts` | Deno |

### 8. Sistema de Quests/Missões
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Quests Diárias | `src/components/DailyQuests.tsx` | React |
| Missões de Departamento | `src/components/DepartmentMissions.tsx` | React |
| Desafio Semanal | `src/components/WeeklyChallengeCard.tsx` | React |
| Builder de Quests | `src/pages/QuestBuilder.tsx` | React |
| Serviço de Quests | `src/services/questsService.ts` | Supabase |
| Serviço de Missões | `src/services/missionsService.ts` | Supabase |
| Hook de Quests | `src/hooks/useQuests.ts` | React Query |
| Hook de Missões | `src/hooks/useMissions.ts` | React Query |
| Hook Desafio Semanal | `src/hooks/useWeeklyChallenge.ts` | React Query |

### 9. Desafios Automáticos
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Widget | `src/components/AutoChallengesWidget.tsx` | React |
| Serviço | `src/services/autoChallengesService.ts` | Supabase |
| Hook | `src/hooks/useAutoChallenges.ts` | React Query |

### 10. Badges Comportamentais
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Widget | `src/components/BehavioralBadgesWidget.tsx` | React |
| Serviço | `src/services/behavioralBadgesService.ts` | Supabase |
| Hook | `src/hooks/useBehavioralBadges.ts` | React Query |

### 11. Sistema de Duelos
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/Duels.tsx` | React |
| Serviço | `src/services/duelsService.ts` | Supabase |
| Hook | `src/hooks/useDuels.ts` | React Query |

### 12. Sistema de Kudos (Reconhecimento)
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Reconhecimento | `src/components/PeerRecognition.tsx` | React |
| Ranking | `src/components/KudosRanking.tsx` | React |
| Serviço | `src/services/kudosService.ts` | Supabase |
| Hook | `src/hooks/useKudos.ts` | React Query |

### 13. Avatar Customizável
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Customizador | `src/components/AvatarCustomizer.tsx` | React |
| Preview | `src/components/AvatarPreview.tsx` | React |
| Seção Perfil | `src/components/ProfileAvatarSection.tsx` | React |
| Serviço | `src/services/avatarService.ts` | Supabase |
| Hook | `src/hooks/useAvatar.ts` | React Query |

### 14. Eventos Sazonais
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Banner | `src/components/SeasonalEventBanner.tsx` | React |
| Página de Detalhe | `src/pages/SeasonalEventDetail.tsx` | React |
| Serviço | `src/services/seasonalEventsService.ts` | Supabase |
| Hook | `src/hooks/useSeasonalEvents.ts` | React Query |

### 15. Temas de Gamificação (Admin)
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Manager | `src/components/admin/GamificationManager.tsx` | React |
| Serviço | `src/services/gamificationAdminService.ts` | Supabase |
| Hook | `src/hooks/useGamificationAdmin.ts` | React Query |

---

## 📚 APRENDIZADO E DESENVOLVIMENTO

### 1. Trilhas de Aprendizado (LMS)
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página Principal | `src/pages/LearningTrails.tsx` | React |
| Detalhe da Trilha | `src/pages/TrailDetail.tsx` | React |
| Visualizador de Módulos | `src/components/lms/ModuleViewer.tsx` | React |
| Árvore de Dependências | `src/components/TrailDependencyTree.tsx` | React |
| Recomendações | `src/components/TrailRecommendations.tsx` | React |
| Serviço | `src/services/trailsService.ts` | Supabase |
| Hook | `src/hooks/useTrails.ts` | React Query |
| Edge Function (Recomendações) | `supabase/functions/trail-recommendations/index.ts` | Deno, AI |

### 2. Quiz Diário
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/DailyQuiz.tsx` | React |
| Admin | `src/pages/QuizAdmin.tsx` | React |
| Quiz Milionário | `src/components/quiz/MillionaireQuiz.tsx` | React |
| Magic Card Quiz | `src/components/quiz/MagicCardQuiz.tsx` | React |
| Gerador de Perguntas IA | `src/components/quiz/AIQuestionGenerator.tsx` | React |
| Ranking Diário | `src/components/quiz/QuizDailyRanking.tsx` | React |
| Estatísticas | `src/components/quiz/QuizCategoryStats.tsx` | React |
| Serviço | `src/services/quizService.ts` | Supabase |
| Serviço de Perguntas | `src/services/quizQuestionsService.ts` | Supabase |
| Serviço de Stats | `src/services/quizStatsService.ts` | Supabase |
| Hook Scores | `src/hooks/useQuizScores.ts` | React Query |
| Hook Perguntas | `src/hooks/useQuizQuestions.ts` | React Query |
| Hook Stats | `src/hooks/useQuizStats.ts` | React Query |
| Edge Function | `supabase/functions/generate-quiz-questions/index.ts` | Deno, AI |

### 3. Certificações
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Painel | `src/components/CertificationsPanel.tsx` | React |
| Painel de Equipe | `src/components/TeamCertificationsPanel.tsx` | React |
| Serviço | `src/services/certificationsService.ts` | Supabase |
| Hook | `src/hooks/useCertifications.ts` | React Query |

### 4. Mentoria
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/Mentorship.tsx` | React |
| Serviço | `src/services/mentorshipService.ts` | Supabase |
| Hook | `src/hooks/useMentorship.ts` | React Query |

---

## 👥 GESTÃO DE PESSOAS

### 1. PDI (Plano de Desenvolvimento Individual)
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Dashboard Completo | `src/components/pdi/PDIFullDashboard.tsx` | React |
| Painel Avançado | `src/components/pdi/PDIEnhancedPanel.tsx` | React |
| Widget Pessoal | `src/components/MyDevelopmentPlanWidget.tsx` | React |
| Admin | `src/components/admin/DevelopmentPlanManager.tsx` | React |
| Serviço | `src/services/pdiService.ts` | Supabase |
| Gerador IA | `src/services/pdiGeneratorService.ts` | Supabase, AI |
| Hook | `src/hooks/usePDI.ts` | React Query |
| Alertas Hook | `src/hooks/usePDIAlerts.ts` | React Query |

### 2. Nine Box
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Matriz Admin | `src/components/admin/NineBoxMatrix.tsx` | React |
| Widget Pessoal | `src/components/MyNineBoxWidget.tsx` | React |
| Serviço | `src/services/nineBoxService.ts` | Supabase |
| Hook | `src/hooks/useNineBox.ts` | React Query |
| Função DB | `get_nine_box_distribution` | PL/pgSQL |

### 3. Feedback 360
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/Feedback.tsx` | React |
| Dashboard | `src/components/feedback/Feedback360Dashboard.tsx` | React |
| Painel | `src/components/feedback/FeedbackPanel.tsx` | React |
| Ciclos Admin | `src/components/admin/FeedbackCycleManager.tsx` | React |
| Serviço | `src/services/feedback360Service.ts` | Supabase |
| Hook | `src/hooks/useFeedback360.ts` | React Query |

### 4. Competências
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Radar | `src/components/CompetencyRadar.tsx` | Recharts |
| Dashboard de Equipe | `src/components/manager/TeamCompetencyDashboard.tsx` | React |
| Painel de Matriz | `src/components/competency/CompetencyMatrixPanel.tsx` | React |
| Alertas | `src/components/CompetencyAlertsPanel.tsx` | React |
| Serviço | `src/services/competencyService.ts` | Supabase |
| Serviço de Matriz | `src/services/competencyMatrixService.ts` | Supabase |
| Hook | `src/hooks/useCompetencies.ts` | React Query |
| Hook de Matriz | `src/hooks/useCompetencyMatrix.ts` | React Query |
| Hook de Alertas | `src/hooks/useCompetencyAlerts.ts` | React Query |
| Edge Function | `supabase/functions/competency-alerts/index.ts` | Deno |

### 5. Sucessão
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Painel | `src/components/manager/SuccessionPanel.tsx` | React |
| Serviço | `src/services/successionService.ts` | Supabase |
| Hook | `src/hooks/useSuccession.ts` | React Query |

### 6. High Potentials
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Painel | `src/components/manager/HighPotentialsPanel.tsx` | React |
| Serviço | `src/services/highPotentialService.ts` | Supabase |
| Hook | `src/hooks/useHighPotentials.ts` | React Query |

### 7. Churn Prediction
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Painel | `src/components/ChurnPredictionPanel.tsx` | React |
| Serviço | `src/services/churnPredictionService.ts` | Supabase |
| Hook | `src/hooks/useChurnPrediction.ts` | React Query |
| Edge Function | `supabase/functions/churn-prediction/index.ts` | Deno, AI |

### 8. Check-ins / 1:1
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/Checkins.tsx` | React |
| Painel 1:1 | `src/components/oneone/OneOnOnePanel.tsx` | React |
| Preparação IA | `src/components/checkins/OneOnOnePreparationPanel.tsx` | React |
| Serviço | `src/services/checkinsService.ts` | Supabase |
| Serviço de Preparação | `src/services/oneOnOnePreparationService.ts` | Supabase |
| Hook | `src/hooks/useCheckins.ts` | React Query |
| Hook de Preparação | `src/hooks/useOneOnOnePreparation.ts` | React Query |
| Edge Function (Lembretes) | `supabase/functions/checkin-reminders/index.ts` | Deno |

### 9. Metas (Goals) e OKRs
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/Goals.tsx` | React |
| Widget | `src/components/GoalsWidget.tsx` | React |
| Admin | `src/components/admin/GoalsManager.tsx` | React |
| Dashboard OKR | `src/components/okr/OKRDashboard.tsx` | React |
| Serviço Goals | `src/services/goalsService.ts` | Supabase |
| Serviço OKR | `src/services/okrService.ts` | Supabase |
| Hook Goals | `src/hooks/useGoals.ts` | React Query |
| Hook OKRs | `src/hooks/useOKRs.ts` | React Query |

### 10. Ponto/Presença
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/Attendance.tsx` | React |
| Módulo | `src/components/AttendanceModule.tsx` | React |
| Calendário | `src/components/AttendanceCalendar.tsx` | React |
| Serviço | `src/services/attendanceService.ts` | Supabase |
| Hook | `src/hooks/useAttendance.ts` | React Query |

---

## 📊 CLIMA E ENGAJAMENTO

### 1. Pesquisas de Clima
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/Surveys.tsx` | React |
| Dashboard de Pilares | `src/components/climate/ClimatePillarsDashboard.tsx` | React, Recharts |
| Benchmark | `src/components/climate/BenchmarkComparison.tsx` | React |
| Planos de Ação | `src/components/climate/ActionPlanManager.tsx` | React |
| Opiniões | `src/components/climate/OpinionsPanel.tsx` | React |
| Serviço | `src/services/climateSurveyService.ts` | Supabase |
| Serviço de Benchmark | `src/services/benchmarkService.ts` | Supabase |
| Serviço de Planos | `src/services/actionPlanService.ts` | Supabase |
| Serviço de Opiniões | `src/services/opinionsService.ts` | Supabase |
| Hook | `src/hooks/useClimateSurveys.ts` | React Query |
| Hook de Benchmark | `src/hooks/useBenchmark.ts` | React Query |
| Hook de Planos | `src/hooks/useActionPlans.ts` | React Query |
| Hook de Opiniões | `src/hooks/useOpinions.ts` | React Query |
| Edge Function (Lembretes) | `supabase/functions/survey-reminders/index.ts` | Deno |

### 2. eNPS
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Widget | `src/components/ENPSSurveyWidget.tsx` | React |
| Dashboard Admin | `src/components/admin/ENPSDashboard.tsx` | React |
| Gráfico de Tendência | `src/components/admin/ENPSTrendChart.tsx` | Recharts |
| Serviço | `src/services/enpsService.ts` | Supabase |
| Hook | `src/hooks/useENPS.ts` | React Query |
| Função DB | `calculate_enps_score` | PL/pgSQL |

### 3. Pulse Surveys
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Widget | `src/components/PulseSurveyWidget.tsx` | React |
| Serviço | `src/services/pulseSurveysService.ts` | Supabase |
| Hook | `src/hooks/usePulseSurveys.ts` | React Query |

### 4. Mood Tracker
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Widget | `src/components/MoodTrackerWidget.tsx` | React |
| Analytics Admin | `src/components/admin/MoodAnalytics.tsx` | React, Recharts |
| Serviço | `src/services/moodTrackerService.ts` | Supabase |
| Hook | `src/hooks/useMoodTracker.ts` | React Query |

### 5. Celebrações
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Banner | `src/components/CelebrationsBanner.tsx` | React |
| Efeito | `src/components/CelebrationEffect.tsx` | Framer Motion |
| Admin | `src/components/admin/CelebrationManager.tsx` | React |
| Serviço | `src/services/celebrationsService.ts` | Supabase |
| Hook | `src/hooks/useCelebrations.ts` | React Query |
| Edge Function | `supabase/functions/birthday-celebrations/index.ts` | Deno |

---

## 📈 ANALYTICS E RELATÓRIOS

### 1. Dashboard Executivo
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/ExecutiveDashboard.tsx` | React |
| Serviço | `src/services/executiveService.ts` | Supabase |
| Hook | `src/hooks/useExecutiveMetrics.ts` | React Query |
| Função DB | `get_executive_metrics` | PL/pgSQL |

### 2. Dashboard de Manager
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/ManagerDashboard.tsx` | React |
| Consolidado | `src/components/manager/ManagerConsolidatedDashboard.tsx` | React |
| IA Copilot | `src/components/manager/AICopilotDashboard.tsx` | React |
| Lista de Quests | `src/components/manager/QuestsList.tsx` | React |

### 3. BI Dashboard
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/BIDashboard.tsx` | React, Recharts |

### 4. Analytics em Tempo Real
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/RealTimeAnalytics.tsx` | React |
| Widget | `src/components/AnalyticsWidget.tsx` | React |
| Dashboard | `src/components/analytics/AnalyticsDashboard.tsx` | React, Recharts |
| Serviço | `src/services/analyticsService.ts` | Supabase |
| Hook | `src/hooks/useAnalytics.ts` | React Query |

### 5. Relatórios de Engajamento
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/EngagementReports.tsx` | React |
| Builder | `src/components/reports/ReportBuilder.tsx` | React |
| Biblioteca | `src/components/reports/ReportLibrary.tsx` | React |
| Exportação | `src/components/reports/ExportReportDialog.tsx` | React |
| Avançado | `src/components/reports/AdvancedReportsPanel.tsx` | React |
| Serviço | `src/services/reportsService.ts` | Supabase |
| Serviço de Engajamento | `src/services/engagementReportsService.ts` | Supabase |
| Hook | `src/hooks/useReports.ts` | React Query |
| Hook de Engajamento | `src/hooks/useEngagementReports.ts` | React Query |
| Função DB | `generate_engagement_snapshot` | PL/pgSQL |

### 6. KPIs
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Dashboard | `src/components/kpi/KPIDashboard.tsx` | React, Recharts |
| Serviço | `src/services/kpiService.ts` | Supabase |
| Hook | `src/hooks/useKPIs.ts` | React Query |

### 7. Heatmap de Atividade
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Componente | `src/components/ActivityHeatmap.tsx` | React |

### 8. Comparativo Semanal
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Componente | `src/components/WeeklyPerformanceComparison.tsx` | React, Recharts |

---

## 🔗 INTEGRAÇÕES

### 1. Bitrix24 CRM
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/Bitrix24CRM.tsx` | React |
| Manager Admin | `src/components/admin/Bitrix24Integration.tsx` | React |
| Serviço | `src/services/bitrix24Service.ts` | Supabase |
| Serviço de Sync | `src/services/bitrix24SyncService.ts` | Supabase |
| Hook | `src/hooks/useBitrix24.ts` | React Query |
| Edge Function API | `supabase/functions/bitrix24-api/index.ts` | Deno |
| Edge Function OAuth | `supabase/functions/bitrix24-oauth/index.ts` | Deno |
| Edge Function Webhook | `supabase/functions/bitrix24-webhook/index.ts` | Deno |

### 2. API Externa
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Manager Admin | `src/components/admin/ApiIntegrationManager.tsx` | React |
| Painel de Integrações | `src/components/integrations/IntegrationsPanel.tsx` | React |
| Serviço | `src/services/externalApiService.ts` | Supabase |
| Hook | `src/hooks/useExternalApi.ts` | React Query |
| Edge Function | `supabase/functions/external-api/index.ts` | Deno |
| Edge Function Webhook | `supabase/functions/external-webhook/index.ts` | Deno |
| Dispatcher | `supabase/functions/webhook-dispatcher/index.ts` | Deno |
| Funções DB | `validate_api_key`, `get_user_stats_api`, `get_leaderboard_api` | PL/pgSQL |

---

## 📢 COMUNICAÇÃO

### 1. Feed Social
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/SocialFeed.tsx` | React |
| Componente | `src/components/SocialFeed.tsx` | React |
| Comentários | `src/components/ActivityComments.tsx` | React |
| Reações | `src/components/ActivityReactions.tsx` | React |
| Serviço | `src/services/socialFeedService.ts` | Supabase |
| Hook | `src/hooks/useSocialFeed.ts` | React Query |
| Hook de Comentários | `src/hooks/useActivityComments.ts` | React Query |
| Hook de Reações | `src/hooks/useActivityReactions.ts` | React Query |

### 2. Comunicados/Announcements
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/Announcements.tsx` | React |
| Board | `src/components/AnnouncementsBoard.tsx` | React |
| Publisher Admin | `src/components/admin/AnnouncementPublisher.tsx` | React |
| Serviço | `src/services/announcementsService.ts` | Supabase |
| Hook | `src/hooks/useAnnouncements.ts` | React Query |

### 3. Notificações
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Centro | `src/components/NotificationCenter.tsx` | React |
| Manager Admin | `src/components/notifications/NotificationsManager.tsx` | React |
| Templates Admin | Templates configuráveis | Supabase |
| Configurações | `src/components/settings/NotificationSettingsPanel.tsx` | React |
| Serviço | `src/services/notificationsService.ts` | Supabase |
| Serviço de Templates | `src/services/notificationTemplatesService.ts` | Supabase |
| Hook | `src/hooks/useNotifications.ts` | React Query |
| Hook de Templates | `src/hooks/useNotificationTemplates.ts` | React Query |
| Edge Function | `supabase/functions/send-email-notifications/index.ts` | Deno |

### 4. Push Notifications
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Toggle | `src/components/PushNotificationToggle.tsx` | React |
| Serviço | `src/services/pushNotificationService.ts` | Web Push API |
| Hook | `src/hooks/usePushNotifications.ts` | React Query |

---

## 🤖 INTELIGÊNCIA ARTIFICIAL

### 1. AI Coach
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Dialog | `src/components/AICoachDialog.tsx` | React |
| Serviço | `src/services/aiCoachService.ts` | Supabase |
| Hook | `src/hooks/useAICoach.ts` | React Query |
| Edge Function | `supabase/functions/ai-coach/index.ts` | Deno, Lovable AI |

### 2. Recomendações de Trilhas
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Componente | `src/components/TrailRecommendations.tsx` | React |
| Edge Function | `supabase/functions/trail-recommendations/index.ts` | Deno, AI |

### 3. Geração de Perguntas Quiz
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Componente | `src/components/quiz/AIQuestionGenerator.tsx` | React |
| Edge Function | `supabase/functions/generate-quiz-questions/index.ts` | Deno, AI |

### 4. Predição de Churn
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Painel | `src/components/ChurnPredictionPanel.tsx` | React |
| Edge Function | `supabase/functions/churn-prediction/index.ts` | Deno, AI |

### 5. Alertas de Competência
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Painel | `src/components/CompetencyAlertsPanel.tsx` | React |
| Edge Function | `supabase/functions/competency-alerts/index.ts` | Deno |

### 6. Preparação 1:1 com IA
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Painel | `src/components/checkins/OneOnOnePreparationPanel.tsx` | React |
| Serviço | `src/services/oneOnOnePreparationService.ts` | Supabase |

---

## ⚙️ ADMINISTRAÇÃO

### 1. Painel Admin Principal
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Página | `src/pages/AdminPanel.tsx` | React |

### 2. Gestão de Usuários
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Manager | `src/components/admin/UsersManager.tsx` | React |
| Hook | `src/hooks/useAdminUsers.ts` | React Query |

### 3. Gestão de Departamentos
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Manager | `src/components/admin/DepartmentsManager.tsx` | React |
| Serviço | `src/services/departmentsService.ts` | Supabase |
| Hook | `src/hooks/useDepartments.ts` | React Query |

### 4. Gestão de Cargos
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Manager | `src/components/admin/PositionsManager.tsx` | React |
| Serviço | `src/services/positionsService.ts` | Supabase |
| Hook | `src/hooks/usePositions.ts` | React Query |

### 5. Gestão de Permissões
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Manager | `src/components/admin/PermissionsManager.tsx` | React |
| Painel | `src/components/permissions/PermissionsPanel.tsx` | React |
| Serviço | `src/services/permissionsService.ts` | Supabase |
| Hook | `src/hooks/usePermissions.ts` | React Query |

### 6. Dados Demográficos
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Manager | `src/components/admin/DemographicsManager.tsx` | React |
| Painel | `src/components/demographics/DemographicsPanel.tsx` | React |
| Serviço | `src/services/demographicsService.ts` | Supabase |
| Hook | `src/hooks/useDemographics.ts` | React Query |

### 7. Grupos de Pessoas
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Painel | `src/components/people/PeopleGroupsPanel.tsx` | React |
| Serviço | `src/services/peopleService.ts` | Supabase |
| Hook | `src/hooks/usePeopleGroups.ts` | React Query |

### 8. Regras de Penalidade
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Manager | `src/components/admin/PenaltyRulesManager.tsx` | React |
| Função DB | `apply_task_penalty` | PL/pgSQL |

### 9. Criador de Surveys
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Componente | `src/components/admin/SurveyCreator.tsx` | React |

### 10. Alertas Admin
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Painel | `src/components/admin/AdminAlertsPanel.tsx` | React |
| Histórico de Mudanças | `src/components/admin/AdminChangeHistory.tsx` | React |
| Métricas | `src/components/admin/AdminMetricsDashboard.tsx` | React |
| Hook | `src/hooks/useAdminAlerts.ts` | React Query |
| Edge Function | `supabase/functions/admin-alerts/index.ts` | Deno |

### 11. Alertas PDI
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Painel | `src/components/admin/PDIAlertsPanel.tsx` | React |
| Hook | `src/hooks/usePDIAlerts.ts` | React Query |

### 12. Configurações Globais
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Painel | `src/components/settings/GlobalSettingsPanel.tsx` | React |

---

## 📱 MOBILE E PWA

### 1. Componentes Mobile
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Bottom Navigation | `src/components/mobile/MobileBottomNav.tsx` | React |
| Header com Hide | `src/components/mobile/MobileHidingHeader.tsx` | React |
| Layout de Página | `src/components/mobile/MobilePageLayout.tsx` | React |
| Pull to Refresh | `src/components/mobile/PullToRefresh.tsx` | React |
| Skeleton Loading | `src/components/mobile/MobileSkeleton.tsx` | React |
| Input Otimizado | `src/components/mobile/MobileInput.tsx` | React |
| Lista com Swipe | `src/components/mobile/SwipeableListItem.tsx` | React |
| Página com Swipe | `src/components/mobile/SwipeablePage.tsx` | React |
| Scroll to Top | `src/components/mobile/ScrollToTopFAB.tsx` | React |
| Status de Rede | `src/components/mobile/NetworkStatusBar.tsx` | React |
| Imagem Lazy | `src/components/mobile/LazyImage.tsx` | React |
| Haptic Wrapper | `src/components/mobile/HapticWrapper.tsx` | React |

### 2. Hooks Mobile
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Is Mobile | `src/hooks/use-mobile.tsx` | React |
| Haptic Feedback | `src/hooks/useHapticFeedback.ts` | Vibration API |
| Swipe Back | `src/hooks/useSwipeBack.ts` | Touch Events |
| Scroll Direction | `src/hooks/useScrollDirection.ts` | React |
| Device Orientation | `src/hooks/useDeviceOrientation.ts` | React |
| Keyboard Avoid | `src/hooks/useKeyboardAvoid.ts` | React |
| Double Tap | `src/hooks/useDoubleTap.ts` | React |
| Long Press | `src/hooks/useLongPress.ts` | React |
| Native Share | `src/hooks/useNativeShare.ts` | Web Share API |
| Network Status | `src/hooks/useNetworkStatus.ts` | React |
| Online Status | `src/hooks/useOnlineStatus.ts` | React |

### 3. PWA
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Install Prompt | `src/components/PWAInstallPrompt.tsx` | React |
| Offline Indicator | `src/components/OfflineIndicator.tsx` | React |
| Service Worker | `public/sw.js` | Service Worker API |
| Offline Page | `public/offline.html` | HTML |
| Hook PWA Install | `src/hooks/usePWAInstall.ts` | React |

---

## 🎨 UI/UX E DESIGN SYSTEM

### 1. Design System
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| CSS Variables | `src/index.css` | CSS Custom Properties |
| Tailwind Config | `tailwind.config.ts` | Tailwind CSS |
| Cores Semânticas | HSL com tokens | Tailwind |
| Tipografia | Plus Jakarta Sans, Outfit | Google Fonts |
| Animações | Keyframes customizados | CSS, Framer Motion |
| Shadows | Sistema de sombras | CSS Variables |
| Gradients | Gradientes temáticos | CSS Variables |

### 2. Componentes UI (Shadcn)
| Componente | Arquivo | Base |
|------------|---------|------|
| Accordion | `src/components/ui/accordion.tsx` | Radix UI |
| Alert Dialog | `src/components/ui/alert-dialog.tsx` | Radix UI |
| Avatar | `src/components/ui/avatar.tsx` | Radix UI |
| Badge | `src/components/ui/badge.tsx` | Radix UI |
| Button | `src/components/ui/button.tsx` | Radix UI |
| Calendar | `src/components/ui/calendar.tsx` | React Day Picker |
| Card | `src/components/ui/card.tsx` | React |
| Carousel | `src/components/ui/carousel.tsx` | Embla Carousel |
| Chart | `src/components/ui/chart.tsx` | Recharts |
| Checkbox | `src/components/ui/checkbox.tsx` | Radix UI |
| Dialog | `src/components/ui/dialog.tsx` | Radix UI |
| Drawer | `src/components/ui/drawer.tsx` | Vaul |
| Dropdown Menu | `src/components/ui/dropdown-menu.tsx` | Radix UI |
| Form | `src/components/ui/form.tsx` | React Hook Form |
| Input | `src/components/ui/input.tsx` | React |
| Input OTP | `src/components/ui/input-otp.tsx` | input-otp |
| Popover | `src/components/ui/popover.tsx` | Radix UI |
| Progress | `src/components/ui/progress.tsx` | Radix UI |
| Select | `src/components/ui/select.tsx` | Radix UI |
| Sheet | `src/components/ui/sheet.tsx` | Radix UI |
| Sidebar | `src/components/ui/sidebar.tsx` | React |
| Skeleton | `src/components/ui/skeleton.tsx` | React |
| Slider | `src/components/ui/slider.tsx` | Radix UI |
| Switch | `src/components/ui/switch.tsx` | Radix UI |
| Table | `src/components/ui/table.tsx` | React |
| Tabs | `src/components/ui/tabs.tsx` | Radix UI |
| Textarea | `src/components/ui/textarea.tsx` | React |
| Toast/Toaster | `src/components/ui/toast.tsx` | Radix UI, Sonner |
| Toggle | `src/components/ui/toggle.tsx` | Radix UI |
| Tooltip | `src/components/ui/tooltip.tsx` | Radix UI |

### 3. Estados e Feedback
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Empty State | `src/components/ui/empty-state.tsx` | React |
| Loading State | `src/components/ui/loading-state.tsx` | React |
| Spinner | `src/components/ui/spinner.tsx` | React |
| Error Boundary | `src/components/ErrorBoundary.tsx` | React Error Boundary |
| Section Error | `src/components/SectionErrorBoundary.tsx` | React |
| Confirm Dialog | `src/components/ConfirmDialog.tsx` | React |
| Undo Toast | `src/components/UndoToast.tsx` | React |

### 4. Efeitos Visuais
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Floating Reward | `src/components/effects/FloatingReward.tsx` | Framer Motion |
| Mini Confetti | `src/components/effects/MiniConfetti.tsx` | canvas-confetti |
| Success Celebration | `src/components/effects/SuccessCelebration.tsx` | Framer Motion |
| Weekly Victory | `src/components/effects/WeeklyChallengeVictory.tsx` | Framer Motion |
| Page Transition | `src/components/PageTransition.tsx` | Framer Motion |
| Staggered Container | `src/components/StaggeredContainer.tsx` | Framer Motion |

### 5. Tema
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Theme Provider | `src/hooks/useTheme.tsx` | next-themes |
| Theme Toggle | `src/components/ThemeToggle.tsx` | React |
| System Theme Hook | `src/hooks/useSystemTheme.ts` | React |

---

## 🔧 UTILITÁRIOS E HELPERS

### 1. Validação
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Validações Auth | `src/lib/authValidations.ts` | Zod |
| Validações Gerais | `src/lib/validations.ts` | Zod |
| Input Validation | `src/lib/inputValidation.ts` | Zod |
| Form Validation Hook | `src/hooks/useFormValidation.ts` | React Hook Form, Zod |

### 2. Rate Limiting
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Rate Limiter | `src/lib/rateLimiter.ts` | Custom |
| Hook | `src/hooks/useRateLimiter.ts` | React |
| Edge Functions | `supabase/functions/_shared/rate-limiter.ts` | Deno |

### 3. Utilitários
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Utils Gerais | `src/lib/utils.ts` | clsx, tailwind-merge |
| Query Client | `src/lib/queryClient.ts` | React Query |
| Query Keys | `src/lib/queryKeys.ts` | TypeScript |
| Error Messages | `src/lib/errorMessages.ts` | TypeScript |
| Export Reports | `src/lib/exportReports.ts` | TypeScript |
| Service Factory | `src/lib/serviceFactory.ts` | TypeScript |

### 4. Hooks Utilitários
| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Debounce | `src/hooks/useDebounce.ts` | React |
| Throttle | `src/hooks/useThrottle.ts` | React |
| Click Outside | `src/hooks/useClickOutside.ts` | React |
| Intersection Observer | `src/hooks/useIntersectionObserver.ts` | React |
| Infinite Scroll | `src/hooks/useInfiniteScroll.ts` | React |
| Keyboard Shortcuts | `src/hooks/useKeyboardShortcuts.ts` | React |
| Reduced Motion | `src/hooks/useReducedMotion.ts` | React |
| Prefetch | `src/hooks/usePrefetch.ts` | React Query |
| Error Handler | `src/hooks/useErrorHandler.ts` | React |
| First Time Indicator | `src/hooks/useFirstTimeIndicator.ts` | React |

---

## 🌐 INTERNACIONALIZAÇÃO

| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| I18n Setup | `src/i18n/index.ts` | Custom |
| Traduções | `src/i18n/translations.ts` | TypeScript |
| Hook | `src/hooks/useI18n.ts` | React |
| Seletor de Idioma | `src/components/LanguageSelector.tsx` | React |
| Textos Constantes | `src/constants/texts.ts` | TypeScript |

---

## 🔊 ÁUDIO E SOM

| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| Sound Effects Hook | `src/hooks/useSoundEffects.tsx` | Web Audio API |
| Sound Settings Context | `src/contexts/SoundSettingsContext.tsx` | React Context |
| Sound Settings Card | `src/components/SoundSettingsCard.tsx` | React |

---

## 📄 SEO

| Funcionalidade | Arquivo | Ferramentas |
|----------------|---------|-------------|
| SEO Head | `src/components/SEOHead.tsx` | React Helmet |
| Hook | `src/hooks/useSEO.ts` | React |

---

## 🔌 EDGE FUNCTIONS (SUPABASE)

| Função | Diretório | Propósito |
|--------|-----------|-----------|
| admin-alerts | `supabase/functions/admin-alerts/` | Alertas administrativos |
| ai-coach | `supabase/functions/ai-coach/` | Coach de IA conversacional |
| birthday-celebrations | `supabase/functions/birthday-celebrations/` | Celebrações de aniversário |
| bitrix24-api | `supabase/functions/bitrix24-api/` | Integração Bitrix24 API |
| bitrix24-oauth | `supabase/functions/bitrix24-oauth/` | OAuth Bitrix24 |
| bitrix24-webhook | `supabase/functions/bitrix24-webhook/` | Webhooks Bitrix24 |
| checkin-reminders | `supabase/functions/checkin-reminders/` | Lembretes de check-in |
| churn-prediction | `supabase/functions/churn-prediction/` | Predição de churn com IA |
| competency-alerts | `supabase/functions/competency-alerts/` | Alertas de competências |
| external-api | `supabase/functions/external-api/` | API externa para integrações |
| external-webhook | `supabase/functions/external-webhook/` | Webhooks externos |
| generate-quiz-questions | `supabase/functions/generate-quiz-questions/` | Geração de perguntas com IA |
| send-email-notifications | `supabase/functions/send-email-notifications/` | Envio de emails |
| survey-reminders | `supabase/functions/survey-reminders/` | Lembretes de pesquisas |
| trail-recommendations | `supabase/functions/trail-recommendations/` | Recomendações de trilhas com IA |
| verify-ip | `supabase/functions/verify-ip/` | Verificação de IP whitelist |
| webhook-dispatcher | `supabase/functions/webhook-dispatcher/` | Dispatcher de webhooks |
| weekly-league-processing | `supabase/functions/weekly-league-processing/` | Processamento de ligas |

---

## 📊 FUNÇÕES DE BANCO DE DADOS (PL/pgSQL)

| Função | Propósito |
|--------|-----------|
| `calculate_enps_score` | Calcula score eNPS |
| `apply_task_penalty` | Aplica penalidades em tarefas |
| `is_ip_whitelisted` | Verifica IP na whitelist |
| `log_ip_access` | Registra acessos de IP |
| `request_password_reset` | Solicita reset de senha |
| `approve_password_reset` | Aprova reset de senha |
| `reject_password_reset` | Rejeita reset de senha |
| `complete_task_score` | Completa pontuação de tarefa |
| `get_nine_box_distribution` | Distribuição Nine Box |
| `get_executive_metrics` | Métricas executivas |
| `get_monthly_trends` | Tendências mensais |
| `get_department_metrics` | Métricas por departamento |
| `validate_api_key` | Valida chave de API externa |
| `process_external_task` | Processa tarefa externa |
| `complete_external_task` | Completa tarefa externa |
| `get_user_stats_api` | Stats de usuário via API |
| `get_leaderboard_api` | Leaderboard via API |
| `update_certification_statuses` | Atualiza status de certificações |
| `generate_engagement_snapshot` | Snapshot de engajamento |
| `get_quiz_category_stats` | Estatísticas de quiz por categoria |
| `handle_new_user` | Trigger para novo usuário |
| `update_updated_at_column` | Trigger para updated_at |
| `has_role` | Verifica role de usuário |
| `is_department_manager` | Verifica se é gestor do departamento |

---

## 📁 ESTRUTURA DE DIRETÓRIOS

```
src/
├── components/           # Componentes React
│   ├── admin/           # Componentes administrativos
│   ├── analytics/       # Analytics e dashboards
│   ├── auth/            # Autenticação (2FA)
│   ├── checkins/        # Check-ins e 1:1
│   ├── climate/         # Clima organizacional
│   ├── competency/      # Competências
│   ├── dashboard/       # Componentes de dashboard
│   ├── demographics/    # Dados demográficos
│   ├── effects/         # Efeitos visuais
│   ├── feedback/        # Feedback 360
│   ├── gamification/    # Gamificação
│   ├── integrations/    # Integrações
│   ├── kpi/             # KPIs
│   ├── lms/             # Learning Management
│   ├── manager/         # Painel do gestor
│   ├── mobile/          # Componentes mobile
│   ├── notifications/   # Notificações
│   ├── okr/             # OKRs
│   ├── onboarding/      # Onboarding
│   ├── oneone/          # 1:1 meetings
│   ├── pdi/             # PDI
│   ├── people/          # Gestão de pessoas
│   ├── permissions/     # Permissões
│   ├── quest-builder/   # Construtor de quests
│   ├── quiz/            # Sistema de quiz
│   ├── rbac/            # RBAC
│   ├── reports/         # Relatórios
│   ├── settings/        # Configurações
│   └── ui/              # Componentes UI base
├── contexts/            # React Contexts
├── hooks/               # Custom Hooks
├── i18n/                # Internacionalização
├── integrations/        # Integrações (Supabase client)
├── lib/                 # Bibliotecas e utilitários
├── pages/               # Páginas da aplicação
├── services/            # Serviços de dados
├── test/                # Configuração de testes
└── types/               # Tipos TypeScript

supabase/
├── config.toml          # Configuração Supabase
├── functions/           # Edge Functions
│   ├── _shared/         # Código compartilhado
│   └── [function]/      # Funções individuais
└── migrations/          # Migrações de banco

public/
├── sw.js                # Service Worker
├── offline.html         # Página offline
├── pwa-*.png            # Ícones PWA
└── robots.txt           # SEO
```

---

## 🏷️ PADRÕES DE NOMENCLATURA

### Hooks
- `use[NomeFuncionalidade].ts` - Hook principal
- `use[Ação][Entidade].ts` - Hook de ação específica

### Services
- `[entidade]Service.ts` - Serviço CRUD
- `[funcionalidade]Service.ts` - Serviço específico

### Components
- `[NomeFuncionalidade].tsx` - Componente principal
- `[Nome]Widget.tsx` - Widget de dashboard
- `[Nome]Panel.tsx` - Painel/seção
- `[Nome]Manager.tsx` - Gerenciador admin
- `[Nome]Dashboard.tsx` - Dashboard

### Edge Functions
- `[nome-com-hifens]/index.ts` - Função edge

---

## 📝 NOTAS IMPORTANTES

1. **React Query**: Usado para cache e sincronização de estado servidor
2. **Supabase Realtime**: Usado para funcionalidades em tempo real (leaderboard, notificações)
3. **RLS (Row Level Security)**: Implementado em todas as tabelas sensíveis
4. **Tokens HSL**: Todas as cores usam tokens CSS semânticos
5. **Code Splitting**: Lazy loading implementado para rotas secundárias
6. **PWA**: Suporte completo offline com Service Worker
7. **Testes**: Vitest + Testing Library para testes unitários

---

*Documento gerado em: 2025-12-31*
*Versão: 1.0*
