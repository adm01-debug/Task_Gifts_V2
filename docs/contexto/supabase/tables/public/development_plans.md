# public.development_plans

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `created_by` | `uuid` | não |  |  |  |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `status` | `text` | não | `'active'::text` |  |  |
| 7 | `start_date` | `date` | não | `CURRENT_DATE` |  |  |
| 8 | `target_date` | `date` | sim |  |  |  |
| 9 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `linked_feedback_id` | `uuid` | sim |  |  |  |
| 11 | `linked_nine_box_id` | `uuid` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| development_plans_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| development_plans_linked_feedback_id_fkey | FOREIGN KEY | `FOREIGN KEY (linked_feedback_id) REFERENCES feedback_responses(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| development_plans_linked_nine_box_id_fkey | FOREIGN KEY | `FOREIGN KEY (linked_nine_box_id) REFERENCES nine_box_evaluations(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| development_plans_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| development_plans_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'cancelled'::text]))` |  |  | sim |
| development_plans_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.development_plan_actions | development_plan_actions_plan_id_fkey | {plan_id} | CASCADE |
| public.pdi_checkins | pdi_checkins_plan_id_fkey | {plan_id} | CASCADE |
| public.pdi_mentors | pdi_mentors_plan_id_fkey | {plan_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| development_plans_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX development_plans_pkey ON public.development_plans USING btree (id)` |
| idx_development_plans_created_by | btree | {created_by} | não | sim |  | `CREATE INDEX idx_development_plans_created_by ON public.development_plans USING btree (created_by)` |
| idx_development_plans_linked_feedback_id | btree | {linked_feedback_id} | não | sim |  | `CREATE INDEX idx_development_plans_linked_feedback_id ON public.development_plans USING btree (linked_feedback_id)` |
| idx_development_plans_linked_nine_box_id | btree | {linked_nine_box_id} | não | sim |  | `CREATE INDEX idx_development_plans_linked_nine_box_id ON public.development_plans USING btree (linked_nine_box_id)` |
| idx_development_plans_status | btree | {status} | não | sim |  | `CREATE INDEX idx_development_plans_status ON public.development_plans USING btree (status)` |
| idx_development_plans_user | btree | {user_id} | não | sim |  | `CREATE INDEX idx_development_plans_user ON public.development_plans USING btree (user_id)` |


## Policies (RLS)

### `Admins can view all development plans`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Managers can view team development plans`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM (team_members tm1      JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))   WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = development_plans.user_id))))` |
| WITH CHECK |  |

### `Users and managers can update development plans`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((auth.uid() = user_id) OR (auth.uid() = created_by) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Users can create their own development plans`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `((auth.uid() = user_id) OR (auth.uid() = created_by))` |

### `Users can view their own development plans`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
