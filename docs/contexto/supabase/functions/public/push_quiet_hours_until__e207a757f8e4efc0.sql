CREATE OR REPLACE FUNCTION public.push_quiet_hours_until(_user_id uuid)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_enabled boolean;
  v_start time;
  v_end time;
  v_weekends boolean;
  v_local timestamp;
  v_dow integer;
BEGIN
  SELECT COALESCE(p.do_not_disturb_enabled, false),
         COALESCE(p.do_not_disturb_start, p.quiet_hours_start),
         COALESCE(p.do_not_disturb_end, p.quiet_hours_end),
         COALESCE(p.do_not_disturb_weekends, true)
    INTO v_enabled, v_start, v_end, v_weekends
  FROM public.notification_preferences p
  WHERE p.user_id = _user_id;

  IF NOT FOUND
     OR NOT COALESCE(v_enabled, false)
     OR v_start IS NULL
     OR v_end IS NULL
     OR v_start = v_end THEN
    RETURN NULL;
  END IF;

  v_local := now() AT TIME ZONE 'America/Sao_Paulo';

  -- O fim de semana e' conferido no dia em que a janela COMECOU: a madrugada de
  -- sabado ainda e' a noite de sexta (silencio vale) e a de segunda e' a noite
  -- de domingo (nao vale). Conferir o dia do envio erra os dois lados.
  IF v_start < v_end THEN
    -- Janela dentro do mesmo dia.
    v_dow := EXTRACT(ISODOW FROM v_local)::integer;
    IF NOT v_weekends AND v_dow >= 6 THEN
      RETURN NULL;
    END IF;
    IF v_local::time < v_start OR v_local::time >= v_end THEN
      RETURN NULL;
    END IF;
    RETURN (v_local::date + v_end) AT TIME ZONE 'America/Sao_Paulo';
  END IF;

  -- Janela cruzando a meia-noite (ex.: 22:00 -> 08:00).
  IF v_local::time >= v_start THEN
    v_dow := EXTRACT(ISODOW FROM v_local)::integer;
    IF NOT v_weekends AND v_dow >= 6 THEN
      RETURN NULL;
    END IF;
    RETURN ((v_local::date + 1) + v_end) AT TIME ZONE 'America/Sao_Paulo';
  END IF;

  IF v_local::time < v_end THEN
    v_dow := EXTRACT(ISODOW FROM (v_local - interval '1 day'))::integer;
    IF NOT v_weekends AND v_dow >= 6 THEN
      RETURN NULL;
    END IF;
    RETURN (v_local::date + v_end) AT TIME ZONE 'America/Sao_Paulo';
  END IF;

  RETURN NULL;
END;
$function$
