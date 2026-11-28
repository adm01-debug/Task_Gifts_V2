# public.attendance_records

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
| 3 | `check_in` | `timestamp with time zone` | não | `now()` |  |  |
| 4 | `check_out` | `timestamp with time zone` | sim |  |  |  |
| 5 | `is_punctual` | `boolean` | não | `false` |  |  |
| 6 | `late_minutes` | `integer` | sim | `0` |  |  |
| 7 | `notes` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| attendance_records_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| attendance_records_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| attendance_records_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX attendance_records_pkey ON public.attendance_records USING btree (id)` |
| idx_attendance_user_checkin | btree | {user_id,check_in} | não | sim |  | `CREATE INDEX idx_attendance_user_checkin ON public.attendance_records USING btree (user_id, check_in DESC)` |


## Policies (RLS)

### `Managers can view team attendance`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Users can insert own attendance`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can view own attendance`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_war_hook_attendance | AFTER | INSERT OR UPDATE | ROW | enabled | public.war_hook_attendance |


## Grants

_nenhum_
