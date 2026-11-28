# public.boss_battle_rewards

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
| 4 | `damage` | `integer` | não | `0` |  |  |
| 5 | `share` | `numeric` | não | `0` |  |  |
| 6 | `coins` | `integer` | não | `0` |  |  |
| 7 | `xp` | `integer` | não | `0` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| boss_battle_rewards_battle_id_fkey | FOREIGN KEY | `FOREIGN KEY (battle_id) REFERENCES boss_battles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| boss_battle_rewards_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| boss_battle_rewards_unique | UNIQUE | `UNIQUE (battle_id, user_id)` |  |  | sim |
| boss_battle_rewards_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| boss_battle_rewards_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX boss_battle_rewards_pkey ON public.boss_battle_rewards USING btree (id)` |
| boss_battle_rewards_unique | btree | {battle_id,user_id} | sim | sim |  | `CREATE UNIQUE INDEX boss_battle_rewards_unique ON public.boss_battle_rewards USING btree (battle_id, user_id)` |
| idx_boss_battle_rewards | btree | {battle_id} | não | sim |  | `CREATE INDEX idx_boss_battle_rewards ON public.boss_battle_rewards USING btree (battle_id)` |


## Policies (RLS)

### `boss_battle_rewards_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `boss_battle_rewards_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
