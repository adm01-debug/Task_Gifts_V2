-- ============================================================================
-- Congela RLS (policies) e grants exatamente como estao em producao hoje.
--
-- Contexto: a auditoria de 25/11/2026 comparou o catalogo de producao com o
-- replay das migrations e achou 152 policies que so existem no banco vivo
-- (canonicalizacao manual feita direto no SQL Editor: <tabela>_admin_all,
-- <tabela>_user_own, <tabela>_user_select...) e 134 policies do repositorio
-- que producao ja nao tem, porque foram substituidas naquela canonicalizacao.
-- Nenhuma dessas 152 foi versionada: a nova convencao de nomes nunca chegou
-- ao repositorio. Alem disso o anon tem SELECT em 31 tabelas de referencia no
-- vivo (geo gate, permissoes, posicoes) e o banco reconstruido nascia sem
-- grant nenhum para anon, e o authenticated tem UPDATE/DELETE/INSERT em 108
-- tabelas que o CLI local nao concede por padrao.
--
-- Resultado esperado depois deste arquivo: 548 policies e 1694 grants para
-- anon+authenticated, identicos ao vivo (verificado por replay completo).
--
-- Idempotente: DROP POLICY IF EXISTS + CREATE POLICY + GRANT. Em producao roda
-- numa transacao unica: se algum CREATE falhar o Postgres desfaz tudo e as
-- policies atuais continuam no lugar.
-- ============================================================================

