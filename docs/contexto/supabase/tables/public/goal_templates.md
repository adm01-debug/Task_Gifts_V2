# public.goal_templates

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
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `goal_type` | `text` | não | `'personal'::text` |  |  |
| 5 | `priority` | `text` | não | `'medium'::text` |  |  |
| 6 | `xp_reward` | `integer` | não | `100` |  |  |
| 7 | `coin_reward` | `integer` | não | `50` |  |  |
| 8 | `created_by` | `uuid` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| goal_templates_coin_reward_check | CHECK | `CHECK (coin_reward >= 0)` |  |  | sim |
| goal_templates_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| goal_templates_goal_type_check | CHECK | `CHECK (goal_type = ANY (ARRAY['personal'::text, 'team'::text, 'company'::text]))` |  |  | sim |
| goal_templates_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| goal_templates_priority_check | CHECK | `CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))` |  |  | sim |
| goal_templates_xp_reward_check | CHECK | `CHECK (xp_reward >= 0)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| goal_templates_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX goal_templates_pkey ON public.goal_templates USING btree (id)` |


## Policies (RLS)

### `goal_templates_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(EXISTS ( SELECT 1    FROM user_roles ur   WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role))))` |
| WITH CHECK |  |

### `goal_templates_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM user_roles ur   WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role))))` |

### `goal_templates_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `true` |
| WITH CHECK |  |

### `goal_templates_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(EXISTS ( SELECT 1    FROM user_roles ur   WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM user_roles ur   WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_goal_templates_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_goal_templates_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
