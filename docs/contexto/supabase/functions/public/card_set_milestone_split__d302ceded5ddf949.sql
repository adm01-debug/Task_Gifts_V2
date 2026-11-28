CREATE OR REPLACE FUNCTION public._card_set_milestone_split(p_total integer)
 RETURNS TABLE(milestone smallint, amount integer)
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total INTEGER := GREATEST(COALESCE(p_total, 0), 0);
  v_shares NUMERIC[] := ARRAY[0.10, 0.20, 0.30, 0.40];
  v_marks SMALLINT[] := ARRAY[25, 50, 75, 100]::SMALLINT[];
  v_floor INTEGER[] := ARRAY[0,0,0,0]; v_rest NUMERIC[] := ARRAY[0,0,0,0];
  v_sum INTEGER := 0; v_left INTEGER; i INTEGER; v_best INTEGER; j INTEGER;
BEGIN
  FOR i IN 1..4 LOOP v_floor[i] := FLOOR(v_total * v_shares[i]); v_rest[i] := (v_total * v_shares[i]) - v_floor[i]; v_sum := v_sum + v_floor[i]; END LOOP;
  v_left := v_total - v_sum;
  WHILE v_left > 0 LOOP
    v_best := 1;
    FOR j IN 2..4 LOOP IF v_rest[j] >= v_rest[v_best] THEN v_best := j; END IF; END LOOP;
    v_floor[v_best] := v_floor[v_best] + 1; v_rest[v_best] := -1; v_left := v_left - 1;
  END LOOP;
  FOR i IN 1..4 LOOP milestone := v_marks[i]; amount := v_floor[i]; RETURN NEXT; END LOOP;
END;
$function$
