# 07 · REGRAS DE NEGÓCIO

> Gerado automaticamente por AI Context Sync v1.3.2 · commit `a6a9bc631d` · branch `main` · 2026-11-25 12:49 UTC
> Não edite à mão — regras humanas vão em `manual/`.

## A. Regras escritas por humanos (`manual/` — prioridade máxima, nunca sobrescrito)

_Nenhum arquivo em `manual/`. Copie `manual/TEMPLATE-regras-de-negocio.md` para `manual/regras.md` e preencha._

## B. Quem pode ver/alterar o quê (RLS — conforme migrations do repo; schema real em `06`)

| Tabela | Política | Comando | Roles | Modo | USING | WITH CHECK |
|---|---|---|---|---|---|---|
| `saved_filters` | Users can view own filters | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `saved_filters` | Users can insert own filters | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `saved_filters` | Users can update own filters | UPDATE | public | permissive | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `saved_filters` | Users can delete own filters | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `entity_versions` | Users can insert versions | INSERT | public | permissive |  | `auth.uid() = changed_by OR changed_by IS NULL` |
| `profiles` | Users can insert their own profile | INSERT | authenticated | permissive |  | `auth.uid() = id` |
| `user_roles` | Users can view their own roles | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `user_roles` | Admins can manage all roles | ALL | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `departments` | Everyone can view departments | SELECT | public | permissive | `true` |  |
| `departments` | Admins can manage departments | ALL | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `team_members` | Users can view their own team membership | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `team_members` | Admins can manage team members | ALL | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `custom_quests` | Managers and admins can create quests | INSERT | public | permissive |  | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |
| `custom_quests` | Managers and admins can update their quests | UPDATE | public | permissive | `created_by = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `custom_quests` | Managers and admins can delete their quests | DELETE | public | permissive | `created_by = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `custom_quests` | Everyone can view active quests | SELECT | public | permissive | `status = 'active' OR created_by = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `quest_steps` | Quest creators can manage steps | ALL | public | permissive | `EXISTS ( SELECT 1 FROM public.custom_quests q WHERE q.id = quest_id AND (q.created_by = auth.uid() OR has_role(auth.uid(), 'admin')) )` |  |
| `quest_steps` | Everyone can view steps of active quests | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM public.custom_quests q WHERE q.id = quest_id AND q.status = 'active' )` |  |
| `quest_assignments` | Users can view their own assignments | SELECT | public | permissive | `user_id = auth.uid()` |  |
| `quest_assignments` | Managers can view team assignments | SELECT | public | permissive | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `quest_assignments` | Managers can create assignments | INSERT | public | permissive |  | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |
| `quest_assignments` | Users can update their own progress | UPDATE | public | permissive | `user_id = auth.uid()` |  |
| `kudos_badges` | Everyone can view badges | SELECT | public | permissive | `true` |  |
| `kudos_badges` | Admins can manage badges | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `kudos` | Public kudos are viewable by all | SELECT | public | permissive | `is_public = true OR from_user_id = auth.uid() OR to_user_id = auth.uid()` |  |
| `kudos` | Authenticated users can give kudos | INSERT | public | permissive |  | `auth.uid() = from_user_id` |
| `kudos` | Users can delete kudos they gave | DELETE | public | permissive | `auth.uid() = from_user_id` |  |
| `audit_logs` | Admins can view all audit logs | SELECT | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `audit_logs` | Managers can view team audit logs | SELECT | public | permissive | `has_role(auth.uid(), 'manager'::app_role) AND EXISTS ( SELECT 1 FROM public.team_members tm1 JOIN public.team_members tm2 ON tm1.department_id = tm2.department_id WHERE tm1.user_id = auth.uid() AND tm1.is_manager = true AND tm2.user_id = audit_logs.user_id )` |  |
| `audit_logs` | Users can view own audit logs | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `learning_trails` | Everyone can view published trails | SELECT | public | permissive | `status = 'published' OR created_by = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `learning_trails` | Managers and admins can create trails | INSERT | public | permissive |  | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |
| `learning_trails` | Creators and admins can update trails | UPDATE | public | permissive | `created_by = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `learning_trails` | Creators and admins can delete trails | DELETE | public | permissive | `created_by = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `trail_modules` | Everyone can view modules of published trails | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM public.learning_trails t WHERE t.id = trail_modules.trail_id AND (t.status = 'published' OR t.created_by = auth.uid() OR has_role(auth.uid(), 'admin')) )` |  |
| `trail_modules` | Trail creators can manage modules | ALL | public | permissive | `EXISTS ( SELECT 1 FROM public.learning_trails t WHERE t.id = trail_modules.trail_id AND (t.created_by = auth.uid() OR has_role(auth.uid(), 'admin')) )` |  |
| `trail_enrollments` | Users can view own enrollments | SELECT | public | permissive | `user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `trail_enrollments` | Users can enroll themselves | INSERT | public | permissive |  | `user_id = auth.uid()` |
| `trail_enrollments` | Users can update own enrollments | UPDATE | public | permissive | `user_id = auth.uid()` |  |
| `module_progress` | Users can view own progress | SELECT | public | permissive | `user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `module_progress` | Users can insert own progress | INSERT | public | permissive |  | `user_id = auth.uid()` |
| `module_progress` | Users can update own progress | UPDATE | public | permissive | `user_id = auth.uid()` |  |
| `department_missions` | Everyone can view active missions | SELECT | public | permissive | `is_active = true OR has_role(auth.uid(), 'admin')` |  |
| `department_missions` | Admins can manage missions | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `user_mission_progress` | Users can view own progress | SELECT | public | permissive | `user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `user_mission_progress` | Users can insert own progress | INSERT | public | permissive |  | `user_id = auth.uid()` |
| `user_mission_progress` | Users can update own progress | UPDATE | public | permissive | `user_id = auth.uid()` |  |
| `department_rankings` | Everyone can view rankings | SELECT | public | permissive | `true` |  |
| `department_rankings` | System can manage rankings | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `attendance_records` | Users can view own attendance | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `attendance_records` | Users can insert own attendance | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `attendance_records` | Managers can view team attendance | SELECT | public | permissive | `has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)` |  |
| `attendance_settings` | Everyone can view settings | SELECT | public | permissive | `true` |  |
| `attendance_settings` | Admins can manage settings | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `attendance_streaks` | Users can view own streaks | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `attendance_streaks` | Users can manage own streaks | ALL | public | permissive | `auth.uid() = user_id` |  |
| `attendance_streaks` | Managers can view all streaks | SELECT | public | permissive | `has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)` |  |
| `shop_rewards` | Everyone can view active rewards | SELECT | public | permissive | `is_active = true OR has_role(auth.uid(), 'admin')` |  |
| `shop_rewards` | Admins can manage rewards | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `shop_purchases` | Users can view own purchases | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `shop_purchases` | Users can create purchases | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `shop_purchases` | Admins can view all purchases | SELECT | public | permissive | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `shop_purchases` | Admins can update purchases | UPDATE | public | permissive | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `shop_promotions` | Everyone can view active promotions | SELECT | public | permissive | `is_active = true AND starts_at <= now() AND ends_at > now()` |  |
| `shop_promotions` | Admins can view all promotions | SELECT | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `shop_promotions` | Admins can manage promotions | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `onboarding_progress` | Users can view own onboarding | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `onboarding_progress` | Users can insert own onboarding | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `onboarding_progress` | Users can update own onboarding | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `user_combos` | Users can view own combos | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `user_combos` | Users can insert own combos | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `user_combos` | Users can update own combos | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `user_combos` | Managers can view team combos | SELECT | public | permissive | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `achievements` | Everyone can view achievements | SELECT | public | permissive | `true` |  |
| `achievements` | Admins can manage achievements | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `user_achievements` | Users can view own achievements | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `user_achievements` | System can insert achievements | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `user_achievements` | Managers can view team achievements | SELECT | public | permissive | `has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)` |  |
| `activity_comments` | Everyone can view comments | SELECT | public | permissive | `true` |  |
| `activity_comments` | Authenticated users can create comments | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `activity_comments` | Users can update their own comments | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `activity_comments` | Users can delete their own comments | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `activity_reactions` | Everyone can view reactions | SELECT | public | permissive | `true` |  |
| `activity_reactions` | Authenticated users can add reactions | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `activity_reactions` | Users can remove their own reactions | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `seasonal_events` | Everyone can view active events | SELECT | public | permissive | `is_active = true OR has_role(auth.uid(), 'admin'::app_role)` |  |
| `seasonal_events` | Admins can manage events | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `seasonal_challenges` | Everyone can view challenges | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM public.seasonal_events e WHERE e.id = event_id AND (e.is_active = true OR has_role(auth.uid(), 'admin'::app_role)) )` |  |
| `seasonal_challenges` | Admins can manage challenges | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `user_seasonal_progress` | Users can view own progress | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `user_seasonal_progress` | Users can insert own progress | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `user_seasonal_progress` | Users can update own progress | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `user_seasonal_progress` | Managers can view all progress | SELECT | public | permissive | `has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)` |  |
| `mentorship_pairs` | Users can view their own mentorship pairs | SELECT | public | permissive | `auth.uid() = mentor_id OR auth.uid() = apprentice_id` |  |
| `mentorship_pairs` | Users can create mentorship pairs | INSERT | public | permissive |  | `auth.uid() = mentor_id OR auth.uid() = apprentice_id` |
| `mentorship_pairs` | Users can update their own pairs | UPDATE | public | permissive | `auth.uid() = mentor_id OR auth.uid() = apprentice_id` |  |
| `mentorship_missions` | Everyone can view active missions | SELECT | public | permissive | `is_active = true OR has_role(auth.uid(), 'admin')` |  |
| `mentorship_missions` | Admins can manage missions | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `mentorship_mission_progress` | Users can view their pair progress | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM mentorship_pairs mp WHERE mp.id = pair_id AND (mp.mentor_id = auth.uid() OR mp.apprentice_id = auth.uid()) )` |  |
| `mentorship_mission_progress` | Users can insert progress for their pairs | INSERT | public | permissive |  | `EXISTS ( SELECT 1 FROM mentorship_pairs mp WHERE mp.id = pair_id AND (mp.mentor_id = auth.uid() OR mp.apprentice_id = auth.uid()) )` |
| `mentorship_mission_progress` | Users can update their pair progress | UPDATE | public | permissive | `EXISTS ( SELECT 1 FROM mentorship_pairs mp WHERE mp.id = pair_id AND (mp.mentor_id = auth.uid() OR mp.apprentice_id = auth.uid()) )` |  |
| `mentorship_requests` | Users can view their requests | SELECT | public | permissive | `auth.uid() = requester_id OR auth.uid() = target_id` |  |
| `mentorship_requests` | Users can create requests | INSERT | public | permissive |  | `auth.uid() = requester_id` |
| `mentorship_requests` | Users can update requests targeting them | UPDATE | public | permissive | `auth.uid() = target_id OR auth.uid() = requester_id` |  |
| `direct_duels` | Users can view their duels | SELECT | public | permissive | `auth.uid() = challenger_id OR auth.uid() = opponent_id` |  |
| `direct_duels` | Users can create duels | INSERT | public | permissive |  | `auth.uid() = challenger_id` |
| `direct_duels` | Users can update their duels | UPDATE | public | permissive | `auth.uid() = challenger_id OR auth.uid() = opponent_id` |  |
| `avatar_items` | Everyone can view active avatar items | SELECT | public | permissive | `is_active = true OR has_role(auth.uid(), 'admin')` |  |
| `avatar_items` | Admins can manage avatar items | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `user_avatar_items` | Users can view own avatar items | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `user_avatar_items` | Users can view others avatar items for display | SELECT | public | permissive | `true` |  |
| `user_avatar_items` | Users can insert own avatar items | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `user_avatar_config` | Users can view any avatar config | SELECT | public | permissive | `true` |  |
| `user_avatar_config` | Users can insert own avatar config | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `user_avatar_config` | Users can update own avatar config | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `team_members` | Managers can view their team members | SELECT | public | permissive | `auth.uid() = user_id OR is_department_manager(auth.uid(), department_id) OR has_role(auth.uid(), 'admin'::app_role)` |  |
| `certifications` | Everyone can view certifications | SELECT | public | permissive | `true` |  |
| `certifications` | Admins can manage certifications | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `user_certifications` | Users can view own certifications | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `user_certifications` | Managers can view team certifications | SELECT | public | permissive | `has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)` |  |
| `user_certifications` | Managers can update certifications | UPDATE | public | permissive | `has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)` |  |
| `trail_prerequisites` | Everyone can view prerequisites | SELECT | public | permissive | `true` |  |
| `trail_prerequisites` | Admins and managers can manage prerequisites | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)` |  |
| `quiz_scores` | Users can insert their own scores | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `quiz_scores` | Everyone can view scores | SELECT | public | permissive | `true` |  |
| `quiz_questions` | Admins and managers can manage questions | ALL | public | permissive | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `quiz_questions` | Everyone can view active questions | SELECT | public | permissive | `is_active = true OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `quiz_options` | Admins and managers can manage options | ALL | public | permissive | `EXISTS ( SELECT 1 FROM quiz_questions q WHERE q.id = quiz_options.question_id AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')) )` |  |
| `quiz_answers` | Users can insert own answers | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `ai_coach_messages` | Users can view their own messages | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `ai_coach_messages` | Users can insert their own messages | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `ai_coach_messages` | Users can delete their own messages | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `bitrix24_tokens` | Admins can manage bitrix tokens | ALL | public | permissive | `EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')` |  |
| `bitrix24_sync_mappings` | Admins and managers can view sync mappings | SELECT | public | permissive | `EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))` |  |
| `bitrix24_sync_mappings` | Admins can manage sync mappings | ALL | public | permissive | `EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')` |  |
| `bitrix24_webhook_logs` | Admins can view webhook logs | SELECT | public | permissive | `EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')` |  |
| `goals` | Users can view own goals | SELECT | public | permissive | `user_id = auth.uid()` |  |
| `goals` | Users can view team goals | SELECT | public | permissive | `goal_type = 'team' AND department_id IN ( SELECT department_id FROM public.team_members WHERE user_id = auth.uid() )` |  |
| `goals` | Users can view company goals | SELECT | public | permissive | `goal_type = 'company'` |  |
| `goals` | Users can create own goals | INSERT | public | permissive |  | `user_id = auth.uid()` |
| `goals` | Users can update own goals | UPDATE | public | permissive | `user_id = auth.uid()` |  |
| `goals` | Users can delete own draft goals | DELETE | public | permissive | `user_id = auth.uid() AND status = 'draft'` |  |
| `goals` | Managers can manage team goals | ALL | public | permissive | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `key_results` | Goal owners can manage key results | ALL | public | permissive | `EXISTS ( SELECT 1 FROM public.goals g WHERE g.id = goal_id AND (g.user_id = auth.uid() OR has_role(auth.uid(), 'admin')) )` |  |
| `goal_updates` | Goal owners can insert updates | INSERT | public | permissive |  | `EXISTS ( SELECT 1 FROM public.goals g WHERE g.id = goal_id AND (g.user_id = auth.uid() OR has_role(auth.uid(), 'admin')) )` |
| `leagues` | Everyone can view leagues | SELECT | public | permissive | `true` |  |
| `leagues` | Admins can manage leagues | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `user_leagues` | Everyone can view user leagues | SELECT | public | permissive | `true` |  |
| `user_leagues` | System can manage user leagues | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `user_leagues` | Users can insert own league | INSERT | public | permissive |  | `user_id = auth.uid()` |
| `checkin_templates` | Everyone can view templates | SELECT | public | permissive | `true` |  |
| `checkin_templates` | Managers can create templates | INSERT | public | permissive |  | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |
| `checkin_templates` | Template owners can manage | ALL | public | permissive | `created_by = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `checkins` | Participants can view their checkins | SELECT | public | permissive | `manager_id = auth.uid() OR employee_id = auth.uid()` |  |
| `checkins` | Managers can create checkins | INSERT | public | permissive |  | `manager_id = auth.uid()` |
| `checkins` | Participants can update checkins | UPDATE | public | permissive | `manager_id = auth.uid() OR employee_id = auth.uid()` |  |
| `checkins` | Admins can view all checkins | SELECT | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `pulse_surveys` | Users can view active surveys for their department | SELECT | public | permissive | `status = 'active' AND ( department_id IS NULL OR department_id IN (SELECT department_id FROM public.team_members WHERE user_id = auth.uid()) )` |  |
| `pulse_surveys` | Managers can manage surveys | ALL | public | permissive | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `pulse_responses` | Users can submit responses | INSERT | public | permissive |  | `user_id = auth.uid()` |
| `pulse_responses` | Users can view own responses | SELECT | public | permissive | `user_id = auth.uid()` |  |
| `pulse_responses` | Managers can view anonymous aggregated responses | SELECT | public | permissive | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `celebrations` | Users can view public celebrations | SELECT | public | permissive | `is_public = true OR user_id = auth.uid()` |  |
| `celebrations` | Users can manage own celebrations | ALL | public | permissive | `user_id = auth.uid()` |  |
| `mood_entries` | Users can manage own mood entries | ALL | public | permissive | `user_id = auth.uid()` |  |
| `announcements` | Everyone can view published announcements | SELECT | public | permissive | `published_at IS NOT NULL AND published_at <= now() AND (expires_at IS NULL OR expires_at > now()) AND (department_id IS NULL OR department_id IN (SELECT department_id FROM public.team_members WHERE user_id = auth.uid()))` |  |
| `announcements` | Managers can create announcements | INSERT | public | permissive |  | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |
| `announcements` | Authors can manage own announcements | UPDATE | public | permissive | `author_id = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `announcements` | Admins can delete announcements | DELETE | public | permissive | `author_id = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `announcement_reactions` | Users can react to announcements | ALL | public | permissive | `user_id = auth.uid()` |  |
| `announcement_reactions` | Everyone can view reactions | SELECT | public | permissive | `true` |  |
| `announcement_reads` | Users can mark as read | INSERT | public | permissive |  | `user_id = auth.uid()` |
| `announcement_reads` | Users can view own reads | SELECT | public | permissive | `user_id = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `feedback_cycles` | Everyone can view active cycles | SELECT | public | permissive | `status IN ('active', 'review', 'completed') OR created_by = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `feedback_cycles` | Managers can manage cycles | ALL | public | permissive | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `feedback_requests` | Users can view their feedback requests | SELECT | public | permissive | `from_user_id = auth.uid() OR to_user_id = auth.uid()` |  |
| `feedback_requests` | Managers can create requests | INSERT | public | permissive |  | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |
| `feedback_requests` | Users can update their requests | UPDATE | public | permissive | `from_user_id = auth.uid()` |  |
| `feedback_requests` | Admins can view all requests | SELECT | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `feedback_responses` | Submitters can create responses | INSERT | public | permissive |  | `EXISTS ( SELECT 1 FROM public.feedback_requests r WHERE r.id = request_id AND r.from_user_id = auth.uid() )` |
| `feedback_responses` | Submitters can view own responses | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM public.feedback_requests r WHERE r.id = request_id AND r.from_user_id = auth.uid() )` |  |
| `feedback_responses` | Receivers can view non-anonymous feedback | SELECT | public | permissive | `is_anonymous = false AND EXISTS ( SELECT 1 FROM public.feedback_requests r WHERE r.id = request_id AND r.to_user_id = auth.uid() )` |  |
| `feedback_responses` | Admins can view all responses | SELECT | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `positions` | Everyone can view positions | SELECT | public | permissive | `true` |  |
| `positions` | Admins can manage positions | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `position_task_templates` | Everyone can view active templates | SELECT | public | permissive | `is_active = true OR has_role(auth.uid(), 'admin')` |  |
| `position_task_templates` | Admins and managers can manage templates | ALL | public | permissive | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `user_positions` | Users can view own positions | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `user_positions` | Managers can view team positions | SELECT | public | permissive | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `user_positions` | Admins can manage user positions | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `task_scores` | Managers can view all task scores | SELECT | public | permissive | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `task_penalties` | Users can view own penalties | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `task_penalties` | Managers can view all penalties | SELECT | public | permissive | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `task_penalties` | Admins can manage penalties | ALL | public | permissive | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `penalty_rules` | Everyone can view active rules | SELECT | public | permissive | `is_active = true OR has_role(auth.uid(), 'admin')` |  |
| `penalty_rules` | Admins can manage penalty rules | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `external_api_keys` | Admins can manage API keys | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `api_request_logs` | Admins can view API logs | SELECT | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `webhook_subscriptions` | Admins can manage webhooks | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `webhook_delivery_logs` | Admins can view webhook logs | SELECT | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `external_tasks` | Users can view own external tasks | SELECT | public | permissive | `user_id = auth.uid()` |  |
| `gamification_themes` | Everyone can view active themes | SELECT | public | permissive | `is_active = true OR has_role(auth.uid(), 'admin')` |  |
| `gamification_themes` | Admins can manage themes | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `custom_ranks` | Everyone can view ranks | SELECT | public | permissive | `true` |  |
| `custom_ranks` | Admins can manage ranks | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `custom_badges` | Everyone can view active badges | SELECT | public | permissive | `is_active = true OR has_role(auth.uid(), 'admin')` |  |
| `custom_badges` | Admins can manage badges | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `custom_titles` | Everyone can view active titles | SELECT | public | permissive | `is_active = true OR has_role(auth.uid(), 'admin')` |  |
| `custom_titles` | Admins can manage titles | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `user_titles` | Users can view own titles | SELECT | public | permissive | `user_id = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `user_titles` | Admins can manage user titles | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `level_configs` | Everyone can view level configs | SELECT | public | permissive | `true` |  |
| `level_configs` | Admins can manage level configs | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `competencies` | Everyone can view competencies | SELECT | public | permissive | `true` |  |
| `competencies` | Admins can manage competencies | ALL | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `nine_box_evaluations` | Users can view their own evaluations | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `nine_box_evaluations` | Admins can view all evaluations | SELECT | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `nine_box_evaluations` | Managers can view their team evaluations | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM team_members tm1 JOIN team_members tm2 ON tm1.department_id = tm2.department_id WHERE tm1.user_id = auth.uid() AND tm1.is_manager = true AND tm2.user_id = nine_box_evaluations.user_id )` |  |
| `nine_box_evaluations` | Admins and managers can create evaluations | INSERT | public | permissive |  | `public.has_role(auth.uid(), 'admin') OR EXISTS ( SELECT 1 FROM team_members tm1 JOIN team_members tm2 ON tm1.department_id = tm2.department_id WHERE tm1.user_id = auth.uid() AND tm1.is_manager = true AND tm2.user_id = nine_box_evaluations.user_id )` |
| `nine_box_evaluations` | Admins and managers can update evaluations | UPDATE | public | permissive | `public.has_role(auth.uid(), 'admin') OR evaluator_id = auth.uid()` |  |
| `development_plans` | Users can view their own development plans | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `development_plans` | Admins can view all development plans | SELECT | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `development_plans` | Managers can view team development plans | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM team_members tm1 JOIN team_members tm2 ON tm1.department_id = tm2.department_id WHERE tm1.user_id = auth.uid() AND tm1.is_manager = true AND tm2.user_id = development_plans.user_id )` |  |
| `development_plans` | Users can create their own development plans | INSERT | public | permissive |  | `auth.uid() = user_id OR auth.uid() = created_by` |
| `development_plans` | Users and managers can update development plans | UPDATE | public | permissive | `auth.uid() = user_id OR auth.uid() = created_by OR public.has_role(auth.uid(), 'admin')` |  |
| `development_plan_actions` | Users can view their plan actions | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM development_plans dp WHERE dp.id = development_plan_actions.plan_id AND (dp.user_id = auth.uid() OR dp.created_by = auth.uid()) )` |  |
| `development_plan_actions` | Admins can view all plan actions | SELECT | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `development_plan_actions` | Users can create plan actions | INSERT | public | permissive |  | `EXISTS ( SELECT 1 FROM development_plans dp WHERE dp.id = development_plan_actions.plan_id AND (dp.user_id = auth.uid() OR dp.created_by = auth.uid()) )` |
| `development_plan_actions` | Users can update plan actions | UPDATE | public | permissive | `EXISTS ( SELECT 1 FROM development_plans dp WHERE dp.id = development_plan_actions.plan_id AND (dp.user_id = auth.uid() OR dp.created_by = auth.uid()) ) OR public.has_role(auth.uid(), 'admin')` |  |
| `development_plan_actions` | Users can delete plan actions | DELETE | public | permissive | `EXISTS ( SELECT 1 FROM development_plans dp WHERE dp.id = development_plan_actions.plan_id AND (dp.user_id = auth.uid() OR dp.created_by = auth.uid()) ) OR public.has_role(auth.uid(), 'admin')` |  |
| `enps_surveys` | Everyone can view active surveys | SELECT | public | permissive | `status = 'active' OR public.has_role(auth.uid(), 'admin')` |  |
| `enps_surveys` | Admins can manage surveys | ALL | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `enps_responses` | Users can submit their responses | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `enps_responses` | Users can view their own responses | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `enps_responses` | Admins can view all responses | SELECT | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `engagement_snapshots` | Admins can manage snapshots | ALL | public | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `engagement_snapshots` | Managers can view department snapshots | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM team_members tm WHERE tm.user_id = auth.uid() AND tm.is_manager = true AND (engagement_snapshots.department_id IS NULL OR tm.department_id = engagement_snapshots.department_id) )` |  |
| `ip_whitelist` | Admins can view IP whitelist | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `ip_whitelist` | Admins can insert IP whitelist | INSERT | authenticated | permissive |  | `public.has_role(auth.uid(), 'admin')` |
| `ip_whitelist` | Admins can update IP whitelist | UPDATE | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `ip_whitelist` | Admins can delete IP whitelist | DELETE | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `ip_access_logs` | Admins can view IP access logs | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `climate_benchmarks` | Everyone can view benchmarks | SELECT | public | permissive | `true` |  |
| `climate_benchmarks` | Admins manage benchmarks | ALL | public | permissive | `has_role(auth.uid(), 'admin')` |  |
| `opinions` | Users can create opinions | INSERT | public | permissive |  | `auth.uid() = sender_id` |
| `opinions` | Recipients can update opinions | UPDATE | public | permissive | `recipient_id = auth.uid() OR (recipient_type = 'hr' AND has_role(auth.uid(), 'admin')) OR (recipient_type = 'manager' AND has_role(auth.uid(), 'manager')) OR has_role(auth.uid(), 'admin')` |  |
| `action_plans` | View action plans | SELECT | public | permissive | `owner_id = auth.uid() OR reviewer_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |  |
| `action_plans` | Managers create action plans | INSERT | public | permissive |  | `has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')` |
| `action_plans` | Owners update action plans | UPDATE | public | permissive | `owner_id = auth.uid() OR reviewer_id = auth.uid() OR has_role(auth.uid(), 'admin')` |  |
| `action_plans` | Admins delete action plans | DELETE | public | permissive | `has_role(auth.uid(), 'admin') OR owner_id = auth.uid()` |  |
| `action_plan_items` | View action plan items | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM action_plans ap WHERE ap.id = plan_id AND (ap.owner_id = auth.uid() OR ap.reviewer_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')) )` |  |
| `action_plan_items` | Manage action plan items | ALL | public | permissive | `EXISTS ( SELECT 1 FROM action_plans ap WHERE ap.id = plan_id AND (ap.owner_id = auth.uid() OR has_role(auth.uid(), 'admin')) )` |  |
| `action_plan_updates` | View action plan updates | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM action_plans ap WHERE ap.id = plan_id AND (ap.owner_id = auth.uid() OR ap.reviewer_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')) )` |  |
| `action_plan_updates` | Create action plan updates | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `feedback_questions` | feedback_questions_select | SELECT | public | permissive | `true` |  |
| `feedback_evaluations` | feedback_evaluations_select | SELECT | public | permissive | `auth.uid() = evaluator_id OR auth.uid() = evaluatee_id` |  |
| `feedback_evaluations` | feedback_evaluations_update | UPDATE | public | permissive | `auth.uid() = evaluator_id` |  |
| `feedback_results` | feedback_results_select | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `pdi_mentors` | pdi_mentors_select | SELECT | public | permissive | `auth.uid() = mentor_id OR EXISTS (SELECT 1 FROM public.development_plans dp WHERE dp.id = plan_id AND dp.user_id = auth.uid())` |  |
| `pdi_checkins` | pdi_checkins_select | SELECT | public | permissive | `EXISTS (SELECT 1 FROM public.development_plans dp WHERE dp.id = plan_id AND dp.user_id = auth.uid())` |  |
| `pdi_checkins` | pdi_checkins_insert | INSERT | public | permissive |  | `auth.uid() = created_by` |
| `position_competencies` | position_competencies_select | SELECT | public | permissive | `true` |  |
| `user_competency_assessments` | user_competency_assessments_select | SELECT | public | permissive | `auth.uid() = user_id OR auth.uid() = assessor_id` |  |
| `permissions` | permissions_select | SELECT | public | permissive | `true` |  |
| `roles` | roles_select | SELECT | public | permissive | `true` |  |
| `role_permissions` | role_permissions_select | SELECT | public | permissive | `true` |  |
| `notification_templates` | notification_templates_select | SELECT | public | permissive | `is_active = true` |  |
| `password_reset_requests` | Users can view own password reset requests | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `password_reset_requests` | Managers can view team password reset requests | SELECT | public | permissive | `EXISTS ( SELECT 1 FROM public.team_members tm1 JOIN public.team_members tm2 ON tm1.department_id = tm2.department_id WHERE tm1.user_id = auth.uid() AND tm1.is_manager = true AND tm2.user_id = password_reset_requests.user_id ) OR public.has_role(auth.uid(), 'admin')` |  |
| `password_reset_requests` | Users can create own password reset requests | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `password_reset_requests` | Managers can update team password reset requests | UPDATE | public | permissive | `EXISTS ( SELECT 1 FROM public.team_members tm1 JOIN public.team_members tm2 ON tm1.department_id = tm2.department_id WHERE tm1.user_id = auth.uid() AND tm1.is_manager = true AND tm2.user_id = password_reset_requests.user_id ) OR public.has_role(auth.uid(), 'admin')` |  |
| `user_two_factor` | Users can view their own 2FA settings | SELECT | authenticated | permissive | `auth.uid() = user_id` |  |
| `user_two_factor` | Users can insert their own 2FA settings | INSERT | authenticated | permissive |  | `auth.uid() = user_id` |
| `user_two_factor` | Users can update their own 2FA settings | UPDATE | authenticated | permissive | `auth.uid() = user_id` |  |
| `rate_limit_logs` | Admins can view rate limit logs | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `blocked_ips` | Admins can manage blocked IPs | ALL | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` | `public.has_role(auth.uid(), 'admin')` |
| `session_logs` | Users can view own sessions | SELECT | authenticated | permissive | `user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')` |  |
| `session_logs` | Users can update own sessions | UPDATE | authenticated | permissive | `user_id = auth.uid()` |  |
| `login_attempts` | Admins can view login attempts | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `security_alerts` | Admins can manage security alerts | ALL | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` | `public.has_role(auth.uid(), 'admin')` |
| `rate_limit_rules` | Admins can manage rate limit rules | ALL | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` | `public.has_role(auth.uid(), 'admin')` |
| `user_devices` | Users can view their own devices | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `user_devices` | Users can update their own devices | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `new_device_alerts` | Users can view their own alerts | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `new_device_alerts` | Users can update their own alerts | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `webauthn_credentials` | Users can view their own credentials | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `webauthn_credentials` | Users can insert their own credentials | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `webauthn_credentials` | Users can update their own credentials | UPDATE | public | permissive | `auth.uid() = user_id` |  |
| `webauthn_credentials` | Users can delete their own credentials | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `permissions` | Admins can manage permissions | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `role_permissions` | Admins can manage role permissions | ALL | public | permissive | `has_role(auth.uid(), 'admin'::app_role)` |  |
| `geo_allowed_countries` | Admins can manage allowed countries | ALL | public | permissive | `EXISTS ( SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role )` |  |
| `geo_settings` | Admins can manage geo settings | ALL | public | permissive | `EXISTS ( SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role )` |  |
| `task_scores` | Users can view own task scores | SELECT | authenticated | permissive | `user_id = auth.uid() OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)` |  |
| `task_scores` | Admins can manage task scores | ALL | authenticated | permissive | `has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)` | `has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)` |
| `external_tasks` | Admins manage external tasks | ALL | authenticated | permissive | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| `position_competencies` | Admins manage position competencies | ALL | authenticated | permissive | `has_role(auth.uid(), 'admin'::app_role)` | `has_role(auth.uid(), 'admin'::app_role)` |
| `feedback_evaluations` | Users insert own evaluations | INSERT | authenticated | permissive |  | `evaluator_id = auth.uid()` |
| `feedback_results` | Managers insert feedback results | INSERT | authenticated | permissive |  | `has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)` |
| `pdi_mentors` | Managers assign PDI mentors | INSERT | authenticated | permissive |  | `has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)` |
| … +225 linhas — lista completa em `context.json` | | | | | | |

## C. Restrições de dados (obrigatório / único / default / CHECK / FK / calculada)

| Tabela | Coluna | Regra |
|---|---|---|
| `saved_filters` | `id` | PK; default gen_random_uuid() |
| `saved_filters` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `saved_filters` | `entity_type` | obrigatório |
| `saved_filters` | `name` | obrigatório |
| `saved_filters` | `filters` | default '{}'::jsonb |
| `saved_filters` | `is_default` | default false |
| `saved_filters` | `created_at` | default NOW() |
| `saved_filters` | `updated_at` | default NOW() |
| `saved_filters` | `(tabela)` | CONSTRAINT unique_filter_name_per_user_entity UNIQUE (user_id, entity_type, name) |
| `entity_versions` | `id` | PK; default gen_random_uuid() |
| `entity_versions` | `entity_type` | obrigatório |
| `entity_versions` | `entity_id` | obrigatório |
| `entity_versions` | `version_number` | obrigatório |
| `entity_versions` | `data` | default '{}'::jsonb |
| `entity_versions` | `changed_by` | FK → users.id |
| `entity_versions` | `changed_at` | default NOW() |
| `entity_versions` | `(tabela)` | CONSTRAINT unique_entity_version UNIQUE (entity_type, entity_id, version_number) |
| `profiles` | `id` | PK; FK → users.id ON DELETE CASCADE |
| `profiles` | `level` | default 1 |
| `profiles` | `xp` | default 0 |
| `profiles` | `coins` | default 0 |
| `profiles` | `streak` | default 0 |
| `profiles` | `best_streak` | default 0 |
| `profiles` | `quests_completed` | default 0 |
| `profiles` | `created_at` | default now() |
| `profiles` | `updated_at` | default now() |
| `profiles` | `status` | obrigatório |
| `user_roles` | `id` | PK; default gen_random_uuid() |
| `user_roles` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `user_roles` | `role` | default 'employee' |
| `user_roles` | `created_at` | default now() |
| `user_roles` | `(tabela)` | UNIQUE (user_id, role) |
| `departments` | `id` | PK; default gen_random_uuid() |
| `departments` | `created_at` | obrigatório |
| `departments` | `name` | obrigatório |
| `departments` | `updated_at` | obrigatório |
| `team_members` | `id` | PK; default gen_random_uuid() |
| `team_members` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `team_members` | `department_id` | obrigatório; FK → departments.id ON DELETE CASCADE |
| `team_members` | `is_manager` | default false |
| `team_members` | `joined_at` | default now() |
| `team_members` | `(tabela)` | UNIQUE (user_id, department_id) |
| `custom_quests` | `id` | PK; default gen_random_uuid() |
| `custom_quests` | `title` | obrigatório |
| `custom_quests` | `description` | obrigatório |
| `custom_quests` | `icon` | default '📚' |
| `custom_quests` | `difficulty` | default 'medium' |
| `custom_quests` | `xp_reward` | default 100 |
| `custom_quests` | `coin_reward` | default 50 |
| `custom_quests` | `status` | default 'draft' |
| `custom_quests` | `department_id` | FK → departments.id ON DELETE SET NULL |
| `custom_quests` | `created_by` | obrigatório |
| `custom_quests` | `created_at` | default now() |
| `custom_quests` | `updated_at` | default now() |
| `quest_steps` | `id` | PK; default gen_random_uuid() |
| `quest_steps` | `quest_id` | obrigatório; FK → custom_quests.id ON DELETE CASCADE |
| `quest_steps` | `title` | obrigatório |
| `quest_steps` | `order_index` | default 0 |
| `quest_steps` | `xp_reward` | default 25 |
| `quest_steps` | `created_at` | default now() |
| `quest_assignments` | `id` | PK; default gen_random_uuid() |
| `quest_assignments` | `quest_id` | obrigatório; FK → custom_quests.id ON DELETE CASCADE |
| `quest_assignments` | `user_id` | obrigatório |
| `quest_assignments` | `current_step` | default 0 |
| `quest_assignments` | `started_at` | default now() |
| `notifications` | `id` | PK; default gen_random_uuid() |
| `notifications` | `user_id` | obrigatório |
| `notifications` | `type` | default 'info' |
| `notifications` | `title` | obrigatório |
| `notifications` | `data` | default '{}' |
| `notifications` | `read` | default false |
| `notifications` | `created_at` | default now() |
| `kudos_badges` | `id` | PK; default gen_random_uuid() |
| `kudos_badges` | `name` | obrigatório |
| `kudos_badges` | `icon` | default '⭐' |
| `kudos_badges` | `category` | default 'general' |
| `kudos_badges` | `xp_value` | default 25 |
| `kudos_badges` | `created_at` | default now() |
| `kudos` | `id` | PK; default gen_random_uuid() |
| `kudos` | `from_user_id` | obrigatório |
| `kudos` | `to_user_id` | obrigatório |
| `kudos` | `badge_id` | FK → kudos_badges.id ON DELETE SET NULL |
| `kudos` | `message` | obrigatório |
| `kudos` | `is_public` | default true |
| `kudos` | `created_at` | default now() |
| `kudos` | `(tabela)` | CONSTRAINT kudos_not_self CHECK (from_user_id != to_user_id) |
| `audit_logs` | `id` | PK; default gen_random_uuid() |
| `audit_logs` | `user_id` | obrigatório |
| `audit_logs` | `action` | obrigatório |
| `audit_logs` | `entity_type` | obrigatório |
| `audit_logs` | `metadata` | default '{}'::jsonb |
| `audit_logs` | `created_at` | default now() |
| `learning_trails` | `id` | PK; default gen_random_uuid() |
| `learning_trails` | `title` | obrigatório |
| `learning_trails` | `icon` | default '📚' |
| `learning_trails` | `department_id` | FK → departments.id |
| `learning_trails` | `estimated_hours` | default 1 |
| `learning_trails` | `xp_reward` | default 100 |
| `learning_trails` | `coin_reward` | default 50 |
| `learning_trails` | `status` | default 'draft' |
| `learning_trails` | `order_index` | default 0 |
| `learning_trails` | `created_by` | obrigatório |
| `learning_trails` | `created_at` | default now() |
| `learning_trails` | `updated_at` | default now() |
| `trail_modules` | `id` | PK; default gen_random_uuid() |
| `trail_modules` | `trail_id` | obrigatório; FK → learning_trails.id ON DELETE CASCADE |
| `trail_modules` | `title` | obrigatório |
| `trail_modules` | `content_type` | default 'text' |
| `trail_modules` | `content` | default '{}' |
| `trail_modules` | `xp_reward` | default 25 |
| `trail_modules` | `duration_minutes` | default 15 |
| `trail_modules` | `order_index` | default 0 |
| `trail_modules` | `created_at` | default now() |
| `trail_modules` | `updated_at` | default now() |
| `trail_enrollments` | `id` | PK; default gen_random_uuid() |
| `trail_enrollments` | `user_id` | obrigatório |
| `trail_enrollments` | `trail_id` | obrigatório; FK → learning_trails.id ON DELETE CASCADE |
| `trail_enrollments` | `started_at` | default now() |
| `trail_enrollments` | `progress_percent` | default 0 |
| `trail_enrollments` | `(tabela)` | UNIQUE(user_id, trail_id) |
| `module_progress` | `id` | PK; default gen_random_uuid() |
| `module_progress` | `user_id` | obrigatório |
| `module_progress` | `module_id` | obrigatório; FK → trail_modules.id ON DELETE CASCADE |
| `module_progress` | `started_at` | default now() |
| `module_progress` | `attempts` | default 0 |
| `module_progress` | `(tabela)` | UNIQUE(user_id, module_id) |
| `department_missions` | `id` | PK; default gen_random_uuid() |
| `department_missions` | `department_id` | FK → departments.id |
| `department_missions` | `title` | obrigatório |
| `department_missions` | `frequency` | default 'daily' |
| `department_missions` | `xp_reward` | default 30 |
| `department_missions` | `coin_reward` | default 0 |
| `department_missions` | `target_value` | default 1 |
| `department_missions` | `metric_key` | obrigatório |
| `department_missions` | `icon` | default '🎯' |
| `department_missions` | `is_active` | default true |
| `department_missions` | `order_index` | default 0 |
| `department_missions` | `created_at` | default now() |
| `department_missions` | `updated_at` | default now() |
| `user_mission_progress` | `id` | PK; default gen_random_uuid() |
| `user_mission_progress` | `user_id` | obrigatório |
| `user_mission_progress` | `mission_id` | obrigatório; FK → department_missions.id ON DELETE CASCADE |
| `user_mission_progress` | `current_value` | default 0 |
| `user_mission_progress` | `period_start` | obrigatório |
| `user_mission_progress` | `period_end` | obrigatório |
| `user_mission_progress` | `claimed` | default false |
| `user_mission_progress` | `created_at` | default now() |
| `user_mission_progress` | `(tabela)` | UNIQUE(user_id, mission_id, period_start) |
| `department_rankings` | `id` | PK; default gen_random_uuid() |
| `department_rankings` | `department_id` | obrigatório; FK → departments.id |
| `department_rankings` | `user_id` | obrigatório |
| `department_rankings` | `period_type` | default 'weekly' |
| `department_rankings` | `period_start` | obrigatório |
| `department_rankings` | `period_end` | obrigatório |
| `department_rankings` | `metrics` | default '{}' |
| `department_rankings` | `total_score` | default 0 |
| `department_rankings` | `created_at` | default now() |
| `department_rankings` | `updated_at` | default now() |
| `department_rankings` | `(tabela)` | UNIQUE(department_id, user_id, period_type, period_start) |
| `attendance_records` | `id` | PK; default gen_random_uuid() |
| `attendance_records` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `attendance_records` | `is_punctual` | default false |
| `attendance_records` | `late_minutes` | default 0 |
| `attendance_records` | `created_at` | default now() |
| `attendance_records` | `check_in` | obrigatório |
| `attendance_records` | `(tabela)` | check_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() |
| `attendance_records` | `(tabela)` | check_out TIMESTAMP WITH TIME ZONE |
| `attendance_settings` | `id` | PK; default gen_random_uuid() |
| `attendance_settings` | `department_id` | FK → departments.id ON DELETE CASCADE |
| `attendance_settings` | `work_start_time` | default '08:00:00' |
| `attendance_settings` | `work_end_time` | default '18:00:00' |
| `attendance_settings` | `tolerance_minutes` | default 10 |
| `attendance_settings` | `xp_punctual_checkin` | default 15 |
| `attendance_settings` | `xp_streak_bonus` | default 50 |
| `attendance_settings` | `streak_milestone` | default 5 |
| `attendance_settings` | `created_at` | default now() |
| `attendance_settings` | `updated_at` | default now() |
| `attendance_streaks` | `id` | PK; default gen_random_uuid() |
| `attendance_streaks` | `user_id` | obrigatório; único; FK → users.id ON DELETE CASCADE |
| `attendance_streaks` | `current_streak` | default 0 |
| `attendance_streaks` | `best_streak` | default 0 |
| `attendance_streaks` | `total_punctual_days` | default 0 |
| `attendance_streaks` | `updated_at` | default now() |
| `shop_rewards` | `id` | PK; default gen_random_uuid() |
| `shop_rewards` | `name` | obrigatório |
| `shop_rewards` | `category` | default 'product' |
| `shop_rewards` | `price_coins` | default 100 |
| `shop_rewards` | `rarity` | default 'common' |
| `shop_rewards` | `is_active` | default true |
| `shop_rewards` | `created_at` | default now() |
| `shop_rewards` | `updated_at` | default now() |
| `shop_purchases` | `id` | PK; default gen_random_uuid() |
| `shop_purchases` | `user_id` | obrigatório; FK → profiles.id ON DELETE CASCADE |
| `shop_purchases` | `reward_id` | obrigatório; FK → shop_rewards.id ON DELETE CASCADE |
| `shop_purchases` | `status` | default 'pending' |
| `shop_purchases` | `quantity` | default 1 |
| `shop_purchases` | `total_coins` | obrigatório |
| `shop_purchases` | `created_at` | default now() |
| `shop_purchases` | `requires_dual_approval` | obrigatório |
| `shop_purchases` | `risk_factors` | obrigatório |
| `shop_purchases` | `(tabela)` | constraint shop_purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE |
| `shop_promotions` | `id` | PK; default gen_random_uuid() |
| `shop_promotions` | `reward_id` | obrigatório; FK → shop_rewards.id ON DELETE CASCADE |
| `shop_promotions` | `title` | obrigatório |
| `shop_promotions` | `discount_percent` | CHECK discount_percent >= 0 AND discount_percent <= 100 |
| `shop_promotions` | `starts_at` | default now() |
| `shop_promotions` | `ends_at` | obrigatório |
| `shop_promotions` | `is_active` | default true |
| `shop_promotions` | `current_claims` | default 0 |
| `shop_promotions` | `created_at` | default now() |
| `shop_promotions` | `updated_at` | default now() |
| `onboarding_progress` | `id` | PK; default gen_random_uuid() |
| `onboarding_progress` | `user_id` | obrigatório; único |
| `onboarding_progress` | `current_step` | default 0 |
| `onboarding_progress` | `completed_steps` | default '{}' |
| `onboarding_progress` | `rewards_claimed` | default '{}' |
| `onboarding_progress` | `started_at` | default now() |
| `onboarding_progress` | `created_at` | default now() |
| `onboarding_progress` | `updated_at` | default now() |
| `user_combos` | `id` | PK; default gen_random_uuid() |
| `user_combos` | `user_id` | obrigatório |
| `user_combos` | `combo_date` | default CURRENT_DATE |
| `user_combos` | `actions_count` | default 0 |
| `user_combos` | `current_multiplier` | default 1.0 |
| `user_combos` | `max_multiplier_reached` | default 1.0 |
| `user_combos` | `total_bonus_xp` | default 0 |
| `user_combos` | `last_action_at` | default now() |
| `user_combos` | `created_at` | default now() |
| `user_combos` | `updated_at` | default now() |
| `user_combos` | `(tabela)` | UNIQUE(user_id, combo_date) |
| `achievements` | `id` | PK; default gen_random_uuid() |
| `achievements` | `key` | obrigatório; único |
| `achievements` | `name` | obrigatório |
| `achievements` | `icon` | default '🏆' |
| `achievements` | `category` | default 'general' |
| `achievements` | `xp_reward` | default 50 |
| `achievements` | `coin_reward` | default 25 |
| `achievements` | `rarity` | default 'common' |
| `achievements` | `created_at` | default now() |
| `user_achievements` | `id` | PK; default gen_random_uuid() |
| `user_achievements` | `user_id` | obrigatório |
| `user_achievements` | `achievement_id` | obrigatório; FK → achievements.id ON DELETE CASCADE |
| `user_achievements` | `unlocked_at` | default now() |
| `user_achievements` | `(tabela)` | UNIQUE(user_id, achievement_id) |
| `weekly_challenges` | `id` | PK; default gen_random_uuid() |
| `weekly_challenges` | `challenger_id` | obrigatório |
| `weekly_challenges` | `opponent_id` | obrigatório |
| `weekly_challenges` | `week_start` | default DATE_TRUNC('week' |
| `weekly_challenges` | `week_end` | default (DATE_TRUNC('week' |
| `weekly_challenges` | `challenger_xp_start` | default 0 |
| `weekly_challenges` | `opponent_xp_start` | default 0 |
| `weekly_challenges` | `challenger_xp_gained` | default 0 |
| `weekly_challenges` | `opponent_xp_gained` | default 0 |
| `weekly_challenges` | `xp_reward` | default 100 |
| `weekly_challenges` | `coin_reward` | default 50 |
| `weekly_challenges` | `status` | default 'active'; CHECK status IN ('active', 'completed', 'expired') |
| `weekly_challenges` | `created_at` | default now() |
| `weekly_challenges` | `updated_at` | default now() |
| `weekly_challenges` | `(tabela)` | CONSTRAINT different_users CHECK (challenger_id != opponent_id) |
| `activity_comments` | `id` | PK; default gen_random_uuid() |
| `activity_comments` | `activity_id` | obrigatório |
| `activity_comments` | `user_id` | obrigatório |
| `activity_comments` | `content` | obrigatório |
| `activity_comments` | `created_at` | default now() |
| `activity_comments` | `updated_at` | default now() |
| `activity_reactions` | `id` | PK; default gen_random_uuid() |
| `activity_reactions` | `activity_id` | obrigatório |
| `activity_reactions` | `user_id` | obrigatório |
| `activity_reactions` | `emoji` | obrigatório |
| `activity_reactions` | `created_at` | default now() |
| `activity_reactions` | `(tabela)` | UNIQUE(activity_id, user_id, emoji) |
| `seasonal_events` | `id` | PK; default gen_random_uuid() |
| `seasonal_events` | `title` | obrigatório |
| `seasonal_events` | `theme` | obrigatório |
| `seasonal_events` | `icon` | default '🎄' |
| `seasonal_events` | `banner_color` | default '#dc2626' |
| `seasonal_events` | `starts_at` | obrigatório |
| `seasonal_events` | `ends_at` | obrigatório |
| `seasonal_events` | `is_active` | default true |
| `seasonal_events` | `xp_multiplier` | default 1.5 |
| `seasonal_events` | `created_at` | default now() |
| `seasonal_events` | `updated_at` | default now() |
| `seasonal_challenges` | `id` | PK; default gen_random_uuid() |
| `seasonal_challenges` | `event_id` | obrigatório; FK → seasonal_events.id ON DELETE CASCADE |
| `seasonal_challenges` | `title` | obrigatório |
| `seasonal_challenges` | `icon` | default '🎯' |
| `seasonal_challenges` | `target_value` | default 1 |
| `seasonal_challenges` | `metric_key` | obrigatório |
| `seasonal_challenges` | `xp_reward` | default 100 |
| `seasonal_challenges` | `coin_reward` | default 50 |
| `seasonal_challenges` | `order_index` | default 0 |
| `seasonal_challenges` | `created_at` | default now() |
| `user_seasonal_progress` | `id` | PK; default gen_random_uuid() |
| `user_seasonal_progress` | `user_id` | obrigatório |
| `user_seasonal_progress` | `challenge_id` | obrigatório; FK → seasonal_challenges.id ON DELETE CASCADE |
| `user_seasonal_progress` | `current_value` | default 0 |
| `user_seasonal_progress` | `claimed` | default false |
| `user_seasonal_progress` | `created_at` | default now() |
| `user_seasonal_progress` | `updated_at` | default now() |
| `user_seasonal_progress` | `(tabela)` | UNIQUE(user_id, challenge_id) |
| … +1809 linhas — lista completa em `context.json` | | |

## D. Automações no banco (triggers e funções — regras que rodam sozinhas)

| Trigger | Quando | Tabela | Executa | Condição |
|---|---|---|---|---|
| trigger_saved_filters_updated_at | BEFORE UPDATE | `saved_filters` | `update_saved_filters_updated_at` |  |
| trigger_single_default_filter | BEFORE INSERT OR UPDATE OF IS_DEFAULT | `saved_filters` | `ensure_single_default_filter` | `NEW.is_default = true` |
| update_profiles_updated_at | BEFORE UPDATE | `profiles` | `update_updated_at_column` |  |
| update_departments_updated_at | BEFORE UPDATE | `departments` | `update_updated_at_column` |  |
| update_custom_quests_updated_at | BEFORE UPDATE | `custom_quests` | `update_updated_at_column` |  |
| update_learning_trails_updated_at | BEFORE UPDATE | `learning_trails` | `update_updated_at_column` |  |
| update_trail_modules_updated_at | BEFORE UPDATE | `trail_modules` | `update_updated_at_column` |  |
| update_department_missions_updated_at | BEFORE UPDATE | `department_missions` | `update_updated_at_column` |  |
| update_department_rankings_updated_at | BEFORE UPDATE | `department_rankings` | `update_updated_at_column` |  |
| update_shop_rewards_updated_at | BEFORE UPDATE | `shop_rewards` | `update_updated_at_column` |  |
| update_shop_promotions_updated_at | BEFORE UPDATE | `shop_promotions` | `update_updated_at_column` |  |
| update_onboarding_progress_updated_at | BEFORE UPDATE | `onboarding_progress` | `update_updated_at_column` |  |
| update_user_combos_updated_at | BEFORE UPDATE | `user_combos` | `update_updated_at_column` |  |
| update_weekly_challenges_updated_at | BEFORE UPDATE | `weekly_challenges` | `update_updated_at_column` |  |
| update_mentorship_pairs_updated_at | BEFORE UPDATE | `mentorship_pairs` | `update_updated_at_column` |  |
| update_mentorship_mission_progress_updated_at | BEFORE UPDATE | `mentorship_mission_progress` | `update_updated_at_column` |  |
| update_direct_duels_updated_at | BEFORE UPDATE | `direct_duels` | `update_updated_at_column` |  |
| update_user_avatar_config_updated_at | BEFORE UPDATE | `user_avatar_config` | `update_updated_at_column` |  |
| update_certifications_updated_at | BEFORE UPDATE | `certifications` | `update_updated_at_column` |  |
| update_user_certifications_updated_at | BEFORE UPDATE | `user_certifications` | `update_updated_at_column` |  |
| update_quiz_questions_updated_at | BEFORE UPDATE | `quiz_questions` | `update_updated_at_column` |  |
| update_bitrix24_tokens_updated_at | BEFORE UPDATE | `bitrix24_tokens` | `update_updated_at_column` |  |
| update_bitrix24_sync_mappings_updated_at | BEFORE UPDATE | `bitrix24_sync_mappings` | `update_updated_at_column` |  |
| update_goals_updated_at | BEFORE UPDATE | `goals` | `update_updated_at_column` |  |
| update_key_results_updated_at | BEFORE UPDATE | `key_results` | `update_updated_at_column` |  |
| update_user_leagues_updated_at | BEFORE UPDATE | `user_leagues` | `update_updated_at_column` |  |
| update_checkins_updated_at | BEFORE UPDATE | `checkins` | `update_updated_at_column` |  |
| update_pulse_surveys_updated_at | BEFORE UPDATE | `pulse_surveys` | `update_updated_at_column` |  |
| update_announcements_updated_at | BEFORE UPDATE | `announcements` | `update_updated_at_column` |  |
| update_feedback_cycles_updated_at | BEFORE UPDATE | `feedback_cycles` | `update_updated_at_column` |  |
| update_feedback_requests_updated_at | BEFORE UPDATE | `feedback_requests` | `update_updated_at_column` |  |
| update_positions_updated_at | BEFORE UPDATE | `positions` | `update_updated_at_column` |  |
| update_position_task_templates_updated_at | BEFORE UPDATE | `position_task_templates` | `update_updated_at_column` |  |
| update_task_scores_updated_at | BEFORE UPDATE | `task_scores` | `update_updated_at_column` |  |
| update_penalty_rules_updated_at | BEFORE UPDATE | `penalty_rules` | `update_updated_at_column` |  |
| update_external_api_keys_updated_at | BEFORE UPDATE | `external_api_keys` | `update_updated_at_column` |  |
| update_webhook_subscriptions_updated_at | BEFORE UPDATE | `webhook_subscriptions` | `update_updated_at_column` |  |
| update_external_tasks_updated_at | BEFORE UPDATE | `external_tasks` | `update_updated_at_column` |  |
| update_ip_whitelist_updated_at | BEFORE UPDATE | `ip_whitelist` | `update_updated_at_column` |  |
| update_notification_templates_updated_at | BEFORE UPDATE | `notification_templates` | `update_updated_at_column` |  |
| update_password_reset_requests_updated_at | BEFORE UPDATE | `password_reset_requests` | `update_updated_at_column` |  |
| update_user_two_factor_updated_at | BEFORE UPDATE | `user_two_factor` | `update_updated_at_column` |  |
| set_updated_at_user_challenges | BEFORE UPDATE | `user_challenges` | `handle_updated_at` |  |
| trg_security_alerts_dispatch_critical | AFTER INSERT | `security_alerts` | `trigger_dispatch_critical_alert` |  |
| trg_sla_targets_updated | BEFORE UPDATE | `sla_targets` | `update_updated_at_column` |  |
| trg_postmortems_updated_at | BEFORE UPDATE | `postmortems` | `update_updated_at_column` |  |
| trg_auto_create_postmortem | AFTER UPDATE | `security_alerts` | `auto_create_postmortem_on_resolve` |  |
| trg_postmortem_actions_updated_at | BEFORE UPDATE | `postmortem_actions` | `update_updated_at_column` |  |
| trg_pm_action_completed | BEFORE UPDATE | `postmortem_actions` | `set_postmortem_action_completed_at` |  |
| trg_notify_admins_monthly_report | AFTER INSERT | `executive_monthly_reports` | `notify_admins_of_monthly_report` |  |
| trg_ai_course_jobs_updated_at | BEFORE UPDATE | `ai_course_jobs` | `update_updated_at_column` |  |
| update_organizations_updated_at | BEFORE UPDATE | `organizations` | `update_updated_at_column` |  |
| trg_sales_campaigns_updated_at | BEFORE UPDATE | `sales_campaigns` | `update_updated_at_column` |  |
| trg_campaign_participants_updated_at | BEFORE UPDATE | `campaign_participants` | `update_updated_at_column` |  |
| trg_push_subs_updated_at | BEFORE UPDATE | `push_subscriptions` | `update_updated_at_column` |  |
| trg_engagement_factors_updated | BEFORE UPDATE | `engagement_factors` | `update_updated_at_column` |  |
| trg_eqp_updated | BEFORE UPDATE | `engagement_question_pool` | `update_updated_at_column` |  |
| trg_ecycles_updated | BEFORE UPDATE | `engagement_cycles` | `update_updated_at_column` |  |
| trg_playbooks_updated | BEFORE UPDATE | `engagement_action_playbooks` | `update_updated_at_column` |  |
| trg_nr1_categories_updated | BEFORE UPDATE | `nr1_risk_categories` | `update_updated_at_column` |  |
| trg_trim_push_sync_events | AFTER INSERT | `push_sync_events` | `trim_push_sync_events` |  |
| update_opinions_updated_at | BEFORE UPDATE | `opinions` | `update_updated_at_column` |  |
| trg_campaign_result_imports_updated_at | BEFORE UPDATE | `campaign_result_imports` | `update_updated_at_column` |  |
| trg_campaign_result_rows_updated_at | BEFORE UPDATE | `campaign_result_rows` | `update_updated_at_column` |  |
| trg_campaign_teams_updated_at | BEFORE UPDATE | `campaign_teams` | `handle_updated_at` |  |
| trg_campaign_team_members_consistency | BEFORE INSERT OR UPDATE | `campaign_team_members` | `enforce_campaign_team_consistency` |  |
| trg_log_purchase_requested | AFTER INSERT | `shop_purchases` | `log_purchase_requested` |  |
| lucky_wheel_prizes_audit | AFTER INSERT OR UPDATE OR DELETE | `lucky_wheel_prizes` | `log_lucky_wheel_prize_change` |  |
| trg_lucky_wheel_payout_snapshots_updated_at | BEFORE UPDATE | `lucky_wheel_payout_snapshots` | `update_updated_at_column` |  |
| trg_lucky_wheel_settings_updated | BEFORE UPDATE | `lucky_wheel_settings` | `update_updated_at_column` |  |
| trg_lucky_wheel_budget_audit | AFTER INSERT OR UPDATE | `lucky_wheel_settings` | `log_lucky_wheel_budget_change` |  |
| trg_lucky_wheel_whatif_updated_at | BEFORE UPDATE | `lucky_wheel_whatif_snapshots` | `update_updated_at_column` |  |
| scratch_card_prizes_updated_at | BEFORE UPDATE | `scratch_card_prizes` | `handle_updated_at` |  |
| scratch_cards_updated_at | BEFORE UPDATE | `scratch_cards` | `handle_updated_at` |  |
| lightning_questions_updated_at | BEFORE UPDATE | `lightning_quiz_questions` | `handle_updated_at` |  |
| lightning_sessions_updated_at | BEFORE UPDATE | `lightning_quiz_sessions` | `handle_updated_at` |  |
| update_bingo_boards_updated_at | BEFORE UPDATE | `bingo_boards` | `update_updated_at_column` |  |
| update_bingo_cards_updated_at | BEFORE UPDATE | `bingo_cards` | `update_updated_at_column` |  |
| trg_tournaments_updated_at | BEFORE UPDATE | `tournaments` | `handle_updated_at` |  |
| trg_tournament_participants_updated_at | BEFORE UPDATE | `tournament_participants` | `handle_updated_at` |  |
| trg_tournament_matches_updated_at | BEFORE UPDATE | `tournament_matches` | `handle_updated_at` |  |
| trg_validate_department_war | BEFORE INSERT OR UPDATE | `department_wars` | `validate_department_war` |  |
| trg_war_hook_trail_enrollments | AFTER INSERT OR UPDATE OF COMPLETED_AT | `trail_enrollments` | `war_hook_trail_enrollments` |  |
| trg_war_hook_module_progress | AFTER INSERT OR UPDATE OF COMPLETED_AT | `module_progress` | `war_hook_module_progress` |  |
| trg_war_hook_quiz_scores | AFTER INSERT | `quiz_scores` | `war_hook_quiz_scores` |  |
| trg_war_hook_kudos | AFTER INSERT | `kudos` | `war_hook_kudos` |  |
| trg_auctions_updated_at | BEFORE UPDATE | `auctions` | `handle_updated_at` |  |
| trg_auctions_validate_window | BEFORE INSERT OR UPDATE | `auctions` | `validate_auction_window` |  |
| trg_auction_bids_updated_at | BEFORE UPDATE | `auction_bids` | `handle_updated_at` |  |
| push_outbox_updated_at | BEFORE UPDATE | `push_outbox` | `handle_updated_at` |  |
| trg_prediction_markets_updated_at | BEFORE UPDATE | `prediction_markets` | `handle_updated_at` |  |
| trg_log_prediction_settlement | AFTER UPDATE OF STATUS | `prediction_markets` | `log_prediction_settlement` |  |
| trg_card_definitions_updated | BEFORE UPDATE | `card_definitions` | `handle_updated_at` |  |
| trg_user_cards_updated | BEFORE UPDATE | `user_cards` | `handle_updated_at` |  |
| trg_card_packs_updated | BEFORE UPDATE | `card_packs` | `handle_updated_at` |  |
| trg_card_trades_updated | BEFORE UPDATE | `card_trades` | `handle_updated_at` |  |
| set_card_set_claims_updated_at | BEFORE UPDATE | `card_set_claims` | `update_updated_at_column` |  |
| trg_card_pack_trail_enrollments | AFTER INSERT OR UPDATE OF COMPLETED_AT | `trail_enrollments` | `card_pack_hook_trail_enrollments` |  |
| trg_card_pack_attendance_streaks | AFTER INSERT OR UPDATE OF CURRENT_STREAK | `attendance_streaks` | `card_pack_hook_attendance_streaks` |  |
| trg_card_pack_notify | AFTER INSERT | `card_packs` | `card_pack_notify` |  |
| update_boss_battles_updated_at | BEFORE UPDATE | `boss_battles` | `update_updated_at_column` |  |
| trg_boss_damage_task_scores | AFTER INSERT OR UPDATE | `task_scores` | `boss_hook_task_scores` |  |
| trg_boss_damage_trail_enrollments | AFTER INSERT OR UPDATE | `trail_enrollments` | `boss_hook_trail_enrollments` |  |
| trg_boss_damage_attendance_streaks | AFTER INSERT OR UPDATE | `attendance_streaks` | `boss_hook_attendance_streaks` |  |
| trg_boss_phase_alert | AFTER UPDATE OF CURRENT_HP | `boss_battles` | `boss_phase_alert_hook` |  |
| update_boss_win_rate_goals_updated_at | BEFORE UPDATE | `boss_win_rate_goals` | `update_updated_at_column` |  |
| update_memory_decks_updated_at | BEFORE UPDATE | `memory_decks` | `update_updated_at_column` |  |
| update_memory_pairs_updated_at | BEFORE UPDATE | `memory_pairs` | `update_updated_at_column` |  |
| update_memory_sessions_updated_at | BEFORE UPDATE | `memory_sessions` | `update_updated_at_column` |  |
| update_sequence_procedures_updated_at | BEFORE UPDATE | `sequence_procedures` | `update_updated_at_column` |  |
| update_sequence_steps_updated_at | BEFORE UPDATE | `sequence_steps` | `update_updated_at_column` |  |
| update_wager_questions_updated_at | BEFORE UPDATE | `wager_questions` | `update_updated_at_column` |  |
| trg_wager_budget_settings_updated | BEFORE UPDATE | `wager_budget_settings` | `update_updated_at_column` |  |
| update_wager_integrity_reviews_updated_at | BEFORE UPDATE | `wager_integrity_reviews` | `update_updated_at_column` |  |
| trg_log_wager_integrity_review_event | AFTER INSERT OR UPDATE | `wager_integrity_reviews` | `log_wager_integrity_review_event` |  |
| update_board_trails_updated_at | BEFORE UPDATE | `board_trails` | `update_updated_at_column` |  |
| update_board_tiles_updated_at | BEFORE UPDATE | `board_tiles` | `update_updated_at_column` |  |
| update_board_player_states_updated_at | BEFORE UPDATE | `board_player_states` | `update_updated_at_column` |  |
| trg_sync_board_blocked_at | BEFORE INSERT OR UPDATE OF BLOCKED_CHALLENGE_ID | `board_player_states` | `sync_board_blocked_at` |  |
| on_auth_user_created | AFTER INSERT | `auth.users` | `handle_new_user` |  |
| trg_goal_templates_updated_at | BEFORE UPDATE | `goal_templates` | `set_goal_templates_updated_at` |  |

Erros lançados por funções SQL (`RAISE EXCEPTION` = regra de negócio no banco):

| Função | Mensagem | Origem |
|---|---|---|
| `_require_admin` | insufficient_privilege | `supabase/migrations/20260711194726_d4508070-d4f0-4b68-9cc4-83171b3b1d84.sql` |
| `_require_manager_or_admin` | insufficient_privilege | `supabase/migrations/20260712110233_c2c516f4-081f-48da-a073-abbbe32b95c6.sql` |
| `get_webhook_delivery_stats_24h` | access_denied: admin role required | `supabase/migrations/20260712191659_7162f535-958f-4c45-8b50-f0a1eaa0028c.sql` |
| `rotate_webhook_secret` | insufficient_privilege | `supabase/migrations/20260712195808_a0bac812-0690-4dda-9776-845e547e1aac.sql` |
| `rotate_webhook_secret` | secret deve ter no mínimo 32 caracteres | `supabase/migrations/20260712195808_a0bac812-0690-4dda-9776-845e547e1aac.sql` |
| `rotate_webhook_secret` | assinatura % não encontrada | `supabase/migrations/20260712195808_a0bac812-0690-4dda-9776-845e547e1aac.sql` |
| `promote_webhook_secret` | insufficient_privilege | `supabase/migrations/20260712195808_a0bac812-0690-4dda-9776-845e547e1aac.sql` |
| `promote_webhook_secret` | nenhuma rotação pendente para assinatura % | `supabase/migrations/20260712195808_a0bac812-0690-4dda-9776-845e547e1aac.sql` |
| `cancel_webhook_secret_rotation` | insufficient_privilege | `supabase/migrations/20260712195808_a0bac812-0690-4dda-9776-845e547e1aac.sql` |
| `auto_promote_expired_webhook_secrets` | insufficient_privilege | `supabase/migrations/20260712200006_664f7c03-75c3-4a12-9b8d-1d6da5c917d2.sql` |
| `bulk_rotate_webhook_secrets` | insufficient_privilege | `supabase/migrations/20260712202617_24a1ee09-af6a-41fa-a1c6-5f1ab66a38cd.sql` |
| `bulk_rotate_webhook_secrets` | p_rotations deve ser array não vazio | `supabase/migrations/20260712202617_24a1ee09-af6a-41fa-a1c6-5f1ab66a38cd.sql` |
| `get_webhook_executive_metrics_7d` | access_denied: admin role required | `supabase/migrations/20260712202813_38016c62-951f-49b3-9f97-c150ff3038a7.sql` |
| `check_webhook_sla_and_alert` | insufficient_privilege | `supabase/migrations/20260712203117_fac39bdd-c966-4e9e-96f4-feee404f2a82.sql` |
| `get_alert_mttr_by_type_7d` | access denied | `supabase/migrations/20260712212133_a815b65a-0490-4e0c-9248-1f8af4e2cb59.sql` |
| `get_alert_heatmap_30d` | access denied | `supabase/migrations/20260712212246_06f7d299-1d75-4657-bf85-550154c984b5.sql` |
| `get_reliability_slo` | forbidden: admin_only | `supabase/migrations/20260712214816_6fc5c315-ea1a-4b7e-90af-4cd2960bd17a.sql` |
| `acknowledge_security_alert` | forbidden | `supabase/migrations/20260712220916_7df9a342-9572-4145-996a-0f4460cdba43.sql` |
| `log_runbook_step` | not authorized | `supabase/migrations/20260712221325_fc3b81b7-c5dd-4214-bead-4cdb3abf112d.sql` |
| `get_incident_metrics` | not authorized | `supabase/migrations/20260712221704_bedd64f9-3dae-4e14-b609-5482a05f82d4.sql` |
| `check_sla_breaches_and_alert` | insufficient_privilege | `supabase/migrations/20260712222009_147eee74-b689-46b7-b92b-d903d1e4754b.sql` |
| `check_overdue_postmortem_actions` | insufficient_privilege | `supabase/migrations/20260712222316_d8f7eabc-3e3b-437f-b041-70b9f3b88f9b.sql` |
| `generate_executive_monthly_report` | insufficient_privilege | `supabase/migrations/20260712222455_cdcbc232-1f35-4c6c-9c2c-0e4bf903e241.sql` |
| `get_burn_rate` | access denied | `supabase/migrations/20260712223931_ecd3fd87-8d7c-4758-ae38-4dcead1b95bd.sql` |
| `assign_engagement_questions` | not authenticated | `supabase/migrations/20260726155435_b82d6b05-57d8-4571-9bb7-61b8d28b8c2f.sql` |
| `submit_engagement_answer` | not authenticated | `supabase/migrations/20260726160248_bfb5652a-bbaa-44cf-9e3d-270014e00449.sql` |
| `generate_action_plan_from_factor` | Autenticacao obrigatoria | `supabase/migrations/20260726160940_73598534-820c-416f-8663-cb0272ff160a.sql` |
| `generate_action_plan_from_factor` | Apenas gestores e administradores podem gerar planos de acao | `supabase/migrations/20260726160940_73598534-820c-416f-8663-cb0272ff160a.sql` |
| `generate_action_plan_from_factor` | Fator de engajamento nao encontrado: % | `supabase/migrations/20260726160940_73598534-820c-416f-8663-cb0272ff160a.sql` |
| `generate_action_plan_from_nr1_category` | Autenticacao obrigatoria | `supabase/migrations/20260726161955_76f4a445-1f0f-430f-abf1-7218834a3649.sql` |
| `generate_action_plan_from_nr1_category` | Apenas gestores e administradores podem gerar planos de acao | `supabase/migrations/20260726161955_76f4a445-1f0f-430f-abf1-7218834a3649.sql` |
| `generate_action_plan_from_nr1_category` | Categoria de risco NR-1 nao encontrada: % | `supabase/migrations/20260726161955_76f4a445-1f0f-430f-abf1-7218834a3649.sql` |
| `generate_action_plan_from_nr1_category` | Nenhum fator de clima ativo mapeado para a categoria % | `supabase/migrations/20260726161955_76f4a445-1f0f-430f-abf1-7218834a3649.sql` |
| `toggle_opinion_support` | Nao autenticado | `supabase/migrations/20260726182807_60e2ae2c-7399-42d5-80ca-722803ff15c9.sql` |
| `toggle_opinion_support` | Manifestacao inexistente | `supabase/migrations/20260726182807_60e2ae2c-7399-42d5-80ca-722803ff15c9.sql` |
| `respond_to_opinion` | Nao autenticado | `supabase/migrations/20260726182807_60e2ae2c-7399-42d5-80ca-722803ff15c9.sql` |
| `respond_to_opinion` | Sem permissao para tratar esta manifestacao | `supabase/migrations/20260726182807_60e2ae2c-7399-42d5-80ca-722803ff15c9.sql` |
| `respond_to_opinion` | Resposta muito curta | `supabase/migrations/20260726182807_60e2ae2c-7399-42d5-80ca-722803ff15c9.sql` |
| `set_opinion_status` | Sem permissao para tratar esta manifestacao | `supabase/migrations/20260726182807_60e2ae2c-7399-42d5-80ca-722803ff15c9.sql` |
| `generate_action_plan_from_opinion` | Sem permissao para tratar esta manifestacao | `supabase/migrations/20260726183048_19ef339e-010a-4695-80e5-3e0448a5bf44.sql` |
| `generate_action_plan_from_opinion` | Manifestacao inexistente | `supabase/migrations/20260726183048_19ef339e-010a-4695-80e5-3e0448a5bf44.sql` |
| `revoke_push_device` | not_authenticated | `supabase/migrations/20260726183456_991e0996-06a9-4aeb-995c-65460c007e0c.sql` |
| `revoke_push_device` | device_not_found | `supabase/migrations/20260726183456_991e0996-06a9-4aeb-995c-65460c007e0c.sql` |
| `revoke_device_by_fingerprint` | not_authenticated | `supabase/migrations/20260726183456_991e0996-06a9-4aeb-995c-65460c007e0c.sql` |
| `revoke_device_by_fingerprint` | device_not_found | `supabase/migrations/20260726183456_991e0996-06a9-4aeb-995c-65460c007e0c.sql` |
| `revoke_device_by_fingerprint` | device_not_found | `supabase/migrations/20260726183456_991e0996-06a9-4aeb-995c-65460c007e0c.sql` |
| `generate_certificate_code` | Não foi possível gerar um código de certificado único | `supabase/migrations/20260726185840_57bbd481-d667-4468-9244-bd32ae41da59.sql` |
| `apply_campaign_import` | forbidden: apenas administradores ou gestores podem aplicar importações | `supabase/migrations/20260727100045_69d56c43-b506-405f-8469-2c59a6bf1cdf.sql` |
| `apply_campaign_import` | import_not_found | `supabase/migrations/20260727100045_69d56c43-b506-405f-8469-2c59a6bf1cdf.sql` |
| `apply_campaign_import` | invalid_state: lote já processado (%) | `supabase/migrations/20260727100045_69d56c43-b506-405f-8469-2c59a6bf1cdf.sql` |
| `revert_campaign_import` | forbidden: apenas administradores ou gestores podem reverter importações | `supabase/migrations/20260727100045_69d56c43-b506-405f-8469-2c59a6bf1cdf.sql` |
| `revert_campaign_import` | import_not_found | `supabase/migrations/20260727100045_69d56c43-b506-405f-8469-2c59a6bf1cdf.sql` |
| `revert_campaign_import` | invalid_state: apenas lotes aplicados podem ser revertidos (%) | `supabase/migrations/20260727100045_69d56c43-b506-405f-8469-2c59a6bf1cdf.sql` |
| `enforce_campaign_team_consistency` | team_not_found | `supabase/migrations/20260727171415_85c57bb0-f886-41ab-bd07-e3a1688256ec.sql` |
| `enforce_campaign_team_consistency` | team_campaign_mismatch | `supabase/migrations/20260727171415_85c57bb0-f886-41ab-bd07-e3a1688256ec.sql` |
| `review_purchase` | Autenticação obrigatória | `supabase/migrations/20260727183427_72f9c05a-39cb-439b-9460-a965561e3d62.sql` |
| `review_purchase` | Permissão negada | `supabase/migrations/20260727183427_72f9c05a-39cb-439b-9460-a965561e3d62.sql` |
| `review_purchase` | Ação inválida: % | `supabase/migrations/20260727183427_72f9c05a-39cb-439b-9460-a965561e3d62.sql` |
| `review_purchase` | Pedido não encontrado | `supabase/migrations/20260727183427_72f9c05a-39cb-439b-9460-a965561e3d62.sql` |
| `review_purchase` | Pedido já finalizado (%) | `supabase/migrations/20260727183427_72f9c05a-39cb-439b-9460-a965561e3d62.sql` |
| `review_purchase` | Somente pedidos pendentes podem ser aprovados | `supabase/migrations/20260727183427_72f9c05a-39cb-439b-9460-a965561e3d62.sql` |
| `review_purchase` | Pedido de risco elevado exige um segundo aprovador distinto | `supabase/migrations/20260727183427_72f9c05a-39cb-439b-9460-a965561e3d62.sql` |
| `review_purchase` | Somente pedidos aprovados podem ser entregues | `supabase/migrations/20260727183427_72f9c05a-39cb-439b-9460-a965561e3d62.sql` |
| `award_campaign_team_split` | campaign_not_found | `supabase/migrations/20260727184545_b9620ff8-06a2-4ece-9b16-9736d339b3e0.sql` |
| `spin_lucky_wheel` | Não autenticado | `supabase/migrations/20260727200825_a3b9b0a2-130f-4aee-a611-8b630bd0437a.sql` |
| `spin_lucky_wheel` | dedupe_key inválida | `supabase/migrations/20260727200825_a3b9b0a2-130f-4aee-a611-8b630bd0437a.sql` |
| `grant_scratch_card` | Não autenticado | `supabase/migrations/20260727221231_aacc3a8b-99f9-4836-85f0-f639d99184f1.sql` |
| `grant_scratch_card` | origem inválida | `supabase/migrations/20260727221231_aacc3a8b-99f9-4836-85f0-f639d99184f1.sql` |
| `grant_scratch_card` | referência de origem muito longa | `supabase/migrations/20260727221231_aacc3a8b-99f9-4836-85f0-f639d99184f1.sql` |
| `reveal_scratch_card` | Não autenticado | `supabase/migrations/20260727221231_aacc3a8b-99f9-4836-85f0-f639d99184f1.sql` |
| `validate_department_war` | O titulo da guerra deve ter ao menos 3 caracteres | `supabase/migrations/20260727231219_b4770959-c004-447c-b266-91453472af70.sql` |
| `validate_department_war` | O titulo da guerra deve ter no maximo 120 caracteres | `supabase/migrations/20260727231219_b4770959-c004-447c-b266-91453472af70.sql` |
| `validate_department_war` | O termino da guerra deve ser posterior ao inicio | `supabase/migrations/20260727231219_b4770959-c004-447c-b266-91453472af70.sql` |
| `validate_department_war` | A guerra precisa durar ao menos 1 hora | `supabase/migrations/20260727231219_b4770959-c004-447c-b266-91453472af70.sql` |
| `validate_department_war` | A guerra nao pode durar mais de 365 dias | `supabase/migrations/20260727231219_b4770959-c004-447c-b266-91453472af70.sql` |
| `validate_department_war` | placement_shares deve ser um array nao vazio | `supabase/migrations/20260727231219_b4770959-c004-447c-b266-91453472af70.sql` |
| `validate_department_war` | placement_shares suporta no maximo 10 colocacoes | `supabase/migrations/20260727231219_b4770959-c004-447c-b266-91453472af70.sql` |
| `validate_department_war` | placement_shares deve conter apenas numeros | `supabase/migrations/20260727231219_b4770959-c004-447c-b266-91453472af70.sql` |
| `validate_department_war` | Cada fatia de placement_shares deve estar entre 0 e 1 | `supabase/migrations/20260727231219_b4770959-c004-447c-b266-91453472af70.sql` |
| `validate_department_war` | O pool de moedas nao pode exceder 1.000.000 | `supabase/migrations/20260727231219_b4770959-c004-447c-b266-91453472af70.sql` |
| `validate_department_war` | O pool de XP nao pode exceder 1.000.000 | `supabase/migrations/20260727231219_b4770959-c004-447c-b266-91453472af70.sql` |
| `validate_department_war` | A guerra ja foi encerrada e paga: configuracao imutavel | `supabase/migrations/20260727231219_b4770959-c004-447c-b266-91453472af70.sql` |
| `validate_department_war` | Transicao de status invalida: % -> % | `supabase/migrations/20260727231219_b4770959-c004-447c-b266-91453472af70.sql` |
| `validate_auction_window` | auction_window_invalid | `supabase/migrations/20260728103329_1a2a8f0f-b71b-495d-b706-44a4e87e31d1.sql` |
| `close_auction` | forbidden | `supabase/migrations/20260728103329_1a2a8f0f-b71b-495d-b706-44a4e87e31d1.sql` |
| `create_auction_draft` | forbidden | `supabase/migrations/20260728111343_cf6a1baa-1658-4bb8-a8ef-0e51e0d8241b.sql` |
| `publish_auction` | forbidden | `supabase/migrations/20260728111343_cf6a1baa-1658-4bb8-a8ef-0e51e0d8241b.sql` |
| `cancel_auction` | forbidden | `supabase/migrations/20260728111343_cf6a1baa-1658-4bb8-a8ef-0e51e0d8241b.sql` |
| `get_push_outbox_health` | forbidden | `supabase/migrations/20260728112548_6cc50017-79db-4fda-a384-b5af19cb4406.sql` |
| `requeue_push_outbox` | forbidden | `supabase/migrations/20260728112548_6cc50017-79db-4fda-a384-b5af19cb4406.sql` |
| `get_push_outbox_health_trend` | forbidden | `supabase/migrations/20260728112815_fd49db87-3ae3-448d-b394-dfe7f248adae.sql` |
| `settle_prediction_market` | forbidden | `supabase/migrations/20260728113255_b0c9ae8e-e19d-44ea-ad4d-a0366d453980.sql` |
| `create_prediction_market` | forbidden | `supabase/migrations/20260728114514_7f6f6bd8-8c0c-4762-9f48-2e4474ed0b2b.sql` |
| `transition_prediction_market` | forbidden | `supabase/migrations/20260728115236_b71afe23-9d0e-456d-8982-bd4240eb5fd1.sql` |
| `get_prediction_odds_history` | unauthenticated | `supabase/migrations/20260728120114_2767df2e-5207-43d1-9737-68c2835352c3.sql` |
| `grant_card_pack` | Não autenticado | `supabase/migrations/20260728121542_4ac8cbd1-0d6d-410d-8734-4fd032804ddc.sql` |
| `grant_card_pack` | Permissão negada | `supabase/migrations/20260728121542_4ac8cbd1-0d6d-410d-8734-4fd032804ddc.sql` |
| `grant_card_pack` | origem inválida | `supabase/migrations/20260728121542_4ac8cbd1-0d6d-410d-8734-4fd032804ddc.sql` |
| `grant_card_pack` | referência de origem muito longa | `supabase/migrations/20260728121542_4ac8cbd1-0d6d-410d-8734-4fd032804ddc.sql` |
| `open_card_pack` | Não autenticado | `supabase/migrations/20260728121542_4ac8cbd1-0d6d-410d-8734-4fd032804ddc.sql` |
| `propose_card_trade` | Não autenticado | `supabase/migrations/20260728121542_4ac8cbd1-0d6d-410d-8734-4fd032804ddc.sql` |
| `respond_card_trade` | Não autenticado | `supabase/migrations/20260728121542_4ac8cbd1-0d6d-410d-8734-4fd032804ddc.sql` |
| `respond_card_trade` | ação inválida | `supabase/migrations/20260728121542_4ac8cbd1-0d6d-410d-8734-4fd032804ddc.sql` |
| `get_card_set_rewards` | not_authenticated | `supabase/migrations/20260728122626_32e02751-3e63-4896-adef-653b53012bbf.sql` |
| `claim_card_set_reward` | not_authenticated | `supabase/migrations/20260728122626_32e02751-3e63-4896-adef-653b53012bbf.sql` |
| `deal_boss_damage` | auth required | `supabase/migrations/20260728125833_b6b2c15a-1960-4e13-9c2a-0cdff052ea01.sql` |
| `deal_boss_damage` | invalid dedupe_key | `supabase/migrations/20260728125833_b6b2c15a-1960-4e13-9c2a-0cdff052ea01.sql` |
| `deal_boss_damage` | invalid source | `supabase/migrations/20260728125833_b6b2c15a-1960-4e13-9c2a-0cdff052ea01.sql` |
| `deal_boss_damage` | battle not found | `supabase/migrations/20260728125833_b6b2c15a-1960-4e13-9c2a-0cdff052ea01.sql` |
| `deal_boss_damage` | manual damage requires elevated role | `supabase/migrations/20260728125833_b6b2c15a-1960-4e13-9c2a-0cdff052ea01.sql` |
| `settle_boss_battle` | battle not found | `supabase/migrations/20260728125833_b6b2c15a-1960-4e13-9c2a-0cdff052ea01.sql` |
| `get_boss_battle_leaderboard` | not authenticated | `supabase/migrations/20260728132145_81805410-2e42-4536-bd00-1c8a66290df8.sql` |
| `save_sequence_procedure` | hint_too_long | `supabase/migrations/20260728161526_6f32f879-b9a2-4792-bbb5-9ddea5f271ba.sql` |
| `delete_board_trail` | Permissao negada | `supabase/migrations/20260728173213_69cdcc82-666c-4eac-b349-ee744ff418b2.sql` |
| `unblock_board_players` | Apenas administradores podem executar o desbloqueio | `supabase/migrations/20260728180133_93c53b2d-f159-4f4c-8fad-deb269e6a600.sql` |
| `cleanup_old_security_logs` | p_days_to_keep deve ser >= 1 | `supabase/migrations/20260728180730_1d09218b-0f91-4b02-9127-2009c4de7589.sql` |
| `complete_task_score` | Acesso negado: apenas gestores podem concluir tarefas de outros usuários | `supabase/migrations/20260728183016_7700507e-bccb-4244-9fa4-6c9e79440974.sql` |
| `complete_task_score` | Acesso negado: apenas gestores podem rejeitar ou devolver tarefas | `supabase/migrations/20260728183016_7700507e-bccb-4244-9fa4-6c9e79440974.sql` |
| `complete_task_score` | Tarefa já finalizada | `supabase/migrations/20260728183016_7700507e-bccb-4244-9fa4-6c9e79440974.sql` |
| `register_device` | Acesso negado: dispositivo só pode ser registrado para a própria conta | `supabase/migrations/20260728183016_7700507e-bccb-4244-9fa4-6c9e79440974.sql` |
| `reset_login_attempts` | Acesso negado: só é possível limpar tentativas da própria conta | `supabase/migrations/20260728183016_7700507e-bccb-4244-9fa4-6c9e79440974.sql` |
| `request_password_reset` | Acesso negado: solicitação permitida apenas para a própria conta | `supabase/migrations/20260728183016_7700507e-bccb-4244-9fa4-6c9e79440974.sql` |
| `request_password_reset` | Já existe uma solicitação de reset pendente | `supabase/migrations/20260728183016_7700507e-bccb-4244-9fa4-6c9e79440974.sql` |
| `grade_quiz_answer` | Não autenticado | `supabase/migrations/20260728185015_9aac76f7-fb94-4e9b-848e-5d496293c112.sql` |
| `grade_quiz_answer` | Pergunta inválida | `supabase/migrations/20260728185015_9aac76f7-fb94-4e9b-848e-5d496293c112.sql` |
| `get_quiz_lifeline` | Não autenticado | `supabase/migrations/20260728185119_d97a70b6-1771-41be-8175-29a5be5acd17.sql` |
| `get_quiz_lifeline` | Ajuda inválida | `supabase/migrations/20260728185119_d97a70b6-1771-41be-8175-29a5be5acd17.sql` |
| `get_quiz_lifeline` | Pergunta inválida | `supabase/migrations/20260728185119_d97a70b6-1771-41be-8175-29a5be5acd17.sql` |
| `create_external_api_key` | Nome da chave é obrigatório | `supabase/migrations/20260728210216_01d79f58-57ea-48d9-a859-ef3ddf891190.sql` |
| `create_external_api_key` | rate_limit_per_minute deve estar entre 1 e 10000 | `supabase/migrations/20260728210216_01d79f58-57ea-48d9-a859-ef3ddf891190.sql` |
| `rotate_external_api_secret` | Chave de API não encontrada | `supabase/migrations/20260728210216_01d79f58-57ea-48d9-a859-ef3ddf891190.sql` |
| `set_external_api_key_active` | Parâmetros inválidos | `supabase/migrations/20260728210216_01d79f58-57ea-48d9-a859-ef3ddf891190.sql` |
| `set_external_api_key_active` | Chave de API não encontrada | `supabase/migrations/20260728210216_01d79f58-57ea-48d9-a859-ef3ddf891190.sql` |
| `delete_external_api_key` | Chave de API não encontrada | `supabase/migrations/20260728210216_01d79f58-57ea-48d9-a859-ef3ddf891190.sql` |
| `start_lightning_round` | Não autenticado | `supabase/migrations/20260806230000_lightning_relampago_rpcs_only.sql` |
| `answer_lightning_question` | Não autenticado | `supabase/migrations/20260806230000_lightning_relampago_rpcs_only.sql` |
| `finish_lightning_round` | Não autenticado | `supabase/migrations/20260806230000_lightning_relampago_rpcs_only.sql` |
| `get_or_create_bingo_card` | Não autenticado | `supabase/migrations/20260806232000_bingo_rpcs_only.sql` |
| `sync_bingo_card` | Não autenticado | `supabase/migrations/20260806232000_bingo_rpcs_only.sql` |
| `start_memory_session` | Não autenticado | `supabase/migrations/20260806233000_memory_rpcs_only.sql` |
| `finish_memory_session` | Não autenticado | `supabase/migrations/20260806233000_memory_rpcs_only.sql` |
| `get_memory_leaderboard` | Não autenticado | `supabase/migrations/20260806233000_memory_rpcs_only.sql` |
| `advance_board_trail` | Autenticação obrigatória | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `advance_board_trail` | Chave de idempotência inválida | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `advance_board_trail` | Trilha indisponível | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `advance_board_trail` | Tabuleiro incompleto | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `advance_board_trail` | Trilha já concluída | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `advance_board_trail` | Conclua o desafio da casa atual para avançar | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `advance_board_trail` | Limite diário de jogadas atingido | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `resolve_board_challenge` | Autenticação obrigatória | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `resolve_board_challenge` | Chave de idempotência inválida | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `resolve_board_challenge` | Progresso inexistente nesta trilha | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `resolve_board_challenge` | Nenhum desafio pendente | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `resolve_board_challenge` | Alternativa inválida para o desafio | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `get_board_challenge_stats` | Acesso restrito a gestores e administradores | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `save_board_trail` | Permissao negada | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `save_board_trail` | Titulo obrigatorio | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `save_board_trail` | Status invalido | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `save_board_trail` | Jogadas por dia devem ficar entre 1 e 20 | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `save_board_trail` | Tabuleiro invalido | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `save_board_trail` | O tabuleiro precisa ter entre 5 e 100 casas | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `save_board_trail` | Tipo de casa invalido: % | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `save_board_trail` | A casa de Partida deve ser a primeira | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `save_board_trail` | A casa de Chegada deve ser a ultima | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `save_board_trail` | A trilha deve ter exatamente uma casa de Partida | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `save_board_trail` | A trilha deve ter exatamente uma casa de Chegada | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `save_board_trail` | Trilha nao encontrada | `supabase/migrations/20260807010000_board_trail_rpcs.sql` |
| `get_2fa_status` | insufficient_privilege | `supabase/migrations/20261114134238_9b119528-da6f-4f43-b6cb-dcdcd7aa7ab1.sql` |
| `user_has_passkeys` | insufficient_privilege | `supabase/migrations/20261114134238_9b119528-da6f-4f43-b6cb-dcdcd7aa7ab1.sql` |
| `validate_reset_token` | insufficient_privilege | `supabase/migrations/20261114134238_9b119528-da6f-4f43-b6cb-dcdcd7aa7ab1.sql` |
| `acknowledge_security_digest` | not_authenticated | `supabase/migrations/20261122140000_acknowledge_security_digest.sql` |
| `acknowledge_security_digest` | forbidden | `supabase/migrations/20261122140000_acknowledge_security_digest.sql` |
| `climate_recalculate_pillar_scores` | not authenticated | `supabase/migrations/20261123180000_climate_survey_engine.sql` |
| `climate_recalculate_pillar_scores` | not authorized | `supabase/migrations/20261123180000_climate_survey_engine.sql` |
| `climate_survey_enps` | not authenticated | `supabase/migrations/20261123180000_climate_survey_engine.sql` |
| `climate_survey_enps` | survey not found | `supabase/migrations/20261123180000_climate_survey_engine.sql` |
| `climate_survey_enps` | not authorized | `supabase/migrations/20261123180000_climate_survey_engine.sql` |
| `climate_submit_response` | not authenticated | `supabase/migrations/20261123180000_climate_survey_engine.sql` |
| `climate_submit_response` | answers required | `supabase/migrations/20261123180000_climate_survey_engine.sql` |
| `climate_submit_response` | survey not found | `supabase/migrations/20261123180000_climate_survey_engine.sql` |
| `climate_submit_response` | survey is not active | `supabase/migrations/20261123180000_climate_survey_engine.sql` |
| `climate_submit_response` | survey is not open yet | `supabase/migrations/20261123180000_climate_survey_engine.sql` |
| `climate_submit_response` | survey period is over | `supabase/migrations/20261123180000_climate_survey_engine.sql` |
| `climate_submit_response` | survey already answered | `supabase/migrations/20261123180000_climate_survey_engine.sql` |
| `climate_submit_response` | invalid answers | `supabase/migrations/20261123180000_climate_survey_engine.sql` |
| `climate_submit_response` | required question missing | `supabase/migrations/20261123180000_climate_survey_engine.sql` |
| `add_xp` | p_amount deve ser positivo | `supabase/migrations/20261218000000_profiles_economia_rpcs.sql` |
| `add_xp` | perfil não encontrado | `supabase/migrations/20261218000000_profiles_economia_rpcs.sql` |
| `add_coins` | p_amount deve ser positivo | `supabase/migrations/20261218000000_profiles_economia_rpcs.sql` |
| `add_coins` | perfil não encontrado | `supabase/migrations/20261218000000_profiles_economia_rpcs.sql` |
| `spend_coins` | p_amount deve ser positivo | `supabase/migrations/20261218000000_profiles_economia_rpcs.sql` |
| `spend_coins` | coins insuficientes | `supabase/migrations/20261218000000_profiles_economia_rpcs.sql` |
| `increment_streak` | perfil não encontrado | `supabase/migrations/20261218000000_profiles_economia_rpcs.sql` |
| `increment_quests_completed` | perfil não encontrado | `supabase/migrations/20261218000000_profiles_economia_rpcs.sql` |
| `get_error_budget_30d` | insufficient_privilege | `supabase/migrations/20261220000000_fix_sre_rpcs_and_dispatch_trigger.sql` |
| `get_leaderboard_api` | insufficient_privilege | `supabase/migrations/20261226180000_escopo_gestor_rpcs_relatorio.sql` |

## E. Estados, máquinas de estado e transições

### E.1 Colunas de status no banco

| Tabela | Coluna | Valores permitidos (enum/CHECK) | Default |
|---|---|---|---|
| `profiles` | `status` | **livre (sem enum/CHECK)** |  |
| `custom_quests` | `status` | `draft`, `active`, `archived` | `draft` |
| `quest_assignments` | `current_step` | **livre (sem enum/CHECK)** | `0` |
| `learning_trails` | `status` | `draft`, `published`, `archived` | `draft` |
| `shop_purchases` | `status` | `pending`, `approved`, `delivered`, `cancelled` | `pending` |
| `onboarding_progress` | `current_step` | **livre (sem enum/CHECK)** | `0` |
| `weekly_challenges` | `status` | `active`, `completed`, `expired` | `active` |
| `mentorship_pairs` | `status` | `active`, `cancelled`, `completed`, `pending` | `active` |
| `mentorship_requests` | `status` | `accepted`, `expired`, `pending`, `rejected` | `pending` |
| `direct_duels` | `status` | `accepted`, `active`, `cancelled`, `completed`, `declined`, `pending` | `pending` |
| `user_certifications` | `status` | **livre (sem enum/CHECK)** | `active` |
| `bitrix24_sync_mappings` | `sync_status` | **livre (sem enum/CHECK)** | `synced` |
| `goals` | `status` | `active`, `cancelled`, `completed`, `draft` | `active` |
| `checkins` | `status` | `cancelled`, `completed`, `in_progress`, `scheduled` | `scheduled` |
| `pulse_surveys` | `status` | `active`, `closed`, `draft` | `draft` |
| `feedback_cycles` | `status` | `active`, `completed`, `draft`, `review` | `draft` |
| `feedback_requests` | `status` | `in_progress`, `pending`, `skipped`, `submitted` | `pending` |
| `task_scores` | `status` | `pending`, `on_time`, `late`, `rejected`, `rework` | `pending` |
| `api_request_logs` | `response_status` | **livre (sem enum/CHECK)** |  |
| `webhook_subscriptions` | `last_status` | **livre (sem enum/CHECK)** |  |
| `webhook_delivery_logs` | `response_status` | **livre (sem enum/CHECK)** |  |
| `external_tasks` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `development_plans` | `status` | `active`, `cancelled`, `completed`, `draft` | `active` |
| `development_plan_actions` | `status` | `cancelled`, `completed`, `in_progress`, `pending` | `pending` |
| `enps_surveys` | `status` | `active`, `archived`, `closed`, `draft` | `draft` |
| `climate_surveys` | `status` | **livre (sem enum/CHECK)** | `draft` |
| `opinions` | `status` | `new`, `read`, `in_progress`, `resolved`, `archived` | `new` |
| `action_plans` | `status` | `active`, `cancelled`, `completed`, `paused`, `planning` | `planning` |
| `action_plan_items` | `status` | `blocked`, `cancelled`, `completed`, `in_progress`, `pending` | `pending` |
| `feedback_evaluations` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `pdi_mentors` | `status` | **livre (sem enum/CHECK)** | `active` |
| `password_reset_requests` | `status` | `approved`, `completed`, `expired`, `pending`, `rejected` | `pending` |
| `webhook_idempotency` | `status` | **livre (sem enum/CHECK)** |  |
| `runbook_executions` | `phase` | `diagnose`, `mitigate`, `note`, `postmortem`, `recover` |  |
| `runbook_executions` | `step_index` | **livre (sem enum/CHECK)** |  |
| `runbook_executions` | `step_title` | **livre (sem enum/CHECK)** |  |
| `postmortems` | `status` | `draft`, `in_review`, `published` | `draft` |
| `postmortem_actions` | `status` | `cancelled`, `done`, `in_progress`, `open` | `open` |
| `ai_course_jobs` | `status` | `failed`, `pending`, `processing`, `succeeded` | `pending` |
| `sales_campaigns` | `status` | `active`, `cancelled`, `completed`, `draft`, `paused` | `draft` |
| `push_notification_logs` | `status` | `failed`, `invalidated`, `sent`, `skipped` |  |
| `engagement_cycles` | `status` | `scheduled`, `active`, `closed` | `active` |
| `campaign_result_imports` | `status` | `applied`, `failed`, `pending`, `reverted` | `pending` |
| `campaign_result_rows` | `status` | `applied`, `invalid`, `reverted`, `skipped`, `valid` | `valid` |
| `purchase_approvals` | `from_status` | `pending`, `approved`, `delivered`, `cancelled` |  |
| `purchase_approvals` | `to_status` | `pending`, `approved`, `delivered`, `cancelled` |  |
| `campaign_team_split_batches` | `status` | **livre (sem enum/CHECK)** | `completed` |
| `scratch_cards` | `status` | `pending`, `revealed` | `pending` |
| `lightning_quiz_sessions` | `status` | `active`, `finished` | `active` |
| `tournaments` | `status` | `cancelled`, `draft`, `finished`, `registration`, `running` | `draft` |
| `tournament_matches` | `status` | `bye`, `decided`, `pending`, `ready` | `pending` |
| `department_wars` | `status` | `cancelled`, `draft`, `finished`, `running` | `draft` |
| `auctions` | `status` | `active`, `cancelled`, `closed`, `draft` | `draft` |
| `auction_bids` | `status` | `active`, `refunded`, `won` | `active` |
| `push_outbox` | `status` | `failed`, `pending`, `processing`, `sent`, `skipped` | `pending` |
| `prediction_markets` | `status` | `draft`, `locked`, `open`, `settled`, `voided` | `draft` |
| `card_packs` | `status` | `opened`, `sealed` | `sealed` |
| `card_trades` | `status` | `accepted`, `cancelled`, `declined`, `expired`, `pending` | `pending` |
| `boss_battles` | `status` | `defeated`, `draft`, `expired`, `running`, `settled` | `draft` |
| `memory_sessions` | `status` | `active`, `finished` | `active` |
| `wager_integrity_reviews` | `status` | `confirmed`, `false_positive`, `investigating` | `investigating` |
| `wager_integrity_review_events` | `previous_status` | **livre (sem enum/CHECK)** |  |
| `wager_integrity_review_events` | `new_status` | **livre (sem enum/CHECK)** |  |
| `board_trails` | `status` | `active`, `archived`, `draft` | `draft` |
| `profiles_public` | `status` | **livre (sem enum/CHECK)** |  |

### E.2 Mapas de transição declarados no código

- **mobileTransition** (`src/components/PageTransition.tsx`):
  ```ts
  type: "spring" as const, stiffness: 380, damping: 35, mass: 0.8,
  ```
- **desktopTransition** (`src/components/PageTransition.tsx`):
  ```ts
  type: "tween" as const, ease: "easeOut" as const, duration: 0.3,
  ```
- **reducedMotionTransition** (`src/components/PageTransition.tsx`):
  ```ts
  duration: 0.15,
  ```
- **nextState** (`src/lib/boardTrail.ts`):
  ```ts
  position: finalPosition, coins: Math.max(0, current.coins + coinsDelta), xp: Math.max(0, current.xp + xpDelta), checkpoints, finished,
  ```
- **TransitionDurations** (`src/stories/animations/CSSAnimations.stories.tsx`):
  ```ts
  render: () => ( <Card className="w-full max-w-2xl"> <CardHeader> <CardTitle>Durações de Transição</CardTitle> </CardHeader> <CardContent> <div className="space-y-4"> {[75, 100, 150, 200, 300, 500, 700, 1000].map((duration) => ( <div key={duration} className="flex items-center gap-4"> <code className="w-32 text-sm text-muted-foreground">duration-{duration}</code> <div className={`flex-1 h-8 bg-primary/20 rounded transition-all duration-${duration} hover:bg-primary hover:text-primary-foreground flex items-center justify-center cursor-pointer`} style={{ transitionDuration: `${duration}ms` }} > <span className="text-sm">Hover me ({duration}ms)</span> </div> </div> ))} </div> </CardContent> </Car …
  ```

### E.3 Valores de status usados no código (escreve / compara / filtra)

| Campo | Valor | Uso | Onde |
|---|---|---|---|
| `type` | `ADD_TOAST` | compara, escreve | `src/hooks/use-toast.ts` |
| `type` | `CACHE_ASSETS` | compara | `public/sw.js` |
| `type` | `DISMISS_TOAST` | compara, escreve | `src/hooks/use-toast.ts` |
| `type` | `REMOVE_TOAST` | compara, escreve | `src/hooks/use-toast.ts` |
| `type` | `SHOW_NOTIFICATION` | compara, escreve | `public/sw.js`<br>`src/components/security/SecurityNotificationsToggle.tsx` |
| `type` | `SKIP_WAITING` | compara | `public/sw.js` |
| `type` | `UPDATE_TOAST` | compara, escreve | `src/hooks/use-toast.ts` |
| `type` | `accept` | compara, escreve | `src/components/duels/DuelCard.tsx`<br>`src/pages/Duels.tsx` |
| `type` | `achievement` | compara, escreve | `public/sw.js`<br>`src/hooks/useFeedback.ts`<br>`src/lib/luckyWheelPayout.ts`<br>`src/services/attendanceService.ts`<br>`src/services/certificationsService.ts`<br>… +2 |
| `type` | `achievement_unlocked` | escreve | `src/services/achievementsService.ts` |
| `type` | `action` | compara, escreve | `src/components/GlobalSearch.tsx`<br>`src/components/search/SearchResultsList.tsx` |
| `type` | `activity_spike` | escreve | `supabase/functions/admin-alerts/index.ts` |
| `type` | `announcement` | compara | `public/sw.js` |
| `type` | `array` | escreve | `supabase/functions/ai-course-builder/index.ts`<br>`supabase/functions/churn-prediction/index.ts` |
| `type` | `attendance` | compara, escreve | `src/lib/warAutoHooks.ts` |
| `type` | `authentication` | escreve, filtra | `supabase/functions/passkey-auth/index.ts` |
| `type` | `badge` | compara, escreve | `src/components/ui/lucky-drop.tsx` |
| `type` | `basic` | compara | `public/sw.js` |
| `type` | `bonus` | compara, escreve | `src/lib/boardTrail.ts`<br>`src/lib/boardTrailAuthoring.ts` |
| `type` | `boolean` | escreve | `supabase/functions/ai-course-builder/index.ts` |
| `type` | `boost` | compara, escreve | `src/components/ui/lucky-drop.tsx` |
| `type` | `broken_streaks` | escreve | `supabase/functions/admin-alerts/index.ts` |
| `type` | `brute_force` | compara | `src/components/security/SecurityAlertsPanel.tsx` |
| `type` | `button` | escreve | `src/components/mobile/HapticWrapper.tsx` |
| `type` | `campaign_completed` | compara, escreve | `src/components/CampaignNotificationPreferences.tsx`<br>`src/services/salesCampaignsService.ts`<br>`supabase/functions/_shared/contracts/_fixtures/index.ts`<br>`supabase/functions/_shared/contracts/contracts_test.ts` |
| `type` | `campaign_enrolled` | escreve | `src/services/salesCampaignsService.ts` |
| `type` | `campaign_milestone` | escreve | `src/services/salesCampaignsService.ts` |
| `type` | `cancel` | compara, escreve | `src/components/duels/DuelCard.tsx`<br>`src/pages/Duels.tsx` |
| `type` | `certification_expiring` | escreve | `src/hooks/usePDIAlerts.ts` |
| `type` | `challenge` | compara, escreve | `src/hooks/useWeeklyChallenge.ts`<br>`src/lib/boardTrail.ts`<br>`src/lib/boardTrailAuthoring.ts` |
| `type` | `checkin` | compara, escreve | `public/sw.js`<br>`src/services/autoChallengesService.ts` |
| `type` | `checkpoint` | compara, escreve | `src/lib/boardTrail.ts`<br>`src/lib/boardTrailAuthoring.ts` |
| `type` | `churn_alert` | compara | `public/sw.js` |
| `type` | `click` | compara | `src/hooks/useFeedback.ts` |
| `type` | `coins` | compara, escreve | `src/components/ui/lucky-drop.tsx`<br>`src/lib/luckyWheelPayout.ts`<br>`src/pages/ScratchCardPage.tsx` |
| `type` | `collaborative` | compara, escreve | `src/components/ui/team-challenges.tsx` |
| `type` | `competency_celebration` | escreve, filtra | `supabase/functions/competency-alerts/index.ts` |
| `type` | `competency_gap` | compara, escreve, filtra | `public/sw.js`<br>`src/services/notificationsService.ts`<br>`supabase/functions/competency-alerts/index.ts` |
| `type` | `competitive` | escreve | `src/components/ui/team-challenges.tsx` |
| `type` | `decline` | compara, escreve | `src/components/duels/DuelCard.tsx`<br>`src/pages/Duels.tsx` |
| `type` | `development_tip` | compara, escreve | `public/sw.js`<br>`src/services/notificationsService.ts`<br>`supabase/functions/competency-alerts/index.ts` |
| `type` | `duel` | compara | `public/sw.js` |
| `type` | `duel-challenge` | compara | `public/sw.js` |
| `type` | `epic` | escreve | `src/components/CelebrationEffect.tsx`<br>`src/pages/Shop.tsx` |
| `type` | `error` | compara | `src/components/GlobalMessageProvider.tsx`<br>`src/components/mobile/HapticWrapper.tsx`<br>`src/hooks/useFeedback.ts` |
| `type` | `expiring_certifications` | escreve | `supabase/functions/admin-alerts/index.ts` |
| `type` | `failed_login` | compara, escreve | `public/sw.js`<br>`src/hooks/useSecurityPushNotifications.ts` |
| `type` | `feedback` | escreve | `src/services/autoChallengesService.ts` |
| `type` | `finish` | compara, escreve | `src/lib/boardTrail.ts`<br>`src/lib/boardTrailAuthoring.ts`<br>`src/pages/BoardTrailAdminPage.tsx` |
| `type` | `function` | escreve | `supabase/functions/ai-course-builder/index.ts`<br>`supabase/functions/churn-prediction/index.ts`<br>`supabase/functions/reward-approval-review/index.ts` |
| `type` | `generic` | escreve | `src/components/security/SecurityAlertsPanel.tsx` |
| `type` | `goal` | escreve | `src/services/autoChallengesService.ts` |
| `type` | `http` | escreve | `src/lib/requestId.ts` |
| `type` | `inactive_users` | escreve | `supabase/functions/_shared/contracts/_fixtures/responses.ts`<br>`supabase/functions/admin-alerts/index.ts` |
| `type` | `info` | compara, escreve | `src/components/GlobalMessageProvider.tsx`<br>`src/services/certificationsService.ts`<br>`src/services/shopService.ts` |
| `type` | `integer` | escreve | `supabase/functions/ai-course-builder/index.ts`<br>`supabase/functions/reward-approval-review/index.ts` |
| `type` | `ip_blocked` | compara, escreve | `public/sw.js`<br>`src/components/security/SecurityAlertsPanel.tsx`<br>`src/hooks/useSecurityPushNotifications.ts` |
| `type` | `kudos` | compara, escreve | `public/sw.js`<br>`src/lib/warAutoHooks.ts`<br>`src/services/autoChallengesService.ts`<br>`src/services/kudosService.ts` |
| `type` | `kudos_given` | compara | `src/pages/SocialFeed.tsx` |
| `type` | `kudos_received` | compara | `src/pages/SocialFeed.tsx` |
| `type` | `leaderboard` | escreve | `src/services/notificationsService.ts` |
| `type` | `learning` | escreve | `src/services/autoChallengesService.ts` |
| `type` | `learning_trail` | escreve | `src/services/trailsService.ts` |
| `type` | `legendary` | compara, escreve | `src/components/CelebrationEffect.tsx`<br>`src/pages/Shop.tsx` |
| `type` | `level` | compara, escreve | `src/components/effects/MiniConfetti.tsx`<br>`src/hooks/useFirstTimeIndicator.ts` |
| `type` | `level_up` | compara, escreve | `src/pages/SocialFeed.tsx`<br>`src/services/notificationsService.ts` |
| `type` | `login_anomaly` | escreve | `supabase/functions/_shared/contracts/_fixtures/responses.ts` |
| `type` | `low_attendance` | escreve | `supabase/functions/_shared/contracts/_fixtures/responses.ts`<br>`supabase/functions/admin-alerts/index.ts` |
| `type` | `low_performance` | escreve | `src/hooks/usePDIAlerts.ts` |
| `type` | `magiclink` | escreve | `src/services/webauthnService.ts`<br>`supabase/functions/passkey-auth/index.ts` |
| `type` | `mobile` | compara | `src/components/security/DevicesPanel.tsx` |
| `type` | `module_progress` | compara, escreve | `src/lib/warAutoHooks.ts` |
| `type` | `neutral` | compara, escreve | `src/lib/boardTrailAuthoring.ts`<br>`src/pages/BoardTrailAdminPage.tsx` |
| `type` | `new_device` | compara, escreve | `public/sw.js`<br>`src/hooks/useSecurityPushNotifications.ts` |
| `type` | `nothing` | compara | `src/pages/ScratchCardPage.tsx` |
| `type` | `nps` | compara, escreve | `src/components/PulseSurveyWidget.tsx`<br>`src/components/admin/SurveyCreator.tsx`<br>`src/services/pulseSurveysService.ts` |
| `type` | `number` | escreve | `supabase/functions/ai-course-builder/index.ts`<br>`supabase/functions/churn-prediction/index.ts` |
| `type` | `object` | escreve | `supabase/functions/ai-course-builder/index.ts`<br>`supabase/functions/churn-prediction/index.ts`<br>`supabase/functions/reward-approval-review/index.ts` |
| `type` | `pdi` | escreve | `src/services/autoChallengesService.ts` |
| `type` | `pdi_expiring` | escreve | `src/hooks/usePDIAlerts.ts` |
| `type` | `pdi_overdue` | escreve | `src/hooks/usePDIAlerts.ts` |
| `type` | `penalty` | compara, escreve | `src/lib/boardTrail.ts`<br>`src/lib/boardTrailAuthoring.ts` |
| `type` | `pending_purchases` | escreve | `supabase/functions/admin-alerts/index.ts` |
| `type` | `positive` | compara, escreve | `src/components/copilot/CopilotAlertCard.tsx`<br>`src/components/copilot/CopilotAlertSection.tsx`<br>`src/components/manager/AICopilotDashboard.tsx` |
| `type` | `prediction_lock_overdue` | escreve | `src/lib/predictionWatchdog.ts` |
| `type` | `prediction_settlement_overdue` | escreve | `src/lib/predictionWatchdog.ts` |
| `type` | `proportional` | escreve | `src/components/campaigns/CreateCampaignDialog.tsx`<br>`src/services/salesCampaignsService.ts` |
| `type` | `public-key` | escreve | `src/services/webauthnService.ts`<br>`supabase/functions/_shared/contracts/_fixtures/responses.ts`<br>`supabase/functions/passkey-auth/index.ts` |
| `type` | `quest` | compara, escreve | `public/sw.js`<br>`src/components/GlobalSearch.tsx`<br>`src/components/search/SearchResultsList.tsx`<br>`src/services/notificationsService.ts` |
| `type` | `quest_complete` | escreve | `src/services/questsService.ts` |
| `type` | `quest_completed` | compara | `src/pages/SocialFeed.tsx` |
| `type` | `quiz` | escreve | `public/sw.js` |
| `type` | `quiz_score` | compara, escreve | `src/lib/warAutoHooks.ts` |
| `type` | `range` | escreve | `src/stories/components/Progress.stories.tsx` |
| `type` | `rate_limit_breach` | escreve | `supabase/functions/_shared/contracts/_fixtures/responses.ts` |
| `type` | `rate_limit_exceeded` | compara | `src/components/security/SecurityAlertsPanel.tsx` |
| `type` | `rating` | compara, escreve | `src/components/PulseSurveyWidget.tsx`<br>`src/components/admin/SurveyCreator.tsx`<br>`src/services/feedbackService.ts`<br>`src/services/pulseSurveysService.ts` |
| `type` | `recovery` | compara | `src/pages/ResetPassword.tsx` |
| `type` | `registration` | escreve | `src/services/webauthnService.ts` |
| `type` | `security` | escreve | `supabase/functions/dispatch-critical-alert/index.ts` |
| `type` | `security_alert` | compara, escreve | `public/sw.js`<br>`src/components/security/SecurityNotificationsToggle.tsx`<br>`src/hooks/useSecurityPushNotifications.ts` |
| `type` | `security_device_revoked` | escreve | `src/lib/pushDevices.ts` |
| `type` | `security_weekly_digest` | escreve, filtra | `supabase/functions/security-weekly-digest/index.ts` |
| `type` | `select` | compara, escreve | `src/components/PulseSurveyWidget.tsx`<br>`src/components/accessibility/AccessibilitySettings.tsx`<br>`src/services/pulseSurveysService.ts` |
| `type` | `selection` | compara, escreve | `src/components/mobile/GestureHandler.tsx`<br>`src/components/mobile/HapticWrapper.tsx` |
| `type` | `spring` | escreve | `src/components/AchievementSystem.tsx`<br>`src/components/ActivityHeatmap.tsx`<br>`src/components/ENPSSurveyWidget.tsx`<br>`src/components/ErrorBoundary.tsx`<br>`src/components/LeagueCard.tsx`<br>… +32 |
| `type` | `start` | compara, escreve | `src/lib/boardTrailAuthoring.ts` |
| `type` | `streak` | compara, escreve | `src/components/effects/MiniConfetti.tsx`<br>`src/hooks/useFirstTimeIndicator.ts`<br>`src/services/autoChallengesService.ts` |
| `type` | `string` | compara, escreve | `src/components/security/SecurityAlertsPanel.tsx`<br>`supabase/functions/_shared/webauthn.ts`<br>`supabase/functions/ai-course-builder/index.ts`<br>`supabase/functions/churn-prediction/index.ts`<br>`supabase/functions/reward-approval-review/index.ts` |
| `type` | `success` | compara, escreve | `src/components/GlobalMessageProvider.tsx`<br>`src/components/mobile/HapticWrapper.tsx`<br>`src/hooks/useFeedback.ts`<br>`src/stories/feedback/Notifications.stories.tsx` |
| `type` | `suggestion` | compara | `src/components/copilot/CopilotAlertCard.tsx`<br>`src/components/copilot/CopilotAlertSection.tsx` |
| `type` | `summary` | escreve | `src/lib/exportReports.ts`<br>`src/pages/EngagementReports.tsx`<br>`src/pages/ManagerDashboard.tsx` |
| `type` | `suspicious_login` | compara | `src/components/security/SecurityAlertsPanel.tsx` |
| `type` | `table` | escreve | `src/lib/exportReports.ts`<br>`src/pages/EngagementReports.tsx`<br>`src/pages/ManagerDashboard.tsx` |
| `type` | `tablet` | compara | `src/components/security/DevicesPanel.tsx` |
| `type` | `task_score` | compara, escreve | `src/lib/warAutoHooks.ts` |
| `type` | `team_split` | escreve | `src/components/campaigns/CreateCampaignDialog.tsx` |
| `type` | `text` | compara, escreve | `src/components/PulseSurveyWidget.tsx`<br>`src/components/admin/SurveyCreator.tsx`<br>`src/services/checkinsService.ts` |
| `type` | `toggle` | compara, escreve | `src/components/accessibility/AccessibilitySettings.tsx` |
| `type` | `trail` | compara, escreve | `public/sw.js`<br>`src/components/GlobalSearch.tsx`<br>`src/components/search/SearchResultsList.tsx`<br>`src/components/search/searchUtils.ts` |
| `type` | `trail_enrollment` | compara, escreve | `src/lib/warAutoHooks.ts` |
| `type` | `trophy` | compara | `src/components/effects/MiniConfetti.tsx` |
| `type` | `tween` | escreve | `src/components/PageTransition.tsx`<br>`src/components/mobile/PullToRefresh.tsx`<br>`src/components/mobile/SwipeablePage.tsx` |
| `type` | `urgent` | compara, escreve | `src/components/copilot/CopilotAlertCard.tsx`<br>`src/components/copilot/CopilotAlertSection.tsx`<br>`src/components/manager/AICopilotDashboard.tsx` |
| `type` | `user` | compara | `src/components/GlobalSearch.tsx`<br>`src/components/search/SearchResultsList.tsx` |
| `type` | `victory` | escreve | `src/hooks/useWeeklyChallenge.ts` |
| `type` | `warning` | compara, escreve | `src/components/GlobalMessageProvider.tsx`<br>`src/components/copilot/CopilotAlertCard.tsx`<br>`src/components/copilot/CopilotAlertSection.tsx`<br>`src/components/manager/AICopilotDashboard.tsx`<br>`src/services/certificationsService.ts` |
| `type` | `webhook_sla_below_threshold` | compara | `src/components/security/SecurityAlertsPanel.tsx` |
| `type` | `window` | escreve | `public/push-sw.js`<br>`public/sw-push.js`<br>`public/sw.js` |
| `type` | `xp` | compara, escreve | `src/components/ui/lucky-drop.tsx`<br>`src/components/ui/micro-interactions.tsx`<br>`src/lib/luckyWheelPayout.ts`<br>`src/services/notificationsService.ts` |
| `type` | `xp_gained` | compara, escreve | `src/pages/SocialFeed.tsx`<br>`src/services/socialFeedService.ts` |
| `type` | `zero_engagement` | escreve | `supabase/functions/admin-alerts/index.ts` |
| `role` | `admin` | compara, filtra | `src/components/rbac/UserRolesTab.tsx`<br>`supabase/functions/dispatch-critical-alert/index.ts`<br>`supabase/functions/reward-approval-review/index.ts`<br>`supabase/functions/security-weekly-digest/index.ts` |
| `role` | `assistant` | compara, escreve | `src/components/AICoachDialog.tsx`<br>`src/hooks/useAICoach.ts`<br>`supabase/functions/_shared/contracts/_fixtures/index.ts` |
| `role` | `long` | compara, escreve | `src/pages/BurnRate.tsx` |
| `role` | `manager` | compara | `supabase/functions/reward-approval-review/index.ts` |
| `role` | `mentor` | compara | `src/pages/Mentoria.tsx`<br>`src/services/mentorshipService.ts` |
| `role` | `robot` | escreve | `supabase/functions/_shared/contracts/_fixtures/index.ts` |
| `role` | `short` | escreve | `src/pages/BurnRate.tsx` |
| `role` | `system` | escreve | `supabase/functions/ai-coach/index.ts`<br>`supabase/functions/ai-course-builder/index.ts`<br>`supabase/functions/churn-prediction/index.ts`<br>`supabase/functions/generate-quiz-questions/index.ts`<br>`supabase/functions/reward-approval-review/index.ts`<br>… +1 |
| `role` | `user` | compara, escreve, filtra | `src/components/AICoachDialog.tsx`<br>`src/hooks/useAICoach.ts`<br>`src/services/aiCoachService.ts`<br>`src/services/behavioralBadges/index.ts`<br>`supabase/functions/_shared/contracts/_fixtures/index.ts`<br>… +5 |
| `status` | `Ausente` | escreve | `src/stories/user/AvatarAndProfile.stories.tsx` |
| `status` | `Ocupado` | escreve | `src/stories/user/AvatarAndProfile.stories.tsx` |
| `status` | `Offline` | escreve | `src/stories/user/AvatarAndProfile.stories.tsx` |
| `status` | `Online` | escreve | `src/stories/user/AvatarAndProfile.stories.tsx` |
| `status` | `SUBSCRIBED` | compara | `src/hooks/useNotifications.ts` |
| `status` | `absent` | compara, escreve | `src/components/AttendanceCalendar.tsx` |
| `status` | `accepted` | compara, escreve | `src/components/duels/DuelCard.tsx`<br>`src/hooks/useMentorship.ts`<br>`src/pages/Mentoria.tsx`<br>`src/services/mentorshipService.ts` |
| `status` | `active` | compara, escreve, filtra | `src/components/CertificationsPanel.tsx`<br>`src/components/GoalsWidget.tsx`<br>`src/components/MyDevelopmentPlanWidget.tsx`<br>`src/components/TeamChallenges.tsx`<br>`src/components/admin/DevelopmentPlanManager.tsx`<br>… +41 |
| `status` | `all` | compara | `src/components/PushNotificationHistory.tsx`<br>`src/components/manager/QuestsList.tsx`<br>`src/services/actionPlansService.ts` |
| `status` | `anomaly` | compara | `src/lib/luckyWheelPayout.ts` |
| `status` | `applied` | compara, filtra | `src/components/campaigns/CampaignImportHistory.tsx`<br>`src/services/campaignImportService.ts` |
| `status` | `approved` | compara | `src/components/shop-admin/PurchaseGovernanceDialog.tsx` |
| `status` | `archived` | compara, escreve | `src/components/manager/QuestCard.tsx`<br>`src/components/manager/QuestsList.tsx`<br>`src/services/questsService.ts` |
| `status` | `at_risk` | compara | `src/components/goals/GoalCard.tsx` |
| `status` | `away` | escreve | `src/stories/data-display/StatsAndTables.stories.tsx` |
| `status` | `below_target` | compara | `src/components/boss/BossExecutiveSummaryCard.tsx`<br>`src/lib/bossExecutiveSummary.ts`<br>`src/lib/bossWinRateGoals.ts` |
| `status` | `bye` | compara | `src/components/tournament/TournamentBracketView.tsx`<br>`src/pages/TournamentsPage.tsx` |
| `status` | `cancelled` | compara, escreve | `src/components/checkins/CheckinCard.tsx`<br>`src/components/duels/DuelCard.tsx`<br>`src/components/shop-admin/PurchaseGovernanceDialog.tsx`<br>`src/lib/auctionAdmin.ts`<br>`src/services/duelsService.ts`<br>… +1 |
| `status` | `closed` | compara, escreve | `src/components/admin/SurveyCreator.tsx`<br>`src/components/auction/AuctionCard.tsx`<br>`src/lib/auctionAdmin.ts`<br>`src/services/pulseSurveysService.ts` |
| `status` | `completed` | compara, escreve, filtra | `src/components/GoalsWidget.tsx`<br>`src/components/MyDevelopmentPlanWidget.tsx`<br>`src/components/admin/DevelopmentPlanManager.tsx`<br>`src/components/admin/pdi/PlanDetailView.tsx`<br>`src/components/campaigns/CampaignTeamSplitTrail.tsx`<br>… +20 |
| `status` | `critical` | compara | `src/lib/luckyWheelPayoutHistory.ts`<br>`src/pages/ErrorBudget.tsx` |
| `status` | `decided` | compara | `src/components/tournament/TournamentBracketView.tsx`<br>`src/pages/TournamentsPage.tsx` |
| `status` | `declined` | compara, escreve | `src/components/duels/DuelCard.tsx`<br>`src/services/duelsService.ts` |
| `status` | `delivered` | compara | `src/components/shop-admin/PurchaseGovernanceDialog.tsx` |
| `status` | `draft` | compara, escreve, filtra | `src/components/admin/FeedbackCycleManager.tsx`<br>`src/components/admin/SurveyCreator.tsx`<br>`src/components/auction/AuctionAdminForm.tsx`<br>`src/components/boss/BossBattleAdminDialog.tsx`<br>`src/components/campaigns/CampaignGoalBetPanel.tsx`<br>… +29 |
| `status` | `error` | escreve | `supabase/functions/_shared/sentry.ts` |
| `status` | `expired` | compara, escreve, filtra | `src/lib/bossHistory.ts`<br>`src/services/bossBattleService.ts`<br>`src/services/certificationsService.ts`<br>`supabase/migrations/20251213164818_77e12a61-a727-4556-b33b-03828d080ab1.sql` |
| `status` | `expiring_soon` | compara | `src/services/certificationsService.ts` |
| `status` | `failed` | compara, escreve | `src/components/trails/AICourseBuilderDialog.tsx`<br>`src/lib/pushOutbox.ts`<br>`src/services/campaignImportService.ts`<br>`supabase/functions/ai-course-builder/index.ts`<br>`supabase/functions/push-device-revoked/index.ts`<br>… +2 |
| `status` | `finished` | compara, filtra | `src/pages/TournamentsPage.tsx`<br>`src/services/lightningQuizService.ts`<br>`src/services/memoryGameService.ts` |
| `status` | `fulfilled` | compara | `src/hooks/useAdminUsers.ts` |
| `status` | `future` | compara, escreve | `src/components/AttendanceCalendar.tsx` |
| `status` | `gap` | escreve | `src/lib/luckyWheelPayoutHistory.ts` |
| `status` | `healthy` | escreve | `supabase/functions/error-budget-monitor/index.ts` |
| `status` | `high` | compara | `src/pages/ErrorBudget.tsx` |
| `status` | `idle` | compara | `src/components/ui/micro-quest-card.tsx` |
| `status` | `in_progress` | compara | `src/components/MyDevelopmentPlanWidget.tsx`<br>`src/components/checkins/CheckinCard.tsx`<br>`src/components/engagement/plans/ActionPlanItemList.tsx`<br>`src/pages/Postmortems.tsx`<br>`src/services/actionPlansService.ts` |
| `status` | `insufficient` | compara | `src/lib/luckyWheelPayout.ts` |
| `status` | `invalid` | escreve | `src/lib/campaignImport.ts` |
| `status` | `invalidated` | compara, escreve | `supabase/functions/push-device-revoked/index.ts`<br>`supabase/functions/push-outbox-dispatcher/index.ts`<br>`supabase/functions/send-campaign-push/index.ts` |
| `status` | `investigating` | escreve | `src/services/wagerIntegrityReviewService.ts` |
| `status` | `late` | compara | `src/components/AttendanceCalendar.tsx`<br>`src/services/positionsService.ts` |
| `status` | `locked` | compara | `src/components/trails/TrailCard.tsx`<br>`src/lib/predictionAdmin.ts`<br>`src/stories/gamification/Quests.stories.tsx` |
| `status` | `network_error` | escreve | `supabase/functions/webhook-dispatcher/index.ts` |
| `status` | `no_data` | compara | `src/lib/bossExecutiveSummary.ts` |
| `status` | `number` | compara | `src/lib/edgeErrors.ts` |
| `status` | `offline` | escreve | `src/stories/data-display/StatsAndTables.stories.tsx` |
| `status` | `ok` | escreve | `supabase/functions/_shared/sentry.ts` |
| `status` | `on_time` | compara, escreve | `src/hooks/usePositions.ts`<br>`src/lib/bossAutoHooks.ts`<br>`src/lib/cardPackTriggers.ts`<br>`src/services/positionsService.ts` |
| `status` | `on_track` | compara | `src/components/boss/BossExecutiveSummaryCard.tsx`<br>`src/lib/bossExecutiveSummary.ts`<br>`src/services/behavioralBadges/index.ts` |
| `status` | `online` | escreve | `src/stories/data-display/StatsAndTables.stories.tsx` |
| `status` | `open` | compara, escreve | `src/components/prediction/PredictionAdminRow.tsx`<br>`src/components/prediction/PredictionMarketCard.tsx`<br>`src/lib/goalBetCountdown.ts`<br>`src/lib/goalBetFilter.ts`<br>`src/lib/goalBetStakePreview.ts`<br>… +4 |
| `status` | `opened` | compara | `src/components/cards/PackList.tsx` |
| `status` | `pending` | compara, escreve, filtra | `src/components/admin/PasswordResetApprovalPanel.tsx`<br>`src/components/cards/TradeInbox.tsx`<br>`src/components/duels/DuelCard.tsx`<br>`src/components/engagement/plans/ActionPlanItemList.tsx`<br>`src/components/shop-admin/PurchaseGovernanceDialog.tsx`<br>… +23 |
| `status` | `processing` | compara, escreve, filtra | `src/components/trails/AICourseBuilderDialog.tsx`<br>`src/lib/pushOutbox.ts`<br>`supabase/functions/_shared/webhookSecurity.ts`<br>`supabase/functions/ai-course-builder/index.ts` |
| `status` | `published` | compara, filtra | `src/pages/Postmortems.tsx`<br>`src/services/trailsService.ts`<br>`supabase/functions/trail-recommendations/index.ts` |
| `status` | `punctual` | compara | `src/components/AttendanceCalendar.tsx` |
| `status` | `ready` | compara | `src/components/tournament/TournamentBracketView.tsx` |
| `status` | `refunded` | compara | `src/components/auction/AuctionCard.tsx` |
| `status` | `registration` | compara | `src/pages/TournamentsPage.tsx` |
| `status` | `rejected` | compara, escreve | `src/hooks/useAdminUsers.ts`<br>`src/services/mentorshipService.ts` |
| `status` | `revealed` | compara | `src/pages/ScratchCardPage.tsx` |
| `status` | `reverted` | compara | `src/lib/campaignTeamSplitRevert.ts` |
| `status` | `revoked` | compara | `src/components/push/PushDeviceList.tsx`<br>`src/lib/pushDevices.ts`<br>`supabase/migrations/20251213164818_77e12a61-a727-4556-b33b-03828d080ab1.sql` |
| `status` | `rework` | compara | `src/services/positionsService.ts` |
| `status` | `running` | compara, escreve | `src/hooks/useBossBattles.ts`<br>`src/hooks/useDepartmentWars.ts`<br>`src/lib/bossAutoHooks.ts`<br>`src/lib/bossExecutiveSummary.ts`<br>`src/pages/BossBattlePage.tsx`<br>… +3 |
| `status` | `scheduled` | escreve, filtra | `src/services/checkinsService.ts`<br>`src/services/continuousEngagementService.ts` |
| `status` | `sealed` | compara, escreve | `src/components/cards/PackList.tsx`<br>`src/pages/CardAlbumPage.tsx`<br>`src/services/tradingCardsService.ts` |
| `status` | `sent` | compara, escreve | `src/lib/pushOutbox.ts`<br>`supabase/functions/push-device-revoked/index.ts`<br>`supabase/functions/push-outbox-dispatcher/index.ts`<br>`supabase/functions/send-campaign-push/index.ts` |
| `status` | `settled` | compara | `src/components/prediction/PredictionMarketCard.tsx`<br>`src/lib/bossHistory.ts`<br>`src/lib/goalBetExposure.ts`<br>`src/lib/goalBetFilter.ts`<br>`src/lib/goalBetHistory.ts`<br>… +3 |
| `status` | `skipped` | compara, escreve | `src/components/campaigns/CampaignTeamSplitTrail.tsx`<br>`src/lib/pushOutbox.ts` |
| `status` | `submitted` | escreve, filtra | `src/services/feedbackService.ts` |
| `status` | `succeeded` | compara, escreve | `src/components/trails/AICourseBuilderDialog.tsx`<br>`supabase/functions/ai-course-builder/index.ts` |
| `status` | `today-pending` | compara, escreve | `src/components/AttendanceCalendar.tsx` |
| `status` | `unconfigured` | compara, escreve | `src/lib/luckyWheelPayout.ts` |
| `status` | `valid` | compara, escreve | `src/components/campaigns/CampaignImportDialog.tsx`<br>`src/lib/campaignImport.ts`<br>`src/services/campaignImportService.ts` |
| `status` | `voided` | compara | `src/components/prediction/PredictionMarketCard.tsx`<br>`src/lib/goalBetExposure.ts`<br>`src/lib/goalBetFilter.ts`<br>`src/lib/goalBetHistory.ts`<br>`src/lib/goalBetPosition.ts`<br>… +2 |
| `status` | `warn` | compara | `src/lib/luckyWheelPayoutHistory.ts` |
| `status` | `warning` | compara | `src/pages/ErrorBudget.tsx` |
| `status` | `weekend` | compara, escreve | `src/components/AttendanceCalendar.tsx` |
| `status` | `won` | compara | `src/components/auction/AuctionCard.tsx` |
| `stage` | `idle` | compara | `src/components/campaigns/CampaignImportDialog.tsx` |
| `stage` | `parsing` | compara | `src/components/campaigns/CampaignImportDialog.tsx` |
| `stage` | `preview` | compara | `src/components/campaigns/CampaignImportDialog.tsx` |
| `stage` | `saving` | compara | `src/components/campaigns/CampaignImportDialog.tsx` |
| `state` | `claimable` | compara | `src/components/cards/SetRewardsPanel.tsx` |
| `state` | `claimed` | compara | `src/components/cards/SetRewardsPanel.tsx` |
| `state` | `closed` | escreve | `src/lib/opinionChannel.ts` |
| `state` | `collapsed` | compara | `src/components/ui/sidebar.tsx` |
| `state` | `due_soon` | escreve | `src/lib/opinionChannel.ts` |
| `state` | `duplicate` | escreve | `supabase/functions/_shared/webhookSecurity.ts` |
| `state` | `expanded` | escreve | `src/components/ui/sidebar.tsx` |
| `state` | `fresh` | escreve | `supabase/functions/_shared/webhookSecurity.ts` |
| `state` | `in_progress` | escreve | `supabase/functions/_shared/webhookSecurity.ts` |
| `state` | `locked` | compara | `src/components/cards/SetRewardsPanel.tsx` |
| `state` | `on_track` | escreve | `src/lib/opinionChannel.ts` |
| `state` | `overdue` | compara, escreve | `src/lib/opinionChannel.ts` |
| `state` | `unavailable` | escreve | `supabase/functions/_shared/webhookSecurity.ts` |
| `step` | `password` | compara | `src/components/security/ReauthProvider.tsx` |
| `phase` | `diagnose` | escreve | `src/pages/Runbook.tsx` |
| `phase` | `idle` | compara | `src/pages/LightningQuizPage.tsx` |
| `phase` | `intro` | compara | `src/components/ui/lucky-drop.tsx` |
| `phase` | `note` | escreve | `src/pages/Runbook.tsx` |
| `phase` | `opening` | compara | `src/components/ui/lucky-drop.tsx` |
| `phase` | `playing` | compara | `src/pages/LightningQuizPage.tsx` |
| `phase` | `result` | compara | `src/pages/LightningQuizPage.tsx` |
| `phase` | `reveal` | compara | `src/components/ui/lucky-drop.tsx` |
| `engagement_cycle_status` | `scheduled` | escreve | `src/integrations/supabase/types.ts` |
| `opinion_status` | `new` | escreve | `src/integrations/supabase/types.ts` |
| `purchase_status` | `pending` | escreve | `src/integrations/supabase/types.ts` |
| `quest_status` | `draft` | escreve | `src/integrations/supabase/types.ts` |
| `trail_status` | `draft` | escreve | `src/integrations/supabase/types.ts` |

### E.4 Enums e listas de valores

| Nome | Valores | Onde |
|---|---|---|
| app_role | `admin`, `manager`, `employee` | banco |
| quest_difficulty | `easy`, `medium`, `hard`, `expert` | banco |
| quest_status | `draft`, `active`, `archived` | banco |
| audit_action | `user_signup`, `user_login`, `profile_update`, `xp_gained`, `level_up`, `coins_earned`, `coins_spent`, `quest_created`, `quest_updated`, `quest_deleted`, `quest_assigned`, `quest_completed`, `kudos_given`, `kudos_received`, `achievement_unlocked`, `streak_updated`, `department_created`, `department_updated`, `team_member_added`, `team_member_removed`, `role_assigned`, `role_removed`, `api_key_created`, `api_key_rotated`, `api_key_status_changed`, `api_key_deleted` | banco |
| module_content_type | `video`, `text`, `quiz`, `flashcard`, `infographic`, `simulation`, `checklist` | banco |
| trail_status | `draft`, `published`, `archived` | banco |
| mission_frequency | `daily`, `weekly`, `monthly` | banco |
| reward_category | `product`, `benefit`, `experience` | banco |
| reward_rarity | `common`, `rare`, `epic`, `legendary` | banco |
| purchase_status | `pending`, `approved`, `delivered`, `cancelled` | banco |
| task_completion_status | `pending`, `on_time`, `late`, `rejected`, `rework` | banco |
| climate_pillar | `recognition`, `autonomy`, `growth`, `leadership`, `peers`, `purpose`, `environment`, `communication`, `benefits`, `balance` | banco |
| opinion_category | `suggestion`, `complaint`, `compliment`, `question`, `other` | banco |
| opinion_urgency | `low`, `normal`, `high`, `critical` | banco |
| opinion_status | `new`, `read`, `in_progress`, `resolved`, `archived` | banco |
| engagement_answer_format | `slider`, `stars`, `emoji`, `cards`, `checkbox`, `percentage`, `text` | banco |
| engagement_cycle_status | `scheduled`, `active`, `closed` | banco |
| evaluator_type | `self`, `manager`, `peer`, `direct_report`, `external` | banco |
| feedback_cycle_status | `draft`, `active`, `collecting`, `processing`, `completed`, `cancelled` | banco |
| ConfirmVariant | danger \| warning \| default | `src/components/ConfirmDialog.tsx` |
| MessageType | error \| success \| info \| warning | `src/components/GlobalMessageProvider.tsx` |
| RankTier | master \| champion \| top3 \| top10 \| top50 \| rising | `src/components/RankingBadge.tsx` |
| CategoryFilter | all \| trails \| quests \| users | `src/components/search/SearchFilters.tsx` |
| DifficultyFilter | all \| easy \| medium \| hard \| expert | `src/components/search/SearchFilters.tsx` |
| ActivityType | all \| xp_gained \| level_up \| quest_completed \| kudos_given \| kudos_received \| achievement_unlocked \| streak_updated | `src/components/social/FeedFilters.tsx` |
| PeriodType | today \| week \| month \| all \| custom | `src/components/social/FeedFilters.tsx` |
| HapticStyle | light \| medium \| heavy \| success \| warning \| error \| selection \| none | `src/hooks/useHaptics.ts` |
| AppRole | admin \| manager \| employee | `src/hooks/useRBAC.ts` |
| SupportedLocale | pt-BR \| en-US \| es-ES | `src/i18n/translations.ts` |
| AuctionAdminStatus | draft \| active \| closed \| cancelled | `src/lib/auctionAdmin.ts` |
| IssueLevel | error \| warning | `src/lib/auctionAdmin.ts` |
| AdminAction | publish \| close \| cancel | `src/lib/auctionAdmin.ts` |
| AuctionNotificationOutcome | won \| refunded \| stock_unavailable | `src/lib/auctionAdmin.ts` |
| BidRejection | invalid_amount \| below_minimum \| insufficient_coins | `src/lib/auctionEngine.ts` |
| ChallengeDifficulty | sem-dados \| muito-facil \| equilibrado \| dificil \| critico | `src/lib/boardStats.ts` |
| ChallengeFlag | amostra-insuficiente \| revisar-enunciado \| recompensa-baixa-demais \| jogadores-travados | `src/lib/boardStats.ts` |
| BoardMedal | ouro \| prata \| bronze | `src/lib/boardStats.ts` |
| BOARD_CHALLENGE_CSV_HEADERS | "casa", "pergunta", "tentativas", "acertos", "acerto_pct", "jogadores", "travados", "dificuldade", "alertas", | `src/lib/boardStatsExport.ts` |
| BoardTileType | start \| bonus \| penalty \| challenge \| neutral \| checkpoint \| finish | `src/lib/boardTrail.ts` |
| ALERT_PHASES | "wounded", "enraged", "critical", "defeated" | `src/lib/bossAlerts.ts` |
| TaskCompletionStatus | pending \| on_time \| late \| rejected \| rework | `src/lib/bossAutoHooks.ts` |
| BossDamageSource | task_score \| trail_completion \| attendance \| quiz \| manual | `src/lib/bossBattle.ts` |
| BossPhase | healthy \| wounded \| enraged \| critical \| defeated | `src/lib/bossBattle.ts` |
| PlanLevel | error \| warning | `src/lib/bossBattlePlanner.ts` |
| BOSS_COMPARISON_CSV_HEADERS | "rank", "departamento_id", "departamento", "batalhas", "vitorias", "derrotas", "taxa_vitoria_pct", "taxa_ajustada_pct", "hp_destruido", "moedas", "xp", "abate_medio_min", | `src/lib/bossDepartmentComparisonExport.ts` |
| ExecutiveAlertLevel | critical \| warning \| info | `src/lib/bossExecutiveSummary.ts` |
| ExecutiveAlertKind | win_rate_drop \| below_target \| awaiting_settlement \| no_activity | `src/lib/bossExecutiveSummary.ts` |
| BossHistoryStatus | draft \| running \| defeated \| expired \| settled | `src/lib/bossHistory.ts` |
| BOSS_HISTORY_CSV_HEADERS | "id", "titulo", "status", "resultado", "hp_total", "hp_destruido", "hp_destruido_pct", "duracao_abate_min", "moedas", "xp", "apurado", "concluido_em", | `src/lib/bossHistoryExport.ts` |
| BOSS_REPORT_SECTIONS | "PARAMETROS", "RESUMO", "TENDENCIA_MENSAL", "COMPARATIVO_DEPARTAMENTOS", "METAS_WIN_RATE", "BATALHAS", | `src/lib/bossReport.ts` |
| GoalStatus | no_data \| on_track \| at_risk \| below_target | `src/lib/bossWinRateGoals.ts` |
| DropSeverity | none \| watch \| warning \| critical | `src/lib/bossWinRateGoals.ts` |
| ReconciliationIssue | ambiguous \| not_found \| duplicate \| invalid_data | `src/lib/campaignImport.ts` |
| TeamHealthSeverity | critical \| warning \| info | `src/lib/campaignTeamHealth.ts` |
| TeamHealthCode | team_without_members \| team_without_target \| team_zero_progress \| duplicate_team_name \| member_in_multiple_teams \| unassigned_participants \| team_already_awarded | `src/lib/campaignTeamHealth.ts` |
| PeriodPreset | all \| 30d \| 90d \| 180d \| 365d \| year | `src/lib/campaignTeamMetrics.ts` |
| TeamShareMode | proportional \| equal | `src/lib/campaignTeamSplit.ts` |
| RevertFailure | batch_not_found \| already_reverted \| nothing_to_revert | `src/lib/campaignTeamSplitRevert.ts` |
| CardPackSource | task \| training \| quest \| campaign \| manual \| streak | `src/lib/cardPackTriggers.ts` |
| TaskCompletionStatus | pending \| on_time \| late \| rejected \| rework | `src/lib/cardPackTriggers.ts` |
| SetClaimRejection | unknown_set \| empty_set \| not_reached \| already_claimed | `src/lib/cardSetRewards.ts` |
| SET_MILESTONES | 25, 50, 75, 100 | `src/lib/cardSetRewards.ts` |
| BenchmarkPosition | top_10 \| top_quartile \| above_average \| below_average \| unknown | `src/lib/climateBenchmark.ts` |
| BENCHMARK_INDUSTRIES | { value: "geral", label: "Todos os setores" }, { value: "tecnologia", label: "Tecnologia" }, { value: "industria", label: "Indústria" }, { value: "comercio", label: "Comércio / Varejo" }, { value: "servicos", label: "Serviços" }, { value: "saude", label: "Saúde" }, { value: "educacao", label: "Educa … | `src/lib/climateBenchmark.ts` |
| BENCHMARK_COMPANY_SIZES | { value: "all", label: "Todos os portes" }, { value: "small", label: "Pequena (até 99)" }, { value: "medium", label: "Média (100–499)" }, { value: "large", label: "Grande (500–1999)" }, { value: "enterprise", label: "Corporação (2000+)" }, | `src/lib/climateBenchmark.ts` |
| WarConfigIssueLevel | error \| warning | `src/lib/departmentWarConfig.ts` |
| PushSyncEventType | subscribed \| refreshed \| renamed \| disabled \| revoked \| failed | `src/lib/deviceLabel.ts` |
| EdgeErrorKind | rate_limited \| payment_required \| unauthorized \| forbidden \| not_found \| bad_request \| server_error \| network \| unknown | `src/lib/edgeErrors.ts` |
| InsightSeverity | critical \| high \| medium \| info \| positive | `src/lib/engagementInsights.ts` |
| InsightKind | pillar_critical \| factor_weak \| market_gap \| nps_decline \| low_participation \| strength | `src/lib/engagementInsights.ts` |
| CountdownUrgency | none \| calm \| soon \| urgent \| closed | `src/lib/goalBetCountdown.ts` |
| ExposureLevel | none \| safe \| attention \| high | `src/lib/goalBetExposure.ts` |
| GoalBetFilter | all \| open \| mine \| closed | `src/lib/goalBetFilter.ts` |
| GOAL_BET_CSV_HEADER | "data", "mercado", "apostado", "retornado", "lucro", "resultado", | `src/lib/goalBetHistoryCsv.ts` |
| GoalBetOutcomeKind | winner \| no_winner_option \| refund \| tie \| unmatched_winner \| ambiguous_label | `src/lib/goalBetSettlement.ts` |
| StakePreviewBlock | no_market \| no_option \| market_closed \| invalid_amount \| below_min \| above_user_cap | `src/lib/goalBetStakePreview.ts` |
| GoalBetBuildError | no_candidates \| too_few_options \| too_many_candidates | `src/lib/goalBetting.ts` |
| AuditOperation | INSERT \| UPDATE \| DELETE | `src/lib/luckyWheelAudit.ts` |
| AUDITED_FIELDS | "label", "prize_type", "amount", "weight", "color", "icon", "rarity", "is_active", | `src/lib/luckyWheelAudit.ts` |
| ComparisonAlertSeverity | low \| medium \| high \| critical | `src/lib/luckyWheelComparisonAlerts.ts` |
| OddsPrizeType | coins \| xp \| achievement \| nothing | `src/lib/luckyWheelOdds.ts` |
| WheelIssueLevel | error \| warning | `src/lib/luckyWheelOdds.ts` |
| ReconciliationStatus | ok \| insufficient \| watch \| anomaly \| unconfigured | `src/lib/luckyWheelPayout.ts` |
| PayoutAlertLevel | error \| warning \| info | `src/lib/luckyWheelPayout.ts` |
| PayoutAlertSeverity | low \| medium \| high \| critical | `src/lib/luckyWheelPayoutAlerts.ts` |
| SignificanceVerdict | insufficient \| stable \| significant | `src/lib/luckyWheelPayoutComparison.ts` |
| PayoutTrendStatus | gap \| insufficient \| ok \| warn \| critical | `src/lib/luckyWheelPayoutHistory.ts` |
| NotificationChannel | in_app \| push \| email | `src/lib/notificationTypePrefs.ts` |
| NpsMetricKey | eNPS \| LNPS | `src/lib/npsHistory.ts` |
| NpsTrend | up \| down \| flat \| unknown | `src/lib/npsHistory.ts` |
| NpsZone | critical \| attention \| good \| excellent \| unknown | `src/lib/npsHistory.ts` |
| OpinionCategory | suggestion \| complaint \| compliment \| question \| other | `src/lib/opinionChannel.ts` |
| OpinionUrgency | low \| normal \| high \| critical | `src/lib/opinionChannel.ts` |
| OpinionStatus | new \| read \| in_progress \| resolved \| archived | `src/lib/opinionChannel.ts` |
| SlaState | on_track \| due_soon \| overdue \| closed | `src/lib/opinionChannel.ts` |
| ResumableContentType | video \| text \| quiz \| flashcard \| checklist | `src/lib/playerResume.ts` |
| PredictionAdminStatus | draft \| open \| locked \| settled \| voided | `src/lib/predictionAdmin.ts` |
| IssueLevel | error \| warning | `src/lib/predictionAdmin.ts` |
| PredictionAdminAction | publish \| lock \| settle \| void | `src/lib/predictionAdmin.ts` |
| PredictionStatus | draft \| open \| locked \| settled \| voided | `src/lib/predictionMarket.ts` |
| StakeRejection | market_closed \| unknown_option \| invalid_amount \| below_minimum \| over_user_cap \| insufficient_coins \| option_switch_forbidden | `src/lib/predictionMarket.ts` |
| OracleTier | oracle \| analyst \| apprentice \| contrarian | `src/lib/predictionOracle.ts` |
| PredictionAlertType | prediction_lock_overdue \| prediction_settlement_overdue | `src/lib/predictionWatchdog.ts` |
| AlertSeverity | low \| medium \| high \| critical | `src/lib/predictionWatchdog.ts` |
| RiskLevel | low \| medium \| high \| critical | `src/lib/purchaseRisk.ts` |
| PushDeviceStatus | current \| active \| idle \| revoked | `src/lib/pushDevices.ts` |
| PushDeviceKind | mobile \| tablet \| desktop \| unknown | `src/lib/pushDevices.ts` |
| OutboxStatus | pending \| processing \| sent \| failed \| skipped | `src/lib/pushOutbox.ts` |
| HealthSeverity | ok \| warning \| critical | `src/lib/pushOutboxHealth.ts` |
| SEQUENCE_REPORT_SECTIONS | "PARAMETROS", "RESUMO", "ETAPAS", "RANKING", "SERIE_DIARIA", "TENTATIVAS", | `src/lib/sequenceProcedureStatsExport.ts` |
| CardRarity | common \| rare \| epic \| legendary | `src/lib/tradingCards.ts` |
| TradeRejection | same_user \| same_card \| offer_not_owned \| offer_not_duplicate \| request_not_owned \| request_not_duplicate \| unfair | `src/lib/tradingCards.ts` |
| MODULE_CONTENT_TYPES | "video", "text", "quiz", "flashcard", "infographic", "simulation", "checklist", | `src/lib/trailAuthoring.ts` |
| WagerAnomalySeverity | critical \| warning \| info | `src/lib/wagerIntegrity.ts` |
| WagerAnomalyCode | accuracy_outlier \| perfect_streak \| net_drain \| volume_spike \| stale_activity | `src/lib/wagerIntegrity.ts` |
| AUTO_METRIC_KEYS | "tarefa_concluida", "tarefa_no_prazo", "checkin_pontual", "trilha_concluida", "modulo_concluido", "quiz_acertado", "feedback_enviado", | `src/lib/warAutoHooks.ts` |
| WarLeadSeverity | critical \| warning \| positive \| info | `src/lib/warLeadership.ts` |
| SeverityFilter | all \| slow \| very_slow \| error | `src/pages/AdminTelemetria.tsx` |
| TimeFilter | 1h \| 6h \| 24h \| 7d \| custom | `src/pages/AdminTelemetria.tsx` |
| ActionPlanStatus | planning \| active \| paused \| completed \| cancelled | `src/services/actionPlansService.ts` |
| ActionItemStatus | pending \| in_progress \| completed \| cancelled \| blocked | `src/services/actionPlansService.ts` |
| ActionItemPriority | low \| medium \| high \| critical | `src/services/actionPlansService.ts` |
| AICourseJobStatus | pending \| processing \| succeeded \| failed | `src/services/aiCourseBuilderService.ts` |
| AuctionStatus | draft \| active \| closed \| cancelled | `src/services/auctionService.ts` |
| AuctionBidStatus | active \| refunded \| won | `src/services/auctionService.ts` |
| AuctionAdminAction | draft_created \| published \| settled \| cancelled \| stock_reserved \| stock_unavailable | `src/services/auctionService.ts` |
| AuctionAdminReason | invalid_title \| invalid_economics \| invalid_window \| reward_unavailable \| not_found \| not_draft \| window_expired | `src/services/auctionService.ts` |
| AuditAction | user_signup \| user_login \| profile_update \| xp_gained \| level_up \| coins_earned \| coins_spent \| quest_created \| quest_updated \| quest_deleted \| quest_assigned \| quest_completed \| kudos_given \| kudos_received \| achievement_unlocked \| streak_updated \| department_created \| department_updated \| team_member_added \| team_member_removed \| role_assigned \| role_removed | `src/services/auditService.ts` |
| AvatarCategory | background \| frame \| accessory \| effect \| badge_style | `src/services/avatarService.ts` |
| AvatarRarity | common \| rare \| epic \| legendary | `src/services/avatarService.ts` |
| UnlockType | default \| level \| achievement \| purchase \| streak \| special | `src/services/avatarService.ts` |
| BossBattleStatus | draft \| running \| defeated \| expired \| settled | `src/services/bossBattleService.ts` |
| ClimatePillar | recognition \| autonomy \| growth \| leadership \| peers \| purpose \| environment \| communication \| benefits \| balance | `src/services/climateSurveyService.ts` |
| COMBO_TIERS | { minActions: 0, multiplier: 1.0, label: "Normal", color: "text-muted-foreground", bgColor: "bg-muted" }, { minActions: 3, multiplier: 1.5, label: "Aquecendo", color: "text-blue-500", bgColor: "bg-blue-500/20" }, { minActions: 5, multiplier: 2.0, label: "Em Chamas!", color: "text-orange-500", bgColo … | `src/services/comboService.ts` |
| EngagementAnswerFormat | slider \| stars \| emoji \| cards \| checkbox \| percentage \| text | `src/services/continuousEngagementService.ts` |
| DepartmentWarStatus | draft \| running \| finished \| cancelled | `src/services/departmentWarService.ts` |
| ScoreZone | critical \| attention \| neutral \| good \| excellent | `src/services/engagementDiagnosticsService.ts` |
| LightningDifficulty | easy \| medium \| hard | `src/services/lightningQuizService.ts` |
| LuckyWheelPrizeType | coins \| xp \| achievement \| nothing | `src/services/luckyWheelService.ts` |
| LuckyWheelRarity | common \| rare \| epic \| legendary | `src/services/luckyWheelService.ts` |
| MentorshipRequestType | find_mentor \| find_apprentice \| specific | `src/services/mentorshipService.ts` |
| MentorshipRequestStatus | pending \| accepted \| rejected \| expired | `src/services/mentorshipService.ts` |
| MentorshipPairStatus | pending \| active \| completed \| cancelled | `src/services/mentorshipService.ts` |
| MentorshipMissionType | mentor_only \| apprentice_only \| collaborative | `src/services/mentorshipService.ts` |
| MentorshipDifficulty | easy \| medium \| hard | `src/services/mentorshipService.ts` |
| MentorshipRole | mentor \| apprentice | `src/services/mentorshipService.ts` |
| Nr1RiskLevel | critical \| high \| moderate \| low | `src/services/nr1RiskService.ts` |
| OpinionScope | mine \| queue | `src/services/opinionsService.ts` |
| PredictionMarketStatus | draft \| open \| locked \| settled \| voided | `src/services/predictionMarketService.ts` |
| EngagementTrend | rising \| stable \| declining \| critical | `src/services/predictiveFeedbackService.ts` |
| ApprovalAction | requested \| ai_review \| approve \| first_approval \| reject \| deliver \| cancel \| reopen | `src/services/purchaseGovernanceService.ts` |
| PushLogStatus | sent \| failed \| invalidated \| skipped | `src/services/pushHistoryService.ts` |
| ScratchPrizeType | coins \| xp \| nothing | `src/services/scratchCardService.ts` |
| ScratchRarity | common \| rare \| epic \| legendary | `src/services/scratchCardService.ts` |
| ScratchCardSource | task \| training \| quest \| campaign \| manual | `src/services/scratchCardService.ts` |
| RewardCategory | product \| benefit \| experience | `src/services/shopService.ts` |
| RewardRarity | common \| rare \| epic \| legendary | `src/services/shopService.ts` |
| PurchaseStatus | pending \| approved \| delivered \| cancelled | `src/services/shopService.ts` |
| TournamentStatus | draft \| registration \| running \| finished \| cancelled | `src/services/tournamentService.ts` |
| CardPackSource | task \| training \| quest \| campaign \| manual \| streak | `src/services/tradingCardsService.ts` |
| CardTradeStatus | pending \| accepted \| declined \| cancelled \| expired | `src/services/tradingCardsService.ts` |
| WagerReviewStatus | investigating \| confirmed \| false_positive | `src/services/wagerIntegrityReviewService.ts` |
| EconomyHealth | healthy \| inflated \| stagnant \| unbalanced | `src/services/xpBalancingService.ts` |
| VALIDATION_ERROR_CODES | "VALIDATION_ERROR", "INVALID_JSON", "UNSUPPORTED_VERSION" | `supabase/functions/_shared/validation.ts` |
| AssertionFailure | payload_malformado \| client_data_invalido \| tipo_invalido \| challenge_invalido \| origem_nao_permitida \| authenticator_data_invalido \| rp_id_invalido \| usuario_nao_presente \| verificacao_do_usuario_ausente \| chave_publica_invalida \| assinatura_invalida | `supabase/functions/_shared/webauthn.ts` |
| HTTP_METHODS | "GET", "POST" | `supabase/functions/_shared/contracts/common.ts` |
| WEBHOOK_CONTRACT_VERSIONS | "v1", "v2" | `supabase/functions/_shared/contracts/webhook-dispatcher.ts` |
| RiskLevel | low \| medium \| high \| critical | `supabase/functions/reward-approval-review/risk.ts` |

## F. Validações de entrada

### F.1 Schemas Zod

- **passwordSchema** (`src/lib/authValidations.ts`, z.string):
  ```ts
  
  ```
- **emailSchema** (`src/lib/authValidations.ts`, z.string):
  ```ts
  
  ```
- **displayNameSchema** (`src/lib/authValidations.ts`, z.string, encadeia optional):
  ```ts
  
  ```
- **loginSchema** (`src/lib/authValidations.ts`, z.object):
  ```ts
  { email: emailSchema, password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"), }
  ```
- **signupSchema** (`src/lib/authValidations.ts`, z.object):
  ```ts
  { email: emailSchema, password: passwordSchema, displayName: displayNameSchema, }
  ```
- **rowSchema** (`src/lib/campaignImport.ts`, z.object):
  ```ts
  { sellerIdentifier: z.string().trim().min(1, "Identificador do vendedor vazio").max(180, "Identificador muito longo"), amount: z .number() .refine((n) => Number.isFinite(n), "Valor invalido") .refine((n) => n !== 0, "Valor zerado") .refine((n) => Math.abs(n) <= 99_999_999, "Valor fora da faixa permitida"), referenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(), externalReference: z.string().trim().max(180).nullable(), }
  ```
  - Regras cruzadas (refine): “Valor invalido” · “Valor zerado” · “Valor fora da faixa permitida”
- **quizQuestionSchema** (`src/lib/trailAuthoring.ts`, z.object):
  ```ts
  { question: nonEmpty(500, "A pergunta"), options: z.array(nonEmpty(300, "A alternativa")).min(2, { message: "Informe pelo menos 2 alternativas", }), correct: z.number().int().min(0), }
  ```
- **flashcardSchema** (`src/lib/trailAuthoring.ts`, z.object):
  ```ts
  { front: nonEmpty(500, "A frente do card"), back: nonEmpty(1000, "O verso do card"), }
  ```
- **checklistItemSchema** (`src/lib/trailAuthoring.ts`, z.object):
  ```ts
  { text: nonEmpty(300, "O item"), }
  ```
- **moduleDraftSchema** (`src/lib/trailAuthoring.ts`, z.object, encadeia superRefine):
  ```ts
  { title: nonEmpty(150, "O título"), description: z.string().trim().max(500).nullable().optional(), content_type: z.enum(MODULE_CONTENT_TYPES), xp_reward: z.number().int().min(0).max(10000), duration_minutes: z.number().int().min(0).max(1440), video_url: z.string().trim().max(2048).nullable().optional(), transcript: z.string().trim().max(20000).nullable().optional(), body: z.string().trim().max(50000).nullable().optional(), questions: z.array(quizQuestionSchema).optional(), cards: z.array(flashcardSchema).optional(), items: z.array(checklistItemSchema).optional(), }
  ```
  - Regras cruzadas (refine): “Informe a URL do vídeo”
- **emailSchema** (`src/lib/validations.ts`, z.string, encadeia transform):
  ```ts
  { error: (issue) => issue.input === undefined ? "Email é obrigatório" : undefined}
  ```
- **passwordSchema** (`src/lib/validations.ts`, z.string):
  ```ts
  { error: (issue) => issue.input === undefined ? "Senha é obrigatória" : undefined}
  ```
- **strongPasswordSchema** (`src/lib/validations.ts`, z.string):
  ```ts
  { error: (issue) => issue.input === undefined ? "Senha é obrigatória" : undefined}
  ```
- **displayNameSchema** (`src/lib/validations.ts`, z.string, encadeia optional, transform):
  ```ts
  
  ```
- **loginFormSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { email: emailSchema, password: passwordSchema, }
  ```
- **signupFormSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { email: emailSchema, password: passwordSchema, displayName: displayNameSchema, }
  ```
- **forgotPasswordSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { email: emailSchema, }
  ```
- **profileUpdateSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { display_name: z .string() .min(2, "Nome deve ter pelo menos 2 caracteres") .max(50, "Nome deve ter no máximo 50 caracteres") .transform(sanitizeString) .optional(), avatar_url: z .string() .url("URL do avatar inválida") .max(500, "URL muito longa") .optional() .nullable(), }
  ```
- **questStepSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { id: z.string(), title: createStringSchema("Título da etapa", 2, 100), description: z.string().max(500, "Descrição muito longa").optional(), xpReward: z .number() .min(0, "XP não pode ser negativo") .max(10000, "XP máximo é 10.000"), }
  ```
- **questFormSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { title: questTitleSchema, description: questDescriptionSchema, icon: z.string().max(10, "Ícone inválido").default("📚"), difficulty: z.enum(["easy", "medium", "hard", "expert"], { error: (issue) => issue.input === undefined ? "Selecione a dificuldade" : undefined, }), xpReward: z .number() .min(0, "XP não pode ser negativo") .max(50000, "XP máximo é 50.000"), coinReward: z .number() .min(0, "Moedas não podem ser negativas") .max(50000, "Moedas máximas são 50.000"), deadlineDays: z .number() .min(1, "Prazo mínimo é 1 dia") .max(365, "Prazo máximo é 365 dias") .nullable() .optional(), maxParticipants: z .number() .min(1, "Mínimo de 1 participante") .max(10000, "Máximo de 10.000 participantes") .nullable() .optional(), tags: z .array(z.string().max(30, "Tag muito longa")) .max(10, "Máximo de …
  ```
- **kudosMessageSchema** (`src/lib/validations.ts`, z.string, encadeia transform):
  ```ts
  { error: (issue) => issue.input === undefined ? "Mensagem é obrigatória" : undefined}
  ```
- **giveKudosSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { to_user_id: z.string().uuid("Usuário inválido"), badge_id: z.string().uuid("Badge inválido").nullable().optional(), message: kudosMessageSchema, is_public: z.boolean().default(true), }
  ```
- **quizQuestionSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { question: createStringSchema("Pergunta", 10, 500), explanation: z.string().max(1000, "Explicação muito longa").optional().nullable(), difficulty: z.enum(["easy", "medium", "hard"]), points: z.number().min(1, "Mínimo 1 ponto").max(1000, "Máximo 1000 pontos"), category: z.string().max(50, "Categoria muito longa").optional().nullable(), quiz_type: z.enum(["daily", "millionaire", "magic_card"]).default("daily"), }
  ```
- **quizOptionSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { text: createStringSchema("Opção", 1, 300), is_correct: z.boolean(), }
  ```
- **aiCoachMessageSchema** (`src/lib/validations.ts`, z.string, encadeia transform):
  ```ts
  
  ```
- **shopRewardSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { name: createStringSchema("Nome do item", 2, 100), description: z.string().max(500, "Descrição muito longa").optional().nullable(), price_coins: z .number() .min(1, "Preço mínimo é 1 moeda") .max(1000000, "Preço máximo é 1.000.000 moedas"), category: z.enum(["product", "benefit", "experience"]), rarity: z.enum(["common", "rare", "epic", "legendary"]), stock: z.number().min(0, "Estoque não pode ser negativo").nullable().optional(), image_url: z.string().url("URL da imagem inválida").max(500).optional().nullable(), is_active: z.boolean().default(true), }
  ```
- **departmentSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { name: createStringSchema("Nome do departamento", 2, 100), description: z.string().max(500, "Descrição muito longa").optional().nullable(), color: z .string() .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida (use formato hexadecimal)") .optional() .nullable(), }
  ```
- **learningTrailSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { title: createStringSchema("Título da trilha", 3, 100), description: z.string().max(1000, "Descrição muito longa").optional().nullable(), icon: z.string().max(10, "Ícone inválido").optional().nullable(), estimated_hours: z .number() .min(0.5, "Mínimo 0.5 horas") .max(1000, "Máximo 1000 horas") .optional() .nullable(), xp_reward: z .number() .min(0, "XP não pode ser negativo") .max(100000, "XP máximo é 100.000") .optional() .nullable(), coin_reward: z .number() .min(0, "Moedas não podem ser negativas") .max(100000, "Moedas máximas são 100.000") .optional() .nullable(), status: z.enum(["draft", "published", "archived"]).default("draft"), }
  ```
- **trailModuleSchema** (`src/lib/validations.ts`, z.object):
  ```ts
  { title: createStringSchema("Título do módulo", 2, 100), description: z.string().max(1000, "Descrição muito longa").optional().nullable(), content_type: z.enum([ "video", "text", "quiz", "flashcard", "infographic", "simulation", "checklist", ]), video_url: z.string().url("URL do vídeo inválida").max(500).optional().nullable(), duration_minutes: z .number() .min(1, "Mínimo 1 minuto") .max(600, "Máximo 600 minutos") .optional() .nullable(), xp_reward: z .number() .min(0, "XP não pode ser negativo") .max(10000, "XP máximo é 10.000") .optional() .nullable(), }
  ```
- **commentSchema** (`src/lib/validations.ts`, z.string, encadeia transform):
  ```ts
  { error: (issue) => issue.input === undefined ? "Comentário é obrigatório" : undefined}
  ```
- **searchQuerySchema** (`src/lib/validations.ts`, z.string, encadeia transform):
  ```ts
  
  ```
- **forgotPasswordSchema** (`src/pages/ForgotPassword.tsx`, z.object):
  ```ts
  { email: z.string().trim().email("Email inválido").max(255, "Email muito longo"), }
  ```
- **resetPasswordSchema** (`src/pages/ResetPassword.tsx`, z.object, encadeia refine):
  ```ts
  { password: z .string() .min(8, "Mínimo 8 caracteres") .max(72, "Máximo 72 caracteres") .regex(/[A-Z]/, "Pelo menos 1 letra maiúscula") .regex(/[a-z]/, "Pelo menos 1 letra minúscula") .regex(/[0-9]/, "Pelo menos 1 número") .regex(/[^A-Za-z0-9]/, "Pelo menos 1 caractere especial"), confirmPassword: z.string(), }
  ```
  - Regras cruzadas (refine): “Senhas não conferem”
- **ValidationErrorFieldSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { field: z.string(), message: z.string(), code: z.string(), }
  ```
- **ValidationErrorSchema** (`supabase/functions/_shared/validation.ts`, z.object):
  ```ts
  { error: z.string(), code: z.enum(VALIDATION_ERROR_CODES), message: z.string(), fields: z.array(ValidationErrorFieldSchema), requestId: z.string().optional(), }
  ```
- **Schema** (`supabase/functions/_shared/validation_test.ts`, z.object):
  ```ts
  { id: z.string().uuid(), qty: z.number().int().positive() }
  ```
- **Q** (`supabase/functions/_shared/validation_test.ts`, z.object):
  ```ts
  { action: z.enum(["ping", "credentials"]).default("ping") }
  ```
- **AdminAlertSchema** (`supabase/functions/_shared/contracts/admin-alerts.ts`, z.object):
  ```ts
  { type: z.string(), severity: z.enum(["low", "medium", "high", "critical"]), title: z.string(), message: z.string(), affectedUsers: z.number().int().nonnegative().optional(), data: z.record(z.unknown()).optional(), }
  ```
- **AdminAlertsResponseSchema** (`supabase/functions/_shared/contracts/admin-alerts.ts`, z.object):
  ```ts
  { alerts: z.array(AdminAlertSchema) }
  ```
- **ChatMessageSchema** (`supabase/functions/_shared/contracts/ai-coach.ts`, z.object):
  ```ts
  { role: z.enum(["user", "assistant", "system"]), // O histórico vem de `ai_coach_messages.content` (TEXT, sem limite): uma resposta longa do // modelo passaria do limite e derrubaria o chat inteiro com 422 na mensagem seguinte. content: z.string().max(32000), }
  ```
- **CompetencySchema** (`supabase/functions/_shared/contracts/ai-coach.ts`, z.object):
  ```ts
  { area: z.string(), value: z.number(), maxValue: z.number().positive(), icon: z.string().optional(), }
  ```
- **AvailableTrailSchema** (`supabase/functions/_shared/contracts/ai-coach.ts`, z.object):
  ```ts
  { id: z.string(), title: z.string(), description: z.string().nullable().optional(), icon: z.string().nullable().optional(), estimated_hours: z.number().nullable().optional(), xp_reward: z.number().nullable().optional(), enrolled: z.boolean().optional(), completed: z.boolean().optional(), progress: z.number().optional(), }
  ```
- **UserContextSchema** (`supabase/functions/_shared/contracts/ai-coach.ts`, z.object):
  ```ts
  { displayName: z.string().nullable().optional(), level: z.number().nullable().optional(), xp: z.number().nullable().optional(), coins: z.number().nullable().optional(), questsCompleted: z.number().nullable().optional(), streak: z.number().nullable().optional(), department: z.string().nullable().optional(), competencies: z.array(CompetencySchema).optional(), availableTrails: z.array(AvailableTrailSchema).optional(), completedTrailsCount: z.number().optional(), }
  ```
- **AiCoachRequestSchema** (`supabase/functions/_shared/contracts/ai-coach.ts`, z.object):
  ```ts
  { messages: z.array(ChatMessageSchema).min(1).max(200), userContext: UserContextSchema.optional(), generateSuggestions: z.boolean().optional(), }
  ```
- **AiCoachSuggestionsResponseSchema** (`supabase/functions/_shared/contracts/ai-coach.ts`, z.object):
  ```ts
  { suggestions: z.array(texto(80, 0)) }
  ```
- **AiCourseBuilderRequestSchema** (`supabase/functions/_shared/contracts/ai-course-builder.ts`, z.object):
  ```ts
  { job_id: uuid, }
  ```
- **AiCourseBuilderResponseSchema** (`supabase/functions/_shared/contracts/ai-course-builder.ts`, z.object):
  ```ts
  { success: z.literal(true), trail_id: z.string(), modules: z.number().int().nonnegative(), questions: z.number().int().nonnegative(), }
  ```
- **BurnRateMonitorResponseSchema** (`supabase/functions/_shared/contracts/burn-rate-monitor.ts`, z.object):
  ```ts
  { ok: z.literal(true), triggered: z.array( z.object({ alertType: z.string(), severity: z.enum(["high", "critical"]), id: z.string().nullable(), }) ), evaluated_at: z.string(), slo: z.number(), }
  ```
- **ChurnPredictionSchema** (`supabase/functions/_shared/contracts/churn-prediction.ts`, z.object):
  ```ts
  { userId: z.string(), displayName: z.string(), riskLevel: z.enum(["high", "medium"]), riskScore: z.number().min(0).max(100), riskIndicators: z.array(z.string()), interventionSuggestions: z.array(z.string()), metrics: z.object({ daysInactive: z.number().optional(), streak: z.number().optional(), punctualityRate: z.number().optional(), recentXpGain: z.number().optional(), }).partial().optional(), }
  ```
- **ChurnPredictionResponseSchema** (`supabase/functions/_shared/contracts/churn-prediction.ts`, z.object):
  ```ts
  { predictions: z.array(ChurnPredictionSchema), summary: z.object({ totalAnalyzed: z.number().optional(), highRiskCount: z.number().optional(), mediumRiskCount: z.number().optional(), overallHealthScore: z.number().optional(), }).partial(), }
  ```
- **uuid** (`supabase/functions/_shared/contracts/common.ts`, z.string):
  ```ts
  
  ```
- **EmptyBodySchema** (`supabase/functions/_shared/contracts/common.ts`, z.object, encadeia nullable, optional):
  ```ts
  {}
  ```
- **CompetencyAlertsRequestSchema** (`supabase/functions/_shared/contracts/competency-alerts.ts`, z.object):
  ```ts
  { userId: uuid.optional(), checkAllUsers: z.boolean().optional(), }
  ```
- **CompetencyAlertsResponseSchema** (`supabase/functions/_shared/contracts/competency-alerts.ts`, z.object):
  ```ts
  { success: z.literal(true), analyzed: z.number().int().nonnegative(), results: z.array(z.object({ userId: z.string(), gaps: z.array(z.string()), notificationsCreated: z.number().int().nonnegative(), })), }
  ```
- **DetectNewDeviceRequestSchema** (`supabase/functions/_shared/contracts/detect-new-device.ts`, z.object):
  ```ts
  { userId: uuid.optional(), fingerprint: texto(256), userAgent: z.string().max(1024), browser: z.string().max(128).optional(), os: z.string().max(128).optional(), deviceType: z.enum(["desktop", "mobile", "tablet"]).optional(), }
  ```
- **DetectNewDeviceResponseSchema** (`supabase/functions/_shared/contracts/detect-new-device.ts`, z.object):
  ```ts
  { is_new_device: z.boolean(), device_id: z.string().nullable().optional(), is_trusted: z.boolean(), }
  ```
- **AlertPayloadSchema** (`supabase/functions/_shared/contracts/dispatch-critical-alert.ts`, z.object):
  ```ts
  { alert_id: z.string().optional(), alert_type: z.string().trim().min(1).max(120), severity: z.string().trim().min(1).max(20), title: z.string().trim().min(1).max(300).optional(), description: z.string().nullable().optional(), /** burn-rate-monitor envia `message` em vez de `title` (dispatch usa como fallback). */ message: z.string().nullable().optional(), metadata: jsonRecord.nullable().optional(), }
  ```
- **DispatchCriticalAlertResponseSchema** (`supabase/functions/_shared/contracts/dispatch-critical-alert.ts`, z.discriminatedUnion):
  ```ts
  "skipped", [ z.object({ success: z.literal(true), skipped: z.literal(false), severity: z.string(), results: z.record(z.unknown()), }), z.object({ success: z.literal(true), skipped: z.literal(true), reason: z.string(), }), ]
  ```
- **ErrorBudgetMonitorResponseSchema** (`supabase/functions/_shared/contracts/error-budget-monitor.ts`, z.object):
  ```ts
  { ok: z.literal(true), evaluated: z.array( z.object({ target: z.string(), burn_pct: z.number(), bucket: z.enum(["critical", "high"]).nullable(), }) ), created: z.number().int().nonnegative(), dispatched: z.number().int().nonnegative(), skipped: z.number().int().nonnegative(), generated_at: z.string(), }
  ```
- **GenerateQuizQuestionsRequestSchema** (`supabase/functions/_shared/contracts/generate-quiz-questions.ts`, z.object):
  ```ts
  { trailId: uuid, quizType: z.enum(["magic_cards", "millionaire"]).default("magic_cards"), questionCount: z.number().int().min(1).max(20).default(5), }
  ```
- **GeneratedQuestionSchema** (`supabase/functions/_shared/contracts/generate-quiz-questions.ts`, z.object):
  ```ts
  { question: z.string(), difficulty: z.enum(["easy", "medium", "hard"]), category: z.string().optional(), explanation: z.string().optional(), options: z.array(z.object({ text: z.string(), is_correct: z.boolean() })).min(2), }
  ```
- **GenerateQuizQuestionsResponseSchema** (`supabase/functions/_shared/contracts/generate-quiz-questions.ts`, z.object):
  ```ts
  { trail: z.object({ id: z.string(), title: z.string() }), quizType: z.string(), questions: z.array(GeneratedQuestionSchema), }
  ```
- **MigrateHelperQuerySchema** (`supabase/functions/_shared/contracts/migrate-helper.ts`, z.object):
  ```ts
  { // `?action=` (vazio) vinha caindo em "ping" no código antigo (`|| "ping"`); sem o preprocess // viraria 422 e a URL usada no runbook de migração deixaria de funcionar. action: z.preprocess( (v) => (v === "" || v === undefined || v === null ? "ping" : v), z.enum(["ping", "credentials"]), ), }
  ```
- **PasskeyAuthRequestSchema** (`supabase/functions/_shared/contracts/passkey-auth.ts`, z.object):
  ```ts
  { action: z.enum(["options", "verify"]), email: z.string().trim().email().max(255).optional(), credentialId: z.string().trim().max(2048).optional(), authenticatorData: z.string().trim().max(8192).optional(), clientDataJSON: z.string().trim().max(8192).optional(), signature: z.string().trim().max(8192).optional(), }
  ```
- **PasskeyOptionsResponseSchema** (`supabase/functions/_shared/contracts/passkey-auth.ts`, z.object):
  ```ts
  { ok: z.literal(true), challenge: z.string().min(1), rpId: z.string().min(1), allowCredentials: z.array(z.object({ id: z.string(), type: z.literal("public-key") })), timeout: z.number().int().positive(), userVerification: z.literal("required"), }
  ```
- **PasskeyVerifyResponseSchema** (`supabase/functions/_shared/contracts/passkey-auth.ts`, z.object):
  ```ts
  { ok: z.literal(true), tokenHash: z.string().min(1), email: z.string().email(), userId: uuid, }
  ```
- **PasskeyAuthResponseSchema** (`supabase/functions/_shared/contracts/passkey-auth.ts`, z.union):
  ```ts
  [ PasskeyOptionsResponseSchema, PasskeyVerifyResponseSchema, ]
  ```
- **PushDeviceRevokedRequestSchema** (`supabase/functions/_shared/contracts/push-device-revoked.ts`, z.object):
  ```ts
  { exclude_subscription_id: uuid, title: texto(120), message: texto(400), url: destinoUrl().optional(), data: jsonRecord.optional(), }
  ```
- **PushDeviceRevokedResponseSchema** (`supabase/functions/_shared/contracts/push-device-revoked.ts`, z.object):
  ```ts
  { sent: z.number().int().nonnegative(), targets: z.number().int().nonnegative(), invalidated: z.number().int().nonnegative().optional(), }
  ```
- **PushOutboxDispatcherResponseSchema** (`supabase/functions/_shared/contracts/push-outbox-dispatcher.ts`, z.object):
  ```ts
  { processed: z.number().int().nonnegative(), sent: z.number().int().nonnegative().optional(), failed: z.number().int().nonnegative().optional(), skipped: z.number().int().nonnegative().optional(), }
  ```
- **PushPublicKeyResponseSchema** (`supabase/functions/_shared/contracts/push-public-key.ts`, z.object):
  ```ts
  { publicKey: z.string().nullable() }
  ```
- **RewardApprovalReviewRequestSchema** (`supabase/functions/_shared/contracts/reward-approval-review.ts`, z.object):
  ```ts
  { purchase_id: uuid, }
  ```
- **RewardApprovalReviewResponseSchema** (`supabase/functions/_shared/contracts/reward-approval-review.ts`, z.object):
  ```ts
  { score: z.number().min(0).max(100), level: z.string(), factors: z.array(z.unknown()), summary: z.string(), recommendation: z.enum(["approve", "review", "reject"]), requires_dual_approval: z.boolean(), ai_available: z.boolean(), }
  ```
- **SecurityWeeklyDigestResponseSchema** (`supabase/functions/_shared/contracts/security-weekly-digest.ts`, z.object):
  ```ts
  { ok: z.literal(true), week: z.string(), total: z.number().int().nonnegative(), resolved: z.number().int().nonnegative(), pending: z.number().int().nonnegative(), critical: z.number().int().nonnegative(), high: z.number().int().nonnegative(), sla_pct: z.number().nonnegative(), avg_mttr_min: z.number().nullable(), top: z.array(z.object({ type: z.string(), count: z.number().int().nonnegative() })), slack_status: z.number().int().nullable(), notified_admins: z.number().int().nonnegative(), }
  ```
- **SendCampaignPushRequestSchema** (`supabase/functions/_shared/contracts/send-campaign-push.ts`, z.object):
  ```ts
  { user_ids: z.array(uuid).min(1).max(500), type: texto(64), title: texto(120), message: texto(400), // Caminho relativo é o caso real (salesCampaignsService.ts envia "/campanhas/<id>"): // com z.string().url() a função devolvia 422 e o push de campanha era descartado em silêncio. url: destinoUrl().optional(), data: jsonRecord.optional(), }
  ```
- **SendCampaignPushResponseSchema** (`supabase/functions/_shared/contracts/send-campaign-push.ts`, z.union):
  ```ts
  [ z.object({ sent: z.number().int().nonnegative(), invalidated: z.number().int().nonnegative(), failed: z.number().int().nonnegative(), }), z.object({ sent: z.literal(0), skipped: z.number().int().nonnegative(), reason: z.literal("prefs"), }), ]
  ```
- **TrailRecommendationsRequestSchema** (`supabase/functions/_shared/contracts/trail-recommendations.ts`, z.object):
  ```ts
  { userId: uuid.optional(), }
  ```
- **TrailRecommendationSchema** (`supabase/functions/_shared/contracts/trail-recommendations.ts`, z.object):
  ```ts
  { trailId: z.string(), title: z.string(), reason: z.string(), priority: z.enum(["alta", "média", "baixa"]), skillGap: z.string().optional(), }
  ```
- **TrailRecommendationsResponseSchema** (`supabase/functions/_shared/contracts/trail-recommendations.ts`, z.object):
  ```ts
  { recommendations: z.array(TrailRecommendationSchema), analysis: z.object({ strengths: z.array(z.string()), gaps: z.array(z.string()), nextSteps: z.string(), }).partial().optional(), }
  ```
- **VerifyIpResponseSchema** (`supabase/functions/_shared/contracts/verify-ip.ts`, z.object):
  ```ts
  { allowed: z.boolean(), ip: z.string(), reason: z.enum([ "whitelist_empty", "whitelisted", "not_whitelisted", "untrusted_source_ip", "whitelist_check_error", "check_error", "error", ]), message: z.string(), }
  ```
- **WebhookDispatchV1Schema** (`supabase/functions/_shared/contracts/webhook-dispatcher.ts`, z.object):
  ```ts
  { version: z.literal("v1").optional(), subscription_id: uuid, event_type: WebhookEventTypeSchema, payload: jsonRecord, }
  ```
- **WebhookDispatchV2Schema** (`supabase/functions/_shared/contracts/webhook-dispatcher.ts`, z.object):
  ```ts
  { version: z.literal("v2"), subscription_id: uuid, event: z.object({ type: WebhookEventTypeSchema, id: z.string().min(1).max(128).optional(), occurred_at: z.string().datetime({ offset: true }).optional(), }).strict(), payload: jsonRecord, metadata: jsonRecord.optional(), }
  ```
- **WebhookDispatchRequestSchema** (`supabase/functions/_shared/contracts/webhook-dispatcher.ts`, z.union):
  ```ts
  [WebhookDispatchV2Schema, WebhookDispatchV1Schema]
  ```
- **WebhookDeliveryEnvelopeSchema** (`supabase/functions/_shared/contracts/webhook-dispatcher.ts`, z.object):
  ```ts
  { event: z.string(), timestamp: z.string().datetime(), data: jsonRecord, /** Presentes só quando a origem usou v2 e informou o evento/metadados. */ id: z.string().optional(), occurred_at: z.string().optional(), metadata: jsonRecord.optional(), }
  ```
- **WebhookDispatcherResponseSchema** (`supabase/functions/_shared/contracts/webhook-dispatcher.ts`, z.object):
  ```ts
  { success: z.boolean(), attempts: z.number().int().nonnegative(), duration_ms: z.number().nonnegative(), status: z.number().int().nullable(), error: z.string().nullable(), }
  ```
- **WebhookHealthMonitorResponseSchema** (`supabase/functions/_shared/contracts/webhook-health-monitor.ts`, z.object):
  ```ts
  { checked: z.number().int().nonnegative(), degraded: z.number().int().nonnegative(), threshold_pct: z.number(), min_sample: z.number(), degraded_subscriptions: z.array( z.object({ id: z.string(), name: z.string(), success_rate_pct: z.number().nullable(), total: z.number().int().nonnegative(), failed: z.number().int().nonnegative(), }) ), requestId: z.string(), }
  ```

### F.2 react-hook-form (register/rules)

_nenhum item encontrado_

### F.3 Restrições em inputs HTML (required/min/max/pattern)

| Campo | Restrições | Arquivo |
|---|---|---|
| `device-nickname` | max, disabled=!device \|\| isSaving | `src/components/PushNotificationToggle.tsx` |
| `expires_at` | type=date | `src/components/admin/AnnouncementPublisher.tsx` |
| `date` | type=date | `src/components/admin/CelebrationManager.tsx` |
| `xp` | type=number, min=0 | `src/components/admin/CelebrationManager.tsx` |
| `coins` | type=number, min=0 | `src/components/admin/CelebrationManager.tsx` |
| `api-key-name` | max | `src/components/admin/CreateApiKeyDialog.tsx` |
| `api-key-description` | max | `src/components/admin/CreateApiKeyDialog.tsx` |
| `api-key-rate` | type=number, min=1, max=10000 | `src/components/admin/CreateApiKeyDialog.tsx` |
| `starts_at` | type=date | `src/components/admin/FeedbackCycleManager.tsx` |
| `ends_at` | type=date | `src/components/admin/FeedbackCycleManager.tsx` |
| `xp_reward` | type=number, min=0 | `src/components/admin/GoalsManager.tsx` |
| `coin_reward` | type=number, min=0 | `src/components/admin/GoalsManager.tsx` |
| `expires` | type=datetime-local | `src/components/admin/IpWhitelistManager.tsx` |
| `tier` | type=number, min=1 | `src/components/admin/LeaguesManager.tsx` |
| `min_xp` | min, type=number, min=0, min | `src/components/admin/LeaguesManager.tsx` |
| `xp_bonus` | type=number, min=0 | `src/components/admin/LeaguesManager.tsx` |
| `promotion` | type=number, min=0 | `src/components/admin/LeaguesManager.tsx` |
| `demotion` | type=number, min=0 | `src/components/admin/LeaguesManager.tsx` |
| `starts_at` | type=date | `src/components/admin/SurveyCreator.tsx` |
| `ends_at` | type=date | `src/components/admin/SurveyCreator.tsx` |
| `auction-starting-bid` | type=number, min=1, step=1 | `src/components/auction/AuctionAdminForm.tsx` |
| `auction-min-increment` | min, type=number, min=1, step=1, min | `src/components/auction/AuctionAdminForm.tsx` |
| `auction-starts-at` | type=datetime-local | `src/components/auction/AuctionAdminForm.tsx` |
| `auction-ends-at` | type=datetime-local | `src/components/auction/AuctionAdminForm.tsx` |
| `bid-amount` | type=number, min=minNextBid | `src/components/auction/BidDialog.tsx` |
| `passkey-email` | type=email | `src/components/auth/PasskeyLogin.tsx` |
| `stuck-hours` | type=number, min=MIN_HOURS, max=MAX_HOURS | `src/components/board/BoardStuckPlayersPanel.tsx` |
| `boss-title` | max | `src/components/boss/BossBattleAdminDialog.tsx` |
| `boss-people` | type=number, min=1 | `src/components/boss/BossBattleAdminDialog.tsx` |
| `boss-start` | type=datetime-local | `src/components/boss/BossBattleAdminDialog.tsx` |
| `boss-end` | type=datetime-local | `src/components/boss/BossBattleAdminDialog.tsx` |
| `boss-hp` | type=number, min=1 | `src/components/boss/BossBattleAdminDialog.tsx` |
| `boss-cap` | type=number, min=0 | `src/components/boss/BossBattleAdminDialog.tsx` |
| `boss-coins` | type=number, min=0 | `src/components/boss/BossBattleAdminDialog.tsx` |
| `boss-xp` | type=number, min=0 | `src/components/boss/BossBattleAdminDialog.tsx` |
| `boss-coins-cap` | type=number, min=0 | `src/components/boss/BossBattleAdminDialog.tsx` |
| `campaign-import-file` | accept=.csv,.xlsx,.xls,text/csv, disabled=stage ===  | `src/components/campaigns/CampaignImportDialog.tsx` |
| `team-target` | type=number, min=0 | `src/components/campaigns/CampaignTeamsPanel.tsx` |
| `climate-start` | type=date | `src/components/climate/ClimateSurveyForm.tsx` |
| `climate-end` | type=date | `src/components/climate/ClimateSurveyForm.tsx` |
| `opinion-subject` | max | `src/components/engagement/opinions/OpinionComposer.tsx` |
| `opinion-content` | max | `src/components/engagement/opinions/OpinionComposer.tsx` |
| `opinion-response` | max | `src/components/engagement/opinions/OpinionTreatmentDialog.tsx` |
| `due-date` | type=date | `src/components/feedback/FeedbackRequestForm.tsx` |
| `coins-per-spin-budget` | disabled=budgetSyncing | `src/components/luckywheel/LuckyWheelWindowComparison.tsx` |
| `prediction-title` | max | `src/components/prediction/CreateMarketDialog.tsx` |
| `prediction-description` | max | `src/components/prediction/CreateMarketDialog.tsx` |
| `prediction-min` | min, type=number, min=1, min | `src/components/prediction/CreateMarketDialog.tsx` |
| `prediction-max` | max, type=number, min=0, max | `src/components/prediction/CreateMarketDialog.tsx` |
| `prediction-rake` | type=number, min=0, max=20, step=0.5 | `src/components/prediction/CreateMarketDialog.tsx` |
| `prediction-locks` | type=datetime-local | `src/components/prediction/CreateMarketDialog.tsx` |
| `goal-bet-min` | min, min | `src/components/prediction/GoalBetDialog.tsx` |
| `goal-bet-max` | max, max | `src/components/prediction/GoalBetDialog.tsx` |
| `goal-bet-locks` | type=datetime-local | `src/components/prediction/GoalBetDialog.tsx` |
| `xp` | type=number, min=0 | `src/components/quest-builder/QuestFormSections.tsx` |
| `coins` | type=number, min=0 | `src/components/quest-builder/QuestFormSections.tsx` |
| `sla-notes` | max | `src/components/security/SlaTargetEditor.tsx` |
| `discount-percent` | type=number, min=1, max=100 | `src/components/shop-admin/PromotionFormDialog.tsx` |
| `discount-coins` | type=number, min=1 | `src/components/shop-admin/PromotionFormDialog.tsx` |
| `starts-at` | type=datetime-local | `src/components/shop-admin/PromotionFormDialog.tsx` |
| `ends-at` | type=datetime-local | `src/components/shop-admin/PromotionFormDialog.tsx` |
| `max-claims` | max, type=number, min=1, max | `src/components/shop-admin/PromotionFormDialog.tsx` |
| `price` | type=number, min=1 | `src/components/shop-admin/RewardFormDialog.tsx` |
| `stock` | type=number, min=0 | `src/components/shop-admin/RewardFormDialog.tsx` |
| `image` | type=url | `src/components/shop-admin/RewardFormDialog.tsx` |
| `file` | accept=ACCEPT | `src/components/trails/AICourseBuilderDialog.tsx` |
| `module-title` | max | `src/components/trails/ModuleDraftForm.tsx` |
| `module-description` | max | `src/components/trails/ModuleDraftForm.tsx` |
| `module-xp` | type=number, min=0, max=10000 | `src/components/trails/ModuleDraftForm.tsx` |
| `module-duration` | type=number, min=0, max=1440 | `src/components/trails/ModuleDraftForm.tsx` |
| `wager-monthly-budget` | type=number, min=0, step=100 | `src/components/wager/WagerMonthlyExposureCard.tsx` |
| `war-title` | max | `src/components/war/DepartmentWarConfigDialog.tsx` |
| `war-description` | max | `src/components/war/DepartmentWarConfigDialog.tsx` |
| `war-start` | type=datetime-local | `src/components/war/DepartmentWarConfigDialog.tsx` |
| `war-end` | type=datetime-local | `src/components/war/DepartmentWarConfigDialog.tsx` |
| `war-cap` | type=number, min=0 | `src/components/war/DepartmentWarConfigDialog.tsx` |
| `war-coins` | type=number, min=0 | `src/components/war/DepartmentWarConfigDialog.tsx` |
| `war-xp` | type=number, min=0 | `src/components/war/DepartmentWarConfigDialog.tsx` |
| `war-member-cap` | type=number, min=0 | `src/components/war/DepartmentWarConfigDialog.tsx` |
| `grace` | type=number, min=1, max=168 | `src/components/webhooks/BulkRotateDialog.tsx` |
| `grace` | type=number, min=1, max=168 | `src/components/webhooks/EditWebhookDialog.tsx` |
| `trail-moves` | type=number, min=1, max=BOARD_MAX_MOVES_PER_DAY, max | `src/pages/BoardTrailAdminPage.tsx` |
| `rel-pct` | type=number, min=1, max=500, step=5 | `src/pages/ExecutiveMonthlyReport.tsx` |
| `pp-abs` | type=number, min=1, max=100, step=1 | `src/pages/ExecutiveMonthlyReport.tsx` |
| `active-users` | type=number, min=0 | `src/pages/LuckyWheelAdmin.tsx` |
| `participation` | type=number, min=0, max=100 | `src/pages/LuckyWheelAdmin.tsx` |
| `mission-xp` | type=number, min=0 | `src/pages/Mentoria.tsx` |
| `mission-coins` | type=number, min=0 | `src/pages/Mentoria.tsx` |
| `checkin-date` | type=date | `src/pages/Pdi.tsx` |
| `wager-question` | disabled=isLocked | `src/pages/WagerQuestionAdminPage.tsx` |
| `wager-date` | type=date, disabled=isLocked | `src/pages/WagerQuestionAdminPage.tsx` |
| `wager-multiplier` | type=number, step=0.1, min=1.1, max=5, disabled=isLocked | `src/pages/WagerQuestionAdminPage.tsx` |
| `wager-max-stake` | max, type=number, step=10, min=10, max=1000, max, disabled=isLocked | `src/pages/WagerQuestionAdminPage.tsx` |
| `wager-players` | type=number, min=0 | `src/pages/WagerQuestionAdminPage.tsx` |
| `timeout` | type=number, min=5, max=120 | `src/pages/WebhookSubscriptionNew.tsx` |
| `retry` | type=number, min=0, max=10 | `src/pages/WebhookSubscriptionNew.tsx` |
| `email` | type=email, required | `src/stories/accessibility/Patterns.stories.tsx` |
| `error-email` | type=email | `src/stories/accessibility/Patterns.stories.tsx` |
| `disabled` | disabled, disabled | `src/stories/forms/Inputs.stories.tsx` |
| `email` | type=email | `src/stories/forms/Inputs.stories.tsx` |
| `password` | type=password | `src/stories/forms/Inputs.stories.tsx` |
| `email2` | type=email | `src/stories/forms/Inputs.stories.tsx` |
| `deadline` | type=number | `src/stories/overlays/Modals.stories.tsx` |
| `xpReward` | type=number | `src/stories/overlays/Modals.stories.tsx` |
| `coinReward` | type=number | `src/stories/overlays/Modals.stories.tsx` |

## G. Fórmulas e derivações (como valores são calculados)

### G.1 Colunas calculadas no banco

| Tabela | Coluna | Expressão |
|---|---|---|
| `enps_responses` | `category` | `CASE WHEN score >= 9 THEN 'promoter' WHEN score >= 7 THEN 'passive' ELSE 'detractor' END` |

### G.2 Views (consultas derivadas)

| View | SELECT |
|---|---|
| `profiles_public` | `SELECT id, display_name, avatar_url, level, xp, coins, streak, best_streak, quests_completed, status, created_at, updated_at, last_access_at FROM public.profiles` |
| `webhook_delivery_stats_24h` | `SELECT wdl.subscription_id, ws.name AS subscription_name, ws.url AS subscription_url, COUNT(*)::bigint AS total_deliveries, COUNT(*) FILTER (WHERE wdl.success)::bigint AS successful_deliveries, COUNT(*) FILTER (WHERE NOT wdl.success)::bigint AS failed_deliveries, ROUND( (COUNT(*) FILTER (WHERE wdl.s …` |

### G.3 Funções de cálculo/decisão no código

- **RankingCard({ user, rank, maxScore }: { user: RankingUser; rank: number; maxScore: number; })** — `src/components/DepartmentRankings.tsx`
  ```
  const scorePercent = (user.score / maxScore) * 100; const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2); return ( <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: rank * 0.1 }} whileHover={{ scale: 1.01 }} > <Card className={`overflow-hidden transition-all duration-300 ${getRankStyles(rank)}`}> <CardContent className="p-4"> <div className="flex items-center gap-4"> {/* Rank */} <div className="w-10 h-10 rounded-full bg-backgro …
  ```
- **calculateTimeLeft(endDate: string)** — `src/components/FlashSalesBanner.tsx`
  ```
  const difference = new Date(endDate).getTime() - new Date().getTime(); if (difference <= 0) { return { days: 0, hours: 0, minutes: 0, seconds: 0 }; } return { days: Math.floor(difference / (1000 * 60 * 60 * 24)), hours: Math.floor((difference / (1000 * 60 * 60)) % 24), minutes: Math.floor((difference / 1000 / 60) % 60), seconds: Math.floor((difference / 1000) % 60), };
  ```
- **rankConfi(g)** — `src/components/RankingBadge.tsx`
  ```
  icon: React.ElementType; label: string; description: string; gradient: string; iconColor: string; glowColor: string; borderColor: string;
  ```
- **RankingBadge({ rank, size = "md", showLabel = false, animate = true, className, }: RankingBadgeProps)** — `src/components/RankingBadge.tsx`
  ```
  const sizes = sizeClasses[size]; const tier = getRankTier(rank); // Fallback visual para rank null mantendo o layout e animação consistentes if (rank === null) { const fallbackConfig = { icon: Star, label: "Iniciante", gradient: "from-slate-700/50 via-slate-800/50 to-slate-900/50", iconColor: "text-slate-500", glowColor: "shadow-slate-900/10", }; const Icon = fallbackConfig.icon; return ( <motion.div initial={animate ? { opacity: 0, scale: 0.9 } : false} animate={{ opacity: 1, scale: 1 }} classN …
  ```
- **RankingBadgeInline({ rank, className, }: { rank: number | null; className?: string; })** — `src/components/RankingBadge.tsx`
  ```
  const tier = getRankTier(rank); if (rank === null) { return <Skeleton variant="shimmer" shape="pill" className={cn("h-6 w-16", className)} />; } if (!tier || rank <= 0) { return ( <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground", className)}> <Star className="w-3 h-3" /> <span>#{rank || "-"}</span> </div> ); } const config = rankConfig[tier]; const Icon = config.icon; return ( <div className={cn( "inline-flex items-ce …
  ```
- **checkIsLocked(trailId: string)** — `src/components/TrailDependencyTree.tsx`
  ```
  const prereqs = prereqMap.get(trailId) || []; if (prereqs.length === 0) return false; return prereqs.some(pid => !completedTrailIds.has(pid));
  ```
- **calculateChange(current: number, previous: number)** — `src/components/WeeklyPerformanceComparison.tsx`
  ```
  value: number; trend: 'up' | 'down' | 'same'
  ```
- **calculateTrend()** — `src/components/admin/ENPSTrendChart.tsx`
  ```
  if (chartData.length < 2) return { trend: "same", value: 0 }; const latest = chartData[chartData.length - 1]?.enps || 0; const previous = chartData[chartData.length - 2]?.enps || 0; const diff = latest - previous; return { trend: diff > 0 ? "up" : diff < 0 ? "down" : "same", value: Math.abs(diff), };
  ```
- **FeedbackCycleManager()** — `src/components/admin/FeedbackCycleManager.tsx`
  ```
  const { allCycles: cycles, isLoading, createCycle, updateCycle, deleteCycle, startCycle } = useFeedback360(); const [isDialogOpen, setIsDialogOpen] = useState(false); const [editingId, setEditingId] = useState<string | null>(null); const [formData, setFormData] = useState(emptyCycleForm); const closeDialog = () => { setIsDialogOpen(false); setEditingId(null); setFormData(emptyCycleForm); }; const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const payload = { name: formData.name, …
  ```
- **applyAutoSuggestions()** — `src/components/campaigns/CampaignReconciliationPanel.tsx`
  ```
  const next = { ...overrides }; report.entries.forEach((entry) => { if (!entry.resolvable || next[entry.key]) return; const best = entry.candidates[0]; // Ambiguidade nunca é resolvida automaticamente: exige decisão humana. if (entry.issue === "not_found" && best && best.score >= AUTO_MIN_SCORE) { next[entry.key] = best.id; } }); setOverrides(next);
  ```
- **ScoreBadge({ score, showLabel = true, className, ...props }: ScoreBadgeProps)** — `src/components/engagement/diagnostics/ScoreBadge.tsx`
  ```
  const zone = scoreZone(score); const value = typeof score === "number" && Number.isFinite(score) ? score.toFixed(1) : "—"; return ( <span className={cn( "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", ZONE_CLASS[zone], className, )} {...props} > {value} {showLabel && <span className="font-normal opacity-80">{ZONE_LABEL[zone]}</span>} </span> );
  ```
- **FeedbackRequestForm({ open, onOpenChange, cycles }: FeedbackRequestFormProps)** — `src/components/feedback/FeedbackRequestForm.tsx`
  ```
  const { user } = useAuth(); const { data: profiles = [], isLoading: isLoadingProfiles } = useProfiles(); const { createRequest } = useFeedback360(); const [cycleId, setCycleId] = useState(""); const [fromUserId, setFromUserId] = useState(user?.id ?? ""); const [toUserId, setToUserId] = useState(""); const [relationship, setRelationship] = useState<FeedbackRequest["relationship"]>("manager"); const [dueDate, setDueDate] = useState(""); const [error, setError] = useState<string | null>(null); cons …
  ```
- **FeedbackSummaryCard()** — `src/components/feedback/FeedbackSummaryCard.tsx`
  ```
  const { user } = useAuth(); const { data, isLoading, isError, refetch } = useFeedbackSummary(user?.id); const hasContent = !!data && (data.totalResponses > 0 || data.commonStrengths.length > 0 || data.commonImprovements.length > 0); return ( <Card> <CardHeader> <CardTitle className="flex items-center gap-2"> <Star className="h-5 w-5 text-primary" /> Meu resumo de feedback </CardTitle> </CardHeader> <CardContent> {isLoading ? ( <LoadingState message="Carregando seu resumo..." /> ) : isError ? ( < …
  ```
- **calculateScore()** — `src/components/lms/ModuleViewer.tsx`
  ```
  const correct = questions.reduce((acc, q, i) => { return acc + (answers[i] === q.correct ? 1 : 0); }, 0); return Math.round((correct / questions.length) * 100);
  ```
- **calculateXpToNext(level: number)** — `src/components/manager/ManagerComponents.tsx`
  ```
  level * 500 + 500;
  ```
- **calculateRiskLevel(streak: number, updatedAt: string)** — `src/components/manager/ManagerComponents.tsx`
  ```
  const daysSinceActive = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)); if (daysSinceActive > 7 || streak === 0) return "high"; if (daysSinceActive > 3 || streak < 3) return "medium"; return "low";
  ```
- **calculateTrend(streak: number, questsCompleted: number)** — `src/components/manager/ManagerComponents.tsx`
  ```
  if (streak >= 5 && questsCompleted > 10) return "up"; if (streak === 0) return "down"; return "same";
  ```
- **FeedFilters({ activityType, setActivityType, period, setPeriod, customDateRange, setCustomDateRange, filteredCount }: FeedFiltersPro)** — `src/components/social/FeedFilters.tsx`
  ```
  return ( <Card> <CardHeader className="pb-3"> <CardTitle className="flex items-center gap-2 text-base"> <Filter className="w-4 h-4" /> Filtros </CardTitle> </CardHeader> <CardContent> <div className="flex flex-wrap gap-3"> <div className="flex-1 min-w-[200px]"> <Select value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}> <SelectTrigger><SelectValue placeholder="Tipo de atividade" /></SelectTrigger> <SelectContent> {Object.entries(activityTypeConfig).map(([key, config]) …
  ```
- **FeedStatsBar({ stats }: FeedStatsBarProps)** — `src/components/social/FeedStatsBar.tsx`
  ```
  return ( <div className="grid grid-cols-2 md:grid-cols-5 gap-3"> {items.map((item, i) => ( <motion.div key={item.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card border border-border rounded-xl p-4 text-center" > <item.icon className={`w-5 h-5 mx-auto mb-2 ${item.color}`} /> <p className="text-2xl font-bold">{stats[item.key]}</p> <p className="text-xs text-muted-foreground">{item.label}</p> </motion.div> ))} </div> );
  ```
- **apply(varName: string, value: string | null)** — `src/components/theme/ThemeInjector.tsx`
  ```
  if (!value) { document.documentElement.style.removeProperty(varName); return; } const hsl = value.startsWith("#") ? hexToHslString(value) : value; if (hsl) document.documentElement.style.setProperty(varName, hsl);
  ```
- **generateSecret()** — `src/components/webhooks/BulkRotateDialog.tsx`
  ```
  const bytes = new Uint8Array(32); crypto.getRandomValues(bytes); return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  ```
- **regenerate(id: string)** — `src/components/webhooks/BulkRotateDialog.tsx`
  ```
  setSecrets((s) => ({ ...s, [id]: generateSecret() }));
  ```
- **generateSecret(bytes = 32)** — `src/components/webhooks/EditWebhookDialog.tsx`
  ```
  const arr = new Uint8Array(bytes); crypto.getRandomValues(arr); return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  ```
- **calculateChange(current: number, previous: number)** — `src/components/weekly/WeeklyMetricCards.tsx`
  ```
  value: number; trend: "up" | "down" | "same"
  ```
- **invalidate()** — `src/hooks/useCampaignImports.ts`
  ```
  qc.invalidateQueries({ queryKey: ["campaign-imports", campaignId] }); qc.invalidateQueries({ queryKey: ["sales-campaign", campaignId] });
  ```
- **invalidate()** — `src/hooks/useCampaignTeams.ts`
  ```
  qc.invalidateQueries({ queryKey: ["campaign-teams", campaignId] }); qc.invalidateQueries({ queryKey: ["sales-campaign", campaignId] }); qc.invalidateQueries({ queryKey: ["campaign-team-split", campaignId] });
  ```
- **storeRank(userId: string, rank: number)** — `src/hooks/useListenToRankChanges.ts`
  ```
  try { localStorage.setItem(`${RANK_STORAGE_KEY}_${userId}`, rank.toString()); } catch { // Ignore storage errors }
  ```
- **invalidate()** — `src/hooks/useSalesCampaigns.ts`
  ```
  qc.invalidateQueries({ queryKey: ["sales-campaign", id] });
  ```
- **validateAuctionDraft(draft: AuctionDraft, now: number)** — `src/lib/auctionAdmin.ts`
  ```
  const issues: DraftIssue[] = []; const title = draft.title.trim(); if (title.length < 3) { issues.push({ field: "title", level: "error", message: "Informe um título com ao menos 3 caracteres." }); } if (title.length > MAX_TITLE_LENGTH) { issues.push({ field: "title", level: "error", message: `Título deve ter no máximo ${MAX_TITLE_LENGTH} caracteres.` }); } if ((draft.description ?? "").length > MAX_DESCRIPTION_LENGTH) { issues.push({ field: "description", level: "error", message: `Descrição deve …
  ```
- **canPerform(action: AdminAction, auction: AuctionStateView, now: number)** — `src/lib/auctionAdmin.ts`
  ```
  const terminal = auction.status === "closed" || auction.status === "cancelled"; if (terminal) return false; switch (action) { case "publish": return auction.status === "draft" && parseTime(auction.endsAt) > now; case "close": return auction.status === "active"; case "cancel": return auction.status === "draft" || auction.status === "active"; default: return false; }
  ```
- **applyBid(auction: EngineAuction, balance: number, amount: number, now: number, userId: string, current?: EngineBid,)** — `src/lib/auctionEngine.ts`
  ```
  if (!Number.isInteger(amount) || amount < 1) { return { accepted: false, reason: "invalid_amount", newBalance: balance }; } if (amount < minNextBid(auction, current)) { return { accepted: false, reason: "below_minimum", newBalance: balance }; } const delta = escrowDelta(amount, current); if (balance < delta) { return { accepted: false, reason: "insufficient_coins", newBalance: balance }; } return { accepted: true, newBalance: balance - delta, bid: { userId, amount, escrow: amount, createdAt: cur …
  ```
- **calculateBingoAward(params: { marked: readonly boolean[]; linesAlreadyAwarded: number; fullHouseAlreadyAwarded: boolean; rules: BingoRewardR)** — `src/lib/bingoEngine.ts`
  ```
  const lines = countCompletedLines(params.marked); const already = safeInt(params.linesAlreadyAwarded, BINGO_TOTAL_LINES); const newLines = Math.max(0, lines - already); const full = isFullHouse(params.marked); const grantsFull = full && !params.fullHouseAlreadyAwarded; return { newLines, fullHouse: full, coins: newLines * safeInt(params.rules.coinsPerLine) + (grantsFull ? safeInt(params.rules.coinsFullHouse) : 0), xp: newLines * safeInt(params.rules.xpPerLine) + (grantsFull ? safeInt(params.rule …
  ```
- **applyMove(board: ReadonlyArray<BoardTile>, state: BoardPlayerState, seed: string | number,)** — `src/lib/boardTrail.ts`
  ```
  const tiles = normalizeBoard(board); const lastPosition = tiles.length ? tiles[tiles.length - 1].position : 0; const current: BoardPlayerState = { position: clamp(toSafeInt(state?.position, 0), 0, lastPosition), coins: Math.max(0, toSafeInt(state?.coins, 0)), xp: Math.max(0, toSafeInt(state?.xp, 0)), checkpoints: Array.isArray(state?.checkpoints) ? [...new Set(state.checkpoints.map((p) => toSafeInt(p, 0)))].sort((a, b) => a - b) : [], finished: Boolean(state?.finished), }; const roll = rollDice( …
  ```
- **validateTrailDraft(trail: TrailDraft, tiles: ReadonlyArray<TileDraft>,)** — `src/lib/boardTrailAuthoring.ts`
  ```
  const issues: BoardIssue[] = []; const title = normalizeText(trail.title); const description = normalizeText(trail.description); if (!title) { issues.push({ scope: "trail", severity: "error", message: "Informe um título para a trilha." }); } else if (title.length > BOARD_TITLE_MAX) { issues.push({ scope: "trail", severity: "error", message: `O título deve ter no máximo ${BOARD_TITLE_MAX} caracteres.`, }); } if (description.length > BOARD_DESCRIPTION_MAX) { issues.push({ scope: "trail", severity: …
  ```
- **applyBossAlert(sentKeys: Set<string>, alert: BossAlert | null,)** — `src/lib/bossAlerts.ts`
  ```
  sent: boolean; duplicate: boolean
  ```
- **isBattleEligible(battle: BossBattleTarget, at: Date)** — `src/lib/bossAutoHooks.ts`
  ```
  if (battle.status !== "running") return false; if (!Number.isFinite(battle.currentHp) || battle.currentHp <= 0) return false; const starts = parseTime(battle.startsAt); const ends = parseTime(battle.endsAt); if (Number.isNaN(starts) || Number.isNaN(ends)) return false; const now = at.getTime(); return now >= starts && now <= ends;
  ```
- **applyBossEvent(existingKeys: Set<string>, event: BossDamageEvent | null,)** — `src/lib/bossAutoHooks.ts`
  ```
  dispatched: boolean; duplicate: boolean
  ```
- **computeRawDamage(rules: BossDamageRules, req: DamageRequest)** — `src/lib/bossBattle.ts`
  ```
  const base = req.source === "manual" ? toInt(req.amount ?? 0) : toInt(rules.base[req.source] ?? 0); if (base <= 0) return 0; const rawMult = Number.isFinite(req.multiplier) ? (req.multiplier as number) : 1; const mult = Math.min(Math.max(rawMult, 1), Math.max(rules.maxMultiplier, 1)); return Math.max(0, Math.floor(base * mult));
  ```
- **applyDamage(state: BossBattleState, rules: BossDamageRules, req: DamageRequest,)** — `src/lib/bossBattle.ts`
  ```
  const hp = Math.max(0, toInt(state.currentHp)); const raw = computeRawDamage(rules, req); if (hp <= 0) return { applied: 0, wasted: raw, hpAfter: 0, defeated: true, reason: "no_hp" }; if (raw <= 0) return { applied: 0, wasted: 0, hpAfter: hp, defeated: false, reason: "zero_damage" }; let allowed = raw; let reason: DamageOutcome["reason"] = "ok"; if (rules.perUserCap > 0) { const remainingForUser = Math.max(0, rules.perUserCap - Math.max(0, toInt(req.userDamageSoFar ?? 0))); if (raw > remainingFo …
  ```
- **validateBossPlan(input: BossPlanInput, pace: BossPaceAssumptions = DEFAULT_PACE,)** — `src/lib/bossBattlePlanner.ts`
  ```
  const issues: PlanIssue[] = []; const push = (field: string, level: PlanLevel, message: string) => issues.push({ field, level, message }); const title = (input.title ?? "").trim(); if (title.length < 3) push("title", "error", "Dê um nome com pelo menos 3 caracteres."); if (title.length > 120) push("title", "error", "O nome deve ter no máximo 120 caracteres."); const totalHp = safeNumber(input.totalHp); if (!Number.isInteger(totalHp) || totalHp <= 0) { push("totalHp", "error", "A vida do chefão p …
  ```
- **suggestTotalHp(input: BossPlanInput, pace: BossPaceAssumptions = DEFAULT_PACE,)** — `src/lib/bossBattlePlanner.ts`
  ```
  const projection = projectCapacity({ ...input, totalHp: 1 }, pace); if (projection.capacity <= 0) return 0; return Math.max(50, Math.round((projection.capacity * 0.7) / 50) * 50);
  ```
- **rankLabel(rank: number)** — `src/lib/bossLeaderboard.ts`
  ```
  if (rank === 1) return "🥇"; if (rank === 2) return "🥈"; if (rank === 3) return "🥉"; return `${rank}º`;
  ```
- **invalid(reason: string, issue: ReconciliationIssue = "invalid_data")** — `src/lib/campaignImport.ts`
  ```
  rowNumber, sellerIdentifier: sellerIdentifier || String(sellerRaw ?? "").slice(0, 180), amount: amount ?? 0, referenceDate, externalReference, dedupeKey: `invalid:${rowNumber}`, status: "invalid", errorReason: reason, issue,
  ```
- **pgRound(value: number)** — `src/lib/campaignTeamSplit.ts`
  ```
  if (!Number.isFinite(value)) return 0; return value >= 0 ? Math.floor(value + 0.5) : -Math.floor(-value + 0.5);
  ```
- **recalcCampaignTeams(state: SimCampaignState)** — `src/lib/campaignTeamSplit.ts`
  ```
  const progressByUser = new Map<string, number>(); state.participants.forEach((p) => progressByUser.set(p.user_id, p.progress)); state.teams.forEach((team) => { const total = team.member_ids.reduce((sum, uid) => sum + (progressByUser.get(uid) ?? 0), 0); team.progress = Math.round(total * 100) / 100; team.members_count = team.member_ids.length; team.progress_percent = team.target_team > 0 ? Math.min(100, Math.round((team.progress / team.target_team) * 100 * 100) / 100) : 0; }); const ranked = [... …
  ```
- **applyGrant(existingKeys: Set<string>, candidate: CardPackGrant | null,)** — `src/lib/cardPackTriggers.ts`
  ```
  granted: boolean; replayed: boolean
  ```
- **generateCertificatePdf(input: CertificatePdfInput)** — `src/lib/certificatePdf.ts`
  ```
  const [{ default: jsPDF }, QRCode] = await Promise.all([ import("jspdf"), import("qrcode"), ]); const verificationUrl = buildVerificationUrl(input.certificateCode, input.verificationBaseUrl); const qrDataUrl = await QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: "M", margin: 1, width: 320, color: { dark: "#0f172a", light: "#ffffff" }, }); const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" }); const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight …
  ```
- **round1(value: number)** — `src/lib/climateBenchmark.ts`
  ```
  const sign = value < 0 ? -1 : 1; return (sign * Math.round(Math.abs(value) * 10)) / 10;
  ```
- **round4(value: number)** — `src/lib/departmentWar.ts`
  ```
  return Math.round(value * 10_000) / 10_000;
  ```
- **computeWarStandings(departments: WarDepartmentInput[], contributions: WarContributionInput[], rawConfig?: Partial<WarScoringConfig> | null,)** — `src/lib/departmentWar.ts`
  ```
  const config = normalizeScoringConfig(rawConfig); const known = new Map<string, WarDepartmentInput>(); for (const dept of departments) { if (!dept || typeof dept.department_id !== "string") continue; known.set(dept.department_id, { department_id: dept.department_id, name: dept.name ?? "", headcount: Math.max(0, Math.floor(Number(dept.headcount) || 0)), }); } // Agrega por departamento -> usuario, para aplicar o teto por colaborador. const perUser = new Map<string, Map<string, number>>(); for (co …
  ```
- **computeDeviceFingerprint(signals: Partial<FingerprintSignals> | null | undefined)** — `src/lib/deviceFingerprint.ts`
  ```
  const parts = [ toToken(signals?.userAgent), toToken(signals?.language), toToken(signals?.colorDepth), toToken(signals?.screenSize), toToken(signals?.timezoneOffset), toToken(signals?.hardwareConcurrency), toToken(signals?.deviceMemory), ]; const raw = parts.join("|"); return `${encodeBase64(raw).slice(0, PREFIX_LENGTH)}${digest(raw)}`;
  ```
- **climateScore(value: unknown)** — `src/lib/engagementInsights.ts`
  ```
  const n = safeNumber(value); if (n === null || n < 0 || n > 10) return null; return n;
  ```
- **npsScore(value: unknown)** — `src/lib/engagementInsights.ts`
  ```
  const n = safeNumber(value); if (n === null || n < -100 || n > 100) return null; return n;
  ```
- **round1(value: number)** — `src/lib/engagementInsights.ts`
  ```
  // Arredondamento simétrico: evita viés em valores negativos. return Math.sign(value) * Math.round(Math.abs(value) * 10) / 10;
  ```
- **generatePDFHTML(report: ReportData)** — `src/lib/exportReports.ts`
  ```
  const sectionsHTML = report.sections.map((section) => { let tableHTML = ""; if (section.columns && section.data.length > 0) { const headerRow = section.columns .map((col) => `<th>${col.label}</th>`) .join(""); const dataRows = section.data .map((row) => { const cells = section.columns! .map((col) => { const value = row[col.key]; return `<td>${formatValue(value, col.format)}</td>`; }) .join(""); return `<tr>${cells}</tr>`; }) .join(""); tableHTML = ` <table> <thead><tr>${headerRow}</tr></thead> < …
  ```
- **computeGoalBetExposure(input: { markets: readonly PredictionMarketRow[] | null | undefined; stakes: readonly PredictionStakeRow[] | null | unde)** — `src/lib/goalBetExposure.ts`
  ```
  const balance = Math.max(0, Number.isFinite(input.balance ?? NaN) ? (input.balance as number) : 0); const extra = Number.isFinite(input.extraStake ?? NaN) ? Math.max(0, input.extraStake as number) : 0; const openIds = new Set( (input.markets ?? []) .filter((m) => m.status !== "settled" && m.status !== "voided") .map((m) => m.id), ); const touched = new Set<string>(); let exposed = extra; for (const stake of input.stakes ?? []) { if (!openIds.has(stake.market_id)) continue; const amount = Number. …
  ```
- **computeGoalBetHistory(markets: readonly PredictionMarketRow[] | null | undefined, stakes: readonly PredictionStakeRow[] | null | undefined,)** — `src/lib/goalBetHistory.ts`
  ```
  if (!markets?.length || !stakes?.length) return EMPTY; const items: GoalBetHistoryItem[] = []; for (const market of markets) { if (market.status !== "settled" && market.status !== "voided") continue; const position = computeGoalBetPosition(market, stakes); if (position.entries.length === 0) continue; const voided = position.voided; const hit = !voided && position.entries.some((e) => e.isWinner && e.staked > 0); items.push({ marketId: market.id, title: market.title, resolvedAt: market.settled_at …
  ```
- **round(value: number)** — `src/lib/goalBetPosition.ts`
  ```
  // Moedas são inteiras no servidor; arredondamos para baixo para nunca // prometer mais do que o rateio pode pagar. return Math.max(0, Math.floor(value));
  ```
- **computeGoalBetPosition(market: PredictionMarketRow | null | undefined, stakes: readonly PredictionStakeRow[] | null | undefined,)** — `src/lib/goalBetPosition.ts`
  ```
  if (!market) return EMPTY; const mine = (stakes ?? []).filter((s) => s.market_id === market.id); if (mine.length === 0) return EMPTY; const voided = market.status === "voided"; const settled = market.status === "settled" || voided; const totalStaked = mine.reduce((acc, s) => acc + Math.max(0, s.amount), 0); const rake = Math.max(0, Math.min(10000, market.rake_bps)) / 10000; const grossPool = Math.max( market.total_pool, market.options.reduce((acc, o) => acc + Math.max(0, o.pool), 0), ); const ne …
  ```
- **rankAchievers(candidates: readonly GoalBetCandidate[])** — `src/lib/goalBetSettlement.ts`
  ```
  return candidates .filter((c) => !c.declined && c.progressPercent >= GOAL_ACHIEVED_PERCENT) .sort((a, b) => { if (b.progressPercent !== a.progressPercent) { return b.progressPercent - a.progressPercent; } if (b.progress !== a.progress) return b.progress - a.progress; return displayName(a).localeCompare(displayName(b), "pt-BR"); });
  ```
- **computeGoalBetStakePreview(input: { market: PredictionMarketRow | null | undefined; optionId: string | null | undefined; amount: number; alreadySta)** — `src/lib/goalBetStakePreview.ts`
  ```
  const { market, optionId, amount } = input; const alreadyStaked = Math.max(0, input.alreadyStaked || 0); if (!market) return base(0, "no_market", "Mercado indisponível."); const cap = market.max_stake_per_user > 0 ? market.max_stake_per_user : Number.POSITIVE_INFINITY; const remaining = Number.isFinite(cap) ? Math.max(0, cap - alreadyStaked) : Number.POSITIVE_INFINITY; if (!optionId) return base(remaining, "no_option", "Escolha uma opção para apostar."); const option = market.options.find((o) => …
  ```
- **rankGoalBetCandidates(candidates: readonly GoalBetCandidate[],)** — `src/lib/goalBetting.ts`
  ```
  return [...candidates] .filter((c) => !c.declined) .sort((a, b) => { if (b.progressPercent !== a.progressPercent) { return b.progressPercent - a.progressPercent; } if (b.progress !== a.progress) return b.progress - a.progress; return (a.name ?? "").localeCompare(b.name ?? "", "pt-BR"); });
  ```
- **calculateLightningReward(input: LightningRewardInput)** — `src/lib/lightningQuizScoring.ts`
  ```
  const correct = normalizeCount(input.correctCount, LIGHTNING_QUESTIONS_PER_ROUND); const streak = normalizeCount(input.bestStreak, LIGHTNING_QUESTIONS_PER_ROUND); const bonus = streak >= LIGHTNING_STREAK_THRESHOLD; return { coins: Math.min( LIGHTNING_MAX_COINS, correct * LIGHTNING_COINS_PER_CORRECT + (bonus ? LIGHTNING_STREAK_COIN_BONUS : 0), ), xp: Math.min( LIGHTNING_MAX_XP, correct * LIGHTNING_XP_PER_CORRECT + (bonus ? LIGHTNING_STREAK_XP_BONUS : 0), ), streakBonusApplied: bonus, };
  ```
- **validateWheelConfig(prizes: readonly OddsPrize[], options: WheelValidationOptions = {},)** — `src/lib/luckyWheelOdds.ts`
  ```
  const maxExpectedCoins = options.maxExpectedCoinsPerSpin ?? 60; const maxSectors = options.maxSectors ?? 12; const issues: WheelIssue[] = []; const active = activePrizes(prizes); if (active.length === 0) { issues.push({ level: "error", code: "no_active_prizes", message: "Nenhum prêmio ativo: a roleta ficaria inoperante para todos os usuários.", }); return issues; } if (active.length < 3) { issues.push({ level: "warning", code: "too_few_sectors", message: "Menos de 3 setores ativos reduzem drasti …
  ```
- **validateDeckDraft(deck: DeckDraft, pairs: ReadonlyArray<PairDraft>,)** — `src/lib/memoryDeckAuthoring.ts`
  ```
  const issues: ValidationIssue[] = []; const title = normalizeCardText(deck.title); const description = normalizeCardText(deck.description ?? ""); if (title.length === 0) { issues.push({ scope: "deck", message: "Informe um título para o baralho." }); } else if (title.length > MEMORY_TITLE_MAX) { issues.push({ scope: "deck", message: `O título deve ter no máximo ${MEMORY_TITLE_MAX} caracteres.`, }); } if (description.length > MEMORY_DESCRIPTION_MAX) { issues.push({ scope: "deck", message: `A descr …
  ```
- **calculateMemoryReward(input: MemoryRewardInput)** — `src/lib/memoryGame.ts`
  ```
  const total = clampInt(input.pairsTotal, 0, 64); const matched = clampInt(input.matchedPairs, 0, total); const moves = Math.max(clampInt(input.moves, 0, 10_000), matched); const duration = clampInt(input.durationMs, 0, 3_600_000); const rewardedToday = clampInt(input.rewardedToday ?? 0, 0, 1_000); const dailyLimitReached = rewardedToday >= MEMORY_DAILY_REWARDED_SESSIONS; if (dailyLimitReached) { return { coins: 0, xp: 0, perfectBonus: false, speedBonus: false, dailyLimitReached }; } const comple …
  ```
- **computeNpsScore(promoters: unknown, passives: unknown, detractors: unknown,)** — `src/lib/npsHistory.ts`
  ```
  const p = SAFE_INT(promoters); const n = SAFE_INT(passives); const d = SAFE_INT(detractors); const total = p + n + d; if (total === 0) return null; const raw = (100 * (p - d)) / total; return Math.max(-100, Math.min(100, Math.round(raw)));
  ```
- **metricRank(metric: string)** — `src/lib/npsHistory.ts`
  ```
  return METRIC_ORDER[metric] ?? 99;
  ```
- **validateOpinionDraft(draft: OpinionDraft | null | undefined)** — `src/lib/opinionChannel.ts`
  ```
  const errors: string[] = []; const source = draft ?? {}; const content = sanitizeOpinionText(source.content, OPINION_CONTENT_MAX); if (content.length < OPINION_CONTENT_MIN) { errors.push(`Escreva ao menos ${OPINION_CONTENT_MIN} caracteres.`); } const subjectRaw = sanitizeOpinionText(source.subject, OPINION_SUBJECT_MAX); const subject = subjectRaw.length > 0 ? subjectRaw : null; const category = OPINION_CATEGORIES.includes(source.category as OpinionCategory) ? (source.category as OpinionCategory) …
  ```
- **validatePredictionDraft(draft: PredictionDraft, now: number)** — `src/lib/predictionAdmin.ts`
  ```
  const issues: DraftIssue[] = []; const title = draft.title.trim(); if (title.length < MIN_TITLE_LENGTH) { issues.push({ field: "title", level: "error", message: `Informe uma pergunta com ao menos ${MIN_TITLE_LENGTH} caracteres.` }); } if (title.length > MAX_TITLE_LENGTH) { issues.push({ field: "title", level: "error", message: `A pergunta deve ter no máximo ${MAX_TITLE_LENGTH} caracteres.` }); } if ((draft.description ?? "").length > MAX_DESCRIPTION_LENGTH) { issues.push({ field: "description", …
  ```
- **canPerform(action: PredictionAdminAction, market: PredictionStateView, now: number,)** — `src/lib/predictionAdmin.ts`
  ```
  if (market.status === "settled" || market.status === "voided") return false; const locksAt = parseTime(market.locksAt); const expired = !Number.isNaN(locksAt) && locksAt <= now; switch (action) { case "publish": return market.status === "draft" && market.optionCount >= MIN_OPTIONS && !expired; case "lock": return market.status === "open"; case "settle": return market.status === "locked" || (market.status === "open" && expired); case "void": return true; default: return false; }
  ```
- **totalPool(stakes: PredictionStake[])** — `src/lib/predictionMarket.ts`
  ```
  return stakes.reduce((acc, s) => acc + s.amount, 0);
  ```
- **applyStake(market: PredictionMarket, stakes: PredictionStake[], balance: number, userId: string, optionId: string, amount: number, )** — `src/lib/predictionMarket.ts`
  ```
  if (market.status !== "open" || now >= market.locksAt) { return { accepted: false, reason: "market_closed", newBalance: balance }; } if (!market.optionIds.includes(optionId)) { return { accepted: false, reason: "unknown_option", newBalance: balance }; } if (!Number.isInteger(amount) || amount < 1) { return { accepted: false, reason: "invalid_amount", newBalance: balance }; } if (amount < market.minStake) { return { accepted: false, reason: "below_minimum", newBalance: balance }; } const existing …
  ```
- **rankOracleAggregates(aggregates: OracleAggregate[], options: OracleOptions = {},)** — `src/lib/predictionOracle.ts`
  ```
  const shrinkage = Math.max(0, options.shrinkageCoins ?? DEFAULT_SHRINKAGE_COINS); const minMarkets = Math.max(1, options.minMarkets ?? DEFAULT_MIN_MARKETS); const entries: OracleEntry[] = []; for (const acc of aggregates) { if (acc.markets < minMarkets) continue; if (!(acc.totalStaked > 0) || !(acc.stakes > 0)) continue; // Encolhimento empírico-bayesiano: o denominador cresce com o prior, então // volume baixo puxa a pontuação para zero em vez de para os extremos. const score = stabilize(acc.we …
  ```
- **clampScore(value: number)** — `src/lib/purchaseRisk.ts`
  ```
  if (!Number.isFinite(value)) return MIN_SCORE; return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(value)));
  ```
- **applyAiAdjustment(base: PurchaseRiskAssessment, aiDelta: number | null | undefined, aiSummary?: string | null)** — `src/lib/purchaseRisk.ts`
  ```
  aiSummary: string | null
  ```
- **canRevokeDevice(entry: PushDeviceEntry | null | undefined, options: { confirmedCurrent?: boolean } = {},)** — `src/lib/pushDevices.ts`
  ```
  allowed: boolean; reason?: "not_found" | "already_revoked" | "needs_confirmation"
  ```
- **applyDispatch(item: OutboxItem, result: DispatchResult)** — `src/lib/pushOutbox.ts`
  ```
  if (isTerminal(item.status)) return item; const attempts = item.attempts + 1; switch (result.kind) { case "delivered": return { ...item, status: "sent", attempts, lastError: null }; case "no_subscription": return { ...item, status: "skipped", attempts, lastError: "no_active_subscription" }; case "permanent_error": return { ...item, status: "failed", attempts, lastError: result.error }; case "transient_error": return attempts >= MAX_PUSH_ATTEMPTS ? { ...item, status: "failed", attempts, lastError …
  ```
- **validateOrder(steps: ReadonlyArray<SequenceStep>, order: ReadonlyArray<string>,)** — `src/lib/sequenceGame.ts`
  ```
  if (steps.length === 0) return { valid: false, reason: "empty" }; if (order.length !== steps.length) return { valid: false, reason: "length_mismatch" }; if (new Set(order).size !== order.length) return { valid: false, reason: "duplicate" }; const known = new Set(steps.map((s) => s.id)); if (order.some((id) => !known.has(id))) return { valid: false, reason: "unknown_step" }; return { valid: true };
  ```
- **scoreSequence(steps: ReadonlyArray<SequenceStep>, order: ReadonlyArray<string>, rewardedToday = 0,)** — `src/lib/sequenceGame.ts`
  ```
  const validation = validateOrder(steps, order); const stepsTotal = steps.length; if (!validation.valid) { return { stepsTotal, correctPositions: 0, isPerfect: false, wrongIndexes: order.map((_, i) => i), coins: 0, xp: 0, dailyLimitReached: false, }; } const positionById = new Map(steps.map((s) => [s.id, s.position])); const wrongIndexes: number[] = []; let correct = 0; order.forEach((id, index) => { if (positionById.get(id) === index + 1) correct += 1; else wrongIndexes.push(index); }); const is …
  ```
- **validateProcedureDraft(procedure: ProcedureDraft, steps: ReadonlyArray<StepDraft>,)** — `src/lib/sequenceProcedureAuthoring.ts`
  ```
  const issues: AuthoringIssue[] = []; const title = normalizeText(procedure.title ?? ""); const description = normalizeText(procedure.description ?? ""); if (title.length === 0) { issues.push({ scope: "procedure", message: "Informe um título para o procedimento." }); } else if (title.length > SOP_TITLE_MAX) { issues.push({ scope: "procedure", message: `O título deve ter no máximo ${SOP_TITLE_MAX} caracteres.`, }); } if (description.length > SOP_DESCRIPTION_MAX) { issues.push({ scope: "procedure", …
  ```
- **validateSlaDraft(draft: { alertType: unknown; mttaMinutes: unknown; mttrMinutes: unknown; notes?: unknown; })** — `src/lib/slaTargets.ts`
  ```
  const errors: string[] = []; const warnings: string[] = []; const alertType = typeof draft.alertType === "string" ? draft.alertType.trim() : ""; if (!alertType) errors.push("Tipo de alerta é obrigatório."); const rawMtta = parseMinutes(draft.mttaMinutes); const rawMttr = parseMinutes(draft.mttrMinutes); if (rawMtta === null) errors.push("MTTA inválido: informe um número em minutos."); if (rawMttr === null) errors.push("MTTR inválido: informe um número em minutos."); const mtta = clampMinutes(raw …
  ```
- **bracketRounds(size: number)** — `src/lib/tournamentBracket.ts`
  ```
  if (size < 2) return 0; return Math.round(Math.log2(size));
  ```
- **rankSeeds(seeds: BracketSeed[])** — `src/lib/tournamentBracket.ts`
  ```
  return [...seeds].sort((a, b) => { if (b.score !== a.score) return b.score - a.score; if (a.label !== b.label) return a.label.localeCompare(b.label, "pt-BR"); return a.id.localeCompare(b.id); });
  ```
- **roundLabel(round: number, rounds: number)** — `src/lib/tournamentBracket.ts`
  ```
  const remaining = rounds - round; if (remaining === 0) return "Final"; if (remaining === 1) return "Semifinal"; if (remaining === 2) return "Quartas de final"; if (remaining === 3) return "Oitavas de final"; return `Rodada ${round}`;
  ```
- **validateModuleDraft(draft: unknown)** — `src/lib/trailAuthoring.ts`
  ```
  const parsed = moduleDraftSchema.safeParse(draft); if (parsed.success) return { valid: true, errors: {} }; const errors: Record<string, string> = {}; for (const issue of parsed.error.issues) { const key = issue.path.join(".") || "_form"; if (!errors[key]) errors[key] = issue.message; } return { valid: false, errors };
  ```
- **validateWagerDraft(draft: WagerQuestionDraft)** — `src/lib/wagerAuthoring.ts`
  ```
  const issues: WagerAuthoringIssue[] = []; const question = normalizeText(draft.question ?? ""); const explanation = normalizeText(draft.explanation ?? ""); if (question.length < WAGER_QUESTION_MIN) { issues.push({ scope: "question", message: "Escreva o enunciado da pergunta." }); } else if (question.length > WAGER_QUESTION_MAX) { issues.push({ scope: "question", message: `O enunciado deve ter no máximo ${WAGER_QUESTION_MAX} caracteres.`, }); } if (explanation.length > WAGER_EXPLANATION_MAX) { is …
  ```
- **round(value: number, decimals = 2)** — `src/lib/wagerIntegrity.ts`
  ```
  const factor = 10 ** decimals; return Math.round(value * factor) / factor;
  ```
- **normalizeFeedItem(raw: unknown)** — `src/lib/warFeed.ts`
  ```
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null; const row = raw as Record<string, unknown>; const id = typeof row.id === "string" ? row.id.trim() : ""; if (!id) return null; return { id, created_at: toTimestamp(row.created_at), metric_key: toText(row.metric_key, "desconhecida"), metric_label: toText(row.metric_label, toText(row.metric_key, "Pontuação")), amount: Math.max(0, toFiniteNumber(row.amount)), points: Math.max(0, toFiniteNumber(row.points)), department_id: typeof …
  ```
- **normalizeFeed(raw: unknown)** — `src/lib/warFeed.ts`
  ```
  if (!Array.isArray(raw)) return []; const seen = new Set<string>(); const items: WarFeedItem[] = []; for (const entry of raw) { const item = normalizeFeedItem(entry); if (!item || seen.has(item.id)) continue; seen.add(item.id); items.push(item); if (items.length >= MAX_ITEMS) break; } return items.sort((a, b) => { const diff = Date.parse(b.created_at || "") - Date.parse(a.created_at || ""); if (Number.isFinite(diff) && diff !== 0) return diff; // Empate (ou datas invalidas): ordem estavel por id …
  ```
- **summarizeFeed(items: WarFeedItem[])** — `src/lib/warFeed.ts`
  ```
  const byDepartment = new Map<string, { name: string; points: number }>(); let points = 0; for (const item of items) { points += item.points; const key = item.department_id || item.department_name; const current = byDepartment.get(key); if (current) { current.points += item.points; } else { byDepartment.set(key, { name: item.department_name, points: item.points }); } } let leader: string | null = null; let best = -1; for (const entry of byDepartment.values()) { if (entry.points > best) { best = e …
  ```
- **round(value: number)** — `src/lib/warLeadership.ts`
  ```
  return Math.round(value * 100) / 100;
  ```
- **invalidate()** — `src/pages/ApiKeysAdmin.tsx`
  ```
  queryClient.invalidateQueries({ queryKey: ["external-api-keys"] });
  ```
- **validateForm()** — `src/pages/Auth.tsx`
  ```
  const newErrors: typeof errors = {}; if (view === "forgot-password") { const r = emailSchema.safeParse(email); if (!r.success) newErrors.email = r.error.issues[0].message; } else if (view === "login") { const r = loginSchema.safeParse({ email, password }); if (!r.success) r.error.issues.forEach((e) => { if (e.path[0] === "email") newErrors.email = e.message; if (e.path[0] === "password") newErrors.password = e.message; }); } else { const r = signupSchema.safeParse({ email, password, displayName: …
  ```
- **rankMedal(position: number | null)** — `src/pages/CampaignHistory.tsx`
  ```
  if (position === 1) return "🥇"; if (position === 2) return "🥈"; if (position === 3) return "🥉"; return null;
  ```
- **calculateFinancialMetrics(metrics: ExecutiveMetricsData | undefined)** — `src/pages/ExecutiveDashboard.tsx`
  ```
  const engagementScore = metrics ? (metrics.totalXpEarned / 100) + (metrics.totalQuestsCompleted * 5) + (metrics.totalKudos * 2) : 0; const baseROI = metrics ? Math.min(300, 100 + engagementScore) : 0; const trainingSavings = metrics ? Math.round((metrics.trainingCompletionRate || 0) * 500) : 0; const retentionSavings = metrics ? Math.round((metrics.punctualityRate || 0) * 300) : 0; return { roiGamification: { value: Math.round(baseROI), target: 200, trend: metrics ? Math.round((baseROI - 100) / …
  ```
- **calculatePeopleMetrics(metrics: ExecutiveMetricsData | undefined)** — `src/pages/ExecutiveDashboard.tsx`
  ```
  enps: { value: null as number | null, target: 50, promoters: null as number | null, passives: null as number | null, detractors: null as number | null }, turnover: { value: null as number | null, target: 10, previousYear: null as number | null }, gameAdoption: { value: metrics?.wau || 0, target: 90 }, level5Plus: { value: metrics?.level5PlusRate || 0, target: 20 }, dau: { value: metrics?.dau || 0, target: 70 }, wau: { value: metrics?.wau || 0, target: 90 }, totalUsers: metrics?.totalUsers || 0, …
  ```
- **calculateOperationalMetrics(metrics: ExecutiveMetricsData | undefined)** — `src/pages/ExecutiveDashboard.tsx`
  ```
  punctualCheckin: { value: metrics?.punctualityRate || 0, target: 95 }, absenteeism: { value: null as number | null, target: 3 }, trainingCompletion: { value: metrics?.trainingCompletionRate || 0, target: 95 }, avgTrainingHours: { value: metrics?.avgTrainingHours || 0, target: 20 }, certifications: { value: metrics?.completedTrails || 0, target: 30 }, totalQuestsCompleted: metrics?.totalQuestsCompleted || 0, totalXpEarned: metrics?.totalXpEarned || 0,
  ```
- **Feedback()** — `src/pages/Feedback.tsx`
  ```
  const { cycles, pendingRequests, isLoading, submitFeedback, isSubmitting } = useFeedback360(); const { isAdmin, isManager } = useRBAC(); const canManageRequests = isAdmin || isManager; const seoData = useSEO(); const [activeRequest, setActiveRequest] = useState<FeedbackRequest | null>(null); const [isRequestFormOpen, setIsRequestFormOpen] = useState(false); const [strengths, setStrengths] = useState(""); const [improvements, setImprovements] = useState(""); const [overallRating, setOverallRating …
  ```
- **severityRank(sev: string | null)** — `src/pages/Postmortems.tsx`
  ```
  if (!sev) return 99; const key = sev.toLowerCase() as SeverityKey; return SEVERITY_ORDER[key] ?? 99;
  ```
- **invalidate()** — `src/pages/Postmortems.tsx`
  ```
  qc.invalidateQueries({ queryKey: ["postmortem_actions", postmortemId] }); qc.invalidateQueries({ queryKey: ["postmortem_actions_pending_counts"] });
  ```
- **calculateTotalXP()** — `src/pages/QuestBuilder.tsx`
  ```
  xpReward + steps.reduce((acc, step) => acc + step.xpReward, 0);
  ```
- **generateSecret(bytes = 32)** — `src/pages/WebhookSubscriptionNew.tsx`
  ```
  const arr = new Uint8Array(bytes); crypto.getRandomValues(arr); return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  ```
- **generateFromFactor({ factorKey, departmentId = null, days = 90, }: GenerateActionPlanInput)** — `src/services/actionPlanGeneratorService.ts`
  ```
  if (!factorKey.trim()) { throw new Error("Fator de engajamento inválido."); } const { data, error } = await supabase.rpc("generate_action_plan_from_factor", { p_factor_key: factorKey, p_department_id: departmentId ?? undefined, p_days: days, }); if (error) { logger.error("Falha ao gerar plano de ação a partir do fator", error.message); throw error; } if (typeof data !== "string" || data.length === 0) { throw new Error("O plano de ação não pôde ser criado."); } return data;
  ```
- **cancel(auctionId: string)** — `src/services/auctionService.ts`
  ```
  const { error } = await supabase.rpc("cancel_auction", { p_auction_id: auctionId }); if (error) { logger.apiError("cancelAuction", error, "auctionAdminService"); throw error; }
  ```
- **generateWeeklyChallenges(userId: string)** — `src/services/autoChallengesService.ts`
  ```
  const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay())); // End of week weekEnd.setHours(23, 59, 59, 999); // Select 3-4 random challenges based on user activity const selectedTemplates = this.selectChallengesForUser(CHALLENGE_TEMPLATES); return selectedTemplates.map((template, index) => ({ ...template, id: `challenge-${userId}-${Date.now()}-${index}`, current: 0, expires_at: weekEnd.toISOString(), is_active: true, }));
  ```
- **applyImport(importId: string)** — `src/services/campaignImportService.ts`
  ```
  applied: number; skipped: number; total_amount: number
  ```
- **generateAnnualCelebrations(userId: string)** — `src/services/celebrationsService.ts`
  ```
  const { data: profile } = await supabase .from("profiles") .select("display_name, birth_date, hire_date") .eq("id", userId) .maybeSingle(); if (!profile) return; const currentYear = new Date().getFullYear(); const celebrations: Omit<Celebration, 'id' | 'created_at' | 'profile'>[] = []; // Birthday if (profile.birth_date) { const birthDate = new Date(profile.birth_date); const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate()); celebrations.push({ user_id: userId, …
  ```
- **calculateENPS(surveyId: string, minResponses = MIN_RESPONDENTS)** — `src/services/climateSurveyService.ts`
  ```
  const { data, error } = await supabase.rpc('climate_survey_enps', { p_survey_id: surveyId, p_min_responses: minResponses, }); if (error) { logger.error('Failed to calculate eNPS', 'ClimateSurveyService', error); throw error; } return data as unknown as ClimateSurveyEnps;
  ```
- **applyReverse(score: number | null, isReverse: boolean)** — `src/services/continuousEngagementService.ts`
  ```
  if (score === null) return null; return isReverse ? 10 - score : score;
  ```
- **cancelDuel(duelId: string)** — `src/services/duelsService.ts`
  ```
  const { data, error } = await supabase .from("direct_duels") .update({ status: 'cancelled' }) .eq("id", duelId) .select() .single(); if (error) throw error; return { ...data, status: data.status as DirectDuel['status'] };
  ```
- **scoreZone(score: number | null | undefined)** — `src/services/engagementDiagnosticsService.ts`
  ```
  if (score === null || score === undefined || !Number.isFinite(score)) return "neutral"; if (score < 4) return "critical"; if (score < 6) return "attention"; if (score < 7.5) return "neutral"; if (score < 9) return "good"; return "excellent";
  ```
- **generateSnapshot(departmentId?: string, periodType = "weekly")** — `src/services/enpsService.ts`
  ```
  const { data, error } = await supabase .rpc("generate_engagement_snapshot", { p_department_id: departmentId, p_period_type: periodType, }); if (error) throw error; return data;
  ```
- **rankComments(texts: Array<string | null>)** — `src/services/feedbackService.ts`
  ```
  const byKey = new Map<string, { text: string; count: number }>(); texts.forEach(raw => { const text = raw?.trim(); if (!text) return; const key = text.toLowerCase().replace(/\s+/g, " "); const entry = byKey.get(key); if (entry) entry.count += 1; else byKey.set(key, { text, count: 1 }); }); return [...byKey.values()] .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text)) .slice(0, 5) .map(entry => entry.text);
  ```
- **aggregateFeedbackSummary(rows: FeedbackSummaryRow[])** — `src/services/feedbackService.ts`
  ```
  let totalRating = 0; let ratingCount = 0; const byRelationship: Record<string, { count: number; totalRating: number }> = {}; const strengths: string[] = []; const improvements: string[] = []; rows.forEach(row => { // O anonimato vale para o avaliado: um admin consegue ler respostas anônimas // (policy "Admins can view all responses"), mas o resumo dele não pode desfazer // o anonimato — é exatamente o que o card promete na tela. O descarte vem antes do // dedupe: se o mesmo pedido tem uma respos …
  ```
- **calculateOverallScore(factors: HighPotentialScore['factors'])** — `src/services/highPotentialService.ts`
  ```
  return Math.round( factors.performance * WEIGHTS.performance + factors.learning * WEIGHTS.learning + factors.engagement * WEIGHTS.engagement + factors.consistency * WEIGHTS.consistency + factors.collaboration * WEIGHTS.collaboration + factors.growth * WEIGHTS.growth );
  ```
- **generateRecommendation(score: number, factors: HighPotentialScore['factors'], risk: 'low' | 'medium' | 'high')** — `src/services/highPotentialService.ts`
  ```
  if (score >= 80 && risk === 'low') { return 'Star Player - Incluir em programa de sucessão e retenção máxima'; } if (score >= 80 && risk !== 'low') { return 'Talento em risco - Ação urgente de retenção necessária'; } if (score >= 70) { return 'Alto potencial - Investir em desenvolvimento acelerado'; } if (score >= 60) { return 'Potencial promissor - Monitorar e desenvolver pontos fracos'; } return 'Em desenvolvimento - Acompanhar progresso regularmente';
  ```
- **validateIpAddress(ip: string)** — `src/services/ipWhitelistService.ts`
  ```
  // IPv4 pattern const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/; // IPv6 pattern (simplified) const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$/; // CIDR notation const cidrPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[12]?[0-9])$/; return ipv4Pattern.test(ip) || ipv6Pattern …
  ```
- **applyPairDiff(deckId: string, diff: PairDiff)** — `src/services/memoryGameService.ts`
  ```
  if (diff.toDeleteIds.length > 0) { const { error } = await supabase .from("memory_pairs") .delete() .eq("deck_id", deckId) .in("id", diff.toDeleteIds); if (error) { logger.error("Falha ao remover pares", "memoryDeckAdminService.applyPairDiff", error); throw error; } } for (const pair of diff.toUpdate) { const { error } = await supabase .from("memory_pairs") .update({ term: pair.term, match: pair.match }) .eq("id", pair.id) .eq("deck_id", deckId); if (error) { logger.error("Falha ao atualizar par …
  ```
- **generateActionPlanFromNr1Category({ categoryKey, departmentId = null, days = 90, }: GenerateNr1PlanInput)** — `src/services/nr1RiskService.ts`
  ```
  if (!categoryKey.trim()) throw new Error("Categoria de risco inválida."); const { data, error } = await supabase.rpc("generate_action_plan_from_nr1_category", { p_category_key: categoryKey, p_department_id: departmentId ?? undefined, p_days: days, }); if (error) { logger.error("Falha ao gerar plano de tratativa NR-1", error.message); throw error; } if (typeof data !== "string" || data.length === 0) { throw new Error("O plano de tratativa não pôde ser criado."); } return data;
  ```
- **generatePreparation(context: OneOnOneContext)** — `src/services/oneOnOnePreparationService.ts`
  ```
  const suggestedAgenda: SuggestedAgenda[] = []; const talkingPoints: string[] = []; const warningFlags: string[] = []; const positiveHighlights: string[] = []; const followUpFromLast: string[] = []; // Analyze mood trends const recentMoods = context.recentPulses.slice(0, 5); const avgMood = recentMoods.length > 0 ? recentMoods.reduce((acc, p) => acc + p.mood, 0) / recentMoods.length : 3; const moodTrend = recentMoods.length >= 2 ? recentMoods[0].mood - recentMoods[recentMoods.length - 1].mood : 0 …
  ```
- **generateActionPlan(opinionId: string)** — `src/services/opinionsService.ts`
  ```
  const { data, error } = await db.rpc("generate_action_plan_from_opinion", { p_opinion_id: opinionId, }); if (error) { logger.apiError("opinion_action_plan", error, "opinionsService"); throw toError(error, "Não foi possível gerar o plano de ação"); } if (typeof data !== "string" || data.length === 0) { throw new Error("O plano de ação não pôde ser criado."); } return data;
  ```
- **generatePDIFromNineBox(userId: string, boxPosition: number, evaluationId: string, createdBy: string, developmentAreas?: string[])** — `src/services/pdiGeneratorService.ts`
  ```
  const template = PDI_TEMPLATES[boxPosition]; if (!template) throw new Error("Invalid box position"); const boxLabel = BOX_LABELS[boxPosition]; // Create the development plan const { data: plan, error: planError } = await supabase .from("development_plans") .insert({ user_id: userId, created_by: createdBy, title: template.title, description: `${template.description}\n\nBaseado na avaliação 9-Box: ${boxLabel.name} - ${boxLabel.description}${developmentAreas?.length ? `\n\nÁreas de desenvolvimento …
  ```
- **applyTemplate(planId: string, templateId: string)** — `src/services/pdiService.ts`
  ```
  const template = await this.getTemplateById(templateId); if (!template) throw new Error('Template not found'); const actions = template.actions_template.map((action, index) => ({ plan_id: planId, title: action.title, description: action.description, action_type: action.action_type, priority: action.priority, status: 'pending', progress_percent: 0, })); const { error } = await supabase.from('development_plan_actions').insert(actions); if (error) { logger.error('Failed to apply template', 'PDIServ …
  ```
- **applyPenalty(userId: string, taskScoreId: string, penaltyType: string, xpDeducted: number, coinsDeducted: number = 0, reason?: string)** — `src/services/positionsService.ts`
  ```
  const { data: { user } } = await supabase.auth.getUser(); const { data, error } = await supabase .rpc("apply_task_penalty", { p_user_id: userId, p_task_score_id: taskScoreId, p_penalty_type: penaltyType, p_xp_deducted: xpDeducted, p_coins_deducted: coinsDeducted, p_reason: (reason ?? null) as unknown as string, p_applied_by: (user?.id ?? null) as unknown as string }); if (error) throw error; return data as string;
  ```
- **computeEngagementScore(s: EngagementSignals)** — `src/services/predictiveFeedbackService.ts`
  ```
  const n = normalizeSignals(s); const raw = n.streak * WEIGHTS.streak + n.inactivity * WEIGHTS.inactivity + n.xp * WEIGHTS.xp + n.punctuality * WEIGHTS.punctuality + n.quests * WEIGHTS.quests; return Math.round(raw * 100);
  ```
- **computeConfidence(s: EngagementSignals)** — `src/services/predictiveFeedbackService.ts`
  ```
  // Confiança cresce com o volume de sinal disponível. const evidence = (s.streak > 0 ? 1 : 0) + (s.questsCompleted7d > 0 ? 1 : 0) + (s.recentXpGain > 0 ? 1 : 0) + (s.punctualityRate > 0 ? 1 : 0); return clamp(0.4 + evidence * 0.15, 0.4, 1);
  ```
- **calculateMatchScore(hipo: HighPotentialScore, _position?: CriticalPosition)** — `src/services/successionService.ts`
  ```
  let score = 0; // Base score from HiPo assessment score += hipo.overallScore * 0.5; // Bonus for leadership readiness if (hipo.readyFor.some(r => r.toLowerCase().includes('liderança') || r.toLowerCase().includes('promoção'))) { score += 20; } // Bonus for high performance factor score += (hipo.factors.performance / 100) * 15; // Bonus for growth potential score += (hipo.factors.growth / 100) * 15; return Math.min(100, Math.round(score));
  ```
- **generateSecret()** — `src/services/twoFactorService.ts`
  ```
  const secret = new OTPAuth.Secret({ size: 20 }); return secret.base32;
  ```
- **generateBackupCodes(count: number = 8)** — `src/services/twoFactorService.ts`
  ```
  const codes: string[] = []; for (let i = 0; i < count; i++) { const code = Math.random().toString(36).substring(2, 8).toUpperCase(); codes.push(code); } return codes;
  ```
- **generateChallenge()** — `src/services/webauthnService.ts`
  ```
  const array = new Uint8Array(32); crypto.getRandomValues(array); return base64URLEncode(array.buffer);
  ```
- **generateRegistrationOptions(userId: string, userEmail: string, displayName: string)** — `src/services/webauthnService.ts`
  ```
  const challenge = generateChallenge(); // Salvar challenge no banco await supabase.from("webauthn_challenges").insert({ user_id: userId, challenge, type: "registration" }); // Buscar credenciais existentes para excluir const { data: existingCredentials } = await supabase .from("webauthn_credentials") .select("credential_id, transports") .eq("user_id", userId) .eq("is_active", true); const excludeCredentials = (existingCredentials || []).map(cred => ({ id: base64URLDecode(cred.credential_id), typ …
  ```
- **computeGini(values: number[])** — `src/services/xpBalancingService.ts`
  ```
  if (values.length === 0) return 0; const sorted = [...values].filter(v => v >= 0).sort((a, b) => a - b); const n = sorted.length; if (n === 0) return 0; const sum = sorted.reduce((a, b) => a + b, 0); if (sum === 0) return 0; let cum = 0; for (let i = 0; i < n; i++) { cum += (i + 1) * sorted[i]; } return clamp((2 * cum) / (n * sum) - (n + 1) / n, 0, 1);
  ```
- **RankChange({ current, previous }: { current: number; previous: number })** — `src/stories/gamification/Leaderboard.stories.tsx`
  ```
  const diff = previous - current; if (diff > 0) return <TrendingUp className="h-4 w-4 text-success" />; if (diff < 0) return <TrendingDown className="h-4 w-4 text-destructive" />; return <Minus className="h-4 w-4 text-muted-foreground" />;
  ```
- **RankBadge({ rank }: { rank: number })** — `src/stories/gamification/Leaderboard.stories.tsx`
  ```
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />; if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />; if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />; return <span className="w-5 text-center font-bold text-muted-foreground">{rank}</span>;
  ```
- **formatCurrency(value: number)** — `src/utils/formatters.ts`
  ```
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', }).format(value);
  ```
- **buildValidationError(params: { code?: ValidationErrorCode; message?: string; fields?: ValidationErrorField[]; requestId?: string; })** — `supabase/functions/_shared/validation.ts`
  ```
  const fields = params.fields ?? []; const code = params.code ?? "VALIDATION_ERROR"; const message = params.message ?? defaultMessage(code, fields); const body: ValidationError = { error: message, code, message, fields }; if (params.requestId) body.requestId = params.requestId; return body;
  ```
- **validationErrorResponse(body: ValidationError, headers?: Record<string, string>,)** — `supabase/functions/_shared/validation.ts`
  ```
  return new Response(JSON.stringify(body), { status: VALIDATION_ERROR_STATUS, headers: { ...(headers ?? {}), "Content-Type": "application/json" }, });
  ```
- **createValidationErrorResponse(error: z.ZodError, headers?: Record<string, string>, requestId?: string,)** — `supabase/functions/_shared/validation.ts`
  ```
  
  ```
- **computeHmacSha256(payload: string, secret: string)** — `supabase/functions/_shared/webhookSecurity.ts`
  ```
  const encoder = new TextEncoder(); const key = await crypto.subtle.importKey( "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"], ); const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload)); return new Uint8Array(sig);
  ```
- **validateWithContract(contract: EdgeContract, raw: unknown, options: { requestId?: string; now?: Date } = {},)** — `supabase/functions/_shared/contracts/_testkit.ts`
  ```
  if (contract.validate) return contract.validate(raw, options); const r: ParsedBody<unknown> = validateBody(contract.request, raw, { requestId: options.requestId }); return r.ok ? { ok: true, data: r.data } : { ok: false, error: r.error };
  ```
- **expectValidationResponse(res: Response, code = "VALIDATION_ERROR")** — `supabase/functions/_shared/contracts/_testkit.ts`
  ```
  expect(res.status).toBe(VALIDATION_ERROR_STATUS); expect(res.headers.get("content-type")).toContain("application/json"); const body = await res.json(); return expectUnifiedValidationError(body, code);
  ```
- **calculateUserCompetencies(supabase: SupabaseClient, userId: string)** — `supabase/functions/competency-alerts/index.ts`
  ```
  const competencies: CompetencyData[] = []; // Fetch completed modules const { data: moduleProgress } = await supabase .from("module_progress") .select("id, score, completed_at, module_id") .eq("user_id", userId) .not("completed_at", "is", null) as { data: ModuleProgressItem[] | null }; // Fetch completed quests const { data: questAssignments } = await supabase .from("quest_assignments") .select("id, completed_at, quest_id") .eq("user_id", userId) .not("completed_at", "is", null) as { data: Quest …
  ```
- **clampScore(value: number)** — `supabase/functions/reward-approval-review/risk.ts`
  ```
  if (!Number.isFinite(value)) return MIN_SCORE; return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(value)));
  ```
- **applyAiAdjustment(base: PurchaseRiskAssessment, aiDelta: number | null | undefined, aiSummary?: string | null)** — `supabase/functions/reward-approval-review/risk.ts`
  ```
  aiSummary: string | null
  ```
- **computeBackoff(attempt: number)** — `supabase/functions/send-campaign-push/index.ts`
  ```
  const exp = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, attempt - 1)); const jitter = Math.floor(Math.random() * (exp / 2)); return exp + jitter;
  ```
- **generateSignature(payload: string, secret: string)** — `supabase/functions/webhook-dispatcher/index.ts`
  ```
  const hmac = createHmac('sha256', secret); hmac.update(payload); return 'sha256=' + hmac.digest('hex');
  ```

### G.4 Percentuais e multiplicadores no código

| Trecho | Arquivo |
|---|---|
| `// Reduz o tempo de setup de ~65% para ~20-30% do total.` | `vitest.config.ts` |
| `delay: i * 0.15,` | `src/components/AICoachDialog.tsx` |
| `transition={{ delay: 0.4 + idx * 0.1 }}` | `src/components/AICoachDialog.tsx` |
| `delay: i * 0.1,` | `src/components/AchievementSystem.tsx` |
| `transition={{ duration: 1.5, delay: i * 0.05 }}` | `src/components/AchievementSystem.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/ActivityComments.tsx` |
| `delay: (weekIndex * 7 + dayIndex) * 0.001,` | `src/components/ActivityHeatmap.tsx` |
| `transition={{ delay: 0.5 + i * 0.1 }}` | `src/components/AnalyticsWidget.tsx` |
| `transition={{ delay: index * 0.01 }}` | `src/components/AttendanceCalendar.tsx` |
| `transition={{ delay: i * 0.05 }}` | `src/components/AttendanceModule.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/AttendanceModule.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/AutoChallengesWidget.tsx` |
| `transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}` | `src/components/AutoChallengesWidget.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/BehavioralBadgesWidget.tsx` |
| `const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;` | `src/components/CelebrationEffect.tsx` |
| `delay: Math.random() * 0.5,` | `src/components/CelebrationEffect.tsx` |
| `delay: i * 0.2,` | `src/components/CelebrationEffect.tsx` |
| `repeatDelay: Math.random() * 0.3,` | `src/components/CelebrationEffect.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/CelebrationsBanner.tsx` |
| `transition={{ delay: i * 0.1 + 0.2 }}` | `src/components/ChurnPredictionPanel.tsx` |
| `transition={{ delay: i * 0.1 }}` | `src/components/ChurnPredictionPanel.tsx` |
| `transition={{ delay: index * 0.1, duration: 0.3 }}` | `src/components/ChurnPredictionPanel.tsx` |
| `transition={{ delay: index * 0.1 + 0.2, duration: 0.5, ease: "easeOut" }}` | `src/components/CompetencyRadar.tsx` |
| `transition={{ delay: index * 0.1, duration: 0.3 }}` | `src/components/CompetencyRadar.tsx` |
| `transition={{ delay: 0.1 + i * 0.05 }}` | `src/components/DailyQuests.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/DepartmentMissions.tsx` |
| `score: Math.round(p.xp * 0.8 + p.quests_completed * 50 + p.streak * 10),` | `src/components/DepartmentRankings.tsx` |
| `transition={{ delay: rank * 0.1 }}` | `src/components/DepartmentRankings.tsx` |
| `transition: { delay: (actions.length - index) * 0.03 }` | `src/components/FloatingActionButton.tsx` |
| `transition: { delay: index * 0.05 }` | `src/components/FloatingActionButton.tsx` |
| `transition={{ delay: 0.3 + index * 0.1 }}` | `src/components/KudosRanking.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/KudosRanking.tsx` |
| `transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}` | `src/components/KudosRanking.tsx` |
| `transition={{ delay: index * 0.03 }}` | `src/components/LeagueCard.tsx` |
| `transition={{ delay: 0.3 + i * 0.15, type: "spring" }}` | `src/components/LiveLeaderboard.tsx` |
| `transition={{ delay: 0.6 + i * 0.1, duration: 0.8, type: "spring" }}` | `src/components/LiveLeaderboard.tsx` |
| `transition={{ delay: 0.7 + i * 0.05 }}` | `src/components/LiveLeaderboard.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/MobileDrawer.tsx` |
| `transition={{ delay: 0.1 + i * 0.1 }}` | `src/components/PWAInstallPrompt.tsx` |
| `transition={{ delay: 0.3 + i * 0.1 }}` | `src/components/PWAInstallPrompt.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/PasswordStrengthIndicator.tsx` |
| `transition={{ delay: i * 0.1 }}` | `src/components/ProfileAvatarSection.tsx` |
| `transition={{ delay: index * 0.03 }}` | `src/components/ProfileKudosSection.tsx` |
| `transition={{ delay: 0.4 + i * 0.1 }}` | `src/components/RewardsShop.tsx` |
| `delay: index * 0.05,` | `src/components/SocialFeed.tsx` |
| `transition={{ delay: index * 0.05 + 0.1 }}` | `src/components/SocialFeed.tsx` |
| `transition={{ delay: index * 0.05 + 0.2, type: "spring" }}` | `src/components/SocialFeed.tsx` |
| `transition={{ delay: index * 0.05 + 0.3, type: "spring" }}` | `src/components/SocialFeed.tsx` |
| `<StatCard key={stat.label} {...stat} delay={i * 0.1} />` | `src/components/StatsGrid.tsx` |
| `transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 200 }}` | `src/components/StatsGrid.tsx` |
| `transition={{ delay: 0.6 + index * 0.1 }}` | `src/components/StatsGrid.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/TeamCertificationsPanel.tsx` |
| `transition={{ duration: 0.3, delay: node.depth * 0.1 }}` | `src/components/TrailDependencyTree.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/TrailRecommendations.tsx` |
| `transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}` | `src/components/WeeklyPerformanceComparison.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/WeeklyPerformanceComparison.tsx` |
| `transition={{ delay: groupIndex * 0.1 }}` | `src/components/accessibility/AccessibilitySettings.tsx` |
| `transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}` | `src/components/achievements/AchievementGrid.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/admin/AdminAlertsPanel.tsx` |
| `transition={{ delay: index * 0.02 }}` | `src/components/admin/AdminChangeHistory.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/admin/AnnouncementPublisher.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/admin/CelebrationManager.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/admin/FeedbackCycleManager.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/admin/GoalsManager.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/admin/LeaguesManager.tsx` |
| `transition={{ delay: index * 0.03 }}` | `src/components/admin/MoodAnalytics.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/admin/MoodAnalytics.tsx` |
| `transition={{ duration: 0.5, delay: index * 0.1 }}` | `src/components/admin/MoodAnalytics.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/admin/PDIAlertsPanel.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/admin/PenaltyRulesManager.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/admin/PositionsManager.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/admin/SurveyCreator.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/admin/positions/AssignmentsTab.tsx` |
| `transition={{ delay: index * 0.02 }}` | `src/components/admin/users/UserRow.tsx` |
| `transition={{ delay: 0.4 + index * 0.05 }}` | `src/components/analytics/ActivityByTypeCard.tsx` |
| `transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}` | `src/components/analytics/ActivityByTypeCard.tsx` |
| `transition={{ delay: 0.5 + index * 0.05 }}` | `src/components/analytics/MostActiveUsersCard.tsx` |
| `transition={{ delay: 0.3 + i * 0.1 }}` | `src/components/auth/AuthBranding.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/bi/BIDepartmentsTab.tsx` |
| `<Badge variant={okr.atual >= okr.meta ? "default" : okr.atual >= okr.meta * 0.7 ? "secondary" : "destructive"}>` | `src/components/bi/BIOKRsTab.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/bi/BIOKRsTab.tsx` |
| `transition={{ duration: 0.25, delay: Math.min(tile.position, 12) * 0.02 }}` | `src/components/board/BoardPath.tsx` |
| `* Torna transparente a economia do chefão: o dano é 100% automático e` | `src/components/boss/BossDamageSourcesCard.tsx` |
| `* permite apostar sem sair da página. A economia continua 100% no servidor.` | `src/components/campaigns/CampaignGoalBetPanel.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/copilot/CopilotSuggestions.tsx` |
| `delay: i * 0.25,` | `src/components/effects/AnimatedCoinsIndicator.tsx` |
| `delay: i * 0.3,` | `src/components/effects/AnimatedCoinsIndicator.tsx` |
| `delay: i * 0.4,` | `src/components/effects/AnimatedCoinsIndicator.tsx` |
| `duration: 2 + i * 0.2,` | `src/components/effects/AnimatedCoinsIndicator.tsx` |
| `delay: i * 0.1,` | `src/components/effects/AnimatedFireIndicator.tsx` |
| `delay: i * 0.3,` | `src/components/effects/AnimatedFireIndicator.tsx` |
| `duration: 0.4 + i * 0.1,` | `src/components/effects/AnimatedFireIndicator.tsx` |
| `delay: i * 0.2,` | `src/components/effects/AnimatedLevelIndicator.tsx` |
| `delay: i * 0.4,` | `src/components/effects/AnimatedLevelIndicator.tsx` |
| `delay: i * 0.5,` | `src/components/effects/AnimatedLevelIndicator.tsx` |
| `duration: 2.5 + i * 0.3,` | `src/components/effects/AnimatedLevelIndicator.tsx` |
| `duration: 3 + i * 0.3,` | `src/components/effects/AnimatedLevelIndicator.tsx` |
| `delay: i * 0.1,` | `src/components/effects/AnimatedTrophyIndicator.tsx` |
| `delay: i * 0.3,` | `src/components/effects/AnimatedTrophyIndicator.tsx` |
| `delay: i * 0.4,` | `src/components/effects/AnimatedTrophyIndicator.tsx` |
| `duration: 2 + i * 0.5,` | `src/components/effects/AnimatedTrophyIndicator.tsx` |
| `delay: i * 0.1,` | `src/components/effects/AnimatedXPParticles.tsx` |
| `const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;` | `src/components/effects/ComboExplosion.tsx` |
| `duration: 1 + Math.random() * 0.5,` | `src/components/effects/ComboExplosion.tsx` |
| `x{(1 + tier * 0.5).toFixed(1)}` | `src/components/effects/ComboExplosion.tsx` |
| `const angle = (Math.PI * 2 * i) / 40 + (Math.random() - 0.5) * 0.5;` | `src/components/effects/MiniConfetti.tsx` |
| `delay: i * 0.15,` | `src/components/effects/MiniConfetti.tsx` |
| `duration: 1.8 + Math.random() * 0.5,` | `src/components/effects/MiniConfetti.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/lms/ModuleViewer.tsx` |
| `const labelPos = polarToCartesian(start + sliceAngle / 2, RADIUS * 0.62);` | `src/components/luckywheel/LuckyWheel.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/manager/HighPotentialsPanel.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/manager/QuestCard.tsx` |
| `transition={{ delay: Math.min(index * 0.02, 0.3) }}` | `src/components/memory/MemoryBoard.tsx` |
| `transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 24 }}` | `src/components/mobile/MobileBottomNav.tsx` |
| `const pull = Math.min(MAX_PULL, diff * 0.4);` | `src/components/mobile/PullToRefresh.tsx` |
| `} else if (Math.abs(offset) < threshold * 0.8 && hasTriggered) {` | `src/components/mobile/SwipeableCard.tsx` |
| `const leftIconScale = useTransform(x, [0, threshold * 0.5, threshold], [0.5, 0.8, 1]);` | `src/components/mobile/SwipeableListItem.tsx` |
| `const rightIconScale = useTransform(x, [-threshold, -threshold * 0.5, 0], [1, 0.8, 0.5]);` | `src/components/mobile/SwipeableListItem.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/onboarding/OnboardingModal.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/onboarding/TourLauncher.tsx` |
| `transition={{ delay: i * 0.05 }}` | `src/components/profile/ProfileAchievements.tsx` |
| `transition={{ delay: i * 0.1 }}` | `src/components/profile/ProfileActivityTimeline.tsx` |
| `transition={{ delay: i * 0.1 }}` | `src/components/quest-builder/QuestPreview.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/quest-builder/QuestPreview.tsx` |
| `transition={{ delay: idx * 0.1 }}` | `src/components/quiz/AIQuestionGenerator.tsx` |
| `transition={{ delay: idx * 0.05 }}` | `src/components/quiz/HardestQuestionsRanking.tsx` |
| `const streakBonus = streak >= 2 ? Math.floor(currentQuestion.points * 0.1 * streak) : 0;` | `src/components/quiz/MagicCardQuiz.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/quiz/QuizDailyRanking.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/shop/PurchaseHistory.tsx` |
| `transition={{ delay: index * 0.02 }}` | `src/components/shop-admin/PromotionsManager.tsx` |
| `transition={{ delay: index * 0.02 }}` | `src/components/shop-admin/PurchasesManager.tsx` |
| `transition={{ delay: index * 0.02 }}` | `src/components/shop-admin/RewardsManager.tsx` |
| `transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.5) }}` | `src/components/social/ActivityItem.tsx` |
| `transition={{ delay: i * 0.1 }}` | `src/components/social/FeedStatsBar.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/ui/daily-login-bonus.tsx` |
| `transition={{ duration: 1, delay: i * 0.02 }}` | `src/components/ui/daily-login-bonus.tsx` |
| `delay: i * 0.1,` | `src/components/ui/gamified-toast.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/ui/power-ups.tsx` |
| `const intensity = Math.min(1 + (data.currentStreak / 10) * 0.5, 2);` | `src/components/ui/streak-tracker.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/ui/streak-tracker.tsx` |
| `transition={{ delay: i * 0.05 }}` | `src/components/ui/team-challenges.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/ui/team-challenges.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/ui/weekly-goals-tracker.tsx` |
| `transition={{ duration: 0.5, delay: index * 0.1 }}` | `src/components/ui/weekly-goals-tracker.tsx` |
| `transition={{ delay: Math.min(index, 8) * 0.03 }}` | `src/components/wager/WagerLeaderboardCard.tsx` |
| `transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}` | `src/components/weekly/WeeklyMetricCards.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/weekly/WeeklyMetricCards.tsx` |
| `g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);` | `src/hooks/useFeedback.ts` |
| `g.gain.setValueAtTime(0.05, now + i * 0.1);` | `src/hooks/useFeedback.ts` |
| `o.frequency.setValueAtTime(freq, now + i * 0.1);` | `src/hooks/useFeedback.ts` |
| `o.start(now + i * 0.1);` | `src/hooks/useFeedback.ts` |
| `o.stop(now + i * 0.1 + 0.2);` | `src/hooks/useFeedback.ts` |
| `const dampedDistance = Math.min(distance * 0.4, threshold + 20);` | `src/hooks/usePullToRefresh.ts` |
| `coin.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + i * 0.06 + 0.12);` | `src/hooks/useSoundEffects.tsx` |
| `coin.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + i * 0.08 + 0.1);` | `src/hooks/useSoundEffects.tsx` |
| `coin.frequency.setValueAtTime(baseFreq, now + i * 0.06);` | `src/hooks/useSoundEffects.tsx` |
| `coin.frequency.setValueAtTime(baseFreq, now + i * 0.08);` | `src/hooks/useSoundEffects.tsx` |
| `coin.start(now + i * 0.06);` | `src/hooks/useSoundEffects.tsx` |
| `coin.start(now + i * 0.08);` | `src/hooks/useSoundEffects.tsx` |
| `coin.stop(now + i * 0.06 + 0.25);` | `src/hooks/useSoundEffects.tsx` |
| `coin.stop(now + i * 0.08 + 0.2);` | `src/hooks/useSoundEffects.tsx` |
| `coinFilter.Q.setValueAtTime(5, now + i * 0.08);` | `src/hooks/useSoundEffects.tsx` |
| `coinFilter.Q.setValueAtTime(8, now + i * 0.06);` | `src/hooks/useSoundEffects.tsx` |
| `coinFilter.frequency.setValueAtTime(1500, now + i * 0.08);` | `src/hooks/useSoundEffects.tsx` |
| `coinFilter.frequency.setValueAtTime(2000, now + i * 0.06);` | `src/hooks/useSoundEffects.tsx` |
| `coinGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.18);` | `src/hooks/useSoundEffects.tsx` |
| `coinGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);` | `src/hooks/useSoundEffects.tsx` |
| `coinGain.gain.linearRampToValueAtTime(0.08, now + i * 0.06 + 0.01);` | `src/hooks/useSoundEffects.tsx` |
| `* (`cancel`) devolve 100%. Nenhuma das duas é possível após estado terminal.` | `src/lib/auctionAdmin.ts` |
| `/** Cancelamento devolve 100% da caução ativa. */` | `src/lib/auctionEngine.ts` |
| `* O objetivo é comunicar urgência sem virar spam: um chefão que cai de 100%` | `src/lib/bossAlerts.ts` |
| `* para 5% em um único golpe deve gerar UM alerta (o da fase final atingida),` | `src/lib/bossAlerts.ts` |
| `/** Sugere um HP equilibrado (≈70% da capacidade projetada) para a janela. */` | `src/lib/bossBattlePlanner.ts` |
| `/** totalHp / capacity. 1 = exige 100% da capacidade projetada. */` | `src/lib/bossBattlePlanner.ts` |
| `return Math.max(50, Math.round((projection.capacity * 0.7) / 50) * 50);` | `src/lib/bossBattlePlanner.ts` |
| `* outro com 20 vitórias apenas por 100% de aproveitamento: aplica-se` | `src/lib/bossDepartmentComparison.ts` |
| `* evitando que um top-10 parcial "feche" em 100%;` | `src/lib/bossLeaderboard.ts` |
| `* 100% concentra toda a gratificação num evento raro; a maior parte dos` | `src/lib/cardSetRewards.ts` |
| `/** Sugestões rápidas de aposta (25%, 50%, 100% do teto), sem duplicatas. */` | `src/lib/dailyWager.ts` |
| `const raw = [Math.floor(max * 0.25), Math.floor(max * 0.5), max];` | `src/lib/dailyWager.ts` |
| `* Este módulo é 100% determinístico e não toca o banco: o registro da trilha é` | `src/lib/luckyWheelAudit.ts` |
| `base * 0.5,` | `src/lib/luckyWheelBudgetWhatIf.ts` |
| `base * 0.75,` | `src/lib/luckyWheelBudgetWhatIf.ts` |
| `* aposta sempre na opção favorita (probabilidade implícita 0,95) acerta 95%` | `src/lib/predictionOracle.ts` |
| `// Jitter de até 25% evita "thundering herd" quando vários clientes falham juntos.` | `src/lib/requestId.ts` |
| `const jitter = exponential * 0.25 * Math.random();` | `src/lib/requestId.ts` |
| `* A garantia existe para eliminar o pior caso motivacional (pacote 100% comum),` | `src/lib/tradingCards.ts` |
| `* - O cálculo é 100% determinístico e puro (mesma entrada => mesma saída).` | `src/lib/wagerIntegrity.ts` |
| `transition={{ duration: 0.2, delay: cell.position * 0.01 }}` | `src/pages/BingoPage.tsx` |
| `if (burn >= threshold * 0.5) return "bg-amber-500/15 text-amber-600 border-amber-500/30";` | `src/pages/BurnRate.tsx` |
| `transition={{ delay: idx * 0.04 }}` | `src/pages/CampaignHistory.tsx` |
| `// Aposta inicial sugerida: 25% do teto (ou o mínimo possível).` | `src/pages/DailyWagerPage.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/pages/DailyWagerPage.tsx` |
| `transition={{ delay: Math.min(index * 0.04, 0.4) }}` | `src/pages/DepartmentWarPage.tsx` |
| `Queima do orçamento de erros vs SLO. Alertas em 50% / 75% / 90%.` | `src/pages/ErrorBudget.tsx` |
| `const departmentChartData = departments?.map(d => ({ name: d.name, score: d.score \|\| Math.round(d.avgLevel * 10 + d.punctualityRate * 0.5), employees: d.employe …` | `src/pages/ExecutiveDashboard.tsx` |
| `// - Countable/duration metrics (lowerIsBetter): relative regression ≥ 30%.` | `src/pages/ExecutiveMonthlyReport.tsx` |
| `const DEFAULT_REL_PCT = 30; // 30% MoM em métricas contáveis/duração` | `src/pages/ExecutiveMonthlyReport.tsx` |
| `transition={{ delay: i * 0.1 }}` | `src/pages/Goals.tsx` |
| `transition={{ delay: 0.4 + i * 0.1 }}` | `src/pages/Leagues.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/pages/LearningTrails.tsx` |
| `Recompensa variável saudável: 15% a 40%` | `src/pages/LuckyWheelAdmin.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/pages/SeasonalEventDetail.tsx` |
| `delay: Math.min(index * 0.03, 0.5),` | `src/pages/SocialFeed.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/pages/TrailDetail.tsx` |
| `const technicalValue = Math.min(100, (moduleProgress?.length \|\| 0) * 10 + avgScore * 0.5);` | `src/services/competencyService.ts` |
| `(avgCompletionRate * 0.4) + (activityRate * 0.4) + (Math.min(totalTrainingHours, 100) * 0.2)` | `src/services/engagementReportsService.ts` |
| `abandoned: Math.round(abandoned * 0.3), // Estimate 30% of incomplete as truly abandoned` | `src/services/engagementReportsService.ts` |
| `const hours = Math.round(totalActivities * 0.25 * 10) / 10;` | `src/services/engagementReportsService.ts` |
| `const totalTrainingHours = Math.round((moduleCompletions \|\| 0) * 0.25);` | `src/services/engagementReportsService.ts` |
| `(goalsRate * 0.5) +` | `src/services/highPotentialService.ts` |
| `(metrics.attendanceRate * 0.5) +` | `src/services/highPotentialService.ts` |
| `(metrics.pdiProgress * 0.3) +` | `src/services/highPotentialService.ts` |
| `(metrics.taskOnTimeRate * 0.3)` | `src/services/highPotentialService.ts` |
| `(trailsRate * 0.4) +` | `src/services/highPotentialService.ts` |
| `return clamp(0.4 + evidence * 0.15, 0.4, 1);` | `src/services/predictiveFeedbackService.ts` |
| `const readinessScore = Math.round((hipo.overallScore * 0.6 + matchScore * 0.4));` | `src/services/successionService.ts` |
| `const readinessScore = Math.round(hipo.overallScore * 0.6 + matchScore * 0.4);` | `src/services/successionService.ts` |
| `score += hipo.overallScore * 0.5;` | `src/services/successionService.ts` |
| `↑ 12% este mês` | `src/stories/components/Card.stories.tsx` |
| `<span>67% concluído</span>` | `src/stories/components/Progress.stories.tsx` |
| `<span>45%</span>` | `src/stories/feedback/LoadingStates.stories.tsx` |
| `* `result.allowed` ser `undefined`, o que bloqueia 100% do tráfego com 429.` | `supabase/functions/_shared/rate-limiter.ts` |
| `// - Lenta: 6h E 30min burn >= 6x -> high (5% do budget em 6h)` | `supabase/functions/burn-rate-monitor/index.ts` |
| `// - Rápida: 1h E 5min burn >= 14.4x -> critical (2% do budget em 1h)` | `supabase/functions/burn-rate-monitor/index.ts` |
| `// Celebrate strengths if all competencies are above 70%` | `supabase/functions/competency-alerts/index.ts` |
| `const technicalValue = Math.min(100, (moduleProgress?.length \|\| 0) * 10 + avgScore * 0.5);` | `supabase/functions/competency-alerts/index.ts` |
| `// e API externa. Ao cruzar 75% ou 90%, cria um security_alert e dispara o` | `supabase/functions/error-budget-monitor/index.ts` |

## H. Parâmetros de negócio (constantes, prazos, limites)

### H.1 Constantes

| Constante | Valor | Arquivo |
|---|---|---|
| `DAYS_TO_SHOW` | `365` | `src/components/ActivityHeatmap.tsx` |
| `EXECUTIVE_REPORT_TYPE` | `"executive_report"` | `src/components/ExecutiveReportPreferenceToggle.tsx` |
| `DEFAULT_TITLE` | `'Task Gifts - Gamificação Corporativa'` | `src/components/SEOHead.tsx` |
| `ITEMS_PER_PAGE` | `10` | `src/components/admin/UsersManager.tsx` |
| `NO_REWARD` | `"none"` | `src/components/auction/AuctionAdminForm.tsx` |
| `MIN_HOURS` | `1` | `src/components/board/BoardStuckPlayersPanel.tsx` |
| `MAX_HOURS` | `720` | `src/components/board/BoardStuckPlayersPanel.tsx` |
| `DEFAULT_HOURS` | `48` | `src/components/board/BoardStuckPlayersPanel.tsx` |
| `NO_CHALLENGE` | `"__none__"` | `src/components/board/BoardTileRow.tsx` |
| `DAY` | `86` | `src/components/boss/BossBattleAdminDialog.tsx` |
| `ALL` | `"__all__"` | `src/components/boss/BossConsolidatedReportCard.tsx` |
| `ALL` | `"__all__"` | `src/components/boss/BossHistoryCard.tsx` |
| `MAX_FILE_BYTES` | `8` | `src/components/campaigns/CampaignImportDialog.tsx` |
| `AUTO_MIN_SCORE` | `0.9` | `src/components/campaigns/CampaignReconciliationPanel.tsx` |
| `MAX_GRADE` | `30` | `src/components/engagement/nr1/Nr1RiskMatrix.tsx` |
| `SIZE` | `320` | `src/components/luckywheel/LuckyWheel.tsx` |
| `FULL_TURNS` | `6` | `src/components/luckywheel/LuckyWheel.tsx` |
| `MAX_PULL` | `80` | `src/components/mobile/PullToRefresh.tsx` |
| `THRESHOLD` | `60` | `src/components/mobile/PullToRefresh.tsx` |
| `TICK_MS` | `30` | `src/components/prediction/GoalBetCountdownBadge.tsx` |
| `MAX_RECENT_SEARCHES` | `5` | `src/components/search/searchUtils.ts` |
| `ACCEPT` | `".pdf,.txt,.md"` | `src/components/trails/AICourseBuilderDialog.tsx` |
| `MAX_SIZE` | `10` | `src/components/trails/AICourseBuilderDialog.tsx` |
| `SIDEBAR_COOKIE_MAX_AGE` | `60` | `src/components/ui/sidebar.tsx` |
| `SIDEBAR_WIDTH` | `"16rem"` | `src/components/ui/sidebar.tsx` |
| `SIDEBAR_WIDTH_MOBILE` | `"18rem"` | `src/components/ui/sidebar.tsx` |
| `MOBILE_BREAKPOINT` | `768` | `src/hooks/use-mobile.tsx` |
| `TOAST_LIMIT` | `1` | `src/hooks/use-toast.ts` |
| `TOAST_REMOVE_DELAY` | `1000000` | `src/hooks/use-toast.ts` |
| `STALE` | `60` | `src/hooks/useActionPlans.ts` |
| `STALE` | `5` | `src/hooks/useEngagementDiagnostics.ts` |
| `STALE` | `5` | `src/hooks/useNr1Risk.ts` |
| `STALE` | `30` | `src/hooks/useOpinions.ts` |
| `MIN_WINDOW_MS` | `10` | `src/lib/auctionAdmin.ts` |
| `MAX_WINDOW_MS` | `30` | `src/lib/auctionAdmin.ts` |
| `MAX_TITLE_LENGTH` | `120` | `src/lib/auctionAdmin.ts` |
| `MAX_DESCRIPTION_LENGTH` | `800` | `src/lib/auctionAdmin.ts` |
| `ENDING_SOON_MS` | `24` | `src/lib/auctionAdmin.ts` |
| `LEAKED_CACHE_MAX` | `64` | `src/lib/authValidations.ts` |
| `BINGO_SIZE` | `5` | `src/lib/bingoEngine.ts` |
| `BINGO_FREE_POSITION` | `12` | `src/lib/bingoEngine.ts` |
| `BINGO_TOTAL_LINES` | `12` | `src/lib/bingoEngine.ts` |
| `BOARD_CHALLENGE_MAX_ATTEMPTS` | `2` | `src/lib/boardChallenge.ts` |
| `MIN_SAMPLE_FOR_CALIBRATION` | `5` | `src/lib/boardStats.ts` |
| `BOARD_MIN_TILES` | `5` | `src/lib/boardTrail.ts` |
| `BOARD_MAX_TILES` | `100` | `src/lib/boardTrail.ts` |
| `BOARD_DICE_FACES` | `6` | `src/lib/boardTrail.ts` |
| `BOARD_MAX_COINS_PER_MOVE` | `500` | `src/lib/boardTrail.ts` |
| `BOARD_MAX_XP_PER_MOVE` | `800` | `src/lib/boardTrail.ts` |
| `BOARD_TITLE_MAX` | `80` | `src/lib/boardTrailAuthoring.ts` |
| `BOARD_DESCRIPTION_MAX` | `240` | `src/lib/boardTrailAuthoring.ts` |
| `BOARD_LABEL_MAX` | `60` | `src/lib/boardTrailAuthoring.ts` |
| `BOARD_MIN_MOVES_PER_DAY` | `1` | `src/lib/boardTrailAuthoring.ts` |
| `BOARD_MAX_MOVES_PER_DAY` | `20` | `src/lib/boardTrailAuthoring.ts` |
| `MS_PER_DAY` | `86` | `src/lib/bossBattlePlanner.ts` |
| `NO_DEPARTMENT` | `"__none__"` | `src/lib/bossDepartmentComparison.ts` |
| `DAY_MS` | `86` | `src/lib/bossExecutiveSummary.ts` |
| `DAY_MS` | `86` | `src/lib/bossReport.ts` |
| `DAY_MS` | `86` | `src/lib/bossWinRateGoals.ts` |
| `MAX_IMPORT_ROWS` | `5000` | `src/lib/campaignImport.ts` |
| `PUSH_TYPE_CARD_PACK` | `"card_pack"` | `src/lib/cardPackNotifications.ts` |
| `PUSH_TITLE_MAX` | `120` | `src/lib/cardPackNotifications.ts` |
| `PUSH_MESSAGE_MAX` | `400` | `src/lib/cardPackNotifications.ts` |
| `CARD_PACK_MIN_SIZE` | `1` | `src/lib/cardPackTriggers.ts` |
| `CARD_PACK_MAX_SIZE` | `20` | `src/lib/cardPackTriggers.ts` |
| `PACK_SIZE_TASK_ON_TIME` | `3` | `src/lib/cardPackTriggers.ts` |
| `PACK_SIZE_TRAIL_COMPLETED` | `5` | `src/lib/cardPackTriggers.ts` |
| `PACK_SIZE_STREAK_MILESTONE` | `4` | `src/lib/cardPackTriggers.ts` |
| `STREAK_MILESTONE_STEP` | `5` | `src/lib/cardPackTriggers.ts` |
| `STREAK_MILESTONE_MAX` | `100` | `src/lib/cardPackTriggers.ts` |
| `COINS_PER_VALUE_POINT` | `5` | `src/lib/cardSetRewards.ts` |
| `XP_PER_VALUE_POINT` | `3` | `src/lib/cardSetRewards.ts` |
| `DEFAULT_BENCHMARK_INDUSTRY` | `"geral"` | `src/lib/climateBenchmark.ts` |
| `DEFAULT_BENCHMARK_COMPANY_SIZE` | `"all"` | `src/lib/climateBenchmark.ts` |
| `FINGERPRINT_LENGTH` | `32` | `src/lib/deviceFingerprint.ts` |
| `DEVICE_LABEL_MAX_LENGTH` | `40` | `src/lib/deviceLabel.ts` |
| `DEFAULT_RETRY_AFTER` | `60` | `src/lib/edgeErrors.ts` |
| `MAX_RETRY_AFTER` | `3600` | `src/lib/edgeErrors.ts` |
| `INSIGHT_MIN_RESPONDENTS` | `5` | `src/lib/engagementInsights.ts` |
| `INSIGHT_MIN_BENCHMARK_SAMPLE` | `30` | `src/lib/engagementInsights.ts` |
| `BOM` | `"\uFEFF"` | `src/lib/exportReports.ts` |
| `COUNTDOWN_URGENT_MS` | `60` | `src/lib/goalBetCountdown.ts` |
| `COUNTDOWN_SOON_MS` | `24` | `src/lib/goalBetCountdown.ts` |
| `MINUTE` | `60` | `src/lib/goalBetCountdown.ts` |
| `HOUR` | `60` | `src/lib/goalBetCountdown.ts` |
| `DAY` | `24` | `src/lib/goalBetCountdown.ts` |
| `EXPOSURE_ATTENTION_RATIO` | `0.3` | `src/lib/goalBetExposure.ts` |
| `EXPOSURE_HIGH_RATIO` | `0.6` | `src/lib/goalBetExposure.ts` |
| `GOAL_ACHIEVED_PERCENT` | `100` | `src/lib/goalBetSettlement.ts` |
| `CONCENTRATION_THRESHOLD` | `0.5` | `src/lib/goalBetStakePreview.ts` |
| `GOAL_BET_FILTER_PARAM` | `"f"` | `src/lib/goalBetUrlState.ts` |
| `NO_WINNER_LABEL` | `"Ninguém bate a meta"` | `src/lib/goalBetting.ts` |
| `LOCK_BUFFER_MS` | `24` | `src/lib/goalBetting.ts` |
| `LIGHTNING_ROUND_SECONDS` | `60` | `src/lib/lightningQuizScoring.ts` |
| `LIGHTNING_QUESTIONS_PER_ROUND` | `10` | `src/lib/lightningQuizScoring.ts` |
| `LIGHTNING_DAILY_ROUNDS` | `3` | `src/lib/lightningQuizScoring.ts` |
| `LIGHTNING_COINS_PER_CORRECT` | `5` | `src/lib/lightningQuizScoring.ts` |
| `LIGHTNING_XP_PER_CORRECT` | `8` | `src/lib/lightningQuizScoring.ts` |
| `LIGHTNING_STREAK_THRESHOLD` | `5` | `src/lib/lightningQuizScoring.ts` |
| `LIGHTNING_STREAK_COIN_BONUS` | `25` | `src/lib/lightningQuizScoring.ts` |
| `LIGHTNING_STREAK_XP_BONUS` | `20` | `src/lib/lightningQuizScoring.ts` |
| `LIGHTNING_MAX_COINS` | `200` | `src/lib/lightningQuizScoring.ts` |
| `LIGHTNING_MAX_XP` | `300` | `src/lib/lightningQuizScoring.ts` |
| `DEFAULT_COINS_PER_SPIN_BUDGET` | `30` | `src/lib/luckyWheelBudget.ts` |
| `MIN_COINS_PER_SPIN_BUDGET` | `1` | `src/lib/luckyWheelBudget.ts` |
| `MAX_COINS_PER_SPIN_BUDGET` | `10` | `src/lib/luckyWheelBudget.ts` |
| `EPSILON` | `1` | `src/lib/luckyWheelOdds.ts` |
| `TINY` | `1` | `src/lib/luckyWheelPayoutComparison.ts` |
| `DAY_MS` | `86` | `src/lib/luckyWheelPayoutHistory.ts` |
| `MEMORY_MIN_PAIRS` | `4` | `src/lib/memoryDeckAuthoring.ts` |
| `MEMORY_MAX_PAIRS_PER_DECK` | `40` | `src/lib/memoryDeckAuthoring.ts` |
| `MEMORY_TITLE_MAX` | `80` | `src/lib/memoryDeckAuthoring.ts` |
| `MEMORY_DESCRIPTION_MAX` | `240` | `src/lib/memoryDeckAuthoring.ts` |
| `MEMORY_CARD_TEXT_MAX` | `60` | `src/lib/memoryDeckAuthoring.ts` |
| `MEMORY_COINS_PER_PAIR` | `10` | `src/lib/memoryGame.ts` |
| `MEMORY_XP_PER_PAIR` | `15` | `src/lib/memoryGame.ts` |
| `MEMORY_PERFECT_COIN_BONUS` | `30` | `src/lib/memoryGame.ts` |
| `MEMORY_PERFECT_XP_BONUS` | `40` | `src/lib/memoryGame.ts` |
| `MEMORY_SPEED_COIN_BONUS` | `20` | `src/lib/memoryGame.ts` |
| `MEMORY_SPEED_XP_BONUS` | `25` | `src/lib/memoryGame.ts` |
| `MEMORY_MAX_COINS` | `200` | `src/lib/memoryGame.ts` |
| `MEMORY_MAX_XP` | `300` | `src/lib/memoryGame.ts` |
| `MEMORY_PERFECT_MOVE_FACTOR` | `1.5` | `src/lib/memoryGame.ts` |
| `MEMORY_SPEED_MS_PER_PAIR` | `6` | `src/lib/memoryGame.ts` |
| `MEMORY_DAILY_REWARDED_SESSIONS` | `3` | `src/lib/memoryGame.ts` |
| `OPINION_CONTENT_MAX` | `4000` | `src/lib/opinionChannel.ts` |
| `OPINION_SUBJECT_MAX` | `160` | `src/lib/opinionChannel.ts` |
| `OPINION_CONTENT_MIN` | `10` | `src/lib/opinionChannel.ts` |
| `ANONYMOUS_LABEL` | `"Colaborador anônimo"` | `src/lib/opinionChannel.ts` |
| `UNKNOWN_AUTHOR_LABEL` | `"Colaborador"` | `src/lib/opinionChannel.ts` |
| `OPINION_MIN_AGGREGATE` | `5` | `src/lib/opinionChannel.ts` |
| `RESUME_TTL_MS` | `30` | `src/lib/playerResume.ts` |
| `MIN_TITLE_LENGTH` | `5` | `src/lib/predictionAdmin.ts` |
| `MAX_TITLE_LENGTH` | `140` | `src/lib/predictionAdmin.ts` |
| `MAX_DESCRIPTION_LENGTH` | `800` | `src/lib/predictionAdmin.ts` |
| `MIN_OPTIONS` | `2` | `src/lib/predictionAdmin.ts` |
| `MAX_OPTIONS` | `6` | `src/lib/predictionAdmin.ts` |
| `MAX_OPTION_LENGTH` | `60` | `src/lib/predictionAdmin.ts` |
| `MIN_WINDOW_MS` | `15` | `src/lib/predictionAdmin.ts` |
| `MAX_WINDOW_MS` | `60` | `src/lib/predictionAdmin.ts` |
| `MAX_RAKE_BPS` | `2` | `src/lib/predictionAdmin.ts` |
| `LOCKING_SOON_MS` | `24` | `src/lib/predictionAdmin.ts` |
| `MAX_BUCKETS` | `60` | `src/lib/predictionOddsHistory.ts` |
| `DEFAULT_SHRINKAGE_COINS` | `500` | `src/lib/predictionOracle.ts` |
| `DEFAULT_MIN_MARKETS` | `3` | `src/lib/predictionOracle.ts` |
| `PRECISION` | `1` | `src/lib/predictionOracle.ts` |
| `LOCK_GRACE_MS` | `15` | `src/lib/predictionWatchdog.ts` |
| `SETTLEMENT_GRACE_MS` | `24` | `src/lib/predictionWatchdog.ts` |
| `HOUR_MS` | `3` | `src/lib/predictionWatchdog.ts` |
| `MAX_SCORE` | `100` | `src/lib/purchaseRisk.ts` |
| `MIN_SCORE` | `0` | `src/lib/purchaseRisk.ts` |
| `DUAL_APPROVAL_THRESHOLD` | `70` | `src/lib/purchaseRisk.ts` |
| `STALE_DEVICE_DAYS` | `30` | `src/lib/pushDevices.ts` |
| `MAX_PUSH_ATTEMPTS` | `3` | `src/lib/pushOutbox.ts` |
| `SEQUENCE_COINS_PER_CORRECT` | `8` | `src/lib/sequenceGame.ts` |
| `SEQUENCE_XP_PER_CORRECT` | `12` | `src/lib/sequenceGame.ts` |
| `SEQUENCE_PERFECT_COIN_BONUS` | `40` | `src/lib/sequenceGame.ts` |
| `SEQUENCE_PERFECT_XP_BONUS` | `60` | `src/lib/sequenceGame.ts` |
| `SEQUENCE_MAX_COINS` | `150` | `src/lib/sequenceGame.ts` |
| `SEQUENCE_MAX_XP` | `250` | `src/lib/sequenceGame.ts` |
| `SEQUENCE_DAILY_REWARDED_ATTEMPTS` | `3` | `src/lib/sequenceGame.ts` |
| `SEQUENCE_MIN_STEPS` | `3` | `src/lib/sequenceGame.ts` |
| `SEQUENCE_MAX_STEPS` | `20` | `src/lib/sequenceGame.ts` |
| `SOP_MIN_STEPS` | `3` | `src/lib/sequenceProcedureAuthoring.ts` |
| `SOP_MAX_STEPS` | `20` | `src/lib/sequenceProcedureAuthoring.ts` |
| `SOP_TITLE_MAX` | `120` | `src/lib/sequenceProcedureAuthoring.ts` |
| `SOP_DESCRIPTION_MAX` | `400` | `src/lib/sequenceProcedureAuthoring.ts` |
| `SOP_LABEL_MAX` | `160` | `src/lib/sequenceProcedureAuthoring.ts` |
| `SOP_HINT_MAX` | `240` | `src/lib/sequenceProcedureAuthoring.ts` |
| `MAX_SLA_MINUTES` | `43` | `src/lib/slaTargets.ts` |
| `MIN_SLA_MINUTES` | `1` | `src/lib/slaTargets.ts` |
| `MIN_BRACKET_PARTICIPANTS` | `2` | `src/lib/tournamentBracket.ts` |
| `MAX_BRACKET_PARTICIPANTS` | `256` | `src/lib/tournamentBracket.ts` |
| `PACK_SIZE` | `5` | `src/lib/tradingCards.ts` |
| `PACK_GUARANTEED_RARITY` | `"rare"` | `src/lib/tradingCards.ts` |
| `TRADE_VALUE_RATIO` | `3` | `src/lib/tradingCards.ts` |
| `WAGER_QUESTION_MIN` | `5` | `src/lib/wagerAuthoring.ts` |
| `WAGER_QUESTION_MAX` | `500` | `src/lib/wagerAuthoring.ts` |
| `WAGER_OPTION_MAX` | `160` | `src/lib/wagerAuthoring.ts` |
| `WAGER_EXPLANATION_MAX` | `500` | `src/lib/wagerAuthoring.ts` |
| `WAGER_MIN_OPTIONS` | `2` | `src/lib/wagerAuthoring.ts` |
| `WAGER_MAX_OPTIONS` | `6` | `src/lib/wagerAuthoring.ts` |
| `WAGER_MIN_MULTIPLIER` | `1.1` | `src/lib/wagerAuthoring.ts` |
| `WAGER_MAX_MULTIPLIER` | `5` | `src/lib/wagerAuthoring.ts` |
| `WAGER_MIN_STAKE` | `10` | `src/lib/wagerAuthoring.ts` |
| `WAGER_MAX_STAKE` | `1000` | `src/lib/wagerAuthoring.ts` |
| `WAGER_IMPORT_MAX_ROWS` | `200` | `src/lib/wagerBulkImport.ts` |
| `DELIMITER` | `";"` | `src/lib/wagerIntegrityExport.ts` |
| `DELIMITER` | `";"` | `src/lib/wagerScheduleExport.ts` |
| `MAX_CONTRIBUTION_AMOUNT` | `1` | `src/lib/warAutoHooks.ts` |
| `MAX_ITEMS` | `100` | `src/lib/warFeed.ts` |
| `THREAT_RATIO` | `0.05` | `src/lib/warLeadership.ts` |
| `THREAT_MIN_SCORE` | `1` | `src/lib/warLeadership.ts` |
| `BOM` | `"\uFEFF"` | `src/pages/AdminTelemetria.tsx` |
| `NEW_TRAIL` | `"__new__"` | `src/pages/BoardTrailAdminPage.tsx` |
| `NO_DEPARTMENT` | `"__none__"` | `src/pages/BoardTrailAdminPage.tsx` |
| `ALL_DEPARTMENTS` | `"all"` | `src/pages/ClimateDiagnostics.tsx` |
| `DEFAULT_REL_PCT` | `30` | `src/pages/ExecutiveMonthlyReport.tsx` |
| `DEFAULT_PP` | `15` | `src/pages/ExecutiveMonthlyReport.tsx` |
| `FLIP_BACK_DELAY_MS` | `900` | `src/pages/MemoryGamePage.tsx` |
| `ALL_DEPARTMENTS` | `"all"` | `src/pages/Nr1Risks.tsx` |
| `ALL_STATUS` | `"all"` | `src/pages/OpinionChannel.tsx` |
| `NO_DEPARTMENT` | `"__none__"` | `src/pages/SequenceProcedureAdminPage.tsx` |
| `HEALTH_THRESHOLD` | `90` | `src/pages/WebhooksAdmin.tsx` |
| `HEALTH_MIN_SAMPLE` | `5` | `src/pages/WebhooksAdmin.tsx` |
| `BUCKET` | `"course-uploads"` | `src/services/aiCourseBuilderService.ts` |
| `ROTATION_MAX_AGE_DAYS` | `90` | `src/services/apiKeysService.ts` |
| `RESULT_PAGE_SIZE` | `1000` | `src/services/campaignImportService.ts` |
| `MIN_RESPONDENTS` | `5` | `src/services/engagementDiagnosticsService.ts` |
| `DECK_COLUMNS` | `"id, title, description, department_id, is_active"` | `src/services/memoryGameService.ts` |
| `CANDIDATE_COLUMNS` | `"id, display_name, avatar_url, level, xp"` | `src/services/mentorshipService.ts` |
| `MAX_BUDGET` | `10` | `src/services/wagerBudgetService.ts` |
| `MAX_PLAYERS` | `100` | `src/services/wagerBudgetService.ts` |
| `VALIDATION_ERROR_STATUS` | `422` | `supabase/functions/_shared/validation.ts` |
| `CHALLENGE` | `"Y2hhbGxlbmdlLWRlLXRlc3RlLTEyMzQ1Njc4OTA"` | `supabase/functions/_shared/webauthn_test.ts` |
| `REPLAY_WINDOW_SECONDS` | `300` | `supabase/functions/_shared/webhookSecurity.ts` |
| `STALE_PROCESSING_SECONDS` | `300` | `supabase/functions/_shared/webhookSecurity.ts` |
| `WEBHOOK_CURRENT_VERSION` | `"v2"` | `supabase/functions/_shared/contracts/webhook-dispatcher.ts` |
| `UUID_A` | `"8d6f2b1e-3c4a-4e5f-9a7b-1c2d3e4f5a6b"` | `supabase/functions/_shared/contracts/_fixtures/types.ts` |
| `UUID_B` | `"0f1e2d3c-4b5a-4968-8777-66554433aabb"` | `supabase/functions/_shared/contracts/_fixtures/types.ts` |
| `BURN_HIGH` | `75` | `supabase/functions/error-budget-monitor/index.ts` |
| `BURN_CRITICAL` | `90` | `supabase/functions/error-budget-monitor/index.ts` |
| `MAX_BODY_BYTES` | `16` | `supabase/functions/passkey-auth/index.ts` |
| `CHALLENGE_TTL_MS` | `5` | `supabase/functions/passkey-auth/index.ts` |
| `VERIFY_LIMIT_PER_CREDENTIAL` | `15` | `supabase/functions/passkey-auth/index.ts` |
| `TYPE` | `"security_device_revoked"` | `supabase/functions/push-device-revoked/index.ts` |
| `BATCH_SIZE` | `100` | `supabase/functions/push-outbox-dispatcher/index.ts` |
| `MAX_ATTEMPTS` | `3` | `supabase/functions/push-outbox-dispatcher/index.ts` |
| `BASE_BACKOFF_MS` | `400` | `supabase/functions/push-outbox-dispatcher/index.ts` |
| `MAX_BACKOFF_MS` | `5000` | `supabase/functions/push-outbox-dispatcher/index.ts` |
| `MAX_SCORE` | `100` | `supabase/functions/reward-approval-review/risk.ts` |
| `MIN_SCORE` | `0` | `supabase/functions/reward-approval-review/risk.ts` |
| `DUAL_APPROVAL_THRESHOLD` | `70` | `supabase/functions/reward-approval-review/risk.ts` |
| `MAX_ATTEMPTS` | `3` | `supabase/functions/send-campaign-push/index.ts` |
| `BASE_BACKOFF_MS` | `500` | `supabase/functions/send-campaign-push/index.ts` |
| `MAX_BACKOFF_MS` | `8000` | `supabase/functions/send-campaign-push/index.ts` |

### H.2 Prazos, expirações e janelas de tempo

| Trecho | Arquivo |
|---|---|
| `setTimeout(() => setCopiedIndex(null), 2000);` | `src/components/AICoachDialog.tsx` |
| `const timer = setTimeout(onClose, 5000);` | `src/components/AchievementSystem.tsx` |
| `const timer = setTimeout(onClose, 6000);` | `src/components/AchievementSystem.tsx` |
| `checkDate = subDays(checkDate, 1);` | `src/components/ActivityHeatmap.tsx` |
| `const since = subDays(new Date(), 364).toISOString();` | `src/components/ActivityHeatmap.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/components/ActivityHeatmap.tsx` |
| `const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));` | `src/components/AttendanceCalendar.tsx` |
| `const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));` | `src/components/AttendanceCalendar.tsx` |
| `date: new Date(monthStart.getTime() - (startDayOfWeek - i) * 24 * 60 * 60 * 1000),` | `src/components/AttendanceCalendar.tsx` |
| `const timer = setTimeout(() => { setShowBurst(false); setParticles([]); onComplete?.(); }, 3000);` | `src/components/CelebrationEffect.tsx` |
| `return Math.floor((midnight.getTime() - now.getTime()) / (1000 * 60 * 60));` | `src/components/DailyQuests.tsx` |
| `days: Math.floor(difference / (1000 * 60 * 60 * 24)),` | `src/components/FlashSalesBanner.tsx` |
| `hours: Math.floor((difference / (1000 * 60 * 60)) % 24),` | `src/components/FlashSalesBanner.tsx` |
| `const oneMonthAgo = subMonths(new Date(), 1);` | `src/components/KudosRanking.tsx` |
| `const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);` | `src/components/PWAInstallPrompt.tsx` |
| `const timer = setTimeout(() => { setShowPrompt(true); }, 20000);` | `src/components/PWAInstallPrompt.tsx` |
| `cutoffDate = subDays(now, 7);` | `src/components/ProfileKudosSection.tsx` |
| `cutoffDate = subMonths(now, 1);` | `src/components/ProfileKudosSection.tsx` |
| `cutoffDate = subMonths(now, 3);` | `src/components/ProfileKudosSection.tsx` |
| `const previousWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });` | `src/components/WeeklyPerformanceComparison.tsx` |
| `const previousWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });` | `src/components/WeeklyPerformanceComparison.tsx` |
| `staleTime: 10 * 60 * 1000,` | `src/components/WeeklyPerformanceComparison.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/components/WeeklyPerformanceComparison.tsx` |
| `setTimeout(() => { document.body.removeChild(announcement); }, 1000);` | `src/components/accessibility/AccessibilityProvider.tsx` |
| `const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });` | `src/components/admin/AdminMetricsDashboard.tsx` |
| `const months = eachMonthOfInterval({ start: subMonths(new Date(), 5), end: new Date() });` | `src/components/admin/AdminMetricsDashboard.tsx` |
| `window.setTimeout(() => setCopied(null), 2000);` | `src/components/admin/IssuedCredentialDialog.tsx` |
| `const [endDate, setEndDate] = useState(format(addDays(new Date(), 7), "yyyy-MM-dd"));` | `src/components/admin/enps/ENPSSubComponents.tsx` |
| `setTimeout(() => setCopiedBackup(false), 2000);` | `src/components/auth/TwoFactorSetup.tsx` |
| `setTimeout(() => setCopiedSecret(false), 2000);` | `src/components/auth/TwoFactorSetup.tsx` |
| `setTimeout(() => URL.revokeObjectURL(url), 1000);` | `src/components/boss/BossDepartmentComparisonCard.tsx` |
| `setTimeout(() => URL.revokeObjectURL(url), 1000);` | `src/components/boss/BossHistoryCard.tsx` |
| `Date.now() - new Date(campaign.created_at).getTime() < 48 * 60 * 60 * 1000;` | `src/components/campaigns/CampaignCard.tsx` |
| `: Date.now() - Number(period) * 24 * 60 * 60 * 1000;` | `src/components/campaigns/CampaignProgressChart.tsx` |
| `setTimeout(() => setCopied(false), 2000);` | `src/components/certifications/CertificateActions.tsx` |
| `const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);` | `src/components/climate/ClimateSurveyForm.tsx` |
| `const timer = setTimeout(() => { setParticles([]); onComplete?.(); }, 2000);` | `src/components/effects/AnimatedXPParticles.tsx` |
| `const timer = setTimeout(() => { setShow(false); onComplete?.(); }, 1500);` | `src/components/effects/ComboExplosion.tsx` |
| `const timer = setTimeout(() => { setShowGlow(false); setParticles([]); onComplete?.(); }, 2500);` | `src/components/effects/MiniConfetti.tsx` |
| `const timer3 = setTimeout(() => setStage(3), 1500);` | `src/components/effects/WeeklyChallengeVictory.tsx` |
| `const timer4 = setTimeout(() => setStage(4), 2200);` | `src/components/effects/WeeklyChallengeVictory.tsx` |
| `const daysSinceActive = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24));` | `src/components/manager/ManagerComponents.tsx` |
| `const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);` | `src/components/quiz/MillionaireQuiz.tsx` |
| `staleTime: 10 * 60 * 1000,` | `src/components/security/AlertHeatmap.tsx` |
| `ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),` | `src/components/shop-admin/PromotionFormDialog.tsx` |
| `const timer = setTimeout(() => setXpDiff(null), 2000);` | `src/components/sidebar/SidebarUserStats.tsx` |
| `const hideTimer = setTimeout(() => setVisible(false), 5000);` | `src/components/ui/command-trigger.tsx` |
| `const showTimer = setTimeout(() => setVisible(true), 30000);` | `src/components/ui/command-trigger.tsx` |
| `setTimeout(() => { onClaimReward?.(day); setClaimingDay(null); setTimeout(() => setShowConfetti(false), 2000);` | `src/components/ui/daily-login-bonus.tsx` |
| `setTimeout(() => setShowCelebration(false), 3000);` | `src/components/ui/streak-tracker.tsx` |
| `deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),` | `src/components/ui/team-challenges.tsx` |
| `deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),` | `src/components/ui/team-challenges.tsx` |
| `return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));` | `src/components/ui/team-challenges.tsx` |
| `refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes` | `src/hooks/useAdminAlerts.ts` |
| `staleTime: 5 * 60 * 1000, // 5 minutes` | `src/hooks/useAdminAlerts.ts` |
| `await new Promise(resolve => setTimeout(resolve, 1500));` | `src/hooks/useBehavioralBadges.ts` |
| `const initialCheck = setTimeout(() => { checkBadgesMutation.mutate(); }, 3000);` | `src/hooks/useBehavioralBadges.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useBoardTrail.ts` |
| `if (!lastAnalysis \|\| now - parseInt(lastAnalysis) > 4 * 60 * 60 * 1000) {` | `src/hooks/useCompetencyAlerts.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useContinuousEngagement.ts` |
| `staleTime: 2 * 60 * 1000,` | `src/hooks/useDailyWager.ts` |
| `const STALE = 5 * 60 * 1000;` | `src/hooks/useEngagementDiagnostics.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useEngagementReports.ts` |
| `staleTime: 5 * 60 * 1000, // 5 minutes` | `src/hooks/useEngagementReports.ts` |
| `refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes` | `src/hooks/useExecutiveMetrics.ts` |
| `staleTime: 10 * 60 * 1000, // 10 minutes` | `src/hooks/useExecutiveMetrics.ts` |
| `staleTime: 5 * 60 * 1000, // 5 minutes` | `src/hooks/useExecutiveMetrics.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useHighPotentials.ts` |
| `staleTime: 10 * 60 * 1000, // 10 minutes` | `src/hooks/useHighPotentials.ts` |
| `const timeout = setTimeout(() => { setGPressed(false); }, 1500);` | `src/hooks/useKeyboardShortcuts.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useLuckyWheel.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useMemoryGame.ts` |
| `const STALE = 5 * 60 * 1000;` | `src/hooks/useNr1Risk.ts` |
| `staleTime: 5 * 60 * 1000, // 5 minutes` | `src/hooks/useOneOnOnePreparation.ts` |
| `const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);` | `src/hooks/usePDIAlerts.ts` |
| `const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);` | `src/hooks/usePDIAlerts.ts` |
| `refetchInterval: 5 * 60 * 1000,` | `src/hooks/usePDIAlerts.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useQuizQuestions.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useSequenceGame.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useSuccession.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useSuccession.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useWagerAdmin.ts` |
| `export const ENDING_SOON_MS = 24 * 60 * 60 * 1000;` | `src/lib/auctionAdmin.ts` |
| `export const MAX_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;` | `src/lib/auctionAdmin.ts` |
| `export const MIN_WINDOW_MS = 10 * 60 * 1000;` | `src/lib/auctionAdmin.ts` |
| `const timeoutId = setTimeout(() => controller.abort(), 4000);` | `src/lib/authValidations.ts` |
| `setTimeout(() => URL.revokeObjectURL(url), 4000);` | `src/lib/certificatePdf.ts` |
| `MAX_DURATION_MS: 365 * 24 * 60 * 60 * 1000, // 1 ano` | `src/lib/departmentWarConfig.ts` |
| `MIN_DURATION_MS: 60 * 60 * 1000, // 1 hora` | `src/lib/departmentWarConfig.ts` |
| `const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);` | `src/lib/departmentWarConfig.ts` |
| `export const COUNTDOWN_SOON_MS = 24 * 60 * 60 * 1000;` | `src/lib/goalBetCountdown.ts` |
| `export const COUNTDOWN_URGENT_MS = 60 * 60 * 1000;` | `src/lib/goalBetCountdown.ts` |
| `const fallback = now + 7 * 24 * 60 * 60 * 1000;` | `src/lib/goalBetting.ts` |
| `export const LOCK_BUFFER_MS = 24 * 60 * 60 * 1000;` | `src/lib/goalBetting.ts` |
| `export const RESUME_TTL_MS = 30 * 24 * 60 * 60 * 1000;` | `src/lib/playerResume.ts` |
| `export const LOCKING_SOON_MS = 24 * 60 * 60 * 1000;` | `src/lib/predictionAdmin.ts` |
| `export const MAX_WINDOW_MS = 60 * 24 * 60 * 60 * 1000;` | `src/lib/predictionAdmin.ts` |
| `export const MIN_WINDOW_MS = 15 * 60 * 1000;` | `src/lib/predictionAdmin.ts` |
| `export const LOCK_GRACE_MS = 15 * 60 * 1000;` | `src/lib/predictionWatchdog.ts` |
| `export const SETTLEMENT_GRACE_MS = 24 * 60 * 60 * 1000;` | `src/lib/predictionWatchdog.ts` |
| `const staleBefore = nowTs - STALE_DEVICE_DAYS * 24 * 60 * 60 * 1000;` | `src/lib/pushDevices.ts` |
| `case "1h": return new Date(now.getTime() - 60 * 60 * 1000).toISOString();` | `src/pages/AdminTelemetria.tsx` |
| `case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();` | `src/pages/AdminTelemetria.tsx` |
| `case "6h": return new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();` | `src/pages/AdminTelemetria.tsx` |
| `case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();` | `src/pages/AdminTelemetria.tsx` |
| `case "custom": return customStart ? customStart.toISOString() : new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();` | `src/pages/AdminTelemetria.tsx` |
| `const cleanupThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();` | `src/pages/AdminTelemetria.tsx` |
| `const t2 = window.setTimeout(() => setFlashActive(false), 2400);` | `src/pages/Postmortems.tsx` |
| `setTimeout(() => navigate("/manager"), 1500);` | `src/pages/QuestBuilder.tsx` |
| `const days = eachDayOfInterval({ start: subDays(now, 6), end: now });` | `src/pages/RealTimeAnalytics.tsx` |
| `const hours = eachHourOfInterval({ start: subDays(now, 1), end: now });` | `src/pages/RealTimeAnalytics.tsx` |
| `setTimeout(async () => { await supabase.auth.signOut(); navigate("/auth"); }, 3000);` | `src/pages/ResetPassword.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/pages/SecurityDigests.tsx` |
| `const t = setTimeout(() => setHighlighted(null), 2500);` | `src/pages/SecurityRunbook.tsx` |
| `staleTime: 10 * 60 * 1000,` | `src/pages/SecurityRunbook.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/pages/SecurityRunbook.tsx` |
| `const monthAgo = subDays(now, 30);` | `src/pages/SocialFeed.tsx` |
| `const weekAgo = subDays(now, 7);` | `src/pages/SocialFeed.tsx` |
| `const cutoff = Date.now() - 24 * 60 * 60 * 1000;` | `src/pages/WebhookSubscriptionDetail.tsx` |
| `setTimeout(() => refetch(), 1500);` | `src/pages/WebhookSubscriptionDetail.tsx` |
| `setTimeout(() => setCopied(false), 2000);` | `src/pages/WebhookSubscriptionNew.tsx` |
| `(new Date(uc.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)` | `src/services/certificationsService.ts` |
| `? new Date(Date.now() + (cert.validity_months \|\| 0) * 30 * 24 * 60 * 60 * 1000).toISOString()` | `src/services/certificationsService.ts` |
| `? new Date(Date.now() + cert.validity_months * 30 * 24 * 60 * 60 * 1000).toISOString()` | `src/services/certificationsService.ts` |
| `const endsAt = new Date(now.getTime() + duel.duration_hours * 60 * 60 * 1000);` | `src/services/duelsService.ts` |
| `.gte("check_in", subMonths(new Date(), 1).toISOString());` | `src/services/engagementReportsService.ts` |
| `const avgTimeHours = avgTimeMs / (1000 * 60 * 60);` | `src/services/engagementReportsService.ts` |
| `return acc + diff / (1000 * 60 * 60);` | `src/services/engagementReportsService.ts` |
| `const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000)` | `src/services/luckyWheelService.ts` |
| `const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();` | `src/services/luckyWheelService.ts` |
| `(new Date().getTime() - new Date(context.lastCheckin.date).getTime()) / (1000 * 60 * 60 * 24)` | `src/services/oneOnOnePreparationService.ts` |
| `const elapsedDays = (now.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24);` | `src/services/oneOnOnePreparationService.ts` |
| `const totalDays = (quarterEnd.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24);` | `src/services/oneOnOnePreparationService.ts` |
| `due_date: new Date(Date.now() + (30 + index * 15) * 24 * 60 * 60 * 1000).toISOString(), // Staggered deadlines` | `src/services/pdiGeneratorService.ts` |
| `target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days` | `src/services/pdiGeneratorService.ts` |
| `tenure = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365));` | `src/services/successionService.ts` |
| `timeout: 60000,` | `src/services/webauthnService.ts` |
| `await new Promise((resolve) => setTimeout(resolve, 2000));` | `src/stories/mobile/MobileComponents.stories.tsx` |
| `timeout: 60000,` | `supabase/functions/_shared/contracts/_fixtures/responses.ts` |
| `{ nome: "challenge sem rpId", payload: { ok: true, challenge: "abc", allowCredentials: [], timeout: 60000, userVerification: "required" } },` | `supabase/functions/_shared/contracts/_fixtures/responses.ts` |
| `const daysInactive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));` | `supabase/functions/churn-prediction/index.ts` |
| `const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);` | `supabase/functions/churn-prediction/index.ts` |
| `const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);` | `supabase/functions/churn-prediction/index.ts` |
| `.gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())` | `supabase/functions/competency-alerts/index.ts` |
| `const CHALLENGE_TTL_MS = 5 * 60 * 1000;` | `supabase/functions/passkey-auth/index.ts` |
| `timeout: 60_000,` | `supabase/functions/passkey-auth/index.ts` |
| `const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();` | `supabase/functions/security-weekly-digest/index.ts` |
| `WHERE created_at < now() - interval '90 days';` | `supabase/migrations/20260520162624_05dce903-e1a2-49e8-93a1-64ec4f6421b4.sql` |
| `WHERE processed = true AND created_at < now() - interval '30 days';` | `supabase/migrations/20260520162624_05dce903-e1a2-49e8-93a1-64ec4f6421b4.sql` |
| `expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')` | `supabase/migrations/20260520163657_25dfdf55-387e-4b6a-87a8-b1fb2491ce04.sql` |
| `AND l.created_at >= now() - interval '24 hours'` | `supabase/migrations/20260712194450_b1a7376c-498c-4f65-80ba-e784a24aa80b.sql` |
| `date_trunc('hour', now() - interval '23 hours'),` | `supabase/migrations/20260712194450_b1a7376c-498c-4f65-80ba-e784a24aa80b.sql` |
| `interval '1 hour'` | `supabase/migrations/20260712194450_b1a7376c-498c-4f65-80ba-e784a24aa80b.sql` |
| `AND l.created_at >= now() - interval '1 hour'` | `supabase/migrations/20260712194608_bed9b5c6-221d-45ce-a0e5-cedd4aa2cf57.sql` |
| `AND l.created_at <= f.created_at + interval '6 hours') AS recovered_at,` | `supabase/migrations/20260712202813_38016c62-951f-49b3-9f97-c150ff3038a7.sql` |
| `AND l.created_at >= now() - interval '7 days'` | `supabase/migrations/20260712202813_38016c62-951f-49b3-9f97-c150ff3038a7.sql` |
| `WHERE created_at >= now() - interval '7 days' AND NOT success` | `supabase/migrations/20260712202813_38016c62-951f-49b3-9f97-c150ff3038a7.sql` |
| `WHERE created_at >= now() - interval '7 days';` | `supabase/migrations/20260712202813_38016c62-951f-49b3-9f97-c150ff3038a7.sql` |
| `WHERE l.created_at >= now() - interval '7 days'` | `supabase/migrations/20260712202813_38016c62-951f-49b3-9f97-c150ff3038a7.sql` |
| `date_trunc('day', now() - interval '6 days'),` | `supabase/migrations/20260712202813_38016c62-951f-49b3-9f97-c150ff3038a7.sql` |
| `interval '1 day'` | `supabase/migrations/20260712202813_38016c62-951f-49b3-9f97-c150ff3038a7.sql` |
| `WHERE created_at >= now() - (v_hours * interval '1 hour');` | `supabase/migrations/20260712203117_fac39bdd-c966-4e9e-96f4-feee404f2a82.sql` |
| `WHERE l.created_at >= now() - (v_hours * interval '1 hour')` | `supabase/migrations/20260712203117_fac39bdd-c966-4e9e-96f4-feee404f2a82.sql` |
| `interval '1 hour'` | `supabase/migrations/20260712214816_6fc5c315-ea1a-4b7e-90af-4cd2960bd17a.sql` |
| `WHERE created_at >= now() - interval '30 days'` | `supabase/migrations/20260712215914_4eec2b74-d615-4e45-8655-fc7c8b022d10.sql` |
| `WHERE created_at >= now() - interval '30 days';` | `supabase/migrations/20260712215914_4eec2b74-d615-4e45-8655-fc7c8b022d10.sql` |
| `date_trunc('day', now() - interval '29 days'),` | `supabase/migrations/20260712215914_4eec2b74-d615-4e45-8655-fc7c8b022d10.sql` |
| `interval '1 day'` | `supabase/migrations/20260712215914_4eec2b74-d615-4e45-8655-fc7c8b022d10.sql` |
| `v_end := v_start + interval '1 month';` | `supabase/migrations/20260712222455_cdcbc232-1f35-4c6c-9c2c-0e4bf903e241.sql` |
| `v_start := date_trunc('month', now()) - interval '1 month';` | `supabase/migrations/20260712222455_cdcbc232-1f35-4c6c-9c2c-0e4bf903e241.sql` |
| `VALUES (v_user, v_key, v_ids, now() + interval '60 seconds')` | `supabase/migrations/20260727221909_f26719a2-a70b-4f38-ab93-5bda56de8d26.sql` |
| `VALUES (v_user, v_key, v_ids, now() + interval '60 seconds')` | `supabase/migrations/20260727221910_f26719a2_lightning_relampago_schema.sql` |
| `date_trunc('month', now()) + interval '1 month' - interval '1 second')` | `supabase/migrations/20260727222655_16b4a067-5707-4794-9cba-be5694907056.sql` |
| `IF v_duration < interval '1 hour' THEN` | `supabase/migrations/20260727231219_b4770959-c004-447c-b266-91453472af70.sql` |
| `IF v_duration > interval '365 days' THEN` | `supabase/migrations/20260727231219_b4770959-c004-447c-b266-91453472af70.sql` |
| `AND updated_at < now() - interval '10 minutes';` | `supabase/migrations/20260728112223_9f86e736-fd1e-4ab5-a812-9fc5f1f6f009.sql` |
| `OR (p_include_stuck AND status = 'processing' AND updated_at < now() - interval '5 minutes')` | `supabase/migrations/20260728112548_6cc50017-79db-4fda-a384-b5af19cb4406.sql` |
| `v_stuck_cutoff := now() - interval '5 minutes';` | `supabase/migrations/20260728112548_6cc50017-79db-4fda-a384-b5af19cb4406.sql` |
| `AND created_at > now() - interval '1 hour'` | `supabase/migrations/20260728112815_fd49db87-3ae3-448d-b394-dfe7f248adae.sql` |
| `DELETE FROM public.push_outbox_health_snapshots WHERE created_at < now() - interval '30 days';` | `supabase/migrations/20260728112815_fd49db87-3ae3-448d-b394-dfe7f248adae.sql` |
| `v_since timestamptz := now() - interval '24 hours';` | `supabase/migrations/20260728112815_fd49db87-3ae3-448d-b394-dfe7f248adae.sql` |
| `v_stuck_cutoff timestamptz := now() - interval '5 minutes';` | `supabase/migrations/20260728112815_fd49db87-3ae3-448d-b394-dfe7f248adae.sql` |
| `IF p_locks_at IS NULL OR p_locks_at <= now() + interval '15 minutes' THEN` | `supabase/migrations/20260728114514_7f6f6bd8-8c0c-4762-9f48-2e4474ed0b2b.sql` |
| `AND started_at > now() - interval '2 hours'` | `supabase/migrations/20260728155537_900a1488-1655-4e15-b4be-26a2b8676126.sql` |
| `AND COALESCE(eak.secret_last_rotated_at, eak.created_at) < now() - interval '90 days'` | `supabase/migrations/20260728210216_01d79f58-57ea-48d9-a859-ef3ddf891190.sql` |
| `AND sa.created_at > now() - interval '7 days'` | `supabase/migrations/20260728210216_01d79f58-57ea-48d9-a859-ef3ddf891190.sql` |
| `VALUES (v_user, v_key, v_ids, now() + interval '60 seconds')` | `supabase/migrations/20260806230000_lightning_relampago_rpcs_only.sql` |
| `ELSIF (now() - v_last) >= interval '12 hours' THEN` | `supabase/migrations/20261218000000_profiles_economia_rpcs.sql` |
| `IF v_last IS NULL OR (now() - v_last) > interval '48 hours' THEN` | `supabase/migrations/20261218000000_profiles_economia_rpcs.sql` |
| `AND l.created_at >= now() - interval '1 hour'` | `supabase/migrations/20261220000000_fix_sre_rpcs_and_dispatch_trigger.sql` |
| `WHERE created_at >= now() - interval '30 days'` | `supabase/migrations/20261220000000_fix_sre_rpcs_and_dispatch_trigger.sql` |
| `WHERE created_at >= now() - interval '30 days';` | `supabase/migrations/20261220000000_fix_sre_rpcs_and_dispatch_trigger.sql` |
| `date_trunc('day', now() - interval '29 days'),` | `supabase/migrations/20261220000000_fix_sre_rpcs_and_dispatch_trigger.sql` |
| `interval '1 day'` | `supabase/migrations/20261220000000_fix_sre_rpcs_and_dispatch_trigger.sql` |
| `-- por `now() + interval '7 days'` empurrava o primeiro lembrete para o dia` | `supabase/migrations/20261224100000_climate_survey_cycle_jobs.sql` |

### H.3 Limites de paginação

| Limite | Arquivo |
|---|---|
| 100 | `src/components/admin/AdminChangeHistory.tsx` |
| 500 | `src/components/campaigns/CampaignProgressChart.tsx` |
| 200 | `src/components/security/LoginAttemptsPanel.tsx` |
| 100 | `src/components/security/SecurityAlertsPanel.tsx` |
| 100 | `src/components/security/SessionsPanel.tsx` |
| 10 | `src/hooks/usePDIAlerts.ts` |
| 20 | `src/hooks/usePDIAlerts.ts` |
| 500 | `src/pages/AdminTelemetria.tsx` |
| 50 | `src/pages/BurnRate.tsx` |
| 36 | `src/pages/ExecutiveMonthlyReport.tsx` |
| 200 | `src/pages/Postmortems.tsx` |
| 200 | `src/pages/Runbook.tsx` |
| 5 | `src/pages/SecurityDashboard.tsx` |
| 50 | `src/pages/WebhookSubscriptionDetail.tsx` |
| 100 | `src/services/auctionService.ts` |
| 120 | `src/services/auctionService.ts` |
| 60 | `src/services/auctionService.ts` |
| 50 | `src/services/bossBattleService.ts` |
| 50 | `src/services/campaignImportService.ts` |
| 500 | `src/services/campaignImportService.ts` |
| 50 | `src/services/campaignTeamsService.ts` |
| 10 | `src/services/checkinsService.ts` |
| 30 | `src/services/departmentWarService.ts` |
| 50 | `src/services/departmentWarService.ts` |
| 1 | `src/services/duelsService.ts` |
| 20 | `src/services/duelsService.ts` |
| 1 | `src/services/highPotentialService.ts` |
| 1 | `src/services/leaguesService.ts` |
| 10 | `src/services/lightningQuizService.ts` |
| 400 | `src/services/luckyWheelService.ts` |
| 30 | `src/services/mentorshipService.ts` |
| 1 | `src/services/nineBoxService.ts` |
| 1 | `src/services/oneOnOnePreparationService.ts` |
| 10 | `src/services/oneOnOnePreparationService.ts` |
| 5 | `src/services/oneOnOnePreparationService.ts` |
| 1 | `src/services/passwordResetService.ts` |
| 100 | `src/services/predictionMarketService.ts` |
| 200 | `src/services/predictionMarketService.ts` |
| 50 | `src/services/predictionMarketService.ts` |
| 50 | `src/services/scratchCardService.ts` |
| 50 | `src/services/tradingCardsService.ts` |
| 1 | `supabase/functions/burn-rate-monitor/index.ts` |
| 1 | `supabase/functions/competency-alerts/index.ts` |
| 1 | `supabase/functions/error-budget-monitor/index.ts` |
| 1 | `supabase/functions/passkey-auth/index.ts` |
| 5 | `supabase/functions/passkey-auth/index.ts` |
| 500 | `supabase/functions/reward-approval-review/index.ts` |
| 1 | `supabase/functions/security-weekly-digest/index.ts` |

## I. Regras implícitas em mensagens de erro/validação

| Mensagem | Arquivo |
|---|---|
| :       url =  | `public/sw.js` |
| :     case  | `public/sw.js` |
| falha fixture | `scripts/automation.unit.mjs` |
| ${msg}: esperado ${JSON.stringify(b)} obtido ${JSON.stringify(a)} | `scripts/ai-context/cenarios.mjs` |
| Artifact-id sem arquivo correspondente | `scripts/ci/contexto-publicacao.unit.mjs` |
| Download simulado falhou: ${failDownload} | `scripts/ci/contexto-publicacao.unit.mjs` |
| failed | `scripts/maintenance/lib.mjs` |
| missing_dependencies | `scripts/maintenance/lib.mjs` |
| skipped_busy | `scripts/maintenance/lib.mjs` |
| formatter fixture failed | `scripts/maintenance/maintenance.unit.mjs` |
| blocked_network_sandbox | `scripts/maintenance/run.mjs` |
| pending_patch | `scripts/maintenance/run.mjs` |
| O teste offline não permite consultas ao banco | `scripts/supabase_snapshot/test_snapshot.py` |
| banco indisponível na fixture | `scripts/supabase_snapshot/test_snapshot.py` |
| catálogo indisponível na fixture | `scripts/supabase_snapshot/test_snapshot.py` |
| permission denied for schema auth | `scripts/supabase_snapshot/test_snapshot.py` |
| relation  | `scripts/supabase_snapshot/test_snapshot.py` |
| statement timeout simulado | `scripts/supabase_snapshot/test_snapshot.py` |
| view removida depois da consulta ao catálogo | `scripts/supabase_snapshot/test_snapshot.py` |
| view sem permissão na fixture | `scripts/supabase_snapshot/test_snapshot.py` |
|              className= | `src/components/AICoachDialog.tsx` |
| Erro ao copiar | `src/components/AICoachDialog.tsx` |
| useGlobalMessage must be used within GlobalMessageProvider | `src/components/GlobalMessageProvider.tsx` |
| Não foi possível salvar a preferência | `src/components/InAppNotificationToggle.tsx` |
| Ainda sem conexão. Tente novamente. | `src/components/OfflineIndicator.tsx` |
| Você está offline. Alguns recursos podem estar limitados. | `src/components/OfflineIndicator.tsx` |
| Resposta inválida do serviço de recomendações. | `src/components/TrailRecommendations.tsx` |
| Erro ao desfazer ação | `src/components/UndoToast.tsx` |
| useAccessibility must be used within AccessibilityProvider | `src/components/accessibility/AccessibilityProvider.tsx` |
|  className= | `src/components/admin/AdminAlertsPanel.tsx` |
| Erro ao adicionar membro | `src/components/admin/DepartmentsManager.tsx` |
| Erro ao atualizar gestor | `src/components/admin/DepartmentsManager.tsx` |
| Erro ao excluir departamento | `src/components/admin/DepartmentsManager.tsx` |
| Erro ao remover membro | `src/components/admin/DepartmentsManager.tsx` |
| Erro ao salvar departamento | `src/components/admin/DepartmentsManager.tsx` |
| Nome é obrigatório | `src/components/admin/DepartmentsManager.tsx` |
| Erro ao duplicar: ${(e as Error).message} | `src/components/admin/GoalsManager.tsx` |
| Erro ao remover: ${(e as Error).message} | `src/components/admin/GoalsManager.tsx` |
| Erro: ${(e as Error).message} | `src/components/admin/GoalsManager.tsx` |
| ; import {   Dialog,   DialogContent,   DialogDescription,   DialogFooter,   DialogHeader,   DialogTitle, } from  | `src/components/admin/IssuedCredentialDialog.tsx` |
| Não foi possível copiar. Selecione e copie manualmente. | `src/components/admin/IssuedCredentialDialog.tsx` |
| Arquivo maior que 2MB | `src/components/admin/OrganizationSettings.tsx` |
| Cor primária não atinge contraste WCAG AA (4.5:1) | `src/components/admin/OrganizationSettings.tsx` |
| Domínio inválido. Ex.: minhaempresa.com | `src/components/admin/OrganizationSettings.tsx` |
| Sem organização | `src/components/admin/OrganizationSettings.tsx` |
| Erro ao aprovar solicitação | `src/components/admin/PasswordResetApprovalPanel.tsx` |
| Erro ao rejeitar solicitação | `src/components/admin/PasswordResetApprovalPanel.tsx` |
| Erro ao carregar permissões | `src/components/admin/RolePermissionsManager.tsx` |
| Erro ao salvar permissões | `src/components/admin/RolePermissionsManager.tsx` |
| Data de término é obrigatória | `src/components/admin/SurveyCreator.tsx` |
| Erro ao carregar resultados | `src/components/admin/SurveyCreator.tsx` |
| Erro ao criar pesquisa | `src/components/admin/SurveyCreator.tsx` |
| Título é obrigatório | `src/components/admin/SurveyCreator.tsx` |
| Erro ao adicionar ao departamento | `src/components/admin/UsersManager.tsx` |
| Erro ao atribuir role | `src/components/admin/UsersManager.tsx` |
| Erro ao atribuir roles | `src/components/admin/UsersManager.tsx` |
| Erro ao remover do departamento | `src/components/admin/UsersManager.tsx` |
| Erro ao remover dos departamentos | `src/components/admin/UsersManager.tsx` |
| Erro ao remover role | `src/components/admin/UsersManager.tsx` |
| Erro ao remover roles | `src/components/admin/UsersManager.tsx` |
| Erro ao gerar PDI | `src/components/admin/ninebox/BoxDetailView.tsx` |
| ; import { Button } from  | `src/components/auction/AuctionAdminForm.tsx` |
| Falha de comunicação. Tente novamente. | `src/components/auction/BidDialog.tsx` |
| ; import { PasswordStrengthIndicator } from  | `src/components/auth/AuthFormContent.tsx` |
| >{errors.password}</p>}         {view ===  | `src/components/auth/AuthFormContent.tsx` |
| Passkey validada, mas a sessão não foi criada. Entre com e-mail e senha. | `src/components/auth/PasskeyLogin.tsx` |
| Seu navegador não suporta login com passkey | `src/components/auth/PasskeyLogin.tsx` |
| Digite um código de 6 dígitos | `src/components/auth/TwoFactorSetup.tsx` |
| Resposta incorreta. A casa foi liberada, mas sem recompensa. | `src/components/board/BoardChallengeDialog.tsx` |
| Resposta incorreta. Você ainda tem ${result.attempts_left} tentativa(s) — valendo metade do prêmio. | `src/components/board/BoardChallengeDialog.tsx` |
| Não foi possível exportar o CSV | `src/components/boss/BossConsolidatedReportCard.tsx` |
| Não foi possível gerar o PDF | `src/components/boss/BossConsolidatedReportCard.tsx` |
| Não foi possível exportar o comparativo. | `src/components/boss/BossDepartmentComparisonCard.tsx` |
| Não foi possível exportar o histórico. | `src/components/boss/BossHistoryCard.tsx` |
| ; import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Upload } from  | `src/components/campaigns/CampaignImportDialog.tsx` |
| Falha na importação | `src/components/campaigns/CampaignImportDialog.tsx` |
| Não foi possível reverter o rateio. Verifique suas permissões. | `src/components/campaigns/CampaignTeamSplitTrail.tsx` |
| Falha ao abrir o pacote. Tente novamente. | `src/components/cards/PackList.tsx` |
| Não foi possível abrir o pacote agora. | `src/components/cards/PackList.tsx` |
| Falha ao responder à proposta. | `src/components/cards/TradeInbox.tsx` |
| Não foi possível gerar o PDF | `src/components/certifications/CertificateActions.tsx` |
| >           {error}         </p>       )}        <div className= | `src/components/climate/ClimateSurveyAnswerForm.tsx` |
| >           {error}         </p>       )}        <div className= | `src/components/climate/ClimateSurveyForm.tsx` |
| >               {error}             </p>           )}           <Button onClick={handleAdd} disabled={isAdding}>             <Plus className= | `src/components/climate/ClimateSurveyQuestions.tsx` |
| ; import { Badge } from  | `src/components/luckywheel/LuckyWheelPayoutPanel.tsx` |
| ; import { Badge } from  | `src/components/luckywheel/LuckyWheelPayoutTrend.tsx` |
| ; import { Badge } from  | `src/components/luckywheel/LuckyWheelWindowComparison.tsx` |
| Não foi possível salvar o teto no servidor (valor mantido localmente) | `src/components/luckywheel/LuckyWheelWindowComparison.tsx` |
| Créditos insuficientes. | `src/components/manager/TeamCompetencyDashboard.tsx` |
| Erro ao buscar recomendações | `src/components/manager/TeamCompetencyDashboard.tsx` |
| Limite de requisições excedido. | `src/components/manager/TeamCompetencyDashboard.tsx` |
| Erro inesperado ao criar o mercado. Tente novamente. | `src/components/prediction/CreateMarketDialog.tsx` |
| Erro inesperado ao criar a aposta de meta. Tente novamente. | `src/components/prediction/GoalBetDialog.tsx` |
| Erro inesperado ao executar a ação. | `src/components/prediction/PredictionAdminRow.tsx` |
| Erro inesperado ao apurar o mercado. | `src/components/prediction/SettleMarketDialog.tsx` |
| Erro inesperado ao registrar o aporte. Tente novamente. | `src/components/prediction/StakeDialog.tsx` |
|  className= | `src/components/quiz/AIQuestionGenerator.tsx` |
| Resposta inválida do serviço de geração de perguntas. | `src/components/quiz/AIQuestionGenerator.tsx` |
| Selecione uma trilha | `src/components/quiz/AIQuestionGenerator.tsx` |
| Não foi possível validar sua resposta. Tente novamente. | `src/components/quiz/MagicCardQuiz.tsx` |
| Não foi possível usar a ajuda agora. | `src/components/quiz/MillionaireQuiz.tsx` |
| Não foi possível validar sua resposta. Tente novamente. | `src/components/quiz/MillionaireQuiz.tsx` |
| useRBACContext must be used within a RBACProvider | `src/components/rbac/RBACProvider.tsx` |
| Erro ao atribuir permissão | `src/components/rbac/RolesTab.tsx` |
| Erro ao remover permissão | `src/components/rbac/RolesTab.tsx` |
| Erro ao atribuir role | `src/components/rbac/UserRolesTab.tsx` |
| Erro ao remover role | `src/components/rbac/UserRolesTab.tsx` |
| Erro ao bloquear IP | `src/components/security/BlockedIPsPanel.tsx` |
| Erro ao desbloquear IP | `src/components/security/BlockedIPsPanel.tsx` |
| Este IP já está bloqueado | `src/components/security/BlockedIPsPanel.tsx` |
| Erro ao marcar dispositivo como confiável | `src/components/security/DevicesPanel.tsx` |
| Erro ao remover dispositivo | `src/components/security/DevicesPanel.tsx` |
| ; import { AlertTriangle, BellRing, CheckCircle2, Loader2, RefreshCw, RotateCcw } from  | `src/components/security/PushOutboxHealthPanel.tsx` |
| Não foi possível reenfileirar as notificações. | `src/components/security/PushOutboxHealthPanel.tsx` |
| ; import { Badge } from  | `src/components/security/PushOutboxHealthTrend.tsx` |
| Erro ao excluir regra | `src/components/security/RateLimitRulesPanel.tsx` |
| Erro ao salvar regra | `src/components/security/RateLimitRulesPanel.tsx` |
| ; import { Loader2, Shield, Lock, AlertTriangle } from  | `src/components/security/ReauthProvider.tsx` |
| useReauth must be used within a ReauthProvider | `src/components/security/ReauthProvider.tsx` |
| Erro ao resolver alerta | `src/components/security/SecurityAlertsPanel.tsx` |
| Novo alerta: ${(payload.new as SecurityAlert).title} | `src/components/security/SecurityAlertsPanel.tsx` |
| , url:  | `src/components/security/SecurityNotificationsToggle.tsx` |
| Ative as notificações primeiro | `src/components/security/SecurityNotificationsToggle.tsx` |
| Erro ao encerrar sessão | `src/components/security/SessionsPanel.tsx` |
| Erro ao encerrar sessões | `src/components/security/SessionsPanel.tsx` |
| Não foi possível gerar o CSV | `src/components/sequence/SequenceProcedureStatsCard.tsx` |
| Não foi possível gerar o PDF | `src/components/sequence/SequenceProcedureStatsCard.tsx` |
| Arquivo muito grande. Máximo 10 MB. | `src/components/trails/AICourseBuilderDialog.tsx` |
| Falha ao enviar | `src/components/trails/AICourseBuilderDialog.tsx` |
| Falha ao iniciar processamento | `src/components/trails/AICourseBuilderDialog.tsx` |
| Falha na geração | `src/components/trails/AICourseBuilderDialog.tsx` |
| Selecione um arquivo (.pdf, .txt ou .md). | `src/components/trails/AICourseBuilderDialog.tsx` |
|  className= | `src/components/trails/ModuleDraftForm.tsx` |
| Não foi possível duplicar o módulo | `src/components/trails/TrailModuleEditor.tsx` |
| Revise os campos destacados antes de salvar | `src/components/trails/TrailModuleEditor.tsx` |
|  className={cn(alertVariants({ variant }), className)} {...props} /> )); Alert.displayName =  | `src/components/ui/alert.tsx` |
| useCarousel must be used within a <Carousel /> | `src/components/ui/carousel.tsx` |
| useChart must be used within a <ChartContainer /> | `src/components/ui/chart.tsx` |
|  className={cn( | `src/components/ui/form.tsx` |
| useFormField should be used within <FormField> | `src/components/ui/form.tsx` |
| useSidebar must be used within a SidebarProvider. | `src/components/ui/sidebar.tsx` |
| Não foi possível ler o arquivo selecionado. | `src/components/wager/WagerBulkImportDialog.tsx` |
| Falha inesperada ao criar a guerra. | `src/components/war/DepartmentWarConfigDialog.tsx` |
| ; import { ShieldAlert, KeyRound, Copy } from  | `src/components/webhooks/BulkRotateDialog.tsx` |
| Falha ao rotacionar: ${(e as Error).message} | `src/components/webhooks/BulkRotateDialog.tsx` |
| Erro ao carregar: ${error.message} | `src/components/webhooks/EditWebhookDialog.tsx` |
| Falha ao cancelar: ${(e as Error).message} | `src/components/webhooks/EditWebhookDialog.tsx` |
| Falha ao promover: ${(e as Error).message} | `src/components/webhooks/EditWebhookDialog.tsx` |
| Falha ao rotacionar: ${(e as Error).message} | `src/components/webhooks/EditWebhookDialog.tsx` |
| Falha ao salvar: ${(e as Error).message} | `src/components/webhooks/EditWebhookDialog.tsx` |
| useAchievementNotification must be used within AchievementNotificationProvider | `src/contexts/AchievementNotificationContext.tsx` |
| useGamification must be used within GamificationProvider | `src/contexts/GamificationContext.tsx` |
| useOnboardingTour must be used within OnboardingTourProvider | `src/contexts/OnboardingTourContext.tsx` |
| useSoundSettings must be used within a SoundSettingsProvider | `src/contexts/SoundSettingsContext.tsx` |
| Coach nao retornou resposta | `src/hooks/useAICoach.ts` |
| Sem resposta do servidor | `src/hooks/useAICoach.ts` |
| Não foi possível gerar o plano | `src/hooks/useActionPlanGenerator.ts` |
| Failed to assign department | `src/hooks/useAdminUsers.ts` |
| Failed to assign role | `src/hooks/useAdminUsers.ts` |
| Team member not found | `src/hooks/useAdminUsers.ts` |
| Usuário já possui este role | `src/hooks/useAdminUsers.ts` |
| Usuário já é membro deste departamento | `src/hooks/useAdminUsers.ts` |
| Erro ao atualizar anúncio | `src/hooks/useAnnouncements.ts` |
| Erro ao publicar anúncio | `src/hooks/useAnnouncements.ts` |
| Erro ao registrar check-in | `src/hooks/useAttendance.ts` |
| Erro ao registrar check-out | `src/hooks/useAttendance.ts` |
| User not authenticated | `src/hooks/useAttendance.ts` |
| ⏰ Check-in atrasado (${result.lateMinutes} min). Streak reiniciado. | `src/hooks/useAttendance.ts` |
| useAuth must be used within an AuthProvider | `src/hooks/useAuth.tsx` |
| No user | `src/hooks/useAutoChallenges.ts` |
| Erro ao atualizar avatar | `src/hooks/useAvatar.ts` |
| Erro ao desbloquear item | `src/hooks/useAvatar.ts` |
| Não foi possível apurar a batalha. | `src/hooks/useBossBattles.ts` |
| Não foi possível criar a batalha. | `src/hooks/useBossBattles.ts` |
| Não foi possível encerrar a batalha. | `src/hooks/useBossBattles.ts` |
| Não foi possível publicar a batalha. | `src/hooks/useBossBattles.ts` |
| Não foi possível remover a meta | `src/hooks/useBossWinRateGoals.ts` |
| Não foi possível salvar a meta | `src/hooks/useBossWinRateGoals.ts` |
| Não foi possível verificar as quedas críticas | `src/hooks/useBossWinRateGoals.ts` |
| Falha na aplicação | `src/hooks/useCampaignImports.ts` |
| Falha na reversão | `src/hooks/useCampaignImports.ts` |
| Erro ao criar celebração | `src/hooks/useCelebrations.ts` |
| Erro ao emitir certificação | `src/hooks/useCertifications.ts` |
| Erro ao renovar certificação | `src/hooks/useCertifications.ts` |
| Erro ao agendar check-in | `src/hooks/useCheckins.ts` |
| Erro ao concluir check-in | `src/hooks/useCheckins.ts` |
| Erro ao adicionar pergunta | `src/hooks/useClimateSurveys.ts` |
| Erro ao atualizar pesquisa | `src/hooks/useClimateSurveys.ts` |
| Erro ao criar pesquisa de clima | `src/hooks/useClimateSurveys.ts` |
| Erro ao recalcular resultados | `src/hooks/useClimateSurveys.ts` |
| Erro ao remover pergunta | `src/hooks/useClimateSurveys.ts` |
| User not authenticated | `src/hooks/useCombo.ts` |
| ${error.message} (requestId=${requestId}) | `src/hooks/useCompetencyAlerts.ts` |
| Erro ao analisar competências | `src/hooks/useCompetencyAlerts.ts` |
| Não foi possível registrar sua resposta | `src/hooks/useContinuousEngagement.ts` |
| Erro ao atualizar: ${error.message} | `src/hooks/useDevelopmentPlans.ts` |
| Erro ao criar ação: ${error.message} | `src/hooks/useDevelopmentPlans.ts` |
| Erro ao criar plano: ${error.message} | `src/hooks/useDevelopmentPlans.ts` |
| Erro ao criar: ${error.message} | `src/hooks/useDevelopmentPlans.ts` |
| Erro ao remover: ${error.message} | `src/hooks/useDevelopmentPlans.ts` |
| ${error.message} (requestId=${requestId}) | `src/hooks/useDeviceDetection.ts` |
| Erro ao cancelar duelo | `src/hooks/useDuels.ts` |
| Erro ao atualizar: ${error.message} | `src/hooks/useENPS.ts` |
| Erro ao criar pesquisa: ${error.message} | `src/hooks/useENPS.ts` |
| Erro ao enviar: ${error.message} | `src/hooks/useENPS.ts` |
| Erro ao gerar snapshot: ${error.message} | `src/hooks/useENPS.ts` |
| Erro ao remover: ${error.message} | `src/hooks/useENPS.ts` |
| Erro ao atualizar ciclo | `src/hooks/useFeedback360.ts` |
| Erro ao criar ciclo | `src/hooks/useFeedback360.ts` |
| Erro ao criar pedido de feedback | `src/hooks/useFeedback360.ts` |
| Erro ao enviar feedback | `src/hooks/useFeedback360.ts` |
| Erro ao excluir ciclo | `src/hooks/useFeedback360.ts` |
| Erro ao atualizar meta | `src/hooks/useGoals.ts` |
| Erro ao criar meta | `src/hooks/useGoals.ts` |
| useI18nContext must be used within an I18nProvider | `src/hooks/useI18n.ts` |
| Erro ao adicionar IP | `src/hooks/useIpWhitelist.ts` |
| Erro ao alterar status | `src/hooks/useIpWhitelist.ts` |
| Erro ao atualizar IP | `src/hooks/useIpWhitelist.ts` |
| Erro ao remover IP | `src/hooks/useIpWhitelist.ts` |
| Este IP já está na whitelist | `src/hooks/useIpWhitelist.ts` |
| Erro ao enviar reconhecimento | `src/hooks/useKudos.ts` |
| Erro ao atualizar liga | `src/hooks/useLeagues.ts` |
| Erro ao criar liga | `src/hooks/useLeagues.ts` |
| Erro ao remover liga | `src/hooks/useLeagues.ts` |
| Erro ao registrar humor | `src/hooks/useMoodTracker.ts` |
| Erro ao atualizar: ${error.message} | `src/hooks/useNineBox.ts` |
| Erro ao criar avaliação: ${error.message} | `src/hooks/useNineBox.ts` |
| User not authenticated | `src/hooks/useNotifications.ts` |
| Não foi possível gerar o plano | `src/hooks/useNr1Risk.ts` |
| User not authenticated | `src/hooks/useOnboarding.ts` |
| Erro ao aplicar penalidade: ${error.message} | `src/hooks/usePositions.ts` |
| Erro ao atribuir cargo: ${error.message} | `src/hooks/usePositions.ts` |
| Erro ao atualizar cargo: ${error.message} | `src/hooks/usePositions.ts` |
| Erro ao atualizar regra: ${error.message} | `src/hooks/usePositions.ts` |
| Erro ao atualizar tarefa: ${error.message} | `src/hooks/usePositions.ts` |
| Erro ao concluir tarefa: ${error.message} | `src/hooks/usePositions.ts` |
| Erro ao criar cargo: ${error.message} | `src/hooks/usePositions.ts` |
| Erro ao criar regra: ${error.message} | `src/hooks/usePositions.ts` |
| Erro ao criar tarefa: ${error.message} | `src/hooks/usePositions.ts` |
| Erro ao remover cargo: ${error.message} | `src/hooks/usePositions.ts` |
| Erro ao remover tarefa: ${error.message} | `src/hooks/usePositions.ts` |
| Tarefa processada com penalidade de -${result.xp_penalty} XP | `src/hooks/usePositions.ts` |
| Erro ao criar pesquisa | `src/hooks/usePulseSurveys.ts` |
| Erro ao enviar resposta | `src/hooks/usePulseSurveys.ts` |
| Erro ao excluir pesquisa | `src/hooks/usePulseSurveys.ts` |
| Erro ao reabrir pesquisa | `src/hooks/usePulseSurveys.ts` |
| Erro ao solicitar permissão de notificações | `src/hooks/usePushNotifications.ts` |
| Notificações foram bloqueadas. Habilite nas configurações do navegador. | `src/hooks/usePushNotifications.ts` |
| Seu navegador não suporta notificações | `src/hooks/usePushNotifications.ts` |
| Falha no enrollment | `src/hooks/useSalesCampaigns.ts` |
| Erro ao coletar recompensa | `src/hooks/useSeasonalEvents.ts` |
| User not authenticated | `src/hooks/useSeasonalEvents.ts` |
| ,          alertId: alert.id,         url:  | `src/hooks/useSecurityPushNotifications.ts` |
| useTheme must be used within a ThemeProvider | `src/hooks/useTheme.tsx` |
| Erro ao adicionar pré-requisito | `src/hooks/useTrails.ts` |
| Erro ao completar módulo | `src/hooks/useTrails.ts` |
| Erro ao criar trilha | `src/hooks/useTrails.ts` |
| Código inválido | `src/hooks/useTwoFactor.ts` |
| Erro ao configurar 2FA | `src/hooks/useTwoFactor.ts` |
| Erro ao desativar 2FA | `src/hooks/useTwoFactor.ts` |
| Erro ao verificar código | `src/hooks/useTwoFactor.ts` |
| User not authenticated | `src/hooks/useTwoFactor.ts` |
| Não foi possível salvar a preferência | `src/hooks/useTypePreferences.ts` |
| Não foi possível salvar as preferências | `src/hooks/useTypePreferences.ts` |
| Usuário não autenticado | `src/hooks/useWebAuthn.ts` |
| A planilha nao possui abas legiveis. | `src/lib/campaignImport.ts` |
| Coluna de valor nao encontrada (ex.: valor, quantidade, total). | `src/lib/campaignImport.ts` |
| Coluna de vendedor nao encontrada (ex.: email, matricula, vendedor). | `src/lib/campaignImport.ts` |
| Nao foi possivel identificar o cabecalho do arquivo. | `src/lib/campaignImport.ts` |
| Sessão expirada — faça login novamente. | `src/lib/luckyWheelBudgetWhatIf.ts` |
| Erro ao limpar dados antigos | `src/pages/AdminTelemetria.tsx` |
| ; import { Badge } from  | `src/pages/ApiKeysAdmin.tsx` |
| ; import { Card, CardContent } from  | `src/pages/AuctionsAdmin.tsx` |
| Acesso bloqueado: IP não autorizado | `src/pages/Auth.tsx` |
| Algo deu errado. Tente novamente. | `src/pages/Auth.tsx` |
| Conta bloqueada por ${Math.ceil(lr.remaining_seconds / 60)} min. | `src/pages/Auth.tsx` |
| Conta bloqueada. Tente em ${Math.ceil(lockoutStatus.remaining_seconds / 60)} min. | `src/pages/Auth.tsx` |
| Credenciais incorretas. ${5 - lr.failed_attempts} tentativa(s). | `src/pages/Auth.tsx` |
| Email não encontrado no sistema | `src/pages/Auth.tsx` |
| Email ou senha incorretos | `src/pages/Auth.tsx` |
| Erro ao fazer login com Google | `src/pages/Auth.tsx` |
| Erro ao finalizar login | `src/pages/Auth.tsx` |
| Erro ao processar autenticação. Tente novamente. | `src/pages/Auth.tsx` |
| Erro ao solicitar reset de senha. Tente novamente. | `src/pages/Auth.tsx` |
| Falha ao sincronizar a cartela. | `src/pages/BingoPage.tsx` |
| Não foi possível sincronizar a cartela agora. | `src/pages/BingoPage.tsx` |
| Corrija os erros do tabuleiro antes de salvar. | `src/pages/BoardTrailAdminPage.tsx` |
| Você tirou ${result.roll} e caiu em uma casa de desafio. | `src/pages/BoardTrailPage.tsx` |
| Falha ao reconhecer:  | `src/pages/BurnRate.tsx` |
| Falha ao resgatar a recompensa. Tente novamente. | `src/pages/CardAlbumPage.tsx` |
| Erro ao preparar 1:1 | `src/pages/Checkins.tsx` |
| Preencha os campos obrigatórios | `src/pages/Checkins.tsx` |
| Erro ao registrar a aposta. Tente novamente. | `src/pages/DailyWagerPage.tsx` |
| Não foi dessa vez. ${Math.abs(result.coins_delta ?? 0)} moedas perdidas. | `src/pages/DailyWagerPage.tsx` |
| Falha ao alterar a situação da guerra. | `src/pages/DepartmentWarPage.tsx` |
| Falha ao encerrar a guerra. | `src/pages/DepartmentWarPage.tsx` |
| Falha ao sincronizar o efetivo. | `src/pages/DepartmentWarPage.tsx` |
| Nenhum dado disponível para exportar. | `src/pages/EngagementReports.tsx` |
|  aria-live= | `src/pages/ExecutiveMonthlyReport.tsx` |
| Nada para investigar neste período. | `src/pages/ExecutiveMonthlyReport.tsx` |
| … +188 linhas — lista completa em `context.json` | |

## J. Controle de acesso no código (checagens de perfil/permissão)

| Valor comparado | Arquivo |
|---|---|
| `assistant` | `src/components/AICoachDialog.tsx` |
| `user` | `src/components/AICoachDialog.tsx` |
| `permission` | `src/components/admin/CreateApiKeyDialog.tsx` |
| `admin` | `src/components/rbac/UserRolesTab.tsx` |
| `assistant` | `src/hooks/useAICoach.ts` |
| `default` | `src/hooks/usePushNotifications.ts` |
| `denied` | `src/hooks/usePushNotifications.ts` |
| `granted` | `src/hooks/usePushNotifications.ts` |
| `admin` | `src/hooks/useRBAC.ts` |
| `key` | `src/hooks/useRBAC.ts` |
| `permissionKey` | `src/hooks/useRBAC.ts` |
| `admin` | `src/pages/BoardTrailPage.tsx` |
| `manager` | `src/pages/BoardTrailPage.tsx` |
| `long` | `src/pages/BurnRate.tsx` |
| `admin` | `src/pages/LuckyWheelPage.tsx` |
| `admin` | `src/pages/MemoryGamePage.tsx` |
| `mentor` | `src/pages/Mentoria.tsx` |
| `manager` | `src/pages/SalesCampaignDetail.tsx` |
| `admin` | `src/pages/SalesCampaigns.tsx` |
| `manager` | `src/pages/SalesCampaigns.tsx` |
| `mentor` | `src/services/mentorshipService.ts` |
| `admin` | `src/services/rbacService.ts` |
| `permissionKey` | `src/services/rbacService.ts` |
| `admin` | `supabase/functions/churn-prediction/index.ts` |
| `manager` | `supabase/functions/churn-prediction/index.ts` |
| `admin` | `supabase/functions/reward-approval-review/index.ts` |
| `manager` | `supabase/functions/reward-approval-review/index.ts` |
| `admin` | `supabase/functions/trail-recommendations/index.ts` |
| `manager` | `supabase/functions/trail-recommendations/index.ts` |
| `admin` | `supabase/migrations/20260712214816_6fc5c315-ea1a-4b7e-90af-4cd2960bd17a.sql` |
| `admin` | `supabase/migrations/20260726160940_73598534-820c-416f-8663-cb0272ff160a.sql` |
| `manager` | `supabase/migrations/20260726160940_73598534-820c-416f-8663-cb0272ff160a.sql` |
| `admin` | `supabase/migrations/20260726161955_76f4a445-1f0f-430f-abf1-7218834a3649.sql` |
| `manager` | `supabase/migrations/20260726161955_76f4a445-1f0f-430f-abf1-7218834a3649.sql` |
| `admin` | `supabase/migrations/20260726182807_60e2ae2c-7399-42d5-80ca-722803ff15c9.sql` |
| `manager` | `supabase/migrations/20260726182807_60e2ae2c-7399-42d5-80ca-722803ff15c9.sql` |
| `admin` | `supabase/migrations/20260727183427_72f9c05a-39cb-439b-9460-a965561e3d62.sql` |
| `manager` | `supabase/migrations/20260727183427_72f9c05a-39cb-439b-9460-a965561e3d62.sql` |
| `admin` | `supabase/migrations/20260728103329_1a2a8f0f-b71b-495d-b706-44a4e87e31d1.sql` |
| `admin` | `supabase/migrations/20260728121542_4ac8cbd1-0d6d-410d-8734-4fd032804ddc.sql` |
| `admin` | `supabase/migrations/20260728125833_b6b2c15a-1960-4e13-9c2a-0cdff052ea01.sql` |
| `manager` | `supabase/migrations/20260728125833_b6b2c15a-1960-4e13-9c2a-0cdff052ea01.sql` |
| `admin` | `supabase/migrations/20260728161526_6f32f879-b9a2-4792-bbb5-9ddea5f271ba.sql` |
| `admin` | `supabase/migrations/20260728163529_7d985b3e-7991-469f-913b-f0034c9c2b38.sql` |
| `manager` | `supabase/migrations/20260728163529_7d985b3e-7991-469f-913b-f0034c9c2b38.sql` |
| `admin` | `supabase/migrations/20260728183016_7700507e-bccb-4244-9fa4-6c9e79440974.sql` |
| `manager` | `supabase/migrations/20260728183016_7700507e-bccb-4244-9fa4-6c9e79440974.sql` |
| `admin` | `supabase/migrations/20260807030000_fix_opinion_feed_rpc.sql` |
| `manager` | `supabase/migrations/20260807030000_fix_opinion_feed_rpc.sql` |
| `admin` | `supabase/migrations/20261122140000_acknowledge_security_digest.sql` |
| `manager` | `supabase/migrations/20261122140000_acknowledge_security_digest.sql` |
| `admin` | `supabase/migrations/20261123180000_climate_survey_engine.sql` |
| `manager` | `supabase/migrations/20261123180000_climate_survey_engine.sql` |

## K. Testes como especificação (2107 testes em 159 arquivos — nomes completos em `context.json`)

| Arquivo | Testes | Exemplos do que o sistema DEVE fazer |
|---|---|---|
| `src/test/external-db-bridge.test.ts` | 80 | classifySeverity · returns  · returns  · returns  … |
| `src/test/telemetry.test.tsx` | 69 | Telemetry Data Computation · Time threshold calculations · 1h threshold should be ~60 minutes ago · 6h threshold should be ~6 hours ago … |
| `src/test/wagerIntegrity.test.ts` | 45 | accuracyZScore · retorna 0 sem amostra · retorna 0 para baseline degenerada · é zero quando a acurácia bate exatamente o acaso … |
| `src/test/pushDevices.simulation.test.ts` | 42 | buildDeviceList — saneamento de linhas · descarta linhas sem id ou sem endpoint · nunca quebra com entrada nula/indefinida · deduplica ids repetidos mantendo a primeira ocorrência … |
| `src/test/campaignImport.simulation.test.ts` | 33 | normalizeHeader · remove acentos, caixa e espacos redundantes · nunca lanca para entradas nao textuais · detectColumns … |
| `src/test/engagementDiagnostics.simulation.test.ts` | 31 | scoreZone — invariantes de classificação · nunca lança e sempre devolve zona conhecida, mesmo com entrada hostil · é monotônica não-decrescente ao longo de 0..10 em 1001 passos · valores não finitos caem sempre em neutro (nunca em crítico falso) … |
| `src/test/wagerMonthlyExposure.test.ts` | 31 | monthKeyOf · extrai o mês de uma data ISO · rejeita datas inválidas ou vazias · aceita timestamp completo … |
| `src/test/luckyWheelAudit.simulation.test.ts` | 30 | diffSnapshots — detecção de alterações · não reporta mudança quando os snapshots são idênticos · detecta exatamente o conjunto de campos alterados em 400 cenários · ignora ruído de serialização JSON (número como string, boolean como string) … |
| `src/test/campaignTeamSplit.simulation.test.ts` | 29 | rateio team_split — arredondamento · replica ROUND() do Postgres (half away from zero) · rateio team_split — grade combinatória · t=${teams} m=${members} ${mode} xp=${pool.xp} coins=${pool.coins} … |
| `src/test/bossReport.edgecases.test.ts` | 25 | buildBossReport — fronteiras da janela · inclui os extremos exatos e exclui 1 ms fora · janela 0 traz todo o histórico, inclusive o futuro registrado · normaliza dias inválidos (NaN, negativo, fracionário) … |
| `src/test/climateSurveysFlow.test.tsx` | 25 | ClimateSurveyAnswerForm · envia a nota escolhida para cada pergunta respondida · bloqueia o envio quando nenhuma pergunta foi respondida · quando a pesquisa não permite pular, cobra todas as perguntas obrigatórias … |
| `src/test/wagerBulkImport.test.ts` | 25 | parseWagerImportCsv · importa uma linha válida · rejeita arquivo vazio · exige colunas obrigatórias … |
| `src/test/tournamentBracket.simulation.test.ts` | 23 | tournamentBracket — tamanho e rodadas · rejeita torneios com menos de 2 participantes · sempre gera potência de 2 >= participantes (2..256) · tournamentBracket — chaveamento canônico … |
| `src/test/luckyWheelPayout.simulation.test.ts` | 22 | payout — convergência estatística · 100.000 giros simulados ficam dentro da faixa de normalidade (\|z\| < 3.5) · custo realizado converge para o projetado em amostra grande (< 3%) · 200 amostras independentes: no máximo 5% dos setores marcados como anomalia … |
| `src/test/boardTrailAuthoring.test.ts` | 21 | validateTrailDraft · aceita o tabuleiro inicial sugerido · reindexa posições e descarta buracos informados pelo autor · exige título … |
| `src/test/cardSetRewards.simulation.test.ts` | 21 | cardSetRewards — divisão por marcos · a soma dos marcos é exatamente o total, em 1.000 valores · a recompensa é crescente (ou igual) do marco 25 ao 100 · valores inválidos degradam para zero em vez de propagar NaN … |
| `src/test/continuousEngagement.simulation.test.ts` | 21 | Simulação — invariantes de normalização · nunca produz valor fora de 0..10 nem NaN, em qualquer formato × valor hostil · formato de texto nunca gera score numérico · cards com 0 ou 1 opção não divide por zero … |
| `src/test/dailyWager.test.ts` | 21 | parseWagerOptions · descarta itens inválidos, vazios e duplicados · retorna vazio para payload não-array · parseDailyWager … |
| `src/test/luckyWheelOdds.simulation.test.ts` | 21 | resolvePrizeIndex — paridade com o laço da RPC · cobre exaustivamente todas as faixas de roll do baseline · nunca sorteia prêmio inativo em 200 mil giros · frequência empírica converge para o peso configurado (tolerância 1,5%) … |
| `src/test/luckyWheelPayoutAlerts.simulation.test.ts` | 21 | chiSquareCritical · df=%s p=%s aproxima o valor tabelado %s · é monótona crescente em df e decrescente em p · devolve Infinity para entrada inválida df=%s p=%s … |
| `src/test/npsHistory.simulation.test.ts` | 21 | computeNpsScore — simulação combinatória · cobre centenas de combinações de promotores × neutros × detratores · é monotônico ao trocar detratores por promotores · sanitiza entradas corrompidas … |
| `src/test/wagerScheduleExport.test.ts` | 21 | buildWagerScheduleCsv · gera cabeçalho e uma linha por pergunta · ordena por data agendada · exporta o gabarito como letra posicional … |
| `src/test/bingoRpc.simulation.test.ts` | 20 | get_or_create_bingo_card — idempotência · retorna sempre a MESMA cartela em chamadas repetidas · id explícito e id implícito convergem para a mesma cartela · isola cartelas por usuário e por tabuleiro … |
| `src/test/cardPackTriggers.simulation.test.ts` | 20 | gatilho de tarefa no prazo · cobre todas as transições de status (25 cenários) · insert já concluído paga uma única vez · rejeita entrega com atraso ou retrabalho (200 cenários) … |
| `src/test/climateSurveyService.test.ts` | 20 | climateSurveyService · submitResponse · envia as respostas pela RPC com score e texto normalizados · traduz a violação de unicidade (23505) em mensagem clara … |
| `src/test/departmentWarConfig.simulation.test.ts` | 20 | departmentWarConfig — normalizacao · nunca lanca e sempre devolve estrutura valida em 600 cenarios aleatorios · deduplica metricas e departamentos por chave · e idempotente: normalizar duas vezes nao muda nada … |
| `src/test/engagementInsights.simulation.test.ts` | 20 | engagementInsights — entradas degeneradas · nunca lança e sempre devolve array · engagementInsights — matriz de pilares · cobre score × respondentes sem violar guardas … |
| `src/test/opinionChannel.simulation.test.ts` | 20 | sanitizeOpinionText — texto livre hostil · remove controle, bidi e colapsa espaços em todas as combinações · nunca lança com entradas não textuais · trunca conteúdo gigante mantendo o limite … |
| `src/test/wagerLeaderboard.test.ts` | 20 | parseWagerLeaderboard · retorna vazio para payloads inválidos · descarta linhas sem identificador · mapeia uma linha completa … |
| `src/test/edgeErrors.simulation.test.ts` | 19 | normalizeRetryAfter · usa 60s como padrão para valores inválidos · aceita números e strings numéricas, arredondando para cima · limita a 1h para evitar mensagens absurdas … |
| `src/test/purchaseRisk.simulation.test.ts` | 19 | purchaseRisk — invariantes fundamentais · mantém a pontuação sempre entre 0 e 100 em 500 cenários aleatórios · é determinístico: mesma entrada produz sempre a mesma saída · é monotônico no valor do resgate (mantendo os demais sinais) … |
| `supabase/functions/_shared/contracts/validation.contract.spec.ts` | 19 | destino de notificação (destinoUrl) · aceita caminho relativo do app — é o que salesCampaignsService envia · recusa esquema perigoso e texto que não é rota nem URL · migrate-helper: ?action= vazio cai em ping (compatível com o comportamento antigo) … |
| `src/test/climateBenchmark.simulation.test.ts` | 18 | normalizeThresholds — monotonicidade garantida · corrige limiares invertidos em centenas de combinações · tolera nulos e lixo · benchmarkPosition — simulação exaustiva score × limiares … |
| `src/test/departmentWar.simulation.test.ts` | 18 | Guerra de Departamentos - simulacao massiva · mantem invariantes em 400 cenarios aleatorios · e deterministico independentemente da ordem das contribuicoes · nunca distribui mais do que o pool configurado (300 cenarios) … |
| `src/test/deviceLabel.simulation.test.ts` | 18 | normalizeDeviceLabel · descarta entradas não textuais ou vazias · colapsa espaços e remove caracteres de controle · trunca respeitando o limite e sem deixar espaço final … |
| `src/test/luckyWheelPayoutHistory.simulation.test.ts` | 18 | buildPayoutTrend — invariantes estruturais · devolve série vazia sem linhas utilizáveis · descarta datas inválidas sem lançar · valida o calendário em isValidDay … |
| `src/test/nr1Risk.simulation.test.ts` | 18 | NR-1 :: matriz probabilidade x severidade · grau permanece dentro do domínio teórico 0..30 em todas as combinações · é monotonicamente decrescente em relação ao score · é monotonicamente crescente em relação à severidade … |
| `src/test/predictionMarket.simulation.test.ts` | 18 | predictionMarket — validação de aportes · rejeita mercado fechado ou já travado · rejeita opção inexistente, valor inválido e abaixo do mínimo · impede hedge (apostar em duas opções do mesmo mercado) … |
| `src/test/warFeed.simulation.test.ts` | 18 | warFeed — normalizacao defensiva · descarta qualquer entrada sem id utilizavel · nunca produz numeros invalidos ou negativos em 900 cenarios aleatorios · blinda campos hostis um a um sem quebrar … |
| `src/test/warLeadership.simulation.test.ts` | 18 | buildLeadSnapshot — saneamento · descarta lixo e valores hostis · reindexa posicoes por score, com desempate estavel · nao quebra com entrada nao-array … |
| `src/test/bossBattlePlanner.simulation.test.ts` | 17 | windowDays · retorna 0 para janelas invertidas ou inválidas · arredonda janelas parciais para cima · projectCapacity … |
| `src/test/memoryDeckAuthoring.simulation.test.ts` | 17 | normalização · colapsa espaços e remove pontas · compara ignorando caixa e acento · validateDeckDraft … |
| `src/test/mentorshipService.test.ts` | 17 | markMyPart · não concede recompensa duas vezes para a mesma parte · usa o valor da missão do banco e não fecha a missão colaborativa com um lado só · liquida a missão e soma os totais da dupla quando todos os lados exigidos concluem … |
| `src/test/notificationTypePrefs.simulation.test.ts` | 17 | normalizeTypePrefs · trata entradas invalidas como objeto vazio · descarta canais nao booleanos e prioridade vazia · preserva prioridade valida … |
| `src/test/sequenceGame.simulation.test.ts` | 17 | shuffleSteps · preserva o conjunto de etapas e é determinístico · nunca entrega a ordem correta de saída · tolera listas triviais e posições fora de ordem na origem … |
| `src/test/unifiedDevices.simulation.test.ts` | 17 | fingerprint — estabilidade e unicidade · é determinística para os mesmos sinais · muda quando qualquer sinal muda · nunca estoura com unicode nem com sinais ausentes … |
| `src/test/warAutoHooks.simulation.test.ts` | 17 | warAutoHooks — invariantes gerais (900 cenarios) · nunca lanca e sempre devolve intents validos · e deterministico: mesmo evento, mesmo resultado · dedupe keys sao unicas dentro de um mesmo evento … |
| `src/test/webauthnService.test.ts` | 17 | webauthnService.authenticate — login por passkey verificado no servidor · emite sessão só depois de options → get → verify e confirma o token · restrição de credenciais é repassada ao autenticador · não chama a rede quando a função não está na allowlist de deploy … |
| `src/tests/unit/feedback.test.ts` | 17 | feedbackService · createFeedbackRequest · le a linha inserida com maybeSingle, para nao derrubar a criacao quando a policy esconde a linha · devolve o pedido quando a leitura e permitida … |
| `src/test/boardStats.simulation.test.ts` | 16 | boardStats — invariantes de acurácia · nunca produz acurácia fora de 0..100 em 500 cenários aleatórios · resiste a NaN, Infinity, negativos e nulos · classifica as cinco faixas de dificuldade … |
| `src/test/bossLeaderboard.simulation.test.ts` | 16 | buildBossLeaderboard · ignora entradas sem dano ou sem usuário · consolida linhas duplicadas do mesmo usuário · atribui a mesma posição em caso de empate (1,2,2,4) … |
| `src/test/goalBetSearch.test.ts` | 16 | normalizeSearchText · remove acentos, caixa e espaços redundantes · tolera valores nulos · parseSearchTerms … |
| `src/test/wagerIntegrityExport.test.ts` | 16 | wagerIntegrityExport · inclui metadados do relatório no cabeçalho · exporta anomalia sem apuração como Pendente · casa a apuração pela chave usuário+código+janela … |
| `src/test/auctionAdmin.simulation.test.ts` | 15 | auctionAdmin — validação de rascunho · aceita um rascunho bem formado · rejeita título curto ou longo demais · rejeita valores econômicos inválidos … |
| `src/test/bossAutoHooks.simulation.test.ts` | 15 | bossAutoHooks — elegibilidade e seleção de alvo · rejeita batalhas fora da janela, sem HP ou não iniciadas · prioriza batalha do departamento sobre a global · ignora batalha de outro departamento … |
| `src/test/bossBattle.simulation.test.ts` | 15 | bossBattle — dano · nunca aplica overkill: HP jamais fica negativo (400 cenários) · respeita o cap por usuário e contabiliza o desperdício · bloqueia dano em boss já derrotado … |
| `src/test/campaignTeamHealth.simulation.test.ts` | 15 | campaignTeamHealth — casos base · retorna relatório vazio sem equipes · bloqueia equipe sem membros · bloqueia meta inválida (zero, negativa e NaN) … |
| `src/test/climateBenchmarkSegments.simulation.test.ts` | 15 | normalização de segmento · aceita todos os valores do catálogo · é tolerante a caixa e espaços · cai no padrão para lixo de entrada … |
| `src/test/luckyWheelPayoutComparison.simulation.test.ts` | 15 | funções estatísticas · erf é ímpar e limitada · normalCdf bate com valores tabelados · tTestPValue é monotônica e sempre em [0,1] … |
| `src/test/sequenceProcedureAuthoring.test.ts` | 15 | validateProcedureDraft · aceita um rascunho mínimo válido · exige título · exige o mínimo de etapas … |
| `src/test/luckyWheelPayoutCsv.simulation.test.ts` | 14 | buildPayoutCsv — estrutura · emite as quatro seções na ordem esperada · é determinístico para o mesmo relatório e metadados · suporta relatório totalmente vazio sem quebrar as seções … |
| `src/test/predictionAdmin.simulation.test.ts` | 14 | predictionAdmin — validação de rascunho · aceita um rascunho saudável · rejeita pergunta curta, longa e descrição excessiva · rejeita opções insuficientes, duplicadas, excessivas ou longas … |
| `src/test/pushFlow.simulation.test.ts` | 14 | push simulation :: 1. environment detection · cobre ${matrix.length} combinações (>=64) sem falso positivo · push simulation :: 2. subscribe orchestration · percorre ${matrix.length} cenários (>=240) sem estados inconsistentes … |
| `src/test/wagerAuthoring.test.ts` | 14 | wagerAuthoring · aceita um rascunho íntegro · rejeita enunciado curto · rejeita enunciado acima de 500 caracteres … |
| `src/test/wagerBudgetSettings.test.ts` | 14 | clampBudget · mantém valores válidos · trunca decimais · bloqueia negativos … |
| `src/tests/unit/combo.test.ts` | 14 | comboService · getComboTier — tier logic (pure) · returns Normal tier when actionsCount = 0 · returns correct tier at each threshold boundary … |
| `supabase/functions/_shared/contracts/webhook-versioning.contract.spec.ts` | 14 | webhook-dispatcher — versionamento v1/v2 · versões declaradas no contrato: v1 e v2; atual = v2; sunset no futuro em relação à data de criação · detecta a versão pelo campo version (ausente ou \ · v1 com version declarada explicitamente é aceita e tratada como v1 (não 422) … |
| `src/test/bingo.simulation.test.ts` | 13 | Bingo — geometria da cartela · possui exatamente 12 linhas de 5 casas, sem índices fora do intervalo · cada casa participa de pelo menos duas linhas (linha + coluna) · Bingo — detecção de linhas (cenários exaustivos por linha) … |
| `src/test/boardTrail.simulation.test.ts` | 13 | boardTrail — normalização · ordena, deduplica posições e sanea valores · rejeita tabuleiros curtos ou sem chegada · boardTrail — dado determinístico … |
| `src/test/clientUpdatePayloads.test.ts` | 13 | payloads de atualização respeitam colunas reais · avatar %s atualiza somente %s · avatar novo mantém user_id e permite limpar a seleção · datas do perfil não alteram outros campos … |
| `src/test/feedback360Flow.test.tsx` | 13 | aggregateFeedbackSummary · ranks repeated comments by real frequency, ignoring case and extra spaces · caps the ranking at the 5 most cited comments · computes average and breakdown by relationship … |
| `src/test/goalBetStakePreview.test.ts` | 13 | computeGoalBetStakePreview · bloqueia sem mercado · bloqueia opção inexistente · bloqueia mercado fora de  … |
| `src/test/memoryGame.simulation.test.ts` | 13 | buildMemoryBoard · gera duas cartas por par e limita o tamanho do tabuleiro · é determinístico para o mesmo seed e varia entre seeds · descarta pares com texto vazio e tolera baralhos menores que o limite … |
| `src/test/auction.simulation.test.ts` | 12 | auctionEngine — regras de lance · exige o lance inicial no primeiro lance · exige incremento mínimo ao aumentar o próprio lance · retém apenas a diferença ao aumentar (caução incremental) … |
| `src/test/bossHistory.simulation.test.ts` | 12 | bossHistory — regras determinísticas · ignora rascunhos e batalhas em andamento · limita HP destruído entre 0 e o total mesmo com dados inconsistentes · descarta duração de abate negativa ou ausente … |
| `src/test/campaignTeamMetrics.test.ts` | 12 | resolvePeriod · retorna janela aberta para todo o histórico · calcula janelas relativas sem deslocamento de fuso · campaignInPeriod … |
| `src/test/goalBetFilter.test.ts` | 12 | filterMarkets · all preserva a ordem recebida · open traz somente mercados abertos · closed traz apurados e anulados … |
| `src/test/goalBetPosition.test.ts` | 12 | computeGoalBetPosition · retorna vazio sem mercado ou sem aportes · ignora aportes de outros mercados · projeta rateio líquido com rake em mercado aberto … |
| `src/test/goalBetUrlState.test.ts` | 12 | sanitizeGoalBetQuery · apara e colapsa espaços · trunca consultas patológicas · tolera valores nulos … |
| `src/test/slaTargets.simulation.test.ts` | 12 | slaTargets — parseMinutes · rejeita entradas não numéricas · aceita vírgula decimal e espaços · slaTargets — validação hostil (cartesiano) … |
| `src/test/bossAlerts.simulation.test.ts` | 11 | bossAlerts — travessia de fases · emite o alerta correto em cada limiar · emite apenas a fase mais grave quando várias são cruzadas de uma vez · não alerta quando o HP sobe ou não muda … |
| `src/test/predictiveFeedback.test.ts` | 11 | predictiveFeedbackService — pure logic · returns a bounded score between 0 and 100 · classifies critical when inactive for a week or more · classifies critical for very low score regardless of inactivity … |
| `src/test/pushOutboxHealth.simulation.test.ts` | 11 | pushOutboxHealth — invariantes · fila saudável recebe score 100 e severidade ok · fila vazia sem histórico não acusa despachante parado · backlog crítico rebaixa severidade e score … |
| `src/test/tradingCards.simulation.test.ts` | 11 | Álbum de Cartas — simulação massiva · preserva invariantes de sorteio, garantia e contabilidade em 800 cenários · é determinístico e indiferente à ordem de chegada do pool · resiste a pool corrompido sem lançar exceção … |
| `src/test/xpBalancing.test.ts` | 11 | xpBalancingService · computeGini retorna 0 para distribuição uniforme · computeGini retorna alto para distribuição desigual · median e mean funcionam … |
| `tests/e2e/smoke.spec.ts` | 11 | Smoke — bootstrap da aplicação · carrega /auth sem erros de console críticos · rota protegida redireciona para /auth quando deslogado · rota /previsoes da gamificacao e protegida e navega de verdade … |
| `src/test/boardChallenge.simulation.test.ts` | 10 | resolveChallenge · credita a recompensa integral no acerto de primeira · credita metade na segunda tentativa · mantém travado com tentativa restante … |
| `src/test/campaignTeamSplitRevert.simulation.test.ts` | 10 | revertCampaignTeamSplit — casos de borda · recusa lote inexistente · é idempotente: segunda reversão não estorna de novo · não reverte lote sem linhas pagas … |
| `src/test/goalBetSettlement.test.ts` | 10 | goalBetSettlement · S1: sem ninguém batendo a meta, vence a opção “ninguém” · S1b: sem opção “ninguém”, sugere reembolso · aponta o líder que bateu a meta … |
| `src/test/lightningQuiz.simulation.test.ts` | 10 | Verdadeiro/Falso Relâmpago — motor de recompensa · cobre exaustivamente as 121 combinações de acertos x sequência · é monotônico: mais acertos nunca reduzem a recompensa · não paga nada em rodada zerada e respeita o teto na rodada perfeita … |
| `src/test/luckyWheelComparisonAlerts.simulation.test.ts` | 10 | decideComparisonAlerts · não alerta em séries estáveis (200 sementes) · alerta regressão de custo quando o custo por giro dobra · alerta estouro de orçamento mesmo sem significância … |
| `src/test/playerResume.simulation.test.ts` | 10 | retomada do player — simulação · isola a chave por usuário e módulo (400 combinações) · rejeita payloads hostis ou malformados · descarta sessões expiradas e relógios adiantados (300 cenários) … |
| `src/tests/unit/profiles.test.ts` | 10 | profilesService · getById · should return profile data on success · addXp … |
| `supabase/functions/_shared/contracts/registry.contract.spec.ts` | 10 | registro de contratos cobre TODAS as edge functions · cada pasta de supabase/functions tem contrato e fixtures (nenhum endpoint sem validação) · cada contrato é coerente (nome = chave, métodos, auth, schema) · funções com corpo obrigatório têm casos de campo ausente, tipo errado e valor vazio … |
| `src/test/auctionDelivery.simulation.test.ts` | 9 | resolveAuctionDelivery — casos determinísticos · não entrega nada quando ninguém deu lance · leilão simbólico não mexe em estoque · estoque ilimitado sempre reserva … |
| `src/test/goalBetExposure.test.ts` | 9 | computeGoalBetExposure · sem aportes não há exposição · ignora mercados já apurados ou anulados · classifica exposição segura … |
| `src/test/goalBetHistory.test.ts` | 9 | computeGoalBetHistory · retorna vazio sem dados · ignora mercados ainda abertos ou travados · computa acerto, lucro e ROI … |
| `src/test/predictionWatchdog.simulation.test.ts` | 9 | predictionWatchdog — regras individuais · ignora rascunhos e estados terminais · respeita a carência antes de acusar falha do cron · cobra a apuração só depois de 24h travado … |
| `src/test/sequenceProcedureStats.test.ts` | 9 | parseSequenceProcedureStats · devolve estrutura vazia para payloads inválidos · sanea números negativos, NaN e acertos maiores que a amostra · ordena a série diária e descarta linhas sem chave … |
| `src/test/sequenceProcedureStatsExport.test.ts` | 9 | buildSequenceStatsCsv · emite todas as seções na ordem esperada · usa CRLF e aspas em todas as células (RFC 4180) · neutraliza fórmulas e escapa aspas/vírgulas … |
| `src/test/useTypePreferences.test.tsx` | 9 | useTypePreferences · aplica defaults quando o banco esta vazio · hidrata valores existentes do banco · escreve de forma aditiva, preservando tipos de outros modulos … |
| `src/test/luckyWheelPayoutTrendCsv.simulation.test.ts` | 8 | buildPayoutTrendCsv — simulação massiva · mantém uma linha por dia da janela em 200 cenários aleatórios · nunca emite quebras de linha extras dentro das células · neutraliza tentativas de CSV injection no rótulo do período … |
| `src/test/pushOutbox.simulation.test.ts` | 8 | fila de push — máquina de estados · entrega no primeiro sucesso · erro permanente não consome retries extras · erro transitório volta para a fila até esgotar tentativas … |
| `src/test/boardStatsExport.simulation.test.ts` | 7 | boardStatsExport — invariantes · mantém cabeçalho estável e uma linha por desafio · neutraliza CSV injection e escapa aspas/vírgulas/quebras · não quebra com payload vazio, nulo ou corrompido … |
| `src/test/bossDepartmentComparison.simulation.test.ts` | 7 | compareDepartments — simulação massiva · mantém invariantes em 800 cenários · normaliza janela invertida · agrupa batalhas sem departamento em bucket explícito … |
| `src/test/cardPackNotifications.simulation.test.ts` | 7 | notificação de pacote de cartas · gera payload válido para toda origem e tamanho 1..20 (120 cenários) · chave de dedupe é única por pacote (1000 cenários) · mesmo pacote sempre produz a mesma chave (determinismo) … |
| `src/test/exportReports.test.ts` | 7 | exportReports · gera CSV com cabeçalho, título das seções e colunas declaradas · formata percentual e marca valores ausentes com - · infere colunas da primeira linha quando não declaradas … |
| `src/test/goalBetCountdown.test.ts` | 7 | computeGoalBetCountdown · ignora mercados que não estão abertos · marca como fechado quando o prazo já passou · classifica urgência por faixas … |
| `src/test/goalBetHistoryCsv.test.ts` | 7 | buildGoalBetHistoryCsv · gera cabeçalho, linhas e totais · neutraliza injeção de fórmula e escapa separador · data inválida vira campo vazio e anulado é rotulado … |
| `src/test/goalBetOrdering.test.ts` | 7 | sortMarketsByUrgency · coloca abertos antes de travados, apurados, anulados e rascunhos · dentro dos abertos, quem fecha antes vem primeiro · encerrados saem do mais recente para o mais antigo … |
| `src/test/goalBetting.test.ts` | 7 | goalBetting · ordena por percentual e ignora quem recusou a meta · gera rótulos únicos para homônimos (B1) · respeita o teto de opções do servidor (B2) … |
| `src/test/predictionOracle.simulation.test.ts` | 7 | ranking Oráculo — simulação massiva · preserva invariantes de pontuação, ordenação e elegibilidade · é indiferente à ordem de chegada dos aportes · não recompensa quem apenas copia o consenso … |
| `src/test/scratchCardOdds.simulation.test.ts` | 7 | Raspadinha — grade semeada · soma 100% de probabilidade e não tem prêmio inalcançável · não produz problemas bloqueantes de configuração · mapeia todos os rolls possíveis para um prêmio válido e contíguo … |
| `src/test/useUnsavedChanges.test.tsx` | 7 | useUnsavedChanges · bloqueia beforeunload quando ha alteracoes nao salvas · nao bloqueia beforeunload quando o formulario esta limpo · remove o listener ao desmontar … |
| `tests/e2e/happy-paths.spec.ts` | 7 | Happy Paths - Task Gifts · 1. Fluxo de login redireciona para a dashboard · 2. Rota protegida /profile redireciona para /auth sem sessao · 3. Rota protegida /trails redireciona para /auth sem sessao … |
| `src/test/bossReport.simulation.test.ts` | 6 | buildBossReport — simulação massiva · mantém coerência entre seções em 600 cenários · gera CSV multi-seção seguro contra injeção de fórmula · sem janela, o resumo equivale ao motor de histórico … |
| `src/test/bossWinRateGoals.simulation.test.ts` | 6 | evaluateWinRateGoals — simulação massiva · mantém invariantes em 800 cenários · não sobrepõe janelas: batalha do limite entra em apenas uma · detecta queda crítica de aproveitamento … |
| `src/test/certificates.simulation.test.ts` | 6 | certificados verificáveis — simulação · gera códigos sempre no formato público esperado (500 cenários) · nunca usa caracteres ambíguos (0, O, 1, I) · monta URL de verificação absoluta e sem barras duplicadas … |
| `src/test/invokeEdgeSafe.simulation.test.ts` | 6 | backoffDelayMs · cresce exponencialmente e respeita o teto (500 amostras) · normaliza tentativas inválidas para a primeira · política de retry … |
| `src/test/notificationPrefsCrossModule.simulation.test.ts` | 6 | preferencias compartilhadas entre modulos · nao perde tipos de outros modulos em 400 sequencias aleatorias · preserva a prioridade do modulo executivo apos escritas de outros modulos · silenciar push em lote nos jogos nao altera campanhas nem executivo … |
| `src/test/predictionOddsHistory.simulation.test.ts` | 6 | histórico de cotações — simulação massiva · preserva conservação do pote, normalização e coerência dos multiplicadores · é determinístico e imune à ordem de chegada das linhas · descarta linhas órfãs sem corromper a série … |
| `src/test/rpcAccess.test.ts` | 6 | anon deve receber 42501 ao chamar ${fn} · anon deve receber erro ao chamar get_leaderboard_api · anon deve receber erro ao chamar get_user_stats_api · anon deve receber erro ao chamar get_2fa_status de outro usuário … |
| `src/tests/unit/shop.test.ts` | 6 | shopService · purchaseReward · should throw error if item is out of stock · should throw error if spend_coins fails (insufficient coins) … |
| `src/test/auctionNotifications.simulation.test.ts` | 5 | notificações de apuração de leilão · não notifica ninguém quando não há lances · avisa o vencedor de item esgotado em vez de vitória · respeita a preferência desligada sem suprimir o estorno … |
| `src/test/boardStatsPdf.simulation.test.ts` | 5 | boardStatsPdf — invariantes · gera nome .pdf coerente com o CSV e cabeçalho estável · tolera payload nulo/corrompido sem lançar nem vazar NaN · boardStatsPdf — simulação em massa … |
| `src/test/bossDepartmentComparisonExport.simulation.test.ts` | 5 | buildBossComparisonCsv — simulação massiva · mantém integridade em 600 cenários · escapa aspas, vírgulas e fórmulas nos rótulos · gera nomes de arquivo seguros e estáveis … |
| `src/test/bossHistoryExport.simulation.test.ts` | 5 | buildBossHistoryCsv — simulação massiva · mantém invariantes em 600 cenários · ignora rascunhos e batalhas em andamento · escapa aspas duplicando-as … |
| `src/test/bossHistoryTrend.simulation.test.ts` | 5 | buildBossHistoryTrend — simulação massiva · mantém invariantes em 700 cenários · preenche meses vazios entre extremos · calcula delta em pontos percentuais entre meses ativos … |
| `src/test/goalBetShowcase.test.ts` | 5 | goalBetShowcase · V1: ignora mercados de outras campanhas e títulos comuns · V2: prioriza aberto sobre travado, apurado e rascunho · V3: desempata pelo travamento mais recente e é determinístico … |
| `src/test/i18n.test.ts` | 5 | i18n translations · expõe pt-BR como locale padrão · cobre todos os locais suportados com nome e bandeira · mantém paridade das chaves top-level entre locais … |
| `src/test/luckyWheelBudget.simulation.test.ts` | 5 | luckyWheelBudget · rejeita entradas hostis · aceita vírgula decimal e arredonda em 2 casas · mantém limites em 500 cenários aleatórios … |
| `src/test/luckyWheelBudgetWhatIf.simulation.test.ts` | 5 | simulateBudgetScenarios · é monotônico: teto maior nunca gera mais alertas (300 cenários) · break-even silencia o estouro e um centavo abaixo dispara (150 cenários) · tolera entradas hostis sem lançar … |
| `src/test/luckyWheelWhatIfSignature.simulation.test.ts` | 5 | what-if — assinatura de auditoria · é determinística para a mesma entrada · muda quando janela, teto ou grade mudam · tolera comparação nula sem lançar … |
| `src/test/nr1ActionPlan.simulation.test.ts` | 5 | NR-1 → plano de tratativa (simulação combinatória) · gera prazo legal coerente para todos os graus possíveis · prazo é monotonicamente menor conforme o risco cresce · meta de score nunca ultrapassa 10 nem regride … |
| `src/test/predictionRunbooks.test.ts` | 5 | cobertura de runbooks para os alertas de previsão · gera exatamente um alerta de cada tipo no cenário base · todo alerta emitido resolve para um runbook existente · os runbooks de previsão têm as quatro fases preenchidas … |
| `src/test/uiLibraryContracts.test.tsx` | 5 | contratos das bibliotecas de UI instaladas · calendário seleciona uma data e navega para o próximo mês · painéis preservam orientação e tamanhos percentuais da API anterior · tooltip entrega o payload inteiro como quinto argumento do formatter … |
| `src/tests/unit/notifications.test.ts` | 5 | notificationsService · create · should insert a notification and return it · markAsRead … |
| `src/tests/unit/onboarding.test.ts` | 5 | onboardingService · completeStep · should return true on success · isOnboardingComplete … |
| `src/tests/unit/weeklyChallenge.test.tsx` | 5 | useWeeklyChallenge - notificacao do desafio · inclui o id do desafio no payload das notificacoes · mantem o desafio quando o aviso ao oponente e recusado pela RLS · gera payloads distintos em desafios de semanas diferentes (nao colide no indice unico) … |
| `src/components/shop/__tests__/ProductGridLoading.test.tsx` | 4 | Shop Skeleton and Loading State · should display skeletons while rewards are loading · should transition from skeletons to content smoothly · should maintain layout stability during search/filtering loading |
| `src/test/edgeAvailability.test.ts` | 4 | isFunctionDeployed — allowlist compilada · allowlist vazia bloqueia todas as funções (kill switch documentado) · passkey-auth é reconhecida mesmo quando a env do Vercel não a lista · função fora da lista continua bloqueada |
| `src/test/nr1Export.simulation.test.ts` | 4 | Exportação NR-1 (simulação combinatória) · nunca emite célula vazia ou  · marca plano obrigatório exatamente para riscos alto e crítico · gera nome de arquivo seguro para recortes com acentos e símbolos |
| `src/test/passkeysPanel.test.tsx` | 4 | PasskeysPanel — cadastro so quando o login por passkey funciona · libera o cadastro quando a funcao esta publicada e a conta nao exige segundo fator · bloqueia o cadastro e explica quando a conta exige verificacao em duas etapas · bloqueia o cadastro quando a funcao nao esta liberada no ambiente |
| `src/test/validationLibraryContracts.test.ts` | 4 | migração de validação preserva mensagens e resultados · mantém mensagem obrigatória em entrada ausente · validateData retorna mensagens Zod 4 sem lançar exceção · XLSX preserva fórmulas/rich text e rejeita erros/booleanos como crédito |
| `src/tests/unit/access.test.tsx` | 4 | ProtectedRoute · should redirect to login if not authenticated · should show content if authenticated and no RBAC check needed · should show access denied if RBAC check fails |
| `src/tests/unit/achievements.test.ts` | 4 | achievementsService · unlockAchievement · should award rewards and create notification if not already unlocked · should return alreadyUnlocked if already has it |
| `src/tests/unit/audit.test.ts` | 4 | auditService · log · should insert an audit log into the database · should silently handle errors |
| `src/tests/unit/badges.test.ts` | 4 | Behavioral Badges Conditions · Feedback Champion Bronze condition should pass with 10 feedbacks · Check-in Regular condition should pass with 4 consecutive weeks · Goal Perfectionist should only pass if totalGoals > 0 and all are on track |
| `src/tests/unit/device.test.ts` | 4 | useDeviceDetection · generateFingerprint · should generate a consistent fingerprint string · should correctly identify browser and OS from user agent |
| `tests/auth-flow.spec.ts` | 4 | Autenticação e Proteção de Rotas 10/10 · redirecionamento de não autenticado para /auth · página /auth exibe formulário de login · acesso à página de recuperar senha |
| `src/test/pushRevocationBroadcast.simulation.test.ts` | 3 | buildRevocationBroadcast — simulação combinatória · cobre id × apelido × atual × relógio · resiste a entradas inválidas |
| `src/test/pushRevocationNotice.simulation.test.ts` | 3 | buildRevocationNotice — simulação combinatória · cobre todas as combinações id × apelido × atual × relógio · é resiliente a entradas inválidas |
| `src/test/rls.test.ts` | 3 | Anon user should be able to read public profile fields · Anon user should NOT be able to insert into profiles · Anon user should NOT be able to view private kudos |
| `src/tests/unit/checkins.test.ts` | 3 | checkinsService · toggleActionItem · should flip completed status of the correct action item |
| `src/tests/unit/kudos.test.ts` | 3 | kudosService · giveKudos · should award XP to recipient and register combo action |
| `src/tests/unit/leagues.test.ts` | 3 | leaguesService · addWeeklyXP · should update weekly XP if user league exists |
| `src/tests/unit/logger.test.ts` | 3 | LoggingService · should store logs and keep them under max limit · should format message with context correctly |
| `src/tests/unit/trails.test.ts` | 3 | trailsService · completeModule · should register action in comboService and add XP to profile |
| `src/test/sentryPrivacy.test.ts` | 1 | configuração Sentry 11 mantém coleta restritiva sem corpos ou entradas de IA |

## L. Eventos de webhook tratados (contratos com sistemas externos)

| Evento | Arquivo |
|---|---|
| `CACHE_ASSETS` | `public/sw.js` |
| `SHOW_NOTIFICATION` | `public/sw.js` |
| `SKIP_WAITING` | `public/sw.js` |
| `verify` | `supabase/functions/_shared/contracts/passkey-auth.ts` |

## M. Efeitos colaterais (e-mail, SMS, cobrança, fila — não são idempotentes por padrão)

| Chamada | Arquivo |
|---|---|
| `.add("focus-visible-enabled"` | `src/components/accessibility/AccessibilityProvider.tsx` |
| `.add("font-large"` | `src/components/accessibility/AccessibilityProvider.tsx` |
| `.add("font-larger"` | `src/components/accessibility/AccessibilityProvider.tsx` |
| `.add("high-contrast"` | `src/components/accessibility/AccessibilityProvider.tsx` |
| `.add("reduce-motion"` | `src/components/accessibility/AccessibilityProvider.tsx` |
| `publish(` | `src/hooks/useAuctions.ts` |
| `publish(` | `src/hooks/useBossBattles.ts` |
| `notifyAchievement` | `src/hooks/usePushNotifications.ts` |
| `notifyChallengeExpiring` | `src/hooks/usePushNotifications.ts` |
| `notifyComboMultiplier` | `src/hooks/usePushNotifications.ts` |
| `notifyDuelChallenge` | `src/hooks/usePushNotifications.ts` |
| `notifyDuelResult` | `src/hooks/usePushNotifications.ts` |
| `notifyKudos` | `src/hooks/usePushNotifications.ts` |
| `notifyLevelUp` | `src/hooks/usePushNotifications.ts` |
| `notifyQuestComplete` | `src/hooks/usePushNotifications.ts` |
| `notifyStreakMilestone` | `src/hooks/usePushNotifications.ts` |
| `notify` | `src/hooks/useSecurityPushNotifications.ts` |
| `notifyNewDevice` | `src/hooks/useSecurityPushNotifications.ts` |
| `notifySecurityAlert` | `src/hooks/useSecurityPushNotifications.ts` |
| `enqueue(` | `src/hooks/useTypePreferences.ts` |
| `notify` | `src/hooks/useWarLeadership.ts` |
| `publish(` | `src/services/auctionService.ts` |
| `publish(` | `src/services/bossBattleService.ts` |
| `notifyAchievement` | `src/services/notificationsService.ts` |
| `notifyCompetencyGap` | `src/services/notificationsService.ts` |
| `notifyDevelopmentTip` | `src/services/notificationsService.ts` |
| `notifyLeaderboardChange` | `src/services/notificationsService.ts` |
| `notifyLevelUp` | `src/services/notificationsService.ts` |
| `notifyQuestAssigned` | `src/services/notificationsService.ts` |
| `notifyXpGain` | `src/services/notificationsService.ts` |
| `notifyLevelUp` | `src/services/profilesService.ts` |
| `notifyXpGain` | `src/services/profilesService.ts` |
| `notifyRevocation` | `src/services/pushSubscriptionService.ts` |
| `notifyQuestAssigned` | `src/services/questsService.ts` |
| `notify` | `src/services/shopService.ts` |
| `invoke(` | `supabase/functions/burn-rate-monitor/index.ts` |
| `sendNotification` | `supabase/functions/push-device-revoked/index.ts` |
| `sendNotification` | `supabase/functions/push-outbox-dispatcher/index.ts` |
| `sendNotification` | `supabase/functions/send-campaign-push/index.ts` |
| `notify_admins_of_monthly_report` | `supabase/migrations/20260712222653_8d3916b2-c16d-4d4e-9a18-7fde8939b0fe.sql` |
| `notify_admins_of_monthly_report` | `supabase/migrations/20260712222801_f2380764-d126-47be-b005-692d6449061f.sql` |

## N. Regras citadas em comentários do código

| Comentário | Arquivo |
|---|---|
| - Em dev/preview: sem replays de sessão contínua (apenas em erro), traces amostrados. | `src/main.tsx` |
| Limit to 5 trails | `src/components/AICoachDialog.tsx` |
| CustomTooltip must be a simple function (not a component receiving refs) | `src/components/CompetencyRadar.tsx` |
| Fail open: indisponibilidade do verificador não pode travar o acesso. | `src/components/IpAccessGuard.tsx` |
| Evita disparos concorrentes que estouram o rate limit da edge function. | `src/components/TrailRecommendations.tsx` |
| momento — o banco guarda apenas o hash, então não há como recuperá-lo depois. | `src/components/admin/IssuedCredentialDialog.tsx` |
| Toggle permission | `src/components/admin/RolePermissionsManager.tsx` |
| e direciona o comportamento (entregar no prazo vale mais que entregar). | `src/components/boss/BossDamageSourcesCard.tsx` |
| * Visível apenas para gestores e administradores — a leitura consolidada de | `src/components/boss/BossExecutiveSummaryCard.tsx` |
| Libera a memória apenas após o download ser iniciado pelo browser. | `src/components/boss/BossHistoryCard.tsx` |
| Hidrata os controles com o padrão global persistido apenas uma vez, para | `src/components/boss/BossWinRateGoalsCard.tsx` |
| e cópia do link público de validação. | `src/components/certifications/CertificateActions.tsx` |
| * Exibido quando o recorte não atinge o mínimo de respondentes. */ | `src/components/engagement/diagnostics/AnonymityGuardNotice.tsx` |
| * Grau máximo teórico da matriz (probabilidade 10 x severidade 3). */ | `src/components/engagement/nr1/Nr1RiskMatrix.tsx` |
| A animação apenas para no setor que o servidor já sorteou. | `src/components/luckywheel/LuckyWheel.tsx` |
| append-only escrita por trigger no banco — o frontend apenas lê. | `src/components/luckywheel/LuckyWheelAuditTrail.tsx` |
| componente apenas apresenta. | `src/components/luckywheel/LuckyWheelPayoutTrend.tsx` |
| `comparePayoutWindows` — este componente apenas apresenta. | `src/components/luckywheel/LuckyWheelWindowComparison.tsx` |
| * Criação de mercado com validação espelhada do servidor (falha antes do RPC). */ | `src/components/prediction/CreateMarketDialog.tsx` |
| * Painel de saúde operacional. Destaca em tom de alerta apenas os estados que | `src/components/prediction/PredictionOverviewCards.tsx` |
| Pré-seleciona apenas sugestões seguras; empates e casos ambíguos exigem | `src/components/prediction/SettleMarketDialog.tsx` |
| Trava de reentrância: cliques repetidos saturam o rate limit da IA. | `src/components/quiz/AIQuestionGenerator.tsx` |
| // Verificar permissão | `src/components/rbac/AccessControl.tsx` |
| // Verificar nível mínimo | `src/components/rbac/AccessControl.tsx` |
| * RequirePermission - Atalho para verificar permissão específica | `src/components/rbac/AccessControl.tsx` |
| * RequireLevel - Atalho para verificar nível mínimo | `src/components/rbac/AccessControl.tsx` |
| // Apenas autenticado | `src/components/rbac/ProtectedRoute.tsx` |
| // Requer permissão específica | `src/components/rbac/ProtectedRoute.tsx` |
| // Requer nível mínimo 60 | `src/components/rbac/ProtectedRoute.tsx` |
| Se não precisa de verificação RBAC, apenas autenticação | `src/components/rbac/ProtectedRoute.tsx` |
| Check if user has required access | `src/components/rbac/ProtectedRoute.tsx` |
| A validação usa exclusivamente o motor puro `validateSlaDraft`, já coberto por simulação. | `src/components/security/SlaTargetEditor.tsx` |
| * Quando verdadeiro, a lista fica somente leitura (após enviar). */ | `src/components/sequence/SequenceStepList.tsx` |
| Triagem: o filtro afeta apenas a exibição; a exportação segue completa | `src/components/wager/WagerIntegrityCard.tsx` |
| * Persiste orçamento e participantes esperados (somente admin). */ | `src/components/wager/WagerMonthlyExposureCard.tsx` |
| equipes são buscadas apenas das campanhas visíveis, evitando payload inútil. | `src/hooks/useCampaignTeamsDashboard.ts` |
| @param limit - Minimum time between calls in milliseconds (default: 300ms) | `src/hooks/useDebounce.ts` |
| \| `termo1 termo2` \| AND (both terms must match)     \| `react hook`      \| | `src/hooks/useFuseSearch.ts` |
| A decisão continua sendo do administrador — isto é apenas evidência. | `src/hooks/useGoalBetSuggestion.ts` |
| Limite defensivo: evita URLs gigantes e buscas patológicas. | `src/hooks/useGoalBetUrlSync.ts` |
| * Histórico imutável de calibração (somente admins conseguem ler via RLS). */ | `src/hooks/useLuckyWheel.ts` |
| * Trilha auditável das ações administrativas (RLS: apenas admin). */ | `src/hooks/usePredictionMarkets.ts` |
| If requireAll, all checks must pass; otherwise any check passing is enough | `src/hooks/useRBAC.ts` |
| * Usado apenas em logs, para identificar o modulo de origem. */ | `src/hooks/useTypePreferences.ts` |
| placares nao deve provocar re-render extra, e o primeiro ciclo apenas | `src/hooks/useWarLeadership.ts` |
| recusa do aviso ao oponente nao pode derrubar o desafio. | `src/hooks/useWeeklyChallenge.ts` |
| Regra crítica: encerrar (`close`) apura vencedor e consome a caução; cancelar | `src/lib/auctionAdmin.ts` |
| - cada participante recebe no máximo UMA notificação; | `src/lib/auctionAdmin.ts` |
| - preferências desligadas suprimem a notificação, nunca o estorno; | `src/lib/auctionAdmin.ts` |
| Password strength validation | `src/lib/authValidations.ts` |
| * Espelha `sync_bingo_card`: credita apenas as linhas novas | `src/lib/bingoEngine.ts` |
| * Invariantes de negócio (replicados na RPC `resolve_board_challenge`): | `src/lib/boardChallenge.ts` |
| - a seção "Prioridades" repete apenas o subconjunto já classificado pelo | `src/lib/boardStatsPdf.ts` |
| motor (`needsAttention`), sem nenhuma regra estatística nova aqui; | `src/lib/boardStatsPdf.ts` |
| * Chave idempotente de uma jogada — deve ser enviada à RPC para garantir que | `src/lib/boardTrail.ts` |
| * Validação e simulação puras da autoria da "Trilha Tipo Tabuleiro". | `src/lib/boardTrailAuthoring.ts` |
| * Partidas que alcançaram a Chegada dentro do limite de jogadas. */ | `src/lib/boardTrailAuthoring.ts` |
| para 5% em um único golpe deve gerar UM alerta (o da fase final atingida), | `src/lib/bossAlerts.ts` |
| emitimos apenas a mais grave — é a informação que muda o comportamento. | `src/lib/bossAlerts.ts` |
| tarefa já concluída não pode bater no chefão de novo — por isso cada | `src/lib/bossAutoHooks.ts` |
| regra observa a transição (estado anterior → novo), nunca o estado | `src/lib/bossAutoHooks.ts` |
| configuração inválida de combo nunca deve virar dano gigante. | `src/lib/bossAutoHooks.ts` |
| * Tarefa entregue no prazo e sem retrabalho causa dano uma única vez. */ | `src/lib/bossAutoHooks.ts` |
| * Dano máximo projetado que o time consegue aplicar na janela. */ | `src/lib/bossBattlePlanner.ts` |
| * Dias corridos entre início e fim, arredondados para cima, mínimo 0. */ | `src/lib/bossBattlePlanner.ts` |
| * Valida um rascunho. Erros bloqueiam a publicação; avisos apenas alertam | `src/lib/bossBattlePlanner.ts` |
| outro com 20 vitórias apenas por 100% de aproveitamento: aplica-se | `src/lib/bossDepartmentComparison.ts` |
| * Melhor e pior departamento da janela (mínimo de batalhas respeitado). */ | `src/lib/bossExecutiveSummary.ts` |
| * Máximo de alertas retornados. Padrão 6. */ | `src/lib/bossExecutiveSummary.ts` |
| * Mantém apenas os N meses mais recentes (0 = todos). Padrão: 12. */ | `src/lib/bossHistoryTrend.ts` |
| * Regras de negócio: | `src/lib/bossLeaderboard.ts` |
| `evaluateWinRateGoals` como fonte única da verdade — aqui não há regra | `src/lib/bossReport.ts` |
| estatística nova, apenas composição; | `src/lib/bossReport.ts` |
| * Mínimo de batalhas na janela atual para avaliar. Padrão 1. */ | `src/lib/bossWinRateGoals.ts` |
| `target`/`tolerancePp` apenas para os departamentos informados. | `src/lib/bossWinRateGoals.ts` |
| * Limite defensivo para evitar travar o browser com planilhas absurdas. */ | `src/lib/campaignImport.ts` |
| * Registro minimo de diretorio usado para casar o identificador da planilha. */ | `src/lib/campaignImport.ts` |
| * Aceita apenas ids plausiveis: evita gravar lixo vindo da UI. */ | `src/lib/campaignImport.ts` |
| Nunca lanca; retorna no maximo `limit` candidatos ordenados por confianca. | `src/lib/campaignImport.ts` |
| exige alterar a planilha, nao apenas apontar o colaborador certo. | `src/lib/campaignImport.ts` |
| * ISO `YYYY-MM-DD` inclusivo, ou `null` para "sem limite". */ | `src/lib/campaignTeamMetrics.ts` |
| * Qualquer mudança na função SQL DEVE ser refletida aqui (e vice-versa). | `src/lib/campaignTeamSplit.ts` |
| * Regra de rateio persistida em `sales_campaigns.split_rule`. */ | `src/lib/campaignTeamSplit.ts` |
| * Qualquer mudança na RPC SQL DEVE ser refletida aqui (e vice-versa). | `src/lib/campaignTeamSplitRevert.ts` |
| administrativo inflacionasse o estoque. Por isso cada regra observa a | `src/lib/cardPackTriggers.ts` |
| nunca deve virar pacote gigante. | `src/lib/cardPackTriggers.ts` |
| * Tarefa entregue no prazo, sem retrabalho e sem atraso registrado. | `src/lib/cardPackTriggers.ts` |
| Aqui apenas saneamos o payload e derivamos números para a interface — | `src/lib/dailyWager.ts` |
| * Teto real da aposta: limite da pergunta cruzado com o saldo disponível. */ | `src/lib/dailyWager.ts` |
| * Bonus multiplicativo maximo por taxa de participacao (0 = desligado). */ | `src/lib/departmentWar.ts` |
| * Motor puro de validacao e projecao economica da configuracao de uma | `src/lib/departmentWarConfig.ts` |
| * Projeta o custo maximo da guerra. | `src/lib/departmentWarConfig.ts` |
| * Revisa o rascunho: erros bloqueiam o salvamento, avisos apenas alertam. | `src/lib/departmentWarConfig.ts` |
| * Limite gravado no banco — mantém o rótulo legível em badges e listas. */ | `src/lib/deviceLabel.ts` |
| * Sugestão de apelido a partir do user agent — usada apenas como valor inicial | `src/lib/deviceLabel.ts` |
| silêncio — o painel nunca deve renderizar um item sem significado. | `src/lib/deviceLabel.ts` |
| 405 (GET) e 422 de validação (POST) desde 2026-11-24, nunca 404. A env do Vercel | `src/lib/edgeAvailability.ts` |
| tela branca quando a função respondia 429 (rate limit). | `src/lib/edgeErrors.ts` |
| * Segundos sugeridos de espera (apenas em `rate_limited`). */ | `src/lib/edgeErrors.ts` |
| * Retorna a string apenas se ela tiver conteúdo útil. */ | `src/lib/edgeErrors.ts` |
| Permission errors | `src/lib/errorMessages.ts` |
| * Acima disto pedimos atenção; acima do limite alto, alertamos forte. */ | `src/lib/goalBetExposure.ts` |
| * Exposição determinística do apostador: soma apenas os aportes em mercados | `src/lib/goalBetExposure.ts` |
| * Histórico determinístico do apostador: considera apenas mercados já | `src/lib/goalBetHistory.ts` |
| Data inválida nunca deve "furar a fila" da urgência. | `src/lib/goalBetOrdering.ts` |
| 1. Abertos que já passaram do prazo continuam entre os abertos (o servidor | `src/lib/goalBetOrdering.ts` |
| `settle_prediction_market`. Este módulo apenas evita que um administrador | `src/lib/goalBetSettlement.ts` |
| S1. Ninguém bateu a meta => opção "ninguém" quando existe, senão reembolso. | `src/lib/goalBetSettlement.ts` |
| * Motivo pelo qual um aporte não pode ser confirmado. */ | `src/lib/goalBetStakePreview.ts` |
| * Tamanho máximo aceito para a busca vinda da URL. */ | `src/lib/goalBetUrlState.ts` |
| `place_prediction_stake`, `settle_prediction_market`); aqui apenas | `src/lib/goalBetting.ts` |
| * Rótulos únicos e dentro do limite de tamanho. Homônimos recebem sufixo | `src/lib/goalBetting.ts` |
| usado apenas para (a) prever a recompensa na UI e (b) permitir simulação | `src/lib/lightningQuizScoring.ts` |
| * Segundos restantes até o prazo, nunca negativo. */ | `src/lib/lightningQuizScoring.ts` |
| feito por trigger no servidor, de onde o cliente apenas LÊ. Assim o histórico | `src/lib/luckyWheelAudit.ts` |
| storage indisponível: mantém apenas em memória */ | `src/lib/luckyWheelBudget.ts` |
| O localStorage vira apenas cache otimista para leitura offline. | `src/lib/luckyWheelBudget.ts` |
| Nunca lança: falhas de permissão/rede devolvem lista vazia. | `src/lib/luckyWheelBudget.ts` |
| mínimo que mantém a janela atual silenciosa (break-even). | `src/lib/luckyWheelBudgetWhatIf.ts` |
| * Apenas o alerta de estouro de teto dispararia? */ | `src/lib/luckyWheelBudgetWhatIf.ts` |
| Teto ausente (0) => decideComparisonAlerts ignora a regra de estouro. | `src/lib/luckyWheelBudgetWhatIf.ts` |
| * Orçamento máximo de moedas por giro. Quando informado (> 0) e a janela | `src/lib/luckyWheelComparisonAlerts.ts` |
| * Efeito mínimo (Cohen's d) para considerar a variação relevante. Padrão: 0,5. */ | `src/lib/luckyWheelComparisonAlerts.ts` |
| acontece exclusivamente no servidor. Aqui é apenas projeção/validação. | `src/lib/luckyWheelOdds.ts` |
| * Número máximo de setores legíveis na roleta. */ | `src/lib/luckyWheelOdds.ts` |
| negativo como -2.5 não pode ser prefixado, senão vira texto na planilha. | `src/lib/luckyWheelPayout.ts` |
| * Motor PURO: não toca no banco, não dispara nada. Ele apenas decide, a partir | `src/lib/luckyWheelPayoutAlerts.ts` |
| um registro em `security_alerts`. A mesma regra é reimplementada na função | `src/lib/luckyWheelPayoutAlerts.ts` |
| especificação executável e testável dessa regra. | `src/lib/luckyWheelPayoutAlerts.ts` |
| * Mínimo de dias com snapshot em cada janela para julgar. Padrão: 3. */ | `src/lib/luckyWheelPayoutComparison.ts` |
| * Mínimo de giros em cada janela para julgar. Padrão: 30. */ | `src/lib/luckyWheelPayoutComparison.ts` |
| * Limite de atenção de χ² para os graus de liberdade do dia (0 se indefinido). */ | `src/lib/luckyWheelPayoutHistory.ts` |
| * Limite crítico de χ². */ | `src/lib/luckyWheelPayoutHistory.ts` |
| * Aceita apenas datas ISO válidas de calendário (rejeita 2024-02-31). */ | `src/lib/luckyWheelPayoutHistory.ts` |
| * Validação pura da autoria de baralhos do Jogo da Memória. | `src/lib/memoryDeckAuthoring.ts` |
| * Regra de negócio: um baralho só é jogável com pares suficientes e sem | `src/lib/memoryDeckAuthoring.ts` |
| * Diff mínimo entre o estado persistido e o rascunho — evita reescrever a | `src/lib/memoryDeckAuthoring.ts` |
| (SECURITY DEFINER). Este módulo apenas (a) monta o tabuleiro embaralhado de | `src/lib/memoryGame.ts` |
| * Tempo máximo por par para o bônus de velocidade. */ | `src/lib/memoryGame.ts` |
| limite de tamanho) antes de qualquer renderização. | `src/lib/opinionChannel.ts` |
| do RH tenha prazo auditável. | `src/lib/opinionChannel.ts` |
| * Prazo de tratativa (em horas) por urgência declarada pelo colaborador. */ | `src/lib/opinionChannel.ts` |
| * Calcula o prazo de tratativa a partir da urgência e da data de criação. | `src/lib/opinionChannel.ts` |
| liberados acima do mínimo de registros (guarda de k-anonimato), no mesmo | `src/lib/opinionChannel.ts` |
| * Camada pura e defensiva: nenhum acesso a React, apenas leitura/escrita | `src/lib/playerResume.ts` |
| * Aporte mínimo por operação. */ | `src/lib/predictionMarket.ts` |
| * Reembolso integral — usado em anulação e em mercado sem vencedores. */ | `src/lib/predictionMarket.ts` |
| * Regra parimutuel: quem acerta divide o pote total menos a taxa da casa, | `src/lib/predictionOddsHistory.ts` |
| das vezes e não demonstrou conhecimento algum — apenas copiou o consenso. | `src/lib/predictionOracle.ts` |
| pois pouco se afirmou). Essa é a regra de pontuação linear, própria: a | `src/lib/predictionOracle.ts` |
| não pode ser reproduzido não pode ser auditado nem contestado. | `src/lib/predictionOracle.ts` |
| O ranking é calculado só a partir daqui, então a regra de pontuação existe | `src/lib/predictionOracle.ts` |
| Regra de pontuação própria, ponderada pelas moedas arriscadas. | `src/lib/predictionOracle.ts` |
| `check_prediction_markets_health()`. Ele decide *o que* alertar; o SQL apenas | `src/lib/predictionWatchdog.ts` |
| W1. Cada mercado gera no máximo um alerta (nunca duplica o mesmo problema). | `src/lib/predictionWatchdog.ts` |
| * A IA nunca decide sozinha: ela apenas ajusta a pontuação heurística dentro | `src/lib/purchaseRisk.ts` |
| - nunca expõe o endpoint (URL sensível), apenas o apelido/plataforma; | `src/lib/pushDevices.ts` |
| * Reivindicação em lote: apenas itens pendentes entram, respeitando o teto. | `src/lib/pushOutbox.ts` |
| Erros de rate limit/permissão são esperados: registramos como mensagem, | `src/lib/requestId.ts` |
| * `invokeEdge` + tratamento canônico de erro + retry apenas em falhas | `src/lib/requestId.ts` |
| limit só piora o problema que o originou. | `src/lib/requestId.ts` |
| (SECURITY DEFINER). Aqui apenas (a) embaralhamos as etapas de forma | `src/lib/sequenceGame.ts` |
| Usado no cliente apenas para variar a disposição entre tentativas. | `src/lib/sequenceGame.ts` |
| * Espelha a validação da RPC: mesma cardinalidade, sem repetição, sem intruso. */ | `src/lib/sequenceGame.ts` |
| * Validação pura da autoria de procedimentos do jogo "Ordene a Sequência". | `src/lib/sequenceProcedureAuthoring.ts` |
| * Regra crítica de negócio: rótulos duplicados tornariam a correção ambígua | `src/lib/sequenceProcedureAuthoring.ts` |
| * Prévia das mudanças que a RPC aplicará — usada apenas para informar o autor | `src/lib/sequenceProcedureAuthoring.ts` |
| em insights determinísticos que a UI apenas renderiza. | `src/lib/sequenceProcedureStats.ts` |
| - Garantir invariantes de negócio (MTTA <= MTTR, limites máximos sãos). | `src/lib/slaTargets.ts` |
| * Limite superior defensivo: 30 dias em minutos. */ | `src/lib/slaTargets.ts` |
| * Limite inferior: 1 minuto (o CHECK do banco exige > 0 segundos). */ | `src/lib/slaTargets.ts` |
| * Partida com apenas um lado: avanço automático (bye). */ | `src/lib/tournamentBracket.ts` |
| * Menor potência de 2 >= n (mínimo 2). */ | `src/lib/tournamentBracket.ts` |
| `wins` conta apenas vitórias efetivas (byes não pagam), evitando inflação | `src/lib/tournamentBracket.ts` |
| * Pool sorteável: apenas cartas ativas, em ordem canônica. | `src/lib/tradingCards.ts` |
| * Regra central: só se troca **duplicata**. Sem isso um colaborador poderia | `src/lib/tradingCards.ts` |
| * Centralized Zod validation schemas for the entire application | `src/lib/validations.ts` |
| All forms should use these schemas for consistent validation | `src/lib/validations.ts` |
| * Get first validation error message | `src/lib/validations.ts` |
| * Validação pura da autoria da "Pergunta do Dia com Aposta". | `src/lib/wagerAuthoring.ts` |
| * Erros estruturais (arquivo vazio, cabeçalho ausente, limite excedido). */ | `src/lib/wagerBulkImport.ts` |
| apenas observado, nunca sinalizado por acurácia. | `src/lib/wagerIntegrity.ts` |
| * Mínimo de apostas para avaliar acurácia estatisticamente. */ | `src/lib/wagerIntegrity.ts` |
| apenas que o payload chegue tipado, íntegro e sem valores impossíveis. | `src/lib/wagerLeaderboard.ts` |
| * Prêmio líquido máximo de uma pergunta para N participantes. | `src/lib/wagerMonthlyExposure.ts` |
| * Premissa central: o arquivo gerado aqui DEVE ser reimportável por | `src/lib/wagerScheduleExport.ts` |
| Retorna 0 quando o valor nao pode virar uma contribuicao valida — o chamador | `src/lib/warAutoHooks.ts` |
| NAO pode derrubar a transacao que registrou a tarefa/ponto do usuario. | `src/lib/warAutoHooks.ts` |
| Um quiz nao pode render mais acertos do que perguntas: protege contra | `src/lib/warAutoHooks.ts` |
| devolvendo apenas os inéditos. Espelha o `ON CONFLICT DO NOTHING` do banco. | `src/lib/warAutoHooks.ts` |
| * O banco e a fonte de verdade dos dados; este modulo apenas normaliza a | `src/lib/warFeed.ts` |
| * O placar vem do banco (fonte de verdade). Este modulo apenas compara dois | `src/lib/warLeadership.ts` |
| * Momento da captura (ISO). Usado apenas para exibicao/debug. */ | `src/lib/warLeadership.ts` |
| Aposta inicial sugerida: 25% do teto (ou o mínimo possível). | `src/pages/DailyWagerPage.tsx` |
| Cronômetro server-authoritative: a UI apenas espelha o prazo persistido. | `src/pages/LightningQuizPage.tsx` |
| Cronômetro apenas informativo: a duração oficial é medida no servidor. | `src/pages/MemoryGamePage.tsx` |
| Isolado do bloco de mercados: uma falha no ranking não pode | `src/pages/PredictionMarketsPage.tsx` |
| ").eq("user_id", user?.id as string).order("created_at", { ascending: false }).limit(5); | `src/pages/SecurityDashboard.tsx` |
| apenas fallback caso o tipo ainda não esteja cadastrado em sla_targets. | `src/pages/SecurityRunbook.tsx` |
| o dispatcher ja controla o limite de tentativas da assinatura | `src/pages/WebhookSubscriptionDetail.tsx` |
| o dispatcher ja controla o limite de tentativas da assinatura | `src/pages/WebhookSubscriptionDetail.tsx` |
| o dispatcher ja controla o limite de tentativas da assinatura | `src/pages/WebhooksAdmin.tsx` |
| * A autorização é feita no banco: apenas admin/manager conseguem executar a RPC. | `src/services/actionPlanGeneratorService.ts` |
| * Chaves que passaram do prazo de rotação recomendado. */ | `src/services/apiKeysService.ts` |
| * Leilão de lance às cegas. O débito/estorno de moedas ocorre exclusivamente | `src/services/auctionService.ts` |
| em RPC SECURITY DEFINER — o cliente apenas dispara e exibe o estado. | `src/services/auctionService.ts` |
| * Trilha auditável append-only (somente leitura, restrita a admins pela RLS). */ | `src/services/auctionService.ts` |
| da atividade real do usuário e credita apenas as linhas novas. | `src/services/bingoService.ts` |
| * Todas as trilhas (inclui rascunhos/arquivadas) — apenas admin/gestor pela RLS. */ | `src/services/boardTrailService.ts` |
| * Pré-visualização (somente leitura) de quem está travado há mais de | `src/services/boardTrailService.ts` |
| * Insere linhas em blocos para nao estourar o limite de payload do PostgREST. */ | `src/services/campaignImportService.ts` |
| * Pagina de leitura usada pela agregacao (evita estourar o limite do PostgREST). */ | `src/services/campaignImportService.ts` |
| payload enxuto (apenas `team_id`). | `src/services/campaignTeamsService.ts` |
| apenas uma equipe por campanha — por isso usamos upsert com esse conflito. | `src/services/campaignTeamsService.ts` |
| SECURITY DEFINER e devolve apenas dados não sensíveis do certificado. | `src/services/certificationsService.ts` |
| * Registra a aposta. Validações finais (saldo, limite, duplicidade) são do banco. */ | `src/services/dailyWagerService.ts` |
| * Encerramento e credito de premios (apenas admin, idempotente no banco). */ | `src/services/departmentWarService.ts` |
| * Mínimo de respondentes exigido pelo banco para revelar qualquer recorte. */ | `src/services/engagementDiagnosticsService.ts` |
| O banco já aplica o mínimo de respondentes por período. | `src/services/engagementDiagnosticsService.ts` |
| (policy "Admins can view all responses"), mas o resumo dele não pode desfazer | `src/services/feedbackService.ts` |
| `feedback_requests.relationship`), então a regra vive aqui e é aplicada pelo formulário | `src/services/feedbackService.ts` |
| de pedido — antes era possível gravar uma avaliação de gestor num ciclo "Apenas Pares". | `src/services/feedbackService.ts` |
| Limit to 50 for performance | `src/services/highPotentialService.ts` |
| Log initial placement only if this is the first time (no history row yet). | `src/services/leaguesService.ts` |
| * Inclui prêmios inativos (visível apenas para admins pela policy de SELECT). */ | `src/services/luckyWheelService.ts` |
| então um não-admin recebe apenas os próprios registros — sem vazamento. | `src/services/luckyWheelService.ts` |
| para administradores, que só têm permissão de leitura. | `src/services/luckyWheelService.ts` |
| Falha de nome não pode derrubar a auditoria: degrada para "Administrador". | `src/services/luckyWheelService.ts` |
| RPCs SECURITY DEFINER — o cliente apenas relata o desempenho. | `src/services/memoryGameService.ts` |
| * Inclui baralhos inativos (visíveis apenas para admins pela policy de SELECT). */ | `src/services/memoryGameService.ts` |
| * Prazo legal sugerido para tratativa conforme criticidade (NR-1 item 1.5.4). */ | `src/services/nr1RiskService.ts` |
| * Prazo (em dias) efetivamente aplicado ao plano de tratativa gerado pelo banco. */ | `src/services/nr1RiskService.ts` |
| * Recorte mínimo exibível em rankings — apenas identidade visual. */ | `src/services/profilesService.ts` |
| agora falha com `permission denied`. Use `getMyPrivate()` para os próprios | `src/services/profilesService.ts` |
| * Executa uma decisão de governança. Toda a validação (papel, máquina de | `src/services/purchaseGovernanceService.ts` |
| estados, dupla aprovação, estorno de moedas/estoque) acontece no banco. | `src/services/purchaseGovernanceService.ts` |
| telemetria de apoio e não pode derrubar o fluxo de inscrição. | `src/services/pushSubscriptionService.ts` |
| Avisa a conta (todos os aparelhos veem o alerta in-app) apenas quando | `src/services/pushSubscriptionService.ts` |
| houve mudança real de estado — reprocessar não deve gerar ruído. | `src/services/pushSubscriptionService.ts` |
| * Corrige a resposta no servidor e devolve o gabarito somente após o envio. */ | `src/services/quizQuestionsService.ts` |
| Extract unique permission keys | `src/services/rbacService.ts` |
| Milestone notifications (25/50/75%) — disparadas apenas na transição | `src/services/salesCampaignsService.ts` |
| o cliente apenas dispara e exibe o resultado já persistido. | `src/services/scratchCardService.ts` |
| * Índices (base 0) incorretos — revelados apenas após o envio. */ | `src/services/sequenceGameService.ts` |
| * Ordem correta dos ids — revelada apenas após o envio. */ | `src/services/sequenceGameService.ts` |
| Apenas admin/gestor consegue ler `sequence_steps` (RLS). | `src/services/sequenceGameService.ts` |
| SECURITY DEFINER — o cliente apenas lê e dispara ações autorizadas. | `src/services/tournamentService.ts` |
| em RPCs `SECURITY DEFINER` — o cliente apenas dispara e exibe o resultado. | `src/services/tradingCardsService.ts` |
| * Pergunta já respondida: apenas explicação/ativação foram alteradas. */ | `src/services/wagerAdminService.ts` |
| * Persiste o rascunho. A validação final continua sendo do banco. */ | `src/services/wagerAdminService.ts` |
| * Importação em lote: salva sequencialmente para não estourar o rate limit | `src/services/wagerAdminService.ts` |
| * Cria ou atualiza a apuração de uma anomalia (somente administradores). */ | `src/services/wagerIntegrityReviewService.ts` |
| (o proxy apenas ANEXA à cadeia existente, não a substitui). Usar o primeiro | `supabase/functions/_shared/clientIp.ts` |
| resultado é marcado como não confiável e a decisão de segurança deve | `supabase/functions/_shared/clientIp.ts` |
| * true somente quando veio de um header sobrescrito pelo proxy. */ | `supabase/functions/_shared/clientIp.ts` |
| * Cadeia bruta, apenas para auditoria/diagnóstico — nunca para decisão. */ | `supabase/functions/_shared/clientIp.ts` |
| TTL 0 = expira em menos de um segundo; anunciar a janela inteira faria a | `supabase/functions/_shared/rate-limit.ts` |
| controlado pelo cliente permitiria burlar o limite trocando o header. | `supabase/functions/_shared/rate-limiter.ts` |
| comportamento cai para wildcard apenas em dev local (deno serve). | `supabase/functions/_shared/security.ts` |
| expõe a mensagem de exceções inesperadas (mantidas apenas no log). | `supabase/functions/_shared/security.ts` |
| * FORMATO ÚNICO de erro de validação (HTTP 422) de TODAS as edge functions. | `supabase/functions/_shared/validation.ts` |
| * Validação pura: `{ success, data }` ou `{ success:false, error }`. */ | `supabase/functions/_shared/validation.ts` |
| Testes Deno dos helpers de validação (formato único 422). Rodam no CI pelo workflow deno.yml | `supabase/functions/_shared/validation_test.ts` |
| usa somente WebCrypto. | `supabase/functions/_shared/webauthn.ts` |
| * Restrição adicional de origem; vazio significa "apenas o rpId manda". */ | `supabase/functions/_shared/webauthn.ts` |
| webhook é aceito sem nenhuma autenticação. Validação de autenticidade nunca | `supabase/functions/_shared/webhookSecurity.ts` |
| Indisponibilidade do controle não deve derrubar o webhook: seguimos | `supabase/functions/_shared/webhookSecurity.ts` |
| O histórico vem de `ai_coach_messages.content` (TEXT, sem limite): uma resposta longa do | `supabase/functions/_shared/contracts/ai-coach.ts` |
| modelo passaria do limite e derrubaria o chat inteiro com 422 na mensagem seguinte. | `supabase/functions/_shared/contracts/ai-coach.ts` |
| Zod v3 fixado em deno.land (ver ../validation.ts); no vitest a URL vira `zod/v3` por alias. | `supabase/functions/_shared/contracts/common.ts` |
| * Resultado de validação sem Response (para contratos com lógica própria, ex.: versionamento). */ | `supabase/functions/_shared/contracts/common.ts` |
| * Texto obrigatório, sem espaços nas pontas e com limite explícito. */ | `supabase/functions/_shared/contracts/common.ts` |
| * Schema dos query params (somente quando a função os lê). */ | `supabase/functions/_shared/contracts/common.ts` |
| * Validação customizada quando `request.safeParse` não basta (ex.: união versionada, cujo erro | `supabase/functions/_shared/contracts/common.ts` |
| zod sairia como `invalid_union` na raiz). Deve devolver o MESMO formato 422 de validation.ts. | `supabase/functions/_shared/contracts/common.ts` |
| `zod` não expressa "obrigatório apenas quando action=verify" sem união | `supabase/functions/_shared/contracts/passkey-auth.ts` |
| * Caso inválido: payload + campo que deve aparecer em `fields` (com código opcional). */ | `supabase/functions/_shared/contracts/_fixtures/types.ts` |
| JWT validation | `supabase/functions/ai-course-builder/index.ts` |
| Load job (must belong to user) | `supabase/functions/ai-course-builder/index.ts` |
| Dispara apenas quando AMBAS as janelas (curta e longa) cruzam o limite (menos ruído). | `supabase/functions/burn-rate-monitor/index.ts` |
| volume mínimo para evitar falso positivo | `supabase/functions/burn-rate-monitor/index.ts` |
| * Falha de validação no formato único das edge functions (HTTP 422, ver | `supabase/functions/passkey-auth/index.ts` |
| `Content-Length` declarado corta o caso comum e o leitor aborta no limite | `supabase/functions/passkey-auth/index.ts` |
| Só `cf-connecting-ip` (sobrescrito pelo proxy) alimenta o limite por IP. | `supabase/functions/passkey-auth/index.ts` |
| E-mail desconhecido apenas não restringe credenciais; não revelamos | `supabase/functions/passkey-auth/index.ts` |
| e-mail com curinga não pode "pescar" o dono de outra conta. | `supabase/functions/passkey-auth/index.ts` |
| Limite por (credencial + cliente) além do limite por IP: o balde global | `supabase/functions/passkey-auth/index.ts` |
| caminho não pode emitir sessão. | `supabase/functions/passkey-auth/index.ts` |
| A IA é um complemento: falha nela não pode travar a governança. | `supabase/functions/reward-approval-review/index.ts` |
| Apenas gestores/administradores podem disparar a análise. | `supabase/functions/reward-approval-review/index.ts` |
| * A IA nunca decide sozinha: ela apenas ajusta a pontuação heurística dentro | `supabase/functions/reward-approval-review/risk.ts` |
| A função publica com efeito colateral (notificações) e é chamada apenas por cron (POST), | `supabase/functions/security-weekly-digest/index.ts` |
| SLA é a fração resolvidos/total (métrica de resolução, não de prazo): o repo não | `supabase/functions/security-weekly-digest/index.ts` |
| persiste se um alerta estourou o prazo, então % de resolvidos é o indicador | `supabase/functions/security-weekly-digest/index.ts` |
| forjado com type=security_weekly_digest não pode ser usado como prova (nem bloquear | `supabase/functions/security-weekly-digest/index.ts` |
| Máximo de 3 tentativas totais. Backoff base: 500ms, cap 8s. | `supabase/functions/send-campaign-push/index.ts` |
| Limit response body size | `supabase/functions/webhook-dispatcher/index.ts` |
| INTO v_settings FROM geo_settings LIMIT 1; | `supabase/migrations/20251231131217_c2ec197f-c709-4fd4-8202-2738c37dddf7.sql` |
| # O que precisa ser preenchido\n\n1. Descreva o cenário em uma frase (o quê, quando, quem foi afetado).\n2. Confirme se o impacto foi apenas SLA ou também usuário final.'; | `supabase/migrations/20260712222124_0a235aa5-fd55-4549-b78b-f1de5dff2dbd.sql` |
