# public.rate_limit_logs

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
| 2 | `ip_address` | `inet` | não |  |  |  |
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `endpoint` | `text` | não |  |  |  |
| 5 | `method` | `text` | não | `'GET'::text` |  |  |
| 6 | `request_count` | `integer` | não | `1` |  |  |
| 7 | `window_start` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `window_end` | `timestamp with time zone` | não | `(now() + '00:01:00'::interval)` |  |  |
| 9 | `was_blocked` | `boolean` | não | `false` |  |  |
| 10 | `user_agent` | `text` | sim |  |  |  |
| 11 | `country_code` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rate_limit_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rate_limit_logs_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_rate_limit_logs_blocked | btree | {was_blocked} | não | sim | `(was_blocked = true)` | `CREATE INDEX idx_rate_limit_logs_blocked ON public.rate_limit_logs USING btree (was_blocked) WHERE (was_blocked = true)` |
| idx_rate_limit_logs_created | btree | {created_at} | não | sim |  | `CREATE INDEX idx_rate_limit_logs_created ON public.rate_limit_logs USING btree (created_at DESC)` |
| idx_rate_limit_logs_endpoint | btree | {endpoint} | não | sim |  | `CREATE INDEX idx_rate_limit_logs_endpoint ON public.rate_limit_logs USING btree (endpoint)` |
| idx_rate_limit_logs_ip | btree | {ip_address} | não | sim |  | `CREATE INDEX idx_rate_limit_logs_ip ON public.rate_limit_logs USING btree (ip_address)` |
| idx_rate_limit_logs_user_id | btree | {user_id} | não | sim |  | `CREATE INDEX idx_rate_limit_logs_user_id ON public.rate_limit_logs USING btree (user_id)` |
| rate_limit_logs_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX rate_limit_logs_pkey ON public.rate_limit_logs USING btree (id)` |


## Policies (RLS)

### `Admins can view rate limit logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
