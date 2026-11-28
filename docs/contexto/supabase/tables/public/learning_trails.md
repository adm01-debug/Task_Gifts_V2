# public.learning_trails

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
| 2 | `title` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `icon` | `text` | sim | `'📚'::text` |  |  |
| 5 | `department_id` | `uuid` | sim |  |  |  |
| 6 | `estimated_hours` | `numeric(4,1)` | sim | `1` |  |  |
| 7 | `xp_reward` | `integer` | sim | `100` |  |  |
| 8 | `coin_reward` | `integer` | sim | `50` |  |  |
| 9 | `badge_name` | `text` | sim |  |  |  |
| 10 | `badge_icon` | `text` | sim |  |  |  |
| 11 | `status` | `trail_status` | sim | `'draft'::trail_status` |  |  |
| 12 | `order_index` | `integer` | sim | `0` |  |  |
| 13 | `created_by` | `uuid` | não |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| learning_trails_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| learning_trails_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.ai_course_jobs | ai_course_jobs_generated_trail_id_fkey | {generated_trail_id} | SET NULL |
| public.certifications | certifications_trail_id_fkey | {trail_id} | RESTRICT |
| public.trail_enrollments | trail_enrollments_trail_id_fkey | {trail_id} | CASCADE |
| public.trail_modules | trail_modules_trail_id_fkey | {trail_id} | CASCADE |
| public.trail_prerequisites | trail_prerequisites_prerequisite_trail_id_fkey | {prerequisite_trail_id} | CASCADE |
| public.trail_prerequisites | trail_prerequisites_trail_id_fkey | {trail_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_learning_trails_department_id | btree | {department_id} | não | sim |  | `CREATE INDEX idx_learning_trails_department_id ON public.learning_trails USING btree (department_id)` |
| idx_learning_trails_fts | gin | {} | não | sim |  | `CREATE INDEX idx_learning_trails_fts ON public.learning_trails USING gin (to_tsvector('portuguese'::regconfig, ((COALESCE(title, ''::text) \|\| ' '::text) \|\| COALESCE(description, ''::text))))` |
| idx_learning_trails_title_trgm | gin | {title} | não | sim |  | `CREATE INDEX idx_learning_trails_title_trgm ON public.learning_trails USING gin (title gin_trgm_ops)` |
| learning_trails_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX learning_trails_pkey ON public.learning_trails USING btree (id)` |


## Policies (RLS)

### `Creators and admins can delete trails`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Creators and admins can update trails`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Everyone can view published trails`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((status = 'published'::trail_status) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Managers and admins can create trails`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_learning_trails_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
