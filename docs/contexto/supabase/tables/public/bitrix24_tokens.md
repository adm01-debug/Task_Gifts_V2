# public.bitrix24_tokens

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `domain` | `text` | não |  |  |  |
| 4 | `access_token` | `text` | não |  |  |  |
| 5 | `refresh_token` | `text` | não |  |  |  |
| 6 | `expires_at` | `timestamp with time zone` | não |  |  |  |
| 7 | `member_id` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bitrix24_tokens_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| bitrix24_tokens_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bitrix24_tokens_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX bitrix24_tokens_pkey ON public.bitrix24_tokens USING btree (id)` |
| bitrix24_tokens_user_id_key | btree | {user_id} | sim | sim |  | `CREATE UNIQUE INDEX bitrix24_tokens_user_id_key ON public.bitrix24_tokens USING btree (user_id)` |


## Policies (RLS)

### `Admins can manage bitrix tokens`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_bitrix24_tokens_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
