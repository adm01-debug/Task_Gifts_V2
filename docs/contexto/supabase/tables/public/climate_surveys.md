# public.climate_surveys

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `title` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `survey_type` | `text` | não | `'weekly'::text` |  |  |
| 5 | `status` | `text` | não | `'draft'::text` |  |  |
| 6 | `created_by` | `uuid` | não |  |  |  |
| 7 | `department_id` | `uuid` | sim |  |  |  |
| 8 | `starts_at` | `timestamp with time zone` | não |  |  |  |
| 9 | `ends_at` | `timestamp with time zone` | não |  |  |  |
| 10 | `is_anonymous` | `boolean` | não | `true` |  |  |
| 11 | `allow_skip` | `boolean` | não | `true` |  |  |
| 12 | `send_reminders` | `boolean` | não | `true` |  |  |
| 13 | `reminder_frequency` | `text` | sim | `'daily'::text` |  |  |
| 14 | `is_recurring` | `boolean` | não | `false` |  |  |
| 15 | `recurrence_pattern` | `text` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| climate_surveys_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| climate_surveys_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| climate_surveys_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'active'::text, 'completed'::text, 'cancelled'::text]))` |  |  | sim |
| climate_surveys_survey_type_check | CHECK | `CHECK (survey_type = ANY (ARRAY['weekly'::text, 'monthly'::text, 'quarterly'::text, 'annual'::text, 'custom'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.action_plans | action_plans_related_survey_id_fkey | {related_survey_id} | SET NULL |
| public.climate_pillar_scores | climate_pillar_scores_survey_id_fkey | {survey_id} | CASCADE |
| public.climate_survey_questions | climate_survey_questions_survey_id_fkey | {survey_id} | CASCADE |
| public.climate_survey_responses | climate_survey_responses_survey_id_fkey | {survey_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| climate_surveys_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX climate_surveys_pkey ON public.climate_surveys USING btree (id)` |
| idx_climate_surveys_dates | btree | {starts_at,ends_at} | não | sim |  | `CREATE INDEX idx_climate_surveys_dates ON public.climate_surveys USING btree (starts_at, ends_at)` |
| idx_climate_surveys_department_id | btree | {department_id} | não | sim |  | `CREATE INDEX idx_climate_surveys_department_id ON public.climate_surveys USING btree (department_id)` |
| idx_climate_surveys_status | btree | {status} | não | sim |  | `CREATE INDEX idx_climate_surveys_status ON public.climate_surveys USING btree (status)` |


## Policies (RLS)

### `Admins can delete surveys`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Creators can update surveys`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Everyone can view active surveys`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((status = ANY (ARRAY['active'::text, 'completed'::text])) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Managers can create climate surveys`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
