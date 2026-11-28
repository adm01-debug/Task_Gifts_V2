# public.weekly_challenges

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
| 2 | `challenger_id` | `uuid` | não |  |  |  |
| 3 | `opponent_id` | `uuid` | não |  |  |  |
| 4 | `week_start` | `date` | não | `(date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone))::date` |  |  |
| 5 | `week_end` | `date` | não | `((date_trunc('week'::text, (CURRENT_DATE)::timestamp with time zone) + '6 days'::interval))::date` |  |  |
| 6 | `challenger_xp_start` | `integer` | não | `0` |  |  |
| 7 | `opponent_xp_start` | `integer` | não | `0` |  |  |
| 8 | `challenger_xp_gained` | `integer` | não | `0` |  |  |
| 9 | `opponent_xp_gained` | `integer` | não | `0` |  |  |
| 10 | `xp_reward` | `integer` | não | `100` |  |  |
| 11 | `coin_reward` | `integer` | não | `50` |  |  |
| 12 | `winner_id` | `uuid` | sim |  |  |  |
| 13 | `status` | `text` | não | `'active'::text` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| different_users | CHECK | `CHECK (challenger_id <> opponent_id)` |  |  | sim |
| weekly_challenges_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| weekly_challenges_status_check | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'expired'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| weekly_challenges_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX weekly_challenges_pkey ON public.weekly_challenges USING btree (id)` |


## Policies (RLS)

### `Admins can delete weekly challenges`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can insert weekly challenges`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins can update weekly challenges`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Authenticated users can view weekly challenges`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_weekly_challenges_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
