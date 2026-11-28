# public.departments

> Departamentos da organizacao — suporte a hierarquia, metas de XP e rankings por departamento.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.leaderboard_cache |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `color` | `text` | sim | `'#6366f1'::text` |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| departments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.action_plans | action_plans_department_id_fkey | {department_id} | SET NULL |
| public.announcements | announcements_department_id_fkey | {department_id} | SET NULL |
| public.attendance_settings | attendance_settings_department_id_fkey | {department_id} | CASCADE |
| public.board_trails | board_trails_department_id_fkey | {department_id} | SET NULL |
| public.boss_battle_damage | boss_battle_damage_department_id_fkey | {department_id} | SET NULL |
| public.boss_battles | boss_battles_department_id_fkey | {department_id} | SET NULL |
| public.boss_win_rate_goals | boss_win_rate_goals_department_id_fkey | {department_id} | CASCADE |
| public.campaign_teams | campaign_teams_department_id_fkey | {department_id} | SET NULL |
| public.certifications | certifications_department_id_fkey | {department_id} | SET NULL |
| public.climate_pillar_scores | climate_pillar_scores_department_id_fkey | {department_id} | SET NULL |
| public.climate_surveys | climate_surveys_department_id_fkey | {department_id} | SET NULL |
| public.competencies | competencies_department_id_fkey | {department_id} | SET NULL |
| public.custom_quests | custom_quests_department_id_fkey | {department_id} | SET NULL |
| public.department_missions | department_missions_department_id_fkey | {department_id} | CASCADE |
| public.department_rankings | department_rankings_department_id_fkey | {department_id} | CASCADE |
| public.department_war_contributions | department_war_contributions_department_id_fkey | {department_id} | CASCADE |
| public.department_war_departments | department_war_departments_department_id_fkey | {department_id} | CASCADE |
| public.department_war_results | department_war_results_department_id_fkey | {department_id} | CASCADE |
| public.engagement_answers | engagement_answers_department_id_fkey | {department_id} | SET NULL |
| public.engagement_cycles | engagement_cycles_department_id_fkey | {department_id} | SET NULL |
| public.engagement_snapshots | engagement_snapshots_department_id_fkey | {department_id} | SET NULL |
| public.enps_surveys | enps_surveys_department_id_fkey | {department_id} | SET NULL |
| public.feedback_cycles | feedback_cycles_department_id_fkey | {department_id} | SET NULL |
| public.gamification_themes | gamification_themes_department_id_fkey | {department_id} | CASCADE |
| public.goals | goals_department_id_fkey | {department_id} | SET NULL |
| public.leagues | leagues_department_id_fkey | {department_id} | SET NULL |
| public.learning_trails | learning_trails_department_id_fkey | {department_id} | SET NULL |
| public.memory_decks | memory_decks_department_id_fkey | {department_id} | SET NULL |
| public.positions | positions_department_id_fkey | {department_id} | SET NULL |
| public.pulse_surveys | pulse_surveys_department_id_fkey | {department_id} | SET NULL |
| public.quiz_questions | quiz_questions_department_id_fkey | {department_id} | SET NULL |
| public.sales_campaigns | sales_campaigns_department_id_fkey | {department_id} | SET NULL |
| public.sequence_procedures | sequence_procedures_department_id_fkey | {department_id} | SET NULL |
| public.team_members | team_members_department_id_fkey | {department_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| departments_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX departments_pkey ON public.departments USING btree (id)` |
| idx_departments_fts | gin | {} | não | sim |  | `CREATE INDEX idx_departments_fts ON public.departments USING gin (to_tsvector('portuguese'::regconfig, ((COALESCE(name, ''::text) \|\| ' '::text) \|\| COALESCE(description, ''::text))))` |
| idx_departments_name_btree | btree | {name} | não | sim |  | `CREATE INDEX idx_departments_name_btree ON public.departments USING btree (name)` |
| idx_departments_name_trgm | gin | {name} | não | sim |  | `CREATE INDEX idx_departments_name_trgm ON public.departments USING gin (name gin_trgm_ops)` |


## Policies (RLS)

### `Admins can manage departments`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view departments`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_departments_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
