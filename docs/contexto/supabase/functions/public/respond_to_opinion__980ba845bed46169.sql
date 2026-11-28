CREATE OR REPLACE FUNCTION public.respond_to_opinion(p_opinion_id uuid, p_content text, p_is_internal boolean DEFAULT false, p_status text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_uid UUID := auth.uid(); v_id UUID; v_content TEXT := btrim(COALESCE(p_content, ''));
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Nao autenticado'; END IF;
  IF NOT public.can_handle_opinion(p_opinion_id, v_uid) THEN RAISE EXCEPTION 'Sem permissao para tratar esta manifestacao'; END IF;
  IF length(v_content) < 5 THEN RAISE EXCEPTION 'Resposta muito curta'; END IF;
  IF length(v_content) > 4000 THEN v_content := left(v_content, 4000); END IF;
  INSERT INTO public.opinion_responses (opinion_id, responder_id, content, is_internal) VALUES (p_opinion_id, v_uid, v_content, COALESCE(p_is_internal, FALSE)) RETURNING id INTO v_id;
  UPDATE public.opinions o SET status = COALESCE(NULLIF(p_status, '')::opinion_status, 'in_progress'::opinion_status), read_at = COALESCE(o.read_at, now()), read_by = COALESCE(o.read_by, v_uid) WHERE o.id = p_opinion_id;
  RETURN v_id;
END; $function$
