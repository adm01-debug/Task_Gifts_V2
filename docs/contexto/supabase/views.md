# Views


## public.connection_monitor (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | pg_catalog.pg_stat_activity |
| populada | n/a |
| comentário | Conexoes por estado/espera do banco (operacao) |


```sql
SELECT state,
    wait_event_type,
    wait_event,
    count(*) AS total_connections,
    count(*) FILTER (WHERE state = 'active'::text) AS active_queries,
    count(*) FILTER (WHERE state = 'idle'::text) AS idle_connections,
    count(*) FILTER (WHERE state = 'idle in transaction'::text) AS idle_in_txn,
    round(count(*)::numeric * 100.0 / NULLIF(( SELECT count(*) AS count
           FROM pg_stat_activity pg_stat_activity_1
          WHERE pg_stat_activity_1.datname = current_database()), 0)::numeric, 1) AS pct_of_total,
    max(EXTRACT(epoch FROM now() - query_start))::integer AS max_query_age_sec,
    max(EXTRACT(epoch FROM now() - state_change))::integer AS max_state_age_sec
   FROM pg_stat_activity
  WHERE datname = current_database() AND pid <> pg_backend_pid()
  GROUP BY state, wait_event_type, wait_event
  ORDER BY (count(*)) DESC;
```

## public.demographic_values_panel (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | public.demographic_attributes, public.user_demographic_values |
| populada | n/a |
| comentário | Painel de respostas demograficas. Mascara valor de atributo restrito para quem nao e' admin e metadados de atributo inativo para quem nao e' admin. Lida por src/services/demographicsService.ts (listAllValues). |


```sql
WITH quem AS (
         SELECT has_role(auth.uid(), 'admin'::app_role) AS eh_admin,
            has_role(auth.uid(), 'manager'::app_role) AS eh_gestor
        )
 SELECT v.id,
    v.user_id,
    v.attribute_id,
    v.created_at,
    v.updated_at,
        CASE
            WHEN q.eh_admin OR a.is_active AND NOT a.is_restricted THEN v.value
            ELSE NULL::text
        END AS value,
        CASE
            WHEN q.eh_admin OR a.is_active AND NOT a.is_restricted THEN v.values_array
            ELSE NULL::jsonb
        END AS values_array,
        CASE
            WHEN q.eh_admin OR a.is_active AND NOT a.is_restricted THEN v.number_value
            ELSE NULL::numeric
        END AS number_value,
        CASE
            WHEN q.eh_admin OR a.is_active AND NOT a.is_restricted THEN v.date_value
            ELSE NULL::date
        END AS date_value,
        CASE
            WHEN q.eh_admin OR a.is_active THEN a.name
            ELSE NULL::text
        END AS attribute_name,
        CASE
            WHEN q.eh_admin OR a.is_active THEN a.attribute_type
            ELSE NULL::text
        END AS attribute_type,
        CASE
            WHEN q.eh_admin OR a.is_active THEN a.is_visible_in_reports
            ELSE NULL::boolean
        END AS attribute_is_visible_in_reports,
        CASE
            WHEN q.eh_admin OR a.is_active THEN a.is_restricted
            ELSE NULL::boolean
        END AS attribute_is_restricted
   FROM user_demographic_values v
     JOIN demographic_attributes a ON a.id = v.attribute_id
     CROSS JOIN quem q
  WHERE q.eh_admin OR q.eh_gestor;
```

## public.index_health_report (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | pg_catalog.pg_stat_user_indexes |
| populada | n/a |
| comentário | Saude dos indices: candidatos a remocao e uso (operacao) |


```sql
SELECT n.nspname AS schema,
    t.relname AS table_name,
    i.relname AS index_name,
    ix.indisunique AS is_unique,
    ix.indisprimary AS is_primary,
    s.idx_scan AS scans_since_reset,
    s.idx_tup_read AS tuples_read,
    s.idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(i.oid::regclass)) AS index_size,
    pg_relation_size(i.oid::regclass) AS index_size_bytes,
        CASE
            WHEN s.idx_scan = 0 AND NOT ix.indisprimary AND NOT ix.indisunique THEN 'CANDIDATE FOR REMOVAL'::text
            WHEN s.idx_scan < 10 THEN 'LOW USAGE'::text
            WHEN s.idx_scan < 100 THEN 'MODERATE USAGE'::text
            ELSE 'ACTIVE'::text
        END AS health_status,
    now() AS report_at
   FROM pg_index ix
     JOIN pg_class t ON t.oid = ix.indrelid
     JOIN pg_class i ON i.oid = ix.indexrelid
     JOIN pg_namespace n ON n.oid = t.relnamespace
     LEFT JOIN pg_stat_user_indexes s ON s.indexrelid = i.oid
  WHERE n.nspname = 'public'::name
  ORDER BY (
        CASE
            WHEN s.idx_scan = 0 THEN 0
            ELSE 1
        END), (pg_relation_size(i.oid::regclass)) DESC;
```

