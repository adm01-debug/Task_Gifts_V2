CREATE OR REPLACE FUNCTION public.exec_sql(query text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t',
    query
  ) INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    EXECUTE query;
    RETURN '[]'::jsonb;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM, 'code', SQLSTATE);
  END;
END;
$function$
