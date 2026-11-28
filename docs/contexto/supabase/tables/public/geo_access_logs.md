# public.geo_access_logs

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
| 2 | `ip_address` | `inet` | não |  |  |  |
| 3 | `country_code` | `character varying(2)` | sim |  |  |  |
| 4 | `country_name` | `character varying(100)` | sim |  |  |  |
| 5 | `user_id` | `uuid` | sim |  |  |  |
| 6 | `was_allowed` | `boolean` | não |  |  |  |
| 7 | `reason` | `text` | sim |  |  |  |
| 8 | `user_agent` | `text` | sim |  |  |  |
| 9 | `endpoint` | `text` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| geo_access_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| geo_access_logs_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| geo_access_logs_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX geo_access_logs_pkey ON public.geo_access_logs USING btree (id)` |
| idx_geo_access_logs_allowed | btree | {was_allowed} | não | sim |  | `CREATE INDEX idx_geo_access_logs_allowed ON public.geo_access_logs USING btree (was_allowed)` |
| idx_geo_access_logs_country | btree | {country_code} | não | sim |  | `CREATE INDEX idx_geo_access_logs_country ON public.geo_access_logs USING btree (country_code)` |
| idx_geo_access_logs_created | btree | {created_at} | não | sim |  | `CREATE INDEX idx_geo_access_logs_created ON public.geo_access_logs USING btree (created_at DESC)` |
| idx_geo_access_logs_user_id | btree | {user_id} | não | sim |  | `CREATE INDEX idx_geo_access_logs_user_id ON public.geo_access_logs USING btree (user_id)` |


## Policies (RLS)

### `Admins podem ver logs de acesso geográfico`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Authenticated insert geo logs`

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

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
