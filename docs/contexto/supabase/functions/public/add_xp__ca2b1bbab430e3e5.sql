CREATE OR REPLACE FUNCTION public.add_xp(p_user_id uuid, p_amount integer, p_source text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, xp integer, level integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_xp integer;
  v_level integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount deve ser positivo';
  END IF;

  UPDATE public.profiles AS pr
     SET xp = pr.xp + p_amount,
         level = GREATEST(pr.level, floor((pr.xp + p_amount) / 1000) + 1)
   WHERE pr.id = p_user_id
     AND (auth.uid() = p_user_id
          OR EXISTS (SELECT 1 FROM public.kudos k
                      WHERE k.to_user_id = p_user_id AND k.from_user_id = auth.uid()))
   RETURNING pr.xp, pr.level INTO v_xp, v_level;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'perfil não encontrado';
  END IF;

  RETURN QUERY SELECT p_user_id, v_xp, v_level;
END;
$function$
