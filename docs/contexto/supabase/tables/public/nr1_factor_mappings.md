# public.nr1_factor_mappings

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
| 2 | `category_id` | `uuid` | não |  |  |  |
| 3 | `factor_id` | `uuid` | não |  |  |  |
| 4 | `weight` | `numeric` | não | `1` |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| nr1_factor_mappings_category_id_fkey | FOREIGN KEY | `FOREIGN KEY (category_id) REFERENCES nr1_risk_categories(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| nr1_factor_mappings_factor_id_fkey | FOREIGN KEY | `FOREIGN KEY (factor_id) REFERENCES engagement_factors(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| nr1_factor_mappings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| nr1_factor_mappings_unique | UNIQUE | `UNIQUE (category_id, factor_id)` |  |  | sim |
| nr1_factor_mappings_weight_check | CHECK | `CHECK (weight > 0::numeric)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_nr1_map_category | btree | {category_id} | não | sim |  | `CREATE INDEX idx_nr1_map_category ON public.nr1_factor_mappings USING btree (category_id)` |
| idx_nr1_map_factor | btree | {factor_id} | não | sim |  | `CREATE INDEX idx_nr1_map_factor ON public.nr1_factor_mappings USING btree (factor_id)` |
| nr1_factor_mappings_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX nr1_factor_mappings_pkey ON public.nr1_factor_mappings USING btree (id)` |
| nr1_factor_mappings_unique | btree | {category_id,factor_id} | sim | sim |  | `CREATE UNIQUE INDEX nr1_factor_mappings_unique ON public.nr1_factor_mappings USING btree (category_id, factor_id)` |


## Policies (RLS)

### `nr1_factor_mappings_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `nr1_factor_mappings_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
