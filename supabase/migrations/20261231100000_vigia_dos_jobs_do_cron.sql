-- Vigia dos jobs do pg_cron.
--
-- Por que existe: medido em producao em 2026-11-27, `engagement-reminders` (jobid 65) e
-- `exec-monthly-report-generation` (jobid 25) estavam `active = true` e com ZERO linhas em
-- cron.job_run_details, enquanto os outros 30 jobs do mesmo pg_cron tinham de 1 a 10842
-- execucoes. Nada avisou: o lembrete semanal ficou semanas sem rodar e ninguem soube.
--
-- O vigia compara a ultima execucao de cada job com o que o proprio agendamento promete e
-- avisa o admin por push (`enqueue_push`, que respeita a preferencia e a janela de silencio).
--
-- Duas fontes de tolerancia, porque job novo nunca rodou e isso NORMAL, nao e' falha:
--   * `cron.job.min_time` (quando o job foi criado);
--   * `public.cron_job_watch_baseline` (data em que o vigia passou a enxergar o job).
-- O relogio de atraso so' comeca depois do mais recente dos dois.
--
-- `espera_horas` sai do proprio `schedule` para o caso comum (minuto fixo): diario tolera 26h,
-- semanal 8 dias, mensal 40 dias. Expressao de minuto livre (`* * * * *`, `*/15`) usa 2h.

CREATE TABLE IF NOT EXISTS public.cron_job_watch_baseline (
  jobname text PRIMARY KEY,
  visto_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cron_job_watch_baseline IS
  'Primeira vez que o vigia dos jobs viu cada job. Job sem linha aqui nunca foi observado, entao nao e'' tratado como parado.';

ALTER TABLE public.cron_job_watch_baseline ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.cron_job_watch_baseline FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.cron_job_watch_baseline TO service_role;

-- `jobname`, `schedule`, `ultima`... sao nomes de variavel de SAIDA desta funcao: toda coluna da
-- consulta leva apelido proprio (nome_job, cron_expr, ultima_execucao) para o Postgres nao recusar
-- a referencia com 42702 "column reference is ambiguous" - o erro real que apareceu em producao.
CREATE OR REPLACE FUNCTION public.check_stale_cron_jobs(
  p_force boolean DEFAULT false
)
RETURNS TABLE (
  jobname text,
  schedule text,
  atraso_horas numeric,
  espera_horas numeric,
  ultima timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    -- `desde` nulo = job sem min_time e sem marco zero: nao se sabe quando comecou, so' entra no forcado.
    SELECT v.nome_job, v.cron_expr, v.ultima_execucao, v.espera,
           ROUND(EXTRACT(EPOCH FROM (now() - COALESCE(v.ultima_execucao, v.desde))) / 3600.0, 1) AS atraso
    FROM (
      SELECT j.jobname AS nome_job,
             j.schedule AS cron_expr,
             d.ultima AS ultima_execucao,
             GREATEST(COALESCE(j.min_time, '-infinity'::timestamptz),
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
$function$;

COMMENT ON FUNCTION public.check_stale_cron_jobs(boolean) IS
  'Lista jobs do pg_cron que pararam de rodar (ultima execucao mais velha que a propria periodicidade) e avisa os admins por push. Job cron cron-jobs-parados.';

REVOKE ALL ON FUNCTION public.check_stale_cron_jobs(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_stale_cron_jobs(boolean) TO authenticated, service_role;

DO $cron$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cron-jobs-parados') THEN
    PERFORM cron.schedule('cron-jobs-parados', '20 */6 * * *',
                         'SELECT * FROM public.check_stale_cron_jobs()');
  END IF;
END;
$cron$;
