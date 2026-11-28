# public.action_plan_updates

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `plan_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `update_type` | `text` | não | `'progress'::text` |  |  |
| 5 | `old_value` | `text` | sim |  |  |  |
| 6 | `new_value` | `text` | sim |  |  |  |
| 7 | `comment` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| action_plan_updates_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| action_plan_updates_plan_id_fkey | FOREIGN KEY | `FOREIGN KEY (plan_id) REFERENCES action_plans(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| action_plan_updates_update_type_check | CHECK | `CHECK (update_type = ANY (ARRAY['progress'::text, 'score_update'::text, 'status_change'::text, 'comment'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| action_plan_updates_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX action_plan_updates_pkey ON public.action_plan_updates USING btree (id)` |
| idx_action_plan_updates_plan_id | btree | {plan_id} | não | sim |  | `CREATE INDEX idx_action_plan_updates_plan_id ON public.action_plan_updates USING btree (plan_id)` |


## Policies (RLS)

### `Create action plan updates`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `View action plan updates`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM action_plans ap   WHERE ((ap.id = action_plan_updates.plan_id) AND ((ap.owner_id = auth.uid()) OR (ap.reviewer_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
