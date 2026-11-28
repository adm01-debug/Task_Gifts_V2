# public.geo_blocking_rules

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
| 2 | `country_code` | `character varying(2)` | não |  |  |  |
| 3 | `country_name` | `character varying(100)` | não |  |  |  |
| 4 | `is_allowed` | `boolean` | não | `true` |  |  |
| 5 | `created_by` | `uuid` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| geo_blocking_rules_country_code_key | UNIQUE | `UNIQUE (country_code)` |  |  | sim |
| geo_blocking_rules_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| geo_blocking_rules_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| geo_blocking_rules_country_code_key | btree | {country_code} | sim | sim |  | `CREATE UNIQUE INDEX geo_blocking_rules_country_code_key ON public.geo_blocking_rules USING btree (country_code)` |
| geo_blocking_rules_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX geo_blocking_rules_pkey ON public.geo_blocking_rules USING btree (id)` |
| idx_geo_blocking_rules_allowed | btree | {is_allowed} | não | sim |  | `CREATE INDEX idx_geo_blocking_rules_allowed ON public.geo_blocking_rules USING btree (is_allowed)` |
| idx_geo_blocking_rules_created_by | btree | {created_by} | não | sim |  | `CREATE INDEX idx_geo_blocking_rules_created_by ON public.geo_blocking_rules USING btree (created_by)` |


## Policies (RLS)

### `Admins podem gerenciar regras de geo blocking`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Todos podem ver regras de geo blocking`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_geo_blocking_rules_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
