CREATE OR REPLACE FUNCTION public.reject_password_reset(p_request_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_updated integer;
BEGIN
  SELECT user_id INTO v_user_id
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
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para rejeitar esta solicitação');
  END IF;

  UPDATE password_reset_requests
     SET status = 'rejected',
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         review_notes = p_notes,
         updated_at = now()
   WHERE id = p_request_id
     AND status = 'pending';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solicitação não está mais pendente');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$function$
