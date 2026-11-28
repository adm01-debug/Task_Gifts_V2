# public.card_trades

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `proposer_id` | `uuid` | não |  |  |  |
| 3 | `responder_id` | `uuid` | não |  |  |  |
| 4 | `offered_card_id` | `uuid` | não |  |  |  |
| 5 | `requested_card_id` | `uuid` | não |  |  |  |
| 6 | `status` | `text` | não | `'pending'::text` |  |  |
| 7 | `message` | `text` | sim |  |  |  |
| 8 | `expires_at` | `timestamp with time zone` | não | `(now() + '7 days'::interval)` |  |  |
| 9 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| card_trades_distinct_cards | CHECK | `CHECK (offered_card_id <> requested_card_id)` |  |  | sim |
| card_trades_distinct_users | CHECK | `CHECK (proposer_id <> responder_id)` |  |  | sim |
| card_trades_offered_card_id_fkey | FOREIGN KEY | `FOREIGN KEY (offered_card_id) REFERENCES card_definitions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| card_trades_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| card_trades_proposer_id_fkey | FOREIGN KEY | `FOREIGN KEY (proposer_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| card_trades_requested_card_id_fkey | FOREIGN KEY | `FOREIGN KEY (requested_card_id) REFERENCES card_definitions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| card_trades_responder_id_fkey | FOREIGN KEY | `FOREIGN KEY (responder_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| card_trades_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'cancelled'::text, 'expired'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| card_trades_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX card_trades_pkey ON public.card_trades USING btree (id)` |
| idx_card_trades_proposer | btree | {proposer_id,status,created_at} | não | sim |  | `CREATE INDEX idx_card_trades_proposer ON public.card_trades USING btree (proposer_id, status, created_at DESC)` |
| idx_card_trades_responder | btree | {responder_id,status,created_at} | não | sim |  | `CREATE INDEX idx_card_trades_responder ON public.card_trades USING btree (responder_id, status, created_at DESC)` |


## Policies (RLS)

### `card_trades_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `card_trades_participants_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((proposer_id = auth.uid()) OR (responder_id = auth.uid()))` |
| WITH CHECK |  |

### `card_trades_participants_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((proposer_id = auth.uid()) OR (responder_id = auth.uid()))` |
| WITH CHECK |  |

### `card_trades_proposer_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(proposer_id = auth.uid())` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| card_trades_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
