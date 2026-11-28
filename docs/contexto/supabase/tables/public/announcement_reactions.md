# public.announcement_reactions

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
| 2 | `announcement_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `emoji` | `text` | não |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| announcement_reactions_announcement_id_fkey | FOREIGN KEY | `FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| announcement_reactions_announcement_id_user_id_emoji_key | UNIQUE | `UNIQUE (announcement_id, user_id, emoji)` |  |  | sim |
| announcement_reactions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| announcement_reactions_announcement_id_user_id_emoji_key | btree | {announcement_id,user_id,emoji} | sim | sim |  | `CREATE UNIQUE INDEX announcement_reactions_announcement_id_user_id_emoji_key ON public.announcement_reactions USING btree (announcement_id, user_id, emoji)` |
| announcement_reactions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX announcement_reactions_pkey ON public.announcement_reactions USING btree (id)` |


## Policies (RLS)

### `Everyone can view reactions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `true` |
| WITH CHECK |  |

### `Users can react to announcements`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
