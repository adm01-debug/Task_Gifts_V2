# public.pulse_surveys

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
| 2 | `title` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `questions` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 5 | `is_anonymous` | `boolean` | não | `true` |  |  |
| 6 | `department_id` | `uuid` | sim |  |  |  |
| 7 | `starts_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `ends_at` | `timestamp with time zone` | não |  |  |  |
| 9 | `status` | `text` | não | `'draft'::text` |  |  |
| 10 | `created_by` | `uuid` | não |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| pulse_surveys_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| pulse_surveys_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| pulse_surveys_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'closed'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.pulse_responses | pulse_responses_survey_id_fkey | {survey_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_pulse_surveys_department_id | btree | {department_id} | não | sim |  | `CREATE INDEX idx_pulse_surveys_department_id ON public.pulse_surveys USING btree (department_id)` |
| pulse_surveys_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX pulse_surveys_pkey ON public.pulse_surveys USING btree (id)` |


## Policies (RLS)

### `Managers can manage surveys`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Users can view active surveys for their department`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((status = 'active'::text) AND ((department_id IS NULL) OR (department_id IN ( SELECT team_members.department_id    FROM team_members   WHERE (team_members.user_id = auth.uid())))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_pulse_surveys_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
