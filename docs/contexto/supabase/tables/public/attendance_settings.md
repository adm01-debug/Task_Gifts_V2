# public.attendance_settings

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
| 2 | `department_id` | `uuid` | sim |  |  |  |
| 3 | `work_start_time` | `time without time zone` | não | `'08:00:00'::time without time zone` |  |  |
| 4 | `work_end_time` | `time without time zone` | não | `'18:00:00'::time without time zone` |  |  |
| 5 | `tolerance_minutes` | `integer` | não | `10` |  |  |
| 6 | `xp_punctual_checkin` | `integer` | não | `15` |  |  |
| 7 | `xp_streak_bonus` | `integer` | não | `50` |  |  |
| 8 | `streak_milestone` | `integer` | não | `5` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| attendance_settings_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| attendance_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| attendance_settings_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX attendance_settings_pkey ON public.attendance_settings USING btree (id)` |
| idx_attendance_settings_department_id | btree | {department_id} | não | sim |  | `CREATE INDEX idx_attendance_settings_department_id ON public.attendance_settings USING btree (department_id)` |


## Policies (RLS)

### `Admins can manage settings`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view settings`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
