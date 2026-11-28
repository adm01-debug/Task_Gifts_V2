# public.gamification_themes

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
| 2 | `department_id` | `uuid` | sim |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `icon` | `text` | sim | `'🎮'::text` |  |  |
| 6 | `color_primary` | `text` | sim | `'#6366f1'::text` |  |  |
| 7 | `color_secondary` | `text` | sim | `'#8b5cf6'::text` |  |  |
| 8 | `is_active` | `boolean` | sim | `true` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `created_by` | `uuid` | não |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| gamification_themes_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| gamification_themes_department_id_key | UNIQUE | `UNIQUE (department_id)` |  |  | sim |
| gamification_themes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.custom_badges | custom_badges_theme_id_fkey | {theme_id} | CASCADE |
| public.custom_ranks | custom_ranks_theme_id_fkey | {theme_id} | CASCADE |
| public.custom_titles | custom_titles_theme_id_fkey | {theme_id} | CASCADE |
| public.leagues | leagues_theme_id_fkey | {theme_id} | SET NULL |
| public.level_configs | level_configs_theme_id_fkey | {theme_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| gamification_themes_department_id_key | btree | {department_id} | sim | sim |  | `CREATE UNIQUE INDEX gamification_themes_department_id_key ON public.gamification_themes USING btree (department_id)` |
| gamification_themes_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX gamification_themes_pkey ON public.gamification_themes USING btree (id)` |


## Policies (RLS)

### `Admins can manage themes`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view active themes`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
