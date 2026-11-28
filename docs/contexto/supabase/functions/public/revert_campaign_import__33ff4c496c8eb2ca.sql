CREATE OR REPLACE FUNCTION public.revert_campaign_import(_import_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_import public.campaign_result_imports%ROWTYPE; v_row RECORD; v_prev NUMERIC(14,2); v_next NUMERIC(14,2); v_count INTEGER := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role)) THEN RAISE EXCEPTION 'forbidden: apenas administradores ou gestores podem reverter importações'; END IF;
  SELECT * INTO v_import FROM public.campaign_result_imports WHERE id = _import_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'import_not_found'; END IF;
  IF v_import.status <> 'applied' THEN RAISE EXCEPTION 'invalid_state: apenas lotes aplicados podem ser revertidos (%)', v_import.status; END IF;
  FOR v_row IN SELECT * FROM public.campaign_result_rows WHERE import_id = _import_id AND status = 'applied' AND user_id IS NOT NULL ORDER BY row_number DESC FOR UPDATE LOOP
    SELECT progress INTO v_prev FROM public.campaign_participants WHERE campaign_id = v_row.campaign_id AND user_id = v_row.user_id FOR UPDATE;
    v_prev := COALESCE(v_prev, 0); v_next := GREATEST(v_prev - v_row.amount, 0);
    UPDATE public.campaign_participants SET progress = v_next, progress_percent = CASE WHEN COALESCE(target_adjusted, 0) > 0 THEN LEAST(ROUND((v_next / target_adjusted) * 100, 2), 9999) ELSE 0 END, completed_at = CASE WHEN COALESCE(target_adjusted, 0) > 0 AND v_next < target_adjusted THEN NULL ELSE completed_at END WHERE campaign_id = v_row.campaign_id AND user_id = v_row.user_id;
    INSERT INTO public.campaign_progress_events (campaign_id, user_id, delta, previous_value, new_value, source, reference_id, note) VALUES (v_row.campaign_id, v_row.user_id, -v_row.amount, v_prev, v_next, 'import_revert', _import_id::text, 'Reversão da importação: ' || v_import.file_name);
    UPDATE public.campaign_result_rows SET status = 'reverted', error_reason = NULL WHERE id = v_row.id;
    v_count := v_count + 1;
  END LOOP;
  PERFORM public.recalc_campaign_progress(v_import.campaign_id);
  UPDATE public.campaign_result_imports SET status = 'reverted', reverted_at = now() WHERE id = _import_id;
  RETURN jsonb_build_object('reverted', v_count);
END; $function$
