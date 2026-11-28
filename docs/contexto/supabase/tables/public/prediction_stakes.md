# public.prediction_stakes

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
| 2 | `market_id` | `uuid` | não |  |  |  |
| 3 | `option_id` | `uuid` | não |  |  |  |
| 4 | `user_id` | `uuid` | não |  |  |  |
| 5 | `amount` | `integer` | não |  |  |  |
| 6 | `payout` | `integer` | sim |  |  |  |
| 7 | `dedupe_key` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| prediction_stakes_amount_check | CHECK | `CHECK (amount >= 1)` |  |  | sim |
| prediction_stakes_dedupe_key_key | UNIQUE | `UNIQUE (dedupe_key)` |  |  | sim |
| prediction_stakes_market_id_fkey | FOREIGN KEY | `FOREIGN KEY (market_id) REFERENCES prediction_markets(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| prediction_stakes_one_option_per_user | UNIQUE | `UNIQUE (market_id, user_id)` |  |  | sim |
| prediction_stakes_option_id_fkey | FOREIGN KEY | `FOREIGN KEY (option_id) REFERENCES prediction_options(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| prediction_stakes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| prediction_stakes_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_prediction_stakes_dedupe | btree | {market_id,user_id,dedupe_key} | sim | sim | `(dedupe_key IS NOT NULL)` | `CREATE UNIQUE INDEX idx_prediction_stakes_dedupe ON public.prediction_stakes USING btree (market_id, user_id, dedupe_key) WHERE (dedupe_key IS NOT NULL)` |
| idx_prediction_stakes_market | btree | {market_id,option_id} | não | sim |  | `CREATE INDEX idx_prediction_stakes_market ON public.prediction_stakes USING btree (market_id, option_id)` |
| idx_prediction_stakes_market_created | btree | {market_id,created_at} | não | sim |  | `CREATE INDEX idx_prediction_stakes_market_created ON public.prediction_stakes USING btree (market_id, created_at)` |
| idx_prediction_stakes_user | btree | {user_id,created_at} | não | sim |  | `CREATE INDEX idx_prediction_stakes_user ON public.prediction_stakes USING btree (user_id, created_at DESC)` |
| prediction_stakes_dedupe_key_key | btree | {dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX prediction_stakes_dedupe_key_key ON public.prediction_stakes USING btree (dedupe_key)` |
| prediction_stakes_one_option_per_user | btree | {market_id,user_id} | sim | sim |  | `CREATE UNIQUE INDEX prediction_stakes_one_option_per_user ON public.prediction_stakes USING btree (market_id, user_id)` |
| prediction_stakes_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX prediction_stakes_pkey ON public.prediction_stakes USING btree (id)` |


## Policies (RLS)

### `prediction_stakes_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `prediction_stakes_user_own`

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
