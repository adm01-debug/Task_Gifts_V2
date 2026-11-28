# public.scratch_card_prizes

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
| 2 | `label` | `text` | não |  |  |  |
| 3 | `prize_type` | `text` | não |  |  |  |
| 4 | `amount` | `integer` | não | `0` |  |  |
| 5 | `weight` | `integer` | não | `1` |  |  |
| 6 | `rarity` | `text` | não | `'common'::text` |  |  |
| 7 | `is_active` | `boolean` | não | `true` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| scratch_card_prizes_amount_check | CHECK | `CHECK (amount >= 0 AND amount <= 100000)` |  |  | sim |
| scratch_card_prizes_label_check | CHECK | `CHECK (btrim(label) <> ''::text AND length(label) <= 80)` |  |  | sim |
| scratch_card_prizes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| scratch_card_prizes_prize_type_check | CHECK | `CHECK (prize_type = ANY (ARRAY['coins'::text, 'xp'::text, 'nothing'::text]))` |  |  | sim |
| scratch_card_prizes_rarity_check | CHECK | `CHECK (rarity = ANY (ARRAY['common'::text, 'rare'::text, 'epic'::text, 'legendary'::text]))` |  |  | sim |
| scratch_card_prizes_weight_check | CHECK | `CHECK (weight::numeric >= 0::numeric AND weight::numeric <= 1000000::numeric)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.scratch_cards | scratch_cards_prize_id_fkey | {prize_id} | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| scratch_card_prizes_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX scratch_card_prizes_pkey ON public.scratch_card_prizes USING btree (id)` |


## Policies (RLS)

### `scratch_card_prizes_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `scratch_card_prizes_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(is_active OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| scratch_card_prizes_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
