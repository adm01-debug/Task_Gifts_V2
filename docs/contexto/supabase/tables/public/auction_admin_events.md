# public.auction_admin_events

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `auction_id` | `uuid` | sim |  |  |  |
| 3 | `actor_id` | `uuid` | sim |  |  |  |
| 4 | `action` | `text` | não |  |  |  |
| 5 | `details` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| auction_admin_events_action_check | CHECK | `CHECK (action = ANY (ARRAY['draft_created'::text, 'published'::text, 'settled'::text, 'cancelled'::text, 'stock_reserved'::text, 'stock_unavailable'::text]))` |  |  | sim |
| auction_admin_events_actor_id_fkey | FOREIGN KEY | `FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| auction_admin_events_auction_id_fkey | FOREIGN KEY | `FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| auction_admin_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| auction_admin_events_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX auction_admin_events_pkey ON public.auction_admin_events USING btree (id)` |
| idx_auction_admin_events_auction | btree | {auction_id,created_at} | não | sim |  | `CREATE INDEX idx_auction_admin_events_auction ON public.auction_admin_events USING btree (auction_id, created_at DESC)` |
| idx_auction_admin_events_created | btree | {created_at} | não | sim |  | `CREATE INDEX idx_auction_admin_events_created ON public.auction_admin_events USING btree (created_at DESC)` |


## Policies (RLS)

### `auction_admin_events_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |


## Triggers

_nenhum_


## Grants

_nenhum_
