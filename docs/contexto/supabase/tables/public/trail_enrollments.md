# public.trail_enrollments

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
| 3 | `trail_id` | `uuid` | não |  |  |  |
| 4 | `started_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 5 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 6 | `progress_percent` | `integer` | sim | `0` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| trail_enrollments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| trail_enrollments_trail_id_fkey | FOREIGN KEY | `FOREIGN KEY (trail_id) REFERENCES learning_trails(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| trail_enrollments_user_id_trail_id_key | UNIQUE | `UNIQUE (user_id, trail_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_trail_enrollments_trail_id | btree | {trail_id} | não | sim |  | `CREATE INDEX idx_trail_enrollments_trail_id ON public.trail_enrollments USING btree (trail_id)` |
| trail_enrollments_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX trail_enrollments_pkey ON public.trail_enrollments USING btree (id)` |
| trail_enrollments_user_id_trail_id_key | btree | {user_id,trail_id} | sim | sim |  | `CREATE UNIQUE INDEX trail_enrollments_user_id_trail_id_key ON public.trail_enrollments USING btree (user_id, trail_id)` |


## Policies (RLS)

### `Users can enroll themselves`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(user_id = auth.uid())` |

### `Users can update own enrollments`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK |  |

### `Users can view own enrollments`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_boss_damage_trail_enrollments | AFTER | INSERT OR UPDATE | ROW | enabled | public.boss_hook_trail_enrollments |
| trg_card_pack_trail_enrollments | AFTER | INSERT OR UPDATE | ROW | enabled | public.card_pack_hook_trail_enrollments |
| trg_war_hook_trail_enrollments | AFTER | INSERT OR UPDATE | ROW | enabled | public.war_hook_trail_enrollments |


## Grants

_nenhum_
