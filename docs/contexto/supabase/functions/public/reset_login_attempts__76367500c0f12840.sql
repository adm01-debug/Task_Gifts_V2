CREATE OR REPLACE FUNCTION public.reset_login_attempts(p_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NOT NULL THEN
    IF NOT public.has_role(v_uid, 'admin')
       AND lower(COALESCE(p_email, '')) IS DISTINCT FROM lower(COALESCE(auth.jwt() ->> 'email', '')) THEN
      RAISE EXCEPTION 'Acesso negado: só é possível limpar tentativas da própria conta'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE login_attempts
  SET error_message = NULL
  WHERE email = p_email
    AND error_message IS NOT NULL
    AND created_at > now() - INTERVAL '30 minutes';
END;
$function$