-- 1) Derruba o conjunto atual: 682 nomes, uniao das 530
--    policies que o repositorio cria com as 548 que existem no vivo.
DROP POLICY IF EXISTS "Admins and managers can create evaluations" ON public."nine_box_evaluations";
DROP POLICY IF EXISTS "Admins and managers can manage options" ON public."quiz_options";
DROP POLICY IF EXISTS "Admins and managers can manage prerequisites" ON public."trail_prerequisites";
DROP POLICY IF EXISTS "Admins and managers can manage questions" ON public."quiz_questions";
DROP POLICY IF EXISTS "Admins and managers can manage templates" ON public."position_task_templates";
DROP POLICY IF EXISTS "Admins and managers can update evaluations" ON public."nine_box_evaluations";
DROP POLICY IF EXISTS "Admins and managers can view demographic values" ON public."user_demographic_values";
DROP POLICY IF EXISTS "Admins and managers can view sync mappings" ON public."bitrix24_sync_mappings";
DROP POLICY IF EXISTS "Admins and managers read wager budget" ON public."wager_budget_settings";
DROP POLICY IF EXISTS "Admins atualizam simulacoes what-if" ON public."lucky_wheel_whatif_snapshots";
DROP POLICY IF EXISTS "Admins can delete IP whitelist" ON public."ip_whitelist";
DROP POLICY IF EXISTS "Admins can delete announcements" ON public."announcements";
DROP POLICY IF EXISTS "Admins can delete integrity reviews" ON public."wager_integrity_reviews";
DROP POLICY IF EXISTS "Admins can delete surveys" ON public."climate_surveys";
DROP POLICY IF EXISTS "Admins can delete telemetry" ON public."query_telemetry";
DROP POLICY IF EXISTS "Admins can delete weekly challenges" ON public."weekly_challenges";
DROP POLICY IF EXISTS "Admins can insert IP whitelist" ON public."ip_whitelist";
DROP POLICY IF EXISTS "Admins can insert integrity reviews" ON public."wager_integrity_reviews";
DROP POLICY IF EXISTS "Admins can insert weekly challenges" ON public."weekly_challenges";
DROP POLICY IF EXISTS "Admins can manage API keys" ON public."external_api_keys";
DROP POLICY IF EXISTS "Admins can manage achievements" ON public."achievements";
DROP POLICY IF EXISTS "Admins can manage all roles" ON public."user_roles";
DROP POLICY IF EXISTS "Admins can manage allowed countries" ON public."geo_allowed_countries";
DROP POLICY IF EXISTS "Admins can manage avatar items" ON public."avatar_items";
DROP POLICY IF EXISTS "Admins can manage badges" ON public."custom_badges";
DROP POLICY IF EXISTS "Admins can manage badges" ON public."kudos_badges";
DROP POLICY IF EXISTS "Admins can manage bitrix tokens" ON public."bitrix24_tokens";
DROP POLICY IF EXISTS "Admins can manage blocked IPs" ON public."blocked_ips";
DROP POLICY IF EXISTS "Admins can manage blocked_ips" ON public."blocked_ips";
DROP POLICY IF EXISTS "Admins can manage certifications" ON public."certifications";
DROP POLICY IF EXISTS "Admins can manage challenges" ON public."seasonal_challenges";
DROP POLICY IF EXISTS "Admins can manage competencies" ON public."competencies";
DROP POLICY IF EXISTS "Admins can manage demographic attributes" ON public."demographic_attributes";
DROP POLICY IF EXISTS "Admins can manage departments" ON public."departments";
DROP POLICY IF EXISTS "Admins can manage events" ON public."seasonal_events";
DROP POLICY IF EXISTS "Admins can manage geo settings" ON public."geo_settings";
DROP POLICY IF EXISTS "Admins can manage leagues" ON public."leagues";
DROP POLICY IF EXISTS "Admins can manage level configs" ON public."level_configs";
DROP POLICY IF EXISTS "Admins can manage missions" ON public."department_missions";
DROP POLICY IF EXISTS "Admins can manage missions" ON public."mentorship_missions";
DROP POLICY IF EXISTS "Admins can manage penalties" ON public."task_penalties";
DROP POLICY IF EXISTS "Admins can manage penalty rules" ON public."penalty_rules";
DROP POLICY IF EXISTS "Admins can manage permission groups" ON public."permission_groups";
DROP POLICY IF EXISTS "Admins can manage permissions" ON public."permissions";
DROP POLICY IF EXISTS "Admins can manage positions" ON public."positions";
DROP POLICY IF EXISTS "Admins can manage promotions" ON public."shop_promotions";
DROP POLICY IF EXISTS "Admins can manage ranks" ON public."custom_ranks";
DROP POLICY IF EXISTS "Admins can manage rate limit rules" ON public."rate_limit_rules";
DROP POLICY IF EXISTS "Admins can manage rate_limit_rules" ON public."rate_limit_rules";
DROP POLICY IF EXISTS "Admins can manage rewards" ON public."shop_rewards";
DROP POLICY IF EXISTS "Admins can manage role permissions" ON public."role_permissions";
DROP POLICY IF EXISTS "Admins can manage security alerts" ON public."security_alerts";
DROP POLICY IF EXISTS "Admins can manage settings" ON public."attendance_settings";
DROP POLICY IF EXISTS "Admins can manage snapshots" ON public."engagement_snapshots";
DROP POLICY IF EXISTS "Admins can manage surveys" ON public."enps_surveys";
DROP POLICY IF EXISTS "Admins can manage sync mappings" ON public."bitrix24_sync_mappings";
DROP POLICY IF EXISTS "Admins can manage task scores" ON public."task_scores";
DROP POLICY IF EXISTS "Admins can manage team members" ON public."team_members";
DROP POLICY IF EXISTS "Admins can manage themes" ON public."gamification_themes";
DROP POLICY IF EXISTS "Admins can manage titles" ON public."custom_titles";
DROP POLICY IF EXISTS "Admins can manage user permission groups" ON public."user_permission_groups";
DROP POLICY IF EXISTS "Admins can manage user positions" ON public."user_positions";
DROP POLICY IF EXISTS "Admins can manage user titles" ON public."user_titles";
DROP POLICY IF EXISTS "Admins can manage webhooks" ON public."webhook_subscriptions";
DROP POLICY IF EXISTS "Admins can read telemetry" ON public."query_telemetry";
DROP POLICY IF EXISTS "Admins can update IP whitelist" ON public."ip_whitelist";
DROP POLICY IF EXISTS "Admins can update integrity reviews" ON public."wager_integrity_reviews";
DROP POLICY IF EXISTS "Admins can update purchases" ON public."shop_purchases";
DROP POLICY IF EXISTS "Admins can update weekly challenges" ON public."weekly_challenges";
DROP POLICY IF EXISTS "Admins can view API logs" ON public."api_request_logs";
DROP POLICY IF EXISTS "Admins can view IP access logs" ON public."ip_access_logs";
DROP POLICY IF EXISTS "Admins can view IP whitelist" ON public."ip_whitelist";
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public."audit_logs";
DROP POLICY IF EXISTS "Admins can view all checkins" ON public."checkins";
DROP POLICY IF EXISTS "Admins can view all development plans" ON public."development_plans";
DROP POLICY IF EXISTS "Admins can view all evaluations" ON public."nine_box_evaluations";
DROP POLICY IF EXISTS "Admins can view all plan actions" ON public."development_plan_actions";
DROP POLICY IF EXISTS "Admins can view all promotions" ON public."shop_promotions";
DROP POLICY IF EXISTS "Admins can view all purchases" ON public."shop_purchases";
DROP POLICY IF EXISTS "Admins can view all requests" ON public."feedback_requests";
DROP POLICY IF EXISTS "Admins can view all responses" ON public."enps_responses";
DROP POLICY IF EXISTS "Admins can view all responses" ON public."feedback_responses";
DROP POLICY IF EXISTS "Admins can view allowed countries" ON public."geo_allowed_countries";
DROP POLICY IF EXISTS "Admins can view geo blocking rules" ON public."geo_blocking_rules";
DROP POLICY IF EXISTS "Admins can view geo settings" ON public."geo_settings";
DROP POLICY IF EXISTS "Admins can view login attempts" ON public."login_attempts";
DROP POLICY IF EXISTS "Admins can view lucky wheel prizes" ON public."lucky_wheel_prizes";
DROP POLICY IF EXISTS "Admins can view push outbox health snapshots" ON public."push_outbox_health_snapshots";
DROP POLICY IF EXISTS "Admins can view push outbox" ON public."push_outbox";
DROP POLICY IF EXISTS "Admins can view rate limit logs" ON public."rate_limit_logs";
DROP POLICY IF EXISTS "Admins can view webhook logs" ON public."bitrix24_webhook_logs";
DROP POLICY IF EXISTS "Admins can view webhook logs" ON public."webhook_delivery_logs";
DROP POLICY IF EXISTS "Admins delete action plans" ON public."action_plans";
DROP POLICY IF EXISTS "Admins gerenciam desafios" ON public."bingo_board_tasks";
DROP POLICY IF EXISTS "Admins gerenciam guerras" ON public."department_wars";
DROP POLICY IF EXISTS "Admins gerenciam mercados" ON public."prediction_markets";
DROP POLICY IF EXISTS "Admins gerenciam metricas da guerra" ON public."department_war_metrics";
DROP POLICY IF EXISTS "Admins gerenciam opções" ON public."prediction_options";
DROP POLICY IF EXISTS "Admins gerenciam participantes da guerra" ON public."department_war_departments";
DROP POLICY IF EXISTS "Admins gerenciam rodadas" ON public."bingo_boards";
DROP POLICY IF EXISTS "Admins gerenciam torneios" ON public."tournaments";
DROP POLICY IF EXISTS "Admins insert wager budget" ON public."wager_budget_settings";
DROP POLICY IF EXISTS "Admins leem simulacoes what-if" ON public."lucky_wheel_whatif_snapshots";
DROP POLICY IF EXISTS "Admins leem snapshots de payout" ON public."lucky_wheel_payout_snapshots";
DROP POLICY IF EXISTS "Admins leem trilha de previsões" ON public."prediction_admin_events";
DROP POLICY IF EXISTS "Admins manage SLA targets" ON public."sla_targets";
DROP POLICY IF EXISTS "Admins manage benchmarks" ON public."climate_benchmarks";
DROP POLICY IF EXISTS "Admins manage external tasks" ON public."external_tasks";
DROP POLICY IF EXISTS "Admins manage lucky wheel settings" ON public."lucky_wheel_settings";
DROP POLICY IF EXISTS "Admins manage monthly reports" ON public."executive_monthly_reports";
DROP POLICY IF EXISTS "Admins manage position competencies" ON public."position_competencies";
DROP POLICY IF EXISTS "Admins manage postmortem actions" ON public."postmortem_actions";
DROP POLICY IF EXISTS "Admins manage postmortems" ON public."postmortems";
DROP POLICY IF EXISTS "Admins manage prizes" ON public."lucky_wheel_prizes";
DROP POLICY IF EXISTS "Admins manage runbook executions" ON public."runbook_executions";
DROP POLICY IF EXISTS "Admins podem gerenciar regras de geo blocking" ON public."geo_blocking_rules";
DROP POLICY IF EXISTS "Admins podem ver logs de acesso geografico" ON public."geo_access_logs";
DROP POLICY IF EXISTS "Admins podem ver logs de acesso geográfico" ON public."geo_access_logs";
DROP POLICY IF EXISTS "Admins read lucky wheel settings audit" ON public."lucky_wheel_settings_audit";
DROP POLICY IF EXISTS "Admins read monthly reports" ON public."executive_monthly_reports";
DROP POLICY IF EXISTS "Admins read wheel prize audit" ON public."lucky_wheel_prize_audit";
DROP POLICY IF EXISTS "Admins registram simulacoes what-if" ON public."lucky_wheel_whatif_snapshots";
DROP POLICY IF EXISTS "Admins update wager budget" ON public."wager_budget_settings";
DROP POLICY IF EXISTS "Autenticados veem guerras publicadas" ON public."department_wars";
DROP POLICY IF EXISTS "Autenticados veem metricas da guerra" ON public."department_war_metrics";
DROP POLICY IF EXISTS "Autenticados veem participantes da guerra" ON public."department_war_departments";
DROP POLICY IF EXISTS "Autenticados veem resultados da guerra" ON public."department_war_results";
DROP POLICY IF EXISTS "Authenticated can read boss win rate goals" ON public."boss_win_rate_goals";
DROP POLICY IF EXISTS "Authenticated create celebrations" ON public."celebrations";
DROP POLICY IF EXISTS "Authenticated insert audit logs" ON public."audit_logs";
DROP POLICY IF EXISTS "Authenticated insert certifications" ON public."user_certifications";
DROP POLICY IF EXISTS "Authenticated insert device alerts" ON public."new_device_alerts";
DROP POLICY IF EXISTS "Authenticated insert devices" ON public."user_devices";
DROP POLICY IF EXISTS "Authenticated insert geo logs" ON public."geo_access_logs";
DROP POLICY IF EXISTS "Authenticated insert league history" ON public."league_history";
DROP POLICY IF EXISTS "Authenticated insert notifications" ON public."notifications";
DROP POLICY IF EXISTS "Authenticated insert webhook logs" ON public."bitrix24_webhook_logs";
DROP POLICY IF EXISTS "Authenticated users can add reactions" ON public."activity_reactions";
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public."activity_comments";
DROP POLICY IF EXISTS "Authenticated users can give kudos" ON public."kudos";
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public."profiles";
DROP POLICY IF EXISTS "Authenticated users can view weekly challenges" ON public."weekly_challenges";
DROP POLICY IF EXISTS "Authors can manage own announcements" ON public."announcements";
DROP POLICY IF EXISTS "Authors read their own opinions" ON public."opinions";
DROP POLICY IF EXISTS "Create action plan updates" ON public."action_plan_updates";
DROP POLICY IF EXISTS "Creators and admins can delete trails" ON public."learning_trails";
DROP POLICY IF EXISTS "Creators and admins can update trails" ON public."learning_trails";
DROP POLICY IF EXISTS "Creators can update surveys" ON public."climate_surveys";
DROP POLICY IF EXISTS "Desafios visiveis para autenticados" ON public."bingo_board_tasks";
DROP POLICY IF EXISTS "Everyone can view achievements" ON public."achievements";
DROP POLICY IF EXISTS "Everyone can view active avatar items" ON public."avatar_items";
DROP POLICY IF EXISTS "Everyone can view active badges" ON public."custom_badges";
DROP POLICY IF EXISTS "Everyone can view active cycles" ON public."feedback_cycles";
DROP POLICY IF EXISTS "Everyone can view active demographic attributes" ON public."demographic_attributes";
DROP POLICY IF EXISTS "Everyone can view active events" ON public."seasonal_events";
DROP POLICY IF EXISTS "Everyone can view active missions" ON public."department_missions";
DROP POLICY IF EXISTS "Everyone can view active missions" ON public."mentorship_missions";
DROP POLICY IF EXISTS "Everyone can view active promotions" ON public."shop_promotions";
DROP POLICY IF EXISTS "Everyone can view active questions" ON public."quiz_questions";
DROP POLICY IF EXISTS "Everyone can view active quests" ON public."custom_quests";
DROP POLICY IF EXISTS "Everyone can view active rewards" ON public."shop_rewards";
DROP POLICY IF EXISTS "Everyone can view active rules" ON public."penalty_rules";
DROP POLICY IF EXISTS "Everyone can view active surveys" ON public."climate_surveys";
DROP POLICY IF EXISTS "Everyone can view active surveys" ON public."enps_surveys";
DROP POLICY IF EXISTS "Everyone can view active templates" ON public."position_task_templates";
DROP POLICY IF EXISTS "Everyone can view active themes" ON public."gamification_themes";
DROP POLICY IF EXISTS "Everyone can view active titles" ON public."custom_titles";
DROP POLICY IF EXISTS "Everyone can view allowed countries" ON public."geo_allowed_countries";
DROP POLICY IF EXISTS "Everyone can view badges" ON public."kudos_badges";
DROP POLICY IF EXISTS "Everyone can view benchmarks" ON public."climate_benchmarks";
DROP POLICY IF EXISTS "Everyone can view certifications" ON public."certifications";
DROP POLICY IF EXISTS "Everyone can view challenges" ON public."seasonal_challenges";
DROP POLICY IF EXISTS "Everyone can view comments" ON public."activity_comments";
DROP POLICY IF EXISTS "Everyone can view competencies" ON public."competencies";
DROP POLICY IF EXISTS "Everyone can view departments" ON public."departments";
DROP POLICY IF EXISTS "Everyone can view geo settings" ON public."geo_settings";
DROP POLICY IF EXISTS "Everyone can view league history" ON public."league_history";
DROP POLICY IF EXISTS "Everyone can view leagues" ON public."leagues";
DROP POLICY IF EXISTS "Everyone can view level configs" ON public."level_configs";
DROP POLICY IF EXISTS "Everyone can view modules of published trails" ON public."trail_modules";
DROP POLICY IF EXISTS "Everyone can view options of active questions" ON public."quiz_options";
DROP POLICY IF EXISTS "Everyone can view permission groups" ON public."permission_groups";
DROP POLICY IF EXISTS "Everyone can view permissions" ON public."permissions";
DROP POLICY IF EXISTS "Everyone can view positions" ON public."positions";
DROP POLICY IF EXISTS "Everyone can view prerequisites" ON public."trail_prerequisites";
DROP POLICY IF EXISTS "Everyone can view published announcements" ON public."announcements";
DROP POLICY IF EXISTS "Everyone can view published trails" ON public."learning_trails";
DROP POLICY IF EXISTS "Everyone can view rankings" ON public."department_rankings";
DROP POLICY IF EXISTS "Everyone can view ranks" ON public."custom_ranks";
DROP POLICY IF EXISTS "Everyone can view reactions" ON public."activity_reactions";
DROP POLICY IF EXISTS "Everyone can view reactions" ON public."announcement_reactions";
DROP POLICY IF EXISTS "Everyone can view role permissions" ON public."role_permissions";
DROP POLICY IF EXISTS "Everyone can view scores" ON public."quiz_scores";
DROP POLICY IF EXISTS "Everyone can view settings" ON public."attendance_settings";
DROP POLICY IF EXISTS "Everyone can view steps of active quests" ON public."quest_steps";
DROP POLICY IF EXISTS "Everyone can view templates" ON public."checkin_templates";
DROP POLICY IF EXISTS "Everyone can view user leagues" ON public."user_leagues";
DROP POLICY IF EXISTS "Gestores e admins leem historico de apuracoes" ON public."wager_integrity_review_events";
DROP POLICY IF EXISTS "Goal owners and admins can view goal updates" ON public."goal_updates";
DROP POLICY IF EXISTS "Goal owners and admins can view key results" ON public."key_results";
DROP POLICY IF EXISTS "Goal owners can insert updates" ON public."goal_updates";
DROP POLICY IF EXISTS "Goal owners can manage key results" ON public."key_results";
DROP POLICY IF EXISTS "Manage action plan items" ON public."action_plan_items";
DROP POLICY IF EXISTS "Manage opinion tags" ON public."opinion_tags";
DROP POLICY IF EXISTS "Managers and admins can create quests" ON public."custom_quests";
DROP POLICY IF EXISTS "Managers and admins can create trails" ON public."learning_trails";
DROP POLICY IF EXISTS "Managers and admins can delete boss win rate goals" ON public."boss_win_rate_goals";
DROP POLICY IF EXISTS "Managers and admins can delete their quests" ON public."custom_quests";
DROP POLICY IF EXISTS "Managers and admins can insert boss win rate goals" ON public."boss_win_rate_goals";
DROP POLICY IF EXISTS "Managers and admins can read integrity reviews" ON public."wager_integrity_reviews";
DROP POLICY IF EXISTS "Managers and admins can update boss win rate goals" ON public."boss_win_rate_goals";
DROP POLICY IF EXISTS "Managers and admins can update their quests" ON public."custom_quests";
DROP POLICY IF EXISTS "Managers and admins can view team mood data" ON public."mood_entries";
DROP POLICY IF EXISTS "Managers assign PDI mentors" ON public."pdi_mentors";
DROP POLICY IF EXISTS "Managers can add survey questions" ON public."climate_survey_questions";
DROP POLICY IF EXISTS "Managers can create announcements" ON public."announcements";
DROP POLICY IF EXISTS "Managers can create assignments" ON public."quest_assignments";
DROP POLICY IF EXISTS "Managers can create checkins" ON public."checkins";
DROP POLICY IF EXISTS "Managers can create climate surveys" ON public."climate_surveys";
DROP POLICY IF EXISTS "Managers can create requests" ON public."feedback_requests";
DROP POLICY IF EXISTS "Managers can create templates" ON public."checkin_templates";
DROP POLICY IF EXISTS "Managers can delete draft survey questions" ON public."climate_survey_questions";
DROP POLICY IF EXISTS "Managers can manage cycles" ON public."feedback_cycles";
DROP POLICY IF EXISTS "Managers can manage surveys" ON public."pulse_surveys";
DROP POLICY IF EXISTS "Managers can manage team goals" ON public."goals";
DROP POLICY IF EXISTS "Managers can update certifications" ON public."user_certifications";
DROP POLICY IF EXISTS "Managers can update survey questions" ON public."climate_survey_questions";
DROP POLICY IF EXISTS "Managers can update team password reset requests" ON public."password_reset_requests";
DROP POLICY IF EXISTS "Managers can view all penalties" ON public."task_penalties";
DROP POLICY IF EXISTS "Managers can view all progress" ON public."user_seasonal_progress";
DROP POLICY IF EXISTS "Managers can view all streaks" ON public."attendance_streaks";
DROP POLICY IF EXISTS "Managers can view all task scores" ON public."task_scores";
DROP POLICY IF EXISTS "Managers can view anonymous aggregated responses" ON public."pulse_responses";
DROP POLICY IF EXISTS "Managers can view department snapshots" ON public."engagement_snapshots";
DROP POLICY IF EXISTS "Managers can view pillar scores" ON public."climate_pillar_scores";
DROP POLICY IF EXISTS "Managers can view team achievements" ON public."user_achievements";
DROP POLICY IF EXISTS "Managers can view team assignments" ON public."quest_assignments";
DROP POLICY IF EXISTS "Managers can view team attendance" ON public."attendance_records";
DROP POLICY IF EXISTS "Managers can view team audit logs" ON public."audit_logs";
DROP POLICY IF EXISTS "Managers can view team certifications" ON public."user_certifications";
DROP POLICY IF EXISTS "Managers can view team combos" ON public."user_combos";
DROP POLICY IF EXISTS "Managers can view team development plans" ON public."development_plans";
DROP POLICY IF EXISTS "Managers can view team password reset requests" ON public."password_reset_requests";
DROP POLICY IF EXISTS "Managers can view team positions" ON public."user_positions";
DROP POLICY IF EXISTS "Managers can view their team evaluations" ON public."nine_box_evaluations";
DROP POLICY IF EXISTS "Managers can view their team members" ON public."team_members";
DROP POLICY IF EXISTS "Managers create action plans" ON public."action_plans";
DROP POLICY IF EXISTS "Managers insert competency assessments" ON public."user_competency_assessments";
DROP POLICY IF EXISTS "Managers insert feedback results" ON public."feedback_results";
DROP POLICY IF EXISTS "Managers insert task scores" ON public."task_scores";
DROP POLICY IF EXISTS "Managers update task scores" ON public."task_scores";
DROP POLICY IF EXISTS "Members can view their org membership" ON public."org_members";
DROP POLICY IF EXISTS "Mercados publicados são visíveis" ON public."prediction_markets";
DROP POLICY IF EXISTS "Opções de mercados visíveis" ON public."prediction_options";
DROP POLICY IF EXISTS "Org admins can update" ON public."organizations";
DROP POLICY IF EXISTS "Org admins insert history" ON public."org_theme_history";
DROP POLICY IF EXISTS "Org admins manage members" ON public."org_members";
DROP POLICY IF EXISTS "Org admins view history" ON public."org_theme_history";
DROP POLICY IF EXISTS "Owners update action plans" ON public."action_plans";
DROP POLICY IF EXISTS "Participantes de torneios visiveis para autenticados" ON public."tournament_participants";
DROP POLICY IF EXISTS "Participants can update checkins" ON public."checkins";
DROP POLICY IF EXISTS "Participants can view their checkins" ON public."checkins";
DROP POLICY IF EXISTS "Partidas visiveis para autenticados" ON public."tournament_matches";
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public."profiles";
DROP POLICY IF EXISTS "Public can read org branding" ON public."organizations";
DROP POLICY IF EXISTS "Public kudos are viewable by all" ON public."kudos";
DROP POLICY IF EXISTS "Quest creators can manage steps" ON public."quest_steps";
DROP POLICY IF EXISTS "Receivers can view non-anonymous feedback" ON public."feedback_responses";
DROP POLICY IF EXISTS "Recipients can update opinions" ON public."opinions";
DROP POLICY IF EXISTS "Responders can create responses" ON public."opinion_responses";
DROP POLICY IF EXISTS "Rodadas visiveis para autenticados" ON public."bingo_boards";
DROP POLICY IF EXISTS "Service role manages idempotency" ON public."webhook_idempotency";
DROP POLICY IF EXISTS "Staff can view all approval trail" ON public."purchase_approvals";
DROP POLICY IF EXISTS "Staff can view quiz options" ON public."quiz_options";
DROP POLICY IF EXISTS "Submitters can create responses" ON public."feedback_responses";
DROP POLICY IF EXISTS "Submitters can view own responses" ON public."feedback_responses";
DROP POLICY IF EXISTS "System can insert achievements" ON public."user_achievements";
DROP POLICY IF EXISTS "System can manage pillar scores" ON public."climate_pillar_scores";
DROP POLICY IF EXISTS "System can manage rankings" ON public."department_rankings";
DROP POLICY IF EXISTS "System can manage user leagues" ON public."user_leagues";
DROP POLICY IF EXISTS "Template owners can manage" ON public."checkin_templates";
DROP POLICY IF EXISTS "Todos podem ver regras de geo blocking" ON public."geo_blocking_rules";
DROP POLICY IF EXISTS "Torneios publicados sao visiveis para autenticados" ON public."tournaments";
DROP POLICY IF EXISTS "Trail creators can manage modules" ON public."trail_modules";
DROP POLICY IF EXISTS "Users and managers can update development plans" ON public."development_plans";
DROP POLICY IF EXISTS "Users can create duels" ON public."direct_duels";
DROP POLICY IF EXISTS "Users can create mentorship pairs" ON public."mentorship_pairs";
DROP POLICY IF EXISTS "Users can create opinions" ON public."opinions";
DROP POLICY IF EXISTS "Users can create own goals" ON public."goals";
DROP POLICY IF EXISTS "Users can create own password reset requests" ON public."password_reset_requests";
DROP POLICY IF EXISTS "Users can create plan actions" ON public."development_plan_actions";
DROP POLICY IF EXISTS "Users can create purchases" ON public."shop_purchases";
DROP POLICY IF EXISTS "Users can create requests" ON public."mentorship_requests";
DROP POLICY IF EXISTS "Users can create their own development plans" ON public."development_plans";
DROP POLICY IF EXISTS "Users can delete kudos they gave" ON public."kudos";
DROP POLICY IF EXISTS "Users can delete own draft goals" ON public."goals";
DROP POLICY IF EXISTS "Users can delete own filters" ON public."saved_filters";
DROP POLICY IF EXISTS "Users can delete plan actions" ON public."development_plan_actions";
DROP POLICY IF EXISTS "Users can delete their own comments" ON public."activity_comments";
DROP POLICY IF EXISTS "Users can delete their own credentials" ON public."webauthn_credentials";
DROP POLICY IF EXISTS "Users can delete their own messages" ON public."ai_coach_messages";
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public."notifications";
DROP POLICY IF EXISTS "Users can enroll themselves" ON public."trail_enrollments";
DROP POLICY IF EXISTS "Users can insert own answers" ON public."quiz_answers";
DROP POLICY IF EXISTS "Users can insert own attendance" ON public."attendance_records";
DROP POLICY IF EXISTS "Users can insert own avatar config" ON public."user_avatar_config";
DROP POLICY IF EXISTS "Users can insert own avatar items" ON public."user_avatar_items";
DROP POLICY IF EXISTS "Users can insert own combos" ON public."user_combos";
DROP POLICY IF EXISTS "Users can insert own filters" ON public."saved_filters";
DROP POLICY IF EXISTS "Users can insert own league" ON public."user_leagues";
DROP POLICY IF EXISTS "Users can insert own onboarding" ON public."onboarding_progress";
DROP POLICY IF EXISTS "Users can insert own progress" ON public."module_progress";
DROP POLICY IF EXISTS "Users can insert own progress" ON public."user_mission_progress";
DROP POLICY IF EXISTS "Users can insert own progress" ON public."user_seasonal_progress";
DROP POLICY IF EXISTS "Users can insert progress for their pairs" ON public."mentorship_mission_progress";
DROP POLICY IF EXISTS "Users can insert their own 2FA settings" ON public."user_two_factor";
DROP POLICY IF EXISTS "Users can insert their own challenges" ON public."user_challenges";
DROP POLICY IF EXISTS "Users can insert their own credentials" ON public."webauthn_credentials";
DROP POLICY IF EXISTS "Users can insert their own messages" ON public."ai_coach_messages";
DROP POLICY IF EXISTS "Users can insert their own profile" ON public."profiles";
DROP POLICY IF EXISTS "Users can insert their own scores" ON public."quiz_scores";
DROP POLICY IF EXISTS "Users can insert their own telemetry" ON public."query_telemetry";
DROP POLICY IF EXISTS "Users can insert versions" ON public."entity_versions";
DROP POLICY IF EXISTS "Users can manage own celebrations" ON public."celebrations";
DROP POLICY IF EXISTS "Users can manage own demographic values" ON public."user_demographic_values";
DROP POLICY IF EXISTS "Users can manage own mood entries" ON public."mood_entries";
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public."notification_preferences";
DROP POLICY IF EXISTS "Users can manage own streaks" ON public."attendance_streaks";
DROP POLICY IF EXISTS "Users can manage their own challenges" ON public."webauthn_challenges";
DROP POLICY IF EXISTS "Users can mark as read" ON public."announcement_reads";
DROP POLICY IF EXISTS "Users can react to announcements" ON public."announcement_reactions";
DROP POLICY IF EXISTS "Users can remove their own reactions" ON public."activity_reactions";
DROP POLICY IF EXISTS "Users can submit responses" ON public."pulse_responses";
DROP POLICY IF EXISTS "Users can submit their responses" ON public."enps_responses";
DROP POLICY IF EXISTS "Users can update own avatar config" ON public."user_avatar_config";
DROP POLICY IF EXISTS "Users can update own combos" ON public."user_combos";
DROP POLICY IF EXISTS "Users can update own enrollments" ON public."trail_enrollments";
DROP POLICY IF EXISTS "Users can update own filters" ON public."saved_filters";
DROP POLICY IF EXISTS "Users can update own goals" ON public."goals";
DROP POLICY IF EXISTS "Users can update own onboarding" ON public."onboarding_progress";
DROP POLICY IF EXISTS "Users can update own profile" ON public."profiles";
DROP POLICY IF EXISTS "Users can update own progress" ON public."module_progress";
DROP POLICY IF EXISTS "Users can update own progress" ON public."user_mission_progress";
DROP POLICY IF EXISTS "Users can update own progress" ON public."user_seasonal_progress";
DROP POLICY IF EXISTS "Users can update own sessions" ON public."session_logs";
DROP POLICY IF EXISTS "Users can update plan actions" ON public."development_plan_actions";
DROP POLICY IF EXISTS "Users can update requests targeting them" ON public."mentorship_requests";
DROP POLICY IF EXISTS "Users can update their duels" ON public."direct_duels";
DROP POLICY IF EXISTS "Users can update their own 2FA settings" ON public."user_two_factor";
DROP POLICY IF EXISTS "Users can update their own alerts" ON public."new_device_alerts";
DROP POLICY IF EXISTS "Users can update their own challenges" ON public."user_challenges";
DROP POLICY IF EXISTS "Users can update their own comments" ON public."activity_comments";
DROP POLICY IF EXISTS "Users can update their own credentials" ON public."webauthn_credentials";
DROP POLICY IF EXISTS "Users can update their own devices" ON public."user_devices";
DROP POLICY IF EXISTS "Users can update their own notifications" ON public."notifications";
DROP POLICY IF EXISTS "Users can update their own pairs" ON public."mentorship_pairs";
DROP POLICY IF EXISTS "Users can update their own progress" ON public."quest_assignments";
DROP POLICY IF EXISTS "Users can update their pair progress" ON public."mentorship_mission_progress";
DROP POLICY IF EXISTS "Users can update their requests" ON public."feedback_requests";
DROP POLICY IF EXISTS "Users can view active surveys for their department" ON public."pulse_surveys";
DROP POLICY IF EXISTS "Users can view any avatar config" ON public."user_avatar_config";
DROP POLICY IF EXISTS "Users can view company goals" ON public."goals";
DROP POLICY IF EXISTS "Users can view others avatar items for display" ON public."user_avatar_items";
DROP POLICY IF EXISTS "Users can view own achievements" ON public."user_achievements";
DROP POLICY IF EXISTS "Users can view own approval trail" ON public."purchase_approvals";
DROP POLICY IF EXISTS "Users can view own attendance" ON public."attendance_records";
DROP POLICY IF EXISTS "Users can view own audit logs" ON public."audit_logs";
DROP POLICY IF EXISTS "Users can view own avatar items" ON public."user_avatar_items";
DROP POLICY IF EXISTS "Users can view own certifications" ON public."user_certifications";
DROP POLICY IF EXISTS "Users can view own combos" ON public."user_combos";
DROP POLICY IF EXISTS "Users can view own enrollments" ON public."trail_enrollments";
DROP POLICY IF EXISTS "Users can view own external tasks" ON public."external_tasks";
DROP POLICY IF EXISTS "Users can view own filters" ON public."saved_filters";
DROP POLICY IF EXISTS "Users can view own goals" ON public."goals";
DROP POLICY IF EXISTS "Users can view own onboarding" ON public."onboarding_progress";
DROP POLICY IF EXISTS "Users can view own password reset requests" ON public."password_reset_requests";
DROP POLICY IF EXISTS "Users can view own penalties" ON public."task_penalties";
DROP POLICY IF EXISTS "Users can view own permission groups" ON public."user_permission_groups";
DROP POLICY IF EXISTS "Users can view own positions" ON public."user_positions";
DROP POLICY IF EXISTS "Users can view own progress" ON public."module_progress";
DROP POLICY IF EXISTS "Users can view own progress" ON public."user_mission_progress";
DROP POLICY IF EXISTS "Users can view own progress" ON public."user_seasonal_progress";
DROP POLICY IF EXISTS "Users can view own purchases" ON public."shop_purchases";
DROP POLICY IF EXISTS "Users can view own quiz answers" ON public."quiz_answers";
DROP POLICY IF EXISTS "Users can view own reads" ON public."announcement_reads";
DROP POLICY IF EXISTS "Users can view own responses" ON public."climate_survey_responses";
DROP POLICY IF EXISTS "Users can view own responses" ON public."pulse_responses";
DROP POLICY IF EXISTS "Users can view own sessions" ON public."session_logs";
DROP POLICY IF EXISTS "Users can view own streaks" ON public."attendance_streaks";
DROP POLICY IF EXISTS "Users can view own task scores" ON public."task_scores";
DROP POLICY IF EXISTS "Users can view own titles" ON public."user_titles";
DROP POLICY IF EXISTS "Users can view public celebrations" ON public."celebrations";
DROP POLICY IF EXISTS "Users can view team goals" ON public."goals";
DROP POLICY IF EXISTS "Users can view their duels" ON public."direct_duels";
DROP POLICY IF EXISTS "Users can view their feedback requests" ON public."feedback_requests";
DROP POLICY IF EXISTS "Users can view their own 2FA settings" ON public."user_two_factor";
DROP POLICY IF EXISTS "Users can view their own alerts" ON public."new_device_alerts";
DROP POLICY IF EXISTS "Users can view their own assignments" ON public."quest_assignments";
DROP POLICY IF EXISTS "Users can view their own challenges" ON public."user_challenges";
DROP POLICY IF EXISTS "Users can view their own credentials" ON public."webauthn_credentials";
DROP POLICY IF EXISTS "Users can view their own development plans" ON public."development_plans";
DROP POLICY IF EXISTS "Users can view their own devices" ON public."user_devices";
DROP POLICY IF EXISTS "Users can view their own evaluations" ON public."nine_box_evaluations";
DROP POLICY IF EXISTS "Users can view their own mentorship pairs" ON public."mentorship_pairs";
DROP POLICY IF EXISTS "Users can view their own messages" ON public."ai_coach_messages";
DROP POLICY IF EXISTS "Users can view their own notifications" ON public."notifications";
DROP POLICY IF EXISTS "Users can view their own responses" ON public."enps_responses";
DROP POLICY IF EXISTS "Users can view their own roles" ON public."user_roles";
DROP POLICY IF EXISTS "Users can view their own team membership" ON public."team_members";
DROP POLICY IF EXISTS "Users can view their pair progress" ON public."mentorship_mission_progress";
DROP POLICY IF EXISTS "Users can view their plan actions" ON public."development_plan_actions";
DROP POLICY IF EXISTS "Users can view their requests" ON public."mentorship_requests";
DROP POLICY IF EXISTS "Users can view versions" ON public."entity_versions";
DROP POLICY IF EXISTS "Users create own ai course jobs" ON public."ai_course_jobs";
DROP POLICY IF EXISTS "Users insert own evaluations" ON public."feedback_evaluations";
DROP POLICY IF EXISTS "Users insert own push sync events" ON public."push_sync_events";
DROP POLICY IF EXISTS "Users manage own push subs" ON public."push_subscriptions";
DROP POLICY IF EXISTS "Users manage their own opinion supports" ON public."opinion_supports";
DROP POLICY IF EXISTS "Users read own push logs" ON public."push_notification_logs";
DROP POLICY IF EXISTS "Users read own push sync events" ON public."push_sync_events";
DROP POLICY IF EXISTS "Users update own ai course jobs" ON public."ai_course_jobs";
DROP POLICY IF EXISTS "Users view own ai course jobs" ON public."ai_course_jobs";
DROP POLICY IF EXISTS "Users view own answers" ON public."climate_question_answers";
DROP POLICY IF EXISTS "Users view own spins" ON public."lucky_wheel_spins";
DROP POLICY IF EXISTS "Usuario ve a propria cartela" ON public."bingo_cards";
DROP POLICY IF EXISTS "Usuario ve as proprias contribuicoes" ON public."department_war_contributions";
DROP POLICY IF EXISTS "Usuario ve as proprias marcacoes" ON public."bingo_marks";
DROP POLICY IF EXISTS "Usuário vê os próprios aportes" ON public."prediction_stakes";
DROP POLICY IF EXISTS "View action plan items" ON public."action_plan_items";
DROP POLICY IF EXISTS "View action plan updates" ON public."action_plan_updates";
DROP POLICY IF EXISTS "View action plans" ON public."action_plans";
DROP POLICY IF EXISTS "View opinion responses" ON public."opinion_responses";
DROP POLICY IF EXISTS "View opinions" ON public."opinions";
DROP POLICY IF EXISTS "View survey questions" ON public."climate_survey_questions";
DROP POLICY IF EXISTS "auction_admin_events_admin_all" ON public."auction_admin_events";
DROP POLICY IF EXISTS "auction_admin_events_admin_read" ON public."auction_admin_events";
DROP POLICY IF EXISTS "auction_bids_admin_all" ON public."auction_bids";
DROP POLICY IF EXISTS "auction_bids_select_own" ON public."auction_bids";
DROP POLICY IF EXISTS "auction_bids_user_own" ON public."auction_bids";
DROP POLICY IF EXISTS "auctions_admin_all" ON public."auctions";
DROP POLICY IF EXISTS "auctions_admin_write" ON public."auctions";
DROP POLICY IF EXISTS "auctions_select_published" ON public."auctions";
DROP POLICY IF EXISTS "auctions_user_select" ON public."auctions";
DROP POLICY IF EXISTS "bingo_board_tasks_admin_all" ON public."bingo_board_tasks";
DROP POLICY IF EXISTS "bingo_board_tasks_user_select" ON public."bingo_board_tasks";
DROP POLICY IF EXISTS "bingo_boards_admin_all" ON public."bingo_boards";
DROP POLICY IF EXISTS "bingo_boards_user_select" ON public."bingo_boards";
DROP POLICY IF EXISTS "bingo_cards_admin_all" ON public."bingo_cards";
DROP POLICY IF EXISTS "bingo_cards_user_own" ON public."bingo_cards";
DROP POLICY IF EXISTS "bingo_marks_admin_select" ON public."bingo_marks";
DROP POLICY IF EXISTS "bingo_marks_user_own" ON public."bingo_marks";
DROP POLICY IF EXISTS "board_moves_admin_all" ON public."board_moves";
DROP POLICY IF EXISTS "board_moves_select_own" ON public."board_moves";
DROP POLICY IF EXISTS "board_moves_user_select" ON public."board_moves";
DROP POLICY IF EXISTS "board_player_states_admin_all" ON public."board_player_states";
DROP POLICY IF EXISTS "board_player_states_manager_select" ON public."board_player_states";
DROP POLICY IF EXISTS "board_player_states_user_own" ON public."board_player_states";
DROP POLICY IF EXISTS "board_states_select_own" ON public."board_player_states";
DROP POLICY IF EXISTS "board_tiles_admin_all" ON public."board_tiles";
DROP POLICY IF EXISTS "board_tiles_manage" ON public."board_tiles";
DROP POLICY IF EXISTS "board_tiles_select" ON public."board_tiles";
DROP POLICY IF EXISTS "board_tiles_user_select" ON public."board_tiles";
DROP POLICY IF EXISTS "board_trails_admin_all" ON public."board_trails";
DROP POLICY IF EXISTS "board_trails_manage" ON public."board_trails";
DROP POLICY IF EXISTS "board_trails_select_active" ON public."board_trails";
DROP POLICY IF EXISTS "board_trails_user_select" ON public."board_trails";
DROP POLICY IF EXISTS "boss_battle_damage_admin_all" ON public."boss_battle_damage";
DROP POLICY IF EXISTS "boss_battle_damage_user_select" ON public."boss_battle_damage";
DROP POLICY IF EXISTS "boss_battle_rewards_admin_all" ON public."boss_battle_rewards";
DROP POLICY IF EXISTS "boss_battle_rewards_user_select" ON public."boss_battle_rewards";
DROP POLICY IF EXISTS "boss_battles_admin_all" ON public."boss_battles";
DROP POLICY IF EXISTS "boss_battles_manage_admin" ON public."boss_battles";
DROP POLICY IF EXISTS "boss_battles_select_authenticated" ON public."boss_battles";
DROP POLICY IF EXISTS "boss_battles_user_select" ON public."boss_battles";
DROP POLICY IF EXISTS "boss_damage_select" ON public."boss_battle_damage";
DROP POLICY IF EXISTS "boss_rewards_select" ON public."boss_battle_rewards";
DROP POLICY IF EXISTS "boss_win_rate_goals_admin_all" ON public."boss_win_rate_goals";
DROP POLICY IF EXISTS "boss_win_rate_goals_select" ON public."boss_win_rate_goals";
DROP POLICY IF EXISTS "campaign_events_insert_self_or_admin" ON public."campaign_progress_events";
DROP POLICY IF EXISTS "campaign_events_select_authenticated" ON public."campaign_progress_events";
DROP POLICY IF EXISTS "campaign_imports_admin_all" ON public."campaign_result_imports";
DROP POLICY IF EXISTS "campaign_imports_creator_select" ON public."campaign_result_imports";
DROP POLICY IF EXISTS "campaign_imports_delete_admin" ON public."campaign_result_imports";
DROP POLICY IF EXISTS "campaign_imports_insert_staff" ON public."campaign_result_imports";
DROP POLICY IF EXISTS "campaign_imports_select_staff" ON public."campaign_result_imports";
DROP POLICY IF EXISTS "campaign_imports_update_staff" ON public."campaign_result_imports";
DROP POLICY IF EXISTS "campaign_result_rows_admin_all" ON public."campaign_result_rows";
DROP POLICY IF EXISTS "campaign_rows_delete_admin" ON public."campaign_result_rows";
DROP POLICY IF EXISTS "campaign_rows_insert_staff" ON public."campaign_result_rows";
DROP POLICY IF EXISTS "campaign_rows_select_staff" ON public."campaign_result_rows";
DROP POLICY IF EXISTS "campaign_rows_update_staff" ON public."campaign_result_rows";
DROP POLICY IF EXISTS "campaign_team_members_admin_all" ON public."campaign_team_members";
DROP POLICY IF EXISTS "campaign_team_members_manage_staff" ON public."campaign_team_members";
DROP POLICY IF EXISTS "campaign_team_members_select" ON public."campaign_team_members";
DROP POLICY IF EXISTS "campaign_team_members_select_authenticated" ON public."campaign_team_members";
DROP POLICY IF EXISTS "campaign_team_split_batches_admin_all" ON public."campaign_team_split_batches";
DROP POLICY IF EXISTS "campaign_team_split_entries_admin_all" ON public."campaign_team_split_entries";
DROP POLICY IF EXISTS "campaign_teams_admin_all" ON public."campaign_teams";
DROP POLICY IF EXISTS "campaign_teams_manage_staff" ON public."campaign_teams";
DROP POLICY IF EXISTS "campaign_teams_select_authenticated" ON public."campaign_teams";
DROP POLICY IF EXISTS "campaign_teams_user_select" ON public."campaign_teams";
DROP POLICY IF EXISTS "campaigns_delete_admin" ON public."sales_campaigns";
DROP POLICY IF EXISTS "campaigns_insert_admin_manager" ON public."sales_campaigns";
DROP POLICY IF EXISTS "campaigns_select_authenticated" ON public."sales_campaigns";
DROP POLICY IF EXISTS "campaigns_update_admin_manager" ON public."sales_campaigns";
DROP POLICY IF EXISTS "card_definitions_admin_all" ON public."card_definitions";
DROP POLICY IF EXISTS "card_definitions_select_auth" ON public."card_definitions";
DROP POLICY IF EXISTS "card_definitions_user_select" ON public."card_definitions";
DROP POLICY IF EXISTS "card_packs_admin_all" ON public."card_packs";
DROP POLICY IF EXISTS "card_packs_admin_select" ON public."card_packs";
DROP POLICY IF EXISTS "card_packs_select_own" ON public."card_packs";
DROP POLICY IF EXISTS "card_packs_user_select" ON public."card_packs";
DROP POLICY IF EXISTS "card_set_claims_admin_all" ON public."card_set_claims";
DROP POLICY IF EXISTS "card_set_claims_user_own" ON public."card_set_claims";
DROP POLICY IF EXISTS "card_trades_admin_all" ON public."card_trades";
DROP POLICY IF EXISTS "card_trades_participants_select" ON public."card_trades";
DROP POLICY IF EXISTS "card_trades_participants_update" ON public."card_trades";
DROP POLICY IF EXISTS "card_trades_proposer_insert" ON public."card_trades";
DROP POLICY IF EXISTS "card_trades_select_involved" ON public."card_trades";
DROP POLICY IF EXISTS "department_war_contributions_admin_all" ON public."department_war_contributions";
DROP POLICY IF EXISTS "department_war_contributions_user_select" ON public."department_war_contributions";
DROP POLICY IF EXISTS "department_war_metrics_admin_all" ON public."department_war_metrics";
DROP POLICY IF EXISTS "department_war_metrics_user_select" ON public."department_war_metrics";
DROP POLICY IF EXISTS "department_wars_admin_all" ON public."department_wars";
DROP POLICY IF EXISTS "department_wars_user_select" ON public."department_wars";
DROP POLICY IF EXISTS "dept_war_departments_admin_all" ON public."department_war_departments";
DROP POLICY IF EXISTS "dept_war_departments_select" ON public."department_war_departments";
DROP POLICY IF EXISTS "dept_war_results_admin_all" ON public."department_war_results";
DROP POLICY IF EXISTS "dept_war_results_select" ON public."department_war_results";
DROP POLICY IF EXISTS "eanswers_own_insert" ON public."engagement_answers";
DROP POLICY IF EXISTS "eanswers_own_select" ON public."engagement_answers";
DROP POLICY IF EXISTS "ecycles_admin_write" ON public."engagement_cycles";
DROP POLICY IF EXISTS "ecycles_select" ON public."engagement_cycles";
DROP POLICY IF EXISTS "engagement_action_playbooks_admin_all" ON public."engagement_action_playbooks";
DROP POLICY IF EXISTS "engagement_action_playbooks_manager_select" ON public."engagement_action_playbooks";
DROP POLICY IF EXISTS "engagement_answers_admin_all" ON public."engagement_answers";
DROP POLICY IF EXISTS "engagement_answers_manager_select" ON public."engagement_answers";
DROP POLICY IF EXISTS "engagement_answers_user_insert" ON public."engagement_answers";
DROP POLICY IF EXISTS "engagement_answers_user_select_own" ON public."engagement_answers";
DROP POLICY IF EXISTS "engagement_cycles_admin_all" ON public."engagement_cycles";
DROP POLICY IF EXISTS "engagement_cycles_user_select" ON public."engagement_cycles";
DROP POLICY IF EXISTS "engagement_factors_admin_all" ON public."engagement_factors";
DROP POLICY IF EXISTS "engagement_factors_admin_write" ON public."engagement_factors";
DROP POLICY IF EXISTS "engagement_factors_select" ON public."engagement_factors";
DROP POLICY IF EXISTS "engagement_factors_user_select" ON public."engagement_factors";
DROP POLICY IF EXISTS "engagement_question_assignments_admin_all" ON public."engagement_question_assignments";
DROP POLICY IF EXISTS "engagement_question_assignments_user_own" ON public."engagement_question_assignments";
DROP POLICY IF EXISTS "engagement_question_pool_admin_all" ON public."engagement_question_pool";
DROP POLICY IF EXISTS "engagement_question_pool_user_select" ON public."engagement_question_pool";
DROP POLICY IF EXISTS "eqa_admin_delete" ON public."engagement_question_assignments";
DROP POLICY IF EXISTS "eqa_own_insert" ON public."engagement_question_assignments";
DROP POLICY IF EXISTS "eqa_own_select" ON public."engagement_question_assignments";
DROP POLICY IF EXISTS "eqa_own_update" ON public."engagement_question_assignments";
DROP POLICY IF EXISTS "eqp_admin_write" ON public."engagement_question_pool";
DROP POLICY IF EXISTS "eqp_select" ON public."engagement_question_pool";
DROP POLICY IF EXISTS "feedback_evaluations_select" ON public."feedback_evaluations";
DROP POLICY IF EXISTS "feedback_evaluations_update" ON public."feedback_evaluations";
DROP POLICY IF EXISTS "feedback_questions_select" ON public."feedback_questions";
DROP POLICY IF EXISTS "feedback_results_select" ON public."feedback_results";
DROP POLICY IF EXISTS "goal_templates_delete" ON public."goal_templates";
DROP POLICY IF EXISTS "goal_templates_insert" ON public."goal_templates";
DROP POLICY IF EXISTS "goal_templates_select" ON public."goal_templates";
DROP POLICY IF EXISTS "goal_templates_update" ON public."goal_templates";
DROP POLICY IF EXISTS "lightning_answers_select_own" ON public."lightning_quiz_answers";
DROP POLICY IF EXISTS "lightning_questions_admin_manage" ON public."lightning_quiz_questions";
DROP POLICY IF EXISTS "lightning_quiz_answers_admin_all" ON public."lightning_quiz_answers";
DROP POLICY IF EXISTS "lightning_quiz_answers_admin_select" ON public."lightning_quiz_answers";
DROP POLICY IF EXISTS "lightning_quiz_answers_user_select" ON public."lightning_quiz_answers";
DROP POLICY IF EXISTS "lightning_quiz_questions_admin_all" ON public."lightning_quiz_questions";
DROP POLICY IF EXISTS "lightning_quiz_questions_user_select" ON public."lightning_quiz_questions";
DROP POLICY IF EXISTS "lightning_quiz_sessions_admin_all" ON public."lightning_quiz_sessions";
DROP POLICY IF EXISTS "lightning_quiz_sessions_user_own" ON public."lightning_quiz_sessions";
DROP POLICY IF EXISTS "lightning_sessions_select_own" ON public."lightning_quiz_sessions";
DROP POLICY IF EXISTS "lucky_wheel_payout_snapshots_admin_all" ON public."lucky_wheel_payout_snapshots";
DROP POLICY IF EXISTS "lucky_wheel_prize_audit_admin_select" ON public."lucky_wheel_prize_audit";
DROP POLICY IF EXISTS "lucky_wheel_prizes_admin_all" ON public."lucky_wheel_prizes";
DROP POLICY IF EXISTS "lucky_wheel_prizes_user_select" ON public."lucky_wheel_prizes";
DROP POLICY IF EXISTS "lucky_wheel_settings_admin_all" ON public."lucky_wheel_settings";
DROP POLICY IF EXISTS "lucky_wheel_settings_audit_admin_all" ON public."lucky_wheel_settings_audit";
DROP POLICY IF EXISTS "lucky_wheel_spins_admin_all" ON public."lucky_wheel_spins";
DROP POLICY IF EXISTS "lucky_wheel_spins_user_select" ON public."lucky_wheel_spins";
DROP POLICY IF EXISTS "lucky_wheel_whatif_snapshots_admin_all" ON public."lucky_wheel_whatif_snapshots";
DROP POLICY IF EXISTS "memory_decks_admin_all" ON public."memory_decks";
DROP POLICY IF EXISTS "memory_decks_admin_write" ON public."memory_decks";
DROP POLICY IF EXISTS "memory_decks_select" ON public."memory_decks";
DROP POLICY IF EXISTS "memory_decks_user_select" ON public."memory_decks";
DROP POLICY IF EXISTS "memory_pairs_admin_all" ON public."memory_pairs";
DROP POLICY IF EXISTS "memory_pairs_admin_write" ON public."memory_pairs";
DROP POLICY IF EXISTS "memory_pairs_select" ON public."memory_pairs";
DROP POLICY IF EXISTS "memory_pairs_user_select" ON public."memory_pairs";
DROP POLICY IF EXISTS "memory_sessions_admin_all" ON public."memory_sessions";
DROP POLICY IF EXISTS "memory_sessions_select_own" ON public."memory_sessions";
DROP POLICY IF EXISTS "memory_sessions_user_own" ON public."memory_sessions";
DROP POLICY IF EXISTS "notification_templates_select" ON public."notification_templates";
DROP POLICY IF EXISTS "nr1_categories_admin_write" ON public."nr1_risk_categories";
DROP POLICY IF EXISTS "nr1_categories_select" ON public."nr1_risk_categories";
DROP POLICY IF EXISTS "nr1_factor_mappings_admin_all" ON public."nr1_factor_mappings";
DROP POLICY IF EXISTS "nr1_factor_mappings_select" ON public."nr1_factor_mappings";
DROP POLICY IF EXISTS "nr1_mappings_admin_write" ON public."nr1_factor_mappings";
DROP POLICY IF EXISTS "nr1_mappings_select" ON public."nr1_factor_mappings";
DROP POLICY IF EXISTS "nr1_risk_categories_admin_all" ON public."nr1_risk_categories";
DROP POLICY IF EXISTS "nr1_risk_categories_select" ON public."nr1_risk_categories";
DROP POLICY IF EXISTS "opinion_supports_select" ON public."opinion_supports";
DROP POLICY IF EXISTS "opinion_supports_user_own" ON public."opinion_supports";
DROP POLICY IF EXISTS "own_card_set_claims_select" ON public."card_set_claims";
DROP POLICY IF EXISTS "participants_delete_admin" ON public."campaign_participants";
DROP POLICY IF EXISTS "participants_insert_self_or_admin" ON public."campaign_participants";
DROP POLICY IF EXISTS "participants_select_authenticated" ON public."campaign_participants";
DROP POLICY IF EXISTS "participants_update_self_or_admin" ON public."campaign_participants";
DROP POLICY IF EXISTS "pdi_checkins_insert" ON public."pdi_checkins";
DROP POLICY IF EXISTS "pdi_checkins_select" ON public."pdi_checkins";
DROP POLICY IF EXISTS "pdi_mentors_delete" ON public."pdi_mentors";
DROP POLICY IF EXISTS "pdi_mentors_select" ON public."pdi_mentors";
DROP POLICY IF EXISTS "pdi_templates_delete_admin" ON public."pdi_templates";
DROP POLICY IF EXISTS "pdi_templates_insert_admin" ON public."pdi_templates";
DROP POLICY IF EXISTS "pdi_templates_select" ON public."pdi_templates";
DROP POLICY IF EXISTS "pdi_templates_update_admin" ON public."pdi_templates";
DROP POLICY IF EXISTS "permissions_select" ON public."permissions";
DROP POLICY IF EXISTS "playbooks_admin_write" ON public."engagement_action_playbooks";
DROP POLICY IF EXISTS "playbooks_select" ON public."engagement_action_playbooks";
DROP POLICY IF EXISTS "position_competencies_select" ON public."position_competencies";
DROP POLICY IF EXISTS "prediction_admin_events_admin_all" ON public."prediction_admin_events";
DROP POLICY IF EXISTS "prediction_markets_admin_all" ON public."prediction_markets";
DROP POLICY IF EXISTS "prediction_markets_user_select" ON public."prediction_markets";
DROP POLICY IF EXISTS "prediction_options_admin_all" ON public."prediction_options";
DROP POLICY IF EXISTS "prediction_options_user_select" ON public."prediction_options";
DROP POLICY IF EXISTS "prediction_stakes_admin_all" ON public."prediction_stakes";
DROP POLICY IF EXISTS "prediction_stakes_user_own" ON public."prediction_stakes";
DROP POLICY IF EXISTS "purchase_approvals_admin_all" ON public."purchase_approvals";
DROP POLICY IF EXISTS "purchase_approvals_user_select" ON public."purchase_approvals";
DROP POLICY IF EXISTS "push_outbox_admin_all" ON public."push_outbox";
DROP POLICY IF EXISTS "push_outbox_health_admin_all" ON public."push_outbox_health_snapshots";
DROP POLICY IF EXISTS "push_outbox_user_select" ON public."push_outbox";
DROP POLICY IF EXISTS "push_sync_events_admin_select" ON public."push_sync_events";
DROP POLICY IF EXISTS "push_sync_events_authenticated_insert" ON public."push_sync_events";
DROP POLICY IF EXISTS "push_sync_events_user_select" ON public."push_sync_events";
DROP POLICY IF EXISTS "role_permissions_select" ON public."role_permissions";
DROP POLICY IF EXISTS "roles_select" ON public."roles";
DROP POLICY IF EXISTS "scratch_card_prizes_admin_all" ON public."scratch_card_prizes";
DROP POLICY IF EXISTS "scratch_card_prizes_user_select" ON public."scratch_card_prizes";
DROP POLICY IF EXISTS "scratch_cards_admin_all" ON public."scratch_cards";
DROP POLICY IF EXISTS "scratch_cards_select_own" ON public."scratch_cards";
DROP POLICY IF EXISTS "scratch_cards_user_insert" ON public."scratch_cards";
DROP POLICY IF EXISTS "scratch_cards_user_select" ON public."scratch_cards";
DROP POLICY IF EXISTS "scratch_cards_user_update" ON public."scratch_cards";
DROP POLICY IF EXISTS "scratch_prizes_admin_manage" ON public."scratch_card_prizes";
DROP POLICY IF EXISTS "scratch_prizes_select_admin" ON public."scratch_card_prizes";
DROP POLICY IF EXISTS "sequence_attempts_admin_all" ON public."sequence_attempts";
DROP POLICY IF EXISTS "sequence_attempts_select_own" ON public."sequence_attempts";
DROP POLICY IF EXISTS "sequence_attempts_user_own" ON public."sequence_attempts";
DROP POLICY IF EXISTS "sequence_procedures_admin_all" ON public."sequence_procedures";
DROP POLICY IF EXISTS "sequence_procedures_admin_write" ON public."sequence_procedures";
DROP POLICY IF EXISTS "sequence_procedures_select" ON public."sequence_procedures";
DROP POLICY IF EXISTS "sequence_procedures_user_select" ON public."sequence_procedures";
DROP POLICY IF EXISTS "sequence_steps_admin_all" ON public."sequence_steps";
DROP POLICY IF EXISTS "sequence_steps_admin_write" ON public."sequence_steps";
DROP POLICY IF EXISTS "sequence_steps_select_staff" ON public."sequence_steps";
DROP POLICY IF EXISTS "sequence_steps_user_select" ON public."sequence_steps";
DROP POLICY IF EXISTS "team_split_batches_select_staff" ON public."campaign_team_split_batches";
DROP POLICY IF EXISTS "team_split_entries_select_staff" ON public."campaign_team_split_entries";
DROP POLICY IF EXISTS "tournament_matches_admin_all" ON public."tournament_matches";
DROP POLICY IF EXISTS "tournament_matches_user_select" ON public."tournament_matches";
DROP POLICY IF EXISTS "tournament_participants_admin_all" ON public."tournament_participants";
DROP POLICY IF EXISTS "tournament_participants_user_select" ON public."tournament_participants";
DROP POLICY IF EXISTS "tournaments_admin_all" ON public."tournaments";
DROP POLICY IF EXISTS "tournaments_user_select" ON public."tournaments";
DROP POLICY IF EXISTS "user_cards_admin_select" ON public."user_cards";
DROP POLICY IF EXISTS "user_cards_select_own" ON public."user_cards";
DROP POLICY IF EXISTS "user_cards_user_all" ON public."user_cards";
DROP POLICY IF EXISTS "user_competency_assessments_select" ON public."user_competency_assessments";
DROP POLICY IF EXISTS "wager_budget_settings_admin_all" ON public."wager_budget_settings";
DROP POLICY IF EXISTS "wager_budget_settings_manager_select" ON public."wager_budget_settings";
DROP POLICY IF EXISTS "wager_entries_admin_manage" ON public."wager_entries";
DROP POLICY IF EXISTS "wager_entries_admin_select" ON public."wager_entries";
DROP POLICY IF EXISTS "wager_entries_read_own" ON public."wager_entries";
DROP POLICY IF EXISTS "wager_entries_user_select" ON public."wager_entries";
DROP POLICY IF EXISTS "wager_integrity_review_events_admin_all" ON public."wager_integrity_review_events";
DROP POLICY IF EXISTS "wager_integrity_reviews_admin_all" ON public."wager_integrity_reviews";
DROP POLICY IF EXISTS "wager_questions_admin_all" ON public."wager_questions";
DROP POLICY IF EXISTS "wager_questions_manage" ON public."wager_questions";
DROP POLICY IF EXISTS "wager_questions_read_active" ON public."wager_questions";
DROP POLICY IF EXISTS "wager_questions_user_select" ON public."wager_questions";

