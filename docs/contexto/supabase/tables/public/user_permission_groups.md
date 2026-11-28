# public.user_permission_groups

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
| 3 | `permission_group_id` | `uuid` | não |  |  |  |
| 4 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| unique_user_permission_group | UNIQUE | `UNIQUE (user_id, permission_group_id)` |  |  | sim |
| user_permission_groups_permission_group_id_fkey | FOREIGN KEY | `FOREIGN KEY (permission_group_id) REFERENCES permission_groups(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_permission_groups_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_permission_groups_permission_group_id | btree | {permission_group_id} | não | sim |  | `CREATE INDEX idx_user_permission_groups_permission_group_id ON public.user_permission_groups USING btree (permission_group_id)` |
| unique_user_permission_group | btree | {user_id,permission_group_id} | sim | sim |  | `CREATE UNIQUE INDEX unique_user_permission_group ON public.user_permission_groups USING btree (user_id, permission_group_id)` |
| user_permission_groups_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX user_permission_groups_pkey ON public.user_permission_groups USING btree (id)` |


## Policies (RLS)

### `Admins can manage user permission groups`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Users can view own permission groups`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
