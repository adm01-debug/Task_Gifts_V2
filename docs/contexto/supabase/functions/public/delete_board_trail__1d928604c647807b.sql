CREATE OR REPLACE FUNCTION public.delete_board_trail(p_trail_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role)) THEN RAISE EXCEPTION 'Permissao negada' USING ERRCODE = '42501'; END IF;
  DELETE FROM public.board_trails WHERE id = p_trail_id; RETURN FOUND;
END; $function$
