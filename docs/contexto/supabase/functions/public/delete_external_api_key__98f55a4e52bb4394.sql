CREATE OR REPLACE FUNCTION public.delete_external_api_key(p_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_name text; v_key text;
BEGIN
  PERFORM public._require_admin();
  SELECT eak.name, eak.api_key INTO v_name, v_key FROM public.external_api_keys eak WHERE eak.id = p_id;
  IF v_key IS NULL THEN RAISE EXCEPTION 'Chave de API não encontrada'; END IF;
  DELETE FROM public.external_api_keys WHERE external_api_keys.id = p_id;
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data) VALUES (auth.uid(), 'api_key_deleted', 'external_api_key', p_id, jsonb_build_object('name', v_name, 'api_key_masked', left(v_key, 6) || '…' || right(v_key, 4)));
  RETURN true;
END; $function$
