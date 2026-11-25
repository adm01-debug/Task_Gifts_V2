-- ============================================
-- Reaplica as 3 funcoes cujo texto de mensagem ao usuario estava mais velho em producao
-- ============================================
--
-- Metodo: os corpos de funcao de producao e do banco reconstruido foram comparados como base64
-- (o transporte MCP corrompe nao-ASCII na leitura, entao texto cru nao serve como prova) e depois
-- normalizados por um scanner literal-aware que remove comentarios e whitespace. Resultado para as
-- 284 funcoes de public: 281 identicas e apenas estas 3 divergindo - todas somente em literais de
-- mensagem (acentos ausentes, tres pontos no lugar do caractere de reticencias e uma frase final que
-- o repositorio tem e producao nao):
--   * check_api_key_rotation_overdue()  - mensagem de rotacao vencida
--   * snapshot_push_outbox_health()     - mensagem de backlog critico
--   * unblock_board_players(...)        - mensagem de desbloqueio do tabuleiro
--
-- Nenhuma dessas funcoes estava na 20261228170000 (reaplica 29), por isso o texto de producao
-- continuou velho. As definicoes abaixo sao exatamente as do banco reconstruido (fonte da verdade
-- do repositorio), geradas por pg_get_functiondef e nao reescritas a mao.
--
-- Sem risco de 42P13: CREATE OR REPLACE aqui preserva assinatura e tipo de retorno identicos aos de
-- producao (a comparacao chaveada por proname+identity arguments deu 284 x 284 sem ausentes), e o
-- ACL nao muda porque OR REPLACE preserva os privilegios existentes (alinhados na 20261228190000).

CREATE OR REPLACE FUNCTION public.check_api_key_rotation_overdue()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer := 0;
  r record;
