# public.engagement_action_playbooks

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
| 2 | `pillar` | `climate_pillar` | não |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `why_reason` | `text` | não |  |  |  |
| 5 | `how_method` | `text` | não |  |  |  |
| 6 | `priority` | `text` | não | `'medium'::text` |  |  |
| 7 | `duration_days` | `integer` | não | `30` |  |  |
| 8 | `order_index` | `integer` | não | `0` |  |  |
| 9 | `is_active` | `boolean` | não | `true` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| engagement_action_playbooks_duration_days_check | CHECK | `CHECK (duration_days > 0)` |  |  | sim |
| engagement_action_playbooks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| engagement_action_playbooks_priority_check | CHECK | `CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| engagement_action_playbooks_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX engagement_action_playbooks_pkey ON public.engagement_action_playbooks USING btree (id)` |
| idx_engagement_action_playbooks_pillar | btree | {pillar,is_active} | não | sim |  | `CREATE INDEX idx_engagement_action_playbooks_pillar ON public.engagement_action_playbooks USING btree (pillar, is_active)` |
| idx_playbooks_pillar | btree | {pillar,order_index} | não | sim |  | `CREATE INDEX idx_playbooks_pillar ON public.engagement_action_playbooks USING btree (pillar, order_index)` |
| uq_playbooks_pillar_title | btree | {pillar,title} | sim | sim |  | `CREATE UNIQUE INDEX uq_playbooks_pillar_title ON public.engagement_action_playbooks USING btree (pillar, title)` |


## Policies (RLS)

### `engagement_action_playbooks_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `engagement_action_playbooks_manager_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(is_active OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| engagement_action_playbooks_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
