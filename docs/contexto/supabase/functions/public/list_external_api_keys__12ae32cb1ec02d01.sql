CREATE OR REPLACE FUNCTION public.list_external_api_keys()
 RETURNS TABLE(id uuid, name text, description text, api_key text, system_type text, permissions jsonb, is_active boolean, rate_limit_per_minute integer, last_used_at timestamp with time zone, secret_last_rotated_at timestamp with time zone, days_since_rotation integer, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public._require_admin();

  RETURN QUERY
  SELECT
    eak.id,
    eak.name,
    eak.description,
    -- Exibe apenas prefixo + sufixo do identificador público
    left(eak.api_key, 6) || '…' || right(eak.api_key, 4) AS api_key,
    eak.system_type,
    eak.permissions,
    eak.is_active,
    eak.rate_limit_per_minute,
    eak.last_used_at,
    eak.secret_last_rotated_at,
    GREATEST(0, EXTRACT(DAY FROM now() - COALESCE(eak.secret_last_rotated_at, eak.created_at))::int) AS days_since_rotation,
    eak.created_at
  FROM public.external_api_keys eak
  ORDER BY eak.created_at DESC;
END;
$function$
