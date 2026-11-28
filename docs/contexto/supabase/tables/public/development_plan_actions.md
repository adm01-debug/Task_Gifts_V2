# public.development_plan_actions

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `plan_id` | `uuid` | não |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `action_type` | `text` | não | `'learning'::text` |  |  |
| 6 | `competency_id` | `uuid` | sim |  |  |  |
| 7 | `priority` | `text` | não | `'medium'::text` |  |  |
| 8 | `status` | `text` | não | `'pending'::text` |  |  |
| 9 | `due_date` | `date` | sim |  |  |  |
| 10 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `progress_percent` | `integer` | não | `0` |  |  |
| 12 | `evidence_url` | `text` | sim |  |  |  |
| 13 | `notes` | `text` | sim |  |  |  |
| 14 | `xp_reward` | `integer` | não | `50` |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| development_plan_actions_action_type_check | CHECK | `CHECK (action_type = ANY (ARRAY['learning'::text, 'project'::text, 'mentoring'::text, 'certification'::text, 'training'::text, 'experience'::text, 'other'::text]))` |  |  | sim |
| development_plan_actions_competency_id_fkey | FOREIGN KEY | `FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| development_plan_actions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| development_plan_actions_plan_id_fkey | FOREIGN KEY | `FOREIGN KEY (plan_id) REFERENCES development_plans(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| development_plan_actions_priority_check | CHECK | `CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))` |  |  | sim |
| development_plan_actions_progress_percent_check | CHECK | `CHECK (progress_percent >= 0 AND progress_percent <= 100)` |  |  | sim |
| development_plan_actions_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| development_plan_actions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX development_plan_actions_pkey ON public.development_plan_actions USING btree (id)` |
| idx_development_plan_actions_competency_id | btree | {competency_id} | não | sim |  | `CREATE INDEX idx_development_plan_actions_competency_id ON public.development_plan_actions USING btree (competency_id)` |
| idx_plan_actions_plan | btree | {plan_id} | não | sim |  | `CREATE INDEX idx_plan_actions_plan ON public.development_plan_actions USING btree (plan_id)` |
| idx_plan_actions_status | btree | {status} | não | sim |  | `CREATE INDEX idx_plan_actions_status ON public.development_plan_actions USING btree (status)` |


## Policies (RLS)

### `Admins can view all plan actions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Users can create plan actions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM development_plans dp   WHERE ((dp.id = development_plan_actions.plan_id) AND ((dp.user_id = auth.uid()) OR (dp.created_by = auth.uid())))))` |

### `Users can delete plan actions`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((EXISTS ( SELECT 1    FROM development_plans dp   WHERE ((dp.id = development_plan_actions.plan_id) AND ((dp.user_id = auth.uid()) OR (dp.created_by = auth.uid()))))) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Users can update plan actions`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((EXISTS ( SELECT 1    FROM development_plans dp   WHERE ((dp.id = development_plan_actions.plan_id) AND ((dp.user_id = auth.uid()) OR (dp.created_by = auth.uid()))))) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Users can view their plan actions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM development_plans dp   WHERE ((dp.id = development_plan_actions.plan_id) AND ((dp.user_id = auth.uid()) OR (dp.created_by = auth.uid())))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
