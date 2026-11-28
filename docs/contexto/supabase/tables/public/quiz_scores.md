# public.quiz_scores

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `quiz_type` | `text` | não | `'magic_cards'::text` |  |  |
| 4 | `score` | `integer` | não | `0` |  |  |
| 5 | `correct_answers` | `integer` | não | `0` |  |  |
| 6 | `total_questions` | `integer` | não | `0` |  |  |
| 7 | `streak_bonus` | `integer` | não | `0` |  |  |
| 8 | `time_bonus` | `integer` | não | `0` |  |  |
| 9 | `played_at` | `date` | não | `CURRENT_DATE` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| quiz_scores_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_quiz_scores_played_at | btree | {played_at} | não | sim |  | `CREATE INDEX idx_quiz_scores_played_at ON public.quiz_scores USING btree (played_at DESC)` |
| idx_quiz_scores_user_date | btree | {user_id,played_at} | não | sim |  | `CREATE INDEX idx_quiz_scores_user_date ON public.quiz_scores USING btree (user_id, played_at)` |
| quiz_scores_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX quiz_scores_pkey ON public.quiz_scores USING btree (id)` |


## Policies (RLS)

### `Everyone can view scores`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `true` |
| WITH CHECK |  |

### `Users can insert their own scores`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | {public} |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_war_hook_quiz_scores | AFTER | INSERT | ROW | enabled | public.war_hook_quiz_scores |


## Grants

_nenhum_
