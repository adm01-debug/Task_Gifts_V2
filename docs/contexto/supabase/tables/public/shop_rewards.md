# public.shop_rewards

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `category` | `reward_category` | não | `'product'::reward_category` |  |  |
| 5 | `price_coins` | `integer` | não | `100` |  |  |
| 6 | `stock` | `integer` | sim |  |  |  |
| 7 | `image_url` | `text` | sim |  |  |  |
| 8 | `rarity` | `reward_rarity` | não | `'common'::reward_rarity` |  |  |
| 9 | `is_active` | `boolean` | não | `true` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| shop_rewards_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.auctions | auctions_reward_id_fkey | {reward_id} | SET NULL |
| public.shop_promotions | shop_promotions_reward_id_fkey | {reward_id} | CASCADE |
| public.shop_purchases | shop_purchases_reward_id_fkey | {reward_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| shop_rewards_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX shop_rewards_pkey ON public.shop_rewards USING btree (id)` |


## Policies (RLS)

### `Admins can manage rewards`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Everyone can view active rewards`

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
| update_shop_rewards_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
