# public.announcements

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
| 2 | `author_id` | `uuid` | não |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `content` | `text` | não |  |  |  |
| 5 | `category` | `text` | não | `'general'::text` |  |  |
| 6 | `department_id` | `uuid` | sim |  |  |  |
| 7 | `is_pinned` | `boolean` | não | `false` |  |  |
| 8 | `pin_expires_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `published_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `view_count` | `integer` | não | `0` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| announcements_author_id_fkey | FOREIGN KEY | `FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| announcements_category_check | CHECK | `CHECK (category = ANY (ARRAY['general'::text, 'urgent'::text, 'event'::text, 'achievement'::text, 'policy'::text]))` |  |  | sim |
| announcements_department_id_fkey | FOREIGN KEY | `FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| announcements_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.announcement_reactions | announcement_reactions_announcement_id_fkey | {announcement_id} | CASCADE |
| public.announcement_reads | announcement_reads_announcement_id_fkey | {announcement_id} | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| announcements_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX announcements_pkey ON public.announcements USING btree (id)` |
| idx_announcements_author_id | btree | {author_id} | não | sim |  | `CREATE INDEX idx_announcements_author_id ON public.announcements USING btree (author_id)` |
| idx_announcements_department_id | btree | {department_id} | não | sim |  | `CREATE INDEX idx_announcements_department_id ON public.announcements USING btree (department_id)` |
| idx_announcements_fts | gin | {} | não | sim |  | `CREATE INDEX idx_announcements_fts ON public.announcements USING gin (to_tsvector('portuguese'::regconfig, ((COALESCE(title, ''::text) \|\| ' '::text) \|\| COALESCE(content, ''::text))))` |
| idx_announcements_title_trgm | gin | {title} | não | sim |  | `CREATE INDEX idx_announcements_title_trgm ON public.announcements USING gin (title gin_trgm_ops)` |


## Policies (RLS)

### `Admins can delete announcements`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Authors can manage own announcements`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((author_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Everyone can view published announcements`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `((published_at IS NOT NULL) AND (published_at <= now()) AND ((expires_at IS NULL) OR (expires_at > now())) AND ((department_id IS NULL) OR (department_id IN ( SELECT team_members.department_id    FROM team_members   WHERE (team_members.user_id = auth.uid())))))` |
| WITH CHECK |  |

### `Managers can create announcements`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_announcements_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
