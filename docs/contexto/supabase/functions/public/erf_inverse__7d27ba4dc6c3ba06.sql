CREATE OR REPLACE FUNCTION public.erf_inverse(x double precision)
 RETURNS double precision
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  w double precision;
  p double precision;
BEGIN
  IF x IS NULL OR x <= -1 OR x >= 1 THEN
    RETURN CASE WHEN x IS NULL THEN NULL WHEN x <= -1 THEN '-Infinity'::double precision ELSE 'Infinity'::double precision END;
  END IF;
  w := -ln((1.0 - x) * (1.0 + x));
  IF w < 5.0 THEN
    w := w - 2.5;
    p := 2.81022636e-08;
    p := 3.43273939e-07 + p * w;
    p := -3.5233877e-06 + p * w;
    p := -4.39150654e-06 + p * w;
    p := 0.00021858087 + p * w;
    p := -0.00125372503 + p * w;
    p := -0.00417768164 + p * w;
    p := 0.246640727 + p * w;
    p := 1.50140941 + p * w;
  ELSE
    w := sqrt(w) - 3.0;
    p := -0.000200214257;
    p := 0.000100950558 + p * w;
    p := 0.00134934322 + p * w;
    p := -0.00367342844 + p * w;
    p := 0.00573950773 + p * w;
    p := -0.0076224613 + p * w;
    p := 0.00943887047 + p * w;
    p := 1.00167406 + p * w;
    p := 2.83297682 + p * w;
  END IF;
  RETURN p * x;
END;
$function$
