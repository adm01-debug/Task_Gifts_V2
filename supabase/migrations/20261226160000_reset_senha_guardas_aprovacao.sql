-- Guardas de autorização no fluxo de redefinição de senha.
-- approve_password_reset/reject_password_reset são SECURITY DEFINER: as policies de
-- RLS de password_reset_requests não são aplicadas no corpo delas. Sem a guarda,
-- qualquer usuário autenticado aprova o pedido de outra pessoa e recebe o reset_token,
-- que permite trocar a senha dela (tomada de conta).
-- A regra replica exatamente a policy "Managers can update team password reset requests".

CREATE OR REPLACE FUNCTION public.approve_password_reset(p_request_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_request password_reset_requests%ROWTYPE;
  v_reset_token UUID;
BEGIN
  SELECT * INTO v_request
  FROM password_reset_requests
  WHERE id = p_request_id;

  IF v_request IS NULL THEN
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
        AND tm2.user_id = v_request.user_id
    )
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para aprovar esta solicitação');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solicitação não está pendente');
  END IF;

  IF v_request.expires_at < now() THEN
    UPDATE password_reset_requests SET status = 'expired' WHERE id = p_request_id;
    RETURN jsonb_build_object('success', false, 'error', 'Solicitação expirada');
  END IF;

  v_reset_token := gen_random_uuid();

  UPDATE password_reset_requests
  SET
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_notes = p_notes,
    reset_token = v_reset_token,
    reset_token_expires_at = now() + INTERVAL '1 hour'
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'reset_token', v_reset_token,
    'user_id', v_request.user_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_password_reset(p_request_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_request password_reset_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request
  FROM password_reset_requests
  WHERE id = p_request_id;

  IF v_request IS NULL THEN
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
        AND tm2.user_id = v_request.user_id
    )
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para rejeitar esta solicitação');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solicitação não está pendente');
  END IF;

  UPDATE password_reset_requests
  SET
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_notes = p_notes
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.approve_password_reset(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.reject_password_reset(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.approve_password_reset(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_password_reset(uuid, text) TO authenticated, service_role;