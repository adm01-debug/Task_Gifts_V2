# public.custom_quests

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
| 2 | `title` | `text` | não |  |  |  |
| 3 | `description` | `text` | não |  |  |  |
| 4 | `icon` | `text` | não | `'📚'::text` |  |  |
| 5 | `difficulty` | `quest_difficulty` | não | `'medium'::quest_difficulty` |  |  |
| 6 | `xp_reward` | `integer` | não | `100` |  |  |
| 7 | `coin_reward` | `integer` | não | `50` |  |  |
| 8 | `status` | `quest_status` | não | `'draft'::quest_status` |  |  |
| 9 | `department_id` | `uuid` | sim |  |  |  |
| 10 | `created_by` | `uuid` | não |  |  |  |
| 11 | `deadline_days` | `integer` | sim |  |  |  |
| 12 | `max_participants` | `integer` | sim |  |  |  |
| 13 | `requirements` | `text[]` | sim |  |  |  |
| 14 | `tags` | `text[]` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| custom_quests_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| custom_quests_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.quest_assignments | quest_assignments_quest_id_fkey | {quest_id} | CASCADE |
| public.quest_steps | quest_steps_quest_id_fkey | {quest_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| custom_quests_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX custom_quests_pkey ON public.custom_quests USING btree (id)` |
| idx_custom_quests_department | btree | {department_id} | não | sim |  | `CREATE INDEX idx_custom_quests_department ON public.custom_quests USING btree (department_id)` |
| idx_custom_quests_status | btree | {status} | não | sim |  | `CREATE INDEX idx_custom_quests_status ON public.custom_quests USING btree (status)` |


## Policies (RLS)

### `Everyone can view active quests`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((status = 'active'::quest_status) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Managers and admins can create quests`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |

### `Managers and admins can delete their quests`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Managers and admins can update their quests`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_custom_quests_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
