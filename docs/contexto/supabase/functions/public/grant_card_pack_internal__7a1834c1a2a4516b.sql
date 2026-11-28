CREATE OR REPLACE FUNCTION public._grant_card_pack_internal(p_user_id uuid, p_source text, p_source_ref text, p_size integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_key TEXT; v_id UUID; v_size INTEGER := GREATEST(1, LEAST(COALESCE(p_size, 5), 20)); v_ref TEXT := NULLIF(btrim(COALESCE(p_source_ref, '')), '');
BEGIN
  IF p_user_id IS NULL THEN RETURN NULL; END IF;
  IF p_source NOT IN ('task','training','quest','campaign','manual','streak') THEN RETURN NULL; END IF;
  v_key := 'pack:' || p_source || ':' || COALESCE(v_ref, 'none');
  IF length(v_key) > 160 THEN RETURN NULL; END IF;
  INSERT INTO public.card_packs (user_id, source, source_ref, dedupe_key, size)
  VALUES (p_user_id, p_source, v_ref, v_key, v_size) ON CONFLICT (user_id, dedupe_key) DO NOTHING RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$
