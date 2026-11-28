CREATE OR REPLACE FUNCTION public.send_engagement_reminders()
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
      SELECT c.id    AS cycle_id,
             c.title AS cycle_title,
             c.ends_at,
             a.user_id,
             count(*) AS pendentes,
             date_trunc('week', now())::date AS balde
        FROM public.engagement_question_assignments a
        JOIN public.engagement_cycles c
          ON c.id = a.cycle_id
        JOIN public.profiles p
          ON p.id = a.user_id
         AND p.status = 'confirmed'
       WHERE a.answered_at IS NULL
         AND c.status = 'active'
         AND c.starts_at <= now()
         AND c.ends_at > now()
       GROUP BY c.id, c.title, c.ends_at, a.user_id
    )
    SELECT * FROM elegiveis
  LOOP
    v_mensagem := 'Voce tem ' || e.pendentes
      || CASE WHEN e.pendentes = 1 THEN ' pergunta' ELSE ' perguntas' END
      || ' da pesquisa "' || e.cycle_title || '" esperando resposta ate '
      || to_char(e.ends_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM')
      || ' (horario de Brasilia). Sao poucos minutos e ajuda a empresa a agir'
      || ' sobre o que incomoda o time.';

    IF public.user_wants_in_app_notification(e.user_id, 'engagement_survey_reminder') THEN
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (e.user_id,
              'engagement_survey_reminder',
              'Pesquisa de engajamento esperando voce',
              v_mensagem,
              jsonb_build_object('cycle_id', e.cycle_id,
                                 'balde', e.balde,
                                 'url', '/engajamento'))
      ON CONFLICT DO NOTHING;

      GET DIAGNOSTICS v_inseridos = ROW_COUNT;
      v_rows := v_rows + v_inseridos;
    END IF;

    PERFORM public.enqueue_push(
      e.user_id,
      'engagement_survey_reminder',
      'Pesquisa de engajamento esperando voce',
      v_mensagem,
      'engagement_reminder:' || e.cycle_id::text || ':' || e.user_id::text || ':' || e.balde::text,
      '/engajamento',
      jsonb_build_object('cycle_id', e.cycle_id, 'balde', e.balde)
    );
  END LOOP;

  RETURN v_rows;
END;
$function$
