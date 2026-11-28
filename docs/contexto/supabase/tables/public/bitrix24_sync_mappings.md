# public.bitrix24_sync_mappings

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
| 2 | `entity_type` | `text` | não |  |  |  |
| 3 | `local_id` | `text` | não |  |  |  |
| 4 | `bitrix_id` | `text` | não |  |  |  |
| 5 | `bitrix_entity_type` | `text` | não |  |  |  |
| 6 | `sync_status` | `text` | não | `'synced'::text` |  |  |
| 7 | `last_synced_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `metadata` | `jsonb` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bitrix24_sync_mappings_entity_type_local_id_bitrix_entity_t_key | UNIQUE | `UNIQUE (entity_type, local_id, bitrix_entity_type)` |  |  | sim |
| bitrix24_sync_mappings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bitrix24_sync_mappings_entity_type_local_id_bitrix_entity_t_key | btree | {entity_type,local_id,bitrix_entity_type} | sim | sim |  | `CREATE UNIQUE INDEX bitrix24_sync_mappings_entity_type_local_id_bitrix_entity_t_key ON public.bitrix24_sync_mappings USING btree (entity_type, local_id, bitrix_entity_type)` |
| bitrix24_sync_mappings_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX bitrix24_sync_mappings_pkey ON public.bitrix24_sync_mappings USING btree (id)` |
| idx_bitrix24_sync_bitrix_id | btree | {bitrix_id} | não | sim |  | `CREATE INDEX idx_bitrix24_sync_bitrix_id ON public.bitrix24_sync_mappings USING btree (bitrix_id)` |
| idx_bitrix24_sync_status | btree | {sync_status} | não | sim |  | `CREATE INDEX idx_bitrix24_sync_status ON public.bitrix24_sync_mappings USING btree (sync_status)` |


## Policies (RLS)

### `Admins and managers can view sync mappings`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::app_role, 'manager'::app_role])))))` |
| WITH CHECK |  |

### `Admins can manage sync mappings`

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
| update_bitrix24_sync_mappings_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
