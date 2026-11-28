CREATE OR REPLACE FUNCTION public.increment_user_xp_coins(user_id uuid, xp_amount integer DEFAULT 0, coin_amount integer DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE profiles
  SET
    xp    = xp + xp_amount,
    coins = coins + coin_amount,
    updated_at = now()
  WHERE id = user_id;
END;
$function$
