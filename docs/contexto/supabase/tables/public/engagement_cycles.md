# public.engagement_cycles

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
| 2 | `title` | `text` | não |  |  |  |
| 3 | `starts_at` | `timestamp with time zone` | não | `now()` |  |  |
| 4 | `ends_at` | `timestamp with time zone` | não |  |  |  |
| 5 | `questions_per_user` | `integer` | não | `6` |  |  |
| 6 | `status` | `engagement_cycle_status` | não | `'active'::engagement_cycle_status` |  |  |
| 7 | `department_id` | `uuid` | sim |  |  |  |
| 8 | `created_by` | `uuid` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| engagement_cycles_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| engagement_cycles_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| engagement_cycles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.engagement_answers | engagement_answers_cycle_id_fkey | {cycle_id} | CASCADE |
| public.engagement_question_assignments | engagement_question_assignments_cycle_id_fkey | {cycle_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| engagement_cycles_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX engagement_cycles_pkey ON public.engagement_cycles USING btree (id)` |
| idx_ecycles_status | btree | {status,ends_at} | não | sim |  | `CREATE INDEX idx_ecycles_status ON public.engagement_cycles USING btree (status, ends_at DESC)` |
| idx_engagement_cycles_status | btree | {status,ends_at} | não | sim |  | `CREATE INDEX idx_engagement_cycles_status ON public.engagement_cycles USING btree (status, ends_at)` |


## Policies (RLS)

### `engagement_cycles_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `engagement_cycles_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((status = 'active'::engagement_cycle_status) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| engagement_cycles_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
