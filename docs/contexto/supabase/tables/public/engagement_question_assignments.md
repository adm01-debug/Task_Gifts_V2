# public.engagement_question_assignments

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
| 2 | `cycle_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `question_id` | `uuid` | não |  |  |  |
| 5 | `order_index` | `integer` | não | `0` |  |  |
| 6 | `answered_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| engagement_question_assignments_cycle_id_fkey | FOREIGN KEY | `FOREIGN KEY (cycle_id) REFERENCES engagement_cycles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| engagement_question_assignments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| engagement_question_assignments_question_id_fkey | FOREIGN KEY | `FOREIGN KEY (question_id) REFERENCES engagement_question_pool(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| engagement_question_assignments_unique | UNIQUE | `UNIQUE (cycle_id, user_id, question_id)` |  |  | sim |
| engagement_question_assignments_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| engagement_question_assignments_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX engagement_question_assignments_pkey ON public.engagement_question_assignments USING btree (id)` |
| engagement_question_assignments_unique | btree | {cycle_id,user_id,question_id} | sim | sim |  | `CREATE UNIQUE INDEX engagement_question_assignments_unique ON public.engagement_question_assignments USING btree (cycle_id, user_id, question_id)` |
| idx_engagement_question_assignments_cycle_user | btree | {cycle_id,user_id} | não | sim |  | `CREATE INDEX idx_engagement_question_assignments_cycle_user ON public.engagement_question_assignments USING btree (cycle_id, user_id)` |
| idx_eqa_pending | btree | {user_id} | não | sim | `(answered_at IS NULL)` | `CREATE INDEX idx_eqa_pending ON public.engagement_question_assignments USING btree (user_id) WHERE (answered_at IS NULL)` |
| idx_eqa_user_cycle | btree | {user_id,cycle_id} | não | sim |  | `CREATE INDEX idx_eqa_user_cycle ON public.engagement_question_assignments USING btree (user_id, cycle_id)` |


## Policies (RLS)

### `engagement_question_assignments_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `engagement_question_assignments_user_own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
