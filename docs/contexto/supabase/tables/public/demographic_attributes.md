# public.demographic_attributes

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
| usada por views | public.demographic_values_panel |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `name` | `text` | não |  |  |  |
| 3 | `name_en` | `text` | sim |  |  |  |
| 4 | `name_es` | `text` | sim |  |  |  |
| 5 | `attribute_type` | `text` | não | `'single_select'::text` |  |  |
| 6 | `options` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 7 | `is_required` | `boolean` | não | `false` |  |  |
| 8 | `is_visible_in_reports` | `boolean` | não | `true` |  |  |
| 9 | `is_restricted` | `boolean` | não | `false` |  |  |
| 10 | `allow_prefer_not_answer` | `boolean` | não | `true` |  |  |
| 11 | `order_index` | `integer` | não | `0` |  |  |
| 12 | `is_active` | `boolean` | não | `true` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| demographic_attributes_attribute_type_check | CHECK | `CHECK (attribute_type = ANY (ARRAY['text'::text, 'single_select'::text, 'multi_select'::text, 'number'::text, 'date'::text, 'calculated'::text]))` |  |  | sim |
| demographic_attributes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.user_demographic_values | user_demographic_values_attribute_id_fkey | {attribute_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| demographic_attributes_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX demographic_attributes_pkey ON public.demographic_attributes USING btree (id)` |


## Policies (RLS)

### `Admins can manage demographic attributes`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view active demographic attributes`

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
| update_demographic_attributes_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
