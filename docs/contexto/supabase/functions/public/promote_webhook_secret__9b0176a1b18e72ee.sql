CREATE OR REPLACE FUNCTION public.promote_webhook_secret(p_subscription_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  UPDATE public.webhook_subscriptions
     SET secret = [REDACTED], secret),
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
$function$
