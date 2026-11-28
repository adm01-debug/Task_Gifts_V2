# public.new_device_alerts

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
| 3 | `device_id` | `uuid` | sim |  |  |  |
| 4 | `ip_address` | `inet` | sim |  |  |  |
| 5 | `user_agent` | `text` | sim |  |  |  |
| 6 | `is_read` | `boolean` | sim | `false` |  |  |
| 7 | `is_acknowledged` | `boolean` | sim | `false` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| new_device_alerts_device_id_fkey | FOREIGN KEY | `FOREIGN KEY (device_id) REFERENCES user_devices(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| new_device_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_new_device_alerts_device_id | btree | {device_id} | não | sim |  | `CREATE INDEX idx_new_device_alerts_device_id ON public.new_device_alerts USING btree (device_id)` |
| idx_new_device_alerts_unread | btree | {user_id,is_read} | não | sim | `(is_read = false)` | `CREATE INDEX idx_new_device_alerts_unread ON public.new_device_alerts USING btree (user_id, is_read) WHERE (is_read = false)` |
| idx_new_device_alerts_user_id | btree | {user_id} | não | sim |  | `CREATE INDEX idx_new_device_alerts_user_id ON public.new_device_alerts USING btree (user_id)` |
| new_device_alerts_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX new_device_alerts_pkey ON public.new_device_alerts USING btree (id)` |


## Policies (RLS)

### `Authenticated insert device alerts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(user_id = auth.uid())` |

### `Users can update their own alerts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own alerts`

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

_nenhum_
