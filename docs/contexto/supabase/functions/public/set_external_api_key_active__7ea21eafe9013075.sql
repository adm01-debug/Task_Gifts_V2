CREATE OR REPLACE FUNCTION public.set_external_api_key_active(p_id uuid, p_active boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_name text; v_key text; v_old boolean;
BEGIN
  PERFORM public._require_admin();
  IF p_id IS NULL OR p_active IS NULL THEN RAISE EXCEPTION 'Parâmetros inválidos'; END IF;
  SELECT eak.name, eak.api_key, eak.is_active INTO v_name, v_key, v_old FROM public.external_api_keys eak WHERE eak.id = p_id;
  IF v_key IS NULL THEN RAISE EXCEPTION 'Chave de API não encontrada'; END IF;
  UPDATE public.external_api_keys SET is_active = p_active WHERE external_api_keys.id = p_id;
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data) VALUES (auth.uid(), 'api_key_status_changed', 'external_api_key', p_id, jsonb_build_object('is_active', v_old), jsonb_build_object('is_active', p_active, 'name', v_name, 'api_key_masked', left(v_key, 6) || '…' || right(v_key, 4)));
  RETURN p_active;
END; $function$
