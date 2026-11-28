# public.session_logs

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `session_id` | `text` | sim |  |  |  |
| 4 | `ip_address` | `inet` | sim |  |  |  |
| 5 | `user_agent` | `text` | sim |  |  |  |
| 6 | `device_type` | `text` | sim |  |  |  |
| 7 | `browser` | `text` | sim |  |  |  |
| 8 | `os` | `text` | sim |  |  |  |
| 9 | `country` | `text` | sim |  |  |  |
| 10 | `city` | `text` | sim |  |  |  |
| 11 | `login_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `logout_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `is_active` | `boolean` | não | `true` |  |  |
| 14 | `last_activity_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| session_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| session_logs_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_session_logs_active | btree | {is_active} | não | sim | `(is_active = true)` | `CREATE INDEX idx_session_logs_active ON public.session_logs USING btree (is_active) WHERE (is_active = true)` |
| idx_session_logs_user | btree | {user_id} | não | sim |  | `CREATE INDEX idx_session_logs_user ON public.session_logs USING btree (user_id)` |
| session_logs_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX session_logs_pkey ON public.session_logs USING btree (id)` |


## Policies (RLS)

### `Users can update own sessions`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK |  |

### `Users can view own sessions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
