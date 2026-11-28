# public.user_avatar_config

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `selected_background` | `uuid` | sim |  |  |  |
| 4 | `selected_frame` | `uuid` | sim |  |  |  |
| 5 | `selected_accessory` | `uuid` | sim |  |  |  |
| 6 | `selected_effect` | `uuid` | sim |  |  |  |
| 7 | `selected_badge_style` | `uuid` | sim |  |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_avatar_config_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_avatar_config_selected_accessory_fkey | FOREIGN KEY | `FOREIGN KEY (selected_accessory) REFERENCES avatar_items(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| user_avatar_config_selected_background_fkey | FOREIGN KEY | `FOREIGN KEY (selected_background) REFERENCES avatar_items(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| user_avatar_config_selected_badge_style_fkey | FOREIGN KEY | `FOREIGN KEY (selected_badge_style) REFERENCES avatar_items(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| user_avatar_config_selected_effect_fkey | FOREIGN KEY | `FOREIGN KEY (selected_effect) REFERENCES avatar_items(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| user_avatar_config_selected_frame_fkey | FOREIGN KEY | `FOREIGN KEY (selected_frame) REFERENCES avatar_items(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| user_avatar_config_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_avatar_config_selected_accessory | btree | {selected_accessory} | não | sim |  | `CREATE INDEX idx_user_avatar_config_selected_accessory ON public.user_avatar_config USING btree (selected_accessory)` |
| idx_user_avatar_config_selected_background | btree | {selected_background} | não | sim |  | `CREATE INDEX idx_user_avatar_config_selected_background ON public.user_avatar_config USING btree (selected_background)` |
| idx_user_avatar_config_selected_badge_style | btree | {selected_badge_style} | não | sim |  | `CREATE INDEX idx_user_avatar_config_selected_badge_style ON public.user_avatar_config USING btree (selected_badge_style)` |
| idx_user_avatar_config_selected_effect | btree | {selected_effect} | não | sim |  | `CREATE INDEX idx_user_avatar_config_selected_effect ON public.user_avatar_config USING btree (selected_effect)` |
| idx_user_avatar_config_selected_frame | btree | {selected_frame} | não | sim |  | `CREATE INDEX idx_user_avatar_config_selected_frame ON public.user_avatar_config USING btree (selected_frame)` |
| user_avatar_config_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX user_avatar_config_pkey ON public.user_avatar_config USING btree (id)` |
| user_avatar_config_user_id_key | btree | {user_id} | sim | sim |  | `CREATE UNIQUE INDEX user_avatar_config_user_id_key ON public.user_avatar_config USING btree (user_id)` |


## Policies (RLS)

### `Users can insert own avatar config`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update own avatar config`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view any avatar config`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_user_avatar_config_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
