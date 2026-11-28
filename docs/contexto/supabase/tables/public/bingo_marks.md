# public.bingo_marks

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
| 2 | `card_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `position` | `integer` | não |  |  |  |
| 5 | `metric_key` | `text` | não |  |  |  |
| 6 | `observed_value` | `integer` | não | `0` |  |  |
| 7 | `marked_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bingo_marks_card_id_fkey | FOREIGN KEY | `FOREIGN KEY (card_id) REFERENCES bingo_cards(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| bingo_marks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| bingo_marks_position_check | CHECK | `CHECK ("position" >= 0 AND "position" <= 24)` |  |  | sim |
| bingo_marks_unique_cell | UNIQUE | `UNIQUE (card_id, "position")` |  |  | sim |
| bingo_marks_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bingo_marks_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX bingo_marks_pkey ON public.bingo_marks USING btree (id)` |
| bingo_marks_unique_cell | btree | {card_id,position} | sim | sim |  | `CREATE UNIQUE INDEX bingo_marks_unique_cell ON public.bingo_marks USING btree (card_id, "position")` |
| idx_bingo_marks_card | btree | {card_id} | não | sim |  | `CREATE INDEX idx_bingo_marks_card ON public.bingo_marks USING btree (card_id)` |


## Policies (RLS)

### `bingo_marks_admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `bingo_marks_user_own`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK | `(user_id = auth.uid())` |


## Triggers

_nenhum_


## Grants

_nenhum_
