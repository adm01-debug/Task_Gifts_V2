CREATE OR REPLACE FUNCTION public.send_climate_survey_reminders()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rows      integer := 0;
  v_inseridos integer;
  v_mensagem  text;
  e           record;
BEGIN
  FOR e IN
    WITH elegiveis AS (
      SELECT s.id    AS survey_id,
             s.title AS survey_title,
             s.ends_at,
                 s.is_anonymous,
             p.id    AS user_id,
             CASE WHEN s.reminder_frequency = 'weekly'
                  THEN date_trunc('week', now())::date
                  ELSE current_date
             END     AS balde
        FROM public.climate_surveys s
        JOIN public.profiles p
          ON p.status = 'confirmed'
       WHERE s.status = 'active'
         AND s.send_reminders
         AND (s.starts_at IS NULL OR s.starts_at <= now())
         AND s.ends_at IS NOT NULL
         AND s.ends_at > now()
         AND (s.ends_at AT TIME ZONE 'America/Sao_Paulo')::date
             <= ((now() AT TIME ZONE 'America/Sao_Paulo')::date + 7)
         AND NOT EXISTS (
               SELECT 1
                 FROM public.climate_survey_responses r
                WHERE r.survey_id = s.id
                  AND r.user_id = p.id
             )
    )
    SELECT * FROM elegiveis
  LOOP
    v_mensagem := 'A pesquisa "' || e.survey_title || '" fica aberta ate '
      || to_char(e.ends_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM')
      || ' (horario de Brasilia). A resposta leva poucos minutos'
      || CASE WHEN e.is_anonymous THEN ' e e anonima.' ELSE '.' END;

    IF public.user_wants_in_app_notification(e.user_id, 'climate_survey_reminder') THEN
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (e.user_id,
              'climate_survey_reminder',
              'Pesquisa de clima aberta',
              v_mensagem,
              jsonb_build_object('survey_id', e.survey_id, 'balde', e.balde))
      ON CONFLICT DO NOTHING;

      GET DIAGNOSTICS v_inseridos = ROW_COUNT;
      v_rows := v_rows + v_inseridos;
    END IF;

    -- enqueue_push() ja filtra a preferencia de push e o dedupe_key unico.
    PERFORM public.enqueue_push(
      e.user_id,
      'climate_survey_reminder',
      'Pesquisa de clima aberta',
      v_mensagem,
      'climate_reminder:' || e.survey_id::text || ':' || e.user_id::text || ':' || e.balde::text,
      '/clima',
      jsonb_build_object('survey_id', e.survey_id, 'balde', e.balde)
    );
  END LOOP;

  RETURN v_rows;
END;
$function$
