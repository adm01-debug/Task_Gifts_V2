CREATE OR REPLACE FUNCTION public.rotate_webhook_secret(p_subscription_id uuid, p_new_secret text, p_grace_hours integer DEFAULT 24)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
     SET secret_next = [REDACTED],
         secret_next_expires_at = [REDACTED],
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
$function$
