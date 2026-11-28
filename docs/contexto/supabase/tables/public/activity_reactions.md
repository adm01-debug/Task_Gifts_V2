# public.activity_reactions

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
| 2 | `activity_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `emoji` | `text` | não |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| activity_reactions_activity_id_user_id_emoji_key | UNIQUE | `UNIQUE (activity_id, user_id, emoji)` |  |  | sim |
| activity_reactions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| activity_reactions_activity_id_user_id_emoji_key | btree | {activity_id,user_id,emoji} | sim | sim |  | `CREATE UNIQUE INDEX activity_reactions_activity_id_user_id_emoji_key ON public.activity_reactions USING btree (activity_id, user_id, emoji)` |
| activity_reactions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX activity_reactions_pkey ON public.activity_reactions USING btree (id)` |


## Policies (RLS)

### `Authenticated users can add reactions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Everyone can view reactions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `true` |
| WITH CHECK |  |

### `Users can remove their own reactions`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
