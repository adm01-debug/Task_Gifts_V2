-- ============================================================
-- Fase 13 · Item 1 — Motor de ingestão de resultados de vendas
-- ============================================================

CREATE TABLE public.campaign_result_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.sales_campaigns(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'spreadsheet',
  status TEXT NOT NULL DEFAULT 'pending',
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  applied_rows INTEGER NOT NULL DEFAULT 0,
  skipped_rows INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  applied_at TIMESTAMP WITH TIME ZONE,
  reverted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT campaign_result_imports_status_check
    CHECK (status = ANY (ARRAY['pending','applied','failed','reverted'])),
  CONSTRAINT campaign_result_imports_source_check
    CHECK (source = ANY (ARRAY['spreadsheet','api','manual']))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_result_imports TO authenticated;
GRANT ALL ON public.campaign_result_imports TO service_role;
ALTER TABLE public.campaign_result_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_imports_select_staff" ON public.campaign_result_imports
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "campaign_imports_insert_staff" ON public.campaign_result_imports
  FOR INSERT TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
    AND created_by = auth.uid()
  );

CREATE POLICY "campaign_imports_update_staff" ON public.campaign_result_imports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "campaign_imports_delete_admin" ON public.campaign_result_imports
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_campaign_result_imports_campaign
  ON public.campaign_result_imports (campaign_id, created_at DESC);

CREATE TRIGGER trg_campaign_result_imports_updated_at
  BEFORE UPDATE ON public.campaign_result_imports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------

