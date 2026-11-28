# public.postmortem_actions

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
| 2 | `postmortem_id` | `uuid` | não |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `owner_user_id` | `uuid` | sim |  |  |  |
| 6 | `owner_label` | `text` | sim |  |  |  |
| 7 | `priority` | `text` | não | `'medium'::text` |  |  |
| 8 | `status` | `text` | não | `'open'::text` |  |  |
| 9 | `due_date` | `date` | sim |  |  |  |
| 10 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| postmortem_actions_owner_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| postmortem_actions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| postmortem_actions_postmortem_id_fkey | FOREIGN KEY | `FOREIGN KEY (postmortem_id) REFERENCES postmortems(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| postmortem_actions_priority_check | CHECK | `CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))` |  |  | sim |
| postmortem_actions_status_check | CHECK | `CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'done'::text, 'cancelled'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_pm_actions_postmortem | btree | {postmortem_id} | não | sim |  | `CREATE INDEX idx_pm_actions_postmortem ON public.postmortem_actions USING btree (postmortem_id)` |
| idx_pm_actions_status_due | btree | {status,due_date} | não | sim | `(status = ANY (ARRAY['open'::text, 'in_progress'::text]))` | `CREATE INDEX idx_pm_actions_status_due ON public.postmortem_actions USING btree (status, due_date) WHERE (status = ANY (ARRAY['open'::text, 'in_progress'::text]))` |
| idx_postmortem_actions_owner_user_id | btree | {owner_user_id} | não | sim |  | `CREATE INDEX idx_postmortem_actions_owner_user_id ON public.postmortem_actions USING btree (owner_user_id)` |
| postmortem_actions_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX postmortem_actions_pkey ON public.postmortem_actions USING btree (id)` |


## Policies (RLS)

### `Admins manage postmortem actions`

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
| trg_pm_action_completed | BEFORE | UPDATE | ROW | enabled | public.set_postmortem_action_completed_at |
| trg_postmortem_actions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
