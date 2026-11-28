# public.feedback_cycles

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `cycle_type` | `text` | não | `'360'::text` |  |  |
| 5 | `starts_at` | `timestamp with time zone` | não |  |  |  |
| 6 | `ends_at` | `timestamp with time zone` | não |  |  |  |
| 7 | `status` | `text` | não | `'draft'::text` |  |  |
| 8 | `questions` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 9 | `created_by` | `uuid` | não |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `grace_period_days` | `integer` | sim | `3` |  |  |
| 13 | `is_anonymous` | `boolean` | sim | `true` |  |  |
| 14 | `min_evaluators` | `integer` | sim | `3` |  |  |
| 15 | `include_self_evaluation` | `boolean` | sim | `true` |  |  |
| 16 | `include_manager_evaluation` | `boolean` | sim | `true` |  |  |
| 17 | `include_peer_evaluation` | `boolean` | sim | `true` |  |  |
| 18 | `include_direct_report_evaluation` | `boolean` | sim | `true` |  |  |
| 19 | `department_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| feedback_cycles_cycle_type_check | CHECK | `CHECK (cycle_type = ANY (ARRAY['360'::text, 'manager'::text, 'peer'::text, 'self'::text]))` |  |  | sim |
| feedback_cycles_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| feedback_cycles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| feedback_cycles_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'review'::text, 'completed'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.feedback_evaluations | feedback_evaluations_cycle_id_fkey | {cycle_id} | CASCADE |
| public.feedback_questions | feedback_questions_cycle_id_fkey | {cycle_id} | CASCADE |
| public.feedback_requests | feedback_requests_cycle_id_fkey | {cycle_id} | CASCADE |
| public.feedback_results | feedback_results_cycle_id_fkey | {cycle_id} | CASCADE |
| public.user_competency_assessments | user_competency_assessments_feedback_cycle_id_fkey | {feedback_cycle_id} | RESTRICT |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| feedback_cycles_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX feedback_cycles_pkey ON public.feedback_cycles USING btree (id)` |
| idx_feedback_cycles_department_id | btree | {department_id} | não | sim |  | `CREATE INDEX idx_feedback_cycles_department_id ON public.feedback_cycles USING btree (department_id)` |


## Policies (RLS)

### `Everyone can view active cycles`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((status = ANY (ARRAY['active'::text, 'review'::text, 'completed'::text])) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Managers can manage cycles`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_feedback_cycles_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
