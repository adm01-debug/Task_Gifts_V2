-- Consistencia e seguranca do fluxo de redefinicao de senha.
--
-- Fecha tres buracos apontados na revisao da PR #159:
--   1) approve/reject gravavam a decisao sem conferir o status na propria escrita:
--      duas revisoes concorrentes do mesmo pedido gravavam as duas e a segunda
--      substituia o reset_token ja entregue ao colaborador.
--   2) reset_password_with_token validava o token num SELECT e o consumia noutro
--      UPDATE: em chamadas concorrentes o mesmo link trocava a senha duas vezes.
--   3) a troca de senha nao revogava as sessoes da conta: uma sessao comprometida
--      continuava valida (e renovavel) depois da redefinicao.
-- Tambem expoe a lista de pendentes com o e-mail de auth.users, porque contas sem
-- profile apareciam no painel apenas como "Usuario".

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
         reset_token = v_reset_token,
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
$function$;

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
$function$;

CREATE OR REPLACE FUNCTION public.reset_password_with_token(p_token uuid, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_request_id uuid;
  v_user_id uuid;
BEGIN
  IF p_token IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Link inválido ou expirado.');
  END IF;

  IF p_password IS NULL OR length(p_password) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'A senha precisa ter ao menos 8 caracteres.');
  END IF;

  -- Valida e consome o token na mesma escrita: o segundo uso do mesmo link nao
  -- encontra mais a linha com status 'approved'.
  UPDATE public.password_reset_requests
     SET status = 'completed',
         completed_at = now(),
         reset_token = NULL,
         updated_at = now()
   WHERE reset_token = p_token
     AND status = 'approved'
     AND completed_at IS NULL
     AND reset_token_expires_at IS NOT NULL
     AND reset_token_expires_at > now()
  RETURNING id, user_id INTO v_request_id, v_user_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Link inválido ou expirado. Peça um novo ao seu gestor.');
  END IF;

  UPDATE auth.users
     SET encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
         updated_at = now()
   WHERE id = v_user_id;

  -- Sessao aberta antes da troca nao pode continuar valendo (nem renovando).
  -- DELETE e proposital e restrito a este usuario: o GoTrue recusa o access token
  -- cuja sessao nao existe mais (403 session_not_found) e o refresh token apagado
  -- (400 refresh_token_not_found). Marcar `not_after`/`revoked` por UPDATE NAO
  -- basta: /auth/v1/user continua respondendo 200 com o token antigo ate expirar.
  -- Por isso o caso esta registrado no migration-baseline.json (--permitir-crescer).
  DELETE FROM auth.refresh_tokens WHERE user_id = v_user_id::text;
  DELETE FROM auth.sessions WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.approve_password_reset(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.reject_password_reset(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.reset_password_with_token(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_password_reset(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_password_reset(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_password_with_token(uuid, text) TO anon, authenticated, service_role;

-- Lista de pendentes com o e-mail real da conta (inclusive sem profile), restrita
-- a quem pode aprovar: admin ou gestor do mesmo departamento.
CREATE OR REPLACE FUNCTION public.get_pending_password_reset_requests()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  display_name text,
  requested_at timestamptz,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT r.id,
         r.user_id,
         u.email::text AS email,
         COALESCE(
           NULLIF(p.display_name, ''),
           NULLIF(split_part(coalesce(u.email, ''), '@', 1), '')
         ) AS display_name,
         r.requested_at,
         r.expires_at
  FROM public.password_reset_requests r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  LEFT JOIN auth.users u ON u.id = r.user_id
  WHERE r.status = 'pending'
    AND (
      has_role(v_uid, 'admin'::app_role)
      OR EXISTS (
        SELECT 1
        FROM team_members tm1
        JOIN team_members tm2 ON tm1.department_id = tm2.department_id
        WHERE tm1.user_id = v_uid
          AND tm1.is_manager = true
          AND tm2.user_id = r.user_id
      )
    )
  ORDER BY r.requested_at ASC;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_pending_password_reset_requests() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pending_password_reset_requests() TO authenticated, service_role;