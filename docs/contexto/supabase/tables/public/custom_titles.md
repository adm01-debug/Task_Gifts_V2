# public.custom_titles

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
| 4 | `prefix` | `text` | sim |  |  |  |
| 5 | `suffix` | `text` | sim |  |  |  |
| 6 | `description` | `text` | sim |  |  |  |
| 7 | `icon` | `text` | sim | `'👑'::text` |  |  |
| 8 | `color` | `text` | sim | `'#fbbf24'::text` |  |  |
| 9 | `unlock_type` | `text` | sim | `'achievement'::text` |  |  |
| 10 | `unlock_requirement` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `is_limited` | `boolean` | sim | `false` |  |  |
| 12 | `max_holders` | `integer` | sim |  |  |  |
| 13 | `is_active` | `boolean` | sim | `true` |  |  |
| 14 | `order_index` | `integer` | sim | `0` |  |  |
| 15 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| custom_titles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| custom_titles_theme_id_fkey | FOREIGN KEY | `FOREIGN KEY (theme_id) REFERENCES gamification_themes(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| custom_titles_unlock_type_check | CHECK | `CHECK (unlock_type = ANY (ARRAY['level'::text, 'achievement'::text, 'purchase'::text, 'manual'::text, 'event'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.user_titles | user_titles_title_id_fkey | {title_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| custom_titles_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX custom_titles_pkey ON public.custom_titles USING btree (id)` |
| idx_custom_titles_theme | btree | {theme_id} | não | sim |  | `CREATE INDEX idx_custom_titles_theme ON public.custom_titles USING btree (theme_id)` |


## Policies (RLS)

### `Admins can manage titles`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view active titles`

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
