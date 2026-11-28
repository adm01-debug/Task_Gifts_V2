# public.prediction_options

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
| 2 | `market_id` | `uuid` | não |  |  |  |
| 3 | `label` | `text` | não |  |  |  |
| 4 | `sort_order` | `integer` | não | `0` |  |  |
| 5 | `pool` | `integer` | não | `0` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| prediction_options_market_id_fkey | FOREIGN KEY | `FOREIGN KEY (market_id) REFERENCES prediction_markets(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| prediction_options_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| prediction_options_pool_check | CHECK | `CHECK (pool >= 0)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.prediction_markets | prediction_markets_winning_option_fk | {winning_option_id} | SET NULL |
| public.prediction_stakes | prediction_stakes_option_id_fkey | {option_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_prediction_options_market | btree | {market_id,sort_order} | não | sim |  | `CREATE INDEX idx_prediction_options_market ON public.prediction_options USING btree (market_id, sort_order)` |
| prediction_options_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX prediction_options_pkey ON public.prediction_options USING btree (id)` |


## Policies (RLS)

### `prediction_options_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `prediction_options_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(EXISTS ( SELECT 1    FROM prediction_markets pm   WHERE ((pm.id = prediction_options.market_id) AND ((pm.status <> 'draft'::text) OR has_role(auth.uid(), 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
