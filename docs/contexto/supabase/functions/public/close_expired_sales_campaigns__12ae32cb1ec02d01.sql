CREATE OR REPLACE FUNCTION public.close_expired_sales_campaigns()
 RETURNS TABLE(campaign_id uuid, participants_notified integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_campaign RECORD;
  v_notified integer;
BEGIN
  FOR v_campaign IN
    SELECT sc.id, sc.name
      FROM public.sales_campaigns sc
     WHERE sc.status = 'active' AND sc.end_date < now()
     FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.sales_campaigns
       SET status = 'completed', updated_at = now()
     WHERE id = v_campaign.id;

    WITH inserted AS (
      INSERT INTO public.notifications (user_id, type, title, message, data)
      SELECT
        cp.user_id,
        'campaign_closed',
        CASE WHEN cp.completed_at IS NOT NULL
             THEN '🏆 Campanha encerrada — meta batida!'
             ELSE 'Campanha encerrada' END,
        CASE WHEN cp.completed_at IS NOT NULL
             THEN 'Parabéns! A campanha "' || v_campaign.name || '" foi encerrada e você bateu a meta.'
             ELSE 'A campanha "' || v_campaign.name || '" foi encerrada. Confira sua posição final.' END,
        jsonb_build_object(
          'campaign_id', v_campaign.id,
          'campaign_name', v_campaign.name,
          'progress', cp.progress,
          'target', cp.target_adjusted,
          'rank_position', cp.rank_position,
          'completed', cp.completed_at IS NOT NULL,
          'url', '/campanhas/' || v_campaign.id
        )
      FROM public.campaign_participants cp
      WHERE cp.campaign_id = v_campaign.id
        AND cp.declined_at IS NULL
        AND public.user_wants_in_app_notification(cp.user_id, 'campaign_closed')
      RETURNING 1
    )
    SELECT COUNT(*) INTO v_notified FROM inserted;

    campaign_id := v_campaign.id;
    participants_notified := COALESCE(v_notified, 0);
    RETURN NEXT;
  END LOOP;
END;
$function$
