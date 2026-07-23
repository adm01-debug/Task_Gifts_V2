
ALTER TABLE public.notification_preferences
  ALTER COLUMN type_preferences SET DEFAULT CAST('{"xp":{"push":false,"email":false,"in_app":true,"priority":"low"},"goal":{"push":true,"email":true,"in_app":true,"priority":"high"},"quest":{"push":true,"email":true,"in_app":true,"priority":"normal"},"survey":{"push":true,"email":true,"in_app":true,"priority":"high"},"checkin":{"push":false,"email":true,"in_app":true,"priority":"normal"},"feedback":{"push":true,"email":true,"in_app":true,"priority":"high"},"level_up":{"push":true,"email":true,"in_app":true,"priority":"high"},"achievement":{"push":true,"email":true,"in_app":true,"priority":"normal"},"leaderboard":{"push":true,"email":false,"in_app":true,"priority":"normal"},"announcement":{"push":true,"email":true,"in_app":true,"priority":"normal"},"competency_gap":{"push":true,"email":true,"in_app":true,"priority":"high"},"development_tip":{"push":false,"email":true,"in_app":true,"priority":"low"},"campaign_enrolled":{"push":true,"email":false,"in_app":true,"priority":"normal"},"campaign_progress":{"push":false,"email":false,"in_app":true,"priority":"low"},"campaign_milestone":{"push":true,"email":false,"in_app":true,"priority":"normal"},"campaign_completed":{"push":true,"email":true,"in_app":true,"priority":"high"},"campaign_closed":{"push":true,"email":true,"in_app":true,"priority":"normal"}}' AS jsonb);

UPDATE public.notification_preferences
SET type_preferences = jsonb_build_object(
      'campaign_enrolled',  jsonb_build_object('push', true,  'email', false, 'in_app', true, 'priority', 'normal'),
      'campaign_progress',  jsonb_build_object('push', false, 'email', false, 'in_app', true, 'priority', 'low'),
      'campaign_milestone', jsonb_build_object('push', true,  'email', false, 'in_app', true, 'priority', 'normal'),
      'campaign_completed', jsonb_build_object('push', true,  'email', true,  'in_app', true, 'priority', 'high'),
      'campaign_closed',    jsonb_build_object('push', true,  'email', true,  'in_app', true, 'priority', 'normal')
    ) || COALESCE(type_preferences, '{}'::jsonb)
WHERE NOT (COALESCE(type_preferences, '{}'::jsonb) ? 'campaign_completed');

CREATE OR REPLACE FUNCTION public.user_wants_in_app_notification(_user_id uuid, _type text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT COALESCE(np.in_app_enabled, true)
          AND COALESCE((np.type_preferences -> _type ->> 'in_app')::boolean, true)
     FROM public.notification_preferences np
     WHERE np.user_id = _user_id LIMIT 1),
    true
  );
$$;
REVOKE ALL ON FUNCTION public.user_wants_in_app_notification(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_wants_in_app_notification(uuid, text) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.close_expired_sales_campaigns();

CREATE OR REPLACE FUNCTION public.close_expired_sales_campaigns()
RETURNS TABLE(campaign_id uuid, participants_notified integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_campaign RECORD;
  v_notified integer;
BEGIN
  FOR v_campaign IN
    SELECT id, name, goal_amount
    FROM public.sales_campaigns
    WHERE status = 'active' AND end_date < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.sales_campaigns
    SET status = 'completed', updated_at = now()
    WHERE id = v_campaign.id;

    WITH inserted AS (
      INSERT INTO public.notifications (user_id, type, title, message, data, is_read)
      SELECT
        cp.user_id,
        'campaign_closed',
        CASE WHEN cp.goal_reached
             THEN '🏆 Campanha encerrada — meta batida!'
             ELSE 'Campanha encerrada' END,
        CASE WHEN cp.goal_reached
             THEN 'Parabéns! A campanha "' || v_campaign.name || '" foi encerrada e você bateu a meta.'
             ELSE 'A campanha "' || v_campaign.name || '" foi encerrada. Confira sua posição final.' END,
        jsonb_build_object(
          'campaign_id', v_campaign.id,
          'goal_reached', cp.goal_reached,
          'rank_position', cp.rank_position,
          'current_amount', cp.current_amount,
          'goal_amount', v_campaign.goal_amount,
          'url', '/campanhas/' || v_campaign.id
        ),
        false
      FROM public.campaign_participants cp
      WHERE cp.campaign_id = v_campaign.id
        AND public.user_wants_in_app_notification(cp.user_id, 'campaign_closed')
      RETURNING 1
    )
    SELECT COUNT(*) INTO v_notified FROM inserted;

    campaign_id := v_campaign.id;
    participants_notified := COALESCE(v_notified, 0);
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.close_expired_sales_campaigns() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_expired_sales_campaigns() TO service_role;
