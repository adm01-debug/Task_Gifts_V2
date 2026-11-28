# public.checkins

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
| 2 | `manager_id` | `uuid` | não |  |  |  |
| 3 | `employee_id` | `uuid` | não |  |  |  |
| 4 | `template_id` | `uuid` | sim |  |  |  |
| 5 | `scheduled_at` | `timestamp with time zone` | não |  |  |  |
| 6 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `status` | `text` | não | `'scheduled'::text` |  |  |
| 8 | `notes` | `text` | sim |  |  |  |
| 9 | `action_items` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 10 | `responses` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `mood_rating` | `integer` | sim |  |  |  |
| 12 | `xp_reward` | `integer` | não | `50` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| checkins_mood_rating_check | CHECK | `CHECK (mood_rating >= 1 AND mood_rating <= 5)` |  |  | sim |
| checkins_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| checkins_status_check | CHECK | `CHECK (status = ANY (ARRAY['scheduled'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))` |  |  | sim |
| checkins_template_id_fkey | FOREIGN KEY | `FOREIGN KEY (template_id) REFERENCES checkin_templates(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| checkins_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX checkins_pkey ON public.checkins USING btree (id)` |
| idx_checkins_template_id | btree | {template_id} | não | sim |  | `CREATE INDEX idx_checkins_template_id ON public.checkins USING btree (template_id)` |


## Policies (RLS)

### `Admins can view all checkins`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Managers can create checkins`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(manager_id = auth.uid())` |

### `Participants can update checkins`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((manager_id = auth.uid()) OR (employee_id = auth.uid()))` |
| WITH CHECK |  |

### `Participants can view their checkins`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((manager_id = auth.uid()) OR (employee_id = auth.uid()))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_checkins_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
