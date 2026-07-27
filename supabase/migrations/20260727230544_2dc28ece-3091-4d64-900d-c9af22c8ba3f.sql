-- =========================================================
-- GUERRA DE DEPARTAMENTOS (Onda 2 - social)
-- =========================================================

-- Helper: departamento primario e ativo do usuario (via cargo).
CREATE OR REPLACE FUNCTION public.get_user_department_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.department_id
    FROM public.user_positions up
    JOIN public.positions p ON p.id = up.position_id
   WHERE up.user_id = p_user_id
     AND up.ended_at IS NULL
     AND p.department_id IS NOT NULL
   ORDER BY up.is_primary DESC, up.started_at DESC
   LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_department_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_department_id(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------
-- Tabela principal
-- ---------------------------------------------------------
CREATE TABLE public.department_wars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','running','finished','cancelled')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  fairness_alpha numeric NOT NULL DEFAULT 0.5
    CHECK (fairness_alpha >= 0 AND fairness_alpha <= 1),
  per_user_cap integer NOT NULL DEFAULT 0 CHECK (per_user_cap >= 0),
  participation_bonus numeric NOT NULL DEFAULT 0.2
    CHECK (participation_bonus >= 0 AND participation_bonus <= 1),
  coins_pool integer NOT NULL DEFAULT 0 CHECK (coins_pool >= 0),
  xp_pool integer NOT NULL DEFAULT 0 CHECK (xp_pool >= 0),
  placement_shares jsonb NOT NULL DEFAULT '[0.5,0.3,0.2]'::jsonb,
  per_member_coins_cap integer NOT NULL DEFAULT 0 CHECK (per_member_coins_cap >= 0),
  settled_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Janela valida: regra dependente de dados vai em trigger, nao em CHECK.
CREATE OR REPLACE FUNCTION public.validate_department_war()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'O termino da guerra deve ser posterior ao inicio';
  END IF;
  IF jsonb_typeof(NEW.placement_shares) <> 'array'
     OR jsonb_array_length(NEW.placement_shares) = 0 THEN
    RAISE EXCEPTION 'placement_shares deve ser um array nao vazio';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_department_war
BEFORE INSERT OR UPDATE ON public.department_wars
FOR EACH ROW EXECUTE FUNCTION public.validate_department_war();

CREATE INDEX idx_department_wars_status ON public.department_wars (status, ends_at DESC);

GRANT SELECT ON public.department_wars TO authenticated;
GRANT ALL ON public.department_wars TO service_role;
ALTER TABLE public.department_wars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados veem guerras publicadas"
  ON public.department_wars FOR SELECT TO authenticated
  USING (status <> 'draft' OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins gerenciam guerras"
  ON public.department_wars FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ---------------------------------------------------------
-- Metricas pontuadas
-- ---------------------------------------------------------
CREATE TABLE public.department_war_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  war_id uuid NOT NULL REFERENCES public.department_wars(id) ON DELETE CASCADE,
  metric_key text NOT NULL,
  label text NOT NULL,
  weight numeric NOT NULL DEFAULT 1 CHECK (weight >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (war_id, metric_key)
);

CREATE INDEX idx_war_metrics_war ON public.department_war_metrics (war_id);

GRANT SELECT ON public.department_war_metrics TO authenticated;
GRANT ALL ON public.department_war_metrics TO service_role;
ALTER TABLE public.department_war_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados veem metricas da guerra"
  ON public.department_war_metrics FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.department_wars w
     WHERE w.id = war_id
       AND (w.status <> 'draft' OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Admins gerenciam metricas da guerra"
  ON public.department_war_metrics FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ---------------------------------------------------------
-- Departamentos participantes (headcount congelado)
-- ---------------------------------------------------------
CREATE TABLE public.department_war_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  war_id uuid NOT NULL REFERENCES public.department_wars(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  headcount integer NOT NULL DEFAULT 0 CHECK (headcount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (war_id, department_id)
);

CREATE INDEX idx_war_departments_war ON public.department_war_departments (war_id);

GRANT SELECT ON public.department_war_departments TO authenticated;
GRANT ALL ON public.department_war_departments TO service_role;
ALTER TABLE public.department_war_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados veem participantes da guerra"
  ON public.department_war_departments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.department_wars w
     WHERE w.id = war_id
       AND (w.status <> 'draft' OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Admins gerenciam participantes da guerra"
  ON public.department_war_departments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ---------------------------------------------------------
-- Contribuicoes (append-only, idempotentes)
-- ---------------------------------------------------------
CREATE TABLE public.department_war_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  war_id uuid NOT NULL REFERENCES public.department_wars(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  metric_key text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  dedupe_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (war_id, dedupe_key)
);

CREATE INDEX idx_war_contrib_war_dept ON public.department_war_contributions (war_id, department_id);
CREATE INDEX idx_war_contrib_user ON public.department_war_contributions (war_id, user_id);

GRANT SELECT ON public.department_war_contributions TO authenticated;
GRANT ALL ON public.department_war_contributions TO service_role;
ALTER TABLE public.department_war_contributions ENABLE ROW LEVEL SECURITY;

-- Escrita apenas via RPC SECURITY DEFINER: nenhuma policy de INSERT/UPDATE/DELETE.
CREATE POLICY "Usuario ve as proprias contribuicoes"
  ON public.department_war_contributions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- ---------------------------------------------------------
-- Resultados consolidados
-- ---------------------------------------------------------
CREATE TABLE public.department_war_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  war_id uuid NOT NULL REFERENCES public.department_wars(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  position integer NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  raw_score numeric NOT NULL DEFAULT 0,
  contributors integer NOT NULL DEFAULT 0,
  participation_rate numeric NOT NULL DEFAULT 0,
  coins_per_member integer NOT NULL DEFAULT 0,
  xp_per_member integer NOT NULL DEFAULT 0,
  coins_total integer NOT NULL DEFAULT 0,
  xp_total integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (war_id, department_id)
);

CREATE INDEX idx_war_results_war ON public.department_war_results (war_id, position);

GRANT SELECT ON public.department_war_results TO authenticated;
GRANT ALL ON public.department_war_results TO service_role;
ALTER TABLE public.department_war_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados veem resultados da guerra"
  ON public.department_war_results FOR SELECT TO authenticated
  USING (true);

-- ---------------------------------------------------------
-- RPC: registrar contribuicao (idempotente, self-only)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_war_contribution(
  p_war_id uuid,
  p_metric_key text,
  p_amount numeric,
  p_dedupe_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_war public.department_wars%ROWTYPE;
  v_dept uuid;
  v_inserted uuid;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 1000000 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
  END IF;
  IF p_metric_key IS NULL OR length(trim(p_metric_key)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_metric');
  END IF;
  IF p_dedupe_key IS NULL OR length(trim(p_dedupe_key)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_dedupe_key');
  END IF;

  SELECT * INTO v_war FROM public.department_wars WHERE id = p_war_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  IF v_war.status <> 'running' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_running');
  END IF;
  IF now() < v_war.starts_at OR now() > v_war.ends_at THEN
    RETURN jsonb_build_object('success', false, 'reason', 'outside_window');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.department_war_metrics
     WHERE war_id = p_war_id AND metric_key = p_metric_key
  ) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'metric_not_scored');
  END IF;

  v_dept := public.get_user_department_id(v_user);
  IF v_dept IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_department');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.department_war_departments
     WHERE war_id = p_war_id AND department_id = v_dept
  ) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'department_not_enrolled');
  END IF;

  INSERT INTO public.department_war_contributions
    (war_id, department_id, user_id, metric_key, amount, dedupe_key)
  VALUES (p_war_id, v_dept, v_user, p_metric_key, p_amount,
          v_user::text || ':' || p_dedupe_key)
  ON CONFLICT (war_id, dedupe_key) DO NOTHING
  RETURNING id INTO v_inserted;

  IF v_inserted IS NULL THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  RETURN jsonb_build_object('success', true, 'duplicate', false,
                            'department_id', v_dept, 'contribution_id', v_inserted);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_war_contribution(uuid, text, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_war_contribution(uuid, text, numeric, text) TO authenticated, service_role;

-- ---------------------------------------------------------
-- RPC: placar ao vivo (espelha o motor puro em TypeScript)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_department_war_standings(p_war_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_war public.department_wars%ROWTYPE;
  v_standings jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;

  SELECT * INTO v_war FROM public.department_wars WHERE id = p_war_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  IF v_war.status = 'draft' AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  WITH per_user AS (
    SELECT c.department_id,
           c.user_id,
           SUM(c.amount * COALESCE(m.weight, 0)) AS points
      FROM public.department_war_contributions c
      LEFT JOIN public.department_war_metrics m
        ON m.war_id = c.war_id AND m.metric_key = c.metric_key
     WHERE c.war_id = p_war_id
     GROUP BY c.department_id, c.user_id
    HAVING SUM(c.amount * COALESCE(m.weight, 0)) > 0
  ),
  capped AS (
    SELECT department_id,
           CASE WHEN v_war.per_user_cap > 0
                THEN LEAST(points, v_war.per_user_cap) ELSE points END AS points,
           CASE WHEN v_war.per_user_cap > 0
                THEN GREATEST(points - v_war.per_user_cap, 0) ELSE 0 END AS capped_out
      FROM per_user
  ),
  agg AS (
    SELECT department_id,
           SUM(points) AS raw_score,
           SUM(capped_out) AS capped_out,
           COUNT(*)::int AS contributors
      FROM capped
     GROUP BY department_id
  ),
  scored AS (
    SELECT d.department_id,
           dep.name,
           d.headcount,
           ROUND(COALESCE(a.raw_score, 0), 4) AS raw_score,
           ROUND(COALESCE(a.capped_out, 0), 4) AS capped_out,
           COALESCE(a.contributors, 0) AS contributors,
           ROUND(CASE WHEN d.headcount > 0
                      THEN LEAST(COALESCE(a.contributors, 0)::numeric / d.headcount, 1)
                      ELSE 0 END, 4) AS participation_rate,
           ROUND(
             (COALESCE(a.raw_score, 0)
                / POWER(GREATEST(d.headcount, 1)::numeric, v_war.fairness_alpha))
             * (1 + v_war.participation_bonus
                    * CASE WHEN d.headcount > 0
                           THEN LEAST(COALESCE(a.contributors, 0)::numeric / d.headcount, 1)
                           ELSE 0 END)
           , 4) AS score
      FROM public.department_war_departments d
      JOIN public.departments dep ON dep.id = d.department_id
      LEFT JOIN agg a ON a.department_id = d.department_id
     WHERE d.war_id = p_war_id
  ),
  ranked AS (
    SELECT s.*, DENSE_RANK() OVER (ORDER BY s.score DESC) AS position
      FROM scored s
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.position, r.participation_rate DESC,
                            r.raw_score DESC, r.name), '[]'::jsonb)
    INTO v_standings
    FROM ranked r;

  RETURN jsonb_build_object(
    'success', true,
    'war', to_jsonb(v_war),
    'standings', v_standings
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_department_war_standings(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_department_war_standings(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------
-- RPC: encerrar e creditar (admin, idempotente, advisory lock)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.settle_department_war(p_war_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_war public.department_wars%ROWTYPE;
  v_standings jsonb;
  v_row jsonb;
  v_shares numeric[];
  v_share_sum numeric := 0;
  v_index int := 0;
  v_fraction numeric;
  v_coins_budget int;
  v_xp_budget int;
  v_members int;
  v_coins_pm int;
  v_xp_pm int;
  v_total_coins int := 0;
  v_total_xp int := 0;
  v_members_paid int := 0;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'forbidden');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('department_war_settle:' || p_war_id::text, 0));

  SELECT * INTO v_war FROM public.department_wars WHERE id = p_war_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  IF v_war.settled_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'already_settled', true);
  END IF;
  IF v_war.status NOT IN ('running', 'finished') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_status');
  END IF;

  SELECT (public.get_department_war_standings(p_war_id) -> 'standings') INTO v_standings;
  IF v_standings IS NULL THEN
    v_standings := '[]'::jsonb;
  END IF;

  SELECT array_agg(GREATEST((value #>> '{}')::numeric, 0) ORDER BY ord)
    INTO v_shares
    FROM jsonb_array_elements(v_war.placement_shares) WITH ORDINALITY AS t(value, ord);

  FOR v_index IN 1 .. LEAST(COALESCE(array_length(v_shares, 1), 0), jsonb_array_length(v_standings)) LOOP
    v_share_sum := v_share_sum + v_shares[v_index];
  END LOOP;

  v_index := 0;
  FOR v_row IN SELECT * FROM jsonb_array_elements(v_standings) LOOP
    v_index := v_index + 1;

    v_coins_pm := 0;
    v_xp_pm := 0;
    v_coins_budget := 0;
    v_xp_budget := 0;
    v_members := GREATEST((v_row ->> 'headcount')::int, 1);

    IF v_index <= COALESCE(array_length(v_shares, 1), 0) AND v_share_sum > 0 THEN
      v_fraction := v_shares[v_index] / v_share_sum;
      v_coins_budget := floor(v_war.coins_pool * v_fraction)::int;
      v_xp_budget := floor(v_war.xp_pool * v_fraction)::int;
      v_coins_pm := floor(v_coins_budget::numeric / v_members)::int;
      IF v_war.per_member_coins_cap > 0 THEN
        v_coins_pm := LEAST(v_coins_pm, v_war.per_member_coins_cap);
      END IF;
      v_xp_pm := floor(v_xp_budget::numeric / v_members)::int;
    END IF;

    INSERT INTO public.department_war_results (
      war_id, department_id, position, score, raw_score, contributors,
      participation_rate, coins_per_member, xp_per_member, coins_total, xp_total
    ) VALUES (
      p_war_id,
      (v_row ->> 'department_id')::uuid,
      (v_row ->> 'position')::int,
      (v_row ->> 'score')::numeric,
      (v_row ->> 'raw_score')::numeric,
      (v_row ->> 'contributors')::int,
      (v_row ->> 'participation_rate')::numeric,
      v_coins_pm,
      v_xp_pm,
      v_coins_pm * v_members,
      v_xp_pm * v_members
    )
    ON CONFLICT (war_id, department_id) DO NOTHING;

    IF v_coins_pm > 0 OR v_xp_pm > 0 THEN
      WITH members AS (
        SELECT DISTINCT up.user_id
          FROM public.user_positions up
          JOIN public.positions pos ON pos.id = up.position_id
         WHERE up.ended_at IS NULL
           AND pos.department_id = (v_row ->> 'department_id')::uuid
      ), paid AS (
        UPDATE public.profiles p
           SET coins = p.coins + v_coins_pm,
               xp = p.xp + v_xp_pm,
               level = GREATEST(p.level, floor((p.xp + v_xp_pm) / 1000) + 1),
               updated_at = now()
          FROM members m
         WHERE p.id = m.user_id
           AND p.status = 'confirmed'
        RETURNING 1
      )
      SELECT COUNT(*)::int INTO v_members FROM paid;

      v_members_paid := v_members_paid + v_members;
      v_total_coins := v_total_coins + (v_coins_pm * v_members);
      v_total_xp := v_total_xp + (v_xp_pm * v_members);
    END IF;
  END LOOP;

  UPDATE public.department_wars
     SET status = 'finished', settled_at = now(), updated_at = now()
   WHERE id = p_war_id;

  RETURN jsonb_build_object(
    'success', true,
    'already_settled', false,
    'departments', v_index,
    'members_paid', v_members_paid,
    'coins', v_total_coins,
    'xp', v_total_xp
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.settle_department_war(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.settle_department_war(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------
-- RPC: sincronizar headcount dos participantes (admin)
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_department_war_headcount(p_war_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_updated int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'forbidden');
  END IF;

  WITH counts AS (
    SELECT pos.department_id, COUNT(DISTINCT up.user_id)::int AS total
      FROM public.user_positions up
      JOIN public.positions pos ON pos.id = up.position_id
      JOIN public.profiles pr ON pr.id = up.user_id AND pr.status = 'confirmed'
     WHERE up.ended_at IS NULL AND pos.department_id IS NOT NULL
     GROUP BY pos.department_id
  ), upd AS (
    UPDATE public.department_war_departments d
       SET headcount = COALESCE(c.total, 0), updated_at = now()
      FROM counts c
     WHERE d.war_id = p_war_id AND d.department_id = c.department_id
    RETURNING 1
  )
  SELECT COUNT(*)::int INTO v_updated FROM upd;

  RETURN jsonb_build_object('success', true, 'updated', v_updated);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_department_war_headcount(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_department_war_headcount(uuid) TO authenticated, service_role;