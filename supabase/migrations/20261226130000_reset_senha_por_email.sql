-- Fluxo "esqueci minha senha" do usuário deslogado.
--
-- Antes: src/pages/Auth.tsx lia `profiles` por e-mail (bloqueado pela RLS para
-- `anon`, sempre vazio) e depois chamava passwordResetService.requestPasswordReset(),
-- que exige sessão ("Usuário não autenticado"). Resultado: a tela sempre
-- respondia "Email não encontrado no sistema" e ninguém conseguia pedir reset.
--
-- Agora: uma única RPC SECURITY DEFINER resolve a busca e a criação da
-- solicitação, sem abrir leitura de `profiles` para anônimos.

CREATE OR REPLACE FUNCTION public.request_password_reset_by_email(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RETURN false;
  END IF;

  SELECT p.id INTO v_user_id
  FROM public.profiles p
  WHERE lower(p.email) = lower(btrim(p_email))
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.password_reset_requests
    WHERE user_id = v_user_id
      AND status = 'pending'
      AND expires_at > now()
  ) THEN
    RETURN true;
  END IF;

  INSERT INTO public.password_reset_requests (user_id) VALUES (v_user_id);
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.request_password_reset_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_password_reset_by_email(text) TO anon, authenticated, service_role;