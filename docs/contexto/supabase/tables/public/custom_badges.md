# public.custom_badges

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
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `icon` | `text` | sim | `'🏆'::text` |  |  |
| 6 | `color` | `text` | sim | `'#fbbf24'::text` |  |  |
| 7 | `rarity` | `text` | sim | `'common'::text` |  |  |
| 8 | `category` | `text` | sim | `'achievement'::text` |  |  |
| 9 | `unlock_condition` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 10 | `xp_reward` | `integer` | sim | `50` |  |  |
| 11 | `coin_reward` | `integer` | sim | `25` |  |  |
| 12 | `is_active` | `boolean` | sim | `true` |  |  |
| 13 | `order_index` | `integer` | sim | `0` |  |  |
| 14 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| custom_badges_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| custom_badges_rarity_check | CHECK | `CHECK (rarity = ANY (ARRAY['common'::text, 'uncommon'::text, 'rare'::text, 'epic'::text, 'legendary'::text, 'mythic'::text]))` |  |  | sim |
| custom_badges_theme_id_fkey | FOREIGN KEY | `FOREIGN KEY (theme_id) REFERENCES gamification_themes(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| custom_badges_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX custom_badges_pkey ON public.custom_badges USING btree (id)` |
| idx_custom_badges_theme | btree | {theme_id} | não | sim |  | `CREATE INDEX idx_custom_badges_theme ON public.custom_badges USING btree (theme_id)` |


## Policies (RLS)

### `Admins can manage badges`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view active badges`

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
