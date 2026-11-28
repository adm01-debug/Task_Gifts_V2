# public.competencies

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
| 4 | `category` | `text` | não | `'technical'::text` |  |  |
| 5 | `department_id` | `uuid` | sim |  |  |  |
| 6 | `is_active` | `boolean` | não | `true` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| competencies_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| competencies_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.development_plan_actions | development_plan_actions_competency_id_fkey | {competency_id} | RESTRICT |
| public.feedback_questions | feedback_questions_competency_id_fkey | {competency_id} | RESTRICT |
| public.feedback_results | feedback_results_competency_id_fkey | {competency_id} | RESTRICT |
| public.position_competencies | position_competencies_competency_id_fkey | {competency_id} | CASCADE |
| public.user_competency_assessments | user_competency_assessments_competency_id_fkey | {competency_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| competencies_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX competencies_pkey ON public.competencies USING btree (id)` |
| idx_competencies_dept | btree | {department_id} | não | sim |  | `CREATE INDEX idx_competencies_dept ON public.competencies USING btree (department_id)` |


## Policies (RLS)

### `Admins can manage competencies`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view competencies`

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