-- 2) Recria o conjunto de producao (548 policies).
CREATE POLICY "Admins can manage achievements" ON public.achievements AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view achievements" ON public.achievements AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Manage action plan items" ON public.action_plan_items AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM action_plans ap
  WHERE ((ap.id = action_plan_items.plan_id) AND ((ap.owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))))));
CREATE POLICY "View action plan items" ON public.action_plan_items AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM action_plans ap
  WHERE ((ap.id = action_plan_items.plan_id) AND ((ap.owner_id = auth.uid()) OR (ap.reviewer_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))))));
CREATE POLICY "Create action plan updates" ON public.action_plan_updates AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "View action plan updates" ON public.action_plan_updates AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM action_plans ap
  WHERE ((ap.id = action_plan_updates.plan_id) AND ((ap.owner_id = auth.uid()) OR (ap.reviewer_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))))));
CREATE POLICY "Admins delete action plans" ON public.action_plans AS PERMISSIVE FOR DELETE TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR (owner_id = auth.uid())));
CREATE POLICY "Managers create action plans" ON public.action_plans AS PERMISSIVE FOR INSERT TO public WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Owners update action plans" ON public.action_plans AS PERMISSIVE FOR UPDATE TO public USING (((owner_id = auth.uid()) OR (reviewer_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "View action plans" ON public.action_plans AS PERMISSIVE FOR SELECT TO public USING (((owner_id = auth.uid()) OR (reviewer_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Authenticated users can create comments" ON public.activity_comments AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Everyone can view comments" ON public.activity_comments AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can delete their own comments" ON public.activity_comments AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own comments" ON public.activity_comments AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Authenticated users can add reactions" ON public.activity_reactions AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Everyone can view reactions" ON public.activity_reactions AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can remove their own reactions" ON public.activity_reactions AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own messages" ON public.ai_coach_messages AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own messages" ON public.ai_coach_messages AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own messages" ON public.ai_coach_messages AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users create own ai course jobs" ON public.ai_course_jobs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users update own ai course jobs" ON public.ai_course_jobs AS PERMISSIVE FOR UPDATE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))) WITH CHECK (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users view own ai course jobs" ON public.ai_course_jobs AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Everyone can view reactions" ON public.announcement_reactions AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can react to announcements" ON public.announcement_reactions AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid()));
CREATE POLICY "Users can mark as read" ON public.announcement_reads AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can view own reads" ON public.announcement_reads AS PERMISSIVE FOR SELECT TO public USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can delete announcements" ON public.announcements AS PERMISSIVE FOR DELETE TO public USING (((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Authors can manage own announcements" ON public.announcements AS PERMISSIVE FOR UPDATE TO public USING (((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Everyone can view published announcements" ON public.announcements AS PERMISSIVE FOR SELECT TO public USING (((published_at IS NOT NULL) AND (published_at <= now()) AND ((expires_at IS NULL) OR (expires_at > now())) AND ((department_id IS NULL) OR (department_id IN ( SELECT team_members.department_id
   FROM team_members
  WHERE (team_members.user_id = auth.uid()))))));
CREATE POLICY "Managers can create announcements" ON public.announcements AS PERMISSIVE FOR INSERT TO public WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Admins can view API logs" ON public.api_request_logs AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Managers can view team attendance" ON public.attendance_records AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Users can insert own attendance" ON public.attendance_records AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view own attendance" ON public.attendance_records AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage settings" ON public.attendance_settings AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view settings" ON public.attendance_settings AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Managers can view all streaks" ON public.attendance_streaks AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Users can manage own streaks" ON public.attendance_streaks AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own streaks" ON public.attendance_streaks AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY auction_admin_events_admin_all ON public.auction_admin_events AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY auction_bids_admin_all ON public.auction_bids AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY auction_bids_user_own ON public.auction_bids AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY auctions_admin_all ON public.auctions AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY auctions_user_select ON public.auctions AS PERMISSIVE FOR SELECT TO authenticated USING (((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated insert audit logs" ON public.audit_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Managers can view team audit logs" ON public.audit_logs AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'manager'::app_role) AND (EXISTS ( SELECT 1
   FROM (team_members tm1
     JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))
  WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = audit_logs.user_id))))));
