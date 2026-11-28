# public.rate_limit_rules

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `name` | `text` | não |  |  |  |
| 3 | `endpoint_pattern` | `text` | não |  |  |  |
| 4 | `requests_per_minute` | `integer` | não | `60` |  |  |
| 5 | `requests_per_hour` | `integer` | não | `1000` |  |  |
| 6 | `block_duration_minutes` | `integer` | não | `15` |  |  |
| 7 | `is_active` | `boolean` | não | `true` |  |  |
| 8 | `applies_to_authenticated` | `boolean` | não | `true` |  |  |
| 9 | `applies_to_anonymous` | `boolean` | não | `true` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rate_limit_rules_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| rate_limit_rules_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX rate_limit_rules_pkey ON public.rate_limit_rules USING btree (id)` |


## Policies (RLS)

### `Admins can manage rate_limit_rules`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
