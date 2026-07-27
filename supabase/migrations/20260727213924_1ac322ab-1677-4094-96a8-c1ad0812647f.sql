CREATE OR REPLACE FUNCTION public.raise_lucky_wheel_window_alerts(
  p_window_days integer DEFAULT 7,
  p_coins_per_spin_budget numeric DEFAULT 30,
  p_min_cost_increase numeric DEFAULT 0.15,
  p_max_volume_drop numeric DEFAULT 0.30,
  p_min_spins integer DEFAULT 30,
  p_min_days integer DEFAULT 3,
  p_end_date date DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_end date := COALESCE(p_end_date, (now() AT TIME ZONE 'utc')::date);
  v_days integer := GREATEST(COALESCE(p_window_days, 7), 1);
  v_cur_start date;
  v_prev_start date;
  v_prev_end date;
  v_window_key text;
  cur record;
  prev record;
  v_cost_ratio numeric;
  v_volume_ratio numeric;
  v_overrun numeric;
  v_created integer := 0;
BEGIN
  v_cur_start := v_end - (v_days - 1);
  v_prev_end := v_cur_start - 1;
  v_prev_start := v_prev_end - (v_days - 1);
  v_window_key := v_cur_start::text || '_' || v_end::text;

  SELECT COUNT(*)::int AS days_with_data,
         COALESCE(SUM(spins), 0)::int AS spins,
         CASE WHEN COALESCE(SUM(spins), 0) > 0
              THEN SUM(coins_paid)::numeric / SUM(spins) ELSE 0 END AS coins_per_spin,
         CASE WHEN COUNT(*) > 0
              THEN SUM(spins)::numeric / COUNT(*) ELSE 0 END AS spins_per_day
    INTO cur
    FROM public.lucky_wheel_payout_snapshots
   WHERE snapshot_date BETWEEN v_cur_start AND v_end;

  SELECT COUNT(*)::int AS days_with_data,
         COALESCE(SUM(spins), 0)::int AS spins,
         CASE WHEN COALESCE(SUM(spins), 0) > 0
              THEN SUM(coins_paid)::numeric / SUM(spins) ELSE 0 END AS coins_per_spin,
         CASE WHEN COUNT(*) > 0
              THEN SUM(spins)::numeric / COUNT(*) ELSE 0 END AS spins_per_day
    INTO prev
    FROM public.lucky_wheel_payout_snapshots
   WHERE snapshot_date BETWEEN v_prev_start AND v_prev_end;

  -- Estouro de orçamento independe da janela anterior.
  IF p_coins_per_spin_budget > 0
     AND cur.spins >= p_min_spins
     AND cur.coins_per_spin > p_coins_per_spin_budget THEN
    v_overrun := (cur.coins_per_spin - p_coins_per_spin_budget) / p_coins_per_spin_budget;
    INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
    VALUES (
      'lucky_wheel_window_budget_overrun',
      CASE WHEN v_overrun > 0.5 THEN 'critical' ELSE 'high' END,
      'Roleta: orçamento de moedas por giro estourado',
      format('A janela %s pagou %s moeda(s) por giro contra o teto de %s (%s%% acima).',
             v_window_key, round(cur.coins_per_spin, 2), round(p_coins_per_spin_budget, 2),
             round(v_overrun * 100, 1)),
      jsonb_build_object(
        'ref_date', 'window_budget:' || v_window_key,
        'window', v_window_key,
        'coins_per_spin', round(cur.coins_per_spin, 4),
        'budget', round(p_coins_per_spin_budget, 4),
        'overrun', round(v_overrun, 4),
        'spins', cur.spins)
    )
    ON CONFLICT DO NOTHING;
    v_created := v_created + 1;
  END IF;

  -- Comparações exigem amostra suficiente nas duas janelas.
  IF cur.spins >= p_min_spins AND prev.spins >= p_min_spins
     AND cur.days_with_data >= p_min_days AND prev.days_with_data >= p_min_days THEN

    IF prev.coins_per_spin > 0 THEN
      v_cost_ratio := (cur.coins_per_spin - prev.coins_per_spin) / prev.coins_per_spin;
      IF v_cost_ratio >= p_min_cost_increase THEN
        INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
        VALUES (
          'lucky_wheel_window_cost_regression',
          CASE WHEN v_cost_ratio >= p_min_cost_increase * 3 THEN 'high' ELSE 'medium' END,
          'Roleta: custo por giro subiu de forma relevante',
          format('Custo por giro passou de %s para %s moeda(s) (%s%%) na janela %s.',
                 round(prev.coins_per_spin, 2), round(cur.coins_per_spin, 2),
                 round(v_cost_ratio * 100, 1), v_window_key),
          jsonb_build_object(
            'ref_date', 'window_cost:' || v_window_key,
            'window', v_window_key,
            'current', round(cur.coins_per_spin, 4),
            'previous', round(prev.coins_per_spin, 4),
            'delta_ratio', round(v_cost_ratio, 4),
            'spins', cur.spins)
        )
        ON CONFLICT DO NOTHING;
        v_created := v_created + 1;
      END IF;
    END IF;

    IF prev.spins_per_day > 0 THEN
      v_volume_ratio := (prev.spins_per_day - cur.spins_per_day) / prev.spins_per_day;
      IF v_volume_ratio >= p_max_volume_drop THEN
        INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
        VALUES (
          'lucky_wheel_window_volume_drop',
          CASE WHEN v_volume_ratio >= p_max_volume_drop * 2 THEN 'high' ELSE 'medium' END,
          'Roleta: queda relevante de participação',
          format('Giros por dia caíram de %s para %s (-%s%%) na janela %s.',
                 round(prev.spins_per_day, 2), round(cur.spins_per_day, 2),
                 round(v_volume_ratio * 100, 1), v_window_key),
          jsonb_build_object(
            'ref_date', 'window_volume:' || v_window_key,
            'window', v_window_key,
            'current', round(cur.spins_per_day, 4),
            'previous', round(prev.spins_per_day, 4),
            'drop', round(v_volume_ratio, 4),
            'spins', cur.spins)
        )
        ON CONFLICT DO NOTHING;
        v_created := v_created + 1;
      END IF;
    END IF;
  END IF;

  RETURN v_created;
END;
$$;

REVOKE ALL ON FUNCTION public.raise_lucky_wheel_window_alerts(integer, numeric, numeric, numeric, integer, integer, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.raise_lucky_wheel_window_alerts(integer, numeric, numeric, numeric, integer, integer, date) TO service_role;

SELECT cron.unschedule('lucky-wheel-window-alerts')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lucky-wheel-window-alerts');

SELECT cron.schedule(
  'lucky-wheel-window-alerts',
  '5 6 * * *',
  $$SELECT public.raise_lucky_wheel_window_alerts();$$
);