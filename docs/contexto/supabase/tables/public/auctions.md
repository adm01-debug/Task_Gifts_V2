# public.auctions

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
| 2 | `reward_id` | `uuid` | sim |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `image_url` | `text` | sim |  |  |  |
| 6 | `starting_bid` | `integer` | não | `1` |  |  |
| 7 | `min_increment` | `integer` | não | `1` |  |  |
| 8 | `starts_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `ends_at` | `timestamp with time zone` | não |  |  |  |
| 10 | `status` | `text` | não | `'draft'::text` |  |  |
| 11 | `winner_id` | `uuid` | sim |  |  |  |
| 12 | `winning_bid` | `integer` | sim |  |  |  |
| 13 | `total_bids` | `integer` | não | `0` |  |  |
| 14 | `closed_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `created_by` | `uuid` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| auctions_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| auctions_ends_after_starts | CHECK | `CHECK (ends_at > starts_at)` |  |  | sim |
| auctions_min_increment_check | CHECK | `CHECK (min_increment >= 1)` |  |  | sim |
| auctions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| auctions_reward_id_fkey | FOREIGN KEY | `FOREIGN KEY (reward_id) REFERENCES shop_rewards(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| auctions_starting_bid_check | CHECK | `CHECK (starting_bid >= 1)` |  |  | sim |
| auctions_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'closed'::text, 'cancelled'::text]))` |  |  | sim |
| auctions_winner_id_fkey | FOREIGN KEY | `FOREIGN KEY (winner_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.auction_admin_events | auction_admin_events_auction_id_fkey | {auction_id} | SET NULL |
| public.auction_bids | auction_bids_auction_id_fkey | {auction_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| auctions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX auctions_pkey ON public.auctions USING btree (id)` |
| idx_auctions_reward | btree | {reward_id} | não | sim |  | `CREATE INDEX idx_auctions_reward ON public.auctions USING btree (reward_id)` |
| idx_auctions_status_ends | btree | {status,ends_at} | não | sim |  | `CREATE INDEX idx_auctions_status_ends ON public.auctions USING btree (status, ends_at DESC)` |


## Policies (RLS)

### `auctions_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `auctions_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| auctions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_auctions_validate_window | BEFORE | INSERT OR UPDATE | ROW | enabled | public.validate_auction_window |


## Grants

_nenhum_
