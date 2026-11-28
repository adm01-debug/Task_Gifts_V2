# public.ip_whitelist

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `ip_address` | `inet` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `is_active` | `boolean` | sim | `true` |  |  |
| 5 | `created_by` | `uuid` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `expires_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ip_whitelist_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| ip_whitelist_ip_address_key | UNIQUE | `UNIQUE (ip_address)` |  |  | sim |
| ip_whitelist_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_ip_whitelist_active | btree | {is_active} | não | sim | `(is_active = true)` | `CREATE INDEX idx_ip_whitelist_active ON public.ip_whitelist USING btree (is_active) WHERE (is_active = true)` |
| idx_ip_whitelist_created_by | btree | {created_by} | não | sim |  | `CREATE INDEX idx_ip_whitelist_created_by ON public.ip_whitelist USING btree (created_by)` |
| ip_whitelist_ip_address_key | btree | {ip_address} | sim | sim |  | `CREATE UNIQUE INDEX ip_whitelist_ip_address_key ON public.ip_whitelist USING btree (ip_address)` |
| ip_whitelist_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX ip_whitelist_pkey ON public.ip_whitelist USING btree (id)` |


## Policies (RLS)

### `Admins can delete IP whitelist`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can insert IP whitelist`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins can update IP whitelist`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can view IP whitelist`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_ip_whitelist_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
