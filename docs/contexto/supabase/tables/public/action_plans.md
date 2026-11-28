# public.action_plans

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
| 4 | `pillar` | `climate_pillar` | sim |  |  |  |
| 5 | `related_survey_id` | `uuid` | sim |  |  |  |
| 6 | `initial_score` | `numeric(5,2)` | sim |  |  |  |
| 7 | `target_score` | `numeric(5,2)` | sim |  |  |  |
| 8 | `root_causes` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 9 | `root_cause_summary` | `text` | sim |  |  |  |
| 10 | `target_date` | `date` | não |  |  |  |
| 11 | `department_id` | `uuid` | sim |  |  |  |
| 12 | `owner_id` | `uuid` | não |  |  |  |
| 13 | `reviewer_id` | `uuid` | sim |  |  |  |
| 14 | `status` | `text` | não | `'planning'::text` |  |  |
| 15 | `current_score` | `numeric(5,2)` | sim |  |  |  |
| 16 | `progress_percent` | `integer` | não | `0` |  |  |
| 17 | `xp_reward` | `integer` | não | `200` |  |  |
| 18 | `coin_reward` | `integer` | não | `100` |  |  |
| 19 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 20 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 21 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 22 | `engagement_factor_id` | `uuid` | sim |  |  |  |
| 23 | `source` | `text` | não | `'manual'::text` |  |  |
| 24 | `analysis_days` | `integer` | sim |  |  |  |
| 25 | `nr1_category_id` | `uuid` | sim |  |  |  |
| 26 | `opinion_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| action_plans_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| action_plans_engagement_factor_id_fkey | FOREIGN KEY | `FOREIGN KEY (engagement_factor_id) REFERENCES engagement_factors(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| action_plans_nr1_category_id_fkey | FOREIGN KEY | `FOREIGN KEY (nr1_category_id) REFERENCES nr1_risk_categories(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| action_plans_opinion_id_fkey | FOREIGN KEY | `FOREIGN KEY (opinion_id) REFERENCES opinions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| action_plans_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| action_plans_related_survey_id_fkey | FOREIGN KEY | `FOREIGN KEY (related_survey_id) REFERENCES climate_surveys(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| action_plans_source_check | CHECK | `CHECK (source = ANY (ARRAY['manual'::text, 'engagement_factor'::text, 'climate_survey'::text, 'nine_box'::text, 'nr1_category'::text]))` |  |  | sim |
| action_plans_status_check | CHECK | `CHECK (status = ANY (ARRAY['planning'::text, 'active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.action_plan_items | action_plan_items_plan_id_fkey | {plan_id} | CASCADE |
| public.action_plan_updates | action_plan_updates_plan_id_fkey | {plan_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| action_plans_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX action_plans_pkey ON public.action_plans USING btree (id)` |
| idx_action_plans_department_id | btree | {department_id} | não | sim |  | `CREATE INDEX idx_action_plans_department_id ON public.action_plans USING btree (department_id)` |
| idx_action_plans_factor | btree | {engagement_factor_id} | não | sim | `(engagement_factor_id IS NOT NULL)` | `CREATE INDEX idx_action_plans_factor ON public.action_plans USING btree (engagement_factor_id) WHERE (engagement_factor_id IS NOT NULL)` |
| idx_action_plans_nr1_category | btree | {nr1_category_id} | não | sim | `(nr1_category_id IS NOT NULL)` | `CREATE INDEX idx_action_plans_nr1_category ON public.action_plans USING btree (nr1_category_id) WHERE (nr1_category_id IS NOT NULL)` |
| idx_action_plans_opinion_unique | btree | {opinion_id} | sim | sim | `(opinion_id IS NOT NULL)` | `CREATE UNIQUE INDEX idx_action_plans_opinion_unique ON public.action_plans USING btree (opinion_id) WHERE (opinion_id IS NOT NULL)` |
| idx_action_plans_owner | btree | {owner_id} | não | sim |  | `CREATE INDEX idx_action_plans_owner ON public.action_plans USING btree (owner_id)` |
| idx_action_plans_related_survey_id | btree | {related_survey_id} | não | sim |  | `CREATE INDEX idx_action_plans_related_survey_id ON public.action_plans USING btree (related_survey_id)` |
| idx_action_plans_status | btree | {status} | não | sim |  | `CREATE INDEX idx_action_plans_status ON public.action_plans USING btree (status)` |


## Policies (RLS)

### `Admins delete action plans`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR (owner_id = auth.uid()))` |
| WITH CHECK |  |

### `Managers create action plans`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |

### `Owners update action plans`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((owner_id = auth.uid()) OR (reviewer_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `View action plans`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((owner_id = auth.uid()) OR (reviewer_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
