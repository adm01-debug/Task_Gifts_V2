# public.bingo_board_tasks

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
| 3 | `label` | `text` | não |  |  |  |
| 4 | `metric_key` | `text` | não |  |  |  |
| 5 | `target_value` | `integer` | não | `1` |  |  |
| 6 | `order_index` | `integer` | não | `0` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bingo_board_tasks_board_id_fkey | FOREIGN KEY | `FOREIGN KEY (board_id) REFERENCES bingo_boards(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| bingo_board_tasks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| bingo_board_tasks_target_value_check | CHECK | `CHECK (target_value >= 1 AND target_value <= 1000)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bingo_board_tasks_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX bingo_board_tasks_pkey ON public.bingo_board_tasks USING btree (id)` |
| idx_bingo_board_tasks | btree | {board_id,order_index} | não | sim |  | `CREATE INDEX idx_bingo_board_tasks ON public.bingo_board_tasks USING btree (board_id, order_index)` |


## Policies (RLS)

### `bingo_board_tasks_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `bingo_board_tasks_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
