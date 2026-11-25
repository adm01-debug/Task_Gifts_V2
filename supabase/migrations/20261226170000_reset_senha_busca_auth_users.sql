-- A solicitação de redefinição usava public.profiles como fonte do e-mail.
-- Existem contas em auth.users sem linha em profiles (3 de 9 hoje): para elas o
-- pedido era descartado em silêncio e a RPC respondia "true", então a pessoa
-- nunca recebia nada e o RH não via pedido nenhum.
-- Login usa auth.users; a redefinição passa a usar a mesma fonte, com fallback
-- para profiles.

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

  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE lower(u.email) = lower(btrim(p_email))
  LIMIT 1;

  IF v_user_id IS NULL THEN
    SELECT p.id INTO v_user_id
    FROM public.profiles p
    WHERE lower(p.email) = lower(btrim(p_email))
    LIMIT 1;
  END IF;

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

GRANT EXECUTE ON FUNCTION public.request_password_reset_by_email(text) TO anon, authenticated, service_role;