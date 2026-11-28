# public.notification_templates

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
| 2 | `key` | `text` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `category` | `text` | sim | `'general'::text` |  |  |
| 6 | `channels` | `jsonb` | sim | `'["in_app"]'::jsonb` |  |  |
| 7 | `subject_template` | `text` | sim |  |  |  |
| 8 | `body_template` | `text` | não |  |  |  |
| 9 | `body_template_html` | `text` | sim |  |  |  |
| 10 | `variables` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 11 | `is_active` | `boolean` | sim | `true` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| notification_templates_key_key | UNIQUE | `UNIQUE (key)` |  |  | sim |
| notification_templates_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| notification_templates_key_key | btree | {key} | sim | sim |  | `CREATE UNIQUE INDEX notification_templates_key_key ON public.notification_templates USING btree (key)` |
| notification_templates_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX notification_templates_pkey ON public.notification_templates USING btree (id)` |


## Policies (RLS)

### `notification_templates_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(is_active = true)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_notification_templates_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
