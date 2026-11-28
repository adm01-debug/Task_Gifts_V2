# public.goal_updates

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
| 2 | `goal_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `key_result_id` | `uuid` | sim |  |  |  |
| 5 | `previous_value` | `numeric` | sim |  |  |  |
| 6 | `new_value` | `numeric` | não |  |  |  |
| 7 | `note` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| goal_updates_goal_id_fkey | FOREIGN KEY | `FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| goal_updates_key_result_id_fkey | FOREIGN KEY | `FOREIGN KEY (key_result_id) REFERENCES key_results(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| goal_updates_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| goal_updates_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX goal_updates_pkey ON public.goal_updates USING btree (id)` |
| idx_goal_updates_goal_id | btree | {goal_id} | não | sim |  | `CREATE INDEX idx_goal_updates_goal_id ON public.goal_updates USING btree (goal_id)` |
| idx_goal_updates_key_result_id | btree | {key_result_id} | não | sim |  | `CREATE INDEX idx_goal_updates_key_result_id ON public.goal_updates USING btree (key_result_id)` |


## Policies (RLS)

### `Goal owners and admins can view goal updates`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(EXISTS ( SELECT 1    FROM goals g   WHERE ((g.id = goal_updates.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |
| WITH CHECK |  |

### `Goal owners can insert updates`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM goals g   WHERE ((g.id = goal_updates.goal_id) AND ((g.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |


## Triggers

_nenhum_


## Grants

_nenhum_
