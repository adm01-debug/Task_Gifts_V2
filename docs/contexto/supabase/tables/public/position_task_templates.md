# public.position_task_templates

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
| 2 | `position_id` | `uuid` | não |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `frequency` | `text` | não | `'daily'::text` |  |  |
| 6 | `priority` | `text` | não | `'medium'::text` |  |  |
| 7 | `expected_duration_minutes` | `integer` | sim | `60` |  |  |
| 8 | `xp_reward` | `integer` | não | `50` |  |  |
| 9 | `coin_reward` | `integer` | não | `25` |  |  |
| 10 | `xp_penalty_late` | `integer` | não | `25` |  |  |
| 11 | `xp_penalty_rework` | `integer` | não | `50` |  |  |
| 12 | `deadline_hours` | `integer` | sim | `24` |  |  |
| 13 | `is_active` | `boolean` | não | `true` |  |  |
| 14 | `created_by` | `uuid` | não |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| position_task_templates_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| position_task_templates_position_id_fkey | FOREIGN KEY | `FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.task_scores | task_scores_task_template_id_fkey | {task_template_id} | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_position_task_templates_position_id | btree | {position_id} | não | sim |  | `CREATE INDEX idx_position_task_templates_position_id ON public.position_task_templates USING btree (position_id)` |
| position_task_templates_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX position_task_templates_pkey ON public.position_task_templates USING btree (id)` |


## Policies (RLS)

### `Admins and managers can manage templates`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Everyone can view active templates`

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
| update_position_task_templates_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
