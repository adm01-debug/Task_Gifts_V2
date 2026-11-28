# public.user_mission_progress

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
| 3 | `mission_id` | `uuid` | não |  |  |  |
| 4 | `current_value` | `integer` | sim | `0` |  |  |
| 5 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 6 | `period_start` | `date` | não |  |  |  |
| 7 | `period_end` | `date` | não |  |  |  |
| 8 | `claimed` | `boolean` | sim | `false` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_mission_progress_mission_id_fkey | FOREIGN KEY | `FOREIGN KEY (mission_id) REFERENCES department_missions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_mission_progress_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_mission_progress_user_id_mission_id_period_start_key | UNIQUE | `UNIQUE (user_id, mission_id, period_start)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_mission_progress_mission_id | btree | {mission_id} | não | sim |  | `CREATE INDEX idx_user_mission_progress_mission_id ON public.user_mission_progress USING btree (mission_id)` |
| user_mission_progress_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX user_mission_progress_pkey ON public.user_mission_progress USING btree (id)` |
| user_mission_progress_user_id_mission_id_period_start_key | btree | {user_id,mission_id,period_start} | sim | sim |  | `CREATE UNIQUE INDEX user_mission_progress_user_id_mission_id_period_start_key ON public.user_mission_progress USING btree (user_id, mission_id, period_start)` |


## Policies (RLS)

### `Users can insert own progress`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(user_id = auth.uid())` |

### `Users can update own progress`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK |  |

### `Users can view own progress`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
