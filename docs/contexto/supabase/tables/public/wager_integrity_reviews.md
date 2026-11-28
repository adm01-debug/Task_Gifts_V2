# public.wager_integrity_reviews

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
| 2 | `target_user_id` | `uuid` | não |  |  |  |
| 3 | `anomaly_code` | `text` | não |  |  |  |
| 4 | `window_days` | `integer` | não |  |  |  |
| 5 | `status` | `text` | não | `'investigating'::text` |  |  |
| 6 | `notes` | `text` | sim |  |  |  |
| 7 | `metric` | `numeric` | não | `0` |  |  |
| 8 | `reviewed_by` | `uuid` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| wager_integrity_reviews_anomaly_code_check | CHECK | `CHECK (anomaly_code = ANY (ARRAY['accuracy_outlier'::text, 'perfect_streak'::text, 'net_drain'::text, 'volume_spike'::text, 'stale_activity'::text]))` |  |  | sim |
| wager_integrity_reviews_notes_check | CHECK | `CHECK (notes IS NULL OR char_length(notes) <= 2000)` |  |  | sim |
| wager_integrity_reviews_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| wager_integrity_reviews_reviewed_by_fkey | FOREIGN KEY | `FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| wager_integrity_reviews_status_check | CHECK | `CHECK (status = ANY (ARRAY['investigating'::text, 'cleared'::text, 'sanctioned'::text, 'flagged'::text, 'confirmed'::text, 'false_positive'::text]))` |  |  | sim |
| wager_integrity_reviews_target_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| wager_integrity_reviews_unique | UNIQUE | `UNIQUE (target_user_id, anomaly_code, window_days)` |  |  | sim |
| wager_integrity_reviews_window_days_check | CHECK | `CHECK (window_days = ANY (ARRAY[7, 30, 90]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.wager_integrity_review_events | wager_integrity_review_events_review_id_fkey | {review_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_wager_integrity_reviews_lookup | btree | {window_days,status,updated_at} | não | sim |  | `CREATE INDEX idx_wager_integrity_reviews_lookup ON public.wager_integrity_reviews USING btree (window_days, status, updated_at DESC)` |
| idx_wager_integrity_reviews_user | btree | {target_user_id,status} | não | sim |  | `CREATE INDEX idx_wager_integrity_reviews_user ON public.wager_integrity_reviews USING btree (target_user_id, status)` |
| wager_integrity_reviews_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX wager_integrity_reviews_pkey ON public.wager_integrity_reviews USING btree (id)` |
| wager_integrity_reviews_unique | btree | {target_user_id,anomaly_code,window_days} | sim | sim |  | `CREATE UNIQUE INDEX wager_integrity_reviews_unique ON public.wager_integrity_reviews USING btree (target_user_id, anomaly_code, window_days)` |


## Policies (RLS)

### `Managers and admins can read integrity reviews`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `wager_integrity_reviews_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_log_wager_integrity_review_event | AFTER | INSERT OR UPDATE | ROW | enabled | public.log_wager_integrity_review_event |
| wager_integrity_reviews_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
