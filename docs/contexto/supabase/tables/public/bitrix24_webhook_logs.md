# public.bitrix24_webhook_logs

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
| 2 | `event_type` | `text` | não |  |  |  |
| 3 | `payload` | `jsonb` | não |  |  |  |
| 4 | `processed` | `boolean` | não | `false` |  |  |
| 5 | `error_message` | `text` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bitrix24_webhook_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bitrix24_webhook_logs_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX bitrix24_webhook_logs_pkey ON public.bitrix24_webhook_logs USING btree (id)` |
| idx_bitrix24_webhook_logs_processed_created | btree | {processed,created_at} | não | sim | `(processed = true)` | `CREATE INDEX idx_bitrix24_webhook_logs_processed_created ON public.bitrix24_webhook_logs USING btree (processed, created_at) WHERE (processed = true)` |


## Policies (RLS)

### `Admins can view webhook logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))))` |
| WITH CHECK |  |

### `Authenticated insert webhook logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(auth.uid() IS NOT NULL)` |


## Triggers

_nenhum_


## Grants

_nenhum_
