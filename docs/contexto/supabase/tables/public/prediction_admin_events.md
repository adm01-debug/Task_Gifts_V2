# public.prediction_admin_events

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
| 2 | `market_id` | `uuid` | não |  |  |  |
| 3 | `action` | `text` | não |  |  |  |
| 4 | `actor_id` | `uuid` | sim |  |  |  |
| 5 | `payload` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| prediction_admin_events_action_check | CHECK | `CHECK (action = ANY (ARRAY['created'::text, 'published'::text, 'locked'::text, 'voided'::text, 'settled'::text, 'auto_locked'::text]))` |  |  | sim |
| prediction_admin_events_actor_id_fkey | FOREIGN KEY | `FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| prediction_admin_events_market_id_fkey | FOREIGN KEY | `FOREIGN KEY (market_id) REFERENCES prediction_markets(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| prediction_admin_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_prediction_admin_events_market | btree | {market_id,created_at} | não | sim |  | `CREATE INDEX idx_prediction_admin_events_market ON public.prediction_admin_events USING btree (market_id, created_at DESC)` |
| prediction_admin_events_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX prediction_admin_events_pkey ON public.prediction_admin_events USING btree (id)` |


## Policies (RLS)

### `prediction_admin_events_admin_all`

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

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