CREATE TABLE public.campaign_result_rows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID NOT NULL REFERENCES public.campaign_result_imports(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.sales_campaigns(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL DEFAULT 0,
  seller_identifier TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  reference_date DATE,
  external_reference TEXT,
  dedupe_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'valid',
  error_reason TEXT,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT campaign_result_rows_status_check
    CHECK (status = ANY (ARRAY['valid','invalid','applied','skipped','reverted']))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_result_rows TO authenticated;
GRANT ALL ON public.campaign_result_rows TO service_role;
ALTER TABLE public.campaign_result_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_rows_select_staff" ON public.campaign_result_rows
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "campaign_rows_insert_staff" ON public.campaign_result_rows
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "campaign_rows_update_staff" ON public.campaign_result_rows
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "campaign_rows_delete_admin" ON public.campaign_result_rows
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_campaign_result_rows_import
  ON public.campaign_result_rows (import_id, row_number);

CREATE UNIQUE INDEX uniq_campaign_result_rows_dedupe
  ON public.campaign_result_rows (campaign_id, dedupe_key)
  WHERE status IN ('valid','applied');

CREATE TRIGGER trg_campaign_result_rows_updated_at
  BEFORE UPDATE ON public.campaign_result_rows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Aplicação transacional do lote
-- ============================================================

CREATE OR REPLACE FUNCTION public.apply_campaign_import(_import_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_import   public.campaign_result_imports%ROWTYPE;
  v_row      RECORD;
  v_prev     NUMERIC(14,2);
  v_next     NUMERIC(14,2);
  v_target   NUMERIC(14,2);
  v_applied  INTEGER := 0;
  v_skipped  INTEGER := 0;
  v_total    NUMERIC(16,2) := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'manager'::app_role)) THEN
    RAISE EXCEPTION 'forbidden: apenas administradores ou gestores podem aplicar importações';
  END IF;

  SELECT * INTO v_import FROM public.campaign_result_imports WHERE id = _import_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'import_not_found';
  END IF;
  IF v_import.status <> 'pending' THEN
    RAISE EXCEPTION 'invalid_state: lote já processado (%)', v_import.status;
  END IF;

  FOR v_row IN
    SELECT * FROM public.campaign_result_rows
    WHERE import_id = _import_id AND status = 'valid' AND user_id IS NOT NULL
    ORDER BY row_number
    FOR UPDATE
  LOOP
    -- deduplicação: já aplicado antes neste campanha com a mesma chave
    IF EXISTS (
      SELECT 1 FROM public.campaign_result_rows r
      WHERE r.campaign_id = v_row.campaign_id
        AND r.dedupe_key = v_row.dedupe_key
        AND r.status = 'applied'
        AND r.id <> v_row.id
    ) THEN
      UPDATE public.campaign_result_rows
        SET status = 'skipped', error_reason = 'duplicado: resultado já contabilizado'
        WHERE id = v_row.id;
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    SELECT target_individual_default INTO v_target
    FROM public.sales_campaigns WHERE id = v_row.campaign_id;

    INSERT INTO public.campaign_participants (campaign_id, user_id, target_adjusted, progress)
    VALUES (v_row.campaign_id, v_row.user_id, COALESCE(v_target, 0), 0)
    ON CONFLICT (campaign_id, user_id) DO NOTHING;

    SELECT progress INTO v_prev
    FROM public.campaign_participants
    WHERE campaign_id = v_row.campaign_id AND user_id = v_row.user_id
    FOR UPDATE;

    v_prev := COALESCE(v_prev, 0);
    v_next := GREATEST(v_prev + v_row.amount, 0);

    UPDATE public.campaign_participants
      SET progress = v_next,
          progress_percent = CASE
            WHEN COALESCE(target_adjusted, 0) > 0
              THEN LEAST(ROUND((v_next / target_adjusted) * 100, 2), 9999)
            ELSE 0 END,
          completed_at = CASE
            WHEN COALESCE(target_adjusted, 0) > 0 AND v_next >= target_adjusted AND completed_at IS NULL
              THEN now() ELSE completed_at END
      WHERE campaign_id = v_row.campaign_id AND user_id = v_row.user_id;

    INSERT INTO public.campaign_progress_events
      (campaign_id, user_id, delta, previous_value, new_value, source, reference_id, note)
    VALUES
      (v_row.campaign_id, v_row.user_id, v_row.amount, v_prev, v_next, 'import',
       _import_id::text, 'Importação: ' || v_import.file_name);

    UPDATE public.campaign_result_rows
      SET status = 'applied', applied_at = now(), error_reason = NULL
      WHERE id = v_row.id;

    v_applied := v_applied + 1;
    v_total := v_total + v_row.amount;
  END LOOP;

  PERFORM public.recalc_campaign_progress(v_import.campaign_id);

  UPDATE public.campaign_result_imports
    SET status = 'applied',
        applied_rows = v_applied,
        skipped_rows = v_skipped,
        total_amount = v_total,
        applied_at = now()
    WHERE id = _import_id;

  RETURN jsonb_build_object(
    'applied', v_applied,
    'skipped', v_skipped,
    'total_amount', v_total
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_campaign_import(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_campaign_import(UUID) TO authenticated, service_role;

-- ============================================================
-- Reversão do lote
-- ============================================================

CREATE OR REPLACE FUNCTION public.revert_campaign_import(_import_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_import  public.campaign_result_imports%ROWTYPE;
  v_row     RECORD;
  v_prev    NUMERIC(14,2);
  v_next    NUMERIC(14,2);
  v_count   INTEGER := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'manager'::app_role)) THEN
    RAISE EXCEPTION 'forbidden: apenas administradores ou gestores podem reverter importações';
  END IF;

  SELECT * INTO v_import FROM public.campaign_result_imports WHERE id = _import_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'import_not_found';
  END IF;
  IF v_import.status <> 'applied' THEN
    RAISE EXCEPTION 'invalid_state: apenas lotes aplicados podem ser revertidos (%)', v_import.status;
  END IF;

  FOR v_row IN
    SELECT * FROM public.campaign_result_rows
    WHERE import_id = _import_id AND status = 'applied' AND user_id IS NOT NULL
    ORDER BY row_number DESC
    FOR UPDATE
  LOOP
    SELECT progress INTO v_prev
    FROM public.campaign_participants
    WHERE campaign_id = v_row.campaign_id AND user_id = v_row.user_id
    FOR UPDATE;

    v_prev := COALESCE(v_prev, 0);
    v_next := GREATEST(v_prev - v_row.amount, 0);

    UPDATE public.campaign_participants
      SET progress = v_next,
          progress_percent = CASE
            WHEN COALESCE(target_adjusted, 0) > 0
              THEN LEAST(ROUND((v_next / target_adjusted) * 100, 2), 9999)
            ELSE 0 END,
          completed_at = CASE
            WHEN COALESCE(target_adjusted, 0) > 0 AND v_next < target_adjusted
              THEN NULL ELSE completed_at END
      WHERE campaign_id = v_row.campaign_id AND user_id = v_row.user_id;

    INSERT INTO public.campaign_progress_events
      (campaign_id, user_id, delta, previous_value, new_value, source, reference_id, note)
    VALUES
      (v_row.campaign_id, v_row.user_id, -v_row.amount, v_prev, v_next, 'import_revert',
       _import_id::text, 'Reversão da importação: ' || v_import.file_name);

    UPDATE public.campaign_result_rows
      SET status = 'reverted', error_reason = NULL
      WHERE id = v_row.id;

    v_count := v_count + 1;
  END LOOP;

  PERFORM public.recalc_campaign_progress(v_import.campaign_id);

  UPDATE public.campaign_result_imports
    SET status = 'reverted', reverted_at = now()
    WHERE id = _import_id;

  RETURN jsonb_build_object('reverted', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.revert_campaign_import(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revert_campaign_import(UUID) TO authenticated, service_role;