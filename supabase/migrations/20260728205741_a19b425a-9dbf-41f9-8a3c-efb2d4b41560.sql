CREATE OR REPLACE FUNCTION public.list_external_api_keys()
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  api_key text,
  system_type text,
  permissions jsonb,
  is_active boolean,
  rate_limit_per_minute integer,
  last_used_at timestamptz,
  secret_last_rotated_at timestamptz,
  days_since_rotation integer,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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
$function$;

REVOKE ALL ON FUNCTION public.list_external_api_keys() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_external_api_keys() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_external_api_key_active(p_id uuid, p_active boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public._require_admin();
  IF p_id IS NULL OR p_active IS NULL THEN
    RAISE EXCEPTION 'Parâmetros inválidos';
  END IF;

  UPDATE public.external_api_keys SET is_active = p_active WHERE external_api_keys.id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chave de API não encontrada';
  END IF;
  RETURN p_active;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_external_api_key_active(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_external_api_key_active(uuid, boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.delete_external_api_key(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public._require_admin();
  DELETE FROM public.external_api_keys WHERE external_api_keys.id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chave de API não encontrada';
  END IF;
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.delete_external_api_key(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_external_api_key(uuid) TO authenticated, service_role;