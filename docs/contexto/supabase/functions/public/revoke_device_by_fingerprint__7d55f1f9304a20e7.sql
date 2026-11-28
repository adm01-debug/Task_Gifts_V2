CREATE OR REPLACE FUNCTION public.revoke_device_by_fingerprint(p_fingerprint text, p_reason text DEFAULT 'revoked_by_user'::text)
 RETURNS TABLE(revoked boolean, subscriptions_revoked integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_fp text := NULLIF(btrim(p_fingerprint), '');
  v_reason text := COALESCE(NULLIF(btrim(p_reason), ''), 'revoked_by_user');
  v_count integer := 0;
  v_device_exists boolean;
  v_changed boolean := false;
  v_sub public.push_subscriptions%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;
  IF v_fp IS NULL THEN
    RAISE EXCEPTION 'device_not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_devices
    WHERE user_id = v_user AND device_fingerprint = v_fp
  ) INTO v_device_exists;

  IF NOT v_device_exists AND NOT EXISTS (
    SELECT 1 FROM public.push_subscriptions
    WHERE user_id = v_user AND device_fingerprint = v_fp
  ) THEN
    RAISE EXCEPTION 'device_not_found' USING ERRCODE = 'P0002';
  END IF;

  FOR v_sub IN
    SELECT * FROM public.push_subscriptions
    WHERE user_id = v_user AND device_fingerprint = v_fp AND disabled_at IS NULL
    FOR UPDATE
  LOOP
    UPDATE public.push_subscriptions
       SET disabled_at = now(), disabled_reason = v_reason, updated_at = now()
     WHERE id = v_sub.id;

    INSERT INTO public.push_sync_events (user_id, subscription_id, endpoint, device_label, event, detail)
    VALUES (v_user, v_sub.id, v_sub.endpoint, v_sub.device_label, 'revoked',
            'Aparelho removido pelo usuário.');

    v_count := v_count + 1;
  END LOOP;

  UPDATE public.user_devices
     SET revoked_at = now(), revoked_reason = v_reason, is_trusted = false
   WHERE user_id = v_user AND device_fingerprint = v_fp AND revoked_at IS NULL;

  GET DIAGNOSTICS v_changed = ROW_COUNT;

  RETURN QUERY SELECT (v_count > 0 OR v_changed), v_count;
END;
$function$
