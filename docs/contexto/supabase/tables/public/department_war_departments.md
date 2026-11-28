# public.department_war_departments

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
| 2 | `war_id` | `uuid` | não |  |  |  |
| 3 | `department_id` | `uuid` | não |  |  |  |
| 4 | `headcount` | `integer` | não | `0` |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| department_war_departments_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| department_war_departments_headcount_check | CHECK | `CHECK (headcount >= 0)` |  |  | sim |
| department_war_departments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| department_war_departments_war_id_fkey | FOREIGN KEY | `FOREIGN KEY (war_id) REFERENCES department_wars(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| dept_war_departments_unique | UNIQUE | `UNIQUE (war_id, department_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| department_war_departments_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX department_war_departments_pkey ON public.department_war_departments USING btree (id)` |
| dept_war_departments_unique | btree | {war_id,department_id} | sim | sim |  | `CREATE UNIQUE INDEX dept_war_departments_unique ON public.department_war_departments USING btree (war_id, department_id)` |
| idx_war_departments_war | btree | {war_id} | não | sim |  | `CREATE INDEX idx_war_departments_war ON public.department_war_departments USING btree (war_id)` |


## Policies (RLS)

### `dept_war_departments_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `dept_war_departments_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| dept_war_departments_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