CREATE POLICY "Users can view own audit logs" ON public.audit_logs AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage avatar items" ON public.avatar_items AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view active avatar items" ON public.avatar_items AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY bingo_board_tasks_admin_all ON public.bingo_board_tasks AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY bingo_board_tasks_user_select ON public.bingo_board_tasks AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY bingo_boards_admin_all ON public.bingo_boards AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY bingo_boards_user_select ON public.bingo_boards AS PERMISSIVE FOR SELECT TO authenticated USING ((is_active OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY bingo_cards_admin_all ON public.bingo_cards AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY bingo_cards_user_own ON public.bingo_cards AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY bingo_marks_admin_select ON public.bingo_marks AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY bingo_marks_user_own ON public.bingo_marks AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Admins and managers can view sync mappings" ON public.bitrix24_sync_mappings AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'manager'::app_role]))))));
CREATE POLICY "Admins can manage sync mappings" ON public.bitrix24_sync_mappings AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))));
CREATE POLICY "Admins can manage bitrix tokens" ON public.bitrix24_tokens AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))));
CREATE POLICY "Admins can view webhook logs" ON public.bitrix24_webhook_logs AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))));
CREATE POLICY "Authenticated insert webhook logs" ON public.bitrix24_webhook_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY "Admins can manage blocked_ips" ON public.blocked_ips AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY board_moves_admin_all ON public.board_moves AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY board_moves_user_select ON public.board_moves AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY board_player_states_admin_all ON public.board_player_states AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY board_player_states_manager_select ON public.board_player_states AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY board_player_states_user_own ON public.board_player_states AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY board_tiles_admin_all ON public.board_tiles AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY board_tiles_user_select ON public.board_tiles AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY board_trails_admin_all ON public.board_trails AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY board_trails_user_select ON public.board_trails AS PERMISSIVE FOR SELECT TO authenticated USING (((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY boss_battle_damage_admin_all ON public.boss_battle_damage AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY boss_battle_damage_user_select ON public.boss_battle_damage AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY boss_battle_rewards_admin_all ON public.boss_battle_rewards AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY boss_battle_rewards_user_select ON public.boss_battle_rewards AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY boss_battles_admin_all ON public.boss_battles AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY boss_battles_user_select ON public.boss_battles AS PERMISSIVE FOR SELECT TO authenticated USING (((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY boss_win_rate_goals_admin_all ON public.boss_win_rate_goals AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY boss_win_rate_goals_select ON public.boss_win_rate_goals AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY participants_delete_admin ON public.campaign_participants AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY participants_insert_self_or_admin ON public.campaign_participants AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY participants_select_authenticated ON public.campaign_participants AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY participants_update_self_or_admin ON public.campaign_participants AS PERMISSIVE FOR UPDATE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))) WITH CHECK (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY campaign_events_insert_self_or_admin ON public.campaign_progress_events AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY campaign_events_select_authenticated ON public.campaign_progress_events AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY campaign_imports_admin_all ON public.campaign_result_imports AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY campaign_imports_creator_select ON public.campaign_result_imports AS PERMISSIVE FOR SELECT TO authenticated USING ((created_by = auth.uid()));
CREATE POLICY campaign_result_rows_admin_all ON public.campaign_result_rows AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY campaign_team_members_admin_all ON public.campaign_team_members AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY campaign_team_members_select ON public.campaign_team_members AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY campaign_team_split_batches_admin_all ON public.campaign_team_split_batches AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY campaign_team_split_entries_admin_all ON public.campaign_team_split_entries AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY campaign_teams_admin_all ON public.campaign_teams AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY campaign_teams_user_select ON public.campaign_teams AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY card_definitions_admin_all ON public.card_definitions AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY card_definitions_user_select ON public.card_definitions AS PERMISSIVE FOR SELECT TO authenticated USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY card_packs_admin_all ON public.card_packs AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY card_packs_user_select ON public.card_packs AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY card_set_claims_admin_all ON public.card_set_claims AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY card_set_claims_user_own ON public.card_set_claims AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY card_trades_admin_all ON public.card_trades AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY card_trades_participants_select ON public.card_trades AS PERMISSIVE FOR SELECT TO authenticated USING (((proposer_id = auth.uid()) OR (responder_id = auth.uid())));
CREATE POLICY card_trades_participants_update ON public.card_trades AS PERMISSIVE FOR UPDATE TO authenticated USING (((proposer_id = auth.uid()) OR (responder_id = auth.uid())));
CREATE POLICY card_trades_proposer_insert ON public.card_trades AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((proposer_id = auth.uid()));
CREATE POLICY "Authenticated create celebrations" ON public.celebrations AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can manage own celebrations" ON public.celebrations AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid()));
CREATE POLICY "Users can view public celebrations" ON public.celebrations AS PERMISSIVE FOR SELECT TO public USING (((is_public = true) OR (user_id = auth.uid())));
CREATE POLICY "Admins can manage certifications" ON public.certifications AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view certifications" ON public.certifications AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Everyone can view templates" ON public.checkin_templates AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Managers can create templates" ON public.checkin_templates AS PERMISSIVE FOR INSERT TO public WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Template owners can manage" ON public.checkin_templates AS PERMISSIVE FOR ALL TO public USING (((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can view all checkins" ON public.checkins AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Managers can create checkins" ON public.checkins AS PERMISSIVE FOR INSERT TO public WITH CHECK ((manager_id = auth.uid()));
CREATE POLICY "Participants can update checkins" ON public.checkins AS PERMISSIVE FOR UPDATE TO public USING (((manager_id = auth.uid()) OR (employee_id = auth.uid())));
CREATE POLICY "Participants can view their checkins" ON public.checkins AS PERMISSIVE FOR SELECT TO public USING (((manager_id = auth.uid()) OR (employee_id = auth.uid())));
CREATE POLICY "Admins manage benchmarks" ON public.climate_benchmarks AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view benchmarks" ON public.climate_benchmarks AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Managers can view pillar scores" ON public.climate_pillar_scores AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "System can manage pillar scores" ON public.climate_pillar_scores AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users view own answers" ON public.climate_question_answers AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM climate_survey_responses r
  WHERE ((r.id = climate_question_answers.response_id) AND (r.user_id = auth.uid())))));
CREATE POLICY "Managers can add survey questions" ON public.climate_survey_questions AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM climate_surveys s
  WHERE ((s.id = climate_survey_questions.survey_id) AND ((s.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))))));
CREATE POLICY "Managers can delete draft survey questions" ON public.climate_survey_questions AS PERMISSIVE FOR DELETE TO public USING ((EXISTS ( SELECT 1
   FROM climate_surveys s
  WHERE ((s.id = climate_survey_questions.survey_id) AND (s.status = 'draft'::text) AND ((s.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))))));
CREATE POLICY "Managers can update survey questions" ON public.climate_survey_questions AS PERMISSIVE FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM climate_surveys s
  WHERE ((s.id = climate_survey_questions.survey_id) AND ((s.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))))));
