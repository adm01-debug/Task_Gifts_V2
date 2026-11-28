# public.user_competency_assessments

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `competency_id` | `uuid` | não |  |  |  |
| 4 | `assessed_level` | `integer` | não |  |  |  |
| 5 | `assessment_type` | `text` | sim | `'manager'::text` |  |  |
| 6 | `evidence` | `text` | sim |  |  |  |
| 7 | `assessor_id` | `uuid` | sim |  |  |  |
| 8 | `feedback_cycle_id` | `uuid` | sim |  |  |  |
| 9 | `valid_until` | `timestamp with time zone` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_competency_assessments_assessed_level_check | CHECK | `CHECK (assessed_level >= 1 AND assessed_level <= 5)` |  |  | sim |
| user_competency_assessments_competency_id_fkey | FOREIGN KEY | `FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_competency_assessments_feedback_cycle_id_fkey | FOREIGN KEY | `FOREIGN KEY (feedback_cycle_id) REFERENCES feedback_cycles(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| user_competency_assessments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_competency_assessments_competency_id | btree | {competency_id} | não | sim |  | `CREATE INDEX idx_user_competency_assessments_competency_id ON public.user_competency_assessments USING btree (competency_id)` |
| idx_user_competency_assessments_feedback_cycle_id | btree | {feedback_cycle_id} | não | sim |  | `CREATE INDEX idx_user_competency_assessments_feedback_cycle_id ON public.user_competency_assessments USING btree (feedback_cycle_id)` |
| user_competency_assessments_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX user_competency_assessments_pkey ON public.user_competency_assessments USING btree (id)` |


## Policies (RLS)

### `Managers insert competency assessments`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(assessor_id = auth.uid())` |

### `user_competency_assessments_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((auth.uid() = user_id) OR (auth.uid() = assessor_id))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
