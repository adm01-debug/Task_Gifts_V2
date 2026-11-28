CREATE OR REPLACE FUNCTION public.rotate_external_api_secret(p_id uuid)
 RETURNS TABLE(id uuid, api_key text, api_secret text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE v_secret text; v_salt text; v_key text; v_name text;
BEGIN
  PERFORM public._require_admin();
  SELECT eak.api_key, eak.name INTO v_key, v_name FROM public.external_api_keys eak WHERE eak.id = p_id;
  IF v_key IS NULL THEN RAISE EXCEPTION 'Chave de API não encontrada'; END IF;
  v_secret := encode(extensions.gen_random_bytes(32), 'hex'); v_salt := encode(extensions.gen_random_bytes(16), 'hex');
  UPDATE public.external_api_keys SET secret_salt = v_salt, secret_hash = [REDACTED] || v_secret, 'sha256'), 'hex'), secret_last_rotated_at = now() WHERE external_api_keys.id = p_id;
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data) VALUES (auth.uid(), 'api_key_rotated', 'external_api_key', p_id, jsonb_build_object('name', v_name, 'api_key_masked', left(v_key, 6) || '…' || right(v_key, 4)));
  RETURN QUERY SELECT p_id, v_key, v_secret;
END; $function$
