CREATE OR REPLACE FUNCTION public.auto_promote_expired_webhook_secrets()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_promoted jsonb;
  v_count integer;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  WITH promoted AS (
    UPDATE public.webhook_subscriptions
       SET secret = [REDACTED],
           secret_next = NULL,
           secret_next_expires_at = NULL,
           updated_at = now()
     WHERE secret_next IS NOT NULL
       AND secret_next_expires_at IS NOT NULL
       AND secret_next_expires_at <= now()
    RETURNING id, name, url
  )
  SELECT COALESCE(jsonb_agg(row_to_json(promoted)), '[]'::jsonb), COUNT(*)
    INTO v_promoted, v_count
  FROM promoted;

  IF v_count > 0 THEN
    INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
    VALUES (
      'webhook_secret_auto_promoted',
      'medium',
      'Rotação automática de secrets HMAC concluída',
      format('%s assinatura(s) tiveram o secret promovido automaticamente após o fim da janela de graça.', v_count),
      jsonb_build_object('promoted', v_promoted, 'promoted_at', now())
    );
  END IF;

  RETURN jsonb_build_object(
    'promoted_count', v_count,
    'promoted', v_promoted,
    'executed_at', now()
  );
END;
$function$
