# public.boss_battle_damage

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
| 2 | `battle_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `department_id` | `uuid` | sim |  |  |  |
| 5 | `source` | `text` | não |  |  |  |
| 6 | `source_id` | `uuid` | sim |  |  |  |
| 7 | `damage` | `integer` | não |  |  |  |
| 8 | `wasted` | `integer` | não | `0` |  |  |
| 9 | `dedupe_key` | `text` | não |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| boss_battle_damage_battle_id_dedupe_key_key | UNIQUE | `UNIQUE (battle_id, dedupe_key)` |  |  | sim |
| boss_battle_damage_battle_id_fkey | FOREIGN KEY | `FOREIGN KEY (battle_id) REFERENCES boss_battles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| boss_battle_damage_damage_check | CHECK | `CHECK (damage >= 0)` |  |  | sim |
| boss_battle_damage_dedupe | UNIQUE | `UNIQUE (dedupe_key)` |  |  | sim |
| boss_battle_damage_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| boss_battle_damage_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| boss_battle_damage_source_check | CHECK | `CHECK (source = ANY (ARRAY['quiz'::text, 'attendance'::text, 'task_score'::text, 'trail_completion'::text, 'manual'::text]))` |  |  | sim |
| boss_battle_damage_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| boss_battle_damage_wasted_check | CHECK | `CHECK (wasted >= 0)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| boss_battle_damage_battle_id_dedupe_key_key | btree | {battle_id,dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX boss_battle_damage_battle_id_dedupe_key_key ON public.boss_battle_damage USING btree (battle_id, dedupe_key)` |
| boss_battle_damage_dedupe | btree | {dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX boss_battle_damage_dedupe ON public.boss_battle_damage USING btree (dedupe_key)` |
| boss_battle_damage_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX boss_battle_damage_pkey ON public.boss_battle_damage USING btree (id)` |
| idx_boss_battle_damage_user | btree | {user_id,battle_id} | não | sim |  | `CREATE INDEX idx_boss_battle_damage_user ON public.boss_battle_damage USING btree (user_id, battle_id)` |
| idx_boss_damage_battle_created | btree | {battle_id,created_at} | não | sim |  | `CREATE INDEX idx_boss_damage_battle_created ON public.boss_battle_damage USING btree (battle_id, created_at DESC)` |
| idx_boss_damage_battle_user | btree | {battle_id,user_id} | não | sim |  | `CREATE INDEX idx_boss_damage_battle_user ON public.boss_battle_damage USING btree (battle_id, user_id)` |


## Policies (RLS)

### `boss_battle_damage_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `boss_battle_damage_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
