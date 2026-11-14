-- Fix drift de seguranca: guardas com current_setting falham quando a GUC
-- 'request.jwt.claim.role' nao esta setada (NULL no contexto PostgREST).
-- Prova: REST anon -> get_2fa_status 200 [], validate_reset_token 200 false;
-- simulacao SQL com GUC NULL -> funcao executa sem 42501 (NULL <> 'service_role' = NULL).
-- Guarda robusta: IS DISTINCT FROM 'service_role' -> NULL != 'service_role' = TRUE -> RAISE.

-- get_2fa_status: usuario so consulta o proprio status; service_role passa
CREATE OR REPLACE FUNCTION public.get_2fa_status(p_user_id uuid)
 RETURNS TABLE(is_enabled boolean, verified_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT u.is_enabled, u.verified_at
    FROM public.user_two_factor u
    WHERE u.user_id = p_user_id;
END;
$function$;

-- user_has_passkeys: usuario so consulta o proprio status; service_role passa
CREATE OR REPLACE FUNCTION public.user_has_passkeys(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.webauthn_credentials
    WHERE user_id = p_user_id AND is_active = true
  );
END;
$function$;

-- validate_reset_token: so via service_role (Edge Function)
CREATE OR REPLACE FUNCTION public.validate_reset_token(p_token uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.password_reset_requests
    WHERE reset_token = p_token
      AND status = 'pending'
      AND expires_at > now()
  );
END;
$function$;

-- ACL: garante que somente service_role executa validate_reset_token
REVOKE EXECUTE ON FUNCTION public.validate_reset_token(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_reset_token(uuid) TO service_role;

-- get_2fa_status: era EXECUTE pra todos (PUBLIC); remove de PUBLIC mas mantem
-- para anon/authenticated (front chama com token do usuario logado) e service_role.
REVOKE EXECUTE ON FUNCTION public.get_2fa_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_2fa_status(uuid) TO anon, authenticated, service_role;

-- user_has_passkeys: mantem anon/authenticated (front chama com token do usuario)
-- mas remove PUBLIC (uso externo sem token).
REVOKE EXECUTE ON FUNCTION public.user_has_passkeys(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_passkeys(uuid) TO anon, authenticated, service_role;