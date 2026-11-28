# public.task_scores

> Pontuacoes de tasks completadas pelos usuarios — core da mecanica de gamificacao com XP e deadlines.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.leaderboard_cache |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `task_template_id` | `uuid` | sim |  |  |  |
| 4 | `bitrix_task_id` | `text` | sim |  |  |  |
| 5 | `title` | `text` | não |  |  |  |
| 6 | `description` | `text` | sim |  |  |  |
| 7 | `status` | `task_completion_status` | não | `'pending'::task_completion_status` |  | Enum task_completion_status: pending/on_time/late/rejected/rework |
| 8 | `source` | `text` | não | `'internal'::text` |  |  |
| 9 | `assigned_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `deadline_at` | `timestamp with time zone` | sim |  |  | Prazo da task — indexado para queries de tarefas próximas do vencimento |
| 11 | `started_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `xp_earned` | `integer` | não | `0` |  |  |
| 14 | `coins_earned` | `integer` | não | `0` |  |  |
| 15 | `xp_penalty` | `integer` | não | `0` |  |  |
| 16 | `is_late` | `boolean` | não | `false` |  |  |
| 17 | `late_hours` | `integer` | sim | `0` |  |  |
| 18 | `rework_count` | `integer` | não | `0` |  |  |
| 19 | `bitrix_metadata` | `jsonb` | sim |  |  |  |
| 20 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 21 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| task_scores_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| task_scores_task_template_id_fkey | FOREIGN KEY | `FOREIGN KEY (task_template_id) REFERENCES position_task_templates(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.task_penalties | task_penalties_task_score_id_fkey | {task_score_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_task_scores_status_date | btree | {status,assigned_at} | não | sim |  | `CREATE INDEX idx_task_scores_status_date ON public.task_scores USING btree (status, assigned_at DESC)` |
| idx_task_scores_task_template_id | btree | {task_template_id} | não | sim |  | `CREATE INDEX idx_task_scores_task_template_id ON public.task_scores USING btree (task_template_id)` |
| idx_task_scores_user_deadline | btree | {user_id,deadline_at} | não | sim | `(deadline_at IS NOT NULL)` | `CREATE INDEX idx_task_scores_user_deadline ON public.task_scores USING btree (user_id, deadline_at) WHERE (deadline_at IS NOT NULL)` |
| idx_task_scores_user_status | btree | {user_id,status} | não | sim |  | `CREATE INDEX idx_task_scores_user_status ON public.task_scores USING btree (user_id, status)` |
| task_scores_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX task_scores_pkey ON public.task_scores USING btree (id)` |


## Policies (RLS)

### `Admins can manage task scores`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |

### `Managers can view all task scores`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Managers insert task scores`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))` |

### `Managers update task scores`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK | `(has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))` |

### `Users can view own task scores`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((user_id = auth.uid()) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_boss_damage_task_scores | AFTER | INSERT OR UPDATE | ROW | enabled | public.boss_hook_task_scores |
| trg_card_pack_task_scores | AFTER | INSERT OR UPDATE | ROW | enabled | public.card_pack_hook_task_scores |
| trg_war_hook_task_scores | AFTER | INSERT OR UPDATE | ROW | enabled | public.war_hook_task_scores |
| update_task_scores_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
