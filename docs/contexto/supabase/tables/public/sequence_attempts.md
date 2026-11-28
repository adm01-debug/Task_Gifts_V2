# public.sequence_attempts

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `procedure_id` | `uuid` | não |  |  |  |
| 4 | `submitted_order` | `uuid[]` | não | `'{}'::uuid[]` |  |  |
| 5 | `steps_total` | `integer` | não | `0` |  |  |
| 6 | `correct_positions` | `integer` | não | `0` |  |  |
| 7 | `is_perfect` | `boolean` | não | `false` |  |  |
| 8 | `duration_ms` | `integer` | não | `0` |  |  |
| 9 | `coins_awarded` | `integer` | não | `0` |  |  |
| 10 | `xp_awarded` | `integer` | não | `0` |  |  |
| 11 | `attempt_date` | `date` | não | `((now() AT TIME ZONE 'utc'::text))::date` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sequence_attempts_once_per_day | UNIQUE | `UNIQUE (user_id, procedure_id, attempt_date)` |  |  | sim |
| sequence_attempts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sequence_attempts_procedure_id_fkey | FOREIGN KEY | `FOREIGN KEY (procedure_id) REFERENCES sequence_procedures(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sequence_attempts_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sequence_attempts_leaderboard | btree | {procedure_id,attempt_date} | não | sim |  | `CREATE INDEX idx_sequence_attempts_leaderboard ON public.sequence_attempts USING btree (procedure_id, attempt_date)` |
| idx_sequence_attempts_proc_user_date | btree | {procedure_id,user_id,attempt_date} | não | sim |  | `CREATE INDEX idx_sequence_attempts_proc_user_date ON public.sequence_attempts USING btree (procedure_id, user_id, attempt_date)` |
| idx_sequence_attempts_user | btree | {user_id,attempt_date} | não | sim |  | `CREATE INDEX idx_sequence_attempts_user ON public.sequence_attempts USING btree (user_id, attempt_date DESC)` |
| idx_sequence_attempts_user_day | btree | {user_id,procedure_id,attempt_date} | não | sim |  | `CREATE INDEX idx_sequence_attempts_user_day ON public.sequence_attempts USING btree (user_id, procedure_id, attempt_date)` |
| sequence_attempts_once_per_day | btree | {user_id,procedure_id,attempt_date} | sim | sim |  | `CREATE UNIQUE INDEX sequence_attempts_once_per_day ON public.sequence_attempts USING btree (user_id, procedure_id, attempt_date)` |
| sequence_attempts_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX sequence_attempts_pkey ON public.sequence_attempts USING btree (id)` |


## Policies (RLS)

### `sequence_attempts_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `sequence_attempts_user_own`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK | `(user_id = auth.uid())` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
