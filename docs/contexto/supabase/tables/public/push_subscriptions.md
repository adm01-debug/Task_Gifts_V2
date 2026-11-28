# public.push_subscriptions

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `endpoint` | `text` | não |  |  |  |
| 4 | `p256dh` | `text` | não |  |  |  |
| 5 | `auth` | `text` | não |  |  |  |
| 6 | `user_agent` | `text` | sim |  |  |  |
| 7 | `device_label` | `text` | sim |  |  |  |
| 8 | `last_used_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `failure_count` | `integer` | não | `0` |  |  |
| 10 | `disabled_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `disabled_reason` | `text` | sim |  |  |  |
| 14 | `device_fingerprint` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| push_subscriptions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| push_subscriptions_user_id_endpoint_key | UNIQUE | `UNIQUE (user_id, endpoint)` |  |  | sim |
| push_subscriptions_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.push_notification_logs | push_notification_logs_subscription_id_fkey | {subscription_id} | SET NULL |
| public.push_sync_events | push_sync_events_subscription_id_fkey | {subscription_id} | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_push_subscriptions_user_fingerprint | btree | {user_id,device_fingerprint} | não | sim | `(device_fingerprint IS NOT NULL)` | `CREATE INDEX idx_push_subscriptions_user_fingerprint ON public.push_subscriptions USING btree (user_id, device_fingerprint) WHERE (device_fingerprint IS NOT NULL)` |
| push_subscriptions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX push_subscriptions_pkey ON public.push_subscriptions USING btree (id)` |
| push_subscriptions_user_id_endpoint_key | btree | {user_id,endpoint} | sim | sim |  | `CREATE UNIQUE INDEX push_subscriptions_user_id_endpoint_key ON public.push_subscriptions USING btree (user_id, endpoint)` |
| push_subscriptions_user_idx | btree | {user_id} | não | sim | `(disabled_at IS NULL)` | `CREATE INDEX push_subscriptions_user_idx ON public.push_subscriptions USING btree (user_id) WHERE (disabled_at IS NULL)` |
| push_subscriptions_user_last_used_idx | btree | {user_id,last_used_at} | não | sim |  | `CREATE INDEX push_subscriptions_user_last_used_idx ON public.push_subscriptions USING btree (user_id, last_used_at DESC NULLS LAST)` |


## Policies (RLS)

### `Users manage own push subs`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK | `(auth.uid() = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_push_subs_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
