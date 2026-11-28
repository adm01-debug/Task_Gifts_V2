# public.nine_box_evaluations

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
| 3 | `evaluator_id` | `uuid` | não |  |  |  |
| 4 | `evaluation_period` | `text` | não |  |  |  |
| 5 | `performance_score` | `integer` | não |  |  |  |
| 6 | `potential_score` | `integer` | não |  |  |  |
| 7 | `box_position` | `integer` | sim |  |  |  |
| 8 | `performance_notes` | `text` | sim |  |  |  |
| 9 | `potential_notes` | `text` | sim |  |  |  |
| 10 | `goals_for_next_period` | `text[]` | sim |  |  |  |
| 11 | `strengths` | `text[]` | sim |  |  |  |
| 12 | `development_areas` | `text[]` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| nine_box_evaluations_evaluator_id_fkey | FOREIGN KEY | `FOREIGN KEY (evaluator_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| nine_box_evaluations_performance_score_check | CHECK | `CHECK (performance_score >= 1 AND performance_score <= 3)` |  |  | sim |
| nine_box_evaluations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| nine_box_evaluations_potential_score_check | CHECK | `CHECK (potential_score >= 1 AND potential_score <= 3)` |  |  | sim |
| nine_box_evaluations_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.development_plans | development_plans_linked_nine_box_id_fkey | {linked_nine_box_id} | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_nine_box_evaluator | btree | {evaluator_id} | não | sim |  | `CREATE INDEX idx_nine_box_evaluator ON public.nine_box_evaluations USING btree (evaluator_id)` |
| idx_nine_box_period | btree | {evaluation_period} | não | sim |  | `CREATE INDEX idx_nine_box_period ON public.nine_box_evaluations USING btree (evaluation_period)` |
| idx_nine_box_user | btree | {user_id} | não | sim |  | `CREATE INDEX idx_nine_box_user ON public.nine_box_evaluations USING btree (user_id)` |
| nine_box_evaluations_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX nine_box_evaluations_pkey ON public.nine_box_evaluations USING btree (id)` |


## Policies (RLS)

### `Admins and managers can create evaluations`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(has_role(auth.uid(), 'admin'::app_role) OR (EXISTS ( SELECT 1    FROM (team_members tm1      JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))   WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = nine_box_evaluations.user_id)))))` |

### `Admins and managers can update evaluations`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR (evaluator_id = auth.uid()))` |
| WITH CHECK |  |

### `Admins can view all evaluations`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Managers can view their team evaluations`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM (team_members tm1      JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))   WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = nine_box_evaluations.user_id))))` |
| WITH CHECK |  |

### `Users can view their own evaluations`

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

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
