# Policies (RLS)


Visão consolidada (inclui `storage.objects` e `realtime.messages`); detalhes por tabela em `tables/`.

| tabela | policy | cmd | tipo | roles | USING | WITH CHECK |
|---|---|---|---|---|---|---|
| public.achievements | Admins can manage achievements | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.achievements | Everyone can view achievements | SELECT | PERMISSIVE | {public} | `true` |  |
| public.action_plan_items | Manage action plan items | ALL | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM action_plans ap   WHERE ((ap.id = action_plan_items.plan_id) AND ((ap.owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |  |
| public.action_plan_items | View action plan items | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM action_plans ap   WHERE ((ap.id = action_plan_items.plan_id) AND ((ap.owner_id = auth.uid()) OR (ap.reviewer_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)))))` |  |
| public.action_plan_updates | Create action plan updates | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.action_plan_updates | View action plan updates | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM action_plans ap   WHERE ((ap.id = action_plan_updates.plan_id) AND ((ap.owner_id = auth.uid()) OR (ap.reviewer_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)))))` |  |
| public.action_plans | Admins delete action plans | DELETE | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR (owner_id = auth.uid()))` |  |
| public.action_plans | Managers create action plans | INSERT | PERMISSIVE | {public} |  | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.action_plans | Owners update action plans | UPDATE | PERMISSIVE | {public} | `((owner_id = auth.uid()) OR (reviewer_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.action_plans | View action plans | SELECT | PERMISSIVE | {public} | `((owner_id = auth.uid()) OR (reviewer_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.activity_comments | Authenticated users can create comments | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.activity_comments | Everyone can view comments | SELECT | PERMISSIVE | {public} | `true` |  |
| public.activity_comments | Users can delete their own comments | DELETE | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.activity_comments | Users can update their own comments | UPDATE | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.activity_reactions | Authenticated users can add reactions | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.activity_reactions | Everyone can view reactions | SELECT | PERMISSIVE | {public} | `true` |  |
| public.activity_reactions | Users can remove their own reactions | DELETE | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.ai_coach_messages | Users can delete their own messages | DELETE | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.ai_coach_messages | Users can insert their own messages | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.ai_coach_messages | Users can view their own messages | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.ai_course_jobs | Users create own ai course jobs | INSERT | PERMISSIVE | {authenticated} |  | `(auth.uid() = user_id)` |
| public.ai_course_jobs | Users update own ai course jobs | UPDATE | PERMISSIVE | {authenticated} | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))` | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))` |
| public.ai_course_jobs | Users view own ai course jobs | SELECT | PERMISSIVE | {authenticated} | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.announcement_reactions | Everyone can view reactions | SELECT | PERMISSIVE | {public} | `true` |  |
| public.announcement_reactions | Users can react to announcements | ALL | PERMISSIVE | {public} | `(user_id = auth.uid())` |  |
| public.announcement_reads | Users can mark as read | INSERT | PERMISSIVE | {public} |  | `(user_id = auth.uid())` |
| public.announcement_reads | Users can view own reads | SELECT | PERMISSIVE | {public} | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.announcements | Admins can delete announcements | DELETE | PERMISSIVE | {public} | `((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.announcements | Authors can manage own announcements | UPDATE | PERMISSIVE | {public} | `((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.announcements | Everyone can view published announcements | SELECT | PERMISSIVE | {public} | `((published_at IS NOT NULL) AND (published_at <= now()) AND ((expires_at IS NULL) OR (expires_at > now())) AND ((department_id IS NULL) OR (department_id IN ( SELECT team_members.department_id    FROM team_members   WHERE (team_members.user_id = auth.uid())))))` |  |
| public.announcements | Managers can create announcements | INSERT | PERMISSIVE | {public} |  | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.api_request_logs | Admins can view API logs | SELECT | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.attendance_records | Managers can view team attendance | SELECT | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.attendance_records | Users can insert own attendance | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.attendance_records | Users can view own attendance | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.attendance_settings | Admins can manage settings | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.attendance_settings | Everyone can view settings | SELECT | PERMISSIVE | {public} | `true` |  |
| public.attendance_streaks | Managers can view all streaks | SELECT | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.attendance_streaks | Users can manage own streaks | ALL | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.attendance_streaks | Users can view own streaks | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.auction_admin_events | auction_admin_events_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.auction_bids | auction_bids_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.auction_bids | auction_bids_user_own | ALL | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` | `(user_id = auth.uid())` |
| public.auctions | auctions_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.auctions | auctions_user_select | SELECT | PERMISSIVE | {authenticated} | `((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.audit_logs | Admins can view all audit logs | SELECT | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.audit_logs | Authenticated insert audit logs | INSERT | PERMISSIVE | {authenticated} |  | `(user_id = auth.uid())` |
| public.audit_logs | Managers can view team audit logs | SELECT | PERMISSIVE | {public} | `(has_role(auth.uid(), 'manager'::app_role) AND (EXISTS ( SELECT 1    FROM (team_members tm1      JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))   WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = audit_logs.user_id)))))` |  |
| public.audit_logs | Users can view own audit logs | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.avatar_items | Admins can manage avatar items | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.avatar_items | Everyone can view active avatar items | SELECT | PERMISSIVE | {public} | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.bingo_board_tasks | bingo_board_tasks_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.bingo_board_tasks | bingo_board_tasks_user_select | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.bingo_boards | bingo_boards_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.bingo_boards | bingo_boards_user_select | SELECT | PERMISSIVE | {authenticated} | `(is_active OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.bingo_cards | bingo_cards_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.bingo_cards | bingo_cards_user_own | ALL | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` | `(user_id = auth.uid())` |
| public.bingo_marks | bingo_marks_admin_select | SELECT | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.bingo_marks | bingo_marks_user_own | ALL | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` | `(user_id = auth.uid())` |
| public.bitrix24_sync_mappings | Admins and managers can view sync mappings | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'manager'::app_role])))))` |  |
| public.bitrix24_sync_mappings | Admins can manage sync mappings | ALL | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))))` |  |
| public.bitrix24_tokens | Admins can manage bitrix tokens | ALL | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))))` |  |
| public.bitrix24_webhook_logs | Admins can view webhook logs | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))))` |  |
| public.bitrix24_webhook_logs | Authenticated insert webhook logs | INSERT | PERMISSIVE | {authenticated} |  | `(auth.uid() IS NOT NULL)` |
| public.blocked_ips | Admins can manage blocked_ips | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.board_moves | board_moves_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.board_moves | board_moves_user_select | SELECT | PERMISSIVE | {authenticated} | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.board_player_states | board_player_states_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.board_player_states | board_player_states_manager_select | SELECT | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'manager'::app_role)` |  |
| public.board_player_states | board_player_states_user_own | ALL | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` | `(user_id = auth.uid())` |
| public.board_tiles | board_tiles_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.board_tiles | board_tiles_user_select | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.board_trails | board_trails_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.board_trails | board_trails_user_select | SELECT | PERMISSIVE | {authenticated} | `((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.boss_battle_damage | boss_battle_damage_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.boss_battle_damage | boss_battle_damage_user_select | SELECT | PERMISSIVE | {authenticated} | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.boss_battle_rewards | boss_battle_rewards_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.boss_battle_rewards | boss_battle_rewards_user_select | SELECT | PERMISSIVE | {authenticated} | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.boss_battles | boss_battles_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.boss_battles | boss_battles_user_select | SELECT | PERMISSIVE | {authenticated} | `((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.boss_win_rate_goals | boss_win_rate_goals_admin_all | ALL | PERMISSIVE | {authenticated} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.boss_win_rate_goals | boss_win_rate_goals_select | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.campaign_participants | participants_delete_admin | DELETE | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.campaign_participants | participants_insert_self_or_admin | INSERT | PERMISSIVE | {authenticated} |  | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.campaign_participants | participants_select_authenticated | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.campaign_participants | participants_update_self_or_admin | UPDATE | PERMISSIVE | {authenticated} | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.campaign_progress_events | campaign_events_insert_self_or_admin | INSERT | PERMISSIVE | {authenticated} |  | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.campaign_progress_events | campaign_events_select_authenticated | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.campaign_result_imports | campaign_imports_admin_all | ALL | PERMISSIVE | {authenticated} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.campaign_result_imports | campaign_imports_creator_select | SELECT | PERMISSIVE | {authenticated} | `(created_by = auth.uid())` |  |
| public.campaign_result_rows | campaign_result_rows_admin_all | ALL | PERMISSIVE | {authenticated} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.campaign_team_members | campaign_team_members_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.campaign_team_members | campaign_team_members_select | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.campaign_team_split_batches | campaign_team_split_batches_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.campaign_team_split_entries | campaign_team_split_entries_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.campaign_teams | campaign_teams_admin_all | ALL | PERMISSIVE | {authenticated} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.campaign_teams | campaign_teams_user_select | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.card_definitions | card_definitions_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.card_definitions | card_definitions_user_select | SELECT | PERMISSIVE | {authenticated} | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.card_packs | card_packs_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.card_packs | card_packs_user_select | SELECT | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` |  |
| public.card_set_claims | card_set_claims_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.card_set_claims | card_set_claims_user_own | ALL | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` | `(user_id = auth.uid())` |
| public.card_trades | card_trades_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.card_trades | card_trades_participants_select | SELECT | PERMISSIVE | {authenticated} | `((proposer_id = auth.uid()) OR (responder_id = auth.uid()))` |  |
| public.card_trades | card_trades_participants_update | UPDATE | PERMISSIVE | {authenticated} | `((proposer_id = auth.uid()) OR (responder_id = auth.uid()))` |  |
| public.card_trades | card_trades_proposer_insert | INSERT | PERMISSIVE | {authenticated} |  | `(proposer_id = auth.uid())` |
| public.celebrations | Authenticated create celebrations | INSERT | PERMISSIVE | {authenticated} |  | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| public.celebrations | Users can manage own celebrations | ALL | PERMISSIVE | {public} | `(user_id = auth.uid())` |  |
| public.celebrations | Users can view public celebrations | SELECT | PERMISSIVE | {public} | `((is_public = true) OR (user_id = auth.uid()))` |  |
| public.certifications | Admins can manage certifications | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.certifications | Everyone can view certifications | SELECT | PERMISSIVE | {public} | `true` |  |
| public.checkin_templates | Everyone can view templates | SELECT | PERMISSIVE | {public} | `true` |  |
| public.checkin_templates | Managers can create templates | INSERT | PERMISSIVE | {public} |  | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.checkin_templates | Template owners can manage | ALL | PERMISSIVE | {public} | `((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.checkins | Admins can view all checkins | SELECT | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.checkins | Managers can create checkins | INSERT | PERMISSIVE | {public} |  | `(manager_id = auth.uid())` |
| public.checkins | Participants can update checkins | UPDATE | PERMISSIVE | {public} | `((manager_id = auth.uid()) OR (employee_id = auth.uid()))` |  |
| public.checkins | Participants can view their checkins | SELECT | PERMISSIVE | {public} | `((manager_id = auth.uid()) OR (employee_id = auth.uid()))` |  |
| public.climate_benchmarks | Admins manage benchmarks | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.climate_benchmarks | Everyone can view benchmarks | SELECT | PERMISSIVE | {public} | `true` |  |
| public.climate_pillar_scores | Managers can view pillar scores | SELECT | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.climate_pillar_scores | System can manage pillar scores | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.climate_question_answers | Users view own answers | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM climate_survey_responses r   WHERE ((r.id = climate_question_answers.response_id) AND (r.user_id = auth.uid()))))` |  |
| public.climate_survey_questions | Managers can add survey questions | INSERT | PERMISSIVE | {public} |  | `(EXISTS ( SELECT 1    FROM climate_surveys s   WHERE ((s.id = climate_survey_questions.survey_id) AND ((s.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |
| public.climate_survey_questions | Managers can delete draft survey questions | DELETE | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM climate_surveys s   WHERE ((s.id = climate_survey_questions.survey_id) AND (s.status = 'draft'::text) AND ((s.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |  |
| public.climate_survey_questions | Managers can update survey questions | UPDATE | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM climate_surveys s   WHERE ((s.id = climate_survey_questions.survey_id) AND ((s.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |  |
| public.climate_survey_questions | View survey questions | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM climate_surveys s   WHERE ((s.id = climate_survey_questions.survey_id) AND ((s.status = ANY (ARRAY['active'::text, 'completed'::text])) OR (s.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |  |
| public.climate_survey_responses | Users can view own responses | SELECT | PERMISSIVE | {public} | `(user_id = auth.uid())` |  |
| public.climate_surveys | Admins can delete surveys | DELETE | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.climate_surveys | Creators can update surveys | UPDATE | PERMISSIVE | {public} | `((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.climate_surveys | Everyone can view active surveys | SELECT | PERMISSIVE | {public} | `((status = ANY (ARRAY['active'::text, 'completed'::text])) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.climate_surveys | Managers can create climate surveys | INSERT | PERMISSIVE | {public} |  | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.competencies | Admins can manage competencies | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.competencies | Everyone can view competencies | SELECT | PERMISSIVE | {public} | `true` |  |
| public.custom_badges | Admins can manage badges | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.custom_badges | Everyone can view active badges | SELECT | PERMISSIVE | {public} | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.custom_quests | Everyone can view active quests | SELECT | PERMISSIVE | {public} | `((status = 'active'::quest_status) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.custom_quests | Managers and admins can create quests | INSERT | PERMISSIVE | {public} |  | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.custom_quests | Managers and admins can delete their quests | DELETE | PERMISSIVE | {public} | `((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.custom_quests | Managers and admins can update their quests | UPDATE | PERMISSIVE | {public} | `((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.custom_ranks | Admins can manage ranks | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.custom_ranks | Everyone can view ranks | SELECT | PERMISSIVE | {public} | `true` |  |
| public.custom_titles | Admins can manage titles | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.custom_titles | Everyone can view active titles | SELECT | PERMISSIVE | {public} | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.demographic_attributes | Admins can manage demographic attributes | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.demographic_attributes | Everyone can view active demographic attributes | SELECT | PERMISSIVE | {public} | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.department_missions | Admins can manage missions | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.department_missions | Everyone can view active missions | SELECT | PERMISSIVE | {public} | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.department_rankings | Everyone can view rankings | SELECT | PERMISSIVE | {public} | `true` |  |
| public.department_rankings | System can manage rankings | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.department_war_contributions | department_war_contributions_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.department_war_contributions | department_war_contributions_user_select | SELECT | PERMISSIVE | {authenticated} | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.department_war_departments | dept_war_departments_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.department_war_departments | dept_war_departments_select | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.department_war_metrics | department_war_metrics_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.department_war_metrics | department_war_metrics_user_select | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.department_war_results | dept_war_results_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.department_war_results | dept_war_results_select | SELECT | PERMISSIVE | {authenticated} | `(EXISTS ( SELECT 1    FROM department_wars dw   WHERE ((dw.id = department_war_results.war_id) AND (dw.status <> 'draft'::text))))` |  |
| public.department_wars | department_wars_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.department_wars | department_wars_user_select | SELECT | PERMISSIVE | {authenticated} | `((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.departments | Admins can manage departments | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.departments | Everyone can view departments | SELECT | PERMISSIVE | {public} | `true` |  |
| public.development_plan_actions | Admins can view all plan actions | SELECT | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.development_plan_actions | Users can create plan actions | INSERT | PERMISSIVE | {public} |  | `(EXISTS ( SELECT 1    FROM development_plans dp   WHERE ((dp.id = development_plan_actions.plan_id) AND ((dp.user_id = auth.uid()) OR (dp.created_by = auth.uid())))))` |
| public.development_plan_actions | Users can delete plan actions | DELETE | PERMISSIVE | {public} | `((EXISTS ( SELECT 1    FROM development_plans dp   WHERE ((dp.id = development_plan_actions.plan_id) AND ((dp.user_id = auth.uid()) OR (dp.created_by = auth.uid()))))) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.development_plan_actions | Users can update plan actions | UPDATE | PERMISSIVE | {public} | `((EXISTS ( SELECT 1    FROM development_plans dp   WHERE ((dp.id = development_plan_actions.plan_id) AND ((dp.user_id = auth.uid()) OR (dp.created_by = auth.uid()))))) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.development_plan_actions | Users can view their plan actions | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM development_plans dp   WHERE ((dp.id = development_plan_actions.plan_id) AND ((dp.user_id = auth.uid()) OR (dp.created_by = auth.uid())))))` |  |
| public.development_plans | Admins can view all development plans | SELECT | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.development_plans | Managers can view team development plans | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM (team_members tm1      JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))   WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = development_plans.user_id))))` |  |
| public.development_plans | Users and managers can update development plans | UPDATE | PERMISSIVE | {public} | `((auth.uid() = user_id) OR (auth.uid() = created_by) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.development_plans | Users can create their own development plans | INSERT | PERMISSIVE | {public} |  | `((auth.uid() = user_id) OR (auth.uid() = created_by))` |
| public.development_plans | Users can view their own development plans | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.direct_duels | Users can create duels | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = challenger_id)` |
| public.direct_duels | Users can update their duels | UPDATE | PERMISSIVE | {public} | `((auth.uid() = challenger_id) OR (auth.uid() = opponent_id))` |  |
| public.direct_duels | Users can view their duels | SELECT | PERMISSIVE | {public} | `((auth.uid() = challenger_id) OR (auth.uid() = opponent_id))` |  |
| public.engagement_action_playbooks | engagement_action_playbooks_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.engagement_action_playbooks | engagement_action_playbooks_manager_select | SELECT | PERMISSIVE | {authenticated} | `(is_active OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.engagement_answers | engagement_answers_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.engagement_answers | engagement_answers_manager_select | SELECT | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'manager'::app_role)` |  |
| public.engagement_answers | engagement_answers_user_insert | INSERT | PERMISSIVE | {authenticated} |  | `(user_id = auth.uid())` |
| public.engagement_answers | engagement_answers_user_select_own | SELECT | PERMISSIVE | {authenticated} | `((user_id = auth.uid()) AND (NOT is_anonymous))` |  |
| public.engagement_cycles | engagement_cycles_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.engagement_cycles | engagement_cycles_user_select | SELECT | PERMISSIVE | {authenticated} | `((status = 'active'::engagement_cycle_status) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.engagement_factors | engagement_factors_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.engagement_factors | engagement_factors_user_select | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.engagement_question_assignments | engagement_question_assignments_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.engagement_question_assignments | engagement_question_assignments_user_own | SELECT | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` |  |
| public.engagement_question_pool | engagement_question_pool_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.engagement_question_pool | engagement_question_pool_user_select | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.engagement_snapshots | Admins can manage snapshots | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.engagement_snapshots | Managers can view department snapshots | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM team_members tm   WHERE ((tm.user_id = auth.uid()) AND (tm.is_manager = true) AND ((engagement_snapshots.department_id IS NULL) OR (tm.department_id = engagement_snapshots.department_id)))))` |  |
| public.enps_responses | Admins can view all responses | SELECT | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.enps_responses | Users can submit their responses | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.enps_responses | Users can view their own responses | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.enps_surveys | Admins can manage surveys | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.enps_surveys | Everyone can view active surveys | SELECT | PERMISSIVE | {public} | `((status = 'active'::text) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.entity_versions | Users can insert versions | INSERT | PERMISSIVE | {public} |  | `((auth.uid() = changed_by) OR (changed_by IS NULL))` |
| public.entity_versions | Users can view versions | SELECT | PERMISSIVE | {authenticated} | `((changed_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.executive_monthly_reports | Admins manage monthly reports | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.executive_monthly_reports | Admins read monthly reports | SELECT | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.external_api_keys | Admins can manage API keys | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.external_tasks | Admins manage external tasks | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.external_tasks | Users can view own external tasks | SELECT | PERMISSIVE | {public} | `(user_id = auth.uid())` |  |
| public.feedback_cycles | Everyone can view active cycles | SELECT | PERMISSIVE | {public} | `((status = ANY (ARRAY['active'::text, 'review'::text, 'completed'::text])) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.feedback_cycles | Managers can manage cycles | ALL | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.feedback_evaluations | Users insert own evaluations | INSERT | PERMISSIVE | {authenticated} |  | `(evaluator_id = auth.uid())` |
| public.feedback_evaluations | feedback_evaluations_select | SELECT | PERMISSIVE | {public} | `((auth.uid() = evaluator_id) OR (auth.uid() = evaluatee_id))` |  |
| public.feedback_evaluations | feedback_evaluations_update | UPDATE | PERMISSIVE | {public} | `(auth.uid() = evaluator_id)` |  |
| public.feedback_questions | feedback_questions_select | SELECT | PERMISSIVE | {public} | `true` |  |
| public.feedback_requests | Admins can view all requests | SELECT | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.feedback_requests | Managers can create requests | INSERT | PERMISSIVE | {public} |  | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.feedback_requests | Users can update their requests | UPDATE | PERMISSIVE | {public} | `(from_user_id = auth.uid())` |  |
| public.feedback_requests | Users can view their feedback requests | SELECT | PERMISSIVE | {public} | `((from_user_id = auth.uid()) OR (to_user_id = auth.uid()))` |  |
| public.feedback_responses | Admins can view all responses | SELECT | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.feedback_responses | Receivers can view non-anonymous feedback | SELECT | PERMISSIVE | {public} | `((is_anonymous = false) AND (EXISTS ( SELECT 1    FROM feedback_requests r   WHERE ((r.id = feedback_responses.request_id) AND (r.to_user_id = auth.uid())))))` |  |
| public.feedback_responses | Submitters can create responses | INSERT | PERMISSIVE | {public} |  | `(EXISTS ( SELECT 1    FROM feedback_requests r   WHERE ((r.id = feedback_responses.request_id) AND (r.from_user_id = auth.uid()))))` |
| public.feedback_responses | Submitters can view own responses | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM feedback_requests r   WHERE ((r.id = feedback_responses.request_id) AND (r.from_user_id = auth.uid()))))` |  |
| public.feedback_results | Managers insert feedback results | INSERT | PERMISSIVE | {authenticated} |  | `(has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))` |
| public.feedback_results | feedback_results_select | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.gamification_themes | Admins can manage themes | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.gamification_themes | Everyone can view active themes | SELECT | PERMISSIVE | {public} | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.geo_access_logs | Admins podem ver logs de acesso geográfico | SELECT | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.geo_access_logs | Authenticated insert geo logs | INSERT | PERMISSIVE | {authenticated} |  | `(auth.uid() IS NOT NULL)` |
| public.geo_allowed_countries | Admins can manage allowed countries | ALL | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM user_roles ur   WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role))))` |  |
| public.geo_allowed_countries | Everyone can view allowed countries | SELECT | PERMISSIVE | {public} | `true` |  |
| public.geo_blocking_rules | Admins podem gerenciar regras de geo blocking | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.geo_blocking_rules | Todos podem ver regras de geo blocking | SELECT | PERMISSIVE | {public} | `true` |  |
| public.geo_settings | Admins can manage geo settings | ALL | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM user_roles ur   WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role))))` |  |
| public.geo_settings | Everyone can view geo settings | SELECT | PERMISSIVE | {public} | `true` |  |
| public.goal_templates | goal_templates_delete | DELETE | PERMISSIVE | {authenticated} | `(EXISTS ( SELECT 1    FROM user_roles ur   WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role))))` |  |
| public.goal_templates | goal_templates_insert | INSERT | PERMISSIVE | {authenticated} |  | `(EXISTS ( SELECT 1    FROM user_roles ur   WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role))))` |
| public.goal_templates | goal_templates_select | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.goal_templates | goal_templates_update | UPDATE | PERMISSIVE | {authenticated} | `(EXISTS ( SELECT 1    FROM user_roles ur   WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role))))` | `(EXISTS ( SELECT 1    FROM user_roles ur   WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role))))` |
| public.goal_updates | Goal owners and admins can view goal updates | SELECT | PERMISSIVE | {authenticated} | `(EXISTS ( SELECT 1    FROM goals g   WHERE ((g.id = goal_updates.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |  |
| public.goal_updates | Goal owners can insert updates | INSERT | PERMISSIVE | {public} |  | `(EXISTS ( SELECT 1    FROM goals g   WHERE ((g.id = goal_updates.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |
| public.goals | Managers can manage team goals | ALL | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.goals | Users can create own goals | INSERT | PERMISSIVE | {public} |  | `(user_id = auth.uid())` |
| public.goals | Users can delete own draft goals | DELETE | PERMISSIVE | {public} | `((user_id = auth.uid()) AND (status = 'draft'::text))` |  |
| public.goals | Users can update own goals | UPDATE | PERMISSIVE | {public} | `(user_id = auth.uid())` |  |
| public.goals | Users can view company goals | SELECT | PERMISSIVE | {public} | `(goal_type = 'company'::text)` |  |
| public.goals | Users can view own goals | SELECT | PERMISSIVE | {public} | `(user_id = auth.uid())` |  |
| public.goals | Users can view team goals | SELECT | PERMISSIVE | {public} | `((goal_type = 'team'::text) AND (department_id IN ( SELECT team_members.department_id    FROM team_members   WHERE (team_members.user_id = auth.uid()))))` |  |
| public.ip_access_logs | Admins can view IP access logs | SELECT | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.ip_whitelist | Admins can delete IP whitelist | DELETE | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.ip_whitelist | Admins can insert IP whitelist | INSERT | PERMISSIVE | {authenticated} |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.ip_whitelist | Admins can update IP whitelist | UPDATE | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.ip_whitelist | Admins can view IP whitelist | SELECT | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.key_results | Goal owners and admins can view key results | SELECT | PERMISSIVE | {authenticated} | `(EXISTS ( SELECT 1    FROM goals g   WHERE ((g.id = key_results.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |  |
| public.key_results | Goal owners can manage key results | ALL | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM goals g   WHERE ((g.id = key_results.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |  |
| public.kudos | Authenticated users can give kudos | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = from_user_id)` |
| public.kudos | Public kudos are viewable by all | SELECT | PERMISSIVE | {public} | `((is_public = true) OR (from_user_id = auth.uid()) OR (to_user_id = auth.uid()))` |  |
| public.kudos | Users can delete kudos they gave | DELETE | PERMISSIVE | {public} | `(auth.uid() = from_user_id)` |  |
| public.kudos_badges | Admins can manage badges | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.kudos_badges | Everyone can view badges | SELECT | PERMISSIVE | {public} | `true` |  |
| public.league_history | Authenticated insert league history | INSERT | PERMISSIVE | {authenticated} |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.league_history | Everyone can view league history | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.leagues | Admins can manage leagues | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.leagues | Everyone can view leagues | SELECT | PERMISSIVE | {public} | `true` |  |
| public.learning_trails | Creators and admins can delete trails | DELETE | PERMISSIVE | {public} | `((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.learning_trails | Creators and admins can update trails | UPDATE | PERMISSIVE | {public} | `((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.learning_trails | Everyone can view published trails | SELECT | PERMISSIVE | {public} | `((status = 'published'::trail_status) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.learning_trails | Managers and admins can create trails | INSERT | PERMISSIVE | {public} |  | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.level_configs | Admins can manage level configs | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.level_configs | Everyone can view level configs | SELECT | PERMISSIVE | {public} | `true` |  |
| public.lightning_quiz_answers | lightning_quiz_answers_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.lightning_quiz_answers | lightning_quiz_answers_admin_select | SELECT | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.lightning_quiz_answers | lightning_quiz_answers_user_select | SELECT | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` |  |
| public.lightning_quiz_questions | lightning_quiz_questions_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.lightning_quiz_questions | lightning_quiz_questions_user_select | SELECT | PERMISSIVE | {authenticated} | `(is_active OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.lightning_quiz_sessions | lightning_quiz_sessions_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.lightning_quiz_sessions | lightning_quiz_sessions_user_own | ALL | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` | `(user_id = auth.uid())` |
| public.login_attempts | Admins can view login attempts | SELECT | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.lucky_wheel_payout_snapshots | lucky_wheel_payout_snapshots_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.lucky_wheel_prize_audit | lucky_wheel_prize_audit_admin_select | SELECT | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.lucky_wheel_prizes | lucky_wheel_prizes_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.lucky_wheel_prizes | lucky_wheel_prizes_user_select | SELECT | PERMISSIVE | {authenticated} | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.lucky_wheel_settings | lucky_wheel_settings_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.lucky_wheel_settings_audit | lucky_wheel_settings_audit_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.lucky_wheel_spins | lucky_wheel_spins_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.lucky_wheel_spins | lucky_wheel_spins_user_select | SELECT | PERMISSIVE | {authenticated} | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.lucky_wheel_whatif_snapshots | lucky_wheel_whatif_snapshots_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.memory_decks | memory_decks_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.memory_decks | memory_decks_user_select | SELECT | PERMISSIVE | {authenticated} | `(is_active OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.memory_pairs | memory_pairs_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.memory_pairs | memory_pairs_user_select | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.memory_sessions | memory_sessions_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.memory_sessions | memory_sessions_user_own | ALL | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` | `(user_id = auth.uid())` |
| public.mentorship_mission_progress | Users can insert progress for their pairs | INSERT | PERMISSIVE | {public} |  | `(EXISTS ( SELECT 1    FROM mentorship_pairs mp   WHERE ((mp.id = mentorship_mission_progress.pair_id) AND ((mp.mentor_id = auth.uid()) OR (mp.apprentice_id = auth.uid())))))` |
| public.mentorship_mission_progress | Users can update their pair progress | UPDATE | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM mentorship_pairs mp   WHERE ((mp.id = mentorship_mission_progress.pair_id) AND ((mp.mentor_id = auth.uid()) OR (mp.apprentice_id = auth.uid())))))` |  |
| public.mentorship_mission_progress | Users can view their pair progress | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM mentorship_pairs mp   WHERE ((mp.id = mentorship_mission_progress.pair_id) AND ((mp.mentor_id = auth.uid()) OR (mp.apprentice_id = auth.uid())))))` |  |
| public.mentorship_missions | Admins can manage missions | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.mentorship_missions | Everyone can view active missions | SELECT | PERMISSIVE | {public} | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.mentorship_pairs | Users can create mentorship pairs | INSERT | PERMISSIVE | {public} |  | `((auth.uid() = mentor_id) OR (auth.uid() = apprentice_id))` |
| public.mentorship_pairs | Users can update their own pairs | UPDATE | PERMISSIVE | {public} | `((auth.uid() = mentor_id) OR (auth.uid() = apprentice_id))` |  |
| public.mentorship_pairs | Users can view their own mentorship pairs | SELECT | PERMISSIVE | {public} | `((auth.uid() = mentor_id) OR (auth.uid() = apprentice_id))` |  |
| public.mentorship_requests | Users can create requests | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = requester_id)` |
| public.mentorship_requests | Users can update requests targeting them | UPDATE | PERMISSIVE | {public} | `((auth.uid() = target_id) OR (auth.uid() = requester_id))` |  |
| public.mentorship_requests | Users can view their requests | SELECT | PERMISSIVE | {public} | `((auth.uid() = requester_id) OR (auth.uid() = target_id))` |  |
| public.module_progress | Users can insert own progress | INSERT | PERMISSIVE | {public} |  | `(user_id = auth.uid())` |
| public.module_progress | Users can update own progress | UPDATE | PERMISSIVE | {public} | `(user_id = auth.uid())` |  |
| public.module_progress | Users can view own progress | SELECT | PERMISSIVE | {public} | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.mood_entries | Managers and admins can view team mood data | SELECT | PERMISSIVE | {authenticated} | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.mood_entries | Users can manage own mood entries | ALL | PERMISSIVE | {public} | `(user_id = auth.uid())` |  |
| public.new_device_alerts | Authenticated insert device alerts | INSERT | PERMISSIVE | {authenticated} |  | `(user_id = auth.uid())` |
| public.new_device_alerts | Users can update their own alerts | UPDATE | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.new_device_alerts | Users can view their own alerts | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.nine_box_evaluations | Admins and managers can create evaluations | INSERT | PERMISSIVE | {public} |  | `(has_role(auth.uid(), 'admin'::app_role) OR (EXISTS ( SELECT 1    FROM (team_members tm1      JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))   WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = nine_box_evaluations.user_id)))))` |
| public.nine_box_evaluations | Admins and managers can update evaluations | UPDATE | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR (evaluator_id = auth.uid()))` |  |
| public.nine_box_evaluations | Admins can view all evaluations | SELECT | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.nine_box_evaluations | Managers can view their team evaluations | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM (team_members tm1      JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))   WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = nine_box_evaluations.user_id))))` |  |
| public.nine_box_evaluations | Users can view their own evaluations | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.notification_preferences | Users can manage own notification preferences | ALL | PERMISSIVE | {public} | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| public.notification_templates | notification_templates_select | SELECT | PERMISSIVE | {public} | `(is_active = true)` |  |
| public.notifications | Authenticated insert notifications | INSERT | PERMISSIVE | {authenticated} |  | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| public.notifications | Users can delete their own notifications | DELETE | PERMISSIVE | {authenticated} | `(auth.uid() = user_id)` |  |
| public.notifications | Users can update their own notifications | UPDATE | PERMISSIVE | {authenticated} | `(auth.uid() = user_id)` |  |
| public.notifications | Users can view their own notifications | SELECT | PERMISSIVE | {authenticated} | `(auth.uid() = user_id)` |  |
| public.nr1_factor_mappings | nr1_factor_mappings_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.nr1_factor_mappings | nr1_factor_mappings_select | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.nr1_risk_categories | nr1_risk_categories_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.nr1_risk_categories | nr1_risk_categories_select | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.onboarding_progress | Users can insert own onboarding | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.onboarding_progress | Users can update own onboarding | UPDATE | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.onboarding_progress | Users can view own onboarding | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.opinion_responses | Responders can create responses | INSERT | PERMISSIVE | {public} |  | `((auth.uid() = responder_id) AND (EXISTS ( SELECT 1    FROM opinions o   WHERE ((o.id = opinion_responses.opinion_id) AND ((o.recipient_id = auth.uid()) OR ((o.recipient_type = 'hr'::text) AND has_role(auth.uid(), 'admin'::app_role)) OR ((o.recipient_type = 'manager'::text) AND has_role(auth.uid(), 'manager'::app_role)))))))` |
| public.opinion_responses | View opinion responses | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM opinions o   WHERE ((o.id = opinion_responses.opinion_id) AND ((o.sender_id = auth.uid()) OR (o.recipient_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |  |
| public.opinion_supports | opinion_supports_select | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.opinion_supports | opinion_supports_user_own | ALL | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` | `(user_id = auth.uid())` |
| public.opinion_tags | Manage opinion tags | ALL | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM opinions o   WHERE ((o.id = opinion_tags.opinion_id) AND ((o.recipient_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |  |
| public.opinions | Recipients can update opinions | UPDATE | PERMISSIVE | {public} | `((recipient_id = auth.uid()) OR ((recipient_type = 'hr'::text) AND has_role(auth.uid(), 'admin'::app_role)) OR ((recipient_type = 'manager'::text) AND has_role(auth.uid(), 'manager'::app_role)) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.opinions | Users can create opinions | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = sender_id)` |
| public.opinions | View opinions | SELECT | PERMISSIVE | {public} | `((sender_id = auth.uid()) OR (recipient_id = auth.uid()) OR ((recipient_type = 'hr'::text) AND has_role(auth.uid(), 'admin'::app_role)) OR ((recipient_type = 'manager'::text) AND has_role(auth.uid(), 'manager'::app_role)) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.org_members | Members can view their org membership | SELECT | PERMISSIVE | {authenticated} | `((user_id = auth.uid()) OR is_org_admin(auth.uid(), org_id))` |  |
| public.org_members | Org admins manage members | ALL | PERMISSIVE | {authenticated} | `is_org_admin(auth.uid(), org_id)` | `is_org_admin(auth.uid(), org_id)` |
| public.org_theme_history | Org admins insert history | INSERT | PERMISSIVE | {authenticated} |  | `is_org_admin(auth.uid(), org_id)` |
| public.org_theme_history | Org admins view history | SELECT | PERMISSIVE | {authenticated} | `is_org_admin(auth.uid(), org_id)` |  |
| public.organizations | Org admins can update | UPDATE | PERMISSIVE | {authenticated} | `is_org_admin(auth.uid(), id)` | `is_org_admin(auth.uid(), id)` |
| public.organizations | Public can read org branding | SELECT | PERMISSIVE | {public} | `true` |  |
| public.password_reset_requests | Managers can update team password reset requests | UPDATE | PERMISSIVE | {public} | `((EXISTS ( SELECT 1    FROM (team_members tm1      JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))   WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = password_reset_requests.user_id)))) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.password_reset_requests | Managers can view team password reset requests | SELECT | PERMISSIVE | {public} | `((EXISTS ( SELECT 1    FROM (team_members tm1      JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))   WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = password_reset_requests.user_id)))) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.password_reset_requests | Users can create own password reset requests | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.password_reset_requests | Users can view own password reset requests | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.pdi_checkins | pdi_checkins_insert | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = created_by)` |
| public.pdi_checkins | pdi_checkins_select | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM development_plans dp   WHERE ((dp.id = pdi_checkins.plan_id) AND (dp.user_id = auth.uid()))))` |  |
| public.pdi_mentors | Managers assign PDI mentors | INSERT | PERMISSIVE | {authenticated} |  | `(has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))` |
| public.pdi_mentors | pdi_mentors_delete | DELETE | PERMISSIVE | {authenticated} | `((auth.uid() = mentor_id) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.pdi_mentors | pdi_mentors_select | SELECT | PERMISSIVE | {public} | `((auth.uid() = mentor_id) OR (EXISTS ( SELECT 1    FROM development_plans dp   WHERE ((dp.id = pdi_mentors.plan_id) AND (dp.user_id = auth.uid())))))` |  |
| public.pdi_templates | pdi_templates_delete_admin | DELETE | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.pdi_templates | pdi_templates_insert_admin | INSERT | PERMISSIVE | {authenticated} |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.pdi_templates | pdi_templates_select | SELECT | PERMISSIVE | {authenticated} | `(is_active = true)` |  |
| public.pdi_templates | pdi_templates_update_admin | UPDATE | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.penalty_rules | Admins can manage penalty rules | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.penalty_rules | Everyone can view active rules | SELECT | PERMISSIVE | {public} | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.permission_groups | Admins can manage permission groups | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.permission_groups | Everyone can view permission groups | SELECT | PERMISSIVE | {public} | `true` |  |
| public.permissions | Admins can manage permissions | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.permissions | Everyone can view permissions | SELECT | PERMISSIVE | {public} | `true` |  |
| public.position_competencies | Admins manage position competencies | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.position_competencies | position_competencies_select | SELECT | PERMISSIVE | {public} | `true` |  |
| public.position_task_templates | Admins and managers can manage templates | ALL | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.position_task_templates | Everyone can view active templates | SELECT | PERMISSIVE | {public} | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.positions | Admins can manage positions | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.positions | Everyone can view positions | SELECT | PERMISSIVE | {public} | `true` |  |
| public.postmortem_actions | Admins manage postmortem actions | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.postmortems | Admins manage postmortems | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.prediction_admin_events | prediction_admin_events_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.prediction_markets | prediction_markets_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.prediction_markets | prediction_markets_user_select | SELECT | PERMISSIVE | {authenticated} | `((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.prediction_options | prediction_options_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.prediction_options | prediction_options_user_select | SELECT | PERMISSIVE | {authenticated} | `(EXISTS ( SELECT 1    FROM prediction_markets pm   WHERE ((pm.id = prediction_options.market_id) AND ((pm.status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role)))))` |  |
| public.prediction_stakes | prediction_stakes_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.prediction_stakes | prediction_stakes_user_own | ALL | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` | `(user_id = auth.uid())` |
| public.profiles | Authenticated users can view profiles | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.profiles | Users can insert their own profile | INSERT | PERMISSIVE | {authenticated} |  | `(auth.uid() = id)` |
| public.profiles | Users can update own profile | UPDATE | PERMISSIVE | {authenticated} | `(auth.uid() = id)` | `(auth.uid() = id)` |
| public.pulse_responses | Managers can view anonymous aggregated responses | SELECT | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.pulse_responses | Users can submit responses | INSERT | PERMISSIVE | {public} |  | `(user_id = auth.uid())` |
| public.pulse_responses | Users can view own responses | SELECT | PERMISSIVE | {public} | `(user_id = auth.uid())` |  |
| public.pulse_surveys | Managers can manage surveys | ALL | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.pulse_surveys | Users can view active surveys for their department | SELECT | PERMISSIVE | {public} | `((status = 'active'::text) AND ((department_id IS NULL) OR (department_id IN ( SELECT team_members.department_id    FROM team_members   WHERE (team_members.user_id = auth.uid())))))` |  |
| public.purchase_approvals | purchase_approvals_admin_all | ALL | PERMISSIVE | {authenticated} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.purchase_approvals | purchase_approvals_user_select | SELECT | PERMISSIVE | {authenticated} | `(EXISTS ( SELECT 1    FROM shop_purchases sp   WHERE ((sp.id = purchase_approvals.purchase_id) AND (sp.user_id = auth.uid()))))` |  |
| public.push_notification_logs | Users read own push logs | SELECT | PERMISSIVE | {authenticated} | `(auth.uid() = user_id)` |  |
| public.push_outbox | push_outbox_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.push_outbox | push_outbox_user_select | SELECT | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` |  |
| public.push_outbox_health_snapshots | push_outbox_health_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.push_subscriptions | Users manage own push subs | ALL | PERMISSIVE | {authenticated} | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| public.push_sync_events | push_sync_events_admin_select | SELECT | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.push_sync_events | push_sync_events_authenticated_insert | INSERT | PERMISSIVE | {authenticated} |  | `(user_id = auth.uid())` |
| public.push_sync_events | push_sync_events_user_select | SELECT | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` |  |
| public.query_telemetry | Admins can delete telemetry | DELETE | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.query_telemetry | Admins can read telemetry | SELECT | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.query_telemetry | Users can insert their own telemetry | INSERT | PERMISSIVE | {authenticated} |  | `((user_id IS NULL) OR (user_id = auth.uid()))` |
| public.quest_assignments | Managers can create assignments | INSERT | PERMISSIVE | {public} |  | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.quest_assignments | Managers can view team assignments | SELECT | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.quest_assignments | Users can update their own progress | UPDATE | PERMISSIVE | {public} | `(user_id = auth.uid())` |  |
| public.quest_assignments | Users can view their own assignments | SELECT | PERMISSIVE | {public} | `(user_id = auth.uid())` |  |
| public.quest_steps | Everyone can view steps of active quests | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM custom_quests q   WHERE ((q.id = quest_steps.quest_id) AND (q.status = 'active'::quest_status))))` |  |
| public.quest_steps | Quest creators can manage steps | ALL | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM custom_quests q   WHERE ((q.id = quest_steps.quest_id) AND ((q.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |  |
| public.quiz_answers | Users can insert own answers | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.quiz_answers | Users can view own quiz answers | SELECT | PERMISSIVE | {authenticated} | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.quiz_options | Admins and managers can manage options | ALL | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM quiz_questions q   WHERE ((q.id = quiz_options.question_id) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)))))` |  |
| public.quiz_options | Everyone can view options of active questions | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM quiz_questions q   WHERE ((q.id = quiz_options.question_id) AND ((q.is_active = true) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)))))` |  |
| public.quiz_questions | Admins and managers can manage questions | ALL | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.quiz_questions | Everyone can view active questions | SELECT | PERMISSIVE | {public} | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.quiz_scores | Everyone can view scores | SELECT | PERMISSIVE | {public} | `true` |  |
| public.quiz_scores | Users can insert their own scores | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.rate_limit_logs | Admins can view rate limit logs | SELECT | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rate_limit_rules | Admins can manage rate_limit_rules | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.role_permissions | Admins can manage role permissions | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.role_permissions | Everyone can view role permissions | SELECT | PERMISSIVE | {public} | `true` |  |
| public.roles | roles_select | SELECT | PERMISSIVE | {public} | `true` |  |
| public.runbook_executions | Admins manage runbook executions | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.sales_campaigns | campaigns_delete_admin | DELETE | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.sales_campaigns | campaigns_insert_admin_manager | INSERT | PERMISSIVE | {authenticated} |  | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.sales_campaigns | campaigns_select_authenticated | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.sales_campaigns | campaigns_update_admin_manager | UPDATE | PERMISSIVE | {authenticated} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.saved_filters | Users can delete own filters | DELETE | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.saved_filters | Users can insert own filters | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.saved_filters | Users can update own filters | UPDATE | PERMISSIVE | {public} | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| public.saved_filters | Users can view own filters | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.scratch_card_prizes | scratch_card_prizes_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.scratch_card_prizes | scratch_card_prizes_user_select | SELECT | PERMISSIVE | {authenticated} | `(is_active OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.scratch_cards | scratch_cards_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.scratch_cards | scratch_cards_user_insert | INSERT | PERMISSIVE | {authenticated} |  | `(user_id = auth.uid())` |
| public.scratch_cards | scratch_cards_user_select | SELECT | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` |  |
| public.scratch_cards | scratch_cards_user_update | UPDATE | PERMISSIVE | {authenticated} | `((user_id = auth.uid()) AND (status = 'pending'::text))` |  |
| public.seasonal_challenges | Admins can manage challenges | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.seasonal_challenges | Everyone can view challenges | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM seasonal_events e   WHERE ((e.id = seasonal_challenges.event_id) AND ((e.is_active = true) OR has_role(auth.uid(), 'admin'::app_role)))))` |  |
| public.seasonal_events | Admins can manage events | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.seasonal_events | Everyone can view active events | SELECT | PERMISSIVE | {public} | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.security_alerts | Admins can manage security alerts | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.sequence_attempts | sequence_attempts_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.sequence_attempts | sequence_attempts_user_own | ALL | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` | `(user_id = auth.uid())` |
| public.sequence_procedures | sequence_procedures_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.sequence_procedures | sequence_procedures_user_select | SELECT | PERMISSIVE | {authenticated} | `(is_active OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.sequence_steps | sequence_steps_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.sequence_steps | sequence_steps_user_select | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.session_logs | Users can update own sessions | UPDATE | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` |  |
| public.session_logs | Users can view own sessions | SELECT | PERMISSIVE | {authenticated} | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.shop_promotions | Admins can manage promotions | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.shop_promotions | Admins can view all promotions | SELECT | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.shop_promotions | Everyone can view active promotions | SELECT | PERMISSIVE | {public} | `((is_active = true) AND (starts_at <= now()) AND (ends_at > now()))` |  |
| public.shop_purchases | Admins can update purchases | UPDATE | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.shop_purchases | Admins can view all purchases | SELECT | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.shop_purchases | Users can create purchases | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.shop_purchases | Users can view own purchases | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.shop_rewards | Admins can manage rewards | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.shop_rewards | Everyone can view active rewards | SELECT | PERMISSIVE | {public} | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.sla_targets | Admins manage SLA targets | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.task_penalties | Admins can manage penalties | ALL | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.task_penalties | Managers can view all penalties | SELECT | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.task_penalties | Users can view own penalties | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.task_scores | Admins can manage task scores | ALL | PERMISSIVE | {authenticated} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| public.task_scores | Managers can view all task scores | SELECT | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.task_scores | Managers insert task scores | INSERT | PERMISSIVE | {authenticated} |  | `(has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))` |
| public.task_scores | Managers update task scores | UPDATE | PERMISSIVE | {authenticated} | `(has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))` | `(has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))` |
| public.task_scores | Users can view own task scores | SELECT | PERMISSIVE | {authenticated} | `((user_id = auth.uid()) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.team_members | Admins can manage team members | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.team_members | Managers can view their team members | SELECT | PERMISSIVE | {public} | `((auth.uid() = user_id) OR is_department_manager(auth.uid(), department_id) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.team_members | Users can view their own team membership | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.tournament_matches | tournament_matches_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.tournament_matches | tournament_matches_user_select | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.tournament_participants | tournament_participants_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.tournament_participants | tournament_participants_user_select | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| public.tournaments | tournaments_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.tournaments | tournaments_user_select | SELECT | PERMISSIVE | {authenticated} | `((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.trail_enrollments | Users can enroll themselves | INSERT | PERMISSIVE | {public} |  | `(user_id = auth.uid())` |
| public.trail_enrollments | Users can update own enrollments | UPDATE | PERMISSIVE | {public} | `(user_id = auth.uid())` |  |
| public.trail_enrollments | Users can view own enrollments | SELECT | PERMISSIVE | {public} | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.trail_modules | Everyone can view modules of published trails | SELECT | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM learning_trails t   WHERE ((t.id = trail_modules.trail_id) AND ((t.status = 'published'::trail_status) OR (t.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |  |
| public.trail_modules | Trail creators can manage modules | ALL | PERMISSIVE | {public} | `(EXISTS ( SELECT 1    FROM learning_trails t   WHERE ((t.id = trail_modules.trail_id) AND ((t.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |  |
| public.trail_prerequisites | Admins and managers can manage prerequisites | ALL | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.trail_prerequisites | Everyone can view prerequisites | SELECT | PERMISSIVE | {public} | `true` |  |
| public.user_achievements | Managers can view team achievements | SELECT | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.user_achievements | System can insert achievements | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.user_achievements | Users can view own achievements | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.user_avatar_config | Users can insert own avatar config | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.user_avatar_config | Users can update own avatar config | UPDATE | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.user_avatar_config | Users can view any avatar config | SELECT | PERMISSIVE | {public} | `true` |  |
| public.user_avatar_items | Users can insert own avatar items | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.user_avatar_items | Users can view others avatar items for display | SELECT | PERMISSIVE | {public} | `true` |  |
| public.user_avatar_items | Users can view own avatar items | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.user_cards | user_cards_admin_select | SELECT | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.user_cards | user_cards_user_all | ALL | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` | `(user_id = auth.uid())` |
| public.user_certifications | Authenticated insert certifications | INSERT | PERMISSIVE | {authenticated} |  | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| public.user_certifications | Managers can update certifications | UPDATE | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.user_certifications | Managers can view team certifications | SELECT | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.user_certifications | Users can view own certifications | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.user_challenges | Users can insert their own challenges | INSERT | PERMISSIVE | {authenticated} |  | `(auth.uid() = user_id)` |
| public.user_challenges | Users can update their own challenges | UPDATE | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.user_challenges | Users can view their own challenges | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.user_combos | Managers can view team combos | SELECT | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.user_combos | Users can insert own combos | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.user_combos | Users can update own combos | UPDATE | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.user_combos | Users can view own combos | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.user_competency_assessments | Managers insert competency assessments | INSERT | PERMISSIVE | {authenticated} |  | `(assessor_id = auth.uid())` |
| public.user_competency_assessments | user_competency_assessments_select | SELECT | PERMISSIVE | {public} | `((auth.uid() = user_id) OR (auth.uid() = assessor_id))` |  |
| public.user_demographic_values | Admins can view demographic values | SELECT | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.user_demographic_values | Users can manage own demographic values | ALL | PERMISSIVE | {public} | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| public.user_devices | Authenticated insert devices | INSERT | PERMISSIVE | {authenticated} |  | `(user_id = auth.uid())` |
| public.user_devices | Users can update their own devices | UPDATE | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.user_devices | Users can view their own devices | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.user_leagues | Everyone can view user leagues | SELECT | PERMISSIVE | {public} | `true` |  |
| public.user_leagues | System can manage user leagues | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.user_leagues | Users can insert own league | INSERT | PERMISSIVE | {public} |  | `(user_id = auth.uid())` |
| public.user_mission_progress | Users can insert own progress | INSERT | PERMISSIVE | {public} |  | `(user_id = auth.uid())` |
| public.user_mission_progress | Users can update own progress | UPDATE | PERMISSIVE | {public} | `(user_id = auth.uid())` |  |
| public.user_mission_progress | Users can view own progress | SELECT | PERMISSIVE | {public} | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.user_permission_groups | Admins can manage user permission groups | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.user_permission_groups | Users can view own permission groups | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.user_positions | Admins can manage user positions | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.user_positions | Managers can view team positions | SELECT | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.user_positions | Users can view own positions | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.user_roles | Admins can manage all roles | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.user_roles | Users can view their own roles | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.user_seasonal_progress | Managers can view all progress | SELECT | PERMISSIVE | {public} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.user_seasonal_progress | Users can insert own progress | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.user_seasonal_progress | Users can update own progress | UPDATE | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.user_seasonal_progress | Users can view own progress | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.user_titles | Admins can manage user titles | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.user_titles | Users can view own titles | SELECT | PERMISSIVE | {public} | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.user_two_factor | Users can insert their own 2FA settings | INSERT | PERMISSIVE | {authenticated} |  | `(auth.uid() = user_id)` |
| public.user_two_factor | Users can update their own 2FA settings | UPDATE | PERMISSIVE | {authenticated} | `(auth.uid() = user_id)` |  |
| public.user_two_factor | Users can view their own 2FA settings | SELECT | PERMISSIVE | {authenticated} | `(auth.uid() = user_id)` |  |
| public.wager_budget_settings | wager_budget_settings_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.wager_budget_settings | wager_budget_settings_manager_select | SELECT | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'manager'::app_role)` |  |
| public.wager_entries | wager_entries_admin_manage | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.wager_entries | wager_entries_admin_select | SELECT | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.wager_entries | wager_entries_user_select | SELECT | PERMISSIVE | {authenticated} | `(user_id = auth.uid())` |  |
| public.wager_integrity_review_events | wager_integrity_review_events_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.wager_integrity_reviews | Managers and admins can read integrity reviews | SELECT | PERMISSIVE | {authenticated} | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |  |
| public.wager_integrity_reviews | wager_integrity_reviews_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.wager_questions | wager_questions_admin_all | ALL | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.wager_questions | wager_questions_user_select | SELECT | PERMISSIVE | {authenticated} | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| public.wager_questions | wager_questions_user_select_own_entries | SELECT | PERMISSIVE | {authenticated} | `(EXISTS ( SELECT 1    FROM wager_entries e   WHERE ((e.question_id = wager_questions.id) AND (e.user_id = auth.uid()))))` |  |
| public.webauthn_challenges | Users can manage their own challenges | ALL | PERMISSIVE | {public} | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| public.webauthn_credentials | Users can delete their own credentials | DELETE | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.webauthn_credentials | Users can insert their own credentials | INSERT | PERMISSIVE | {public} |  | `(auth.uid() = user_id)` |
| public.webauthn_credentials | Users can update their own credentials | UPDATE | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.webauthn_credentials | Users can view their own credentials | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` |  |
| public.webhook_delivery_logs | Admins can view webhook logs | SELECT | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.webhook_idempotency | Service role manages idempotency | ALL | PERMISSIVE | {service_role} | `true` | `true` |
| public.webhook_subscriptions | Admins can manage webhooks | ALL | PERMISSIVE | {public} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.weekly_challenges | Admins can delete weekly challenges | DELETE | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.weekly_challenges | Admins can insert weekly challenges | INSERT | PERMISSIVE | {authenticated} |  | `has_role(auth.uid(), 'admin'::app_role)` |
| public.weekly_challenges | Admins can update weekly challenges | UPDATE | PERMISSIVE | {authenticated} | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| public.weekly_challenges | Authenticated users can view weekly challenges | SELECT | PERMISSIVE | {authenticated} | `true` |  |
| storage.objects | Authenticated users can upload course files | INSERT | PERMISSIVE | {authenticated} |  | `((bucket_id = 'course-uploads'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))` |
| storage.objects | Service role has full access to course-uploads | ALL | PERMISSIVE | {service_role} | `(bucket_id = 'course-uploads'::text)` |  |
| storage.objects | Users can view their own course files | SELECT | PERMISSIVE | {authenticated} | `((bucket_id = 'course-uploads'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))` |  |
