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
     SET encrypted_password = [REDACTED], extensions.gen_salt('bf')),
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
$function$
