# 10 · ACESSO E SEGURANÇA — quem pode o quê

> Gerado automaticamente por AI Context Sync v1.3.2 · commit `fa594f89a4` · branch `main` · 2026-11-27 10:25 UTC
> Não edite à mão — regras humanas vão em `manual/`.

## Perfis / roles identificados

`admin`, `assistant`, `default`, `denied`, `employee`, `granted`, `key`, `long`, `manager`, `mentor`, `permission`, `user`

- Tabelas de perfil/permissão: `user_roles`, `team_members`, `permission_groups`, `user_permission_groups`, `permissions`, `roles`, `role_permissions`, `org_members`, `campaign_team_members`
- Colunas de perfil: `user_roles.role` (app_role NOT NULL DEFAULT 'employee'), `ai_coach_messages.role` (text NOT NULL CHECK (role IN ('user', 'assistant'))), `pdi_mentors.role` (TEXT DEFAULT 'mentor'), `org_members.role` (TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')))
- Claims do JWT usados em políticas/funções: `email`
- Funções usadas dentro de políticas RLS (a regra real está no corpo delas — veja `06`): `has_role`, `is_department_manager`, `is_org_admin`

## Matriz tabela × operação → quem pode (derivada das políticas RLS)

| Tabela | RLS | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| `_internal.dispatch_config` | enabled | — | — | — | — |
| `achievements` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: true | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `action_plan_items` | enabled | public: (EXISTS ( SELECT 1 FROM action_plans ap WHERE ((ap.id = action_plan_items.plan_id) AND ((ap.owner_id = auth.uid()) OR has_role(auth.<br>public: (EXISTS ( SELECT 1 FROM action_plans ap WHERE ((ap.id = action_plan_items.plan_id) AND ((ap.owner_id = auth.uid()) OR (ap.reviewer_i | public: (EXISTS ( SELECT 1 FROM action_plans ap WHERE ((ap.id = action_plan_items.plan_id) AND ((ap.owner_id = auth.uid()) OR has_role(auth. | public: (EXISTS ( SELECT 1 FROM action_plans ap WHERE ((ap.id = action_plan_items.plan_id) AND ((ap.owner_id = auth.uid()) OR has_role(auth. | public: (EXISTS ( SELECT 1 FROM action_plans ap WHERE ((ap.id = action_plan_items.plan_id) AND ((ap.owner_id = auth.uid()) OR has_role(auth. |
| `action_plan_updates` | enabled | public: (EXISTS ( SELECT 1 FROM action_plans ap WHERE ((ap.id = action_plan_updates.plan_id) AND ((ap.owner_id = auth.uid()) OR (ap.reviewer | public: (auth.uid() = user_id) | — | — |
| `action_plans` | enabled | public: ((owner_id = auth.uid()) OR (reviewer_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager': | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: ((owner_id = auth.uid()) OR (reviewer_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR (owner_id = auth.uid())) |
| `activity_comments` | enabled | public: true | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) |
| `activity_reactions` | enabled | public: true | public: (auth.uid() = user_id) | — | public: (auth.uid() = user_id) |
| `ai_coach_messages` | enabled | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | — | public: (auth.uid() = user_id) |
| `ai_course_jobs` | enabled | authenticated: ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: (auth.uid() = user_id) | authenticated: ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)) | — |
| `announcement_reactions` | enabled | public: true<br>public: (user_id = auth.uid()) | public: (user_id = auth.uid()) | public: (user_id = auth.uid()) | public: (user_id = auth.uid()) |
| `announcement_reads` | enabled | public: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | public: (user_id = auth.uid()) | — | — |
| `announcements` | enabled | public: ((published_at IS NOT NULL) AND (published_at <= now()) AND ((expires_at IS NULL) OR (expires_at > now())) AND ((department_id IS NU | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | public: ((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) |
| `api_request_logs` | enabled | public: has_role(auth.uid(), 'admin'::app_role) | — | — | — |
| `attendance_records` | enabled | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | — | — |
| `attendance_settings` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: true | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `attendance_streaks` | enabled | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: (auth.uid() = user_id)<br>public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) |
| `auction_admin_events` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `auction_bids` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) |
| `auctions` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `audit_logs` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: (has_role(auth.uid(), 'manager'::app_role) AND (EXISTS ( SELECT 1 FROM (team_members tm1 JOIN team_members tm2 ON ((tm1.department_i<br>public: (auth.uid() = user_id) | authenticated: (user_id = auth.uid()) | — | — |
| `avatar_items` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `bingo_board_tasks` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `bingo_boards` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (is_active OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `bingo_cards` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) |
| `bingo_marks` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: (user_id = auth.uid()) | authenticated: (user_id = auth.uid()) | authenticated: (user_id = auth.uid()) |
| `bitrix24_sync_mappings` | enabled | public: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'ma<br>public: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))) | public: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))) | public: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))) | public: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))) |
| `bitrix24_tokens` | enabled | public: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))) | public: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))) | public: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))) | public: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))) |
| `bitrix24_webhook_logs` | enabled | public: (EXISTS ( SELECT 1 FROM user_roles WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role)))) | authenticated: (auth.uid() IS NOT NULL) | — | — |
| `blocked_ips` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `board_moves` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `board_player_states` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: has_role(auth.uid(), 'manager'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) |
| `board_tiles` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `board_trails` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `boss_battle_damage` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `boss_battle_rewards` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `boss_battles` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `boss_win_rate_goals` | enabled | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>authenticated: true | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) |
| `campaign_participants` | enabled | authenticated: true | authenticated: ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | authenticated: ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `campaign_progress_events` | enabled | authenticated: true | authenticated: ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | — | — |
| `campaign_result_imports` | enabled | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>authenticated: (created_by = auth.uid()) | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) |
| `campaign_result_rows` | enabled | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) |
| `campaign_team_members` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `campaign_team_split_batches` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `campaign_team_split_entries` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `campaign_teams` | enabled | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>authenticated: true | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) |
| `card_definitions` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `card_packs` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `card_set_claims` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) |
| `card_trades` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((proposer_id = auth.uid()) OR (responder_id = auth.uid())) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (proposer_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((proposer_id = auth.uid()) OR (responder_id = auth.uid())) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `celebrations` | enabled | public: (user_id = auth.uid())<br>public: ((is_public = true) OR (user_id = auth.uid())) | authenticated: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))<br>public: (user_id = auth.uid()) | public: (user_id = auth.uid()) | public: (user_id = auth.uid()) |
| `certifications` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: true | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `checkin_templates` | enabled | public: true<br>public: ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | public: ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | public: ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) |
| `checkins` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: ((manager_id = auth.uid()) OR (employee_id = auth.uid())) | public: (manager_id = auth.uid()) | public: ((manager_id = auth.uid()) OR (employee_id = auth.uid())) | — |
| `climate_benchmarks` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: true | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `climate_pillar_scores` | enabled | public: has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'manager')<br>public: has_role(auth.uid(), 'admin') | public: has_role(auth.uid(), 'admin') | public: has_role(auth.uid(), 'admin') | public: has_role(auth.uid(), 'admin') |
| `climate_question_answers` | enabled | public: exists (select 1 from climate_survey_responses r where r.id = response_id and (r.user_id = auth.uid() or has_role(auth.uid(), 'admin | public: exists (select 1 from climate_survey_responses r where r.id = response_id and r.user_id = auth.uid()) | public: exists (select 1 from climate_survey_responses r where r.id = response_id and r.user_id = auth.uid()) | — |
| `climate_survey_questions` | enabled | public: exists (select 1 from climate_surveys s where s.id = survey_id and (s.status in ('active','completed') or s.created_by = auth.uid() <br>public: exists (select 1 from climate_surveys s where s.id = survey_id and (s.created_by = auth.uid() or has_role(auth.uid(), 'admin'))) | public: (EXISTS ( SELECT 1 FROM climate_surveys s WHERE ((s.id = climate_survey_questions.survey_id) AND ((s.created_by = auth.uid()) OR has<br>public: exists (select 1 from climate_surveys s where s.id = survey_id and (s.created_by = auth.uid() or has_role(auth.uid(), 'admin'))) | public: (EXISTS ( SELECT 1 FROM climate_surveys s WHERE ((s.id = climate_survey_questions.survey_id) AND ((s.created_by = auth.uid()) OR has<br>public: exists (select 1 from climate_surveys s where s.id = survey_id and (s.created_by = auth.uid() or has_role(auth.uid(), 'admin'))) | public: (EXISTS ( SELECT 1 FROM climate_surveys s WHERE ((s.id = climate_survey_questions.survey_id) AND (s.status = 'draft'::text) AND ((s.<br>public: exists (select 1 from climate_surveys s where s.id = survey_id and (s.created_by = auth.uid() or has_role(auth.uid(), 'admin'))) |
| `climate_survey_responses` | enabled | public: user_id = auth.uid() or has_role(auth.uid(), 'admin') | public: auth.uid() = user_id | public: user_id = auth.uid() | — |
| `climate_surveys` | enabled | public: status in ('active', 'completed') or created_by = auth.uid() or has_role(auth.uid(), 'admin') | public: has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'manager') | public: created_by = auth.uid() or has_role(auth.uid(), 'admin') | public: has_role(auth.uid(), 'admin') |
| `competencies` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: true | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `custom_badges` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `custom_quests` | enabled | public: ((status = 'active'::quest_status) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | public: ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) |
| `custom_ranks` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: true | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `custom_titles` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `demographic_attributes` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `demographic_values_panel` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `department_missions` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `department_rankings` | enabled | public: true<br>public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `department_war_contributions` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `department_war_departments` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `department_war_metrics` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `department_war_results` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (EXISTS ( SELECT 1 FROM department_wars dw WHERE ((dw.id = department_war_results.war_id) AND (dw.status <> 'draft'::text)))) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `department_wars` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `departments` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: true | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `development_plan_actions` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: (EXISTS ( SELECT 1 FROM development_plans dp WHERE ((dp.id = development_plan_actions.plan_id) AND ((dp.user_id = auth.uid()) OR (dp | public: (EXISTS ( SELECT 1 FROM development_plans dp WHERE ((dp.id = development_plan_actions.plan_id) AND ((dp.user_id = auth.uid()) OR (dp | public: ((EXISTS ( SELECT 1 FROM development_plans dp WHERE ((dp.id = development_plan_actions.plan_id) AND ((dp.user_id = auth.uid()) OR (d | public: ((EXISTS ( SELECT 1 FROM development_plans dp WHERE ((dp.id = development_plan_actions.plan_id) AND ((dp.user_id = auth.uid()) OR (d |
| `development_plans` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: (EXISTS ( SELECT 1 FROM (team_members tm1 JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id))) WHERE ((tm1.user_id = <br>public: (auth.uid() = user_id) | public: ((auth.uid() = user_id) OR (auth.uid() = created_by)) | public: ((auth.uid() = user_id) OR (auth.uid() = created_by) OR has_role(auth.uid(), 'admin'::app_role)) | — |
| `direct_duels` | enabled | public: ((auth.uid() = challenger_id) OR (auth.uid() = opponent_id)) | public: (auth.uid() = challenger_id) | public: ((auth.uid() = challenger_id) OR (auth.uid() = opponent_id)) | — |
| `engagement_action_playbooks` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (is_active OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `engagement_answers` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: has_role(auth.uid(), 'manager'::app_role)<br>authenticated: ((user_id = auth.uid()) AND (NOT is_anonymous)) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `engagement_cycles` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((status = 'active'::engagement_cycle_status) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::a | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `engagement_factors` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `engagement_question_assignments` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `engagement_question_pool` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `engagement_snapshots` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: (EXISTS ( SELECT 1 FROM team_members tm WHERE ((tm.user_id = auth.uid()) AND (tm.is_manager = true) AND ((engagement_snapshots.depar | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `enps_responses` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | — | — |
| `enps_surveys` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: ((status = 'active'::text) OR has_role(auth.uid(), 'admin'::app_role)) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `entity_versions` | enabled | authenticated: ((changed_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | public: ((auth.uid() = changed_by) OR (changed_by IS NULL)) | — | — |
| `executive_monthly_reports` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `external_api_keys` | enabled | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `external_tasks` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>public: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `feedback_cycles` | enabled | public: ((status = ANY (ARRAY['active'::text, 'review'::text, 'completed'::text])) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'adm<br>public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) |
| `feedback_evaluations` | enabled | public: ((auth.uid() = evaluator_id) OR (auth.uid() = evaluatee_id)) | authenticated: (evaluator_id = auth.uid()) | public: (auth.uid() = evaluator_id) | — |
| `feedback_questions` | enabled | public: true | — | — | — |
| `feedback_requests` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: ((from_user_id = auth.uid()) OR (to_user_id = auth.uid())) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (from_user_id = auth.uid()) | — |
| `feedback_responses` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: ((is_anonymous = false) AND (EXISTS ( SELECT 1 FROM feedback_requests r WHERE ((r.id = feedback_responses.request_id) AND (r.to_user<br>public: (EXISTS ( SELECT 1 FROM feedback_requests r WHERE ((r.id = feedback_responses.request_id) AND (r.from_user_id = auth.uid())))) | public: (EXISTS ( SELECT 1 FROM feedback_requests r WHERE ((r.id = feedback_responses.request_id) AND (r.from_user_id = auth.uid())))) | — | — |
| `feedback_results` | enabled | public: (auth.uid() = user_id) | authenticated: (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) | — | — |
| `gamification_themes` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `geo_access_logs` | enabled | public: has_role(auth.uid(), 'admin'::app_role) | authenticated: (auth.uid() IS NOT NULL) | — | — |
| `geo_allowed_countries` | enabled | public: (EXISTS ( SELECT 1 FROM user_roles ur WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role))))<br>public: true | public: (EXISTS ( SELECT 1 FROM user_roles ur WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role)))) | public: (EXISTS ( SELECT 1 FROM user_roles ur WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role)))) | public: (EXISTS ( SELECT 1 FROM user_roles ur WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role)))) |
| `geo_blocking_rules` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: true | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `geo_settings` | enabled | public: (EXISTS ( SELECT 1 FROM user_roles ur WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role))))<br>public: true | public: (EXISTS ( SELECT 1 FROM user_roles ur WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role)))) | public: (EXISTS ( SELECT 1 FROM user_roles ur WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role)))) | public: (EXISTS ( SELECT 1 FROM user_roles ur WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role)))) |
| `goal_templates` | enabled | authenticated: true | authenticated: (EXISTS ( SELECT 1 FROM user_roles ur WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role)))) | authenticated: (EXISTS ( SELECT 1 FROM user_roles ur WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role)))) | authenticated: (EXISTS ( SELECT 1 FROM user_roles ur WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role)))) |
| `goal_updates` | enabled | authenticated: (EXISTS ( SELECT 1 FROM goals g WHERE ((g.id = goal_updates.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'a | public: (EXISTS ( SELECT 1 FROM goals g WHERE ((g.id = goal_updates.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'admin':: | — | — |
| `goals` | enabled | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: (goal_type = 'company'::text)<br>public: (user_id = auth.uid())<br>public: ((goal_type = 'team'::text) AND (department_id IN ( SELECT team_members.department_id FROM team_members WHERE (team_members.user_id  | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: (user_id = auth.uid()) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: (user_id = auth.uid()) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: ((user_id = auth.uid()) AND (status = 'draft'::text)) |
| `ip_access_logs` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | — | — | — |
| `ip_whitelist` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `key_results` | enabled | authenticated: (EXISTS ( SELECT 1 FROM goals g WHERE ((g.id = key_results.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'ad<br>public: (EXISTS ( SELECT 1 FROM goals g WHERE ((g.id = key_results.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::a | public: (EXISTS ( SELECT 1 FROM goals g WHERE ((g.id = key_results.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::a | public: (EXISTS ( SELECT 1 FROM goals g WHERE ((g.id = key_results.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::a | public: (EXISTS ( SELECT 1 FROM goals g WHERE ((g.id = key_results.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::a |
| `kudos` | enabled | public: ((is_public = true) OR (from_user_id = auth.uid()) OR (to_user_id = auth.uid())) | public: (auth.uid() = from_user_id) | — | public: (auth.uid() = from_user_id) |
| `kudos_badges` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: true | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `league_history` | enabled | authenticated: true | authenticated: has_role(auth.uid(), 'admin'::app_role) | — | — |
| `leagues` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: true | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `learning_trails` | enabled | public: ((status = 'published'::trail_status) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | public: ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) |
| `level_configs` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: true | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `lightning_quiz_answers` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `lightning_quiz_questions` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (is_active OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `lightning_quiz_sessions` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) |
| `login_attempts` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | — | — | — |
| `lucky_wheel_payout_snapshots` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `lucky_wheel_prize_audit` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | — | — | — |
| `lucky_wheel_prizes` | não encontrado | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `lucky_wheel_settings` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `lucky_wheel_settings_audit` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `lucky_wheel_spins` | não encontrado | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `lucky_wheel_whatif_snapshots` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `memory_decks` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (is_active OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `memory_pairs` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `memory_sessions` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) |
| `mentorship_mission_progress` | enabled | public: (EXISTS ( SELECT 1 FROM mentorship_pairs mp WHERE ((mp.id = mentorship_mission_progress.pair_id) AND ((mp.mentor_id = auth.uid()) OR | public: (EXISTS ( SELECT 1 FROM mentorship_pairs mp WHERE ((mp.id = mentorship_mission_progress.pair_id) AND ((mp.mentor_id = auth.uid()) OR | public: (EXISTS ( SELECT 1 FROM mentorship_pairs mp WHERE ((mp.id = mentorship_mission_progress.pair_id) AND ((mp.mentor_id = auth.uid()) OR | — |
| `mentorship_missions` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `mentorship_pairs` | enabled | public: ((auth.uid() = mentor_id) OR (auth.uid() = apprentice_id)) | public: ((auth.uid() = mentor_id) OR (auth.uid() = apprentice_id)) | public: ((auth.uid() = mentor_id) OR (auth.uid() = apprentice_id)) | — |
| `mentorship_requests` | enabled | public: ((auth.uid() = requester_id) OR (auth.uid() = target_id)) | public: (auth.uid() = requester_id) | public: ((auth.uid() = target_id) OR (auth.uid() = requester_id)) | — |
| `module_progress` | enabled | public: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (user_id = auth.uid()) | public: (user_id = auth.uid()) | — |
| `mood_entries` | enabled | authenticated: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: (user_id = auth.uid()) | public: (user_id = auth.uid()) | public: (user_id = auth.uid()) | public: (user_id = auth.uid()) |
| `new_device_alerts` | enabled | public: (auth.uid() = user_id) | authenticated: (user_id = auth.uid()) | public: (auth.uid() = user_id) | — |
| `nine_box_evaluations` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: (EXISTS ( SELECT 1 FROM (team_members tm1 JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id))) WHERE ((tm1.user_id = <br>public: (auth.uid() = user_id) | public: (has_role(auth.uid(), 'admin'::app_role) OR (EXISTS ( SELECT 1 FROM (team_members tm1 JOIN team_members tm2 ON ((tm1.department_id = | public: (has_role(auth.uid(), 'admin'::app_role) OR (evaluator_id = auth.uid())) | — |
| `notification_preferences` | enabled | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) |
| `notification_templates` | enabled | public: (is_active = true) | — | — | — |
| `notifications` | enabled | authenticated: (auth.uid() = user_id) | authenticated: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: (auth.uid() = user_id) | authenticated: (auth.uid() = user_id) |
| `nr1_factor_mappings` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `nr1_risk_categories` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `onboarding_progress` | enabled | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | — |
| `opinion_responses` | enabled | public: (EXISTS ( SELECT 1 FROM opinions o WHERE ((o.id = opinion_responses.opinion_id) AND ((o.sender_id = auth.uid()) OR (o.recipient_id = | public: ((auth.uid() = responder_id) AND (EXISTS ( SELECT 1 FROM opinions o WHERE ((o.id = opinion_responses.opinion_id) AND ((o.recipient_i | — | — |
| `opinion_supports` | enabled | authenticated: true<br>authenticated: (user_id = auth.uid()) | authenticated: (user_id = auth.uid()) | authenticated: (user_id = auth.uid()) | authenticated: (user_id = auth.uid()) |
| `opinion_tags` | enabled | public: (EXISTS ( SELECT 1 FROM opinions o WHERE ((o.id = opinion_tags.opinion_id) AND ((o.recipient_id = auth.uid()) OR has_role(auth.uid() | public: (EXISTS ( SELECT 1 FROM opinions o WHERE ((o.id = opinion_tags.opinion_id) AND ((o.recipient_id = auth.uid()) OR has_role(auth.uid() | public: (EXISTS ( SELECT 1 FROM opinions o WHERE ((o.id = opinion_tags.opinion_id) AND ((o.recipient_id = auth.uid()) OR has_role(auth.uid() | public: (EXISTS ( SELECT 1 FROM opinions o WHERE ((o.id = opinion_tags.opinion_id) AND ((o.recipient_id = auth.uid()) OR has_role(auth.uid() |
| `opinions` | enabled | public: ((sender_id = auth.uid()) OR (recipient_id = auth.uid()) OR ((recipient_type = 'hr'::text) AND has_role(auth.uid(), 'admin'::app_rol | public: (auth.uid() = sender_id) | public: ((recipient_id = auth.uid()) OR ((recipient_type = 'hr'::text) AND has_role(auth.uid(), 'admin'::app_role)) OR ((recipient_type = 'm | — |
| `org_members` | enabled | authenticated: ((user_id = auth.uid()) OR is_org_admin(auth.uid(), org_id))<br>authenticated: is_org_admin(auth.uid(), org_id) | authenticated: is_org_admin(auth.uid(), org_id) | authenticated: is_org_admin(auth.uid(), org_id) | authenticated: is_org_admin(auth.uid(), org_id) |
| `org_theme_history` | enabled | authenticated: is_org_admin(auth.uid(), org_id) | authenticated: is_org_admin(auth.uid(), org_id) | — | — |
| `organizations` | enabled | public: true | — | authenticated: is_org_admin(auth.uid(), id) | — |
| `password_reset_requests` | enabled | public: ((EXISTS ( SELECT 1 FROM (team_members tm1 JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id))) WHERE ((tm1.user_id =<br>public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: ((EXISTS ( SELECT 1 FROM (team_members tm1 JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id))) WHERE ((tm1.user_id = | — |
| `pdi_checkins` | enabled | public: (EXISTS ( SELECT 1 FROM development_plans dp WHERE ((dp.id = pdi_checkins.plan_id) AND (dp.user_id = auth.uid())))) | public: (auth.uid() = created_by) | — | — |
| `pdi_mentors` | enabled | public: ((auth.uid() = mentor_id) OR (EXISTS ( SELECT 1 FROM development_plans dp WHERE ((dp.id = pdi_mentors.plan_id) AND (dp.user_id = aut | authenticated: (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) | — | authenticated: ((auth.uid() = mentor_id) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) |
| `pdi_templates` | enabled | authenticated: (is_active = true) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `penalty_rules` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `permission_groups` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: true | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `permissions` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: true | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `position_competencies` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>public: true | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `position_task_templates` | enabled | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) |
| `positions` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: true | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `postmortem_actions` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `postmortems` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `prediction_admin_events` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `prediction_markets` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `prediction_options` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (EXISTS ( SELECT 1 FROM prediction_markets pm WHERE ((pm.id = prediction_options.market_id) AND ((pm.status <> 'draft'::text) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `prediction_stakes` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) |
| `profiles` | enabled | authenticated: true | authenticated: (auth.uid() = id) | authenticated: (auth.uid() = id) | — |
| `profiles_public` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `pulse_responses` | enabled | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: (user_id = auth.uid()) | public: (user_id = auth.uid()) | — | — |
| `pulse_surveys` | enabled | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: ((status = 'active'::text) AND ((department_id IS NULL) OR (department_id IN ( SELECT team_members.department_id FROM team_members W | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) |
| `purchase_approvals` | enabled | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>authenticated: (EXISTS ( SELECT 1 FROM shop_purchases sp WHERE ((sp.id = purchase_approvals.purchase_id) AND (sp.user_id = auth.uid())))) | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) |
| `push_notification_logs` | enabled | authenticated: (auth.uid() = user_id) | — | — | — |
| `push_outbox` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `push_outbox_health_snapshots` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `push_subscriptions` | enabled | authenticated: (auth.uid() = user_id) | authenticated: (auth.uid() = user_id) | authenticated: (auth.uid() = user_id) | authenticated: (auth.uid() = user_id) |
| `push_sync_events` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: (user_id = auth.uid()) | — | — |
| `query_telemetry` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: ((user_id IS NULL) OR (user_id = auth.uid())) | — | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `quest_assignments` | enabled | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: (user_id = auth.uid()) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (user_id = auth.uid()) | — |
| `quest_steps` | enabled | public: (EXISTS ( SELECT 1 FROM custom_quests q WHERE ((q.id = quest_steps.quest_id) AND (q.status = 'active'::quest_status))))<br>public: (EXISTS ( SELECT 1 FROM custom_quests q WHERE ((q.id = quest_steps.quest_id) AND ((q.created_by = auth.uid()) OR has_role(auth.uid() | public: (EXISTS ( SELECT 1 FROM custom_quests q WHERE ((q.id = quest_steps.quest_id) AND ((q.created_by = auth.uid()) OR has_role(auth.uid() | public: (EXISTS ( SELECT 1 FROM custom_quests q WHERE ((q.id = quest_steps.quest_id) AND ((q.created_by = auth.uid()) OR has_role(auth.uid() | public: (EXISTS ( SELECT 1 FROM custom_quests q WHERE ((q.id = quest_steps.quest_id) AND ((q.created_by = auth.uid()) OR has_role(auth.uid() |
| `quiz_answers` | enabled | authenticated: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | public: (auth.uid() = user_id) | — | — |
| `quiz_options` | enabled | public: (EXISTS ( SELECT 1 FROM quiz_questions q WHERE ((q.id = quiz_options.question_id) AND (has_role(auth.uid(), 'admin'::app_role) OR ha<br>public: (EXISTS ( SELECT 1 FROM quiz_questions q WHERE ((q.id = quiz_options.question_id) AND ((q.is_active = true) OR has_role(auth.uid(),  | public: (EXISTS ( SELECT 1 FROM quiz_questions q WHERE ((q.id = quiz_options.question_id) AND (has_role(auth.uid(), 'admin'::app_role) OR ha | public: (EXISTS ( SELECT 1 FROM quiz_questions q WHERE ((q.id = quiz_options.question_id) AND (has_role(auth.uid(), 'admin'::app_role) OR ha | public: (EXISTS ( SELECT 1 FROM quiz_questions q WHERE ((q.id = quiz_options.question_id) AND (has_role(auth.uid(), 'admin'::app_role) OR ha |
| `quiz_questions` | enabled | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) |
| `quiz_scores` | enabled | public: true | public: (auth.uid() = user_id) | — | — |
| `rate_limit_logs` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | — | — | — |
| `rate_limit_rules` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `role_permissions` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: true | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `roles` | enabled | public: true | — | — | — |
| `runbook_executions` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `sales_campaigns` | enabled | authenticated: true | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `saved_filters` | enabled | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) |
| `scratch_card_prizes` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (is_active OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `scratch_cards` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((user_id = auth.uid()) AND (status = 'pending'::text)) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `seasonal_challenges` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: (EXISTS ( SELECT 1 FROM seasonal_events e WHERE ((e.id = seasonal_challenges.event_id) AND ((e.is_active = true) OR has_role(auth.ui | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `seasonal_events` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `security_alerts` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `sequence_attempts` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) |
| `sequence_procedures` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (is_active OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `sequence_steps` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `session_logs` | enabled | authenticated: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | — | authenticated: (user_id = auth.uid()) | — |
| `shop_promotions` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: has_role(auth.uid(), 'admin'::app_role)<br>public: ((is_active = true) AND (starts_at <= now()) AND (ends_at > now())) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `shop_purchases` | enabled | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | — |
| `shop_rewards` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role)) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `sla_targets` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `task_penalties` | enabled | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: (auth.uid() = user_id) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) |
| `task_scores` | enabled | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>authenticated: ((user_id = auth.uid()) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>authenticated: (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>authenticated: (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) |
| `team_members` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: ((auth.uid() = user_id) OR is_department_manager(auth.uid(), department_id) OR has_role(auth.uid(), 'admin'::app_role))<br>public: (auth.uid() = user_id) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `tournament_matches` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `tournament_participants` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: true | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `tournaments` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role)) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `trail_enrollments` | enabled | public: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (user_id = auth.uid()) | public: (user_id = auth.uid()) | — |
| `trail_modules` | enabled | public: (EXISTS ( SELECT 1 FROM learning_trails t WHERE ((t.id = trail_modules.trail_id) AND ((t.status = 'published'::trail_status) OR (t.c<br>public: (EXISTS ( SELECT 1 FROM learning_trails t WHERE ((t.id = trail_modules.trail_id) AND ((t.created_by = auth.uid()) OR has_role(auth.u | public: (EXISTS ( SELECT 1 FROM learning_trails t WHERE ((t.id = trail_modules.trail_id) AND ((t.created_by = auth.uid()) OR has_role(auth.u | public: (EXISTS ( SELECT 1 FROM learning_trails t WHERE ((t.id = trail_modules.trail_id) AND ((t.created_by = auth.uid()) OR has_role(auth.u | public: (EXISTS ( SELECT 1 FROM learning_trails t WHERE ((t.id = trail_modules.trail_id) AND ((t.created_by = auth.uid()) OR has_role(auth.u |
| `trail_prerequisites` | enabled | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: true | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) |
| `user_achievements` | enabled | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | — | — |
| `user_avatar_config` | enabled | public: true | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | — |
| `user_avatar_items` | enabled | public: true<br>public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | — | — |
| `user_cards` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: (user_id = auth.uid()) | authenticated: (user_id = auth.uid()) | authenticated: (user_id = auth.uid()) |
| `user_certifications` | enabled | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: (auth.uid() = user_id) | authenticated: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | — |
| `user_challenges` | enabled | public: (auth.uid() = user_id) | authenticated: (auth.uid() = user_id) | public: (auth.uid() = user_id) | — |
| `user_combos` | enabled | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | — |
| `user_competency_assessments` | enabled | public: ((auth.uid() = user_id) OR (auth.uid() = assessor_id)) | authenticated: (assessor_id = auth.uid()) | — | — |
| `user_demographic_values` | enabled | public: (auth.uid() = user_id)<br>public: public.has_role(auth.uid(), 'admin'::public.app_role) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) |
| `user_devices` | enabled | public: (auth.uid() = user_id) | authenticated: (user_id = auth.uid()) | public: (auth.uid() = user_id) | — |
| `user_leagues` | enabled | public: true<br>public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role)<br>public: (user_id = auth.uid()) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `user_mission_progress` | enabled | public: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)) | public: (user_id = auth.uid()) | public: (user_id = auth.uid()) | — |
| `user_permission_groups` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: (auth.uid() = user_id) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `user_positions` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: (auth.uid() = user_id) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `user_roles` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: (auth.uid() = user_id) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `user_seasonal_progress` | enabled | public: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | — |
| `user_titles` | enabled | public: has_role(auth.uid(), 'admin'::app_role)<br>public: ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `user_two_factor` | enabled | authenticated: (auth.uid() = user_id) | authenticated: (auth.uid() = user_id) | authenticated: (auth.uid() = user_id) | — |
| `wager_budget_settings` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: has_role(auth.uid(), 'manager'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `wager_entries` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: (user_id = auth.uid()) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `wager_integrity_review_events` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `wager_integrity_reviews` | enabled | authenticated: (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))<br>authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `wager_questions` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>authenticated: ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))<br>authenticated: EXISTS ( SELECT 1 FROM public.wager_entries e WHERE e.question_id = wager_questions.id AND e.user_id = auth.uid() ) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |
| `webauthn_challenges` | enabled | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) |
| `webauthn_credentials` | enabled | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) | public: (auth.uid() = user_id) |
| `webhook_delivery_logs` | enabled | public: has_role(auth.uid(), 'admin'::app_role) | — | — | — |
| `webhook_delivery_stats_24h` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `webhook_idempotency` | enabled | service_role: true<br>service_role: true | service_role: true<br>service_role: true | service_role: true<br>service_role: true | service_role: true<br>service_role: true |
| `webhook_subscriptions` | enabled | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) | public: has_role(auth.uid(), 'admin'::app_role) |
| `weekly_challenges` | enabled | authenticated: true | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role(auth.uid(), 'admin'::app_role) |

> `—` com RLS ligado = ninguém além de service_role. `sem RLS` = qualquer chave anon lê/escreve tudo.

## Onde o RLS é IGNORADO (service_role) — 157 arquivo(s)

- `scripts/ai-context/cenarios.mjs`
- `scripts/ai-context/gerar.unit.mjs`
- `scripts/regras_negocio/generate.py`
- `scripts/supabase_snapshot/snapshot.py`
- `supabase/functions/_shared/contracts/common.ts`
- `supabase/functions/_shared/security.ts`
- `supabase/functions/admin-alerts/index.ts`
- `supabase/functions/ai-course-builder/index.ts`
- `supabase/functions/burn-rate-monitor/index.ts`
- `supabase/functions/churn-prediction/index.ts`
- `supabase/functions/competency-alerts/index.ts`
- `supabase/functions/detect-new-device/index.ts`
- `supabase/functions/dispatch-critical-alert/index.ts`
- `supabase/functions/error-budget-monitor/index.ts`
- `supabase/functions/generate-quiz-questions/index.ts`
- `supabase/functions/migrate-helper/index.ts`
- `supabase/functions/passkey-auth/index.ts`
- `supabase/functions/push-device-revoked/index.ts`
- `supabase/functions/push-outbox-dispatcher/index.ts`
- `supabase/functions/reward-approval-review/index.ts`
- `supabase/functions/security-weekly-digest/index.ts`
- `supabase/functions/send-campaign-push/index.ts`
- `supabase/functions/trail-recommendations/index.ts`
- `supabase/functions/verify-ip/index.ts`
- `supabase/functions/webhook-dispatcher/index.ts`
- `supabase/functions/webhook-health-monitor/index.ts`
- `supabase/functions/webhook-ping/index.ts`
- `supabase/migrations/20251220144518_06856092-4043-44fe-8da4-8f9501335d42.sql`
- `supabase/migrations/20260306000318_cc14b254-e622-48a0-a219-de592646bf75.sql`
- `supabase/migrations/20260520162642_60bbdd93-a248-4b2d-8f18-548974872356.sql`
- `supabase/migrations/20260520163657_25dfdf55-387e-4b6a-87a8-b1fb2491ce04.sql`
- `supabase/migrations/20260522143342_97cca971-5225-43e6-9969-c31483764926.sql`
- `supabase/migrations/20260522144401_4396f719-927b-4c72-ad5a-2ed5fd187d0c.sql`
- `supabase/migrations/20260711153125_3080af6a-d23d-4b9b-ba1f-02dba6d44dd4.sql`
- `supabase/migrations/20260711192623_7a46baef-8f78-4c1d-a09f-c03ede842682.sql`
- `supabase/migrations/20260711194726_d4508070-d4f0-4b68-9cc4-83171b3b1d84.sql`
- `supabase/migrations/20260712110233_c2c516f4-081f-48da-a073-abbbe32b95c6.sql`
- `supabase/migrations/20260712112604_ad3b2cb2-b80b-48e3-b81e-db4bd77c51fe.sql`
- `supabase/migrations/20260712191659_7162f535-958f-4c45-8b50-f0a1eaa0028c.sql`
- `supabase/migrations/20260712194608_bed9b5c6-221d-45ce-a0e5-cedd4aa2cf57.sql`
- `supabase/migrations/20260712194912_610665a4-9a5a-4556-adea-d6191e06d0dd.sql`
- `supabase/migrations/20260712195808_a0bac812-0690-4dda-9776-845e547e1aac.sql`
- `supabase/migrations/20260712200006_664f7c03-75c3-4a12-9b8d-1d6da5c917d2.sql`
- `supabase/migrations/20260712202617_24a1ee09-af6a-41fa-a1c6-5f1ab66a38cd.sql`
- `supabase/migrations/20260712202813_38016c62-951f-49b3-9f97-c150ff3038a7.sql`
- `supabase/migrations/20260712203117_fac39bdd-c966-4e9e-96f4-feee404f2a82.sql`
- `supabase/migrations/20260712215914_4eec2b74-d615-4e45-8655-fc7c8b022d10.sql`
- `supabase/migrations/20260712220241_1341c891-b5f4-42a3-8028-16f3d57fdece.sql`
- `supabase/migrations/20260712220916_7df9a342-9572-4145-996a-0f4460cdba43.sql`
- `supabase/migrations/20260712221704_bedd64f9-3dae-4e14-b609-5482a05f82d4.sql`
- `supabase/migrations/20260712222009_147eee74-b689-46b7-b92b-d903d1e4754b.sql`
- `supabase/migrations/20260712222124_0a235aa5-fd55-4549-b78b-f1de5dff2dbd.sql`
- `supabase/migrations/20260712222316_d8f7eabc-3e3b-437f-b041-70b9f3b88f9b.sql`
- `supabase/migrations/20260712222455_cdcbc232-1f35-4c6c-9c2c-0e4bf903e241.sql`
- `supabase/migrations/20260712222653_8d3916b2-c16d-4d4e-9a18-7fde8939b0fe.sql`
- `supabase/migrations/20260712223931_ecd3fd87-8d7c-4758-ae38-4dcead1b95bd.sql`
- `supabase/migrations/20260722195014_d7b5a00c-3572-44ec-90ac-d437b219e313.sql`
- `supabase/migrations/20260723101331_463fe946-3615-4294-ad69-fb70cdde9cf2.sql`
- `supabase/migrations/20260723101351_940a464b-3d45-4b40-a7b7-715fc9e2faa9.sql`
- `supabase/migrations/20260723130236_da0342cf-1997-49db-a628-16fd5a79d305.sql`
- `supabase/migrations/20260723150852_6048cf0f-c3a4-48e7-9f40-e2b293b020b9.sql`
- `supabase/migrations/20260723151255_13112990-5190-4576-86fb-0275ea72a4a0.sql`
- `supabase/migrations/20260723151640_1740b6b6-9f58-4d00-ab38-c4accfea4616.sql`
- `supabase/migrations/20260723152047_aaa00e2a-9036-4708-b6d2-731cd5c2eced.sql`
- `supabase/migrations/20260723152219_292e92ab-dd1b-473f-bedb-4ab88b75a41e.sql`
- `supabase/migrations/20260723163049_e2064331-aaf2-4896-b16a-7c6de928fe5f.sql`
- `supabase/migrations/20260723163545_23799016-d91a-4efe-ae9c-72465fbbd380.sql`
- `supabase/migrations/20260726155352_df9dcda0-0e2d-450f-b8b2-9b21ac810d32.sql`
- `supabase/migrations/20260726155435_b82d6b05-57d8-4571-9bb7-61b8d28b8c2f.sql`
- `supabase/migrations/20260726160221_c8b3bb1b-a935-48e0-863b-116196c16a88.sql`
- `supabase/migrations/20260726160248_bfb5652a-bbaa-44cf-9e3d-270014e00449.sql`
- `supabase/migrations/20260726160940_73598534-820c-416f-8663-cb0272ff160a.sql`
- `supabase/migrations/20260726161512_c9a872a1-6ea2-47cc-99fd-f15f74cecd34.sql`
- `supabase/migrations/20260726162411_3b26fcd9-cb19-49a2-b3c1-04355ef5dad5.sql`
- `supabase/migrations/20260726164804_1191d75a-41c4-4492-81bb-d9d591ed379e.sql`
- `supabase/migrations/20260726165147_4f189d08-4bc8-4313-8980-d6934c6c07a5.sql`
- `supabase/migrations/20260726170103_89dfe9bd-f9d1-44ba-a540-68496b534bb8.sql`
- `supabase/migrations/20260726182807_60e2ae2c-7399-42d5-80ca-722803ff15c9.sql`
- `supabase/migrations/20260726185840_57bbd481-d667-4468-9244-bd32ae41da59.sql`
- `supabase/migrations/20260727100045_69d56c43-b506-405f-8469-2c59a6bf1cdf.sql`
- `supabase/migrations/20260727171415_85c57bb0-f886-41ab-bd07-e3a1688256ec.sql`
- `supabase/migrations/20260727183427_72f9c05a-39cb-439b-9460-a965561e3d62.sql`
- `supabase/migrations/20260727184545_b9620ff8-06a2-4ece-9b16-9736d339b3e0.sql`
- `supabase/migrations/20260727200404_b6247676-84b3-41f8-a725-ac3055868320.sql`
- `supabase/migrations/20260727205544_b7279835-115a-4407-9e02-6fed78ac0f63.sql`
- `supabase/migrations/20260727211017_30d9a02a-0c84-4b45-8702-4bab7e71f005.sql`
- `supabase/migrations/20260727211054_63195d2e-fcc9-40df-993b-82086b627baf.sql`
- `supabase/migrations/20260727213924_1ac322ab-1677-4094-96a8-c1ad0812647f.sql`
- `supabase/migrations/20260727215945_ba1105ee-36ac-4f9e-88b9-79454b9c6178.sql`
- `supabase/migrations/20260727220212_7a58639d-4928-43be-a7a8-325c67d39983.sql`
- `supabase/migrations/20260727220922_7fdbfc2a-6a87-42b0-a5c9-818c5a862bb5.sql`
- `supabase/migrations/20260727221231_aacc3a8b-99f9-4836-85f0-f639d99184f1.sql`
- `supabase/migrations/20260727221909_f26719a2-a70b-4f38-ab93-5bda56de8d26.sql`
- `supabase/migrations/20260727221910_f26719a2_lightning_relampago_schema.sql`
- `supabase/migrations/20260727222655_16b4a067-5707-4794-9cba-be5694907056.sql`
- `supabase/migrations/20260727225705_3f1a6745-9d47-4f97-aa97-b73f6a05b1da.sql`
- `supabase/migrations/20260727230544_2dc28ece-3091-4d64-900d-c9af22c8ba3f.sql`
- `supabase/migrations/20260727231914_e85bd74f-7295-4e96-8574-5961a889ed41.sql`
- `supabase/migrations/20260728103329_1a2a8f0f-b71b-495d-b706-44a4e87e31d1.sql`
- `supabase/migrations/20260728111343_cf6a1baa-1658-4bb8-a8ef-0e51e0d8241b.sql`
- `supabase/migrations/20260728112123_ea25bb13-aa3c-4f75-9892-c58e2785e70b.sql`
- `supabase/migrations/20260728112223_9f86e736-fd1e-4ab5-a812-9fc5f1f6f009.sql`
- `supabase/migrations/20260728112815_fd49db87-3ae3-448d-b394-dfe7f248adae.sql`
- `supabase/migrations/20260728113255_b0c9ae8e-e19d-44ea-ad4d-a0366d453980.sql`
- `supabase/migrations/20260728114514_7f6f6bd8-8c0c-4762-9f48-2e4474ed0b2b.sql`
- `supabase/migrations/20260728121542_4ac8cbd1-0d6d-410d-8734-4fd032804ddc.sql`
- `supabase/migrations/20260728122626_32e02751-3e63-4896-adef-653b53012bbf.sql`
- `supabase/migrations/20260728125833_b6b2c15a-1960-4e13-9c2a-0cdff052ea01.sql`
- `supabase/migrations/20260728150404_176dbae6-505f-48df-85d3-80751f60fa73.sql`
- `supabase/migrations/20260728150843_a77f1b38-b81a-46ff-a471-be5eda43d4ff.sql`
- `supabase/migrations/20260728155537_900a1488-1655-4e15-b4be-26a2b8676126.sql`
- `supabase/migrations/20260728160710_b44a5761-2e2e-411a-87d5-5f4df8341b48.sql`
- `supabase/migrations/20260728162114_61d3375b-2a9f-45c4-9382-bc162fdc5469.sql`
- `supabase/migrations/20260728162910_ce6804ee-af74-4b26-a85c-c0b3c83c0965.sql`
- `supabase/migrations/20260728162937_59158e05-a140-4ec9-92bc-19f6af968ea5.sql`
- `supabase/migrations/20260728165352_0b6b1cf6-d904-4ea9-aa56-39273a7747d4.sql`
- `supabase/migrations/20260728170048_6914a662-62a1-4083-8f9c-3acf7ec34b57.sql`
- `supabase/migrations/20260728171612_1d7a91fb-2bc6-4dbd-b18c-99a6b9ee7326.sql`
- `supabase/migrations/20260728172534_0b59fa61-90b1-4878-be78-a0c609c9de50.sql`
- `supabase/migrations/20260728175346_9062e6fd-34a2-4490-82cd-d4877f2beafd.sql`
- `supabase/migrations/20260728175639_4829adee-3359-462f-b265-1cf27ef5c185.sql`
- `supabase/migrations/20260728175939_0f953042-aabe-4edb-922a-c597cbb1f05a.sql`
- `supabase/migrations/20260728180043_71553ac9-e558-4922-bbbb-b1b0cc07c9bf.sql`
- `supabase/migrations/20260728180133_93c53b2d-f159-4f4c-8fad-deb269e6a600.sql`
- `supabase/migrations/20260728180730_1d09218b-0f91-4b02-9127-2009c4de7589.sql`
- `supabase/migrations/20260728180820_c545a26e-bdfe-4f9e-9720-5faeddf7bf87.sql`
- `supabase/migrations/20260728183016_7700507e-bccb-4244-9fa4-6c9e79440974.sql`
- `supabase/migrations/20260728183324_769cbcc5-0748-41f8-9c78-dc908102506d.sql`
- `supabase/migrations/20260728184740_564ebe94-d47a-4232-be62-27ad31f48a94.sql`
- `supabase/migrations/20260728185015_9aac76f7-fb94-4e9b-848e-5d496293c112.sql`
- `supabase/migrations/20260728185119_d97a70b6-1771-41be-8175-29a5be5acd17.sql`
- `supabase/migrations/20260728185632_10515b61-e01f-4ca0-a3e6-a13b8158d7de.sql`
- `supabase/migrations/20260728204549_157d9c62-d7e3-462a-b546-bd93b8a2e0a0.sql`
- `supabase/migrations/20260728205541_a9eda956-7c86-4797-a55a-f6b543975fc2.sql`
- `supabase/migrations/20260728205741_a19b425a-9dbf-41f9-8a3c-efb2d4b41560.sql`
- `supabase/migrations/20261114110500_fix_cron_campaigns_alert_check.sql`
- `supabase/migrations/20261114134238_9b119528-da6f-4f43-b6cb-dcdcd7aa7ab1.sql`
- `supabase/migrations/20261220000000_fix_sre_rpcs_and_dispatch_trigger.sql`
- `supabase/migrations/20261224110000_cron_internal_jobs_drift.sql`
- `supabase/migrations/20261224120000_dispatch_critical_alert_config.sql`
- `supabase/migrations/20261226120000_revoga_execute_anon_security_definer.sql`
- `supabase/migrations/20261226130000_reset_senha_por_email.sql`
- `supabase/migrations/20261226140000_corrige_grants_rls_e_rpcs_internos.sql`
- `supabase/migrations/20261226150000_reset_senha_fluxo_completo.sql`
- `supabase/migrations/20261226160000_reset_senha_guardas_aprovacao.sql`
- `supabase/migrations/20261226170000_reset_senha_busca_auth_users.sql`
- `supabase/migrations/20261226180000_escopo_gestor_rpcs_relatorio.sql`
- `supabase/migrations/20261226195000_reset_senha_consistencia.sql`
- `supabase/migrations/20261227120000_engagement_integridade_e_anon.sql`
- `supabase/migrations/20261228120000_cron_jobs_e_leaderboard_cache.sql`
- … +7 (lista completa em `context.json`)

## Funções SQL `SECURITY DEFINER` (rodam com privilégio do dono, ignoram RLS)

- `_climate_recompute_pillar_scores`
- `_grant_card_pack_internal`
- `_guard_manager_or_admin_if_user`
- `_require_admin`
- `_require_manager_or_admin`
- `acknowledge_security_alert`
- `acknowledge_security_digest`
- `add_coins`
- `add_xp`
- `admin_profile_directory`
- `advance_board_trail`
- `answer_lightning_question`
- `apply_boss_damage_internal`
- `apply_campaign_import`
- `apply_task_penalty`
- `approve_password_reset`
- `assign_engagement_questions`
- `audit_lucky_wheel_prize`
- `auto_block_ip`
- `auto_create_postmortem_on_resolve`
- `auto_lock_prediction_markets`
- `auto_promote_expired_webhook_secrets`
- `auto_unblock_board_players`
- `award_campaign_team_split`
- `bingo_metric_value`
- `boss_hook_attendance_streaks`
- `boss_hook_task_scores`
- `boss_hook_trail_enrollments`
- `boss_phase_alert_hook`
- `bulk_rotate_webhook_secrets`
- `calculate_enps_score`
- `can_handle_opinion`
- `cancel_auction`
- `cancel_webhook_secret_rotation`
- `card_pack_hook_attendance_streaks`
- `card_pack_hook_task_scores`
- `card_pack_hook_trail_enrollments`
- `card_pack_notify`
- `check_api_key_rotation_overdue`
- `check_boss_win_rate_alerts`
- `check_boss_win_rate_alerts_impl`
- `check_login_lockout`
- `check_overdue_postmortem_actions`
- `check_prediction_markets_health`
- `check_sla_breaches_and_alert`
- `check_webhook_sla_and_alert`
- `claim_card_set_reward`
- `claim_push_outbox`
- `cleanup_expired_challenges`
- `cleanup_expired_idempotency_keys`
- `cleanup_old_security_logs`
- `climate_recalculate_pillar_scores`
- `climate_submit_response`
- `climate_survey_enps`
- `close_auction`
- `close_expired_auctions`
- `close_expired_sales_campaigns`
- `complete_external_task`
- `complete_task_score`
- `create_auction_draft`
- `create_external_api_key`
- `create_prediction_market`
- `db_health_check`
- `deal_boss_damage`
- `delete_board_trail`
- `delete_external_api_key`
- `detect_long_running_queries`
- `enforce_campaign_team_consistency`
- `enqueue_push`
- `expire_card_trades`
- `expire_climate_surveys`
- `finish_lightning_round`
- `finish_memory_session`
- `generate_action_plan_from_factor`
- `generate_action_plan_from_nr1_category`
- `generate_action_plan_from_opinion`
- `generate_certificate_code`
- `generate_engagement_snapshot`
- `generate_executive_monthly_report`
- `get_2fa_status`
- `get_account_devices`
- `get_active_engagement_cycle`
- `get_alert_heatmap_30d`
- `get_alert_mttr_by_type_7d`
- `get_auction_summary`
- `get_board_challenge_stats`
- `get_board_trail_leaderboard`
- `get_boss_battle_leaderboard`
- `get_burn_rate`
- `get_card_set_rewards`
- `get_daily_wager`
- `get_department_metrics`
- `get_department_war_feed`
- `get_department_war_standings`
- `get_engagement_cycle_progress`
- `get_engagement_factor_scores`
- `get_engagement_nps`
- `get_engagement_nps_history`
- `get_engagement_overview`
- `get_engagement_pillar_benchmark`
- `get_engagement_pillar_correlations`
- `get_engagement_pillar_scores`
- `get_error_budget_30d`
- `get_executive_metrics`
- `get_incident_metrics`
- `get_leaderboard_api`
- `get_lucky_wheel_prizes_display`
- `get_lucky_wheel_status`
- `get_memory_leaderboard`
- `get_monthly_trends`
- `get_my_profile_private`
- `get_nine_box_distribution`
- `get_nr1_risk_matrix`
- `get_nr1_summary`
- `get_opinion_feed`
- `get_or_create_bingo_card`
- `get_passkeys_by_email`
- `get_pending_password_reset_requests`
- `get_prediction_odds_history`
- `get_prediction_oracle_aggregates`
- `get_push_outbox_health`
- `get_push_outbox_health_trend`
- `get_quiz_category_stats`
- `get_quiz_lifeline`
- `get_quiz_play_set`
- `get_reliability_slo`
- `get_reliability_timeline`
- `get_security_digest_history`
- `get_security_stats`
- `get_sequence_play_set`
- `get_sequence_procedure_stats`
- `get_tournament_bracket`
- `get_user_department_id`
- `get_user_stats_api`
- `get_wager_leaderboard`
- `get_webhook_delivery_hourly_24h`
- `get_webhook_delivery_logs`
- `get_webhook_delivery_stats_1h`
- `get_webhook_delivery_stats_24h`
- `get_webhook_executive_metrics_7d`
- `grade_quiz_answer`
- `grant_card_pack`
- `grant_scratch_card`
- `guard_engagement_answer_assignment`
- `handle_new_user`
- `has_role`
- `increment_announcement_views`
- `increment_push_failures`
- `increment_quests_completed`
- `increment_streak`
- `increment_user_xp_coins`
- `ingest_war_event`
- `is_country_allowed`
- `is_department_manager`
- `is_ip_blocked`
- `is_ip_whitelisted`
- `is_org_admin`
- `is_org_member`
- `join_tournament`
- `list_external_api_keys`
- `list_stuck_board_players`
- `list_tournaments`
- `list_wager_questions`
- `log_auction_admin_event`
- `log_geo_access`
- `log_ip_access`
- `log_login_attempt`
- `log_lucky_wheel_budget_change`
- `log_lucky_wheel_prize_change`
- `log_prediction_settlement`
- `log_purchase_requested`
- `log_runbook_step`
- `log_wager_integrity_review_event`
- `notify_admins_of_monthly_report`
- `open_card_pack`
- `place_auction_bid`
- `place_prediction_stake`
- `process_external_task`
- `promote_webhook_secret`
- `propose_card_trade`
- `publish_auction`
- `push_quiet_hours_until`
- `quiz_fifty_fifty`
- `raise_lucky_wheel_window_alerts`
- `recalc_campaign_progress`
- `recalc_campaign_teams`
- `register_device`
- `register_war_contribution`
- `reject_password_reset`
- `report_tournament_match`
- `request_password_reset`
- `request_password_reset_by_email`
- `requeue_push_outbox`
- `reset_login_attempts`
- `reset_password_with_token`
- `reset_push_failures`
- `resolve_board_challenge`
- `respond_card_trade`
- `respond_to_opinion`
- `reveal_scratch_card`
- `revert_campaign_import`
- `revert_campaign_team_split`
- `review_purchase`
- `revoke_device_by_fingerprint`
- `revoke_push_device`
- `rls_auto_enable`
- `rotate_external_api_secret`
- `rotate_webhook_secret`
- `run_boss_win_rate_alerts`
- `save_board_trail`
- `save_sequence_procedure`
- `save_wager_question`
- `search_all`
- `send_climate_survey_reminders`
- `send_engagement_reminders`
- `set_external_api_key_active`
- `set_opinion_status`
- `settle_auction`
- `settle_boss_battle`
- `settle_department_war`
- `settle_prediction_market`
- `settle_tournament_rewards`
- `snapshot_lucky_wheel_payout`
- `snapshot_push_outbox_health`
- `spend_coins`
- `spin_lucky_wheel`
- `start_lightning_round`
- `start_memory_session`
- `start_tournament`
- `submit_daily_wager`
- `submit_engagement_answer`
- `submit_sequence_attempt`
- `sync_bingo_card`
- `sync_department_war_headcount`
- `toggle_opinion_support`
- `tournament_place_winner`
- `tournament_propagate_byes`
- `transition_prediction_market`
- `trigger_dispatch_critical_alert`
- `trim_push_sync_events`
- `unblock_board_players`
- `update_certification_statuses`
- `user_has_passkeys`
- `user_wants_email_notification`
- `user_wants_in_app_notification`
- `user_wants_push_notification`
- `validate_api_key`
- `validate_reset_token`
- `verify_certificate`
- `war_hook_attendance`
- `war_hook_kudos`
- `war_hook_module_progress`
- `war_hook_quiz_scores`
- `war_hook_task_scores`
- `war_hook_trail_enrollments`

## Edge functions públicas (sem JWT — qualquer um chama)

- `passkey-auth`
- `migrate-helper`
- `push-public-key`
- `push-outbox-dispatcher`
- `security-weekly-digest`
- `burn-rate-monitor`
- `error-budget-monitor`
- `webhook-health-monitor`
- `dispatch-critical-alert`

## Rotas protegidas no front

| Rota | Guard | Roles | Arquivo |
|---|---|---|---|
| / | ProtectedRoute |  | `src/App.tsx` |
| /admin | ProtectedRoute | admin | `src/App.tsx` |
| /admin/api-keys | ProtectedRoute | admin | `src/App.tsx` |
| /admin/atributos-demograficos | ProtectedRoute | manager | `src/App.tsx` |
| /admin/burn-rate | ProtectedRoute | admin | `src/App.tsx` |
| /admin/error-budget | ProtectedRoute | admin | `src/App.tsx` |
| /admin/executive-report | ProtectedRoute | admin | `src/App.tsx` |
| /admin/incident-metrics | ProtectedRoute | admin | `src/App.tsx` |
| /admin/permissions | ProtectedRoute | admin | `src/App.tsx` |
| /admin/postmortems | ProtectedRoute | admin | `src/App.tsx` |
| /admin/reliability | ProtectedRoute | admin | `src/App.tsx` |
| /admin/runbook/:type | ProtectedRoute | admin | `src/App.tsx` |
| /admin/security-digests | ProtectedRoute | admin | `src/App.tsx` |
| /admin/security-runbook | ProtectedRoute | admin | `src/App.tsx` |
| /admin/telemetria | ProtectedRoute | admin | `src/App.tsx` |
| /admin/webhooks | ProtectedRoute | admin | `src/App.tsx` |
| /admin/webhooks/:id | ProtectedRoute | admin | `src/App.tsx` |
| /admin/webhooks/executive | ProtectedRoute | admin | `src/App.tsx` |
| /admin/webhooks/new | ProtectedRoute | admin | `src/App.tsx` |
| /album | ProtectedRoute |  | `src/App.tsx` |
| /analytics | ProtectedRoute | admin | `src/App.tsx` |
| /announcements | ProtectedRoute |  | `src/App.tsx` |
| /app | ProtectedRoute |  | `scripts/ai-context/gerar.unit.mjs` |
| /audit | ProtectedRoute | admin | `src/App.tsx` |
| /bi | ProtectedRoute | manager | `src/App.tsx` |
| /bingo | ProtectedRoute |  | `src/App.tsx` |
| /campanhas | ProtectedRoute |  | `src/App.tsx` |
| /campanhas/:id | ProtectedRoute |  | `src/App.tsx` |
| /campanhas/:id/ranking-equipes | ProtectedRoute |  | `src/App.tsx` |
| /campanhas/equipes | ProtectedRoute |  | `src/App.tsx` |
| /campanhas/historico | ProtectedRoute |  | `src/App.tsx` |
| /checkins | ProtectedRoute | manager | `src/App.tsx` |
| /chefao | ProtectedRoute |  | `src/App.tsx` |
| /clima | ProtectedRoute |  | `src/App.tsx` |
| /clima/admin | ProtectedRoute | manager | `src/App.tsx` |
| /conquistas | ProtectedRoute |  | `src/App.tsx` |
| /duelos | ProtectedRoute |  | `src/App.tsx` |
| /engajamento | ProtectedRoute |  | `src/App.tsx` |
| /engajamento/diagnostico | ProtectedRoute | manager | `src/App.tsx` |
| /engajamento/nr1 | ProtectedRoute | manager | `src/App.tsx` |
| /engajamento/opinioes | ProtectedRoute |  | `src/App.tsx` |
| /estatisticas | ProtectedRoute |  | `src/App.tsx` |
| /eventos/:eventId | ProtectedRoute |  | `src/App.tsx` |
| /executivo | ProtectedRoute | admin | `src/App.tsx` |
| /feed | ProtectedRoute |  | `src/App.tsx` |
| /feedback | ProtectedRoute |  | `src/App.tsx` |
| /goals | ProtectedRoute |  | `src/App.tsx` |
| /guerra-departamentos | ProtectedRoute |  | `src/App.tsx` |
| /leagues | ProtectedRoute |  | `src/App.tsx` |
| /leilao | ProtectedRoute |  | `src/App.tsx` |
| /leilao/admin | ProtectedRoute | admin | `src/App.tsx` |
| /loja | ProtectedRoute |  | `src/App.tsx` |
| /loja/admin | ProtectedRoute | admin | `src/App.tsx` |
| /manager | ProtectedRoute | manager | `src/App.tsx` |
| /memoria | ProtectedRoute |  | `src/App.tsx` |
| /memoria/admin | ProtectedRoute | admin | `src/App.tsx` |
| /mentoria | ProtectedRoute |  | `src/App.tsx` |
| /pdi | ProtectedRoute |  | `src/App.tsx` |
| /pergunta-do-dia | ProtectedRoute |  | `src/App.tsx` |
| /pergunta-do-dia/admin | ProtectedRoute | admin | `src/App.tsx` |
| /planos-acao | ProtectedRoute | manager | `src/App.tsx` |
| /ponto | ProtectedRoute |  | `src/App.tsx` |
| /previsoes | ProtectedRoute |  | `src/App.tsx` |
| /previsoes/admin | ProtectedRoute | admin | `src/App.tsx` |
| /profile | ProtectedRoute |  | `src/App.tsx` |
| /quest-builder | ProtectedRoute | manager | `src/App.tsx` |
| /quiz | ProtectedRoute |  | `src/App.tsx` |
| /quiz/admin | ProtectedRoute | manager | `src/App.tsx` |
| /raspadinha | ProtectedRoute |  | `src/App.tsx` |
| /relampago | ProtectedRoute |  | `src/App.tsx` |
| /reports | ProtectedRoute | manager | `src/App.tsx` |
| /roleta | ProtectedRoute |  | `src/App.tsx` |
| /roleta/admin | ProtectedRoute | admin | `src/App.tsx` |
| /security | ProtectedRoute | admin | `src/App.tsx` |
| /security-dashboard | ProtectedRoute | admin | `src/App.tsx` |
| /sequencia | ProtectedRoute |  | `src/App.tsx` |
| /sequencia/admin | ProtectedRoute | admin | `src/App.tsx` |
| /surveys | ProtectedRoute |  | `src/App.tsx` |
| /tabuleiro | ProtectedRoute |  | `src/App.tsx` |
| /tabuleiro/admin | ProtectedRoute | admin | `src/App.tsx` |
| /torneios | ProtectedRoute |  | `src/App.tsx` |
| /trails | ProtectedRoute |  | `src/App.tsx` |
| /trails/:id | ProtectedRoute |  | `src/App.tsx` |

Guards usados: Protected, ProtectedRoute

Middleware matcher (Next.js): nenhum

## Grants / Revokes (agrupados por role e privilégio)

| Ação | Para/De | Privilégios | Objetos |
|---|---|---|---|
| grant | anon | select | `geo_blocking_rules`, `permission_groups` |
| grant | anon, authenticated | execute | `get_passkeys_by_email`, `user_has_passkeys`, `verify_certificate`, `get_passkeys_by_email`, `has_role`, `is_department_manager` |
| grant | anon, authenticated | select | `weekly_challenges`, `organizations` |
| grant | anon, authenticated, service_role | execute | `get_2fa_status`, `user_has_passkeys`, `request_password_reset_by_email`, `request_password_reset_by_email`, `reset_password_with_token`, `request_password_reset_by_email`, `reset_password_with_token` |
| grant | authenticated | delete | `pdi_mentors`, `ai_course_jobs`, `checkins`, `climate_question_answers`, `climate_survey_responses`, `development_plans`, `direct_duels`, `feedback_evaluations`, `feedback_requests`, `lucky_wheel_whatif_snapshots`, `mentorship_mission_progress`, `mentorship_pairs`, `mentorship_requests`, `module_progress`, `new_device_alerts` … +17 |
| grant | authenticated | execute | `get_executive_metrics`, `get_monthly_trends`, `get_department_metrics`, `generate_engagement_snapshot`, `get_department_metrics`, `get_executive_metrics`, `get_monthly_trends`, `get_nine_box_distribution`, `get_security_stats`, `generate_engagement_snapshot`, `get_quiz_category_stats`, `get_webhook_delivery_hourly_24h`, `get_alert_mttr_by_type_7d`, `get_alert_heatmap_30d`, `get_security_digest_history` … +112 |
| grant | authenticated | insert | `user_challenges` |
| grant | authenticated | insert, delete | `organizations`, `session_logs` |
| grant | authenticated | insert, update, delete | `boss_battles`, `boss_win_rate_goals`, `memory_decks`, `memory_pairs`, `api_request_logs`, `auction_admin_events`, `auction_bids`, `bingo_cards`, `bingo_marks`, `board_moves`, `board_player_states`, `boss_battle_damage`, `boss_battle_rewards`, `campaign_team_split_batches`, `campaign_team_split_entries` … +36 |
| grant | authenticated | select | `push_notification_logs`, `engagement_action_playbooks`, `nr1_risk_categories`, `nr1_factor_mappings`, `purchase_approvals`, `campaign_team_split_batches`, `campaign_team_split_entries`, `lucky_wheel_prize_audit`, `lucky_wheel_payout_snapshots`, `lucky_wheel_settings_audit`, `scratch_card_prizes`, `scratch_cards`, `lightning_quiz_sessions`, `lightning_quiz_answers`, `lightning_quiz_sessions` … +40 |
| grant | authenticated | select, insert | `runbook_executions`, `org_theme_history`, `campaign_progress_events`, `engagement_answers`, `push_sync_events` |
| grant | authenticated | select, insert, delete | `opinion_supports` |
| grant | authenticated | select, insert, update | `ai_course_jobs`, `lucky_wheel_settings`, `lucky_wheel_whatif_snapshots`, `wager_budget_settings`, `board_player_states` |
| grant | authenticated | select, insert, update, delete | `sla_targets`, `postmortems`, `postmortem_actions`, `executive_monthly_reports`, `org_members`, `sales_campaigns`, `campaign_participants`, `push_subscriptions`, `engagement_factors`, `engagement_question_pool`, `engagement_cycles`, `engagement_question_assignments`, `campaign_result_imports`, `campaign_result_rows`, `campaign_teams` … +10 |
| grant | authenticated | update | `organizations`, `activity_reactions`, `ai_coach_messages`, `kudos`, `pdi_mentors`, `query_telemetry` |
| grant | authenticated | update, delete | `action_plan_updates`, `announcement_reads`, `attendance_records`, `audit_logs`, `bitrix24_webhook_logs`, `campaign_progress_events`, `engagement_answers`, `enps_responses`, `feedback_responses`, `feedback_results`, `geo_access_logs`, `goal_updates`, `league_history`, `opinion_responses`, `org_theme_history` … +8 |
| grant | authenticated, anon | select | `profiles_public`, `profiles_public` |
| grant | authenticated, service_role | all | `demographic_attributes`, `geo_access_logs`, `geo_blocking_rules`, `notification_preferences`, `permission_groups`, `user_demographic_values`, `user_permission_groups` |
| grant | authenticated, service_role | execute | `public`, `_require_admin`, `get_webhook_delivery_stats_24h`, `get_webhook_delivery_stats_1h`, `get_webhook_delivery_logs`, `rotate_webhook_secret`, `promote_webhook_secret`, `cancel_webhook_secret_rotation`, `bulk_rotate_webhook_secrets`, `get_webhook_executive_metrics_7d`, `check_webhook_sla_and_alert`, `get_error_budget_30d`, `get_burn_rate`, `generate_executive_monthly_report`, `get_burn_rate` … +67 |
| grant | service_role | all | `runbook_executions`, `sla_targets`, `postmortems`, `postmortem_actions`, `executive_monthly_reports`, `ai_course_jobs`, `organizations`, `org_members`, `org_theme_history`, `sales_campaigns`, `campaign_participants`, `campaign_progress_events`, `push_subscriptions`, `push_notification_logs`, `engagement_factors` … +77 |
| grant | service_role | execute | `cleanup_old_security_logs`, `approve_password_reset`, `reject_password_reset`, `auto_block_ip`, `cleanup_old_security_logs`, `cleanup_old_security_logs`, `cleanup_expired_idempotency_keys`, `cleanup_expired_challenges`, `update_certification_statuses`, `log_ip_access`, `log_geo_access`, `validate_api_key`, `process_external_task`, `complete_external_task`, `apply_task_penalty` … +38 |
| grant | service_role | select | `webhook_delivery_stats_24h`, `webhook_delivery_stats_24h` |
| grant | service_role | select, insert, update, delete | `webhook_idempotency` |
| grant | service_role, authenticated | execute | `get_security_stats`, `log_login_attempt`, `get_nine_box_distribution`, `get_department_metrics`, `get_monthly_trends`, `get_executive_metrics` |
| revoke | PUBLIC | all | `get_security_digest_history`, `get_reliability_slo`, `get_reliability_timeline`, `acknowledge_security_alert`, `log_runbook_step`, `get_incident_metrics`, `get_incident_metrics`, `recalc_campaign_progress`, `close_expired_sales_campaigns`, `user_wants_in_app_notification`, `close_expired_sales_campaigns`, `user_wants_push_notification`, `user_wants_email_notification`, `enqueue_push`, `claim_push_outbox` … +24 |
| revoke | PUBLIC | execute | `cleanup_old_security_logs`, `public`, `approve_password_reset`, `reject_password_reset`, `auto_block_ip`, `cleanup_old_security_logs`, `cleanup_old_security_logs`, `cleanup_expired_idempotency_keys`, `cleanup_expired_challenges`, `get_security_stats`, `update_certification_statuses`, `log_ip_access`, `log_geo_access`, `validate_api_key`, `process_external_task` … +29 |
| revoke | PUBLIC, anon | all | `generate_executive_monthly_report`, `generate_action_plan_from_factor`, `generate_action_plan_from_nr1_category`, `get_engagement_nps_history`, `get_engagement_pillar_benchmark`, `get_engagement_pillar_benchmark`, `trim_push_sync_events`, `revoke_push_device`, `can_handle_opinion`, `get_opinion_feed`, `toggle_opinion_support`, `respond_to_opinion`, `set_opinion_status`, `generate_action_plan_from_opinion`, `revoke_push_device` … +95 |
| revoke | PUBLIC, anon | execute | `get_webhook_delivery_stats_24h`, `get_webhook_delivery_hourly_24h`, `get_webhook_delivery_stats_1h`, `get_webhook_delivery_logs`, `get_error_budget_30d`, `get_burn_rate`, `get_burn_rate`, `is_org_admin`, `is_org_member`, `get_active_engagement_cycle`, `assign_engagement_questions`, `submit_engagement_answer`, `get_engagement_cycle_progress`, `engagement_min_respondents`, `get_engagement_pillar_scores` … +20 |
| revoke | PUBLIC, anon, authenticated | all | `webhook_delivery_stats_24h`, `check_sla_breaches_and_alert`, `auto_create_postmortem_on_resolve`, `check_overdue_postmortem_actions`, `notify_admins_of_monthly_report`, `close_expired_sales_campaigns`, `increment_push_failures`, `reset_push_failures`, `log_lucky_wheel_prize_change`, `chi_square_critical`, `erf_inverse`, `snapshot_lucky_wheel_payout`, `raise_lucky_wheel_window_alerts`, `raise_lucky_wheel_window_alerts`, `log_lucky_wheel_budget_change` … +32 |
| revoke | PUBLIC, anon, authenticated | execute | `validate_reset_token`, `generate_certificate_code`, `ingest_war_event`, `war_hook_task_scores`, `war_hook_attendance`, `war_hook_trail_enrollments`, `war_hook_module_progress`, `war_hook_quiz_scores`, `war_hook_kudos`, `validate_reset_token`, `claim_push_outbox`, `increment_push_failures`, `reset_push_failures`, `user_wants_push_notification`, `get_passkeys_by_email` … +29 |
| revoke | anon | all | `demographic_attributes`, `geo_access_logs`, `geo_blocking_rules`, `notification_preferences`, `permission_groups`, `user_demographic_values`, `user_permission_groups`, `public`, `public`, `profiles_public`, `_climate_recompute_pillar_scores`, `climate_recalculate_pillar_scores`, `climate_survey_enps`, `climate_submit_response`, `approve_password_reset` … +5 |
| revoke | anon | execute | `get_lucky_wheel_prizes_display`, `reset_login_attempts`, `is_org_admin`, `is_org_member`, `can_handle_opinion`, `generate_certificate_code` |
| revoke | anon | insert, update, delete | `push_outbox`, `user_devices` |
| revoke | anon, authenticated | all | `push_quiet_hours_until`, `claim_push_outbox` |
| revoke | anon, authenticated | execute | `cleanup_old_security_logs`, `trigger_dispatch_critical_alert` |
| revoke | anon, authenticated | select | `webhook_delivery_stats_24h` |
| revoke | authenticated | all | `profiles_public`, `_climate_recompute_pillar_scores` |
| revoke | authenticated | delete | `action_plan_updates`, `ai_course_jobs`, `announcement_reads`, `api_request_logs`, `attendance_records`, `auction_admin_events`, `auction_bids`, `audit_logs`, `bingo_cards`, `bingo_marks`, `bitrix24_webhook_logs`, `board_moves`, `board_player_states`, `boss_battle_damage`, `boss_battle_rewards` … +86 |
| revoke | authenticated | execute | `approve_password_reset`, `reject_password_reset`, `get_department_metrics`, `get_executive_metrics`, `get_monthly_trends`, `get_nine_box_distribution`, `get_security_stats`, `generate_engagement_snapshot`, `apply_task_penalty`, `get_quiz_category_stats` |
| revoke | authenticated | insert | `api_request_logs`, `auction_admin_events`, `auction_bids`, `bingo_cards`, `bingo_marks`, `board_moves`, `board_player_states`, `boss_battle_damage`, `boss_battle_rewards`, `campaign_team_split_batches`, `campaign_team_split_entries`, `card_packs`, `card_set_claims`, `card_trades`, `department_war_contributions` … +33 |
| revoke | authenticated | select | `profiles` |
| revoke | authenticated | select, delete, truncate | `profiles` |
| revoke | authenticated | update | `action_plan_updates`, `activity_reactions`, `ai_coach_messages`, `announcement_reads`, `api_request_logs`, `attendance_records`, `auction_admin_events`, `auction_bids`, `audit_logs`, `bingo_cards`, `bingo_marks`, `bitrix24_webhook_logs`, `board_moves`, `board_player_states`, `boss_battle_damage` … +59 |
| revoke | authenticated, anon | all | `webhook_delivery_stats_24h`, `leaderboard_cache` |
| revoke | public, anon | all | `unblock_board_players`, `list_stuck_board_players`, `unblock_board_players`, `unblock_board_players`, `unblock_board_players` |

## Riscos de acesso detectados

| Tabela | Problema | Arquivos |
|---|---|---|
| `attendance_records` | front faz UPDATE mas nenhuma política RLS permite UPDATE → vai falhar/retornar vazio para usuários | `src/services/attendanceService.ts` |
| `demographic_values_panel` | acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/services/demographicsService.ts` |
| `development_plans` | front faz DELETE mas nenhuma política RLS permite DELETE → vai falhar/retornar vazio para usuários | `src/services/developmentPlanService.ts` |
| `lucky_wheel_prizes` | acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/services/luckyWheelService.ts` |
| `lucky_wheel_spins` | acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/services/luckyWheelService.ts` |
| `profiles_public` | acessada do front (5 arquivo(s)) sem RLS (não encontrado) | `src/services/campaignTeamsService.ts`<br>`src/services/luckyWheelService.ts`<br>`src/services/profilesService.ts`<br>`src/services/salesCampaignsService.ts`<br>… +1 |
| `roles` | front faz INSERT mas nenhuma política RLS permite INSERT → vai falhar/retornar vazio para usuários | `src/services/rbacService.ts` |
| `roles` | front faz UPDATE mas nenhuma política RLS permite UPDATE → vai falhar/retornar vazio para usuários | `src/services/rbacService.ts` |
| `roles` | front faz DELETE mas nenhuma política RLS permite DELETE → vai falhar/retornar vazio para usuários | `src/services/rbacService.ts` |
| `user_devices` | front faz DELETE mas nenhuma política RLS permite DELETE → vai falhar/retornar vazio para usuários | `src/hooks/useDeviceDetection.ts` |

## Multi-tenancy

- Chave de tenant: **`org_id`** presente em 3 tabela(s): `org_members`, `org_theme_history`, `sales_campaigns`
- Cobertura: 1% das tabelas. Abaixo de 60% — isolamento provavelmente por usuário (auth.uid()) ou misto; não flagado por tabela.

## Soft delete (registros 'apagados' continuam na tabela — filtre!)

| Tabela | Coluna |
|---|---|
| `department_missions` | `is_active` |
| `shop_rewards` | `is_active` |
| `shop_promotions` | `is_active` |
| `seasonal_events` | `is_active` |
| `mentorship_missions` | `is_active` |
| `avatar_items` | `is_active` |
| `quiz_questions` | `is_active` |
| `demographic_attributes` | `is_active` |
| `positions` | `is_active` |
| `position_task_templates` | `is_active` |
| `penalty_rules` | `is_active` |
| `external_api_keys` | `is_active` |
| `webhook_subscriptions` | `is_active` |
| `gamification_themes` | `is_active` |
| `custom_badges` | `is_active` |
| `custom_titles` | `is_active` |
| `user_titles` | `is_active` |
| `competencies` | `is_active` |
| `ip_whitelist` | `is_active` |
| `pdi_templates` | `is_active` |
| `roles` | `is_active` |
| `notification_templates` | `is_active` |
| `session_logs` | `is_active` |
| `rate_limit_rules` | `is_active` |
| `webauthn_credentials` | `is_active` |
| `geo_allowed_countries` | `is_active` |
| `user_challenges` | `is_active` |
| `engagement_factors` | `is_active` |
| `engagement_question_pool` | `is_active` |
| `engagement_action_playbooks` | `is_active` |
| `nr1_risk_categories` | `is_active` |
| `scratch_card_prizes` | `is_active` |
| `lightning_quiz_questions` | `is_active` |
| `bingo_boards` | `is_active` |
| `card_definitions` | `is_active` |
| `memory_decks` | `is_active` |
| `sequence_procedures` | `is_active` |
| `wager_questions` | `is_active` |
| `lucky_wheel_prizes` | `is_active` |

## Auditoria (colunas de rastreio)

| Tabela | Colunas |
|---|---|
| `saved_filters` | `created_at`, `updated_at` |
| `profiles` | `created_at`, `updated_at` |
| `user_roles` | `created_at` |
| `departments` | `created_at`, `updated_at` |
| `custom_quests` | `created_at`, `created_by`, `updated_at` |
| `quest_steps` | `created_at` |
| `notifications` | `created_at` |
| `kudos_badges` | `created_at` |
| `kudos` | `created_at` |
| `audit_logs` | `created_at` |
| `learning_trails` | `created_at`, `created_by`, `updated_at` |
| `trail_modules` | `created_at`, `updated_at` |
| `department_missions` | `created_at`, `updated_at` |
| `user_mission_progress` | `created_at` |
| `department_rankings` | `created_at`, `updated_at` |
| `attendance_records` | `created_at` |
| `attendance_settings` | `created_at`, `updated_at` |
| `attendance_streaks` | `updated_at` |
| `shop_rewards` | `created_at`, `updated_at` |
| `shop_purchases` | `created_at` |
| `shop_promotions` | `created_at`, `updated_at` |
| `onboarding_progress` | `created_at`, `updated_at` |
| `user_combos` | `created_at`, `updated_at` |
| `achievements` | `created_at` |
| `weekly_challenges` | `created_at`, `updated_at` |
| `activity_comments` | `created_at`, `updated_at` |
| `activity_reactions` | `created_at` |
| `seasonal_events` | `created_at`, `updated_at` |
| `seasonal_challenges` | `created_at` |
| `user_seasonal_progress` | `created_at`, `updated_at` |
| `mentorship_pairs` | `created_at`, `updated_at` |
| `mentorship_missions` | `created_at` |
| `mentorship_mission_progress` | `created_at`, `updated_at` |
| `mentorship_requests` | `created_at` |
| `direct_duels` | `created_at`, `updated_at` |
| `avatar_items` | `created_at` |
| `user_avatar_config` | `updated_at` |
| `certifications` | `created_at`, `updated_at` |
| `user_certifications` | `created_at`, `updated_at` |
| `trail_prerequisites` | `created_at` |
| `quiz_scores` | `created_at` |
| `quiz_questions` | `created_at`, `created_by`, `updated_at` |
| `quiz_options` | `created_at` |
| `quiz_answers` | `created_at` |
| `ai_coach_messages` | `created_at` |
| `bitrix24_tokens` | `created_at`, `updated_at` |
| `bitrix24_sync_mappings` | `created_at`, `updated_at` |
| `bitrix24_webhook_logs` | `created_at` |
| `goals` | `created_at`, `updated_at` |
| `key_results` | `created_at`, `updated_at` |
| `goal_updates` | `created_at` |
| `leagues` | `created_at` |
| `user_leagues` | `created_at`, `updated_at` |
| `league_history` | `created_at` |
| `checkin_templates` | `created_at`, `created_by` |
| `checkins` | `created_at`, `updated_at` |
| `pulse_surveys` | `created_at`, `created_by`, `updated_at` |
| `celebrations` | `created_at` |
| `mood_entries` | `created_at` |
| `announcements` | `created_at`, `updated_at` |
| `announcement_reactions` | `created_at` |
| `feedback_cycles` | `created_at`, `created_by`, `updated_at` |
| `feedback_requests` | `created_at`, `updated_at` |
| `demographic_attributes` | `created_at`, `updated_at` |
| `user_demographic_values` | `created_at`, `updated_at` |
| `permission_groups` | `created_at`, `updated_at` |
| `user_permission_groups` | `created_at` |
| `geo_blocking_rules` | `created_at`, `created_by`, `updated_at` |
| `geo_access_logs` | `created_at` |
| `notification_preferences` | `created_at`, `updated_at` |
| `positions` | `created_at`, `updated_at` |
| `position_task_templates` | `created_at`, `created_by`, `updated_at` |
| `user_positions` | `created_at` |
| `task_scores` | `created_at`, `updated_at` |
| `task_penalties` | `created_at` |
| `penalty_rules` | `created_at`, `updated_at` |
| `external_api_keys` | `created_at`, `created_by`, `updated_at` |
| `api_request_logs` | `created_at` |
| `webhook_subscriptions` | `created_at`, `updated_at` |
| `webhook_delivery_logs` | `created_at` |
| `external_tasks` | `created_at`, `updated_at` |
| `gamification_themes` | `created_at`, `created_by`, `updated_at` |
| `custom_ranks` | `created_at`, `updated_at` |
| `custom_badges` | `created_at`, `updated_at` |
| `custom_titles` | `created_at`, `updated_at` |
| `level_configs` | `created_at` |
| `competencies` | `created_at`, `updated_at` |
| `nine_box_evaluations` | `created_at`, `updated_at` |
| `development_plans` | `created_at`, `created_by`, `updated_at` |
| `development_plan_actions` | `created_at`, `updated_at` |
| `enps_surveys` | `created_at`, `created_by`, `updated_at` |
| `enps_responses` | `created_at` |
| `engagement_snapshots` | `created_at` |
| `ip_whitelist` | `created_at`, `created_by`, `updated_at` |
| `ip_access_logs` | `created_at` |
| `climate_surveys` | `created_at`, `created_by`, `updated_at` |
| `climate_survey_questions` | `created_at` |
| `climate_survey_responses` | `created_at` |
| `climate_question_answers` | `created_at` |
| `climate_benchmarks` | `created_at`, `updated_at` |
| `opinions` | `created_at`, `updated_at` |
| `opinion_responses` | `created_at` |
| `opinion_tags` | `created_at` |
| `action_plans` | `created_at`, `updated_at` |
| `action_plan_items` | `created_at`, `updated_at` |
| `action_plan_updates` | `created_at` |
| `feedback_questions` | `created_at` |
| `feedback_evaluations` | `created_at`, `updated_at` |
| `feedback_results` | `created_at` |
| `pdi_templates` | `created_at`, `created_by`, `updated_at` |
| `pdi_mentors` | `created_at` |
| `pdi_checkins` | `created_at`, `created_by` |
| `position_competencies` | `created_at`, `updated_at` |
| `user_competency_assessments` | `created_at`, `updated_at` |
| `permissions` | `created_at`, `updated_at` |
| `roles` | `created_at` |
| `role_permissions` | `created_at` |
| `notification_templates` | `created_at`, `updated_at` |
| `password_reset_requests` | `created_at`, `updated_at` |
| `user_two_factor` | `created_at`, `updated_at` |
| `rate_limit_logs` | `created_at` |
| `blocked_ips` | `created_at`, `updated_at` |
| `session_logs` | `created_at` |
| `login_attempts` | `created_at` |
| `security_alerts` | `created_at` |
| `rate_limit_rules` | `created_at`, `updated_at` |
| `user_devices` | `created_at` |
| `new_device_alerts` | `created_at` |
| `webauthn_credentials` | `created_at` |
| `webauthn_challenges` | `created_at` |
| `geo_allowed_countries` | `created_at`, `created_by`, `updated_at` |
| `geo_settings` | `updated_at`, `updated_by` |
| `query_telemetry` | `created_at` |
| `user_challenges` | `created_at`, `updated_at` |
| `webhook_idempotency` | `created_at` |
| `runbook_executions` | `created_at` |
| `sla_targets` | `created_at`, `updated_at` |
| `postmortems` | `created_at`, `created_by`, `updated_at` |
| `postmortem_actions` | `created_at`, `updated_at` |
| `executive_monthly_reports` | `created_at` |
| `ai_course_jobs` | `created_at`, `updated_at` |
| `organizations` | `created_at`, `updated_at` |
| `org_members` | `created_at` |
| `org_theme_history` | `created_at` |
| `sales_campaigns` | `created_at`, `created_by`, `updated_at` |
| `campaign_participants` | `created_at`, `updated_at` |
| `campaign_progress_events` | `created_at` |
| `push_subscriptions` | `created_at`, `updated_at` |
| `push_notification_logs` | `created_at` |
| `engagement_factors` | `created_at`, `updated_at` |
| `engagement_question_pool` | `created_at`, `updated_at` |
| `engagement_cycles` | `created_at`, `created_by`, `updated_at` |
| `engagement_question_assignments` | `created_at` |
| `engagement_answers` | `created_at` |
| `engagement_action_playbooks` | `created_at`, `updated_at` |
| `nr1_risk_categories` | `created_at`, `updated_at` |
| `nr1_factor_mappings` | `created_at` |
| `push_sync_events` | `created_at` |
| `opinion_supports` | `created_at` |
| `campaign_result_imports` | `created_at`, `created_by`, `updated_at` |
| `campaign_result_rows` | `created_at`, `updated_at` |
| `campaign_teams` | `created_at`, `created_by`, `updated_at` |
| `campaign_team_members` | `created_at` |
| `purchase_approvals` | `created_at` |
| `campaign_team_split_batches` | `created_at` |
| `campaign_team_split_entries` | `created_at` |
| `lucky_wheel_spins` | `created_at` |
| `lucky_wheel_payout_snapshots` | `created_at`, `updated_at` |
| `lucky_wheel_settings` | `created_at`, `updated_at`, `updated_by` |
| `lucky_wheel_whatif_snapshots` | `created_at`, `created_by`, `updated_at` |
| `scratch_card_prizes` | `created_at`, `updated_at` |
| `scratch_cards` | `created_at`, `updated_at` |
| `lightning_quiz_questions` | `created_at`, `updated_at` |
| `lightning_quiz_sessions` | `created_at`, `updated_at` |
| `lightning_quiz_answers` | `created_at` |
| `bingo_boards` | `created_at`, `updated_at` |
| `bingo_board_tasks` | `created_at` |
| `bingo_cards` | `created_at`, `updated_at` |
| `tournaments` | `created_at`, `created_by`, `updated_at` |
| `tournament_participants` | `created_at`, `updated_at` |
| `tournament_matches` | `created_at`, `updated_at` |
| `department_wars` | `created_at`, `created_by`, `updated_at` |
| `department_war_metrics` | `created_at`, `updated_at` |
| `department_war_departments` | `created_at`, `updated_at` |
| `department_war_contributions` | `created_at` |
| `department_war_results` | `created_at` |
| `auctions` | `created_at`, `created_by`, `updated_at` |
| `auction_bids` | `created_at`, `updated_at` |
| `auction_admin_events` | `created_at` |
| `push_outbox` | `created_at`, `updated_at` |
| `push_outbox_health_snapshots` | `created_at` |
| `prediction_markets` | `created_at`, `created_by`, `updated_at` |
| `prediction_options` | `created_at` |
| `prediction_stakes` | `created_at` |
| `prediction_admin_events` | `created_at` |
| `card_definitions` | `created_at`, `updated_at` |
| `user_cards` | `created_at`, `updated_at` |
| `card_packs` | `created_at`, `updated_at` |
| `card_trades` | `created_at`, `updated_at` |
| `card_set_claims` | `created_at`, `updated_at` |
| `boss_battles` | `created_at`, `created_by`, `updated_at` |
| `boss_battle_damage` | `created_at` |
| `boss_battle_rewards` | `created_at` |
| `boss_win_rate_goals` | `created_at`, `updated_at`, `updated_by` |
| `memory_decks` | `created_at`, `created_by`, `updated_at` |
| `memory_pairs` | `created_at`, `updated_at` |
| `memory_sessions` | `created_at`, `updated_at` |
| `sequence_procedures` | `created_at`, `created_by`, `updated_at` |
| `sequence_steps` | `created_at`, `updated_at` |
| `sequence_attempts` | `created_at` |
| `wager_questions` | `created_at`, `created_by`, `updated_at` |
| `wager_entries` | `created_at` |
| `wager_budget_settings` | `created_at`, `updated_at`, `updated_by` |
| `wager_integrity_reviews` | `created_at`, `updated_at` |
| `wager_integrity_review_events` | `created_at` |
| `board_trails` | `created_at`, `created_by`, `updated_at` |
| `board_tiles` | `created_at`, `updated_at` |
| `board_player_states` | `created_at`, `updated_at` |
| `board_moves` | `created_at` |
| `goal_templates` | `created_at`, `created_by`, `updated_at` |
| `lucky_wheel_prizes` | `created_at`, `updated_at` |
| `demographic_values_panel` | `created_at`, `updated_at` |
| `profiles_public` | `created_at`, `updated_at` |

## Dados pessoais / sensíveis (LGPD — cuidado em logs, exports, prompts de IA)

| Tabela | Coluna |
|---|---|
| `profiles` | `email` |
| `profiles` | `cpf` |
| `profiles` | `phone` |
| `audit_logs` | `ip_address` |
| `geo_access_logs` | `ip_address` |
| `api_request_logs` | `ip_address` |
| `ip_whitelist` | `ip_address` |
| `ip_access_logs` | `ip_address` |
| `rate_limit_logs` | `ip_address` |
| `blocked_ips` | `ip_address` |
| `session_logs` | `ip_address` |
| `login_attempts` | `email` |
| `login_attempts` | `ip_address` |
| `security_alerts` | `ip_address` |
| `user_devices` | `ip_address` |
| `new_device_alerts` | `ip_address` |

## Colunas de dinheiro (tipo importa: numeric ✅ / float ❌)

| Tabela | Coluna | Tipo |
|---|---|---|
| `department_rankings` | `total_score` | `INTEGER` |
| `attendance_streaks` | `total_punctual_days` | `INTEGER` |
| `shop_rewards` | `price_coins` | `INTEGER` |
| `shop_purchases` | `total_coins` | `INTEGER` |
| `shop_promotions` | `discount_percent` | `INTEGER` |
| `shop_promotions` | `discount_coins` | `INTEGER` |
| `user_combos` | `total_bonus_xp` | `integer` |
| `mentorship_pairs` | `total_xp_earned` | `INTEGER` |
| `mentorship_pairs` | `total_missions_completed` | `INTEGER` |
| `avatar_items` | `price_coins` | `INTEGER` |
| `quiz_scores` | `total_questions` | `INTEGER` |
| `engagement_snapshots` | `total_users` | `INTEGER` |
| `organizations` | `custom_domain` | `TEXT` |
| `campaign_result_imports` | `total_rows` | `INTEGER` |
| `campaign_result_imports` | `total_amount` | `NUMERIC(16,2)` |
| `campaign_result_rows` | `amount` | `NUMERIC(14,2)` |
| `campaign_team_split_batches` | `total_xp_paid` | `INT` |
| `campaign_team_split_batches` | `total_coins_paid` | `INT` |
| `lucky_wheel_spins` | `amount` | `number` |
| `scratch_card_prizes` | `amount` | `INTEGER` |
| `scratch_cards` | `amount` | `INTEGER` |
| `department_war_contributions` | `amount` | `numeric` |
| `auctions` | `total_bids` | `INTEGER` |
| `auction_bids` | `amount` | `INTEGER` |
| `prediction_markets` | `total_pool` | `integer` |
| `prediction_stakes` | `amount` | `integer` |
| `boss_battles` | `total_hp` | `INTEGER` |
| `lucky_wheel_prizes` | `amount` | `number` |
| `webhook_delivery_stats_24h` | `total_deliveries` | `number` |
