# public.webhook_delivery_logs

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
| usada por views | public.webhook_delivery_stats_24h |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `subscription_id` | `uuid` | sim |  |  |  |
| 3 | `event_type` | `text` | não |  |  |  |
| 4 | `payload` | `jsonb` | não |  |  |  |
| 5 | `response_status` | `integer` | sim |  |  |  |
| 6 | `response_body` | `text` | sim |  |  |  |
| 7 | `attempt_count` | `integer` | não | `1` |  |  |
| 8 | `success` | `boolean` | não | `false` |  |  |
| 9 | `error_message` | `text` | sim |  |  |  |
| 10 | `duration_ms` | `integer` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| webhook_delivery_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| webhook_delivery_logs_subscription_id_fkey | FOREIGN KEY | `FOREIGN KEY (subscription_id) REFERENCES webhook_subscriptions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_webhook_delivery_logs_subscription_created | btree | {subscription_id,created_at} | não | sim |  | `CREATE INDEX idx_webhook_delivery_logs_subscription_created ON public.webhook_delivery_logs USING btree (subscription_id, created_at DESC)` |
| webhook_delivery_logs_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX webhook_delivery_logs_pkey ON public.webhook_delivery_logs USING btree (id)` |


## Policies (RLS)

### `Admins can view webhook logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
