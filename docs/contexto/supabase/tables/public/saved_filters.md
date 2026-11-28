# public.saved_filters

> Filtros salvos por usuários para diferentes entidades

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
| 3 | `entity_type` | `text` | não |  |  | Tipo de entidade (ex: produtos, pedidos, colaboradores) |
| 4 | `name` | `text` | não |  |  |  |
| 5 | `filters` | `jsonb` | não | `'{}'::jsonb` |  | Configuração do filtro em JSON |
| 6 | `is_default` | `boolean` | não | `false` |  | Se true, este filtro é aplicado automaticamente ao abrir a página |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| saved_filters_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| saved_filters_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| unique_filter_name_per_user_entity | UNIQUE | `UNIQUE (user_id, entity_type, name)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_saved_filters_default | btree | {user_id,entity_type,is_default} | não | sim | `(is_default = true)` | `CREATE INDEX idx_saved_filters_default ON public.saved_filters USING btree (user_id, entity_type, is_default) WHERE (is_default = true)` |
| idx_saved_filters_entity_type | btree | {entity_type} | não | sim |  | `CREATE INDEX idx_saved_filters_entity_type ON public.saved_filters USING btree (entity_type)` |
| idx_saved_filters_user_entity | btree | {user_id,entity_type} | não | sim |  | `CREATE INDEX idx_saved_filters_user_entity ON public.saved_filters USING btree (user_id, entity_type)` |
| idx_saved_filters_user_id | btree | {user_id} | não | sim |  | `CREATE INDEX idx_saved_filters_user_id ON public.saved_filters USING btree (user_id)` |
| saved_filters_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX saved_filters_pkey ON public.saved_filters USING btree (id)` |
| unique_filter_name_per_user_entity | btree | {user_id,entity_type,name} | sim | sim |  | `CREATE UNIQUE INDEX unique_filter_name_per_user_entity ON public.saved_filters USING btree (user_id, entity_type, name)` |


## Policies (RLS)

### `Users can delete own filters`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can insert own filters`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update own filters`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can view own filters`

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
| trigger_saved_filters_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_saved_filters_updated_at |
| trigger_single_default_filter | BEFORE | INSERT OR UPDATE | ROW | enabled | public.ensure_single_default_filter |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
