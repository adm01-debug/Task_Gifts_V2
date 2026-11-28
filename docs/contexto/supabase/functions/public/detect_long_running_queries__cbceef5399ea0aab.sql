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
$function$
