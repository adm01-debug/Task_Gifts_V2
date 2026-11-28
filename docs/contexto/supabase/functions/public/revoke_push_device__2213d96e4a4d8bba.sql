CREATE OR REPLACE FUNCTION public.revoke_push_device(p_subscription_id uuid, p_reason text DEFAULT 'revoked_by_user'::text)
 RETURNS TABLE(revoked boolean, device_label text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_row public.push_subscriptions%ROWTYPE;
  v_reason text := COALESCE(NULLIF(btrim(p_reason), ''), 'revoked_by_user');
  v_sibling public.push_subscriptions%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_row
  FROM public.push_subscriptions
  WHERE id = p_subscription_id AND user_id = v_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'device_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_row.disabled_at IS NOT NULL THEN
    RETURN QUERY SELECT false, v_row.device_label;
    RETURN;
  END IF;

  UPDATE public.push_subscriptions
     SET disabled_at = now(),
         disabled_reason = v_reason,
         updated_at = now()
   WHERE id = v_row.id;

  INSERT INTO public.push_sync_events (user_id, subscription_id, endpoint, device_label, event, detail)
  VALUES (v_user, v_row.id, v_row.endpoint, v_row.device_label, 'revoked',
          'Acesso removido remotamente pelo usuário.');

  -- Mesmo aparelho pode ter mais de uma inscrição (renovação do endpoint pelo
  -- navegador). Sem a cascata, o aparelho continuaria recebendo push.
  IF v_row.device_fingerprint IS NOT NULL THEN
    FOR v_sibling IN
      SELECT * FROM public.push_subscriptions
      WHERE user_id = v_user
        AND device_fingerprint = v_row.device_fingerprint
        AND id <> v_row.id
        AND disabled_at IS NULL
      FOR UPDATE
    LOOP
      UPDATE public.push_subscriptions
         SET disabled_at = now(), disabled_reason = v_reason, updated_at = now()
       WHERE id = v_sibling.id;

      INSERT INTO public.push_sync_events (user_id, subscription_id, endpoint, device_label, event, detail)
      VALUES (v_user, v_sibling.id, v_sibling.endpoint, v_sibling.device_label, 'revoked',
              'Inscrição do mesmo aparelho removida em cascata.');
    END LOOP;

    UPDATE public.user_devices
       SET revoked_at = now(),
           revoked_reason = v_reason,
           is_trusted = false
     WHERE user_id = v_user
       AND device_fingerprint = v_row.device_fingerprint
       AND revoked_at IS NULL;
  END IF;

  RETURN QUERY SELECT true, v_row.device_label;
END;
$function$
