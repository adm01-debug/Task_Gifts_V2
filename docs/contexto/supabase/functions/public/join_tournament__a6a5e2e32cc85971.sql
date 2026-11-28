CREATE OR REPLACE FUNCTION public.join_tournament(p_tournament_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user UUID := auth.uid();
  v_t public.tournaments%ROWTYPE;
  v_count INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('tournament_join:' || p_tournament_id::text, 0));

  SELECT * INTO v_t FROM public.tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  IF v_t.status <> 'registration' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'registration_closed');
  END IF;
  IF v_t.registration_closes_at IS NOT NULL AND now() > v_t.registration_closes_at THEN
    RETURN jsonb_build_object('success', false, 'reason', 'registration_closed');
  END IF;
  IF now() < v_t.registration_opens_at THEN
    RETURN jsonb_build_object('success', false, 'reason', 'registration_not_open');
  END IF;

  IF EXISTS (SELECT 1 FROM public.tournament_participants
             WHERE tournament_id = p_tournament_id AND user_id = v_user) THEN
    RETURN jsonb_build_object('success', true, 'already_joined', true);
  END IF;

  SELECT count(*) INTO v_count FROM public.tournament_participants
   WHERE tournament_id = p_tournament_id;
  IF v_count >= v_t.max_participants THEN
    RETURN jsonb_build_object('success', false, 'reason', 'full');
  END IF;

  INSERT INTO public.tournament_participants (tournament_id, user_id)
  VALUES (p_tournament_id, v_user);

  RETURN jsonb_build_object('success', true, 'already_joined', false,
                            'participants', v_count + 1);
END;
$function$
