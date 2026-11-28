# public.goals

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 7 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `department_id` | `uuid` | sim |  |  |  |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `goal_type` | `text` | não | `'personal'::text` |  |  |
| 7 | `status` | `text` | não | `'active'::text` |  |  |
| 8 | `priority` | `text` | não | `'medium'::text` |  |  |
| 9 | `progress_percent` | `integer` | não | `0` |  |  |
| 10 | `start_date` | `date` | não | `CURRENT_DATE` |  |  |
| 11 | `due_date` | `date` | sim |  |  |  |
| 12 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `xp_reward` | `integer` | não | `200` |  |  |
| 14 | `coin_reward` | `integer` | não | `100` |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| goals_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| goals_goal_type_check | CHECK | `CHECK (goal_type = ANY (ARRAY['personal'::text, 'team'::text, 'company'::text]))` |  |  | sim |
| goals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| goals_priority_check | CHECK | `CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))` |  |  | sim |
| goals_progress_percent_check | CHECK | `CHECK (progress_percent >= 0 AND progress_percent <= 100)` |  |  | sim |
| goals_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'cancelled'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.goal_updates | goal_updates_goal_id_fkey | {goal_id} | CASCADE |
| public.key_results | key_results_goal_id_fkey | {goal_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| goals_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX goals_pkey ON public.goals USING btree (id)` |
| idx_goals_department_id | btree | {department_id} | não | sim |  | `CREATE INDEX idx_goals_department_id ON public.goals USING btree (department_id)` |


## Policies (RLS)

### `Managers can manage team goals`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Users can create own goals`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(user_id = auth.uid())` |

### `Users can delete own draft goals`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((user_id = auth.uid()) AND (status = 'draft'::text))` |
| WITH CHECK |  |

### `Users can update own goals`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK |  |

### `Users can view company goals`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(goal_type = 'company'::text)` |
| WITH CHECK |  |

### `Users can view own goals`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK |  |

### `Users can view team goals`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((goal_type = 'team'::text) AND (department_id IN ( SELECT team_members.department_id    FROM team_members   WHERE (team_members.user_id = auth.uid()))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_goals_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
