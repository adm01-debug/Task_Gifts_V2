# public.external_api_keys

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `api_key` | `text` | não |  |  |  |
| 5 | `api_secret` | `text` | sim |  |  |  |
| 6 | `system_type` | `text` | não | `'generic'::text` |  |  |
| 7 | `permissions` | `jsonb` | não | `'["read"]'::jsonb` |  |  |
| 8 | `is_active` | `boolean` | não | `true` |  |  |
| 9 | `rate_limit_per_minute` | `integer` | não | `60` |  |  |
| 10 | `last_used_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_by` | `uuid` | não |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `secret_salt` | `text` | sim |  |  |  |
| 15 | `secret_hash` | `text` | sim |  |  |  |
| 16 | `secret_last_rotated_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| external_api_keys_api_key_key | UNIQUE | `UNIQUE (api_key)` |  |  | sim |
| external_api_keys_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.api_request_logs | api_request_logs_api_key_id_fkey | {api_key_id} | SET NULL |
| public.external_tasks | external_tasks_api_key_id_fkey | {api_key_id} | SET NULL |
| public.webhook_subscriptions | webhook_subscriptions_api_key_id_fkey | {api_key_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| external_api_keys_api_key_key | btree | {api_key} | sim | sim |  | `CREATE UNIQUE INDEX external_api_keys_api_key_key ON public.external_api_keys USING btree (api_key)` |
| external_api_keys_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX external_api_keys_pkey ON public.external_api_keys USING btree (id)` |


## Policies (RLS)

### `Admins can manage API keys`

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
| update_external_api_keys_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
