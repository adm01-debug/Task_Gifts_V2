# public.team_members

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `department_id` | `uuid` | não |  |  |  |
| 4 | `is_manager` | `boolean` | não | `false` |  |  |
| 5 | `joined_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| team_members_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| team_members_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| team_members_user_id_department_id_key | UNIQUE | `UNIQUE (user_id, department_id)` |  |  | sim |
| team_members_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_team_members_department_id | btree | {department_id} | não | sim |  | `CREATE INDEX idx_team_members_department_id ON public.team_members USING btree (department_id)` |
| team_members_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX team_members_pkey ON public.team_members USING btree (id)` |
| team_members_user_id_department_id_key | btree | {user_id,department_id} | sim | sim |  | `CREATE UNIQUE INDEX team_members_user_id_department_id_key ON public.team_members USING btree (user_id, department_id)` |


## Policies (RLS)

### `Admins can manage team members`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Managers can view their team members`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((auth.uid() = user_id) OR is_department_manager(auth.uid(), department_id) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Users can view their own team membership`

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
