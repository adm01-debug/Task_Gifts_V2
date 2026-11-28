CREATE OR REPLACE FUNCTION public.grant_card_pack(p_source text, p_source_ref text DEFAULT NULL::text, p_size integer DEFAULT 5, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_actor UUID := auth.uid(); v_target UUID; v_key TEXT; v_id UUID; v_size INTEGER := GREATEST(1, LEAST(COALESCE(p_size, 5), 20));
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  v_target := COALESCE(p_user_id, v_actor);
  IF v_target <> v_actor AND NOT public.has_role(v_actor, 'admin') THEN RAISE EXCEPTION 'Permissão negada'; END IF;
  IF p_source NOT IN ('task','training','quest','campaign','manual','streak') THEN RAISE EXCEPTION 'origem inválida'; END IF;
  v_key := 'pack:' || p_source || ':' || COALESCE(NULLIF(btrim(p_source_ref), ''), 'none');
  IF length(v_key) > 160 THEN RAISE EXCEPTION 'referência de origem muito longa'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('card_pack:' || v_target::text));
  SELECT id INTO v_id FROM public.card_packs WHERE user_id = v_target AND dedupe_key = v_key;
  IF FOUND THEN RETURN jsonb_build_object('success', true, 'replayed', true, 'pack_id', v_id); END IF;
  INSERT INTO public.card_packs (user_id, source, source_ref, dedupe_key, size) VALUES (v_target, p_source, NULLIF(btrim(p_source_ref), ''), v_key, v_size) RETURNING id INTO v_id;
  RETURN jsonb_build_object('success', true, 'replayed', false, 'pack_id', v_id);
END;
$function$
