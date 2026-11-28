# public.attendance_streaks

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
| 3 | `current_streak` | `integer` | não | `0` |  |  |
| 4 | `best_streak` | `integer` | não | `0` |  |  |
| 5 | `last_punctual_date` | `date` | sim |  |  |  |
| 6 | `total_punctual_days` | `integer` | não | `0` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| attendance_streaks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| attendance_streaks_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| attendance_streaks_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| attendance_streaks_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX attendance_streaks_pkey ON public.attendance_streaks USING btree (id)` |
| attendance_streaks_user_id_key | btree | {user_id} | sim | sim |  | `CREATE UNIQUE INDEX attendance_streaks_user_id_key ON public.attendance_streaks USING btree (user_id)` |


## Policies (RLS)

### `Managers can view all streaks`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Users can manage own streaks`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view own streaks`

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
| trg_boss_damage_attendance_streaks | AFTER | INSERT OR UPDATE | ROW | enabled | public.boss_hook_attendance_streaks |
| trg_card_pack_attendance_streaks | AFTER | INSERT OR UPDATE | ROW | enabled | public.card_pack_hook_attendance_streaks |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
