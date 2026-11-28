CREATE OR REPLACE FUNCTION public.grant_scratch_card(p_source text, p_source_ref text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user UUID := auth.uid(); v_key TEXT; v_id UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_source NOT IN ('task','training','quest','campaign','manual') THEN RAISE EXCEPTION 'origem inválida'; END IF;
  v_key := 'grant:' || p_source || ':' || COALESCE(NULLIF(btrim(p_source_ref), ''), 'none');
  IF length(v_key) > 160 THEN RAISE EXCEPTION 'referência de origem muito longa'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('scratch_card:' || v_user::text));
  SELECT id INTO v_id FROM public.scratch_cards WHERE user_id = v_user AND dedupe_key = v_key;
  IF FOUND THEN RETURN jsonb_build_object('success', true, 'replayed', true, 'card_id', v_id); END IF;
  INSERT INTO public.scratch_cards (user_id, source, source_ref, dedupe_key) VALUES (v_user, p_source, NULLIF(btrim(p_source_ref), ''), v_key) RETURNING id INTO v_id;
  RETURN jsonb_build_object('success', true, 'replayed', false, 'card_id', v_id);
END;
$function$
