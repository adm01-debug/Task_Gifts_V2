# public.department_missions

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
| 3 | `title` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `frequency` | `mission_frequency` | sim | `'daily'::mission_frequency` |  |  |
| 6 | `xp_reward` | `integer` | sim | `30` |  |  |
| 7 | `coin_reward` | `integer` | sim | `0` |  |  |
| 8 | `target_value` | `integer` | sim | `1` |  |  |
| 9 | `metric_key` | `text` | não |  |  |  |
| 10 | `icon` | `text` | sim | `'🎯'::text` |  |  |
| 11 | `is_active` | `boolean` | sim | `true` |  |  |
| 12 | `order_index` | `integer` | sim | `0` |  |  |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| department_missions_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| department_missions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.user_mission_progress | user_mission_progress_mission_id_fkey | {mission_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| department_missions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX department_missions_pkey ON public.department_missions USING btree (id)` |
| idx_department_missions_department_id | btree | {department_id} | não | sim |  | `CREATE INDEX idx_department_missions_department_id ON public.department_missions USING btree (department_id)` |


## Policies (RLS)

### `Admins can manage missions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view active missions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_department_missions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
