# public.boss_win_rate_goals

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
| 2 | `department_id` | `uuid` | sim |  |  |  |
| 3 | `target_pct` | `numeric` | não | `60` |  |  |
| 4 | `tolerance_pp` | `numeric` | não | `5` |  |  |
| 5 | `window_days` | `integer` | não | `90` |  |  |
| 6 | `notes` | `text` | sim |  |  |  |
| 7 | `updated_by` | `uuid` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| boss_win_rate_goals_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| boss_win_rate_goals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| boss_win_rate_goals_target_pct_check | CHECK | `CHECK (target_pct >= 0::numeric AND target_pct <= 100::numeric)` |  |  | sim |
| boss_win_rate_goals_tolerance_pp_check | CHECK | `CHECK (tolerance_pp >= 0::numeric AND tolerance_pp <= 100::numeric)` |  |  | sim |
| boss_win_rate_goals_updated_by_fkey | FOREIGN KEY | `FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| boss_win_rate_goals_window_days_check | CHECK | `CHECK (window_days >= 1 AND window_days <= 3650)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| boss_win_rate_goals_department_key | btree | {department_id} | sim | sim | `(department_id IS NOT NULL)` | `CREATE UNIQUE INDEX boss_win_rate_goals_department_key ON public.boss_win_rate_goals USING btree (department_id) WHERE (department_id IS NOT NULL)` |
| boss_win_rate_goals_global_key | btree | {} | sim | sim | `(department_id IS NULL)` | `CREATE UNIQUE INDEX boss_win_rate_goals_global_key ON public.boss_win_rate_goals USING btree (((department_id IS NULL))) WHERE (department_id IS NULL)` |
| boss_win_rate_goals_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX boss_win_rate_goals_pkey ON public.boss_win_rate_goals USING btree (id)` |


## Policies (RLS)

### `boss_win_rate_goals_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |

### `boss_win_rate_goals_select`

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
| boss_win_rate_goals_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
