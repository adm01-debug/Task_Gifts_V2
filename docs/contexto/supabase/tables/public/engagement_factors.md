# public.engagement_factors

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
| 5 | `pillar` | `climate_pillar` | não |  |  |  |
| 6 | `order_index` | `integer` | não | `0` |  |  |
| 7 | `is_active` | `boolean` | não | `true` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| engagement_factors_key_key | UNIQUE | `UNIQUE (key)` |  |  | sim |
| engagement_factors_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.action_plans | action_plans_engagement_factor_id_fkey | {engagement_factor_id} | SET NULL |
| public.engagement_question_pool | engagement_question_pool_factor_id_fkey | {factor_id} | SET NULL |
| public.nr1_factor_mappings | nr1_factor_mappings_factor_id_fkey | {factor_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| engagement_factors_key_key | btree | {key} | sim | sim |  | `CREATE UNIQUE INDEX engagement_factors_key_key ON public.engagement_factors USING btree (key)` |
| engagement_factors_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX engagement_factors_pkey ON public.engagement_factors USING btree (id)` |
| idx_engagement_factors_pillar | btree | {pillar} | não | sim |  | `CREATE INDEX idx_engagement_factors_pillar ON public.engagement_factors USING btree (pillar)` |


## Policies (RLS)

### `engagement_factors_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `engagement_factors_user_select`

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
| engagement_factors_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
