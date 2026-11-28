# public.permissions

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
| 2 | `key` | `text` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `module` | `text` | não |  |  |  |
| 6 | `category` | `text` | sim | `'general'::text` |  |  |
| 7 | `is_system` | `boolean` | sim | `false` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| permissions_key_key | UNIQUE | `UNIQUE (key)` |  |  | sim |
| permissions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.role_permissions | role_permissions_permission_id_fkey | {permission_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_permissions_module | btree | {module} | não | sim |  | `CREATE INDEX idx_permissions_module ON public.permissions USING btree (module)` |
| permissions_key_key | btree | {key} | sim | sim |  | `CREATE UNIQUE INDEX permissions_key_key ON public.permissions USING btree (key)` |
| permissions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX permissions_pkey ON public.permissions USING btree (id)` |


## Policies (RLS)

### `Admins can manage permissions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view permissions`

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
