# public.role_permissions

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
| 2 | `role_id` | `uuid` | não |  |  |  |
| 3 | `permission_id` | `uuid` | não |  |  |  |
| 4 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| role_permissions_permission_id_fkey | FOREIGN KEY | `FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| role_permissions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| role_permissions_role_id_fkey | FOREIGN KEY | `FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| role_permissions_role_id_permission_id_key | UNIQUE | `UNIQUE (role_id, permission_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_role_permissions_permission | btree | {permission_id} | não | sim |  | `CREATE INDEX idx_role_permissions_permission ON public.role_permissions USING btree (permission_id)` |
| idx_role_permissions_role | btree | {role_id} | não | sim |  | `CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role_id)` |
| role_permissions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX role_permissions_pkey ON public.role_permissions USING btree (id)` |
| role_permissions_role_id_permission_id_key | btree | {role_id,permission_id} | sim | sim |  | `CREATE UNIQUE INDEX role_permissions_role_id_permission_id_key ON public.role_permissions USING btree (role_id, permission_id)` |


## Policies (RLS)

### `Admins can manage role permissions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view role permissions`

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
