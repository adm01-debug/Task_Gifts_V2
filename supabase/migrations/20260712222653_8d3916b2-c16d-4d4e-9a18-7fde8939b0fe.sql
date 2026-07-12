
CREATE OR REPLACE FUNCTION public.notify_admins_of_monthly_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period text;
  v_resolution_pct int;
  v_action_pct int;
  v_summary text;
BEGIN
  v_period := to_char(make_date(NEW.period_year, NEW.period_month, 1), 'TMMonth/YYYY');

  v_resolution_pct := CASE WHEN NEW.incidents_total > 0
    THEN ROUND((NEW.incidents_resolved::numeric / NEW.incidents_total) * 100)::int
    ELSE 100 END;
  v_action_pct := CASE WHEN NEW.action_items_total > 0
    THEN ROUND((NEW.action_items_done::numeric / NEW.action_items_total) * 100)::int
    ELSE 100 END;

  v_summary := format(
    '%s incidentes (%s%% resolvidos) · MTTR médio %s min · %s SLA breaches · Ações concluídas: %s%% (%s atrasadas)',
    NEW.incidents_total,
    v_resolution_pct,
    COALESCE(NEW.mttr_minutes_avg::text, '—'),
    NEW.sla_breaches,
    v_action_pct,
    NEW.action_items_overdue
  );

  INSERT INTO public.notifications (user_id, type, title, message, data)
  SELECT
    ur.user_id,
    'executive_report',
    format('Relatório executivo — %s', v_period),
    v_summary,
    jsonb_build_object(
      'report_id', NEW.id,
      'period', format('%s-%s', NEW.period_year, lpad(NEW.period_month::text, 2, '0')),
      'deep_link', '/admin/executive-report',
      'incidents_total', NEW.incidents_total,
      'sla_breaches', NEW.sla_breaches,
      'action_items_overdue', NEW.action_items_overdue,
      'severity_hint', CASE
        WHEN NEW.sla_breaches > 0 OR NEW.action_items_overdue > 0 OR v_resolution_pct < 80
          THEN 'warn' ELSE 'ok' END
    )
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_admins_of_monthly_report() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_admins_of_monthly_report() TO service_role;

DROP TRIGGER IF EXISTS trg_notify_admins_monthly_report ON public.executive_monthly_reports;
CREATE TRIGGER trg_notify_admins_monthly_report
AFTER INSERT ON public.executive_monthly_reports
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_of_monthly_report();
