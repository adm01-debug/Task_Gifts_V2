# public.org_members

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
| 2 | `org_id` | `uuid` | não |  |  | Chave de isolamento multi-tenant — todas as queries filtram por org_id |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `role` | `text` | não | `'member'::text` |  | Papel na org: admin/manager/employee — mapeia para enum app_role |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| org_members_org_id_fkey | FOREIGN KEY | `FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| org_members_org_id_user_id_key | UNIQUE | `UNIQUE (org_id, user_id)` |  |  | sim |
| org_members_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| org_members_role_check | CHECK | `CHECK (role = ANY (ARRAY['admin'::text, 'member'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_org_members_org_id | btree | {org_id} | não | sim |  | `CREATE INDEX idx_org_members_org_id ON public.org_members USING btree (org_id)` |
| idx_org_members_user_id | btree | {user_id} | não | sim |  | `CREATE INDEX idx_org_members_user_id ON public.org_members USING btree (user_id)` |
| org_members_org_id_user_id_key | btree | {org_id,user_id} | sim | sim |  | `CREATE UNIQUE INDEX org_members_org_id_user_id_key ON public.org_members USING btree (org_id, user_id)` |
| org_members_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX org_members_pkey ON public.org_members USING btree (id)` |


## Policies (RLS)

### `Members can view their org membership`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((user_id = auth.uid()) OR is_org_admin(auth.uid(), org_id))` |
| WITH CHECK |  |

### `Org admins manage members`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `is_org_admin(auth.uid(), org_id)` |
| WITH CHECK | `is_org_admin(auth.uid(), org_id)` |


## Triggers

_nenhum_


## Grants

_nenhum_
