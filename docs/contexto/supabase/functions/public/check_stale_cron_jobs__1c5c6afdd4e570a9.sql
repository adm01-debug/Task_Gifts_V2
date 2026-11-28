CREATE OR REPLACE FUNCTION public.check_stale_cron_jobs(p_force boolean DEFAULT false)
 RETURNS TABLE(jobname text, schedule text, atraso_horas numeric, espera_horas numeric, ultima timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid;
  r record;
BEGIN
  -- Cron e service_role chegam aqui com auth.uid() NULL: so' a chamada pela interface exige admin.
  IF auth.uid() IS NOT NULL THEN
    PERFORM public._require_admin();
  END IF;

  -- Job que nunca rodou ganha o marco zero: a espera do vigia conta daqui, nao da criacao.
  INSERT INTO public.cron_job_watch_baseline AS b (jobname)
  SELECT j.jobname AS nome_job
  FROM cron.job j
  WHERE NOT EXISTS (SELECT 1 FROM cron.job_run_details d WHERE d.jobid = j.jobid)
  ON CONFLICT ON CONSTRAINT cron_job_watch_baseline_pkey DO NOTHING;

  FOR r IN
    -- `desde` nulo = job sem marco zero: nao se sabe quando comecou, so' entra no forcado.
    SELECT v.nome_job, v.cron_expr, v.ultima_execucao, v.espera,
           ROUND(EXTRACT(EPOCH FROM (now() - COALESCE(v.ultima_execucao, v.desde))) / 3600.0, 1) AS atraso
    FROM (
      SELECT j.jobname AS nome_job,
             j.schedule AS cron_expr,
             d.ultima AS ultima_execucao,
             GREATEST('-infinity'::timestamptz,
                      COALESCE(w.visto_em, '-infinity'::timestamptz)) AS desde,
             CASE
               WHEN split_part(j.schedule, ' ', 1) ~ '^\*' OR split_part(j.schedule, ' ', 2) ~ '^\*' THEN 2
               WHEN split_part(j.schedule, ' ', 3) ~ '^\*' AND split_part(j.schedule, ' ', 5) ~ '^[0-9]' THEN 8 * 24
               WHEN split_part(j.schedule, ' ', 3) ~ '^\*' THEN 26
               ELSE 40 * 24
             END AS espera
      FROM cron.job j
      LEFT JOIN public.cron_job_watch_baseline w ON w.jobname = j.jobname
      LEFT JOIN LATERAL (
        SELECT max(d2.start_time) AS ultima
        FROM cron.job_run_details d2
        WHERE d2.jobid = j.jobid
      ) d ON true
      WHERE j.active
    ) v
    WHERE p_force OR (v.desde IS NOT NULL
                      AND now() - COALESCE(v.ultima_execucao, v.desde) > make_interval(hours => v.espera::int))
    ORDER BY COALESCE(v.ultima_execucao, v.desde) NULLS FIRST
  LOOP
    -- Um aviso por admin por job por dia: o vigia roda varias vezes ao dia e nao pode virar spam.
    FOR v_user IN
      SELECT DISTINCT ur.user_id FROM public.user_roles ur WHERE ur.role = 'admin'
    LOOP
      PERFORM public.enqueue_push(
        v_user,
        'cron_job_parado',
        'Tarefa automatica parada: ' || r.nome_job,
        'A tarefa "' || r.nome_job || '" (' || r.cron_expr || ') deveria rodar a cada '
          || r.espera || 'h mas a ultima execucao foi '
          || COALESCE(to_char(r.ultima_execucao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM HH24:MI'), 'nunca')
          || '. Nada acontece ate alguem olhar.',
        'cron_parado:' || r.nome_job || ':' || to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYYMMDD'),
        '/admin/telemetria',
        jsonb_build_object('jobname', r.nome_job, 'schedule', r.cron_expr,
                           'atraso_horas', r.atraso, 'espera_horas', r.espera)
      );
    END LOOP;
    jobname := r.nome_job;
    schedule := r.cron_expr;
    atraso_horas := r.atraso;
    espera_horas := r.espera;
    ultima := r.ultima_execucao;
    RETURN NEXT;
  END LOOP;
END;
$function$
