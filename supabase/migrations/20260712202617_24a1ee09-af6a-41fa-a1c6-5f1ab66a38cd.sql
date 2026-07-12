
CREATE OR REPLACE FUNCTION public.bulk_rotate_webhook_secrets(
  p_rotations jsonb,
  p_grace_hours integer DEFAULT 24
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hours integer := GREATEST(1, LEAST(168, COALESCE(p_grace_hours, 24)));
  v_expires timestamptz;
  v_item jsonb;
  v_sub_id uuid;
  v_secret text;
  v_results jsonb := '[]'::jsonb;
  v_count integer := 0;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(p_rotations) <> 'array' OR jsonb_array_length(p_rotations) = 0 THEN
    RAISE EXCEPTION 'p_rotations deve ser array não vazio';
  END IF;

  v_expires := now() + (v_hours * INTERVAL '1 hour');

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_rotations)
  LOOP
    v_sub_id := (v_item->>'subscription_id')::uuid;
    v_secret := v_item->>'secret';

    IF v_sub_id IS NULL OR v_secret IS NULL OR length(v_secret) < 32 THEN
      v_results := v_results || jsonb_build_object(
        'subscription_id', v_sub_id,
        'success', false,
        'error', 'subscription_id inválido ou secret com menos de 32 caracteres'
      );
      CONTINUE;
    END IF;

    UPDATE public.webhook_subscriptions
       SET secret_next = v_secret,
           secret_next_expires_at = v_expires,
           updated_at = now()
     WHERE id = v_sub_id;

    IF FOUND THEN
      v_count := v_count + 1;
      v_results := v_results || jsonb_build_object(
        'subscription_id', v_sub_id,
        'success', true,
        'expires_at', v_expires
      );
    ELSE
      v_results := v_results || jsonb_build_object(
        'subscription_id', v_sub_id,
        'success', false,
        'error', 'assinatura não encontrada'
      );
    END IF;
  END LOOP;

  INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
  VALUES (
    'webhook_secret_bulk_rotated',
    'medium',
    'Rotação em lote de secrets HMAC iniciada',
    format('%s assinatura(s) tiveram rotação iniciada com janela de graça de %sh.', v_count, v_hours),
    jsonb_build_object('results', v_results, 'grace_hours', v_hours, 'expires_at', v_expires)
  );

  RETURN jsonb_build_object(
    'rotated_count', v_count,
    'grace_hours', v_hours,
    'expires_at', v_expires,
    'results', v_results
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bulk_rotate_webhook_secrets(jsonb, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bulk_rotate_webhook_secrets(jsonb, integer) TO authenticated, service_role;
