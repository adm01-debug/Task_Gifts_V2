# public.user_certifications

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
| 3 | `certification_id` | `uuid` | não |  |  |  |
| 4 | `issued_at` | `timestamp with time zone` | não | `now()` |  |  |
| 5 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 6 | `renewed_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `renewal_count` | `integer` | não | `0` |  |  |
| 8 | `status` | `text` | não | `'active'::text` |  |  |
| 9 | `issued_by` | `uuid` | sim |  |  |  |
| 10 | `notes` | `text` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `certificate_code` | `text` | não | `generate_certificate_code()` |  |  |
| 14 | `verification_hash` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_certifications_certification_id_fkey | FOREIGN KEY | `FOREIGN KEY (certification_id) REFERENCES certifications(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_certifications_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_certifications_user_id_certification_id_key | UNIQUE | `UNIQUE (user_id, certification_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_certifications_certification_id | btree | {certification_id} | não | sim |  | `CREATE INDEX idx_user_certifications_certification_id ON public.user_certifications USING btree (certification_id)` |
| user_certifications_certificate_code_key | btree | {certificate_code} | sim | sim |  | `CREATE UNIQUE INDEX user_certifications_certificate_code_key ON public.user_certifications USING btree (certificate_code)` |
| user_certifications_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX user_certifications_pkey ON public.user_certifications USING btree (id)` |
| user_certifications_user_id_certification_id_key | btree | {user_id,certification_id} | sim | sim |  | `CREATE UNIQUE INDEX user_certifications_user_id_certification_id_key ON public.user_certifications USING btree (user_id, certification_id)` |


## Policies (RLS)

### `Authenticated insert certifications`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {authenticated} |
| USING |  |
| WITH CHECK | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |

### `Managers can update certifications`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Managers can view team certifications`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |
| WITH CHECK |  |

### `Users can view own certifications`

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
| trg_user_certifications_identity | BEFORE | INSERT OR UPDATE | ROW | enabled | public.set_certificate_identity |
| update_user_certifications_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
