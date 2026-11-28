# public.external_tasks

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
| 2 | `api_key_id` | `uuid` | sim |  |  |  |
| 3 | `external_id` | `text` | não |  |  |  |
| 4 | `external_system` | `text` | não |  |  |  |
| 5 | `user_email` | `text` | não |  |  |  |
| 6 | `user_id` | `uuid` | sim |  |  |  |
| 7 | `title` | `text` | não |  |  |  |
| 8 | `description` | `text` | sim |  |  |  |
| 9 | `category` | `text` | sim |  |  |  |
| 10 | `priority` | `text` | sim | `'medium'::text` |  |  |
| 11 | `status` | `text` | não | `'pending'::text` |  |  |
| 12 | `xp_reward` | `integer` | não | `50` |  |  |
| 13 | `coin_reward` | `integer` | não | `25` |  |  |
| 14 | `xp_penalty_late` | `integer` | não | `25` |  |  |
| 15 | `xp_penalty_rework` | `integer` | não | `50` |  |  |
| 16 | `deadline_at` | `timestamp with time zone` | sim |  |  |  |
| 17 | `started_at` | `timestamp with time zone` | sim |  |  |  |
| 18 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 20 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 21 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| external_tasks_api_key_id_fkey | FOREIGN KEY | `FOREIGN KEY (api_key_id) REFERENCES external_api_keys(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| external_tasks_external_system_external_id_key | UNIQUE | `UNIQUE (external_system, external_id)` |  |  | sim |
| external_tasks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| external_tasks_external_system_external_id_key | btree | {external_system,external_id} | sim | sim |  | `CREATE UNIQUE INDEX external_tasks_external_system_external_id_key ON public.external_tasks USING btree (external_system, external_id)` |
| external_tasks_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX external_tasks_pkey ON public.external_tasks USING btree (id)` |
| idx_external_tasks_api_key_id | btree | {api_key_id} | não | sim |  | `CREATE INDEX idx_external_tasks_api_key_id ON public.external_tasks USING btree (api_key_id)` |
| idx_external_tasks_status | btree | {status} | não | sim |  | `CREATE INDEX idx_external_tasks_status ON public.external_tasks USING btree (status)` |


## Policies (RLS)

### `Admins manage external tasks`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Users can view own external tasks`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(user_id = auth.uid())` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_external_tasks_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
