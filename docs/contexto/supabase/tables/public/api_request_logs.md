# public.api_request_logs

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
| 2 | `api_key_id` | `uuid` | sim |  |  |  |
| 3 | `endpoint` | `text` | não |  |  |  |
| 4 | `method` | `text` | não |  |  |  |
| 5 | `request_body` | `jsonb` | sim |  |  |  |
| 6 | `response_status` | `integer` | não |  |  |  |
| 7 | `response_body` | `jsonb` | sim |  |  |  |
| 8 | `ip_address` | `text` | sim |  |  |  |
| 9 | `user_agent` | `text` | sim |  |  |  |
| 10 | `duration_ms` | `integer` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| api_request_logs_api_key_id_fkey | FOREIGN KEY | `FOREIGN KEY (api_key_id) REFERENCES external_api_keys(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| api_request_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| api_request_logs_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX api_request_logs_pkey ON public.api_request_logs USING btree (id)` |
| idx_api_request_logs_api_key_id | btree | {api_key_id} | não | sim |  | `CREATE INDEX idx_api_request_logs_api_key_id ON public.api_request_logs USING btree (api_key_id)` |


## Policies (RLS)

### `Admins can view API logs`

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
