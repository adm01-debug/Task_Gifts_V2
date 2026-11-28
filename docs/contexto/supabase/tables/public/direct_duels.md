# public.direct_duels

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
| 2 | `challenger_id` | `uuid` | não |  |  |  |
| 3 | `opponent_id` | `uuid` | não |  |  |  |
| 4 | `status` | `text` | não | `'pending'::text` |  |  |
| 5 | `challenger_xp_start` | `integer` | não | `0` |  |  |
| 6 | `opponent_xp_start` | `integer` | não | `0` |  |  |
| 7 | `challenger_xp_gained` | `integer` | não | `0` |  |  |
| 8 | `opponent_xp_gained` | `integer` | não | `0` |  |  |
| 9 | `winner_id` | `uuid` | sim |  |  |  |
| 10 | `xp_reward` | `integer` | não | `150` |  |  |
| 11 | `coin_reward` | `integer` | não | `75` |  |  |
| 12 | `duration_hours` | `integer` | não | `24` |  |  |
| 13 | `message` | `text` | sim |  |  |  |
| 14 | `starts_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `ends_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| direct_duels_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| direct_duels_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'active'::text, 'completed'::text, 'declined'::text, 'cancelled'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| direct_duels_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX direct_duels_pkey ON public.direct_duels USING btree (id)` |


## Policies (RLS)

### `Users can create duels`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = challenger_id)` |

### `Users can update their duels`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((auth.uid() = challenger_id) OR (auth.uid() = opponent_id))` |
| WITH CHECK |  |

### `Users can view their duels`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((auth.uid() = challenger_id) OR (auth.uid() = opponent_id))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_direct_duels_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
