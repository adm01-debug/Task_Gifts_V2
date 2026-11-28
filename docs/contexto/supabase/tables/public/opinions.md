# public.opinions

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
| 2 | `sender_id` | `uuid` | não |  |  |  |
| 3 | `recipient_type` | `text` | não |  |  |  |
| 4 | `recipient_id` | `uuid` | sim |  |  |  |
| 5 | `category` | `opinion_category` | não | `'suggestion'::opinion_category` |  |  |
| 6 | `urgency` | `opinion_urgency` | não | `'normal'::opinion_urgency` |  |  |
| 7 | `subject` | `text` | sim |  |  |  |
| 8 | `content` | `text` | não |  |  |  |
| 9 | `is_anonymous` | `boolean` | não | `true` |  |  |
| 10 | `status` | `opinion_status` | não | `'new'::opinion_status` |  |  |
| 11 | `read_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `read_by` | `uuid` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| opinions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| opinions_recipient_type_check | CHECK | `CHECK (recipient_type = ANY (ARRAY['manager'::text, 'hr'::text, 'ceo'::text, 'custom'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.action_plans | action_plans_opinion_id_fkey | {opinion_id} | SET NULL |
| public.opinion_responses | opinion_responses_opinion_id_fkey | {opinion_id} | CASCADE |
| public.opinion_supports | opinion_supports_opinion_id_fkey | {opinion_id} | CASCADE |
| public.opinion_tags | opinion_tags_opinion_id_fkey | {opinion_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_opinions_recipient | btree | {recipient_id} | não | sim |  | `CREATE INDEX idx_opinions_recipient ON public.opinions USING btree (recipient_id)` |
| idx_opinions_sender | btree | {sender_id} | não | sim |  | `CREATE INDEX idx_opinions_sender ON public.opinions USING btree (sender_id)` |
| idx_opinions_status | btree | {status} | não | sim |  | `CREATE INDEX idx_opinions_status ON public.opinions USING btree (status)` |
| idx_opinions_status_created | btree | {status,created_at} | não | sim |  | `CREATE INDEX idx_opinions_status_created ON public.opinions USING btree (status, created_at DESC)` |
| opinions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX opinions_pkey ON public.opinions USING btree (id)` |


## Policies (RLS)

### `Recipients can update opinions`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((recipient_id = auth.uid()) OR ((recipient_type = 'hr'::text) AND has_role(auth.uid(), 'admin'::app_role)) OR ((recipient_type = 'manager'::text) AND has_role(auth.uid(), 'manager'::app_role)) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Users can create opinions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = sender_id)` |

### `View opinions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((sender_id = auth.uid()) OR (recipient_id = auth.uid()) OR ((recipient_type = 'hr'::text) AND has_role(auth.uid(), 'admin'::app_role)) OR ((recipient_type = 'manager'::text) AND has_role(auth.uid(), 'manager'::app_role)) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_opinions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
