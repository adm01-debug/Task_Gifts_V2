# public.department_war_contributions

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
| 4 | `user_id` | `uuid` | não |  |  |  |
| 5 | `metric_key` | `text` | não |  |  |  |
| 6 | `amount` | `numeric` | não |  |  |  |
| 7 | `dedupe_key` | `text` | não |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| department_war_contributions_amount_check | CHECK | `CHECK (amount > 0::numeric)` |  |  | sim |
| department_war_contributions_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| department_war_contributions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| department_war_contributions_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| department_war_contributions_war_id_dedupe_key_key | UNIQUE | `UNIQUE (war_id, dedupe_key)` |  |  | sim |
| department_war_contributions_war_id_fkey | FOREIGN KEY | `FOREIGN KEY (war_id) REFERENCES department_wars(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| dept_war_contributions_dedupe | UNIQUE | `UNIQUE (dedupe_key)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| department_war_contributions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX department_war_contributions_pkey ON public.department_war_contributions USING btree (id)` |
| department_war_contributions_war_id_dedupe_key_key | btree | {war_id,dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX department_war_contributions_war_id_dedupe_key_key ON public.department_war_contributions USING btree (war_id, dedupe_key)` |
| dept_war_contributions_dedupe | btree | {dedupe_key} | sim | sim |  | `CREATE UNIQUE INDEX dept_war_contributions_dedupe ON public.department_war_contributions USING btree (dedupe_key)` |
| idx_dept_war_contributions_war | btree | {war_id,department_id} | não | sim |  | `CREATE INDEX idx_dept_war_contributions_war ON public.department_war_contributions USING btree (war_id, department_id)` |
| idx_war_contrib_feed | btree | {war_id,created_at} | não | sim |  | `CREATE INDEX idx_war_contrib_feed ON public.department_war_contributions USING btree (war_id, created_at DESC)` |
| idx_war_contrib_user | btree | {war_id,user_id} | não | sim |  | `CREATE INDEX idx_war_contrib_user ON public.department_war_contributions USING btree (war_id, user_id)` |


## Policies (RLS)

### `department_war_contributions_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `department_war_contributions_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
