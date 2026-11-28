# public.ai_coach_messages

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
| 3 | `role` | `text` | não |  |  |  |
| 4 | `content` | `text` | não |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ai_coach_messages_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| ai_coach_messages_role_check | CHECK | `CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| ai_coach_messages_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX ai_coach_messages_pkey ON public.ai_coach_messages USING btree (id)` |
| idx_ai_coach_messages_created_at | btree | {user_id,created_at} | não | sim |  | `CREATE INDEX idx_ai_coach_messages_created_at ON public.ai_coach_messages USING btree (user_id, created_at DESC)` |
| idx_ai_coach_messages_user_id | btree | {user_id} | não | sim |  | `CREATE INDEX idx_ai_coach_messages_user_id ON public.ai_coach_messages USING btree (user_id)` |


## Policies (RLS)

### `Users can delete their own messages`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can insert their own messages`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can view their own messages`

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
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