CREATE POLICY "View survey questions" ON public.climate_survey_questions AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM climate_surveys s
  WHERE ((s.id = climate_survey_questions.survey_id) AND ((s.status = ANY (ARRAY['active'::text, 'completed'::text])) OR (s.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))))));
CREATE POLICY "Users can view own responses" ON public.climate_survey_responses AS PERMISSIVE FOR SELECT TO public USING ((user_id = auth.uid()));
CREATE POLICY "Admins can delete surveys" ON public.climate_surveys AS PERMISSIVE FOR DELETE TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Creators can update surveys" ON public.climate_surveys AS PERMISSIVE FOR UPDATE TO public USING (((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Everyone can view active surveys" ON public.climate_surveys AS PERMISSIVE FOR SELECT TO public USING (((status = ANY (ARRAY['active'::text, 'completed'::text])) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Managers can create climate surveys" ON public.climate_surveys AS PERMISSIVE FOR INSERT TO public WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Admins can manage competencies" ON public.competencies AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view competencies" ON public.competencies AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage badges" ON public.custom_badges AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view active badges" ON public.custom_badges AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Everyone can view active quests" ON public.custom_quests AS PERMISSIVE FOR SELECT TO public USING (((status = 'active'::quest_status) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Managers and admins can create quests" ON public.custom_quests AS PERMISSIVE FOR INSERT TO public WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Managers and admins can delete their quests" ON public.custom_quests AS PERMISSIVE FOR DELETE TO public USING (((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Managers and admins can update their quests" ON public.custom_quests AS PERMISSIVE FOR UPDATE TO public USING (((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can manage ranks" ON public.custom_ranks AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view ranks" ON public.custom_ranks AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage titles" ON public.custom_titles AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view active titles" ON public.custom_titles AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can manage demographic attributes" ON public.demographic_attributes AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view active demographic attributes" ON public.demographic_attributes AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can manage missions" ON public.department_missions AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view active missions" ON public.department_missions AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Everyone can view rankings" ON public.department_rankings AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "System can manage rankings" ON public.department_rankings AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY department_war_contributions_admin_all ON public.department_war_contributions AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY department_war_contributions_user_select ON public.department_war_contributions AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY dept_war_departments_admin_all ON public.department_war_departments AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY dept_war_departments_select ON public.department_war_departments AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY department_war_metrics_admin_all ON public.department_war_metrics AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY department_war_metrics_user_select ON public.department_war_metrics AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY dept_war_results_admin_all ON public.department_war_results AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY dept_war_results_select ON public.department_war_results AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM department_wars dw
  WHERE ((dw.id = department_war_results.war_id) AND (dw.status <> 'draft'::text)))));
CREATE POLICY department_wars_admin_all ON public.department_wars AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY department_wars_user_select ON public.department_wars AS PERMISSIVE FOR SELECT TO authenticated USING (((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can manage departments" ON public.departments AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view departments" ON public.departments AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Admins can view all plan actions" ON public.development_plan_actions AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create plan actions" ON public.development_plan_actions AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM development_plans dp
  WHERE ((dp.id = development_plan_actions.plan_id) AND ((dp.user_id = auth.uid()) OR (dp.created_by = auth.uid()))))));
CREATE POLICY "Users can delete plan actions" ON public.development_plan_actions AS PERMISSIVE FOR DELETE TO public USING (((EXISTS ( SELECT 1
   FROM development_plans dp
  WHERE ((dp.id = development_plan_actions.plan_id) AND ((dp.user_id = auth.uid()) OR (dp.created_by = auth.uid()))))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can update plan actions" ON public.development_plan_actions AS PERMISSIVE FOR UPDATE TO public USING (((EXISTS ( SELECT 1
   FROM development_plans dp
  WHERE ((dp.id = development_plan_actions.plan_id) AND ((dp.user_id = auth.uid()) OR (dp.created_by = auth.uid()))))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can view their plan actions" ON public.development_plan_actions AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM development_plans dp
  WHERE ((dp.id = development_plan_actions.plan_id) AND ((dp.user_id = auth.uid()) OR (dp.created_by = auth.uid()))))));
CREATE POLICY "Admins can view all development plans" ON public.development_plans AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Managers can view team development plans" ON public.development_plans AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (team_members tm1
     JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))
  WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = development_plans.user_id)))));
