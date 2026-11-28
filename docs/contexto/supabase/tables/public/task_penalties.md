# public.task_penalties

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `task_score_id` | `uuid` | sim |  |  |  |
| 4 | `penalty_type` | `text` | não |  |  |  |
| 5 | `xp_deducted` | `integer` | não | `0` |  |  |
| 6 | `coins_deducted` | `integer` | não | `0` |  |  |
| 7 | `reason` | `text` | sim |  |  |  |
| 8 | `applied_by` | `uuid` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| task_penalties_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| task_penalties_task_score_id_fkey | FOREIGN KEY | `FOREIGN KEY (task_score_id) REFERENCES task_scores(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_task_penalties_task_score_id | btree | {task_score_id} | não | sim |  | `CREATE INDEX idx_task_penalties_task_score_id ON public.task_penalties USING btree (task_score_id)` |
| task_penalties_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX task_penalties_pkey ON public.task_penalties USING btree (id)` |


## Policies (RLS)

### `Admins can manage penalties`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Managers can view all penalties`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Users can view own penalties`

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
