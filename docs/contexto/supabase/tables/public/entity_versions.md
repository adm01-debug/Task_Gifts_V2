# public.entity_versions

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
| 3 | `entity_id` | `uuid` | não |  |  |  |
| 4 | `version_number` | `integer` | não |  |  |  |
| 5 | `data` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 6 | `changed_by` | `uuid` | sim |  |  |  |
| 7 | `changed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `change_summary` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| entity_versions_changed_by_fkey | FOREIGN KEY | `FOREIGN KEY (changed_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| entity_versions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| unique_entity_version | UNIQUE | `UNIQUE (entity_type, entity_id, version_number)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| entity_versions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX entity_versions_pkey ON public.entity_versions USING btree (id)` |
| idx_versions_date | btree | {changed_at} | não | sim |  | `CREATE INDEX idx_versions_date ON public.entity_versions USING btree (changed_at DESC)` |
| idx_versions_entity | btree | {entity_type,entity_id} | não | sim |  | `CREATE INDEX idx_versions_entity ON public.entity_versions USING btree (entity_type, entity_id)` |
| unique_entity_version | btree | {entity_type,entity_id,version_number} | sim | sim |  | `CREATE UNIQUE INDEX unique_entity_version ON public.entity_versions USING btree (entity_type, entity_id, version_number)` |


## Policies (RLS)

### `Users can insert versions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `((auth.uid() = changed_by) OR (changed_by IS NULL))` |

### `Users can view versions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((changed_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