## public.leaderboard_cache (materialized)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | n/a |
| opções |  |
| depende de | public.departments, public.positions, public.profiles, public.task_scores, public.user_achievements, public.user_positions |
| populada | sim |
| comentário | MATVIEW: Cache do leaderboard — RANK() por XP global e departamental. Refresh CONCURRENTLY via pg_cron a cada 5 min. status IN (confirmed,invited). |


```sql
SELECT p.id AS user_id,
    p.display_name,
    p.avatar_url,
    p.level,
    p.xp,
    p.coins,
    p.streak,
    p.best_streak,
    p.quests_completed,
    p.status,
    p.employee_id,
    COALESCE(d.name, 'Sem departamento'::text) AS department_name,
    d.id AS department_id,
    COALESCE(pos.name, 'Sem cargo'::text) AS position_name,
    rank() OVER (ORDER BY p.xp DESC) AS global_rank,
    rank() OVER (PARTITION BY d.id ORDER BY p.xp DESC) AS dept_rank,
    COALESCE(ach.total_achievements, 0::bigint) AS total_achievements,
    COALESCE(ts.tasks_completed, 0::bigint) AS tasks_completed,
    now() AS cached_at
   FROM profiles p
     LEFT JOIN user_positions up ON up.user_id = p.id AND up.is_primary = true
     LEFT JOIN positions pos ON pos.id = up.position_id
     LEFT JOIN departments d ON d.id = pos.department_id
     LEFT JOIN ( SELECT user_achievements.user_id,
            count(*) AS total_achievements
           FROM user_achievements
          GROUP BY user_achievements.user_id) ach ON ach.user_id = p.id
     LEFT JOIN ( SELECT task_scores.user_id,
            count(*) FILTER (WHERE task_scores.status = ANY (ARRAY['on_time'::task_completion_status, 'late'::task_completion_status])) AS tasks_completed
           FROM task_scores
          GROUP BY task_scores.user_id) ts ON ts.user_id = p.id
  WHERE p.status = ANY (ARRAY['confirmed'::text, 'invited'::text]);
```

## public.profiles_public (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | public.profiles |
| populada | n/a |
| comentário |  |


```sql
SELECT id,
    display_name,
    avatar_url,
    level,
    xp,
    coins,
    streak,
    best_streak,
    quests_completed,
    status,
    created_at,
    updated_at,
    last_access_at
   FROM profiles;
```

## public.query_performance_summary (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | extensions.pg_stat_statements |
| populada | n/a |
| comentário | Top consultas por tempo total (pg_stat_statements) |


```sql
SELECT "left"(query, 200) AS query_snippet,
    calls,
    round(total_exec_time::numeric, 2) AS total_ms,
    round(mean_exec_time::numeric, 2) AS mean_ms,
    round(stddev_exec_time::numeric, 2) AS stddev_ms,
    round(min_exec_time::numeric, 2) AS min_ms,
    round(max_exec_time::numeric, 2) AS max_ms,
    rows,
    round(100.0 * shared_blks_hit::numeric / NULLIF(shared_blks_hit + shared_blks_read, 0)::numeric, 2) AS cache_hit_pct,
    shared_blks_hit,
    shared_blks_read,
    shared_blks_written
   FROM pg_stat_statements
  ORDER BY total_exec_time DESC;
```

## public.webhook_delivery_stats_24h (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | public.webhook_delivery_logs, public.webhook_subscriptions |
| populada | n/a |
| comentário |  |


```sql
SELECT wdl.subscription_id,
    ws.name AS subscription_name,
    ws.url AS subscription_url,
    count(*) AS total_deliveries,
    count(*) FILTER (WHERE wdl.success) AS successful_deliveries,
    count(*) FILTER (WHERE NOT wdl.success) AS failed_deliveries,
    round(count(*) FILTER (WHERE wdl.success)::numeric / NULLIF(count(*), 0)::numeric * 100::numeric, 2) AS success_rate_pct,
    round(avg(wdl.duration_ms), 2) AS avg_duration_ms,
    percentile_cont(0.5::double precision) WITHIN GROUP (ORDER BY (wdl.duration_ms::double precision))::numeric(10,2) AS p50_duration_ms,
    percentile_cont(0.95::double precision) WITHIN GROUP (ORDER BY (wdl.duration_ms::double precision))::numeric(10,2) AS p95_duration_ms,
    percentile_cont(0.99::double precision) WITHIN GROUP (ORDER BY (wdl.duration_ms::double precision))::numeric(10,2) AS p99_duration_ms,
    max(wdl.duration_ms) AS max_duration_ms,
    round(avg(wdl.attempt_count), 2) AS avg_attempts,
    max(wdl.created_at) AS last_delivery_at
   FROM webhook_delivery_logs wdl
     LEFT JOIN webhook_subscriptions ws ON ws.id = wdl.subscription_id
  WHERE wdl.created_at >= (now() - '24:00:00'::interval)
  GROUP BY wdl.subscription_id, ws.name, ws.url;
```
