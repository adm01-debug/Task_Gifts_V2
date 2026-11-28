# public.blocked_ips

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
| 2 | `ip_address` | `inet` | não |  |  |  |
| 3 | `reason` | `text` | não |  |  |  |
| 4 | `block_type` | `text` | não | `'rate_limit'::text` |  |  |
| 5 | `blocked_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `blocked_by` | `uuid` | sim |  |  |  |
| 7 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `is_permanent` | `boolean` | não | `false` |  |  |
| 9 | `violation_count` | `integer` | não | `1` |  |  |
| 10 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| blocked_ips_block_type_check | CHECK | `CHECK (block_type = ANY (ARRAY['rate_limit'::text, 'manual'::text, 'suspicious'::text, 'brute_force'::text]))` |  |  | sim |
| blocked_ips_blocked_by_fkey | FOREIGN KEY | `FOREIGN KEY (blocked_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| blocked_ips_ip_address_key | UNIQUE | `UNIQUE (ip_address)` |  |  | sim |
| blocked_ips_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| blocked_ips_ip_address_key | btree | {ip_address} | sim | sim |  | `CREATE UNIQUE INDEX blocked_ips_ip_address_key ON public.blocked_ips USING btree (ip_address)` |
| blocked_ips_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX blocked_ips_pkey ON public.blocked_ips USING btree (id)` |
| idx_blocked_ips_blocked_by | btree | {blocked_by} | não | sim |  | `CREATE INDEX idx_blocked_ips_blocked_by ON public.blocked_ips USING btree (blocked_by)` |
| idx_blocked_ips_expires | btree | {expires_at} | não | sim | `(expires_at IS NOT NULL)` | `CREATE INDEX idx_blocked_ips_expires ON public.blocked_ips USING btree (expires_at) WHERE (expires_at IS NOT NULL)` |
| idx_blocked_ips_ip_expires | btree | {ip_address,expires_at} | não | sim |  | `CREATE INDEX idx_blocked_ips_ip_expires ON public.blocked_ips USING btree (ip_address, expires_at)` |


## Policies (RLS)

### `Admins can manage blocked_ips`

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

_nenhum_