CREATE POLICY "Users and managers can update development plans" ON public.development_plans AS PERMISSIVE FOR UPDATE TO public USING (((auth.uid() = user_id) OR (auth.uid() = created_by) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can create their own development plans" ON public.development_plans AS PERMISSIVE FOR INSERT TO public WITH CHECK (((auth.uid() = user_id) OR (auth.uid() = created_by)));
CREATE POLICY "Users can view their own development plans" ON public.development_plans AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can create duels" ON public.direct_duels AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = challenger_id));
CREATE POLICY "Users can update their duels" ON public.direct_duels AS PERMISSIVE FOR UPDATE TO public USING (((auth.uid() = challenger_id) OR (auth.uid() = opponent_id)));
CREATE POLICY "Users can view their duels" ON public.direct_duels AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = challenger_id) OR (auth.uid() = opponent_id)));
CREATE POLICY engagement_action_playbooks_admin_all ON public.engagement_action_playbooks AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY engagement_action_playbooks_manager_select ON public.engagement_action_playbooks AS PERMISSIVE FOR SELECT TO authenticated USING ((is_active OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY engagement_answers_admin_all ON public.engagement_answers AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY engagement_answers_manager_select ON public.engagement_answers AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY engagement_answers_user_insert ON public.engagement_answers AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY engagement_answers_user_select_own ON public.engagement_answers AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) AND (NOT is_anonymous)));
CREATE POLICY engagement_cycles_admin_all ON public.engagement_cycles AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY engagement_cycles_user_select ON public.engagement_cycles AS PERMISSIVE FOR SELECT TO authenticated USING (((status = 'active'::engagement_cycle_status) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY engagement_factors_admin_all ON public.engagement_factors AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY engagement_factors_user_select ON public.engagement_factors AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY engagement_question_assignments_admin_all ON public.engagement_question_assignments AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY engagement_question_assignments_user_own ON public.engagement_question_assignments AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY engagement_question_pool_admin_all ON public.engagement_question_pool AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY engagement_question_pool_user_select ON public.engagement_question_pool AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage snapshots" ON public.engagement_snapshots AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Managers can view department snapshots" ON public.engagement_snapshots AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM team_members tm
  WHERE ((tm.user_id = auth.uid()) AND (tm.is_manager = true) AND ((engagement_snapshots.department_id IS NULL) OR (tm.department_id = engagement_snapshots.department_id))))));
CREATE POLICY "Admins can view all responses" ON public.enps_responses AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can submit their responses" ON public.enps_responses AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own responses" ON public.enps_responses AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage surveys" ON public.enps_surveys AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view active surveys" ON public.enps_surveys AS PERMISSIVE FOR SELECT TO public USING (((status = 'active'::text) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can insert versions" ON public.entity_versions AS PERMISSIVE FOR INSERT TO public WITH CHECK (((auth.uid() = changed_by) OR (changed_by IS NULL)));
CREATE POLICY "Users can view versions" ON public.entity_versions AS PERMISSIVE FOR SELECT TO authenticated USING (((changed_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins manage monthly reports" ON public.executive_monthly_reports AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins read monthly reports" ON public.executive_monthly_reports AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage API keys" ON public.external_api_keys AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage external tasks" ON public.external_tasks AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own external tasks" ON public.external_tasks AS PERMISSIVE FOR SELECT TO public USING ((user_id = auth.uid()));
CREATE POLICY "Everyone can view active cycles" ON public.feedback_cycles AS PERMISSIVE FOR SELECT TO public USING (((status = ANY (ARRAY['active'::text, 'review'::text, 'completed'::text])) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Managers can manage cycles" ON public.feedback_cycles AS PERMISSIVE FOR ALL TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Users insert own evaluations" ON public.feedback_evaluations AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((evaluator_id = auth.uid()));
CREATE POLICY feedback_evaluations_select ON public.feedback_evaluations AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = evaluator_id) OR (auth.uid() = evaluatee_id)));
CREATE POLICY feedback_evaluations_update ON public.feedback_evaluations AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = evaluator_id));
CREATE POLICY feedback_questions_select ON public.feedback_questions AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Admins can view all requests" ON public.feedback_requests AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Managers can create requests" ON public.feedback_requests AS PERMISSIVE FOR INSERT TO public WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Users can update their requests" ON public.feedback_requests AS PERMISSIVE FOR UPDATE TO public USING ((from_user_id = auth.uid()));
CREATE POLICY "Users can view their feedback requests" ON public.feedback_requests AS PERMISSIVE FOR SELECT TO public USING (((from_user_id = auth.uid()) OR (to_user_id = auth.uid())));
CREATE POLICY "Admins can view all responses" ON public.feedback_responses AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Receivers can view non-anonymous feedback" ON public.feedback_responses AS PERMISSIVE FOR SELECT TO public USING (((is_anonymous = false) AND (EXISTS ( SELECT 1
   FROM feedback_requests r
  WHERE ((r.id = feedback_responses.request_id) AND (r.to_user_id = auth.uid()))))));
CREATE POLICY "Submitters can create responses" ON public.feedback_responses AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM feedback_requests r
  WHERE ((r.id = feedback_responses.request_id) AND (r.from_user_id = auth.uid())))));
CREATE POLICY "Submitters can view own responses" ON public.feedback_responses AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM feedback_requests r
  WHERE ((r.id = feedback_responses.request_id) AND (r.from_user_id = auth.uid())))));
CREATE POLICY "Managers insert feedback results" ON public.feedback_results AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY feedback_results_select ON public.feedback_results AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage themes" ON public.gamification_themes AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view active themes" ON public.gamification_themes AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins podem ver logs de acesso geográfico" ON public.geo_access_logs AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated insert geo logs" ON public.geo_access_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY "Admins can manage allowed countries" ON public.geo_allowed_countries AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role)))));
CREATE POLICY "Everyone can view allowed countries" ON public.geo_allowed_countries AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Admins podem gerenciar regras de geo blocking" ON public.geo_blocking_rules AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Todos podem ver regras de geo blocking" ON public.geo_blocking_rules AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage geo settings" ON public.geo_settings AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role)))));
CREATE POLICY "Everyone can view geo settings" ON public.geo_settings AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY goal_templates_delete ON public.goal_templates AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role)))));
CREATE POLICY goal_templates_insert ON public.goal_templates AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role)))));
CREATE POLICY goal_templates_select ON public.goal_templates AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY goal_templates_update ON public.goal_templates AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role)))));
CREATE POLICY "Goal owners and admins can view goal updates" ON public.goal_updates AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM goals g
  WHERE ((g.id = goal_updates.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))))));
CREATE POLICY "Goal owners can insert updates" ON public.goal_updates AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM goals g
  WHERE ((g.id = goal_updates.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))))));
CREATE POLICY "Managers can manage team goals" ON public.goals AS PERMISSIVE FOR ALL TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Users can create own goals" ON public.goals AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can delete own draft goals" ON public.goals AS PERMISSIVE FOR DELETE TO public USING (((user_id = auth.uid()) AND (status = 'draft'::text)));
CREATE POLICY "Users can update own goals" ON public.goals AS PERMISSIVE FOR UPDATE TO public USING ((user_id = auth.uid()));
CREATE POLICY "Users can view company goals" ON public.goals AS PERMISSIVE FOR SELECT TO public USING ((goal_type = 'company'::text));
CREATE POLICY "Users can view own goals" ON public.goals AS PERMISSIVE FOR SELECT TO public USING ((user_id = auth.uid()));
CREATE POLICY "Users can view team goals" ON public.goals AS PERMISSIVE FOR SELECT TO public USING (((goal_type = 'team'::text) AND (department_id IN ( SELECT team_members.department_id
   FROM team_members
  WHERE (team_members.user_id = auth.uid())))));
CREATE POLICY "Admins can view IP access logs" ON public.ip_access_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete IP whitelist" ON public.ip_whitelist AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert IP whitelist" ON public.ip_whitelist AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update IP whitelist" ON public.ip_whitelist AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view IP whitelist" ON public.ip_whitelist AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Goal owners and admins can view key results" ON public.key_results AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM goals g
  WHERE ((g.id = key_results.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))))));
CREATE POLICY "Goal owners can manage key results" ON public.key_results AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM goals g
  WHERE ((g.id = key_results.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))))));
