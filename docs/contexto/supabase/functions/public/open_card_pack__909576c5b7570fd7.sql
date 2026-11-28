CREATE OR REPLACE FUNCTION public.open_card_pack(p_pack_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_pack public.card_packs%ROWTYPE;
  v_total NUMERIC; v_roll NUMERIC; v_cursor NUMERIC;
  v_card RECORD; v_picked UUID; v_picked_rarity TEXT;
  v_i INTEGER; v_result JSONB := '[]'::jsonb;
  v_has_premium BOOLEAN := false;
  v_ids UUID[] := '{}'; v_rarities TEXT[] := '{}'; v_new BOOLEAN;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('card_pack_open:' || p_pack_id::text));
  SELECT * INTO v_pack FROM public.card_packs WHERE id = p_pack_id AND user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'reason', 'not_found'); END IF;
  IF v_pack.status = 'opened' THEN
    RETURN jsonb_build_object('success', true, 'replayed', true, 'cards', COALESCE(v_pack.result, '[]'::jsonb));
  END IF;
  SELECT SUM(CASE rarity WHEN 'common' THEN 1000 WHEN 'rare' THEN 250 WHEN 'epic' THEN 60 ELSE 8 END)
    INTO v_total FROM public.card_definitions WHERE is_active;
  IF v_total IS NULL OR v_total <= 0 THEN RETURN jsonb_build_object('success', false, 'reason', 'no_cards'); END IF;
  FOR v_i IN 1..v_pack.size LOOP
    v_roll := random() * v_total; v_cursor := 0; v_picked := NULL;
    FOR v_card IN SELECT id, rarity,
        CASE rarity WHEN 'common' THEN 1000 WHEN 'rare' THEN 250 WHEN 'epic' THEN 60 ELSE 8 END AS w
        FROM public.card_definitions WHERE is_active ORDER BY rarity, code
    LOOP v_cursor := v_cursor + v_card.w;
      IF v_cursor >= v_roll THEN v_picked := v_card.id; v_picked_rarity := v_card.rarity; EXIT; END IF;
    END LOOP;
    IF v_picked IS NOT NULL THEN
      v_ids := array_append(v_ids, v_picked); v_rarities := array_append(v_rarities, v_picked_rarity);
      IF v_picked_rarity <> 'common' THEN v_has_premium := true; END IF;
    END IF;
  END LOOP;
  IF NOT v_has_premium AND array_length(v_ids, 1) IS NOT NULL THEN
    SELECT id, rarity INTO v_picked, v_picked_rarity FROM public.card_definitions
     WHERE is_active AND rarity <> 'common' ORDER BY random() LIMIT 1;
    IF v_picked IS NOT NULL THEN
      v_ids[array_length(v_ids, 1)] := v_picked; v_rarities[array_length(v_rarities, 1)] := v_picked_rarity;
    END IF;
  END IF;
  FOR v_i IN 1..COALESCE(array_length(v_ids, 1), 0) LOOP
    v_new := NOT EXISTS (SELECT 1 FROM public.user_cards WHERE user_id = v_user AND card_id = v_ids[v_i] AND quantity > 0);
    INSERT INTO public.user_cards (user_id, card_id, quantity) VALUES (v_user, v_ids[v_i], 1)
    ON CONFLICT (user_id, card_id) DO UPDATE SET quantity = public.user_cards.quantity + 1, updated_at = now();
    v_result := v_result || jsonb_build_object('card_id', v_ids[v_i], 'rarity', v_rarities[v_i], 'is_new', v_new);
  END LOOP;
  UPDATE public.card_packs SET status='opened', opened_at=now(), result=v_result, updated_at=now() WHERE id = v_pack.id;
  RETURN jsonb_build_object('success', true, 'replayed', false, 'cards', v_result);
END; $function$
