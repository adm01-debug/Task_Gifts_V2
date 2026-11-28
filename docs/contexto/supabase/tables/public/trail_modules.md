# public.trail_modules

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
| 2 | `trail_id` | `uuid` | não |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `content_type` | `module_content_type` | sim | `'text'::module_content_type` |  |  |
| 6 | `content` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 7 | `video_url` | `text` | sim |  |  |  |
| 8 | `xp_reward` | `integer` | sim | `25` |  |  |
| 9 | `duration_minutes` | `integer` | sim | `15` |  |  |
| 10 | `order_index` | `integer` | sim | `0` |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| trail_modules_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| trail_modules_trail_id_fkey | FOREIGN KEY | `FOREIGN KEY (trail_id) REFERENCES learning_trails(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.module_progress | module_progress_module_id_fkey | {module_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_trail_modules_trail_id | btree | {trail_id} | não | sim |  | `CREATE INDEX idx_trail_modules_trail_id ON public.trail_modules USING btree (trail_id)` |
| trail_modules_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX trail_modules_pkey ON public.trail_modules USING btree (id)` |


## Policies (RLS)

### `Everyone can view modules of published trails`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM learning_trails t   WHERE ((t.id = trail_modules.trail_id) AND ((t.status = 'published'::trail_status) OR (t.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |
| WITH CHECK |  |

### `Trail creators can manage modules`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM learning_trails t   WHERE ((t.id = trail_modules.trail_id) AND ((t.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_trail_modules_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
