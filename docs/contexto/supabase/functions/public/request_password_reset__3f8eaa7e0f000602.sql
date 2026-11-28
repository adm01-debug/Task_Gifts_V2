CREATE OR REPLACE FUNCTION public.request_password_reset(p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_request_id UUID;
  v_existing_pending UUID;
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NOT NULL
     AND p_user_id IS DISTINCT FROM v_uid
     AND NOT public.has_role(v_uid, 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: solicitação permitida apenas para a própria conta'
      USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_existing_pending
  FROM password_reset_requests
  WHERE user_id = p_user_id
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;

  IF v_existing_pending IS NOT NULL THEN
    RAISE EXCEPTION 'Já existe uma solicitação de reset pendente';
  END IF;

  INSERT INTO password_reset_requests (user_id)
  VALUES (p_user_id)
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$function$
