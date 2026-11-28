# public.bingo_cards

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
| 2 | `board_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `cells` | `jsonb` | não |  |  |  |
| 5 | `lines_awarded` | `integer` | não | `0` |  |  |
| 6 | `full_house_awarded` | `boolean` | não | `false` |  |  |
| 7 | `coins_awarded` | `integer` | não | `0` |  |  |
| 8 | `xp_awarded` | `integer` | não | `0` |  |  |
| 9 | `last_synced_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bingo_cards_board_id_fkey | FOREIGN KEY | `FOREIGN KEY (board_id) REFERENCES bingo_boards(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| bingo_cards_lines_awarded_check | CHECK | `CHECK (lines_awarded >= 0 AND lines_awarded <= 12)` |  |  | sim |
| bingo_cards_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| bingo_cards_unique | UNIQUE | `UNIQUE (board_id, user_id)` |  |  | sim |
| bingo_cards_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.bingo_marks | bingo_marks_card_id_fkey | {card_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bingo_cards_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX bingo_cards_pkey ON public.bingo_cards USING btree (id)` |
| bingo_cards_unique | btree | {board_id,user_id} | sim | sim |  | `CREATE UNIQUE INDEX bingo_cards_unique ON public.bingo_cards USING btree (board_id, user_id)` |
| idx_bingo_cards_user | btree | {user_id,created_at} | não | sim |  | `CREATE INDEX idx_bingo_cards_user ON public.bingo_cards USING btree (user_id, created_at DESC)` |


## Policies (RLS)

### `bingo_cards_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `bingo_cards_user_own`

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
| bingo_cards_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
