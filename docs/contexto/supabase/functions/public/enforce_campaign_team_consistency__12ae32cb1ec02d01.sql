CREATE OR REPLACE FUNCTION public.enforce_campaign_team_consistency()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _team_campaign UUID;
BEGIN
  SELECT campaign_id INTO _team_campaign FROM public.campaign_teams WHERE id = NEW.team_id;
  IF _team_campaign IS NULL THEN RAISE EXCEPTION 'team_not_found' USING ERRCODE = '23503'; END IF;
  IF NEW.campaign_id IS NULL THEN NEW.campaign_id := _team_campaign;
  ELSIF NEW.campaign_id <> _team_campaign THEN RAISE EXCEPTION 'team_campaign_mismatch' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END; $function$
