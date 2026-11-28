# public.department_war_results

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
| 4 | `position` | `integer` | não |  |  |  |
| 5 | `score` | `numeric` | não | `0` |  |  |
| 6 | `raw_score` | `numeric` | não | `0` |  |  |
| 7 | `contributors` | `integer` | não | `0` |  |  |
| 8 | `participation_rate` | `numeric` | não | `0` |  |  |
| 9 | `coins_per_member` | `integer` | não | `0` |  |  |
| 10 | `xp_per_member` | `integer` | não | `0` |  |  |
| 11 | `coins_total` | `integer` | não | `0` |  |  |
| 12 | `xp_total` | `integer` | não | `0` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| department_war_results_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| department_war_results_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| department_war_results_war_id_fkey | FOREIGN KEY | `FOREIGN KEY (war_id) REFERENCES department_wars(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| dept_war_results_unique | UNIQUE | `UNIQUE (war_id, department_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| department_war_results_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX department_war_results_pkey ON public.department_war_results USING btree (id)` |
| dept_war_results_unique | btree | {war_id,department_id} | sim | sim |  | `CREATE UNIQUE INDEX dept_war_results_unique ON public.department_war_results USING btree (war_id, department_id)` |
| idx_war_results_war | btree | {war_id,position} | não | sim |  | `CREATE INDEX idx_war_results_war ON public.department_war_results USING btree (war_id, "position")` |


## Policies (RLS)

### `dept_war_results_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `dept_war_results_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(EXISTS ( SELECT 1    FROM department_wars dw   WHERE ((dw.id = department_war_results.war_id) AND (dw.status <> 'draft'::text))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
