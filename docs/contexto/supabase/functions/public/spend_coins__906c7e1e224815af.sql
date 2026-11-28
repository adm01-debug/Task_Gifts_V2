CREATE OR REPLACE FUNCTION public.spend_coins(p_user_id uuid, p_amount integer)
 RETURNS TABLE(id uuid, coins integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_coins integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount deve ser positivo';
  END IF;

  UPDATE public.profiles AS pr
     SET coins = pr.coins - p_amount
   WHERE pr.id = p_user_id AND pr.coins >= p_amount AND auth.uid() = p_user_id
   RETURNING pr.coins INTO v_coins;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'coins insuficientes';
  END IF;

  RETURN QUERY SELECT p_user_id, v_coins;
END;
$function$
