# public.push_notification_logs

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
| 3 | `subscription_id` | `uuid` | sim |  |  |  |
| 4 | `endpoint` | `text` | sim |  |  |  |
| 5 | `device_label` | `text` | sim |  |  |  |
| 6 | `campaign_id` | `uuid` | sim |  |  |  |
| 7 | `type` | `text` | não |  |  |  |
| 8 | `title` | `text` | não |  |  |  |
| 9 | `message` | `text` | não |  |  |  |
| 10 | `url` | `text` | sim |  |  |  |
| 11 | `status` | `text` | não |  |  |  |
| 12 | `status_code` | `integer` | sim |  |  |  |
| 13 | `error` | `text` | sim |  |  |  |
| 14 | `data` | `jsonb` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `attempts` | `smallint` | não | `1` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| push_notification_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| push_notification_logs_status_check | CHECK | `CHECK (status = ANY (ARRAY['sent'::text, 'failed'::text, 'invalidated'::text, 'skipped'::text]))` |  |  | sim |
| push_notification_logs_subscription_id_fkey | FOREIGN KEY | `FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_push_logs_campaign | btree | {campaign_id} | não | sim |  | `CREATE INDEX idx_push_logs_campaign ON public.push_notification_logs USING btree (campaign_id)` |
| idx_push_logs_subscription | btree | {subscription_id} | não | sim |  | `CREATE INDEX idx_push_logs_subscription ON public.push_notification_logs USING btree (subscription_id)` |
| idx_push_logs_user_created | btree | {user_id,created_at} | não | sim |  | `CREATE INDEX idx_push_logs_user_created ON public.push_notification_logs USING btree (user_id, created_at DESC)` |
| push_notification_logs_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX push_notification_logs_pkey ON public.push_notification_logs USING btree (id)` |


## Policies (RLS)

### `Users read own push logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
