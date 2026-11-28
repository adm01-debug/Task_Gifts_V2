CREATE OR REPLACE FUNCTION public.toggle_opinion_support(p_opinion_id uuid)
 RETURNS TABLE(supported boolean, support_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_uid UUID := auth.uid(); v_exists BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Nao autenticado'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.opinions o WHERE o.id = p_opinion_id) THEN RAISE EXCEPTION 'Manifestacao inexistente'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.opinion_supports x WHERE x.opinion_id = p_opinion_id AND x.user_id = v_uid) INTO v_exists;
  IF v_exists THEN DELETE FROM public.opinion_supports x WHERE x.opinion_id = p_opinion_id AND x.user_id = v_uid;
  ELSE INSERT INTO public.opinion_supports (opinion_id, user_id) VALUES (p_opinion_id, v_uid) ON CONFLICT (opinion_id, user_id) DO NOTHING; END IF;
  RETURN QUERY SELECT NOT v_exists, (SELECT COUNT(*)::INT FROM public.opinion_supports x WHERE x.opinion_id = p_opinion_id);
END; $function$
