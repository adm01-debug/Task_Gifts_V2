-- 1) Ligação por fingerprint
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_fingerprint
  ON public.push_subscriptions(user_id, device_fingerprint)
  WHERE device_fingerprint IS NOT NULL;

ALTER TABLE public.user_devices
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_reason TEXT;

-- 2) Revogação em cascata (inscrição -> todas as inscrições do mesmo aparelho -> user_devices)
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
$function$;

REVOKE ALL ON FUNCTION public.revoke_push_device(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_push_device(uuid, text) TO authenticated;

-- 3) Revogação a partir do aparelho (quando não há inscrição de push ativa)
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
$function$;

REVOKE ALL ON FUNCTION public.revoke_device_by_fingerprint(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_device_by_fingerprint(text, text) TO authenticated;

-- 4) Visão unificada de aparelhos da conta
CREATE OR REPLACE FUNCTION public.get_account_devices()
RETURNS TABLE(
  device_key text,
  fingerprint text,
  subscription_id uuid,
  endpoint text,
  device_label text,
  user_agent text,
  browser text,
  os text,
  device_type text,
  is_trusted boolean,
  push_active boolean,
  last_seen_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz,
  disabled_at timestamptz,
  disabled_reason text,
  failure_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH subs AS (
    SELECT DISTINCT ON (COALESCE(ps.device_fingerprint, ps.endpoint))
      COALESCE(ps.device_fingerprint, ps.endpoint) AS key,
      ps.device_fingerprint,
      ps.id,
      ps.endpoint,
      ps.device_label,
      ps.user_agent,
      ps.last_used_at,
      ps.created_at,
      ps.disabled_at,
      ps.disabled_reason,
      ps.failure_count
    FROM public.push_subscriptions ps
    WHERE ps.user_id = auth.uid()
    ORDER BY COALESCE(ps.device_fingerprint, ps.endpoint),
             (ps.disabled_at IS NULL) DESC,
             ps.last_used_at DESC NULLS LAST,
             ps.created_at DESC
  ),
  devs AS (
    SELECT DISTINCT ON (ud.device_fingerprint)
      ud.device_fingerprint,
      ud.user_agent,
      ud.browser,
      ud.os,
      ud.device_type,
      ud.is_trusted,
      ud.last_seen_at,
      ud.created_at,
      ud.revoked_at,
      ud.revoked_reason
    FROM public.user_devices ud
    WHERE ud.user_id = auth.uid()
    ORDER BY ud.device_fingerprint, ud.last_seen_at DESC
  )
  SELECT
    COALESCE(s.key, d.device_fingerprint)::text,
    COALESCE(s.device_fingerprint, d.device_fingerprint)::text,
    s.id,
    s.endpoint,
    s.device_label,
    COALESCE(s.user_agent, d.user_agent),
    d.browser,
    d.os,
    d.device_type,
    COALESCE(d.is_trusted, false),
    (s.id IS NOT NULL AND s.disabled_at IS NULL),
    d.last_seen_at,
    s.last_used_at,
    LEAST(COALESCE(s.created_at, d.created_at), COALESCE(d.created_at, s.created_at)),
    COALESCE(s.disabled_at, d.revoked_at),
    COALESCE(s.disabled_reason, d.revoked_reason),
    COALESCE(s.failure_count, 0)
  FROM subs s
  FULL OUTER JOIN devs d ON d.device_fingerprint = s.device_fingerprint
  ORDER BY 12 DESC NULLS LAST, 13 DESC NULLS LAST;
$function$;

REVOKE ALL ON FUNCTION public.get_account_devices() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_account_devices() TO authenticated;