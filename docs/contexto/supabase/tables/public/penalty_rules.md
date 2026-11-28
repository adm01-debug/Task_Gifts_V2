# public.penalty_rules

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `penalty_type` | `text` | não |  |  |  |
| 5 | `trigger_condition` | `text` | não |  |  |  |
| 6 | `xp_penalty_percent` | `integer` | sim | `50` |  |  |
| 7 | `xp_penalty_fixed` | `integer` | sim | `0` |  |  |
| 8 | `coin_penalty_percent` | `integer` | sim | `0` |  |  |
| 9 | `coin_penalty_fixed` | `integer` | sim | `0` |  |  |
| 10 | `is_escalating` | `boolean` | não | `false` |  |  |
| 11 | `escalation_multiplier` | `numeric(3,2)` | sim | `1.5` |  |  |
| 12 | `is_active` | `boolean` | não | `true` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| penalty_rules_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| penalty_rules_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX penalty_rules_pkey ON public.penalty_rules USING btree (id)` |


## Policies (RLS)

### `Admins can manage penalty rules`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view active rules`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_penalty_rules_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
