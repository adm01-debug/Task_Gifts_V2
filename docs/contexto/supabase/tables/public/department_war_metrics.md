# public.department_war_metrics

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
| 3 | `metric_key` | `text` | não |  |  |  |
| 4 | `label` | `text` | não |  |  |  |
| 5 | `weight` | `numeric` | não | `1` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| department_war_metrics_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| department_war_metrics_war_id_fkey | FOREIGN KEY | `FOREIGN KEY (war_id) REFERENCES department_wars(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| department_war_metrics_weight_check | CHECK | `CHECK (weight >= 0::numeric)` |  |  | sim |
| dept_war_metrics_unique | UNIQUE | `UNIQUE (war_id, metric_key)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| department_war_metrics_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX department_war_metrics_pkey ON public.department_war_metrics USING btree (id)` |
| dept_war_metrics_unique | btree | {war_id,metric_key} | sim | sim |  | `CREATE UNIQUE INDEX dept_war_metrics_unique ON public.department_war_metrics USING btree (war_id, metric_key)` |
| idx_war_metrics_war | btree | {war_id} | não | sim |  | `CREATE INDEX idx_war_metrics_war ON public.department_war_metrics USING btree (war_id)` |


## Policies (RLS)

### `department_war_metrics_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `department_war_metrics_user_select`

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
| department_war_metrics_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
