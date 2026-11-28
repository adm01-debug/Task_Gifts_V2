CREATE OR REPLACE FUNCTION public.chi_square_critical(p_df integer, p_alpha double precision)
 RETURNS double precision
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_z double precision;
  v_t double precision;
  v_base double precision;
BEGIN
  IF p_df IS NULL OR p_df < 1 OR p_alpha IS NULL OR p_alpha <= 0 OR p_alpha >= 1 THEN
    RETURN 'Infinity'::double precision;
  END IF;
  v_z := sqrt(2) * public.erf_inverse(1 - 2 * p_alpha);
  v_t := 2.0 / (9.0 * p_df);
  v_base := greatest(1 - v_t + v_z * sqrt(v_t), 0);
  RETURN p_df * power(v_base, 3);
END;
$function$
