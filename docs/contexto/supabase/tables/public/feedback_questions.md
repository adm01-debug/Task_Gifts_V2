# public.feedback_questions

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `cycle_id` | `uuid` | não |  |  |  |
| 3 | `competency_id` | `uuid` | sim |  |  |  |
| 4 | `question_text` | `text` | não |  |  |  |
| 5 | `question_text_en` | `text` | sim |  |  |  |
| 6 | `question_text_es` | `text` | sim |  |  |  |
| 7 | `question_type` | `text` | sim | `'scale'::text` |  |  |
| 8 | `scale_min` | `integer` | sim | `1` |  |  |
| 9 | `scale_max` | `integer` | sim | `5` |  |  |
| 10 | `scale_labels` | `jsonb` | sim |  |  |  |
| 11 | `options` | `jsonb` | sim |  |  |  |
| 12 | `is_required` | `boolean` | sim | `true` |  |  |
| 13 | `weight` | `numeric(3,2)` | sim | `1.0` |  |  |
| 14 | `order_index` | `integer` | sim | `0` |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| feedback_questions_competency_id_fkey | FOREIGN KEY | `FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| feedback_questions_cycle_id_fkey | FOREIGN KEY | `FOREIGN KEY (cycle_id) REFERENCES feedback_cycles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| feedback_questions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| feedback_questions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX feedback_questions_pkey ON public.feedback_questions USING btree (id)` |
| idx_feedback_questions_competency_id | btree | {competency_id} | não | sim |  | `CREATE INDEX idx_feedback_questions_competency_id ON public.feedback_questions USING btree (competency_id)` |
| idx_feedback_questions_cycle_id | btree | {cycle_id} | não | sim |  | `CREATE INDEX idx_feedback_questions_cycle_id ON public.feedback_questions USING btree (cycle_id)` |


## Policies (RLS)

### `feedback_questions_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
