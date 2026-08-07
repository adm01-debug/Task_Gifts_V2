-- 1. Snapshot diário -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lucky_wheel_payout_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date date NOT NULL UNIQUE,
  spins integer NOT NULL DEFAULT 0,
  unique_users integer NOT NULL DEFAULT 0,
  coins_paid integer NOT NULL DEFAULT 0,
  xp_paid integer NOT NULL DEFAULT 0,
  projected_coins numeric NOT NULL DEFAULT 0,
  projected_xp numeric NOT NULL DEFAULT 0,
  chi_square numeric NOT NULL DEFAULT 0,
  degrees_of_freedom integer NOT NULL DEFAULT 0,
  duplicate_spins integer NOT NULL DEFAULT 0,
  unconfigured_spins integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.lucky_wheel_payout_snapshots TO authenticated;
GRANT ALL ON public.lucky_wheel_payout_snapshots TO service_role;

ALTER TABLE public.lucky_wheel_payout_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins leem snapshots de payout" ON public.lucky_wheel_payout_snapshots;
CREATE POLICY "Admins leem snapshots de payout"
  ON public.lucky_wheel_payout_snapshots
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_lucky_wheel_payout_snapshots_updated_at ON public.lucky_wheel_payout_snapshots;
CREATE TRIGGER trg_lucky_wheel_payout_snapshots_updated_at
  BEFORE UPDATE ON public.lucky_wheel_payout_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Aceitar alertas da roleta + deduplicação por dia -----------------------
ALTER TABLE public.security_alerts DROP CONSTRAINT IF EXISTS security_alerts_alert_type_check;
ALTER TABLE public.security_alerts ADD CONSTRAINT security_alerts_alert_type_check CHECK (
  alert_type = ANY (ARRAY[
    'rate_limit_exceeded','brute_force','suspicious_login','ip_blocked',
    'multiple_failed_2fa','unusual_location'
  ])
  OR alert_type LIKE 'burn_rate_%'
  OR alert_type LIKE 'error_budget_%'
  OR alert_type LIKE 'sla_%'
  OR alert_type LIKE 'digest_%'
  OR alert_type LIKE 'lucky_wheel_%'
);

CREATE UNIQUE INDEX IF NOT EXISTS security_alerts_lucky_wheel_dedupe_idx
  ON public.security_alerts (alert_type, ((metadata ->> 'ref_date')))
  WHERE alert_type LIKE 'lucky_wheel_%';

-- 3. Valor crítico da qui-quadrado (Wilson-Hilferty) ------------------------
CREATE OR REPLACE FUNCTION public.chi_square_critical(p_df integer, p_alpha double precision)
RETURNS double precision
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_z double precision;
  v_t double precision;
  v_base double precision;
BEGIN
  IF p_df IS NULL OR p_df < 1 OR p_alpha IS NULL OR p_alpha <= 0 OR p_alpha >= 1 THEN
    RETURN 'Infinity'::double precision;
  END IF;
  -- Quantil normal da cauda superior via inversa da distribuição normal.
  v_z := sqrt(2) * public.erf_inverse(1 - 2 * p_alpha);
  v_t := 2.0 / (9.0 * p_df);
  v_base := greatest(1 - v_t + v_z * sqrt(v_t), 0);
  RETURN p_df * power(v_base, 3);
END;
$$;

-- Inversa da função erro (aproximação de Giles, erro < 1e-6 na faixa usada).
CREATE OR REPLACE FUNCTION public.erf_inverse(x double precision)
RETURNS double precision
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.chi_square_critical(integer, double precision) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.erf_inverse(double precision) FROM PUBLIC, anon, authenticated;

-- 4. Rotina diária: snapshot + alertas --------------------------------------
CREATE OR REPLACE FUNCTION public.snapshot_lucky_wheel_payout(p_date date DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.snapshot_lucky_wheel_payout(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.snapshot_lucky_wheel_payout(date) TO service_role;

-- 5. Agendamento diário ------------------------------------------------------
SELECT cron.unschedule('lucky-wheel-payout-snapshot')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lucky-wheel-payout-snapshot');

SELECT cron.schedule(
  'lucky-wheel-payout-snapshot',
  '0 7 * * *',
  $cron$SELECT public.snapshot_lucky_wheel_payout();$cron$
);