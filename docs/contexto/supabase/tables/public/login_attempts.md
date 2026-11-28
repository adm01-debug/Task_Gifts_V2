# public.login_attempts

> Log de tentativas de login — usado para lockout automatico e deteccao de forca bruta.

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
| 2 | `email` | `text` | não |  |  |  |
| 3 | `ip_address` | `inet` | não |  |  |  |
| 4 | `user_agent` | `text` | sim |  |  |  |
| 5 | `attempt_type` | `text` | não | `'password'::text` |  |  |
| 6 | `error_message` | `text` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| login_attempts_attempt_type_check | CHECK | `CHECK (attempt_type = ANY (ARRAY['password'::text, '2fa'::text, 'recovery'::text]))` |  |  | sim |
| login_attempts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_login_attempts_created | btree | {created_at} | não | sim |  | `CREATE INDEX idx_login_attempts_created ON public.login_attempts USING btree (created_at DESC)` |
| idx_login_attempts_email | btree | {email} | não | sim |  | `CREATE INDEX idx_login_attempts_email ON public.login_attempts USING btree (email)` |
| idx_login_attempts_email_created | btree | {email,created_at} | não | sim |  | `CREATE INDEX idx_login_attempts_email_created ON public.login_attempts USING btree (email, created_at DESC)` |
| idx_login_attempts_ip | btree | {ip_address} | não | sim |  | `CREATE INDEX idx_login_attempts_ip ON public.login_attempts USING btree (ip_address)` |
| idx_login_attempts_ip_created | btree | {ip_address,created_at} | não | sim |  | `CREATE INDEX idx_login_attempts_ip_created ON public.login_attempts USING btree (ip_address, created_at DESC)` |
| login_attempts_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX login_attempts_pkey ON public.login_attempts USING btree (id)` |


## Policies (RLS)

### `Admins can view login attempts`

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
