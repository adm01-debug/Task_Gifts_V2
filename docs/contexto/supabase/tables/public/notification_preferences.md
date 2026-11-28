# public.notification_preferences

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `email_enabled` | `boolean` | não | `true` |  |  |
| 4 | `push_enabled` | `boolean` | não | `true` |  |  |
| 5 | `in_app_enabled` | `boolean` | não | `true` |  |  |
| 6 | `type_preferences` | `jsonb` | não | `'{"xp": {"push": false, "email": false, "in_app": true, "priority": "low"}, "goal": {"push": true, "email": true, "in_app": true, "priority": "high"}, "quest": {"push": true, "email": true, "in_app": true, "priority": "normal"}, "survey": {"push": true, "email": true, "in_app": true, "priority": "high"}, "checkin": {"push": false, "email": true, "in_app": true, "priority": "normal"}, "feedback": {"push": true, "email": true, "in_app": true, "priority": "high"}, "level_up": {"push": true, "email": true, "in_app": true, "priority": "high"}, "achievement": {"push": true, "email": true, "in_app": true, "priority": "normal"}, "leaderboard": {"push": true, "email": false, "in_app": true, "priority": "normal"}, "announcement": {"push": true, "email": true, "in_app": true, "priority": "normal"}, "competency_gap": {"push": true, "email": true, "in_app": true, "priority": "high"}, "campaign_closed": {"push": true, "email": true, "in_app": true, "priority": "normal"}, "development_tip": {"push": false, "email": true, "in_app": true, "priority": "low"}, "campaign_enrolled": {"push": true, "email": false, "in_app": true, "priority": "normal"}, "campaign_progress": {"push": false, "email": false, "in_app": true, "priority": "low"}, "campaign_completed": {"push": true, "email": true, "in_app": true, "priority": "high"}, "campaign_milestone": {"push": true, "email": false, "in_app": true, "priority": "normal"}}'::jsonb` |  |  |
| 7 | `do_not_disturb_enabled` | `boolean` | não | `false` |  |  |
| 8 | `do_not_disturb_start` | `time without time zone` | sim | `'22:00:00'::time without time zone` |  |  |
| 9 | `do_not_disturb_end` | `time without time zone` | sim | `'08:00:00'::time without time zone` |  |  |
| 10 | `do_not_disturb_weekends` | `boolean` | não | `true` |  |  |
| 11 | `digest_enabled` | `boolean` | não | `true` |  |  |
| 12 | `digest_frequency` | `text` | não | `'daily'::text` |  |  |
| 13 | `digest_time` | `time without time zone` | sim | `'09:00:00'::time without time zone` |  |  |
| 14 | `language` | `text` | não | `'pt-BR'::text` |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `channel_email` | `boolean` | sim | `true` |  |  |
| 18 | `channel_push` | `boolean` | sim | `true` |  |  |
| 19 | `channel_in_app` | `boolean` | sim | `true` |  |  |
| 20 | `quiet_hours_start` | `time without time zone` | sim |  |  |  |
| 21 | `quiet_hours_end` | `time without time zone` | sim |  |  |  |
| 22 | `frequency` | `text` | sim | `'instant'::text` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| notification_preferences_digest_frequency_check | CHECK | `CHECK (digest_frequency = ANY (ARRAY['hourly'::text, 'daily'::text, 'weekly'::text]))` |  |  | sim |
| notification_preferences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| unique_user_notification_prefs | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| notification_preferences_pkey | btree | {id} | sim | sim |  | `CREATE UNIQUE INDEX notification_preferences_pkey ON public.notification_preferences USING btree (id)` |
| unique_user_notification_prefs | btree | {user_id} | sim | sim |  | `CREATE UNIQUE INDEX unique_user_notification_prefs ON public.notification_preferences USING btree (user_id)` |


## Policies (RLS)

### `Users can manage own notification preferences`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | {public} |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK | `(auth.uid() = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_notification_preferences_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_notification_prefs_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
