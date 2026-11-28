# public.bingo_boards

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
| 4 | `starts_at` | `timestamp with time zone` | não | `now()` |  |  |
| 5 | `ends_at` | `timestamp with time zone` | não |  |  |  |
| 6 | `is_active` | `boolean` | não | `true` |  |  |
| 7 | `coins_per_line` | `integer` | não | `30` |  |  |
| 8 | `xp_per_line` | `integer` | não | `40` |  |  |
| 9 | `coins_full_house` | `integer` | não | `200` |  |  |
| 10 | `xp_full_house` | `integer` | não | `300` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bingo_boards_coins_full_house_check | CHECK | `CHECK (coins_full_house >= 0 AND coins_full_house <= 5000)` |  |  | sim |
| bingo_boards_coins_per_line_check | CHECK | `CHECK (coins_per_line >= 0 AND coins_per_line <= 500)` |  |  | sim |
| bingo_boards_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| bingo_boards_window_chk | CHECK | `CHECK (ends_at > starts_at)` |  |  | sim |
| bingo_boards_xp_full_house_check | CHECK | `CHECK (xp_full_house >= 0 AND xp_full_house <= 10000)` |  |  | sim |
| bingo_boards_xp_per_line_check | CHECK | `CHECK (xp_per_line >= 0 AND xp_per_line <= 1000)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.bingo_board_tasks | bingo_board_tasks_board_id_fkey | {board_id} | CASCADE |
| public.bingo_cards | bingo_cards_board_id_fkey | {board_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bingo_boards_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX bingo_boards_pkey ON public.bingo_boards USING btree (id)` |


## Policies (RLS)

### `bingo_boards_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `bingo_boards_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(is_active OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| bingo_boards_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
