CREATE OR REPLACE FUNCTION public._card_rarity_value(p_rarity text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE p_rarity WHEN 'common' THEN 1 WHEN 'rare' THEN 4 WHEN 'epic' THEN 12 WHEN 'legendary' THEN 40 ELSE 0 END;
$function$
