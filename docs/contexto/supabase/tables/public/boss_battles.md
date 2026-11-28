# public.boss_battles

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
| 2 | `title` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `department_id` | `uuid` | sim |  |  |  |
| 5 | `status` | `text` | não | `'draft'::text` |  |  |
| 6 | `total_hp` | `integer` | não |  |  |  |
| 7 | `current_hp` | `integer` | não |  |  |  |
| 8 | `starts_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `ends_at` | `timestamp with time zone` | não |  |  |  |
| 10 | `damage_rules` | `jsonb` | não | `'{"base": {"quiz": 8, "manual": 0, "attendance": 5, "task_score": 10, "trail_completion": 25}, "perUserCap": 0, "maxMultiplier": 3}'::jsonb` |  |  |
| 11 | `per_user_cap` | `integer` | não | `0` |  |  |
| 12 | `coins_pool` | `integer` | não | `0` |  |  |
| 13 | `xp_pool` | `integer` | não | `0` |  |  |
| 14 | `min_share` | `numeric` | não | `0` |  |  |
| 15 | `per_user_coins_cap` | `integer` | não | `0` |  |  |
| 16 | `defeated_at` | `timestamp with time zone` | sim |  |  |  |
| 17 | `settled_at` | `timestamp with time zone` | sim |  |  |  |
| 18 | `created_by` | `uuid` | sim | `auth.uid()` |  |  |
| 19 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 20 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| boss_battles_coins_pool_check | CHECK | `CHECK (coins_pool >= 0)` |  |  | sim |
| boss_battles_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| boss_battles_current_hp_check | CHECK | `CHECK (current_hp >= 0)` |  |  | sim |
| boss_battles_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| boss_battles_min_share_check | CHECK | `CHECK (min_share >= 0::numeric AND min_share <= 1::numeric)` |  |  | sim |
| boss_battles_per_user_cap_check | CHECK | `CHECK (per_user_cap >= 0)` |  |  | sim |
| boss_battles_per_user_coins_cap_check | CHECK | `CHECK (per_user_coins_cap >= 0)` |  |  | sim |
| boss_battles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| boss_battles_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'running'::text, 'defeated'::text, 'expired'::text, 'settled'::text]))` |  |  | sim |
| boss_battles_total_hp_check | CHECK | `CHECK (total_hp >= 1)` |  |  | sim |
| boss_battles_xp_pool_check | CHECK | `CHECK (xp_pool >= 0)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.boss_battle_damage | boss_battle_damage_battle_id_fkey | {battle_id} | CASCADE |
| public.boss_battle_rewards | boss_battle_rewards_battle_id_fkey | {battle_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| boss_battles_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX boss_battles_pkey ON public.boss_battles USING btree (id)` |
| idx_boss_battles_department | btree | {department_id,status} | não | sim |  | `CREATE INDEX idx_boss_battles_department ON public.boss_battles USING btree (department_id, status)` |
| idx_boss_battles_status | btree | {status,ends_at} | não | sim |  | `CREATE INDEX idx_boss_battles_status ON public.boss_battles USING btree (status, ends_at DESC)` |


## Policies (RLS)

### `boss_battles_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `boss_battles_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| boss_battles_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_boss_phase_alert | AFTER | UPDATE | ROW | enabled | public.boss_phase_alert_hook |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
