-- 1) Auditoria nas RPCs de chaves de API
CREATE OR REPLACE FUNCTION public.create_external_api_key(p_name text, p_description text DEFAULT NULL::text, p_system_type text DEFAULT 'generic'::text, p_permissions jsonb DEFAULT '["read"]'::jsonb, p_rate_limit_per_minute integer DEFAULT 60)
 RETURNS TABLE(id uuid, api_key text, api_secret text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_key text; v_secret text; v_salt text; v_id uuid;
BEGIN
  PERFORM public._require_admin();

  IF p_name IS NULL OR length(btrim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Nome da chave é obrigatório';
  END IF;
  IF COALESCE(p_rate_limit_per_minute, 0) < 1 OR p_rate_limit_per_minute > 10000 THEN
    RAISE EXCEPTION 'rate_limit_per_minute deve estar entre 1 e 10000';
  END IF;

  v_key := 'tg_' || encode(extensions.gen_random_bytes(18), 'hex');
  v_secret := encode(extensions.gen_random_bytes(32), 'hex');
  v_salt := encode(extensions.gen_random_bytes(16), 'hex');

  INSERT INTO public.external_api_keys (
    name, description, api_key, secret_salt, secret_hash,
    system_type, permissions, rate_limit_per_minute, created_by, secret_last_rotated_at
  ) VALUES (
    btrim(p_name), p_description, v_key, v_salt,
    encode(extensions.digest(v_salt || v_secret, 'sha256'), 'hex'),
    COALESCE(p_system_type, 'generic'),
    COALESCE(p_permissions, '["read"]'::jsonb),
    p_rate_limit_per_minute, auth.uid(), now()
  )
  RETURNING external_api_keys.id INTO v_id;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'api_key_created', 'external_api_key', v_id,
          jsonb_build_object('name', btrim(p_name), 'api_key_masked', left(v_key, 6) || '…' || right(v_key, 4),
                             'system_type', COALESCE(p_system_type, 'generic'),
                             'rate_limit_per_minute', p_rate_limit_per_minute));

  RETURN QUERY SELECT v_id, v_key, v_secret;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rotate_external_api_secret(p_id uuid)
 RETURNS TABLE(id uuid, api_key text, api_secret text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_secret text; v_salt text; v_key text; v_name text;
BEGIN
  PERFORM public._require_admin();

  SELECT eak.api_key, eak.name INTO v_key, v_name FROM public.external_api_keys eak WHERE eak.id = p_id;
  IF v_key IS NULL THEN
    RAISE EXCEPTION 'Chave de API não encontrada';
  END IF;

  v_secret := encode(extensions.gen_random_bytes(32), 'hex');
  v_salt := encode(extensions.gen_random_bytes(16), 'hex');

  UPDATE public.external_api_keys
  SET secret_salt = v_salt,
      secret_hash = encode(extensions.digest(v_salt || v_secret, 'sha256'), 'hex'),
      secret_last_rotated_at = now()
  WHERE external_api_keys.id = p_id;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'api_key_rotated', 'external_api_key', p_id,
          jsonb_build_object('name', v_name, 'api_key_masked', left(v_key, 6) || '…' || right(v_key, 4)));

  RETURN QUERY SELECT p_id, v_key, v_secret;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_external_api_key_active(p_id uuid, p_active boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_name text; v_key text; v_old boolean;
BEGIN
  PERFORM public._require_admin();
  IF p_id IS NULL OR p_active IS NULL THEN
    RAISE EXCEPTION 'Parâmetros inválidos';
  END IF;

  SELECT eak.name, eak.api_key, eak.is_active INTO v_name, v_key, v_old
  FROM public.external_api_keys eak WHERE eak.id = p_id;
  IF v_key IS NULL THEN
    RAISE EXCEPTION 'Chave de API não encontrada';
  END IF;

  UPDATE public.external_api_keys SET is_active = p_active WHERE external_api_keys.id = p_id;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (auth.uid(), 'api_key_status_changed', 'external_api_key', p_id,
          jsonb_build_object('is_active', v_old),
          jsonb_build_object('is_active', p_active, 'name', v_name,
                             'api_key_masked', left(v_key, 6) || '…' || right(v_key, 4)));

  RETURN p_active;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_external_api_key(p_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_name text; v_key text;
BEGIN
  PERFORM public._require_admin();

  SELECT eak.name, eak.api_key INTO v_name, v_key
  FROM public.external_api_keys eak WHERE eak.id = p_id;
  IF v_key IS NULL THEN
    RAISE EXCEPTION 'Chave de API não encontrada';
  END IF;

  DELETE FROM public.external_api_keys WHERE external_api_keys.id = p_id;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data)
  VALUES (auth.uid(), 'api_key_deleted', 'external_api_key', p_id,
          jsonb_build_object('name', v_name, 'api_key_masked', left(v_key, 6) || '…' || right(v_key, 4)));

  RETURN true;
END;
$function$;

-- 2) Verificação semanal de rotação vencida
CREATE OR REPLACE FUNCTION public.check_api_key_rotation_overdue()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer := 0;
  r record;
BEGIN
  FOR r IN
    SELECT eak.id, eak.name, eak.api_key,
           GREATEST(0, EXTRACT(DAY FROM now() - COALESCE(eak.secret_last_rotated_at, eak.created_at))::int) AS days
    FROM public.external_api_keys eak
    WHERE eak.is_active = true
      AND COALESCE(eak.secret_last_rotated_at, eak.created_at) < now() - interval '90 days'
  LOOP
    -- Evita duplicidade: um alerta aberto por chave a cada 7 dias
    IF NOT EXISTS (
      SELECT 1 FROM public.security_alerts sa
      WHERE sa.alert_type = 'api_key_rotation_overdue'
        AND sa.metadata->>'key_id' = r.id::text
        AND sa.is_resolved = false
        AND sa.created_at > now() - interval '7 days'
    ) THEN
      INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
      VALUES (
        'api_key_rotation_overdue',
        CASE WHEN r.days >= 180 THEN 'high' ELSE 'medium' END,
        'Chave de API sem rotação há ' || r.days || ' dias',
        'A chave "' || r.name || '" (' || left(r.api_key, 6) || '…' || right(r.api_key, 4) ||
        ') está ativa e não tem o segredo rotacionado há ' || r.days || ' dias. Rotacione em Admin > Chaves de API.',
        jsonb_build_object('key_id', r.id, 'name', r.name, 'days_since_rotation', r.days)
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.check_api_key_rotation_overdue() FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule('api-key-rotation-overdue-weekly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'api-key-rotation-overdue-weekly');

SELECT cron.schedule(
  'api-key-rotation-overdue-weekly',
  '0 9 * * 1',
  $$SELECT public.check_api_key_rotation_overdue();$$
);