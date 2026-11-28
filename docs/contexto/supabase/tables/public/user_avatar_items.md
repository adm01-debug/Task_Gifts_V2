# public.user_avatar_items

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
| 3 | `item_id` | `uuid` | não |  |  |  |
| 4 | `unlocked_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_avatar_items_item_id_fkey | FOREIGN KEY | `FOREIGN KEY (item_id) REFERENCES avatar_items(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_avatar_items_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_avatar_items_user_id_item_id_key | UNIQUE | `UNIQUE (user_id, item_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_avatar_items_item_id | btree | {item_id} | não | sim |  | `CREATE INDEX idx_user_avatar_items_item_id ON public.user_avatar_items USING btree (item_id)` |
| user_avatar_items_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX user_avatar_items_pkey ON public.user_avatar_items USING btree (id)` |
| user_avatar_items_user_id_item_id_key | btree | {user_id,item_id} | sim | sim |  | `CREATE UNIQUE INDEX user_avatar_items_user_id_item_id_key ON public.user_avatar_items USING btree (user_id, item_id)` |


## Policies (RLS)

### `Users can insert own avatar items`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can view others avatar items for display`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `true` |
| WITH CHECK |  |

### `Users can view own avatar items`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
