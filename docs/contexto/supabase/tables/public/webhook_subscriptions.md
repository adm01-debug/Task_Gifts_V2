# public.webhook_subscriptions

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
| 2 | `api_key_id` | `uuid` | sim |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `url` | `text` | não |  |  |  |
| 5 | `secret` | `text` | não |  |  |  |
| 6 | `events` | `text[]` | não | `'{}'::text[]` |  |  |
| 7 | `is_active` | `boolean` | não | `true` |  |  |
| 8 | `retry_count` | `integer` | não | `3` |  |  |
| 9 | `timeout_seconds` | `integer` | não | `30` |  |  |
| 10 | `headers` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `last_triggered_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `last_status` | `integer` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `secret_next` | `text` | sim |  |  |  |
| 16 | `secret_next_expires_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| webhook_subscriptions_api_key_id_fkey | FOREIGN KEY | `FOREIGN KEY (api_key_id) REFERENCES external_api_keys(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| webhook_subscriptions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.webhook_delivery_logs | webhook_delivery_logs_subscription_id_fkey | {subscription_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_webhook_subs_active | btree | {is_active} | não | sim | `(is_active = true)` | `CREATE INDEX idx_webhook_subs_active ON public.webhook_subscriptions USING btree (is_active) WHERE (is_active = true)` |
| idx_webhook_subscriptions_api_key_id | btree | {api_key_id} | não | sim |  | `CREATE INDEX idx_webhook_subscriptions_api_key_id ON public.webhook_subscriptions USING btree (api_key_id)` |
| webhook_subscriptions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX webhook_subscriptions_pkey ON public.webhook_subscriptions USING btree (id)` |


## Policies (RLS)

### `Admins can manage webhooks`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_webhook_subscriptions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
