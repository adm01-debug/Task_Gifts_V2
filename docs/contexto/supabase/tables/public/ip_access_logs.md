# public.ip_access_logs

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
| 4 | `endpoint` | `text` | sim |  |  |  |
| 5 | `was_allowed` | `boolean` | não |  |  |  |
| 6 | `reason` | `text` | sim |  |  |  |
| 7 | `user_agent` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ip_access_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| ip_access_logs_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_ip_access_logs_user_id | btree | {user_id} | não | sim |  | `CREATE INDEX idx_ip_access_logs_user_id ON public.ip_access_logs USING btree (user_id)` |
| ip_access_logs_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX ip_access_logs_pkey ON public.ip_access_logs USING btree (id)` |


## Policies (RLS)

### `Admins can view IP access logs`

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

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
