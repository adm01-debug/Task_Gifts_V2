# public.user_challenges

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
| 3 | `type` | `text` | não |  |  |  |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `icon` | `text` | sim |  |  |  |
| 7 | `target` | `integer` | não | `1` |  |  |
| 8 | `current` | `integer` | não | `0` |  |  |
| 9 | `xp_reward` | `integer` | não | `0` |  |  |
| 10 | `coin_reward` | `integer` | não | `0` |  |  |
| 11 | `difficulty` | `text` | não | `'easy'::text` |  |  |
| 12 | `expires_at` | `timestamp with time zone` | não |  |  |  |
| 13 | `is_active` | `boolean` | não | `true` |  |  |
| 14 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_challenges_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_challenges_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_challenges_user_active | btree | {user_id,is_active} | não | sim |  | `CREATE INDEX idx_user_challenges_user_active ON public.user_challenges USING btree (user_id, is_active)` |
| user_challenges_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX user_challenges_pkey ON public.user_challenges USING btree (id)` |


## Policies (RLS)

### `Users can insert their own challenges`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update their own challenges`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own challenges`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_user_challenges | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
