# public.auction_bids

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
| 2 | `auction_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `amount` | `integer` | não |  |  |  |
| 5 | `escrow_coins` | `integer` | não | `0` |  |  |
| 6 | `status` | `text` | não | `'active'::text` |  |  |
| 7 | `dedupe_key` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| auction_bids_amount_check | CHECK | `CHECK (amount >= 1)` |  |  | sim |
| auction_bids_auction_id_fkey | FOREIGN KEY | `FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| auction_bids_auction_id_user_id_key | UNIQUE | `UNIQUE (auction_id, user_id)` |  |  | sim |
| auction_bids_dedupe_key_key | UNIQUE | `UNIQUE (dedupe_key)` |  |  | sim |
| auction_bids_escrow_coins_check | CHECK | `CHECK (escrow_coins >= 0)` |  |  | sim |
| auction_bids_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| auction_bids_status_check | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'refunded'::text, 'won'::text]))` |  |  | sim |
| auction_bids_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| auction_bids_auction_id_user_id_key | btree | {auction_id,user_id} | sim | sim |  | `CREATE UNIQUE INDEX auction_bids_auction_id_user_id_key ON public.auction_bids USING btree (auction_id, user_id)` |
| auction_bids_dedupe_key_key | btree | {dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX auction_bids_dedupe_key_key ON public.auction_bids USING btree (dedupe_key)` |
| auction_bids_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX auction_bids_pkey ON public.auction_bids USING btree (id)` |
| idx_auction_bids_auction | btree | {auction_id,created_at} | não | sim |  | `CREATE INDEX idx_auction_bids_auction ON public.auction_bids USING btree (auction_id, created_at DESC)` |
| idx_auction_bids_auction_amount | btree | {auction_id,amount,created_at} | não | sim |  | `CREATE INDEX idx_auction_bids_auction_amount ON public.auction_bids USING btree (auction_id, amount DESC, created_at)` |
| idx_auction_bids_dedupe | btree | {auction_id,user_id,dedupe_key} | sim | sim | `(dedupe_key IS NOT NULL)` | `CREATE UNIQUE INDEX idx_auction_bids_dedupe ON public.auction_bids USING btree (auction_id, user_id, dedupe_key) WHERE (dedupe_key IS NOT NULL)` |


## Policies (RLS)

### `auction_bids_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `auction_bids_user_own`

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
| auction_bids_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
