# public.level_configs

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
| 2 | `theme_id` | `uuid` | sim |  |  |  |
| 3 | `level` | `integer` | não |  |  |  |
| 4 | `name` | `text` | sim |  |  |  |
| 5 | `xp_required` | `integer` | não |  |  |  |
| 6 | `icon` | `text` | sim | `'📊'::text` |  |  |
| 7 | `color` | `text` | sim | `'#6366f1'::text` |  |  |
| 8 | `rank_id` | `uuid` | sim |  |  |  |
| 9 | `rewards` | `jsonb` | sim | `'{"coins": 0, "special_item": null}'::jsonb` |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| level_configs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| level_configs_rank_id_fkey | FOREIGN KEY | `FOREIGN KEY (rank_id) REFERENCES custom_ranks(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| level_configs_theme_id_fkey | FOREIGN KEY | `FOREIGN KEY (theme_id) REFERENCES gamification_themes(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| level_configs_theme_id_level_key | UNIQUE | `UNIQUE (theme_id, level)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_level_configs_rank_id | btree | {rank_id} | não | sim |  | `CREATE INDEX idx_level_configs_rank_id ON public.level_configs USING btree (rank_id)` |
| idx_level_configs_theme | btree | {theme_id} | não | sim |  | `CREATE INDEX idx_level_configs_theme ON public.level_configs USING btree (theme_id)` |
| level_configs_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX level_configs_pkey ON public.level_configs USING btree (id)` |
| level_configs_theme_id_level_key | btree | {theme_id,level} | sim | sim |  | `CREATE UNIQUE INDEX level_configs_theme_id_level_key ON public.level_configs USING btree (theme_id, level)` |


## Policies (RLS)

### `Admins can manage level configs`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view level configs`

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

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
