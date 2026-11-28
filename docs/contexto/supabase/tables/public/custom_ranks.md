# public.custom_ranks

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
| 3 | `name` | `text` | não |  |  |  |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `icon` | `text` | sim | `'⭐'::text` |  |  |
| 7 | `color` | `text` | sim | `'#fbbf24'::text` |  |  |
| 8 | `min_level` | `integer` | não | `1` |  |  |
| 9 | `max_level` | `integer` | sim |  |  |  |
| 10 | `xp_multiplier` | `numeric(3,2)` | sim | `1.00` |  |  |
| 11 | `coin_multiplier` | `numeric(3,2)` | sim | `1.00` |  |  |
| 12 | `order_index` | `integer` | sim | `0` |  |  |
| 13 | `badge_url` | `text` | sim |  |  |  |
| 14 | `special_perks` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 15 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| custom_ranks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| custom_ranks_theme_id_fkey | FOREIGN KEY | `FOREIGN KEY (theme_id) REFERENCES gamification_themes(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.level_configs | level_configs_rank_id_fkey | {rank_id} | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| custom_ranks_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX custom_ranks_pkey ON public.custom_ranks USING btree (id)` |
| idx_custom_ranks_theme | btree | {theme_id} | não | sim |  | `CREATE INDEX idx_custom_ranks_theme ON public.custom_ranks USING btree (theme_id)` |


## Policies (RLS)

### `Admins can manage ranks`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view ranks`

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
