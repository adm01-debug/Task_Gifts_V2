CREATE OR REPLACE FUNCTION public.register_device(p_user_id uuid, p_fingerprint text, p_ip_address inet, p_user_agent text, p_browser text DEFAULT NULL::text, p_os text DEFAULT NULL::text, p_device_type text DEFAULT 'desktop'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_device user_devices%ROWTYPE;
  v_is_new BOOLEAN := false;
  v_device_id UUID;
  v_alert_id UUID;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado: dispositivo só pode ser registrado para a própria conta'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_device
  FROM user_devices
  WHERE user_id = p_user_id AND device_fingerprint = p_fingerprint;

  IF v_device IS NULL THEN
    v_is_new := true;

    INSERT INTO user_devices (
      user_id, device_fingerprint, ip_address, user_agent,
      browser, os, device_type
    ) VALUES (
      p_user_id, p_fingerprint, p_ip_address, p_user_agent,
      p_browser, p_os, p_device_type
    )
    RETURNING id INTO v_device_id;

    INSERT INTO new_device_alerts (user_id, device_id, ip_address, user_agent)
    VALUES (p_user_id, v_device_id, p_ip_address, p_user_agent)
    RETURNING id INTO v_alert_id;

    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      p_user_id,
      'security',
      'Novo dispositivo detectado',
      'Um login foi realizado de um novo dispositivo: ' || COALESCE(p_browser, 'Navegador desconhecido') || ' em ' || COALESCE(p_os, 'Sistema desconhecido'),
      jsonb_build_object(
        'alert_id', v_alert_id,
        'device_id', v_device_id,
        'ip_address', p_ip_address::TEXT,
        'browser', p_browser,
        'os', p_os
      )
    );
  ELSE
    UPDATE user_devices
    SET
      last_seen_at = now(),
      ip_address = COALESCE(p_ip_address, ip_address)
    WHERE id = v_device.id;

    v_device_id := v_device.id;
  END IF;

  RETURN jsonb_build_object(
    'is_new_device', v_is_new,
    'device_id', v_device_id,
    'is_trusted', COALESCE(v_device.is_trusted, false)
  );
END;
$function$
