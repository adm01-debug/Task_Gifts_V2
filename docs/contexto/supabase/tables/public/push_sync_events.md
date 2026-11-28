# public.push_sync_events

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `subscription_id` | `uuid` | sim |  |  |  |
| 4 | `endpoint` | `text` | sim |  |  |  |
| 5 | `device_label` | `text` | sim |  |  |  |
| 6 | `event` | `text` | não |  |  |  |
| 7 | `detail` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| push_sync_events_event_check | CHECK | `CHECK (event = ANY (ARRAY['subscribed'::text, 'refreshed'::text, 'disabled'::text, 'revoked'::text, 'renamed'::text, 'failed'::text]))` |  |  | sim |
| push_sync_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| push_sync_events_subscription_id_fkey | FOREIGN KEY | `FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| push_sync_events_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_push_sync_events_user | btree | {user_id,created_at} | não | sim |  | `CREATE INDEX idx_push_sync_events_user ON public.push_sync_events USING btree (user_id, created_at DESC)` |
| push_sync_events_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX push_sync_events_pkey ON public.push_sync_events USING btree (id)` |


## Policies (RLS)

### `push_sync_events_admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `push_sync_events_authenticated_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(user_id = auth.uid())` |

### `push_sync_events_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_trim_push_sync_events | AFTER | INSERT | ROW | enabled | public.trim_push_sync_events |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
