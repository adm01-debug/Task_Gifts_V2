-- Fase 42: rotação segura de secret HMAC com dupla assinatura
ALTER TABLE public.webhook_subscriptions
  ADD COLUMN IF NOT EXISTS secret_next TEXT,
  ADD COLUMN IF NOT EXISTS secret_next_expires_at TIMESTAMPTZ;

-- Iniciar rotação: apenas admin
CREATE OR REPLACE FUNCTION public.rotate_webhook_secret(
  p_subscription_id UUID,
  p_new_secret TEXT,
  p_grace_hours INTEGER DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hours INTEGER := GREATEST(1, LEAST(168, COALESCE(p_grace_hours, 24)));
  v_expires TIMESTAMPTZ;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  IF p_new_secret IS NULL OR length(p_new_secret) < 32 THEN
    RAISE EXCEPTION 'secret deve ter no mínimo 32 caracteres';
  END IF;

  v_expires := now() + (v_hours * INTERVAL '1 hour');

  UPDATE public.webhook_subscriptions
     SET secret_next = p_new_secret,
         secret_next_expires_at = v_expires,
         updated_at = now()
   WHERE id = p_subscription_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'assinatura % não encontrada', p_subscription_id;
  END IF;

  RETURN jsonb_build_object(
    'subscription_id', p_subscription_id,
    'grace_hours', v_hours,
    'expires_at', v_expires
  );
END;
$$;

-- Promover: novo vira primário
CREATE OR REPLACE FUNCTION public.promote_webhook_secret(p_subscription_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  UPDATE public.webhook_subscriptions
     SET secret = COALESCE(secret_next, secret),
         secret_next = NULL,
         secret_next_expires_at = NULL,
         updated_at = now()
   WHERE id = p_subscription_id
     AND secret_next IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'nenhuma rotação pendente para assinatura %', p_subscription_id;
  END IF;

  RETURN jsonb_build_object('subscription_id', p_subscription_id, 'promoted_at', now());
END;
$$;

-- Cancelar rotação em andamento
CREATE OR REPLACE FUNCTION public.cancel_webhook_secret_rotation(p_subscription_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  UPDATE public.webhook_subscriptions
     SET secret_next = NULL,
         secret_next_expires_at = NULL,
         updated_at = now()
   WHERE id = p_subscription_id;

  RETURN jsonb_build_object('subscription_id', p_subscription_id, 'cancelled_at', now());
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rotate_webhook_secret(UUID, TEXT, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.promote_webhook_secret(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cancel_webhook_secret_rotation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rotate_webhook_secret(UUID, TEXT, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.promote_webhook_secret(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_webhook_secret_rotation(UUID) TO authenticated, service_role;