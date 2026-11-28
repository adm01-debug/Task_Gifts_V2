CREATE OR REPLACE FUNCTION public.tournament_seed_order(p_size integer)
 RETURNS integer[]
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_order INTEGER[] := ARRAY[1,2]; v_next INTEGER; v_new INTEGER[]; v_seed INTEGER;
BEGIN
  IF p_size < 2 THEN RETURN ARRAY[]::INTEGER[]; END IF;
  WHILE array_length(v_order,1) < p_size LOOP v_next := array_length(v_order,1) * 2; v_new := ARRAY[]::INTEGER[]; FOREACH v_seed IN ARRAY v_order LOOP v_new := v_new || v_seed || (v_next + 1 - v_seed); END LOOP; v_order := v_new; END LOOP;
  RETURN v_order;
END;
$function$
