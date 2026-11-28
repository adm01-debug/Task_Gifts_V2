# public.wager_integrity_review_events

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
| 2 | `review_id` | `uuid` | não |  |  |  |
| 3 | `target_user_id` | `uuid` | não |  |  |  |
| 4 | `anomaly_code` | `text` | não |  |  |  |
| 5 | `window_days` | `integer` | não |  |  |  |
| 6 | `previous_status` | `text` | sim |  |  |  |
| 7 | `new_status` | `text` | não |  |  |  |
| 8 | `notes` | `text` | sim |  |  |  |
| 9 | `metric` | `numeric` | não | `0` |  |  |
| 10 | `changed_by` | `uuid` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| wager_integrity_review_events_changed_by_fkey | FOREIGN KEY | `FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| wager_integrity_review_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| wager_integrity_review_events_review_id_fkey | FOREIGN KEY | `FOREIGN KEY (review_id) REFERENCES wager_integrity_reviews(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| wager_integrity_review_events_target_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_wager_integrity_review_events | btree | {review_id,created_at} | não | sim |  | `CREATE INDEX idx_wager_integrity_review_events ON public.wager_integrity_review_events USING btree (review_id, created_at DESC)` |
| idx_wager_review_events_lookup | btree | {window_days,target_user_id,anomaly_code,created_at} | não | sim |  | `CREATE INDEX idx_wager_review_events_lookup ON public.wager_integrity_review_events USING btree (window_days, target_user_id, anomaly_code, created_at DESC)` |
| wager_integrity_review_events_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX wager_integrity_review_events_pkey ON public.wager_integrity_review_events USING btree (id)` |


## Policies (RLS)

### `wager_integrity_review_events_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
