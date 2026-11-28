# public.mentorship_requests

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `requester_id` | `uuid` | não |  |  |  |
| 3 | `target_id` | `uuid` | sim |  |  |  |
| 4 | `request_type` | `text` | não |  |  |  |
| 5 | `status` | `text` | não | `'pending'::text` |  |  |
| 6 | `message` | `text` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `responded_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| mentorship_requests_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| mentorship_requests_request_type_check | CHECK | `CHECK (request_type = ANY (ARRAY['find_mentor'::text, 'find_apprentice'::text, 'specific'::text]))` |  |  | sim |
| mentorship_requests_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'expired'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| mentorship_requests_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX mentorship_requests_pkey ON public.mentorship_requests USING btree (id)` |


## Policies (RLS)

### `Users can create requests`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = requester_id)` |

### `Users can update requests targeting them`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((auth.uid() = target_id) OR (auth.uid() = requester_id))` |
| WITH CHECK |  |

### `Users can view their requests`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((auth.uid() = requester_id) OR (auth.uid() = target_id))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
