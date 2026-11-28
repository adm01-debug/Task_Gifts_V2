CREATE OR REPLACE FUNCTION public.apply_campaign_import(_import_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_import public.campaign_result_imports%ROWTYPE; v_row RECORD; v_prev NUMERIC(14,2); v_next NUMERIC(14,2); v_target NUMERIC(14,2); v_applied INTEGER := 0; v_skipped INTEGER := 0; v_total NUMERIC(16,2) := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role)) THEN RAISE EXCEPTION 'forbidden: apenas administradores ou gestores podem aplicar importações'; END IF;
  SELECT * INTO v_import FROM public.campaign_result_imports WHERE id = _import_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'import_not_found'; END IF;
  IF v_import.status <> 'pending' THEN RAISE EXCEPTION 'invalid_state: lote já processado (%)', v_import.status; END IF;
  FOR v_row IN SELECT * FROM public.campaign_result_rows WHERE import_id = _import_id AND status = 'valid' AND user_id IS NOT NULL ORDER BY row_number FOR UPDATE LOOP
    IF EXISTS (SELECT 1 FROM public.campaign_result_rows r WHERE r.campaign_id = v_row.campaign_id AND r.dedupe_key = v_row.dedupe_key AND r.status = 'applied' AND r.id <> v_row.id) THEN
      UPDATE public.campaign_result_rows SET status = 'skipped', error_reason = 'duplicado: resultado já contabilizado' WHERE id = v_row.id; v_skipped := v_skipped + 1; CONTINUE;
    END IF;
    SELECT target_individual_default INTO v_target FROM public.sales_campaigns WHERE id = v_row.campaign_id;
    INSERT INTO public.campaign_participants (campaign_id, user_id, target_adjusted, progress) VALUES (v_row.campaign_id, v_row.user_id, COALESCE(v_target, 0), 0) ON CONFLICT (campaign_id, user_id) DO NOTHING;
    SELECT progress INTO v_prev FROM public.campaign_participants WHERE campaign_id = v_row.campaign_id AND user_id = v_row.user_id FOR UPDATE;
    v_prev := COALESCE(v_prev, 0); v_next := GREATEST(v_prev + v_row.amount, 0);
    UPDATE public.campaign_participants SET progress = v_next, progress_percent = CASE WHEN COALESCE(target_adjusted, 0) > 0 THEN LEAST(ROUND((v_next / target_adjusted) * 100, 2), 9999) ELSE 0 END, completed_at = CASE WHEN COALESCE(target_adjusted, 0) > 0 AND v_next >= target_adjusted AND completed_at IS NULL THEN now() ELSE completed_at END WHERE campaign_id = v_row.campaign_id AND user_id = v_row.user_id;
    INSERT INTO public.campaign_progress_events (campaign_id, user_id, delta, previous_value, new_value, source, reference_id, note) VALUES (v_row.campaign_id, v_row.user_id, v_row.amount, v_prev, v_next, 'import', _import_id::text, 'Importação: ' || v_import.file_name);
    UPDATE public.campaign_result_rows SET status = 'applied', applied_at = now(), error_reason = NULL WHERE id = v_row.id;
    v_applied := v_applied + 1; v_total := v_total + v_row.amount;
  END LOOP;
  PERFORM public.recalc_campaign_progress(v_import.campaign_id);
  UPDATE public.campaign_result_imports SET status = 'applied', applied_rows = v_applied, skipped_rows = v_skipped, total_amount = v_total, applied_at = now() WHERE id = _import_id;
  RETURN jsonb_build_object('applied', v_applied, 'skipped', v_skipped, 'total_amount', v_total);
END; $function$
