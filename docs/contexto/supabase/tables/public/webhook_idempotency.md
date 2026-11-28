# public.webhook_idempotency

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
| 2 | `idempotency_key` | `text` | não |  |  |  |
| 3 | `provider` | `text` | não |  |  |  |
| 4 | `status` | `text` | não |  |  |  |
| 5 | `response_body` | `jsonb` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `expires_at` | `timestamp with time zone` | sim | `(now() + '7 days'::interval)` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| webhook_idempotency_idempotency_key_key | UNIQUE | `UNIQUE (idempotency_key)` |  |  | sim |
| webhook_idempotency_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| webhook_idempotency_expires_at_idx | btree | {expires_at} | não | sim |  | `CREATE INDEX webhook_idempotency_expires_at_idx ON public.webhook_idempotency USING btree (expires_at)` |
| webhook_idempotency_idempotency_key_key | btree | {idempotency_key} | sim | sim |  | `CREATE UNIQUE INDEX webhook_idempotency_idempotency_key_key ON public.webhook_idempotency USING btree (idempotency_key)` |
| webhook_idempotency_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX webhook_idempotency_pkey ON public.webhook_idempotency USING btree (id)` |
| webhook_idempotency_provider_created_idx | btree | {provider,created_at} | não | sim |  | `CREATE INDEX webhook_idempotency_provider_created_idx ON public.webhook_idempotency USING btree (provider, created_at DESC)` |


## Policies (RLS)

### `Service role manages idempotency`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {service_role} |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

_nenhum_


## Grants

_nenhum_
