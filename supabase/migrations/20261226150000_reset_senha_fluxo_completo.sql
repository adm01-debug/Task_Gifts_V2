-- Fecha o fluxo "esqueci minha senha" por aprovacao do gestor.
--
-- Antes: a solicitacao era criada e o gestor aprovava, gerando um reset_token
-- (approve_password_reset) — mas nada entregava esse token ao colaborador e
-- nenhuma funcao trocava a senha a partir dele. A tela /reset-password so
-- funcionava pelo link de e-mail do Supabase, que nao passa pela aprovacao.
--
-- Agora: o gestor entrega o link com o token e o colaborador define a nova
-- senha pelo proprio sistema, sem depender de SMTP.

-- 1) Um unico pedido pendente por colaborador (fecha a corrida de dois envios).
CREATE UNIQUE INDEX IF NOT EXISTS uq_password_reset_pendente_por_usuario
  ON public.password_reset_requests (user_id)
  WHERE status = 'pending';

-- 2) Pedido idempotente e sem revelar se o e-mail existe.
CREATE OR REPLACE FUNCTION public.request_password_reset_by_email(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_recentes integer;
BEGIN
  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RETURN true;
  END IF;

  SELECT p.id INTO v_user_id
  FROM public.profiles p
  WHERE lower(p.email) = lower(btrim(p_email))
  LIMIT 1;

  -- Resposta sempre identica: nao confirma se o e-mail tem conta.
  IF v_user_id IS NULL THEN
    RETURN true;
  END IF;

  -- Pedidos vencidos deixam de bloquear o indice unico.
  UPDATE public.password_reset_requests
     SET status = 'expired'
   WHERE user_id = v_user_id
     AND status = 'pending'
     AND expires_at <= now();

  -- Limita abuso de quem dispara pedidos para contas alheias.
  SELECT count(*) INTO v_recentes
  FROM public.password_reset_requests
  WHERE user_id = v_user_id
    AND created_at > now() - INTERVAL '1 hour';

  IF v_recentes >= 5 THEN
    RETURN true;
  END IF;

  INSERT INTO public.password_reset_requests (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) WHERE status = 'pending' DO NOTHING;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.request_password_reset_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_password_reset_by_email(text) TO anon, authenticated, service_role;

-- 3) Troca de senha a partir do token aprovado pelo gestor.
CREATE OR REPLACE FUNCTION public.reset_password_with_token(p_token uuid, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_request public.password_reset_requests%ROWTYPE;
BEGIN
  IF p_token IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Link inválido ou expirado.');
  END IF;

  IF p_password IS NULL OR length(p_password) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'A senha precisa ter ao menos 8 caracteres.');
  END IF;

  SELECT * INTO v_request
  FROM public.password_reset_requests
  WHERE reset_token = p_token
    AND status = 'approved'
    AND completed_at IS NULL
  LIMIT 1;

  IF v_request IS NULL
     OR v_request.reset_token_expires_at IS NULL
     OR v_request.reset_token_expires_at <= now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Link inválido ou expirado. Peça um novo ao seu gestor.');
  END IF;

  UPDATE auth.users
     SET encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
         updated_at = now()
   WHERE id = v_request.user_id;

  UPDATE public.password_reset_requests
     SET status = 'completed',
         completed_at = now(),
         reset_token = NULL,
         updated_at = now()
   WHERE id = v_request.id;

  RETURN jsonb_build_object('success', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.reset_password_with_token(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_password_with_token(uuid, text) TO anon, authenticated, service_role;