BEGIN
  FOR r IN
    SELECT eak.id, eak.name, eak.api_key,
           GREATEST(0, EXTRACT(DAY FROM now() - COALESCE(eak.secret_last_rotated_at, eak.created_at))::int) AS days
    FROM public.external_api_keys eak
    WHERE eak.is_active = true
      AND COALESCE(eak.secret_last_rotated_at, eak.created_at) < now() - interval '90 days'
  LOOP
    -- Evita duplicidade: um alerta aberto por chave a cada 7 dias
    IF NOT EXISTS (
      SELECT 1 FROM public.security_alerts sa
      WHERE sa.alert_type = 'api_key_rotation_overdue'
        AND sa.metadata->>'key_id' = r.id::text
        AND sa.is_resolved = false
        AND sa.created_at > now() - interval '7 days'
    ) THEN
      INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
      VALUES (
        'api_key_rotation_overdue',
        CASE WHEN r.days >= 180 THEN 'high' ELSE 'medium' END,
        'Chave de API sem rotação há ' || r.days || ' dias',
        'A chave "' || r.name || '" (' || left(r.api_key, 6) || '…' || right(r.api_key, 4) ||
        ') está ativa e não tem o segredo rotacionado há ' || r.days || ' dias. Rotacione em Admin > Chaves de API.',
        jsonb_build_object('key_id', r.id, 'name', r.name, 'days_since_rotation', r.days)
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.snapshot_push_outbox_health()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_since timestamptz := now() - interval '24 hours';
  v_stuck_cutoff timestamptz := now() - interval '5 minutes';
  v_pending integer; v_processing integer; v_stuck integer;
  v_sent integer; v_failed integer; v_skipped integer;
  v_oldest integer; v_idle integer;
  v_total integer; v_failure_rate numeric;
  v_penalty integer := 0;
  v_alerts jsonb := '[]'::jsonb;
  v_has_critical boolean := false;
  v_score integer;
  v_severity text;
  v_id uuid;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'processing' AND updated_at < v_stuck_cutoff THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'sent' AND processed_at >= v_since THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'failed' AND processed_at >= v_since THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'skipped' AND processed_at >= v_since THEN 1 ELSE 0 END), 0),
    COALESCE(FLOOR(EXTRACT(EPOCH FROM (now() - MIN(CASE WHEN status = 'pending' THEN created_at END))) / 60), 0),
    CASE WHEN MAX(processed_at) IS NULL THEN NULL
         ELSE FLOOR(EXTRACT(EPOCH FROM (now() - MAX(processed_at))) / 60) END
  INTO v_pending, v_processing, v_stuck, v_sent, v_failed, v_skipped, v_oldest, v_idle
  FROM public.push_outbox;

  v_total := v_sent + v_failed + v_skipped;
  v_failure_rate := CASE WHEN v_total = 0 THEN 0 ELSE v_failed::numeric / v_total END;

  IF v_pending >= 500 THEN
    v_penalty := v_penalty + 40; v_has_critical := true;
    v_alerts := v_alerts || jsonb_build_object('code','backlog','severity','critical','message', format('Backlog crítico: %s pendentes.', v_pending));
  ELSIF v_pending >= 100 THEN
    v_penalty := v_penalty + 15;
    v_alerts := v_alerts || jsonb_build_object('code','backlog','severity','warning','message', format('Backlog elevado: %s pendentes.', v_pending));
  END IF;

  IF v_oldest >= 30 THEN
    v_penalty := v_penalty + 30; v_has_critical := true;
    v_alerts := v_alerts || jsonb_build_object('code','aging_queue','severity','critical','message', format('Item mais antigo há %s min.', v_oldest));
  ELSIF v_oldest >= 10 THEN
    v_penalty := v_penalty + 10;
    v_alerts := v_alerts || jsonb_build_object('code','aging_queue','severity','warning','message', format('Item mais antigo há %s min.', v_oldest));
  END IF;

  IF v_stuck >= 25 THEN
    v_penalty := v_penalty + 30; v_has_critical := true;
    v_alerts := v_alerts || jsonb_build_object('code','stuck_items','severity','critical','message', format('%s itens presos em processamento.', v_stuck));
  ELSIF v_stuck > 0 THEN
    v_penalty := v_penalty + 12;
    v_alerts := v_alerts || jsonb_build_object('code','stuck_items','severity','warning','message', format('%s itens presos em processamento.', v_stuck));
  END IF;

  IF v_total > 0 THEN
    IF v_failure_rate >= 0.25 THEN
      v_penalty := v_penalty + 35; v_has_critical := true;
      v_alerts := v_alerts || jsonb_build_object('code','failure_rate','severity','critical','message', format('Taxa de falha em %s%%.', round(v_failure_rate * 100, 1)));
    ELSIF v_failure_rate >= 0.10 THEN
      v_penalty := v_penalty + 12;
      v_alerts := v_alerts || jsonb_build_object('code','failure_rate','severity','warning','message', format('Taxa de falha em %s%%.', round(v_failure_rate * 100, 1)));
    END IF;
  END IF;

  IF v_pending + v_processing > 0 THEN
    IF v_idle IS NULL OR v_idle >= 15 THEN
      v_penalty := v_penalty + 35; v_has_critical := true;
      v_alerts := v_alerts || jsonb_build_object('code','stale_dispatcher','severity','critical','message','Despachante sem execuções recentes com fila acumulada.');
    ELSIF v_idle >= 5 THEN
      v_penalty := v_penalty + 12;
      v_alerts := v_alerts || jsonb_build_object('code','stale_dispatcher','severity','warning','message', format('Último despacho há %s min.', v_idle));
    END IF;
  END IF;

  v_score := GREATEST(0, LEAST(100, 100 - v_penalty));
  IF v_has_critical THEN v_score := LEAST(v_score, 60); END IF;
  v_severity := CASE WHEN v_has_critical THEN 'critical'
                     WHEN jsonb_array_length(v_alerts) > 0 THEN 'warning'
                     ELSE 'ok' END;

  INSERT INTO public.push_outbox_health_snapshots
    (score, severity, pending, processing, stuck, sent, failed, skipped, oldest_pending_minutes, minutes_since_last_dispatch, alerts)
  VALUES
    (v_score, v_severity, v_pending, v_processing, v_stuck, v_sent, v_failed, v_skipped, v_oldest, v_idle, v_alerts)
  RETURNING id INTO v_id;

  -- Alerta de segurança com deduplicação horária (evita flood do pg_cron)
  IF v_score < 60 AND NOT EXISTS (
    SELECT 1 FROM public.security_alerts
    WHERE alert_type = 'push_queue_degraded'
      AND is_resolved = false
      AND created_at > now() - interval '1 hour'
  ) THEN
    INSERT INTO public.security_alerts (alert_type, severity, title, description, metadata)
    VALUES (
      'push_queue_degraded',
      CASE WHEN v_severity = 'critical' THEN 'high' ELSE 'medium' END,
      'Fila de notificações push degradada',
      format('Score %s/100 — %s pendentes, %s presos, %s falhas em 24h.', v_score, v_pending, v_stuck, v_failed),
      jsonb_build_object('snapshot_id', v_id, 'score', v_score, 'alerts', v_alerts)
    );
  END IF;

  -- Retenção: 30 dias de série histórica
  DELETE FROM public.push_outbox_health_snapshots WHERE created_at < now() - interval '30 days';

  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.unblock_board_players(p_max_hours integer DEFAULT 48, p_trail_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(trail_id uuid, trail_title text, user_id uuid, display_name text, "position" integer, blocked_hours numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_hours integer := GREATEST(1, LEAST(COALESCE(p_max_hours, 48), 720));
  v_rec record;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem executar o desbloqueio';
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS _unblocked_board_players (
    state_id uuid,
    trail_id uuid,
    trail_title text,
    user_id uuid,
    display_name text,
    "position" integer,
    blocked_hours numeric,
    challenge_id uuid
  ) ON COMMIT DROP;
  DELETE FROM _unblocked_board_players;

  INSERT INTO _unblocked_board_players
  SELECT s.id,
         s.trail_id,
         t.title,
         s.user_id,
         COALESCE(p.display_name, 'Colaborador'),
         s.position,
         ROUND((EXTRACT(EPOCH FROM (now() - s.blocked_at)) / 3600.0)::numeric, 1),
         s.blocked_challenge_id
    FROM public.board_player_states s
    LEFT JOIN public.board_trails t ON t.id = s.trail_id
    LEFT JOIN public.profiles p ON p.id = s.user_id
   WHERE s.blocked_challenge_id IS NOT NULL
     AND s.blocked_at IS NOT NULL
     AND s.blocked_at < now() - make_interval(hours => v_hours)
     AND (p_trail_id IS NULL OR s.trail_id = p_trail_id)
     FOR UPDATE OF s SKIP LOCKED;

  UPDATE public.board_player_states s
     SET blocked_challenge_id = NULL,
         challenge_attempts = 0,
         updated_at = now()
   WHERE s.id IN (SELECT u.state_id FROM _unblocked_board_players u);

  -- Trilha auditável: roll = 0 marca evento de sistema; posição não muda.
  INSERT INTO public.board_moves (
    trail_id, user_id, move_index, dedupe_key, roll,
    from_position, landed_position, final_position,
    tile_type, coins_delta, xp_delta, challenge_correct
  )
  SELECT u.trail_id,
         u.user_id,
         COALESCE((SELECT MAX(m.move_index) + 1
                     FROM public.board_moves m
                    WHERE m.trail_id = u.trail_id AND m.user_id = u.user_id), 0),
         'board-auto-unblock:' || u.trail_id || ':' || u.user_id || ':'
           || u.challenge_id || ':' || to_char(now(), 'YYYYMMDD'),
         0,
         u.position, u.position, u.position,
         'challenge', 0, 0, false
    FROM _unblocked_board_players u
  ON CONFLICT (dedupe_key) DO NOTHING;

  FOR v_rec IN SELECT * FROM _unblocked_board_players LOOP
    BEGIN
      PERFORM public.enqueue_push(
        v_rec.user_id,
        'board_unblocked',
        'Desafio liberado',
        'Você ficou parado no desafio da trilha "'
          || COALESCE(v_rec.trail_title, 'Tabuleiro')
          || '" e foi liberado. Volte para continuar avançando!',
        'board-unblock-push:' || v_rec.trail_id || ':' || v_rec.user_id || ':'
          || v_rec.challenge_id || ':' || to_char(now(), 'YYYYMMDD'),
        '/tabuleiro',
        jsonb_build_object('trail_id', v_rec.trail_id, 'position', v_rec.position)
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Falha ao notificar desbloqueio (user %): %', v_rec.user_id, SQLERRM;
    END;
  END LOOP;

  RETURN QUERY
  SELECT u.trail_id, u.trail_title, u.user_id, u.display_name, u.position, u.blocked_hours
    FROM _unblocked_board_players u;
END;
$function$;
