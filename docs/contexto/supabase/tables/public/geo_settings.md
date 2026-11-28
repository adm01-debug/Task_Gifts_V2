# public.geo_settings

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
| 2 | `is_enabled` | `boolean` | não | `false` |  |  |
| 3 | `block_unknown_countries` | `boolean` | não | `true` |  |  |
| 4 | `log_all_access` | `boolean` | não | `true` |  |  |
| 5 | `updated_by` | `uuid` | sim |  |  |  |
| 6 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| geo_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| geo_settings_updated_by_fkey | FOREIGN KEY | `FOREIGN KEY (updated_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| geo_settings_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX geo_settings_pkey ON public.geo_settings USING btree (id)` |
| idx_geo_settings_updated_by | btree | {updated_by} | não | sim |  | `CREATE INDEX idx_geo_settings_updated_by ON public.geo_settings USING btree (updated_by)` |


## Policies (RLS)

### `Admins can manage geo settings`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM user_roles ur   WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role))))` |
| WITH CHECK |  |

### `Everyone can view geo settings`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
