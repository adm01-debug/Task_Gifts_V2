CREATE OR REPLACE FUNCTION public.create_external_api_key(p_name text, p_description text DEFAULT NULL::text, p_system_type text DEFAULT 'generic'::text, p_permissions jsonb DEFAULT '["read"]'::jsonb, p_rate_limit_per_minute integer DEFAULT 60)
 RETURNS TABLE(id uuid, api_key text, api_secret text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE v_key text; v_secret text; v_salt text; v_id uuid;
BEGIN
  PERFORM public._require_admin();
  IF p_name IS NULL OR length(btrim(p_name)) = 0 THEN RAISE EXCEPTION 'Nome da chave é obrigatório'; END IF;
  IF COALESCE(p_rate_limit_per_minute, 0) < 1 OR p_rate_limit_per_minute > 10000 THEN RAISE EXCEPTION 'rate_limit_per_minute deve estar entre 1 e 10000'; END IF;
  v_key := 'tg_' || encode(extensions.gen_random_bytes(18), 'hex'); v_secret := encode(extensions.gen_random_bytes(32), 'hex'); v_salt := encode(extensions.gen_random_bytes(16), 'hex');
  INSERT INTO public.external_api_keys (name, description, api_key, secret_salt, secret_hash, system_type, permissions, rate_limit_per_minute, created_by, secret_last_rotated_at) VALUES (btrim(p_name), p_description, v_key, v_salt, encode(extensions.digest(v_salt || v_secret, 'sha256'), 'hex'), COALESCE(p_system_type, 'generic'), COALESCE(p_permissions, '["read"]'::jsonb), p_rate_limit_per_minute, auth.uid(), now()) RETURNING external_api_keys.id INTO v_id;
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data) VALUES (auth.uid(), 'api_key_created', 'external_api_key', v_id, jsonb_build_object('name', btrim(p_name), 'api_key_masked', left(v_key, 6) || '…' || right(v_key, 4), 'system_type', COALESCE(p_system_type, 'generic'), 'rate_limit_per_minute', p_rate_limit_per_minute));
  RETURN QUERY SELECT v_id, v_key, v_secret;
END; $function$
