# public.board_tiles

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
| 3 | `position` | `integer` | não |  |  |  |
| 4 | `tile_type` | `text` | não | `'neutral'::text` |  |  |
| 5 | `label` | `text` | não | `'Casa'::text` |  |  |
| 6 | `coins` | `integer` | não | `0` |  |  |
| 7 | `xp` | `integer` | não | `0` |  |  |
| 8 | `move_by` | `integer` | não | `0` |  |  |
| 9 | `challenge_id` | `uuid` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| board_tiles_coins_check | CHECK | `CHECK (coins >= 0 AND coins <= 500)` |  |  | sim |
| board_tiles_move_by_check | CHECK | `CHECK (move_by >= '-20'::integer AND move_by <= 20)` |  |  | sim |
| board_tiles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| board_tiles_position_check | CHECK | `CHECK ("position" >= 0 AND "position" < 100)` |  |  | sim |
| board_tiles_tile_type_check | CHECK | `CHECK (tile_type = ANY (ARRAY['start'::text, 'bonus'::text, 'neutral'::text, 'reward'::text, 'penalty'::text, 'shortcut'::text, 'challenge'::text, 'checkpoint'::text, 'finish'::text]))` |  |  | sim |
| board_tiles_trail_id_fkey | FOREIGN KEY | `FOREIGN KEY (trail_id) REFERENCES board_trails(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| board_tiles_unique | UNIQUE | `UNIQUE (trail_id, "position")` |  |  | sim |
| board_tiles_xp_check | CHECK | `CHECK (xp >= 0 AND xp <= 800)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| board_tiles_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX board_tiles_pkey ON public.board_tiles USING btree (id)` |
| board_tiles_unique | btree | {trail_id,position} | sim | sim |  | `CREATE UNIQUE INDEX board_tiles_unique ON public.board_tiles USING btree (trail_id, "position")` |
| idx_board_tiles | btree | {trail_id,position} | não | sim |  | `CREATE INDEX idx_board_tiles ON public.board_tiles USING btree (trail_id, "position")` |


## Policies (RLS)

### `board_tiles_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `board_tiles_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| board_tiles_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
