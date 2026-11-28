CREATE OR REPLACE FUNCTION public.approve_password_reset(p_request_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_expires_at timestamptz;
  v_reset_token uuid := gen_random_uuid();
  v_updated integer;
BEGIN
  SELECT user_id, expires_at INTO v_user_id, v_expires_at
  FROM password_reset_requests
  WHERE id = p_request_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solicitação não encontrada');
  END IF;

  IF NOT (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM team_members tm1
      JOIN team_members tm2 ON tm1.department_id = tm2.department_id
      WHERE tm1.user_id = auth.uid()
        AND tm1.is_manager = true
        AND tm2.user_id = v_user_id
    )
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para aprovar esta solicitação');
  END IF;

  IF v_expires_at < now() THEN
    UPDATE password_reset_requests
       SET status = 'expired', updated_at = now()
     WHERE id = p_request_id
       AND status = 'pending';
    RETURN jsonb_build_object('success', false, 'error', 'Solicitação expirada');
  END IF;

  -- A condicao de status faz parte da escrita: duas aprovacoes concorrentes nao
  -- podem mais gerar dois tokens, o segundo UPDATE simplesmente nao encontra linha.
  UPDATE password_reset_requests
     SET status = 'approved',
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         review_notes = p_notes,
         reset_token = [REDACTED],
         reset_token_expires_at = now() + INTERVAL '1 hour',
         updated_at = now()
   WHERE id = p_request_id
     AND status = 'pending';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solicitação não está mais pendente');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'reset_token', v_reset_token,
    'user_id', v_user_id
  );
END;
$function$
