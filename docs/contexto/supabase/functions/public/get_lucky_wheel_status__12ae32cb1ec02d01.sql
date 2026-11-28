CREATE OR REPLACE FUNCTION public.get_lucky_wheel_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_last RECORD;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_last FROM public.lucky_wheel_spins
   WHERE user_id = v_user ORDER BY created_at DESC LIMIT 1;

  RETURN jsonb_build_object(
    'can_spin', NOT EXISTS (
      SELECT 1 FROM public.lucky_wheel_spins
       WHERE user_id = v_user AND spin_date = v_today
    ),
    'today', v_today,
    'last_spin', CASE WHEN v_last IS NULL THEN NULL ELSE jsonb_build_object(
      'prize_label', v_last.prize_label,
      'prize_type', v_last.prize_type,
      'amount', v_last.amount,
      'spin_date', v_last.spin_date,
      'created_at', v_last.created_at
    ) END,
    'total_spins', (SELECT count(*) FROM public.lucky_wheel_spins WHERE user_id = v_user)
  );
END;
$function$
