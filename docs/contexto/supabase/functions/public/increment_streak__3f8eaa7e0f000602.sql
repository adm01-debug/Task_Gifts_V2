CREATE OR REPLACE FUNCTION public.increment_streak(p_user_id uuid)
 RETURNS TABLE(id uuid, streak integer, best_streak integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_streak integer;
  v_best integer;
  v_last timestamptz;
BEGIN
  SELECT pr.streak, pr.best_streak, pr.last_access_at INTO v_streak, v_best, v_last
    FROM public.profiles AS pr WHERE pr.id = p_user_id AND auth.uid() = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'perfil não encontrado';
  END IF;

  -- >48h de gap: reseta; <12h: mesma sessão (não incrementa)
  IF v_last IS NULL OR (now() - v_last) > interval '48 hours' THEN
    v_streak := 1;
  ELSIF (now() - v_last) >= interval '12 hours' THEN
    v_streak := v_streak + 1;
  END IF;

  v_best := GREATEST(v_best, v_streak);

  UPDATE public.profiles AS pr
     SET streak = v_streak,
         best_streak = v_best,
         last_access_at = now()
   WHERE pr.id = p_user_id AND auth.uid() = p_user_id;

  RETURN QUERY SELECT p_user_id, v_streak, v_best;
END;
$function$