CREATE POLICY "Authenticated users can give kudos" ON public.kudos AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = from_user_id));
CREATE POLICY "Public kudos are viewable by all" ON public.kudos AS PERMISSIVE FOR SELECT TO public USING (((is_public = true) OR (from_user_id = auth.uid()) OR (to_user_id = auth.uid())));
CREATE POLICY "Users can delete kudos they gave" ON public.kudos AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = from_user_id));
CREATE POLICY "Admins can manage badges" ON public.kudos_badges AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view badges" ON public.kudos_badges AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated insert league history" ON public.league_history AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view league history" ON public.league_history AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage leagues" ON public.leagues AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view leagues" ON public.leagues AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Creators and admins can delete trails" ON public.learning_trails AS PERMISSIVE FOR DELETE TO public USING (((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Creators and admins can update trails" ON public.learning_trails AS PERMISSIVE FOR UPDATE TO public USING (((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Everyone can view published trails" ON public.learning_trails AS PERMISSIVE FOR SELECT TO public USING (((status = 'published'::trail_status) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Managers and admins can create trails" ON public.learning_trails AS PERMISSIVE FOR INSERT TO public WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Admins can manage level configs" ON public.level_configs AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view level configs" ON public.level_configs AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY lightning_quiz_answers_admin_all ON public.lightning_quiz_answers AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY lightning_quiz_answers_admin_select ON public.lightning_quiz_answers AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY lightning_quiz_answers_user_select ON public.lightning_quiz_answers AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY lightning_quiz_questions_admin_all ON public.lightning_quiz_questions AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY lightning_quiz_questions_user_select ON public.lightning_quiz_questions AS PERMISSIVE FOR SELECT TO authenticated USING ((is_active OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY lightning_quiz_sessions_admin_all ON public.lightning_quiz_sessions AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY lightning_quiz_sessions_user_own ON public.lightning_quiz_sessions AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Admins can view login attempts" ON public.login_attempts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY lucky_wheel_payout_snapshots_admin_all ON public.lucky_wheel_payout_snapshots AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY lucky_wheel_prize_audit_admin_select ON public.lucky_wheel_prize_audit AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY lucky_wheel_prizes_admin_all ON public.lucky_wheel_prizes AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY lucky_wheel_prizes_user_select ON public.lucky_wheel_prizes AS PERMISSIVE FOR SELECT TO authenticated USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY lucky_wheel_settings_admin_all ON public.lucky_wheel_settings AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY lucky_wheel_settings_audit_admin_all ON public.lucky_wheel_settings_audit AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY lucky_wheel_spins_admin_all ON public.lucky_wheel_spins AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY lucky_wheel_spins_user_select ON public.lucky_wheel_spins AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY lucky_wheel_whatif_snapshots_admin_all ON public.lucky_wheel_whatif_snapshots AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY memory_decks_admin_all ON public.memory_decks AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY memory_decks_user_select ON public.memory_decks AS PERMISSIVE FOR SELECT TO authenticated USING ((is_active OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY memory_pairs_admin_all ON public.memory_pairs AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY memory_pairs_user_select ON public.memory_pairs AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY memory_sessions_admin_all ON public.memory_sessions AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY memory_sessions_user_own ON public.memory_sessions AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can insert progress for their pairs" ON public.mentorship_mission_progress AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM mentorship_pairs mp
  WHERE ((mp.id = mentorship_mission_progress.pair_id) AND ((mp.mentor_id = auth.uid()) OR (mp.apprentice_id = auth.uid()))))));
CREATE POLICY "Users can update their pair progress" ON public.mentorship_mission_progress AS PERMISSIVE FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM mentorship_pairs mp
  WHERE ((mp.id = mentorship_mission_progress.pair_id) AND ((mp.mentor_id = auth.uid()) OR (mp.apprentice_id = auth.uid()))))));
CREATE POLICY "Users can view their pair progress" ON public.mentorship_mission_progress AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM mentorship_pairs mp
  WHERE ((mp.id = mentorship_mission_progress.pair_id) AND ((mp.mentor_id = auth.uid()) OR (mp.apprentice_id = auth.uid()))))));
CREATE POLICY "Admins can manage missions" ON public.mentorship_missions AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view active missions" ON public.mentorship_missions AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can create mentorship pairs" ON public.mentorship_pairs AS PERMISSIVE FOR INSERT TO public WITH CHECK (((auth.uid() = mentor_id) OR (auth.uid() = apprentice_id)));
CREATE POLICY "Users can update their own pairs" ON public.mentorship_pairs AS PERMISSIVE FOR UPDATE TO public USING (((auth.uid() = mentor_id) OR (auth.uid() = apprentice_id)));
CREATE POLICY "Users can view their own mentorship pairs" ON public.mentorship_pairs AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = mentor_id) OR (auth.uid() = apprentice_id)));
CREATE POLICY "Users can create requests" ON public.mentorship_requests AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = requester_id));
CREATE POLICY "Users can update requests targeting them" ON public.mentorship_requests AS PERMISSIVE FOR UPDATE TO public USING (((auth.uid() = target_id) OR (auth.uid() = requester_id)));
CREATE POLICY "Users can view their requests" ON public.mentorship_requests AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = requester_id) OR (auth.uid() = target_id)));
CREATE POLICY "Users can insert own progress" ON public.module_progress AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can update own progress" ON public.module_progress AS PERMISSIVE FOR UPDATE TO public USING ((user_id = auth.uid()));
CREATE POLICY "Users can view own progress" ON public.module_progress AS PERMISSIVE FOR SELECT TO public USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Managers and admins can view team mood data" ON public.mood_entries AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Users can manage own mood entries" ON public.mood_entries AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid()));
CREATE POLICY "Authenticated insert device alerts" ON public.new_device_alerts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can update their own alerts" ON public.new_device_alerts AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own alerts" ON public.new_device_alerts AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins and managers can create evaluations" ON public.nine_box_evaluations AS PERMISSIVE FOR INSERT TO public WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR (EXISTS ( SELECT 1
   FROM (team_members tm1
     JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))
  WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = nine_box_evaluations.user_id))))));
CREATE POLICY "Admins and managers can update evaluations" ON public.nine_box_evaluations AS PERMISSIVE FOR UPDATE TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR (evaluator_id = auth.uid())));
CREATE POLICY "Admins can view all evaluations" ON public.nine_box_evaluations AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Managers can view their team evaluations" ON public.nine_box_evaluations AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (team_members tm1
     JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))
  WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = nine_box_evaluations.user_id)))));
CREATE POLICY "Users can view their own evaluations" ON public.nine_box_evaluations AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY notification_templates_select ON public.notification_templates AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Authenticated insert notifications" ON public.notifications AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can delete their own notifications" ON public.notifications AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own notifications" ON public.notifications AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own notifications" ON public.notifications AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY nr1_factor_mappings_admin_all ON public.nr1_factor_mappings AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY nr1_factor_mappings_select ON public.nr1_factor_mappings AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY nr1_risk_categories_admin_all ON public.nr1_risk_categories AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY nr1_risk_categories_select ON public.nr1_risk_categories AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own onboarding" ON public.onboarding_progress AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own onboarding" ON public.onboarding_progress AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own onboarding" ON public.onboarding_progress AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Responders can create responses" ON public.opinion_responses AS PERMISSIVE FOR INSERT TO public WITH CHECK (((auth.uid() = responder_id) AND (EXISTS ( SELECT 1
   FROM opinions o
  WHERE ((o.id = opinion_responses.opinion_id) AND ((o.recipient_id = auth.uid()) OR ((o.recipient_type = 'hr'::text) AND has_role(auth.uid(), 'admin'::app_role)) OR ((o.recipient_type = 'manager'::text) AND has_role(auth.uid(), 'manager'::app_role))))))));
CREATE POLICY "View opinion responses" ON public.opinion_responses AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM opinions o
  WHERE ((o.id = opinion_responses.opinion_id) AND ((o.sender_id = auth.uid()) OR (o.recipient_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))))));
CREATE POLICY opinion_supports_select ON public.opinion_supports AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY opinion_supports_user_own ON public.opinion_supports AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Manage opinion tags" ON public.opinion_tags AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM opinions o
  WHERE ((o.id = opinion_tags.opinion_id) AND ((o.recipient_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))))));
CREATE POLICY "Recipients can update opinions" ON public.opinions AS PERMISSIVE FOR UPDATE TO public USING (((recipient_id = auth.uid()) OR ((recipient_type = 'hr'::text) AND has_role(auth.uid(), 'admin'::app_role)) OR ((recipient_type = 'manager'::text) AND has_role(auth.uid(), 'manager'::app_role)) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can create opinions" ON public.opinions AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = sender_id));
CREATE POLICY "View opinions" ON public.opinions AS PERMISSIVE FOR SELECT TO public USING (((sender_id = auth.uid()) OR (recipient_id = auth.uid()) OR ((recipient_type = 'hr'::text) AND has_role(auth.uid(), 'admin'::app_role)) OR ((recipient_type = 'manager'::text) AND has_role(auth.uid(), 'manager'::app_role)) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Members can view their org membership" ON public.org_members AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR is_org_admin(auth.uid(), org_id)));
CREATE POLICY "Org admins manage members" ON public.org_members AS PERMISSIVE FOR ALL TO authenticated USING (is_org_admin(auth.uid(), org_id)) WITH CHECK (is_org_admin(auth.uid(), org_id));
CREATE POLICY "Org admins insert history" ON public.org_theme_history AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_org_admin(auth.uid(), org_id));
CREATE POLICY "Org admins view history" ON public.org_theme_history AS PERMISSIVE FOR SELECT TO authenticated USING (is_org_admin(auth.uid(), org_id));
CREATE POLICY "Org admins can update" ON public.organizations AS PERMISSIVE FOR UPDATE TO authenticated USING (is_org_admin(auth.uid(), id)) WITH CHECK (is_org_admin(auth.uid(), id));
CREATE POLICY "Public can read org branding" ON public.organizations AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Managers can update team password reset requests" ON public.password_reset_requests AS PERMISSIVE FOR UPDATE TO public USING (((EXISTS ( SELECT 1
   FROM (team_members tm1
     JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))
  WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = password_reset_requests.user_id)))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Managers can view team password reset requests" ON public.password_reset_requests AS PERMISSIVE FOR SELECT TO public USING (((EXISTS ( SELECT 1
   FROM (team_members tm1
     JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))
  WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = password_reset_requests.user_id)))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can create own password reset requests" ON public.password_reset_requests AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view own password reset requests" ON public.password_reset_requests AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY pdi_checkins_insert ON public.pdi_checkins AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = created_by));
CREATE POLICY pdi_checkins_select ON public.pdi_checkins AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM development_plans dp
  WHERE ((dp.id = pdi_checkins.plan_id) AND (dp.user_id = auth.uid())))));
CREATE POLICY "Managers assign PDI mentors" ON public.pdi_mentors AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY pdi_mentors_delete ON public.pdi_mentors AS PERMISSIVE FOR DELETE TO authenticated USING (((auth.uid() = mentor_id) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY pdi_mentors_select ON public.pdi_mentors AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = mentor_id) OR (EXISTS ( SELECT 1
   FROM development_plans dp
  WHERE ((dp.id = pdi_mentors.plan_id) AND (dp.user_id = auth.uid()))))));
CREATE POLICY pdi_templates_delete_admin ON public.pdi_templates AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY pdi_templates_insert_admin ON public.pdi_templates AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY pdi_templates_select ON public.pdi_templates AS PERMISSIVE FOR SELECT TO authenticated USING ((is_active = true));
CREATE POLICY pdi_templates_update_admin ON public.pdi_templates AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage penalty rules" ON public.penalty_rules AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view active rules" ON public.penalty_rules AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can manage permission groups" ON public.permission_groups AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view permission groups" ON public.permission_groups AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage permissions" ON public.permissions AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view permissions" ON public.permissions AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage position competencies" ON public.position_competencies AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY position_competencies_select ON public.position_competencies AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Admins and managers can manage templates" ON public.position_task_templates AS PERMISSIVE FOR ALL TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Everyone can view active templates" ON public.position_task_templates AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can manage positions" ON public.positions AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view positions" ON public.positions AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage postmortem actions" ON public.postmortem_actions AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage postmortems" ON public.postmortems AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY prediction_admin_events_admin_all ON public.prediction_admin_events AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY prediction_markets_admin_all ON public.prediction_markets AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY prediction_markets_user_select ON public.prediction_markets AS PERMISSIVE FOR SELECT TO authenticated USING (((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY prediction_options_admin_all ON public.prediction_options AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY prediction_options_user_select ON public.prediction_options AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM prediction_markets pm
  WHERE ((pm.id = prediction_options.market_id) AND ((pm.status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role))))));
CREATE POLICY prediction_stakes_admin_all ON public.prediction_stakes AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY prediction_stakes_user_own ON public.prediction_stakes AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Authenticated users can view profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));
CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));
CREATE POLICY "Managers can view anonymous aggregated responses" ON public.pulse_responses AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Users can submit responses" ON public.pulse_responses AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can view own responses" ON public.pulse_responses AS PERMISSIVE FOR SELECT TO public USING ((user_id = auth.uid()));
CREATE POLICY "Managers can manage surveys" ON public.pulse_surveys AS PERMISSIVE FOR ALL TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Users can view active surveys for their department" ON public.pulse_surveys AS PERMISSIVE FOR SELECT TO public USING (((status = 'active'::text) AND ((department_id IS NULL) OR (department_id IN ( SELECT team_members.department_id
   FROM team_members
  WHERE (team_members.user_id = auth.uid()))))));
CREATE POLICY purchase_approvals_admin_all ON public.purchase_approvals AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY purchase_approvals_user_select ON public.purchase_approvals AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM shop_purchases sp
  WHERE ((sp.id = purchase_approvals.purchase_id) AND (sp.user_id = auth.uid())))));
CREATE POLICY "Users read own push logs" ON public.push_notification_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY push_outbox_admin_all ON public.push_outbox AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY push_outbox_user_select ON public.push_outbox AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY push_outbox_health_admin_all ON public.push_outbox_health_snapshots AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users manage own push subs" ON public.push_subscriptions AS PERMISSIVE FOR ALL TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY push_sync_events_admin_select ON public.push_sync_events AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY push_sync_events_authenticated_insert ON public.push_sync_events AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY push_sync_events_user_select ON public.push_sync_events AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Admins can delete telemetry" ON public.query_telemetry AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can read telemetry" ON public.query_telemetry AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert their own telemetry" ON public.query_telemetry AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((user_id IS NULL) OR (user_id = auth.uid())));
CREATE POLICY "Managers can create assignments" ON public.quest_assignments AS PERMISSIVE FOR INSERT TO public WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Managers can view team assignments" ON public.quest_assignments AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Users can update their own progress" ON public.quest_assignments AS PERMISSIVE FOR UPDATE TO public USING ((user_id = auth.uid()));
CREATE POLICY "Users can view their own assignments" ON public.quest_assignments AS PERMISSIVE FOR SELECT TO public USING ((user_id = auth.uid()));
CREATE POLICY "Everyone can view steps of active quests" ON public.quest_steps AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM custom_quests q
  WHERE ((q.id = quest_steps.quest_id) AND (q.status = 'active'::quest_status)))));
CREATE POLICY "Quest creators can manage steps" ON public.quest_steps AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM custom_quests q
  WHERE ((q.id = quest_steps.quest_id) AND ((q.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))))));
CREATE POLICY "Users can insert own answers" ON public.quiz_answers AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view own quiz answers" ON public.quiz_answers AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins and managers can manage options" ON public.quiz_options AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM quiz_questions q
  WHERE ((q.id = quiz_options.question_id) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))))));
CREATE POLICY "Everyone can view options of active questions" ON public.quiz_options AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM quiz_questions q
  WHERE ((q.id = quiz_options.question_id) AND ((q.is_active = true) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))))));
