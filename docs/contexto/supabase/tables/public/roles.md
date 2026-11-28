# public.roles

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
| 2 | `key` | `text` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `level` | `integer` | sim | `0` |  |  |
| 6 | `is_system` | `boolean` | sim | `false` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `is_active` | `boolean` | não | `true` |  |  |
| 9 | `color` | `text` | sim | `'#6366f1'::text` |  |  |
| 10 | `icon` | `text` | sim | `'Shield'::text` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| roles_key_key | UNIQUE | `UNIQUE (key)` |  |  | sim |
| roles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.role_permissions | role_permissions_role_id_fkey | {role_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| roles_key_key | btree | {key} | sim | sim |  | `CREATE UNIQUE INDEX roles_key_key ON public.roles USING btree (key)` |
| roles_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (id)` |


## Policies (RLS)

### `roles_select`

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

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
