# public.board_player_states

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
| 2 | `trail_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `position` | `integer` | não | `0` |  |  |
| 5 | `coins` | `integer` | não | `0` |  |  |
| 6 | `xp` | `integer` | não | `0` |  |  |
| 7 | `checkpoints` | `integer[]` | não | `'{}'::integer[]` |  |  |
| 8 | `moves_count` | `integer` | não | `0` |  |  |
| 9 | `blocked_challenge_id` | `uuid` | sim |  |  |  |
| 10 | `challenge_attempts` | `integer` | não | `0` |  |  |
| 11 | `blocked_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `finished_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| board_player_states_challenge_attempts_check | CHECK | `CHECK (challenge_attempts >= 0)` |  |  | sim |
| board_player_states_coins_check | CHECK | `CHECK (coins >= 0)` |  |  | sim |
| board_player_states_moves_count_check | CHECK | `CHECK (moves_count >= 0)` |  |  | sim |
| board_player_states_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| board_player_states_position_check | CHECK | `CHECK ("position" >= 0)` |  |  | sim |
| board_player_states_trail_id_fkey | FOREIGN KEY | `FOREIGN KEY (trail_id) REFERENCES board_trails(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| board_player_states_unique | UNIQUE | `UNIQUE (trail_id, user_id)` |  |  | sim |
| board_player_states_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| board_player_states_xp_check | CHECK | `CHECK (xp >= 0)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| board_player_states_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX board_player_states_pkey ON public.board_player_states USING btree (id)` |
| board_player_states_unique | btree | {trail_id,user_id} | sim | sim |  | `CREATE UNIQUE INDEX board_player_states_unique ON public.board_player_states USING btree (trail_id, user_id)` |
| idx_board_player_states | btree | {trail_id,position} | não | sim |  | `CREATE INDEX idx_board_player_states ON public.board_player_states USING btree (trail_id, "position" DESC)` |
| idx_board_player_states_blocked | btree | {blocked_at} | não | sim | `(blocked_challenge_id IS NOT NULL)` | `CREATE INDEX idx_board_player_states_blocked ON public.board_player_states USING btree (blocked_at) WHERE (blocked_challenge_id IS NOT NULL)` |
| idx_board_player_states_trail_rank | btree | {trail_id,position,xp,coins} | não | sim |  | `CREATE INDEX idx_board_player_states_trail_rank ON public.board_player_states USING btree (trail_id, "position" DESC, xp DESC, coins DESC)` |
| idx_board_player_states_user | btree | {user_id} | não | sim |  | `CREATE INDEX idx_board_player_states_user ON public.board_player_states USING btree (user_id)` |


## Policies (RLS)

### `board_player_states_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `board_player_states_manager_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'manager'::app_role)` |
| WITH CHECK |  |

### `board_player_states_user_own`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK | `(user_id = auth.uid())` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| board_player_states_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_sync_board_blocked_at | BEFORE | INSERT OR UPDATE | ROW | enabled | public.sync_board_blocked_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
