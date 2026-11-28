# public.opinion_supports

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
| 2 | `opinion_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| opinion_supports_opinion_id_fkey | FOREIGN KEY | `FOREIGN KEY (opinion_id) REFERENCES opinions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| opinion_supports_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| opinion_supports_unique | UNIQUE | `UNIQUE (opinion_id, user_id)` |  |  | sim |
| opinion_supports_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_opinion_supports_opinion | btree | {opinion_id} | não | sim |  | `CREATE INDEX idx_opinion_supports_opinion ON public.opinion_supports USING btree (opinion_id)` |
| opinion_supports_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX opinion_supports_pkey ON public.opinion_supports USING btree (id)` |
| opinion_supports_unique | btree | {opinion_id,user_id} | sim | sim |  | `CREATE UNIQUE INDEX opinion_supports_unique ON public.opinion_supports USING btree (opinion_id, user_id)` |


## Policies (RLS)

### `opinion_supports_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `true` |
| WITH CHECK |  |

### `opinion_supports_user_own`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK | `(user_id = auth.uid())` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
