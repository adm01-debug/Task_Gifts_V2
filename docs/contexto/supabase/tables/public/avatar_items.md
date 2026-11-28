# public.avatar_items

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
| 4 | `category` | `text` | não |  |  |  |
| 5 | `icon` | `text` | não | `'✨'::text` |  |  |
| 6 | `preview_color` | `text` | sim |  |  |  |
| 7 | `rarity` | `text` | não | `'common'::text` |  |  |
| 8 | `unlock_type` | `text` | não | `'level'::text` |  |  |
| 9 | `unlock_requirement` | `integer` | sim |  |  |  |
| 10 | `unlock_achievement_key` | `text` | sim |  |  |  |
| 11 | `price_coins` | `integer` | sim |  |  |  |
| 12 | `is_active` | `boolean` | não | `true` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| avatar_items_category_check | CHECK | `CHECK (category = ANY (ARRAY['background'::text, 'frame'::text, 'accessory'::text, 'effect'::text, 'badge_style'::text]))` |  |  | sim |
| avatar_items_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| avatar_items_rarity_check | CHECK | `CHECK (rarity = ANY (ARRAY['common'::text, 'rare'::text, 'epic'::text, 'legendary'::text]))` |  |  | sim |
| avatar_items_unlock_type_check | CHECK | `CHECK (unlock_type = ANY (ARRAY['default'::text, 'level'::text, 'achievement'::text, 'purchase'::text, 'streak'::text, 'special'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.user_avatar_config | user_avatar_config_selected_accessory_fkey | {selected_accessory} | SET NULL |
| public.user_avatar_config | user_avatar_config_selected_background_fkey | {selected_background} | SET NULL |
| public.user_avatar_config | user_avatar_config_selected_badge_style_fkey | {selected_badge_style} | SET NULL |
| public.user_avatar_config | user_avatar_config_selected_effect_fkey | {selected_effect} | SET NULL |
| public.user_avatar_config | user_avatar_config_selected_frame_fkey | {selected_frame} | SET NULL |
| public.user_avatar_items | user_avatar_items_item_id_fkey | {item_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| avatar_items_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX avatar_items_pkey ON public.avatar_items USING btree (id)` |


## Policies (RLS)

### `Admins can manage avatar items`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view active avatar items`

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

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
