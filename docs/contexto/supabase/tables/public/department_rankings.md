# public.department_rankings

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
| 2 | `department_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `period_type` | `text` | não | `'weekly'::text` |  |  |
| 5 | `period_start` | `date` | não |  |  |  |
| 6 | `period_end` | `date` | não |  |  |  |
| 7 | `metrics` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `total_score` | `integer` | sim | `0` |  |  |
| 9 | `rank_position` | `integer` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| department_rankings_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| department_rankings_department_id_user_id_period_type_perio_key | UNIQUE | `UNIQUE (department_id, user_id, period_type, period_start)` |  |  | sim |
| department_rankings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| department_rankings_department_id_user_id_period_type_perio_key | btree | {department_id,user_id,period_type,period_start} | sim | sim |  | `CREATE UNIQUE INDEX department_rankings_department_id_user_id_period_type_perio_key ON public.department_rankings USING btree (department_id, user_id, period_type, period_start)` |
| department_rankings_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX department_rankings_pkey ON public.department_rankings USING btree (id)` |


## Policies (RLS)

### `Everyone can view rankings`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `true` |
| WITH CHECK |  |

### `System can manage rankings`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_department_rankings_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
