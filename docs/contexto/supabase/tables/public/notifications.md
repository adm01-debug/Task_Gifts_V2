# public.notifications

> Notificacoes in-app por usuario — suporta push, email e in-app com controle de leitura.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `type` | `text` | não | `'info'::text` |  |  |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `message` | `text` | sim |  |  |  |
| 6 | `data` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 7 | `read` | `boolean` | não | `false` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| notifications_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_notifications_created_at | btree | {created_at} | não | sim |  | `CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC)` |
| idx_notifications_security_digest | btree | {created_at} | não | sim | `(type = 'security_weekly_digest'::text)` | `CREATE INDEX idx_notifications_security_digest ON public.notifications USING btree (created_at DESC) WHERE (type = 'security_weekly_digest'::text)` |
| idx_notifications_user_timeline | btree | {user_id,created_at} | não | sim |  | `CREATE INDEX idx_notifications_user_timeline ON public.notifications USING btree (user_id, created_at DESC)` |
| idx_notifications_user_unread | btree | {user_id,read} | não | sim | `(read = false)` | `CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, read) WHERE (read = false)` |
| notifications_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id)` |
| notifications_user_type_data_unique | btree | {user_id,type} | sim | sim |  | `CREATE UNIQUE INDEX notifications_user_type_data_unique ON public.notifications USING btree (user_id, type, ((data)::text))` |


## Policies (RLS)

### `Authenticated insert notifications`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |

### `Users can delete their own notifications`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can update their own notifications`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own notifications`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
