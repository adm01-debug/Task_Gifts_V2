# public.wager_entries

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
| 2 | `question_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `stake_coins` | `integer` | não |  |  |  |
| 5 | `chosen_option` | `text` | não |  |  |  |
| 6 | `is_correct` | `boolean` | não |  |  |  |
| 7 | `multiplier` | `numeric` | não |  |  |  |
| 8 | `coins_delta` | `integer` | não |  |  |  |
| 9 | `xp_awarded` | `integer` | não | `0` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| wager_entries_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| wager_entries_question_id_fkey | FOREIGN KEY | `FOREIGN KEY (question_id) REFERENCES wager_questions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| wager_entries_question_id_user_id_key | UNIQUE | `UNIQUE (question_id, user_id)` |  |  | sim |
| wager_entries_stake_coins_check | CHECK | `CHECK (stake_coins >= 1)` |  |  | sim |
| wager_entries_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_wager_entries_question | btree | {question_id} | não | sim |  | `CREATE INDEX idx_wager_entries_question ON public.wager_entries USING btree (question_id)` |
| idx_wager_entries_user_created | btree | {user_id,created_at} | não | sim |  | `CREATE INDEX idx_wager_entries_user_created ON public.wager_entries USING btree (user_id, created_at)` |
| idx_wager_entries_user_date | btree | {user_id,created_at} | não | sim |  | `CREATE INDEX idx_wager_entries_user_date ON public.wager_entries USING btree (user_id, created_at DESC)` |
| wager_entries_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX wager_entries_pkey ON public.wager_entries USING btree (id)` |
| wager_entries_question_id_user_id_key | btree | {question_id,user_id} | sim | sim |  | `CREATE UNIQUE INDEX wager_entries_question_id_user_id_key ON public.wager_entries USING btree (question_id, user_id)` |


## Policies (RLS)

### `wager_entries_admin_manage`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `wager_entries_admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `wager_entries_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
