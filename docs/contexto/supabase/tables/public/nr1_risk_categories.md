# public.nr1_risk_categories

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
| 2 | `key` | `text` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `legal_reference` | `text` | sim |  |  |  |
| 6 | `severity_weight` | `numeric` | não | `1` |  |  |
| 7 | `order_index` | `integer` | não | `0` |  |  |
| 8 | `is_active` | `boolean` | não | `true` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| nr1_risk_categories_key_key | UNIQUE | `UNIQUE (key)` |  |  | sim |
| nr1_risk_categories_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| nr1_risk_categories_severity_weight_check | CHECK | `CHECK (severity_weight >= 1::numeric AND severity_weight <= 3::numeric)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.action_plans | action_plans_nr1_category_id_fkey | {nr1_category_id} | SET NULL |
| public.nr1_factor_mappings | nr1_factor_mappings_category_id_fkey | {category_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| nr1_risk_categories_key_key | btree | {key} | sim | sim |  | `CREATE UNIQUE INDEX nr1_risk_categories_key_key ON public.nr1_risk_categories USING btree (key)` |
| nr1_risk_categories_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX nr1_risk_categories_pkey ON public.nr1_risk_categories USING btree (id)` |


## Policies (RLS)

### `nr1_risk_categories_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `nr1_risk_categories_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| nr1_risk_categories_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
