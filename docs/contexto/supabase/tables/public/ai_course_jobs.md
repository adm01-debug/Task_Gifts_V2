# public.ai_course_jobs

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `status` | `text` | não | `'pending'::text` |  |  |
| 4 | `source_file_path` | `text` | não |  |  |  |
| 5 | `source_file_name` | `text` | não |  |  |  |
| 6 | `source_file_size` | `bigint` | sim |  |  |  |
| 7 | `prompt_hint` | `text` | sim |  |  |  |
| 8 | `generated_trail_id` | `uuid` | sim |  |  |  |
| 9 | `modules_created` | `integer` | não | `0` |  |  |
| 10 | `questions_created` | `integer` | não | `0` |  |  |
| 11 | `error_message` | `text` | sim |  |  |  |
| 12 | `started_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ai_course_jobs_generated_trail_id_fkey | FOREIGN KEY | `FOREIGN KEY (generated_trail_id) REFERENCES learning_trails(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| ai_course_jobs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| ai_course_jobs_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'succeeded'::text, 'failed'::text]))` |  |  | sim |
| ai_course_jobs_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| ai_course_jobs_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX ai_course_jobs_pkey ON public.ai_course_jobs USING btree (id)` |
| idx_ai_course_jobs_generated_trail_id | btree | {generated_trail_id} | não | sim |  | `CREATE INDEX idx_ai_course_jobs_generated_trail_id ON public.ai_course_jobs USING btree (generated_trail_id)` |
| idx_ai_course_jobs_status | btree | {status} | não | sim | `(status = ANY (ARRAY['pending'::text, 'processing'::text]))` | `CREATE INDEX idx_ai_course_jobs_status ON public.ai_course_jobs USING btree (status) WHERE (status = ANY (ARRAY['pending'::text, 'processing'::text]))` |
| idx_ai_course_jobs_user | btree | {user_id,created_at} | não | sim |  | `CREATE INDEX idx_ai_course_jobs_user ON public.ai_course_jobs USING btree (user_id, created_at DESC)` |


## Policies (RLS)

### `Users create own ai course jobs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users update own ai course jobs`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))` |

### `Users view own ai course jobs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_ai_course_jobs_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
