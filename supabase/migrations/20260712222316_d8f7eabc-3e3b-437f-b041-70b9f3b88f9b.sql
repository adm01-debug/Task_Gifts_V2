
CREATE TABLE public.postmortem_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  postmortem_id uuid NOT NULL REFERENCES public.postmortems(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_label text,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done','cancelled')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.postmortem_actions TO authenticated;
GRANT ALL ON public.postmortem_actions TO service_role;

ALTER TABLE public.postmortem_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage postmortem actions"
ON public.postmortem_actions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_postmortem_actions_updated_at
BEFORE UPDATE ON public.postmortem_actions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pm_actions_postmortem ON public.postmortem_actions(postmortem_id);
CREATE INDEX idx_pm_actions_status_due ON public.postmortem_actions(status, due_date)
  WHERE status IN ('open','in_progress');

-- Auto-set completed_at when status transitions to done
CREATE OR REPLACE FUNCTION public.set_postmortem_action_completed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done') AND NEW.completed_at IS NULL THEN
    NEW.completed_at := now();
  ELSIF NEW.status <> 'done' THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pm_action_completed
BEFORE UPDATE ON public.postmortem_actions
FOR EACH ROW EXECUTE FUNCTION public.set_postmortem_action_completed_at();

-- Cron RPC: alerta diário de ações em atraso
CREATE OR REPLACE FUNCTION public.check_overdue_postmortem_actions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_overdue jsonb;
  v_count int;
  v_alert_id uuid;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_agg(row_to_json(t)), COUNT(*)
    INTO v_overdue, v_count
  FROM (
    SELECT
      a.id, a.title, a.priority, a.status,
      a.due_date, a.owner_label,
      p.id AS postmortem_id, p.title AS postmortem_title,
      (CURRENT_DATE - a.due_date) AS days_overdue
    FROM public.postmortem_actions a
    JOIN public.postmortems p ON p.id = a.postmortem_id
    WHERE a.status IN ('open','in_progress')
      AND a.due_date IS NOT NULL
      AND a.due_date < CURRENT_DATE
    ORDER BY a.due_date ASC
    LIMIT 100
  ) t;

  IF v_count = 0 THEN
    RETURN jsonb_build_object('overdue_count', 0, 'executed_at', now());
  END IF;

  -- Deduplicação: um alerta por dia
  IF EXISTS (
    SELECT 1 FROM public.security_alerts
    WHERE alert_type = 'postmortem_actions_overdue'
      AND created_at::date = CURRENT_DATE
  ) THEN
    RETURN jsonb_build_object('overdue_count', v_count, 'alert_created', false, 'reason', 'already_alerted_today');
  END IF;

  INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
  VALUES (
    'postmortem_actions_overdue',
    CASE WHEN v_count >= 10 THEN 'high' WHEN v_count >= 3 THEN 'medium' ELSE 'low' END,
    format('%s item(ns) de ação de postmortem em atraso', v_count),
    format('Existem %s ações atrasadas de postmortems (aberto/em progresso).', v_count),
    jsonb_build_object(
      'overdue_count', v_count,
      'items', v_overdue,
      'deep_link', '/admin/postmortems',
      'checked_at', now()
    )
  )
  RETURNING id INTO v_alert_id;

  RETURN jsonb_build_object('overdue_count', v_count, 'alert_created', true, 'alert_id', v_alert_id);
END;
$$;

REVOKE ALL ON FUNCTION public.check_overdue_postmortem_actions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_overdue_postmortem_actions() TO service_role;

-- Cron diário 09:00 UTC
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('postmortem_overdue_daily_check')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'postmortem_overdue_daily_check');
    PERFORM cron.schedule(
      'postmortem_overdue_daily_check',
      '0 9 * * *',
      $cron$ SELECT public.check_overdue_postmortem_actions(); $cron$
    );
  END IF;
END
$$;
