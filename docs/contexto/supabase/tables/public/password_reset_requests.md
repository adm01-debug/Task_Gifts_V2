# public.password_reset_requests

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `requested_at` | `timestamp with time zone` | não | `now()` |  |  |
| 4 | `status` | `text` | não | `'pending'::text` |  |  |
| 5 | `reviewed_by` | `uuid` | sim |  |  |  |
| 6 | `reviewed_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `review_notes` | `text` | sim |  |  |  |
| 8 | `expires_at` | `timestamp with time zone` | não | `(now() + '48:00:00'::interval)` |  |  |
| 9 | `reset_token` | `uuid` | sim |  |  |  |
| 10 | `reset_token_expires_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| password_reset_requests_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| password_reset_requests_reviewed_by_fkey | FOREIGN KEY | `FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| password_reset_requests_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'expired'::text, 'completed'::text]))` |  |  | sim |
| password_reset_requests_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_password_reset_requests_reviewed_by | btree | {reviewed_by} | não | sim |  | `CREATE INDEX idx_password_reset_requests_reviewed_by ON public.password_reset_requests USING btree (reviewed_by)` |
| idx_password_reset_requests_status | btree | {status} | não | sim |  | `CREATE INDEX idx_password_reset_requests_status ON public.password_reset_requests USING btree (status)` |
| idx_password_reset_requests_user_id | btree | {user_id} | não | sim |  | `CREATE INDEX idx_password_reset_requests_user_id ON public.password_reset_requests USING btree (user_id)` |
| password_reset_requests_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX password_reset_requests_pkey ON public.password_reset_requests USING btree (id)` |
| uq_password_reset_pendente_por_usuario | btree | {user_id} | sim | sim | `(status = 'pending'::text)` | `CREATE UNIQUE INDEX uq_password_reset_pendente_por_usuario ON public.password_reset_requests USING btree (user_id) WHERE (status = 'pending'::text)` |


## Policies (RLS)

### `Managers can update team password reset requests`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((EXISTS ( SELECT 1    FROM (team_members tm1      JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))   WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = password_reset_requests.user_id)))) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Managers can view team password reset requests`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((EXISTS ( SELECT 1    FROM (team_members tm1      JOIN team_members tm2 ON ((tm1.department_id = tm2.department_id)))   WHERE ((tm1.user_id = auth.uid()) AND (tm1.is_manager = true) AND (tm2.user_id = password_reset_requests.user_id)))) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Users can create own password reset requests`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can view own password reset requests`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_password_reset_requests_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
