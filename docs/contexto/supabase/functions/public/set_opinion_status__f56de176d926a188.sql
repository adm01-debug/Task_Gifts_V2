CREATE OR REPLACE FUNCTION public.set_opinion_status(p_opinion_id uuid, p_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.can_handle_opinion(p_opinion_id, v_uid) THEN RAISE EXCEPTION 'Sem permissao para tratar esta manifestacao'; END IF;
  UPDATE public.opinions o SET status = p_status::opinion_status, read_at = COALESCE(o.read_at, now()), read_by = COALESCE(o.read_by, v_uid) WHERE o.id = p_opinion_id;
END; $function$
