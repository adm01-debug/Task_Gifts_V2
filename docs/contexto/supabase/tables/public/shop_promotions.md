# public.shop_promotions

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
| 2 | `reward_id` | `uuid` | não |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `discount_percent` | `integer` | sim |  |  |  |
| 6 | `discount_coins` | `integer` | sim |  |  |  |
| 7 | `starts_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `ends_at` | `timestamp with time zone` | não |  |  |  |
| 9 | `is_active` | `boolean` | não | `true` |  |  |
| 10 | `max_claims` | `integer` | sim |  |  |  |
| 11 | `current_claims` | `integer` | não | `0` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| shop_promotions_discount_percent_check | CHECK | `CHECK (discount_percent >= 0 AND discount_percent <= 100)` |  |  | sim |
| shop_promotions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| shop_promotions_reward_id_fkey | FOREIGN KEY | `FOREIGN KEY (reward_id) REFERENCES shop_rewards(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_shop_promotions_active | btree | {is_active,starts_at,ends_at} | não | sim |  | `CREATE INDEX idx_shop_promotions_active ON public.shop_promotions USING btree (is_active, starts_at, ends_at)` |
| idx_shop_promotions_reward | btree | {reward_id} | não | sim |  | `CREATE INDEX idx_shop_promotions_reward ON public.shop_promotions USING btree (reward_id)` |
| shop_promotions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX shop_promotions_pkey ON public.shop_promotions USING btree (id)` |


## Policies (RLS)

### `Admins can manage promotions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can view all promotions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view active promotions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((is_active = true) AND (starts_at <= now()) AND (ends_at > now()))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_shop_promotions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
