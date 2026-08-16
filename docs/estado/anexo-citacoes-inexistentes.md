# Anexo — Citações inexistentes nos inventários anteriores

Lista completa dos 81 caminhos citados como evidência nos documentos de auditoria
pré-existentes e que não existem em lugar nenhum do repositório (nem com outro caminho).

```
src/components/CompetencyAlertsPanel.tsx
src/components/admin/ApiIntegrationManager.tsx
src/components/admin/Bitrix24Integration.tsx
src/components/admin/DemographicsManager.tsx
src/components/admin/GamificationManager.tsx
src/components/analytics/AnalyticsDashboard.tsx
src/components/climate/ActionPlanManager.tsx
src/components/climate/ClimatePillarsDashboard.tsx
src/components/climate/OpinionsPanel.tsx
src/components/competency/CompetencyMatrixPanel.tsx
src/components/demographics/DemographicsPanel.tsx
src/components/effects/FloatingReward.tsx
src/components/effects/SuccessCelebration.tsx
src/components/feedback/Feedback360Dashboard.tsx
src/components/feedback/FeedbackPanel.tsx
src/components/integrations/IntegrationsPanel.tsx
src/components/kpi/KPIDashboard.tsx
src/components/notifications/NotificationsManager.tsx
src/components/okr/OKRDashboard.tsx
src/components/oneone/OneOnOnePanel.tsx
src/components/pdi/PDIEnhancedPanel.tsx
src/components/pdi/PDIFullDashboard.tsx
src/components/people/PeopleGroupsPanel.tsx
src/components/permissions/PermissionsPanel.tsx
src/components/reports/AdvancedReportsPanel.tsx
src/components/reports/ExportReportDialog.tsx
src/components/reports/ReportBuilder.tsx
src/components/reports/ReportLibrary.tsx
src/components/settings/GlobalSettingsPanel.tsx
src/components/settings/NotificationSettingsPanel.tsx
src/hooks/useAnalytics.ts
src/hooks/useBenchmark.ts
src/hooks/useBitrix24.ts
src/hooks/useCompetencyMatrix.ts
src/hooks/useDemographics.ts
src/hooks/useDeviceOrientation.ts
src/hooks/useDoubleTap.ts
src/hooks/useErrorHandler.ts
src/hooks/useExternalApi.ts
src/hooks/useFormValidation.ts
src/hooks/useGamificationAdmin.ts
src/hooks/useHapticFeedback.ts
src/hooks/useInfiniteScroll.ts
src/hooks/useIntersectionObserver.ts
src/hooks/useKPIs.ts
src/hooks/useKeyboardAvoid.ts
src/hooks/useLongPress.ts
src/hooks/useMentorship.ts
src/hooks/useNativeShare.ts
src/hooks/useNotificationTemplates.ts
src/hooks/useOKRs.ts
src/hooks/usePasswordResetRequests.ts
src/hooks/usePeopleGroups.ts
src/hooks/usePrefetch.ts
src/hooks/useRateLimiter.ts
src/hooks/useReports.ts
src/hooks/useSystemTheme.ts
src/hooks/useThrottle.ts
src/lib/inputValidation.ts
src/lib/queryClient.ts
src/lib/queryKeys.ts
src/lib/rateLimiter.ts
src/lib/serviceFactory.ts
src/pages/Bitrix24CRM.tsx
src/pages/Mentorship.tsx
src/services/actionPlanService.ts
src/services/analyticsService.ts
src/services/benchmarkService.ts
src/services/bitrix24Service.ts
src/services/bitrix24SyncService.ts
src/services/competencyMatrixService.ts
src/services/demographicsService.ts
src/services/externalApiService.ts
src/services/gamificationAdminService.ts
src/services/kpiService.ts
src/services/mentorshipService.ts
src/services/notificationTemplatesService.ts
src/services/okrService.ts
src/services/peopleService.ts
src/services/pushNotificationService.ts
src/services/reportsService.ts
```

## Os 3 casos de drift de caminho (arquivo existe, caminho citado está errado)

```
src/components/ProtectedRoute.tsx  ->  src/components/rbac/ProtectedRoute.tsx
src/components/climate/BenchmarkComparison.tsx  ->  src/components/engagement/diagnostics/BenchmarkComparison.tsx
src/i18n/index.ts  ->  src/components/admin/users/index.ts
```
