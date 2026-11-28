CREATE OR REPLACE FUNCTION public.db_health_check()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_catalog', 'cron'
AS $function$
DECLARE
  v_db_size text;
  v_connections int;
  v_cache_hit numeric;
  v_bloat_top jsonb;
  v_slow_queries jsonb;
  v_cron_jobs int;
  v_total_indexes int;
  v_unused_indexes int;
  v_fk_no_index int;
  v_active_queries int;
  v_idle_in_txn int;
  v_leaderboard_age interval;
BEGIN
  SELECT pg_size_pretty(pg_database_size(current_database())) INTO v_db_size;
  SELECT count(*) INTO v_connections FROM pg_stat_activity WHERE state IS NOT NULL;
  SELECT count(*) INTO v_active_queries FROM pg_stat_activity WHERE state='active' AND pid<>pg_backend_pid();
  SELECT count(*) INTO v_idle_in_txn FROM pg_stat_activity WHERE state='idle in transaction';
  SELECT ROUND(sum(blks_hit)*100.0/NULLIF(sum(blks_hit)+sum(blks_read),0),2) INTO v_cache_hit FROM pg_stat_database;
  SELECT count(*) INTO v_cron_jobs FROM cron.job WHERE active;
  -- Index metrics
  SELECT count(*) INTO v_total_indexes FROM pg_indexes WHERE schemaname='public';
  SELECT count(*) INTO v_unused_indexes
    FROM pg_stat_user_indexes sui
    JOIN pg_index ix ON ix.indexrelid=sui.indexrelid
    WHERE sui.schemaname='public' AND sui.idx_scan=0 AND NOT ix.indisprimary AND NOT ix.indisunique;
  -- FKs sem índice (deve ser 0 após otimização)
  SELECT count(*) INTO v_fk_no_index
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
    JOIN pg_namespace n ON n.oid=c.connamespace
    WHERE c.contype='f' AND n.nspname='public' AND array_length(c.conkey,1)=1
      AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid=c.conrelid AND i.indkey[0]=a.attnum);
  -- Leaderboard cache age
  SELECT now() - max(cached_at) INTO v_leaderboard_age FROM public.leaderboard_cache;
  -- Bloat
  SELECT jsonb_agg(t) INTO v_bloat_top FROM (
    SELECT relname AS tbl, n_dead_tup AS dead,
           ROUND(n_dead_tup*100.0/NULLIF(n_live_tup+n_dead_tup,0),1) AS dead_pct
    FROM pg_stat_user_tables WHERE n_dead_tup>100
    ORDER BY n_dead_tup DESC LIMIT 3
  ) t;
  -- Slow queries
  BEGIN
    SELECT jsonb_agg(t) INTO v_slow_queries FROM (
      SELECT LEFT(query,80) AS q, calls, ROUND(mean_exec_time::numeric,1) AS mean_ms
      FROM extensions.pg_stat_statements WHERE calls>5
      ORDER BY mean_exec_time DESC LIMIT 3
    ) t;
  EXCEPTION WHEN OTHERS THEN v_slow_queries := '[]'::jsonb; END;

  RETURN jsonb_build_object(
    'checked_at',         now(),
    'status',             CASE
                            WHEN v_cache_hit>=95 AND v_connections<80 AND v_fk_no_index=0 THEN 'healthy'
                            WHEN v_cache_hit>=80 THEN 'degraded'
                            ELSE 'critical'
                          END,
    'db_size',            v_db_size,
    'connections',        v_connections,
    'active_queries',     v_active_queries,
    'idle_in_txn',        v_idle_in_txn,
    'cache_hit_pct',      v_cache_hit,
    'cron_jobs_active',   v_cron_jobs,
    'total_indexes',      v_total_indexes,
    'unused_indexes',     v_unused_indexes,
    'fk_without_index',   v_fk_no_index,
    'leaderboard_age',    COALESCE(v_leaderboard_age::text, 'empty cache'),
    'top_bloat',          COALESCE(v_bloat_top,'[]'::jsonb),
    'slow_queries',       COALESCE(v_slow_queries,'[]'::jsonb)
  );
END;
$function$
