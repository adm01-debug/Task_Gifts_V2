# public.enps_surveys

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
| 4 | `created_by` | `uuid` | não |  |  |  |
| 5 | `department_id` | `uuid` | sim |  |  |  |
| 6 | `starts_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `ends_at` | `timestamp with time zone` | não |  |  |  |
| 8 | `is_anonymous` | `boolean` | não | `true` |  |  |
| 9 | `status` | `text` | não | `'draft'::text` |  |  |
| 10 | `follow_up_question` | `text` | sim | `'O que podemos fazer para melhorar sua experiência?'::text` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| enps_surveys_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| enps_surveys_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| enps_surveys_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| enps_surveys_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'closed'::text, 'archived'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.enps_responses | enps_responses_survey_id_fkey | {survey_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| enps_surveys_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX enps_surveys_pkey ON public.enps_surveys USING btree (id)` |
| idx_enps_surveys_created_by | btree | {created_by} | não | sim |  | `CREATE INDEX idx_enps_surveys_created_by ON public.enps_surveys USING btree (created_by)` |
| idx_enps_surveys_department_id | btree | {department_id} | não | sim |  | `CREATE INDEX idx_enps_surveys_department_id ON public.enps_surveys USING btree (department_id)` |
| idx_enps_surveys_status | btree | {status} | não | sim |  | `CREATE INDEX idx_enps_surveys_status ON public.enps_surveys USING btree (status)` |


## Policies (RLS)

### `Admins can manage surveys`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view active surveys`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((status = 'active'::text) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
