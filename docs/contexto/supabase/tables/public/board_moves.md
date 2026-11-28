# public.board_moves

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
| 2 | `trail_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `move_index` | `integer` | não |  |  |  |
| 5 | `dedupe_key` | `text` | não |  |  |  |
| 6 | `roll` | `integer` | não |  |  |  |
| 7 | `from_position` | `integer` | não |  |  |  |
| 8 | `landed_position` | `integer` | não |  |  |  |
| 9 | `final_position` | `integer` | não |  |  |  |
| 10 | `tile_type` | `text` | sim |  |  |  |
| 11 | `coins_delta` | `integer` | não | `0` |  |  |
| 12 | `xp_delta` | `integer` | não | `0` |  |  |
| 13 | `challenge_correct` | `boolean` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| board_moves_dedupe | UNIQUE | `UNIQUE (dedupe_key)` |  |  | sim |
| board_moves_move_index_check | CHECK | `CHECK (move_index >= 0)` |  |  | sim |
| board_moves_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| board_moves_roll_check | CHECK | `CHECK (roll >= 0 AND roll <= 20)` |  |  | sim |
| board_moves_trail_id_fkey | FOREIGN KEY | `FOREIGN KEY (trail_id) REFERENCES board_trails(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| board_moves_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| board_moves_dedupe | btree | {dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX board_moves_dedupe ON public.board_moves USING btree (dedupe_key)` |
| board_moves_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX board_moves_pkey ON public.board_moves USING btree (id)` |
| idx_board_moves_trail_challenge | btree | {trail_id,tile_type,created_at} | não | sim | `(tile_type = 'challenge'::text)` | `CREATE INDEX idx_board_moves_trail_challenge ON public.board_moves USING btree (trail_id, tile_type, created_at DESC) WHERE (tile_type = 'challenge'::text)` |
| idx_board_moves_trail_user | btree | {trail_id,user_id,created_at} | não | sim |  | `CREATE INDEX idx_board_moves_trail_user ON public.board_moves USING btree (trail_id, user_id, created_at DESC)` |


## Policies (RLS)

### `board_moves_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `board_moves_user_select`

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
