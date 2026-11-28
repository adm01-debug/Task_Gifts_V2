# public.engagement_answers

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `cycle_id` | `uuid` | não |  |  |  |
| 3 | `question_id` | `uuid` | não |  |  |  |
| 4 | `user_id` | `uuid` | não |  |  |  |
| 5 | `department_id` | `uuid` | sim |  |  |  |
| 6 | `raw_value` | `jsonb` | sim |  |  |  |
| 7 | `normalized_score` | `numeric` | sim |  |  |  |
| 8 | `text_answer` | `text` | sim |  |  |  |
| 9 | `is_anonymous` | `boolean` | não | `true` |  |  |
| 10 | `answered_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| engagement_answers_cycle_id_fkey | FOREIGN KEY | `FOREIGN KEY (cycle_id) REFERENCES engagement_cycles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| engagement_answers_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| engagement_answers_normalized_score_check | CHECK | `CHECK (normalized_score IS NULL OR normalized_score >= 0::numeric AND normalized_score <= 10::numeric)` |  |  | sim |
| engagement_answers_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| engagement_answers_question_id_fkey | FOREIGN KEY | `FOREIGN KEY (question_id) REFERENCES engagement_question_pool(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| engagement_answers_unique | UNIQUE | `UNIQUE (cycle_id, question_id, user_id)` |  |  | sim |
| engagement_answers_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| engagement_answers_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX engagement_answers_pkey ON public.engagement_answers USING btree (id)` |
| engagement_answers_unique | btree | {cycle_id,question_id,user_id} | sim | sim |  | `CREATE UNIQUE INDEX engagement_answers_unique ON public.engagement_answers USING btree (cycle_id, question_id, user_id)` |
| idx_eanswers_answered_at | btree | {answered_at} | não | sim |  | `CREATE INDEX idx_eanswers_answered_at ON public.engagement_answers USING btree (answered_at DESC)` |
| idx_eanswers_cycle | btree | {cycle_id} | não | sim |  | `CREATE INDEX idx_eanswers_cycle ON public.engagement_answers USING btree (cycle_id)` |
| idx_eanswers_dept_date | btree | {department_id,answered_at} | não | sim |  | `CREATE INDEX idx_eanswers_dept_date ON public.engagement_answers USING btree (department_id, answered_at DESC)` |
| idx_eanswers_question | btree | {question_id} | não | sim |  | `CREATE INDEX idx_eanswers_question ON public.engagement_answers USING btree (question_id)` |
| idx_eanswers_user_question | btree | {user_id,question_id} | não | sim |  | `CREATE INDEX idx_eanswers_user_question ON public.engagement_answers USING btree (user_id, question_id)` |
| idx_engagement_answers_cycle | btree | {cycle_id,department_id} | não | sim |  | `CREATE INDEX idx_engagement_answers_cycle ON public.engagement_answers USING btree (cycle_id, department_id)` |


## Policies (RLS)

### `engagement_answers_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `engagement_answers_manager_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'manager'::app_role)` |
| WITH CHECK |  |

### `engagement_answers_user_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(user_id = auth.uid())` |

### `engagement_answers_user_select_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((user_id = auth.uid()) AND (NOT is_anonymous))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_guard_engagement_answer_assignment | BEFORE | INSERT OR UPDATE | ROW | enabled | public.guard_engagement_answer_assignment |


## Grants

_nenhum_
