CREATE OR REPLACE FUNCTION public.snapshot_lucky_wheel_payout(p_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_date date := COALESCE(p_date, ((now() AT TIME ZONE 'America/Sao_Paulo')::date - 1));
  v_spins integer := 0;
  v_users integer := 0;
  v_coins integer := 0;
  v_xp integer := 0;
  v_total_weight numeric := 0;
  v_projected_coins numeric := 0;
  v_projected_xp numeric := 0;
  v_chi numeric := 0;
  v_df integer := 0;
  v_duplicates integer := 0;
  v_unconfigured integer := 0;
  v_deviation numeric := 0;
  v_warn double precision;
  v_crit double precision;
  v_alerts integer := 0;
BEGIN
  SELECT count(*), count(DISTINCT user_id),
         COALESCE(sum(amount) FILTER (WHERE prize_type = 'coins'), 0),
         COALESCE(sum(amount) FILTER (WHERE prize_type = 'xp'), 0),
         count(*) FILTER (WHERE prize_id IS NULL)
    INTO v_spins, v_users, v_coins, v_xp, v_unconfigured
    FROM public.lucky_wheel_spins
   WHERE spin_date = v_date;

  -- Giros além do limite de um por usuário por dia.
  SELECT COALESCE(sum(c - 1), 0) INTO v_duplicates
    FROM (
      SELECT count(*) AS c
        FROM public.lucky_wheel_spins
       WHERE spin_date = v_date
       GROUP BY user_id
      HAVING count(*) > 1
    ) d;

  SELECT COALESCE(sum(weight), 0) INTO v_total_weight
    FROM public.lucky_wheel_prizes WHERE is_active;

  IF v_total_weight > 0 AND v_spins > 0 THEN
    SELECT COALESCE(sum(CASE WHEN prize_type = 'coins' THEN amount::numeric * weight / v_total_weight ELSE 0 END), 0) * v_spins,
           COALESCE(sum(CASE WHEN prize_type = 'xp' THEN amount::numeric * weight / v_total_weight ELSE 0 END), 0) * v_spins
      INTO v_projected_coins, v_projected_xp
      FROM public.lucky_wheel_prizes WHERE is_active;

    SELECT COALESCE(sum(power(obs - exp_n, 2) / NULLIF(exp_n, 0)), 0), count(*)
      INTO v_chi, v_df
      FROM (
        SELECT p.id,
               (p.weight::numeric / v_total_weight) * v_spins AS exp_n,
               (SELECT count(*) FROM public.lucky_wheel_spins s
                 WHERE s.spin_date = v_date AND s.prize_id = p.id)::numeric AS obs
          FROM public.lucky_wheel_prizes p
         WHERE p.is_active AND p.weight > 0
      ) t;
    v_df := greatest(v_df - 1, 0);
  END IF;

  INSERT INTO public.lucky_wheel_payout_snapshots (
    snapshot_date, spins, unique_users, coins_paid, xp_paid,
    projected_coins, projected_xp, chi_square, degrees_of_freedom,
    duplicate_spins, unconfigured_spins
  ) VALUES (
    v_date, v_spins, v_users, v_coins, v_xp,
    v_projected_coins, v_projected_xp, v_chi, v_df,
    v_duplicates, v_unconfigured
  )
  ON CONFLICT (snapshot_date) DO UPDATE SET
    spins = EXCLUDED.spins, unique_users = EXCLUDED.unique_users,
    coins_paid = EXCLUDED.coins_paid, xp_paid = EXCLUDED.xp_paid,
    projected_coins = EXCLUDED.projected_coins, projected_xp = EXCLUDED.projected_xp,
    chi_square = EXCLUDED.chi_square, degrees_of_freedom = EXCLUDED.degrees_of_freedom,
    duplicate_spins = EXCLUDED.duplicate_spins, unconfigured_spins = EXCLUDED.unconfigured_spins,
    updated_at = now();

  -- Alerta 1: distribuição fora da calibração.
  IF v_spins >= 50 AND v_df >= 1 THEN
    v_warn := public.chi_square_critical(v_df, 0.01);
    v_crit := public.chi_square_critical(v_df, 0.0001);
    IF v_chi::double precision > v_warn THEN
      INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
      VALUES (
        'lucky_wheel_chi_square',
        CASE WHEN v_chi::double precision > v_crit THEN 'critical' ELSE 'high' END,
        'Roleta: distribuição de prêmios fora do esperado',
        format('χ² = %s com %s grau(s) de liberdade em %s giro(s), acima do limite de %s.',
               round(v_chi, 2), v_df, v_spins, round(v_warn::numeric, 2)),
        jsonb_build_object('ref_date', v_date::text, 'chi_square', round(v_chi, 4),
                           'degrees_of_freedom', v_df, 'warn_limit', round(v_warn::numeric, 4),
                           'critical_limit', round(v_crit::numeric, 4), 'spins', v_spins)
      )
      ON CONFLICT DO NOTHING;
      v_alerts := v_alerts + 1;
    END IF;
  END IF;

  -- Alerta 2: custo divergente da projeção.
  IF v_projected_coins > 0 AND v_spins >= 50 THEN
    v_deviation := abs(v_coins - v_projected_coins) / v_projected_coins;
    IF v_deviation > 0.25 THEN
      INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
      VALUES (
        'lucky_wheel_cost_deviation',
        CASE WHEN v_deviation > 0.5 THEN 'high' ELSE 'medium' END,
        'Roleta: custo em moedas divergente da projeção',
        format('Pagou %s moeda(s) contra %s projetada(s) (desvio de %s%%).',
               v_coins, round(v_projected_coins), round(v_deviation * 100, 1)),
        jsonb_build_object('ref_date', v_date::text, 'coins_paid', v_coins,
                           'projected_coins', round(v_projected_coins, 2),
                           'deviation', round(v_deviation, 4), 'spins', v_spins)
      )
      ON CONFLICT DO NOTHING;
      v_alerts := v_alerts + 1;
    END IF;
  END IF;

  -- Alerta 3: giros duplicados.
  IF v_duplicates > 0 THEN
    INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
    VALUES (
      'lucky_wheel_duplicate_spins', 'critical',
      'Roleta: giros duplicados detectados',
      format('%s giro(s) além do limite de um por usuário por dia.', v_duplicates),
      jsonb_build_object('ref_date', v_date::text, 'duplicate_spins', v_duplicates, 'spins', v_spins)
    )
    ON CONFLICT DO NOTHING;
    v_alerts := v_alerts + 1;
  END IF;

  -- Alerta 4: prêmios fora da calibração vigente.
  IF v_unconfigured > 0 THEN
    INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
    VALUES (
      'lucky_wheel_unconfigured_prizes', 'medium',
      'Roleta: prêmios pagos fora da calibração vigente',
      format('%s giro(s) referenciam prêmios ausentes da configuração atual.', v_unconfigured),
      jsonb_build_object('ref_date', v_date::text, 'unconfigured_spins', v_unconfigured, 'spins', v_spins)
    )
    ON CONFLICT DO NOTHING;
    v_alerts := v_alerts + 1;
  END IF;

  RETURN jsonb_build_object(
    'date', v_date, 'spins', v_spins, 'chi_square', round(v_chi, 4),
    'degrees_of_freedom', v_df, 'alerts_raised', v_alerts
  );
END;
$function$
