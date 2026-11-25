-- ============================================================================
-- Recupera objetos de producao que nunca foram versionados.
--
-- Contexto: auditoria de 25/11/2026 comparou o catalogo de producao com o
-- replay das 295 migrations. Alem de 6 tabelas e 22 colunas (recuperadas em
-- 20251220144518), faltavam 6 funcoes, 3 views de operacao e o event
-- trigger que liga RLS automaticamente em tabela nova. Sem isso, um banco
-- reconstruido fica sem o painel de saude e sem a busca global.
--
-- Definicoes extraidas de pg_get_functiondef/pg_get_viewdef em producao
-- (byte a byte, com search_path e ACL). Em producao e idempotente:
-- CREATE OR REPLACE + GRANT.
-- ============================================================================

-- 1) immutable_unaccent: indice/filtro sem depender do search_path do chamador.
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
AS $function$ SELECT extensions.unaccent($1) $function$;

-- 2) increment_user_xp_coins: creditar XP/moeda de forma atomica.
CREATE OR REPLACE FUNCTION public.increment_user_xp_coins(user_id uuid, xp_amount integer DEFAULT 0, coin_amount integer DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE profiles
  SET
    xp    = xp + xp_amount,
    coins = coins + coin_amount,
    updated_at = now()
  WHERE id = user_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.increment_user_xp_coins(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_user_xp_coins(uuid, integer, integer) TO service_role;

-- 3) search_all: busca global (perfis, conquistas, avisos, departamentos).
CREATE OR REPLACE FUNCTION public.search_all(p_query text, p_limit integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_tsquery tsquery;
  v_result jsonb := '[]'::jsonb;
  v_profiles jsonb;
  v_achievements jsonb;
  v_announcements jsonb;
  v_departments jsonb;
BEGIN
  -- Sanitiza query para tsquery (português)
  v_tsquery := plainto_tsquery('portuguese', p_query);

  -- Busca em profiles
  SELECT jsonb_agg(jsonb_build_object(
    'type', 'profile', 'id', id,
    'display_name', display_name,
    'email', email,
    'rank', ts_rank(to_tsvector('portuguese', coalesce(display_name,'')), v_tsquery)
  )) INTO v_profiles
  FROM (
    SELECT id, display_name, email
    FROM public.profiles
    WHERE to_tsvector('portuguese', coalesce(display_name,'')) @@ v_tsquery
       OR display_name ILIKE '%' || p_query || '%'
    LIMIT p_limit
  ) t;

  -- Busca em achievements
  SELECT jsonb_agg(jsonb_build_object(
    'type', 'achievement', 'id', id, 'name', name, 'description', description
  )) INTO v_achievements
  FROM (
    SELECT id, name, description
    FROM public.achievements
    WHERE to_tsvector('portuguese', coalesce(name,'') || ' ' || coalesce(description,'')) @@ v_tsquery
       OR name ILIKE '%' || p_query || '%'
    LIMIT p_limit
  ) t;

  -- Busca em announcements
  SELECT jsonb_agg(jsonb_build_object(
    'type', 'announcement', 'id', id, 'title', title
  )) INTO v_announcements
  FROM (
    SELECT id, title
    FROM public.announcements
    WHERE to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(content,'')) @@ v_tsquery
       OR title ILIKE '%' || p_query || '%'
    LIMIT p_limit
  ) t;

  -- Busca em departments
  SELECT jsonb_agg(jsonb_build_object(
    'type', 'department', 'id', id, 'name', name
  )) INTO v_departments
  FROM (
    SELECT id, name
    FROM public.departments
    WHERE to_tsvector('portuguese', coalesce(name,'')) @@ v_tsquery
       OR name ILIKE '%' || p_query || '%'
    LIMIT p_limit
  ) t;

  RETURN jsonb_build_object(
    'query', p_query,
    'profiles', COALESCE(v_profiles, '[]'::jsonb),
    'achievements', COALESCE(v_achievements, '[]'::jsonb),
    'announcements', COALESCE(v_announcements, '[]'::jsonb),
    'departments', COALESCE(v_departments, '[]'::jsonb),
    'total', (
      jsonb_array_length(COALESCE(v_profiles,'[]'::jsonb)) +
      jsonb_array_length(COALESCE(v_achievements,'[]'::jsonb)) +
      jsonb_array_length(COALESCE(v_announcements,'[]'::jsonb)) +
      jsonb_array_length(COALESCE(v_departments,'[]'::jsonb))
    )
  );
END;
$function$;
REVOKE ALL ON FUNCTION public.search_all(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_all(text, integer) TO service_role;

-- 4) Painel de saude do banco (usado pelos jobs de SRE / runbook).
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
$function$;
REVOKE ALL ON FUNCTION public.db_health_check() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.db_health_check() TO service_role;

-- 5) Detector de consulta travada.
CREATE OR REPLACE FUNCTION public.detect_long_running_queries(threshold_seconds integer DEFAULT 30)
 RETURNS TABLE(pid integer, usename text, duration_sec integer, state text, wait_event text, query_preview text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
    SELECT
        pid::int,
        usename::text,
        EXTRACT(EPOCH FROM (now() - query_start))::int AS duration_sec,
        state::text,
        COALESCE(wait_event_type || ':' || wait_event, 'none')::text AS wait_event,
        LEFT(query, 200)::text AS query_preview
    FROM pg_stat_activity
    WHERE datname = current_database()
      AND pid <> pg_backend_pid()
      AND state NOT IN ('idle')
      AND now() - query_start > make_interval(secs => threshold_seconds)
    ORDER BY duration_sec DESC
$function$;
REVOKE ALL ON FUNCTION public.detect_long_running_queries(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.detect_long_running_queries(integer) TO service_role;

-- 6) RLS automatico em tabela nova do schema public (event trigger),
--    como ja acontece em producao.
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;
DROP EVENT TRIGGER IF EXISTS ensure_rls;
CREATE EVENT TRIGGER ensure_rls ON ddl_command_end EXECUTE FUNCTION public.rls_auto_enable();

-- 7) Views de operacao (somente service_role, como em producao).
CREATE OR REPLACE VIEW public.connection_monitor AS
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
  ORDER BY (count(*)) DESC
;
REVOKE ALL ON public.connection_monitor FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.connection_monitor TO service_role;

CREATE OR REPLACE VIEW public.index_health_report AS
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
        END), (pg_relation_size(i.oid::regclass)) DESC
;
REVOKE ALL ON public.index_health_report FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.index_health_report TO service_role;

CREATE OR REPLACE VIEW public.query_performance_summary AS
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
   FROM extensions.pg_stat_statements
  ORDER BY total_exec_time DESC
;
REVOKE ALL ON public.query_performance_summary FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.query_performance_summary TO service_role;

COMMENT ON VIEW public.connection_monitor IS 'Conexoes por estado/espera do banco (operacao)';
COMMENT ON VIEW public.index_health_report IS 'Saude dos indices: candidatos a remocao e uso (operacao)';
COMMENT ON VIEW public.query_performance_summary IS 'Top consultas por tempo total (pg_stat_statements)';
