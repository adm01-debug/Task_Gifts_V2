# public.card_definitions

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
| 2 | `code` | `text` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `rarity` | `text` | não |  |  |  |
| 6 | `set_code` | `text` | não | `'S1'::text` |  |  |
| 7 | `image_url` | `text` | sim |  |  |  |
| 8 | `is_active` | `boolean` | não | `true` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| card_definitions_code_key | UNIQUE | `UNIQUE (code)` |  |  | sim |
| card_definitions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| card_definitions_rarity_check | CHECK | `CHECK (rarity = ANY (ARRAY['common'::text, 'uncommon'::text, 'rare'::text, 'epic'::text, 'legendary'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.card_trades | card_trades_offered_card_id_fkey | {offered_card_id} | CASCADE |
| public.card_trades | card_trades_requested_card_id_fkey | {requested_card_id} | CASCADE |
| public.user_cards | user_cards_card_id_fkey | {card_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| card_definitions_code_key | btree | {code} | sim | sim |  | `CREATE UNIQUE INDEX card_definitions_code_key ON public.card_definitions USING btree (code)` |
| card_definitions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX card_definitions_pkey ON public.card_definitions USING btree (id)` |
| idx_card_definitions_active | btree | {is_active,rarity} | não | sim |  | `CREATE INDEX idx_card_definitions_active ON public.card_definitions USING btree (is_active, rarity)` |
| idx_card_definitions_set_code | btree | {set_code,rarity} | não | sim |  | `CREATE INDEX idx_card_definitions_set_code ON public.card_definitions USING btree (set_code, rarity)` |


## Policies (RLS)

### `card_definitions_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `card_definitions_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `((is_active = true) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| card_definitions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
