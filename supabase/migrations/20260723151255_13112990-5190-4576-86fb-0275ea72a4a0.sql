
CREATE OR REPLACE FUNCTION public.close_expired_sales_campaigns()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  affected integer := 0;
  camp RECORD;
BEGIN
  FOR camp IN
    SELECT id, name, target_global, progress_global
      FROM public.sales_campaigns
     WHERE status = 'active'
       AND end_date < CURRENT_DATE
     FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.sales_campaigns
       SET status = 'completed',
           updated_at = now()
     WHERE id = camp.id;

    -- Notifica participantes ativos (que não recusaram)
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT
      cp.user_id,
      'campaign_closed',
      '🏁 Campanha encerrada',
      CASE
        WHEN cp.completed_at IS NOT NULL
          THEN 'A campanha "' || camp.name || '" foi encerrada. Você bateu sua meta! 🎉'
        ELSE 'A campanha "' || camp.name || '" foi encerrada. Confira o ranking final.'
      END,
      jsonb_build_object(
        'campaign_id', camp.id,
        'campaign_name', camp.name,
        'progress', cp.progress,
        'target', cp.target_adjusted,
        'rank_position', cp.rank_position,
        'completed', cp.completed_at IS NOT NULL,
        'global_progress', camp.progress_global,
        'global_target', camp.target_global,
        'url', '/campanhas/' || camp.id
      )
    FROM public.campaign_participants cp
    WHERE cp.campaign_id = camp.id
      AND cp.declined_at IS NULL;

    affected := affected + 1;
  END LOOP;

  RETURN affected;
END;
$function$;

REVOKE ALL ON FUNCTION public.close_expired_sales_campaigns() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_expired_sales_campaigns() TO service_role;
