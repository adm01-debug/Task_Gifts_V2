# public.user_devices

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
| 3 | `device_fingerprint` | `text` | não |  |  |  |
| 4 | `ip_address` | `inet` | sim |  |  |  |
| 5 | `user_agent` | `text` | sim |  |  |  |
| 6 | `browser` | `text` | sim |  |  |  |
| 7 | `os` | `text` | sim |  |  |  |
| 8 | `device_type` | `text` | sim | `'desktop'::text` |  |  |
| 9 | `is_trusted` | `boolean` | sim | `false` |  |  |
| 10 | `first_seen_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `last_seen_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `location_country` | `text` | sim |  |  |  |
| 13 | `location_city` | `text` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `revoked_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `revoked_reason` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_devices_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_devices_user_id_device_fingerprint_key | UNIQUE | `UNIQUE (user_id, device_fingerprint)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.new_device_alerts | new_device_alerts_device_id_fkey | {device_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_devices_fingerprint | btree | {device_fingerprint} | não | sim |  | `CREATE INDEX idx_user_devices_fingerprint ON public.user_devices USING btree (device_fingerprint)` |
| idx_user_devices_user_id | btree | {user_id} | não | sim |  | `CREATE INDEX idx_user_devices_user_id ON public.user_devices USING btree (user_id)` |
| user_devices_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX user_devices_pkey ON public.user_devices USING btree (id)` |
| user_devices_user_id_device_fingerprint_key | btree | {user_id,device_fingerprint} | sim | sim |  | `CREATE UNIQUE INDEX user_devices_user_id_device_fingerprint_key ON public.user_devices USING btree (user_id, device_fingerprint)` |


## Policies (RLS)

### `Authenticated insert devices`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(user_id = auth.uid())` |

### `Users can update their own devices`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own devices`

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
