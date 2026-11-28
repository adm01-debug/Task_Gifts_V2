# public.org_theme_history

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
| 2 | `org_id` | `uuid` | não |  |  |  |
| 3 | `snapshot` | `jsonb` | não |  |  |  |
| 4 | `changed_by` | `uuid` | sim |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| org_theme_history_org_id_fkey | FOREIGN KEY | `FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| org_theme_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_org_theme_history_org | btree | {org_id,created_at} | não | sim |  | `CREATE INDEX idx_org_theme_history_org ON public.org_theme_history USING btree (org_id, created_at DESC)` |
| idx_org_theme_history_org_id | btree | {org_id} | não | sim |  | `CREATE INDEX idx_org_theme_history_org_id ON public.org_theme_history USING btree (org_id)` |
| org_theme_history_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX org_theme_history_pkey ON public.org_theme_history USING btree (id)` |


## Policies (RLS)

### `Org admins insert history`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `is_org_admin(auth.uid(), org_id)` |

### `Org admins view history`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `is_org_admin(auth.uid(), org_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
