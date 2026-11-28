# public.climate_benchmarks

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
| 3 | `industry` | `text` | não | `'general'::text` |  |  |
| 4 | `company_size` | `text` | não | `'all'::text` |  |  |
| 5 | `region` | `text` | não | `'brazil'::text` |  |  |
| 6 | `average_score` | `numeric(5,2)` | não |  |  |  |
| 7 | `top_quartile_score` | `numeric(5,2)` | não |  |  |  |
| 8 | `top_10_percent_score` | `numeric(5,2)` | não |  |  |  |
| 9 | `sample_size` | `integer` | não | `0` |  |  |
| 10 | `period` | `text` | não |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| climate_benchmarks_company_size_check | CHECK | `CHECK (company_size = ANY (ARRAY['small'::text, 'medium'::text, 'large'::text, 'enterprise'::text, 'all'::text]))` |  |  | sim |
| climate_benchmarks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| climate_benchmarks_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX climate_benchmarks_pkey ON public.climate_benchmarks USING btree (id)` |
| climate_benchmarks_scope_uidx | btree | {pillar,industry,company_size,region,period} | sim | sim |  | `CREATE UNIQUE INDEX climate_benchmarks_scope_uidx ON public.climate_benchmarks USING btree (pillar, industry, company_size, region, period)` |
| idx_climate_benchmarks_segment | btree | {region,industry,company_size,pillar,period} | não | sim |  | `CREATE INDEX idx_climate_benchmarks_segment ON public.climate_benchmarks USING btree (region, industry, company_size, pillar, period DESC)` |


## Policies (RLS)

### `Admins manage benchmarks`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view benchmarks`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
