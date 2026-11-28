# public.quest_steps

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
| 2 | `quest_id` | `uuid` | não |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `order_index` | `integer` | não | `0` |  |  |
| 6 | `xp_reward` | `integer` | não | `25` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| quest_steps_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| quest_steps_quest_id_fkey | FOREIGN KEY | `FOREIGN KEY (quest_id) REFERENCES custom_quests(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_quest_steps_quest | btree | {quest_id} | não | sim |  | `CREATE INDEX idx_quest_steps_quest ON public.quest_steps USING btree (quest_id)` |
| quest_steps_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX quest_steps_pkey ON public.quest_steps USING btree (id)` |


## Policies (RLS)

### `Everyone can view steps of active quests`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM custom_quests q   WHERE ((q.id = quest_steps.quest_id) AND (q.status = 'active'::quest_status))))` |
| WITH CHECK |  |

### `Quest creators can manage steps`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(EXISTS ( SELECT 1    FROM custom_quests q   WHERE ((q.id = quest_steps.quest_id) AND ((q.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