CREATE POLICY "Admins and managers can manage questions" ON public.quiz_questions AS PERMISSIVE FOR ALL TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Everyone can view active questions" ON public.quiz_questions AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Everyone can view scores" ON public.quiz_scores AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert their own scores" ON public.quiz_scores AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Admins can view rate limit logs" ON public.rate_limit_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage rate_limit_rules" ON public.rate_limit_rules AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage role permissions" ON public.role_permissions AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view role permissions" ON public.role_permissions AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY roles_select ON public.roles AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage runbook executions" ON public.runbook_executions AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY campaigns_delete_admin ON public.sales_campaigns AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY campaigns_insert_admin_manager ON public.sales_campaigns AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY campaigns_select_authenticated ON public.sales_campaigns AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY campaigns_update_admin_manager ON public.sales_campaigns AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Users can delete own filters" ON public.saved_filters AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert own filters" ON public.saved_filters AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own filters" ON public.saved_filters AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view own filters" ON public.saved_filters AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY scratch_card_prizes_admin_all ON public.scratch_card_prizes AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY scratch_card_prizes_user_select ON public.scratch_card_prizes AS PERMISSIVE FOR SELECT TO authenticated USING ((is_active OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY scratch_cards_admin_all ON public.scratch_cards AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY scratch_cards_user_insert ON public.scratch_cards AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY scratch_cards_user_select ON public.scratch_cards AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY scratch_cards_user_update ON public.scratch_cards AS PERMISSIVE FOR UPDATE TO authenticated USING (((user_id = auth.uid()) AND (status = 'pending'::text)));
CREATE POLICY "Admins can manage challenges" ON public.seasonal_challenges AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view challenges" ON public.seasonal_challenges AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM seasonal_events e
  WHERE ((e.id = seasonal_challenges.event_id) AND ((e.is_active = true) OR has_role(auth.uid(), 'admin'::app_role))))));
CREATE POLICY "Admins can manage events" ON public.seasonal_events AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view active events" ON public.seasonal_events AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can manage security alerts" ON public.security_alerts AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY sequence_attempts_admin_all ON public.sequence_attempts AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY sequence_attempts_user_own ON public.sequence_attempts AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY sequence_procedures_admin_all ON public.sequence_procedures AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY sequence_procedures_user_select ON public.sequence_procedures AS PERMISSIVE FOR SELECT TO authenticated USING ((is_active OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY sequence_steps_admin_all ON public.sequence_steps AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY sequence_steps_user_select ON public.sequence_steps AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own sessions" ON public.session_logs AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users can view own sessions" ON public.session_logs AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can manage promotions" ON public.shop_promotions AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all promotions" ON public.shop_promotions AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view active promotions" ON public.shop_promotions AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) AND (starts_at <= now()) AND (ends_at > now())));
CREATE POLICY "Admins can update purchases" ON public.shop_purchases AS PERMISSIVE FOR UPDATE TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Admins can view all purchases" ON public.shop_purchases AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Users can create purchases" ON public.shop_purchases AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view own purchases" ON public.shop_purchases AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage rewards" ON public.shop_rewards AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Everyone can view active rewards" ON public.shop_rewards AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins manage SLA targets" ON public.sla_targets AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage penalties" ON public.task_penalties AS PERMISSIVE FOR ALL TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Managers can view all penalties" ON public.task_penalties AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Users can view own penalties" ON public.task_penalties AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage task scores" ON public.task_scores AS PERMISSIVE FOR ALL TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))) WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Managers can view all task scores" ON public.task_scores AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Managers insert task scores" ON public.task_scores AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Managers update task scores" ON public.task_scores AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))) WITH CHECK ((has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can view own task scores" ON public.task_scores AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can manage team members" ON public.team_members AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Managers can view their team members" ON public.team_members AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = user_id) OR is_department_manager(auth.uid(), department_id) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can view their own team membership" ON public.team_members AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY tournament_matches_admin_all ON public.tournament_matches AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY tournament_matches_user_select ON public.tournament_matches AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY tournament_participants_admin_all ON public.tournament_participants AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY tournament_participants_user_select ON public.tournament_participants AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY tournaments_admin_all ON public.tournaments AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY tournaments_user_select ON public.tournaments AS PERMISSIVE FOR SELECT TO authenticated USING (((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can enroll themselves" ON public.trail_enrollments AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can update own enrollments" ON public.trail_enrollments AS PERMISSIVE FOR UPDATE TO public USING ((user_id = auth.uid()));
CREATE POLICY "Users can view own enrollments" ON public.trail_enrollments AS PERMISSIVE FOR SELECT TO public USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Everyone can view modules of published trails" ON public.trail_modules AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM learning_trails t
  WHERE ((t.id = trail_modules.trail_id) AND ((t.status = 'published'::trail_status) OR (t.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))))));
CREATE POLICY "Trail creators can manage modules" ON public.trail_modules AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM learning_trails t
  WHERE ((t.id = trail_modules.trail_id) AND ((t.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))))));
CREATE POLICY "Admins and managers can manage prerequisites" ON public.trail_prerequisites AS PERMISSIVE FOR ALL TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Everyone can view prerequisites" ON public.trail_prerequisites AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Managers can view team achievements" ON public.user_achievements AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "System can insert achievements" ON public.user_achievements AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view own achievements" ON public.user_achievements AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert own avatar config" ON public.user_avatar_config AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own avatar config" ON public.user_avatar_config AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view any avatar config" ON public.user_avatar_config AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert own avatar items" ON public.user_avatar_items AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view others avatar items for display" ON public.user_avatar_items AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Users can view own avatar items" ON public.user_avatar_items AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY user_cards_admin_select ON public.user_cards AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY user_cards_user_all ON public.user_cards AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Authenticated insert certifications" ON public.user_certifications AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Managers can update certifications" ON public.user_certifications AS PERMISSIVE FOR UPDATE TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Managers can view team certifications" ON public.user_certifications AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Users can view own certifications" ON public.user_certifications AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own challenges" ON public.user_challenges AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own challenges" ON public.user_challenges AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own challenges" ON public.user_challenges AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Managers can view team combos" ON public.user_combos AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Users can insert own combos" ON public.user_combos AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own combos" ON public.user_combos AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own combos" ON public.user_combos AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Managers insert competency assessments" ON public.user_competency_assessments AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((assessor_id = auth.uid()));
CREATE POLICY user_competency_assessments_select ON public.user_competency_assessments AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = user_id) OR (auth.uid() = assessor_id)));
CREATE POLICY "Admins and managers can view demographic values" ON public.user_demographic_values AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Users can manage own demographic values" ON public.user_demographic_values AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Authenticated insert devices" ON public.user_devices AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can update their own devices" ON public.user_devices AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own devices" ON public.user_devices AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Everyone can view user leagues" ON public.user_leagues AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "System can manage user leagues" ON public.user_leagues AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own league" ON public.user_leagues AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can insert own progress" ON public.user_mission_progress AS PERMISSIVE FOR INSERT TO public WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can update own progress" ON public.user_mission_progress AS PERMISSIVE FOR UPDATE TO public USING ((user_id = auth.uid()));
CREATE POLICY "Users can view own progress" ON public.user_mission_progress AS PERMISSIVE FOR SELECT TO public USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Admins can manage user permission groups" ON public.user_permission_groups AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own permission groups" ON public.user_permission_groups AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage user positions" ON public.user_positions AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Managers can view team positions" ON public.user_positions AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Users can view own positions" ON public.user_positions AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage all roles" ON public.user_roles AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view their own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Managers can view all progress" ON public.user_seasonal_progress AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY "Users can insert own progress" ON public.user_seasonal_progress AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own progress" ON public.user_seasonal_progress AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own progress" ON public.user_seasonal_progress AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage user titles" ON public.user_titles AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own titles" ON public.user_titles AS PERMISSIVE FOR SELECT TO public USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can insert their own 2FA settings" ON public.user_two_factor AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own 2FA settings" ON public.user_two_factor AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own 2FA settings" ON public.user_two_factor AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY wager_budget_settings_admin_all ON public.wager_budget_settings AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY wager_budget_settings_manager_select ON public.wager_budget_settings AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'manager'::app_role));
CREATE POLICY wager_entries_admin_manage ON public.wager_entries AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY wager_entries_admin_select ON public.wager_entries AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY wager_entries_user_select ON public.wager_entries AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY wager_integrity_review_events_admin_all ON public.wager_integrity_review_events AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Managers and admins can read integrity reviews" ON public.wager_integrity_reviews AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));
CREATE POLICY wager_integrity_reviews_admin_all ON public.wager_integrity_reviews AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY wager_questions_admin_all ON public.wager_questions AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY wager_questions_user_select ON public.wager_questions AS PERMISSIVE FOR SELECT TO authenticated USING (((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can manage their own challenges" ON public.webauthn_challenges AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own credentials" ON public.webauthn_credentials AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own credentials" ON public.webauthn_credentials AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own credentials" ON public.webauthn_credentials AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own credentials" ON public.webauthn_credentials AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can view webhook logs" ON public.webhook_delivery_logs AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role manages idempotency" ON public.webhook_idempotency AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage webhooks" ON public.webhook_subscriptions AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete weekly challenges" ON public.weekly_challenges AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert weekly challenges" ON public.weekly_challenges AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update weekly challenges" ON public.weekly_challenges AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view weekly challenges" ON public.weekly_challenges AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- 3) Grants do anon que producao tem (dados de referencia lidos antes do login).
GRANT SELECT ON TABLE
  public.achievements,
  public.activity_comments,
  public.activity_reactions,
  public.announcement_reactions,
  public.attendance_settings,
  public.certifications,
  public.checkin_templates,
  public.climate_benchmarks,
  public.competencies,
  public.custom_ranks,
  public.department_rankings,
  public.departments,
  public.feedback_questions,
  public.geo_allowed_countries,
  public.geo_blocking_rules,
  public.geo_settings,
  public.kudos_badges,
  public.leagues,
  public.level_configs,
  public.organizations,
  public.permission_groups,
  public.permissions,
  public.position_competencies,
  public.positions,
  public.quiz_scores,
  public.role_permissions,
  public.roles,
  public.trail_prerequisites,
  public.user_avatar_config,
  public.user_avatar_items,
  public.user_leagues
TO anon;

-- 4) Privilegios que so o banco vivo tem. O padrao de grants de producao libera
-- mais privilegios em tabela nova para authenticated do que o CLI local, entao o
-- banco reconstruido negava UPDATE/DELETE/INSERT que producao permite. Sao 108
-- tabelas. GRANT repetido e no-op.
-- Fora daqui de proposito: TRUNCATE, REFERENCES e TRIGGER, que producao concede a
-- authenticated em 3 relacoes. Nenhum deles e exercitado pela API (PostgREST nao
-- expoe TRUNCATE/REFERENCES/TRIGGER) e TRUNCATE ignora RLS, entao nao se
-- institucionaliza no repositorio: a `20261228150000` revoga esses privilegios no
-- vivo (TRUNCATE, REFERENCES e TRIGGER em profiles, profiles_public e
-- webhook_delivery_stats_24h), e as duas pontas passam a ter o mesmo conjunto de grants.
GRANT UPDATE, DELETE ON TABLE public.action_plan_updates TO authenticated;
GRANT UPDATE ON TABLE public.activity_reactions TO authenticated;
GRANT UPDATE ON TABLE public.ai_coach_messages TO authenticated;
GRANT DELETE ON TABLE public.ai_course_jobs TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.announcement_reads TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.api_request_logs TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.attendance_records TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.auction_admin_events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.auction_bids TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.audit_logs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.bingo_cards TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.bingo_marks TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.bitrix24_webhook_logs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.board_moves TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.board_player_states TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.boss_battle_damage TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.boss_battle_rewards TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.campaign_progress_events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.campaign_team_split_batches TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.campaign_team_split_entries TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.card_packs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.card_set_claims TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.card_trades TO authenticated;
GRANT DELETE ON TABLE public.checkins TO authenticated;
GRANT DELETE ON TABLE public.climate_question_answers TO authenticated;
GRANT DELETE ON TABLE public.climate_survey_responses TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.department_war_contributions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.department_war_results TO authenticated;
GRANT DELETE ON TABLE public.development_plans TO authenticated;
GRANT DELETE ON TABLE public.direct_duels TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.engagement_answers TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.enps_responses TO authenticated;
GRANT DELETE ON TABLE public.feedback_evaluations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.feedback_questions TO authenticated;
GRANT DELETE ON TABLE public.feedback_requests TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.feedback_responses TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.feedback_results TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.geo_access_logs TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.goal_updates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.ip_access_logs TO authenticated;
GRANT UPDATE ON TABLE public.kudos TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.league_history TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.lightning_quiz_answers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.lightning_quiz_sessions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.login_attempts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.lucky_wheel_payout_snapshots TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.lucky_wheel_prize_audit TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.lucky_wheel_settings_audit TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.lucky_wheel_spins TO authenticated;
GRANT DELETE ON TABLE public.lucky_wheel_whatif_snapshots TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.memory_sessions TO authenticated;
GRANT DELETE ON TABLE public.mentorship_mission_progress TO authenticated;
GRANT DELETE ON TABLE public.mentorship_pairs TO authenticated;
GRANT DELETE ON TABLE public.mentorship_requests TO authenticated;
GRANT DELETE ON TABLE public.module_progress TO authenticated;
GRANT DELETE ON TABLE public.new_device_alerts TO authenticated;
GRANT DELETE ON TABLE public.nine_box_evaluations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.notification_templates TO authenticated;
GRANT DELETE ON TABLE public.onboarding_progress TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.opinion_responses TO authenticated;
GRANT DELETE ON TABLE public.opinions TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.org_theme_history TO authenticated;
GRANT INSERT, DELETE ON TABLE public.organizations TO authenticated;
GRANT DELETE ON TABLE public.password_reset_requests TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.pdi_checkins TO authenticated;
GRANT UPDATE ON TABLE public.pdi_mentors TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.pdi_templates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.prediction_admin_events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.prediction_stakes TO authenticated;
GRANT DELETE ON TABLE public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.profiles_public TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.pulse_responses TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.purchase_approvals TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.push_notification_logs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.push_outbox TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.push_outbox_health_snapshots TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.push_sync_events TO authenticated;
GRANT UPDATE ON TABLE public.query_telemetry TO authenticated;
GRANT DELETE ON TABLE public.quest_assignments TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.quiz_answers TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.quiz_scores TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.rate_limit_logs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.scratch_cards TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.sequence_attempts TO authenticated;
GRANT INSERT, DELETE ON TABLE public.session_logs TO authenticated;
GRANT DELETE ON TABLE public.shop_purchases TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.tournament_matches TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.tournament_participants TO authenticated;
GRANT DELETE ON TABLE public.trail_enrollments TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.user_achievements TO authenticated;
GRANT DELETE ON TABLE public.user_avatar_config TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.user_avatar_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.user_cards TO authenticated;
GRANT DELETE ON TABLE public.user_certifications TO authenticated;
GRANT DELETE ON TABLE public.user_challenges TO authenticated;
GRANT DELETE ON TABLE public.user_combos TO authenticated;
GRANT UPDATE, DELETE ON TABLE public.user_competency_assessments TO authenticated;
GRANT DELETE ON TABLE public.user_devices TO authenticated;
GRANT DELETE ON TABLE public.user_mission_progress TO authenticated;
GRANT DELETE ON TABLE public.user_seasonal_progress TO authenticated;
GRANT DELETE ON TABLE public.user_two_factor TO authenticated;
GRANT DELETE ON TABLE public.wager_budget_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.wager_entries TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.wager_integrity_review_events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.webhook_delivery_logs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.webhook_delivery_stats_24h TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.webhook_idempotency TO authenticated;
