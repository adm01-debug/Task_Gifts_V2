# public.card_set_claims

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `set_code` | `text` | não |  |  |  |
| 4 | `milestone` | `smallint` | não |  |  |  |
| 5 | `coins_awarded` | `integer` | não | `0` |  |  |
| 6 | `xp_awarded` | `integer` | não | `0` |  |  |
| 7 | `cards_owned` | `integer` | não | `0` |  |  |
| 8 | `cards_total` | `integer` | não | `0` |  |  |
| 9 | `dedupe_key` | `text` | não |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| card_set_claims_cards_owned_check | CHECK | `CHECK (cards_owned >= 0)` |  |  | sim |
| card_set_claims_cards_total_check | CHECK | `CHECK (cards_total >= 0)` |  |  | sim |
| card_set_claims_coins_awarded_check | CHECK | `CHECK (coins_awarded >= 0)` |  |  | sim |
| card_set_claims_dedupe_unique | UNIQUE | `UNIQUE (dedupe_key)` |  |  | sim |
| card_set_claims_milestone_check | CHECK | `CHECK (milestone = ANY (ARRAY[25, 50, 75, 100]))` |  |  | sim |
| card_set_claims_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| card_set_claims_unique | UNIQUE | `UNIQUE (user_id, set_code, milestone)` |  |  | sim |
| card_set_claims_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| card_set_claims_xp_awarded_check | CHECK | `CHECK (xp_awarded >= 0)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| card_set_claims_dedupe_unique | btree | {dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX card_set_claims_dedupe_unique ON public.card_set_claims USING btree (dedupe_key)` |
| card_set_claims_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX card_set_claims_pkey ON public.card_set_claims USING btree (id)` |
| card_set_claims_unique | btree | {user_id,set_code,milestone} | sim | sim |  | `CREATE UNIQUE INDEX card_set_claims_unique ON public.card_set_claims USING btree (user_id, set_code, milestone)` |
| idx_card_set_claims_user | btree | {user_id,set_code} | não | sim |  | `CREATE INDEX idx_card_set_claims_user ON public.card_set_claims USING btree (user_id, set_code)` |


## Policies (RLS)

### `card_set_claims_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `card_set_claims_user_own`

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
| card_set_claims_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
