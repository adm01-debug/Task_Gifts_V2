-- ============================================
-- Paridade prod x repositorio: 12 triggers e 6 funcoes que a producao ficou devendo
-- ============================================
--
-- Medicao desta rodada (comparacao objeto a objeto, prod x rebuild do repositorio):
--   * 614 objetos comparados: 549 policies, 796 indices, 915 constraints, 284 funcoes, 134 triggers.
--   * 12 triggers existem nos dois lados com a MESMA funcao, mas a producao dispara em
--     mais eventos do que o repositorio: faltam as colunas na clausula (OF ...). O gatilho
--     dispara em qualquer UPDATE e a funcao se defende lendo as colunas de novo -
--     redundancia, nao perda; alinhar evita trabalho inutil a cada gravacao.
--   * 1 delas e o inverso (auditoria de wager_integrity_reviews): a producao nao audita
--     INSERT, o repositorio sim.
--   * 4 funcoes estao sem acento/emoji na producao (titulo/mensagem de push e mensagem
--     de erro que o usuario ve): award_campaign_team_split, revert_campaign_team_split,
--     claim_card_set_reward e review_purchase. O texto do repositorio e o correto.
--   * 2 funcoes de trigger de saved_filters ficaram sem SET search_path na producao.
--
-- Como o definidor e o repositorio (a reconstrucao e a referencia), as instrucoes abaixo
-- reproduzem exatamente o estado que o rebuild produz. Idempotente: DROP antes do CREATE,
-- CREATE OR REPLACE nas funcoes.

DROP TRIGGER IF EXISTS trg_boss_phase_alert ON public.boss_battles;
CREATE TRIGGER trg_boss_phase_alert AFTER UPDATE OF current_hp ON public.boss_battles FOR EACH ROW EXECUTE FUNCTION public.boss_phase_alert_hook();

DROP TRIGGER IF EXISTS trg_war_hook_task_scores ON public.task_scores;
CREATE TRIGGER trg_war_hook_task_scores AFTER INSERT OR UPDATE OF status, completed_at ON public.task_scores FOR EACH ROW EXECUTE FUNCTION public.war_hook_task_scores();

DROP TRIGGER IF EXISTS trg_card_pack_task_scores ON public.task_scores;
CREATE TRIGGER trg_card_pack_task_scores AFTER INSERT OR UPDATE OF status, is_late, rework_count ON public.task_scores FOR EACH ROW EXECUTE FUNCTION public.card_pack_hook_task_scores();

DROP TRIGGER IF EXISTS trg_war_hook_attendance ON public.attendance_records;
CREATE TRIGGER trg_war_hook_attendance AFTER INSERT OR UPDATE OF is_punctual, check_in ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.war_hook_attendance();

DROP TRIGGER IF EXISTS trg_war_hook_module_progress ON public.module_progress;
CREATE TRIGGER trg_war_hook_module_progress AFTER INSERT OR UPDATE OF completed_at ON public.module_progress FOR EACH ROW EXECUTE FUNCTION public.war_hook_module_progress();

DROP TRIGGER IF EXISTS trg_sync_board_blocked_at ON public.board_player_states;
CREATE TRIGGER trg_sync_board_blocked_at BEFORE INSERT OR UPDATE OF blocked_challenge_id ON public.board_player_states FOR EACH ROW EXECUTE FUNCTION public.sync_board_blocked_at();

DROP TRIGGER IF EXISTS trg_log_prediction_settlement ON public.prediction_markets;
CREATE TRIGGER trg_log_prediction_settlement AFTER UPDATE OF status ON public.prediction_markets FOR EACH ROW EXECUTE FUNCTION public.log_prediction_settlement();

DROP TRIGGER IF EXISTS trg_war_hook_trail_enrollments ON public.trail_enrollments;
CREATE TRIGGER trg_war_hook_trail_enrollments AFTER INSERT OR UPDATE OF completed_at ON public.trail_enrollments FOR EACH ROW EXECUTE FUNCTION public.war_hook_trail_enrollments();

DROP TRIGGER IF EXISTS trg_card_pack_trail_enrollments ON public.trail_enrollments;
CREATE TRIGGER trg_card_pack_trail_enrollments AFTER INSERT OR UPDATE OF completed_at ON public.trail_enrollments FOR EACH ROW EXECUTE FUNCTION public.card_pack_hook_trail_enrollments();

DROP TRIGGER IF EXISTS trg_card_pack_attendance_streaks ON public.attendance_streaks;
CREATE TRIGGER trg_card_pack_attendance_streaks AFTER INSERT OR UPDATE OF current_streak ON public.attendance_streaks FOR EACH ROW EXECUTE FUNCTION public.card_pack_hook_attendance_streaks();

DROP TRIGGER IF EXISTS trg_user_certifications_identity ON public.user_certifications;
CREATE TRIGGER trg_user_certifications_identity BEFORE INSERT OR UPDATE OF certificate_code, issued_at, renewed_at ON public.user_certifications FOR EACH ROW EXECUTE FUNCTION public.set_certificate_identity();

DROP TRIGGER IF EXISTS trg_log_wager_integrity_review_event ON public.wager_integrity_reviews;
CREATE TRIGGER trg_log_wager_integrity_review_event AFTER INSERT OR UPDATE ON public.wager_integrity_reviews FOR EACH ROW EXECUTE FUNCTION public.log_wager_integrity_review_event();

CREATE OR REPLACE FUNCTION public.ensure_single_default_filter()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.saved_filters
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND entity_type = NEW.entity_type
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_saved_filters_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.award_campaign_team_split(_campaign_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _rule JSONB;
  _mode TEXT;
  _pool_xp NUMERIC;
  _pool_coins NUMERIC;
  _team RECORD;
  _member RECORD;
  _teams_awarded INT := 0;
  _members_awarded INT := 0;
  _members_skipped INT := 0;
  _total_xp INT := 0;
  _total_coins INT := 0;
  _share NUMERIC;
  _xp INT;
  _coins INT;
  _batch_id UUID;
  _actor UUID := auth.uid();
  _eligible_teams INT := 0;
  _reason TEXT;
  _outcome TEXT;
  _failure TEXT;
  _profile_exists BOOLEAN;
BEGIN
  PERFORM public._require_manager_or_admin();

  PERFORM public.recalc_campaign_teams(_campaign_id);

  SELECT COALESCE(split_rule, '{}'::jsonb) INTO _rule
  FROM public.sales_campaigns WHERE id = _campaign_id;

  IF _rule IS NULL THEN
    RAISE EXCEPTION 'campaign_not_found' USING ERRCODE = 'P0002';
  END IF;

  _pool_xp := COALESCE((_rule->>'team_pool_xp')::NUMERIC, 0);
  _pool_coins := COALESCE((_rule->>'team_pool_coins')::NUMERIC, 0);
  _mode := COALESCE(_rule->>'team_share', 'proportional');

  INSERT INTO public.campaign_team_split_batches (
    campaign_id, executed_by, share_mode, pool_xp, pool_coins, status
  ) VALUES (
    _campaign_id, _actor, _mode, _pool_xp, _pool_coins, 'running'
  ) RETURNING id INTO _batch_id;

  IF _pool_xp <= 0 AND _pool_coins <= 0 THEN
    UPDATE public.campaign_team_split_batches
    SET status = 'skipped', reason = 'empty_pool'
    WHERE id = _batch_id;

    RETURN jsonb_build_object(
      'teams_awarded', 0, 'members_awarded', 0,
      'reason', 'empty_pool', 'batch_id', _batch_id
    );
  END IF;

  FOR _team IN
    SELECT * FROM public.campaign_teams
    WHERE campaign_id = _campaign_id
      AND awarded_at IS NULL
      AND target_team > 0
      AND progress >= target_team
    ORDER BY created_at
  LOOP
    _eligible_teams := _eligible_teams + 1;

    -- Equipe elegível sem membros alocados: registra o motivo para que o
    -- gestor perceba a lacuna de alocação antes de fechar a campanha.
    IF NOT EXISTS (SELECT 1 FROM public.campaign_team_members WHERE team_id = _team.id) THEN
      INSERT INTO public.campaign_team_split_entries (
        batch_id, campaign_id, team_id, team_name, user_id, user_identifier,
        member_progress, team_progress, team_target, share_percent,
        xp_allocated, coins_allocated, outcome, failure_reason
      ) VALUES (
        _batch_id, _campaign_id, _team.id, _team.name, NULL, NULL,
        0, _team.progress, _team.target_team, 0,
        0, 0, 'skipped', 'team_without_members'
      );
    END IF;

    FOR _member IN
      SELECT
        m.user_id,
        COALESCE(cp.progress, 0) AS progress,
        COALESCE(p.display_name, p.email, m.user_id::text) AS identifier,
        (p.id IS NOT NULL) AS has_profile
      FROM public.campaign_team_members m
      LEFT JOIN public.campaign_participants cp
        ON cp.campaign_id = _campaign_id AND cp.user_id = m.user_id
      LEFT JOIN public.profiles p ON p.id = m.user_id
      WHERE m.team_id = _team.id
      ORDER BY m.created_at
    LOOP
      IF _mode = 'equal' OR _team.progress <= 0 THEN
        _share := CASE WHEN _team.members_count > 0 THEN 1.0 / _team.members_count ELSE 0 END;
      ELSE
        _share := _member.progress / _team.progress;
      END IF;

      _xp := GREATEST(0, ROUND(_pool_xp * _share))::INT;
      _coins := GREATEST(0, ROUND(_pool_coins * _share))::INT;
      _profile_exists := COALESCE(_member.has_profile, false);
      _outcome := 'paid';
      _failure := NULL;

      IF NOT _profile_exists THEN
        _outcome := 'skipped';
        _failure := 'profile_not_found';
      ELSIF _xp = 0 AND _coins = 0 THEN
        _outcome := 'skipped';
        _failure := CASE
          WHEN _share = 0 AND _mode <> 'equal' AND _team.progress > 0 THEN 'zero_contribution'
          WHEN _team.members_count = 0 THEN 'members_count_zero'
          ELSE 'rounded_to_zero'
        END;
      END IF;

      IF _outcome = 'paid' THEN
        UPDATE public.profiles
        SET xp = COALESCE(xp, 0) + _xp,
            coins = COALESCE(coins, 0) + _coins
        WHERE id = _member.user_id;

        UPDATE public.campaign_participants
        SET xp_earned = COALESCE(xp_earned, 0) + _xp,
            coins_earned = COALESCE(coins_earned, 0) + _coins
        WHERE campaign_id = _campaign_id AND user_id = _member.user_id;

        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
          _member.user_id,
          'campaign_team_award',
          '🤝 Meta coletiva batida: ' || _team.name,
          'Sua parte do prêmio coletivo: +' || _xp || ' XP e +' || _coins || ' moedas.',
          jsonb_build_object(
            'campaign_id', _campaign_id, 'team_id', _team.id,
            'xp', _xp, 'coins', _coins, 'batch_id', _batch_id
          )
        );

        _members_awarded := _members_awarded + 1;
        _total_xp := _total_xp + _xp;
        _total_coins := _total_coins + _coins;
      ELSE
        _members_skipped := _members_skipped + 1;
      END IF;

      INSERT INTO public.campaign_team_split_entries (
        batch_id, campaign_id, team_id, team_name, user_id, user_identifier,
        member_progress, team_progress, team_target, share_percent,
        xp_allocated, coins_allocated, outcome, failure_reason
      ) VALUES (
        _batch_id, _campaign_id, _team.id, _team.name, _member.user_id, _member.identifier,
        _member.progress, _team.progress, _team.target_team, ROUND(_share * 100, 4),
        CASE WHEN _outcome = 'paid' THEN _xp ELSE 0 END,
        CASE WHEN _outcome = 'paid' THEN _coins ELSE 0 END,
        _outcome, _failure
      );
    END LOOP;

    UPDATE public.campaign_teams
    SET awarded_at = now(),
        xp_awarded = ROUND(_pool_xp)::INT,
        coins_awarded = ROUND(_pool_coins)::INT
    WHERE id = _team.id;

    _teams_awarded := _teams_awarded + 1;
  END LOOP;

  _reason := CASE
    WHEN _eligible_teams = 0 THEN 'no_eligible_teams'
    WHEN _members_awarded = 0 THEN 'no_members_paid'
    ELSE NULL
  END;

  UPDATE public.campaign_team_split_batches
  SET status = CASE WHEN _teams_awarded > 0 THEN 'completed' ELSE 'skipped' END,
      teams_awarded = _teams_awarded,
      members_awarded = _members_awarded,
      members_skipped = _members_skipped,
      total_xp_paid = _total_xp,
      total_coins_paid = _total_coins,
      reason = _reason
  WHERE id = _batch_id;

  RETURN jsonb_build_object(
    'teams_awarded', _teams_awarded,
    'members_awarded', _members_awarded,
    'members_skipped', _members_skipped,
    'total_xp_paid', _total_xp,
    'total_coins_paid', _total_coins,
    'reason', _reason,
    'batch_id', _batch_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.revert_campaign_team_split(_batch_id uuid, _reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _batch RECORD;
  _entry RECORD;
  _members INT := 0;
  _teams INT := 0;
  _xp_total INT := 0;
  _coins_total INT := 0;
  _actor UUID := auth.uid();
  _xp INT;
  _coins INT;
BEGIN
  PERFORM public._require_manager_or_admin();

  SELECT * INTO _batch
  FROM public.campaign_team_split_batches
  WHERE id = _batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('reverted', false, 'reason', 'batch_not_found');
  END IF;

  IF _batch.reverted_at IS NOT NULL OR _batch.status = 'reverted' THEN
    RETURN jsonb_build_object('reverted', false, 'reason', 'already_reverted');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.campaign_team_split_entries
    WHERE batch_id = _batch_id AND outcome = 'paid' AND user_id IS NOT NULL
  ) THEN
    RETURN jsonb_build_object('reverted', false, 'reason', 'nothing_to_revert');
  END IF;

  FOR _entry IN
    SELECT user_id,
           GREATEST(0, xp_allocated) AS xp_allocated,
           GREATEST(0, coins_allocated) AS coins_allocated
    FROM public.campaign_team_split_entries
    WHERE batch_id = _batch_id AND outcome = 'paid' AND user_id IS NOT NULL
    ORDER BY created_at
  LOOP
    _xp := _entry.xp_allocated;
    _coins := _entry.coins_allocated;

    IF _xp = 0 AND _coins = 0 THEN
      CONTINUE;
    END IF;

    UPDATE public.profiles
    SET xp = GREATEST(0, COALESCE(xp, 0) - _xp),
        coins = GREATEST(0, COALESCE(coins, 0) - _coins)
    WHERE id = _entry.user_id;

    UPDATE public.campaign_participants
    SET xp_earned = GREATEST(0, COALESCE(xp_earned, 0) - _xp),
        coins_earned = GREATEST(0, COALESCE(coins_earned, 0) - _coins)
    WHERE campaign_id = _batch.campaign_id AND user_id = _entry.user_id;

    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      _entry.user_id,
      'campaign_team_award_reverted',
      'Rateio coletivo revertido',
      'O prêmio coletivo de ' || _xp || ' XP e ' || _coins || ' moedas foi estornado por revisão da campanha.',
      jsonb_build_object(
        'campaign_id', _batch.campaign_id,
        'batch_id', _batch_id,
        'xp', _xp,
        'coins', _coins,
        'reason', _reason
      )
    );

    _members := _members + 1;
    _xp_total := _xp_total + _xp;
    _coins_total := _coins_total + _coins;
  END LOOP;

  WITH reset AS (
    UPDATE public.campaign_teams t
    SET awarded_at = NULL,
        xp_awarded = 0,
        coins_awarded = 0
    WHERE t.awarded_at IS NOT NULL
      AND t.id IN (
        SELECT DISTINCT team_id
        FROM public.campaign_team_split_entries
        WHERE batch_id = _batch_id AND team_id IS NOT NULL AND outcome = 'paid'
      )
    RETURNING 1
  )
  SELECT COUNT(*) INTO _teams FROM reset;

  UPDATE public.campaign_team_split_batches
  SET status = 'reverted',
      reverted_at = now(),
      reverted_by = _actor,
      reason = COALESCE(NULLIF(TRIM(COALESCE(_reason, '')), ''), reason)
  WHERE id = _batch_id;

  RETURN jsonb_build_object(
    'reverted', true,
    'members_reverted', _members,
    'teams_reset', _teams,
    'xp_reverted', _xp_total,
    'coins_reverted', _coins_total,
    'batch_id', _batch_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_card_set_reward(p_set_code text, p_milestone smallint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user        UUID := auth.uid();
  v_total       INTEGER;
  v_owned       INTEGER;
  v_value       INTEGER;
  v_coins       INTEGER;
  v_xp          INTEGER;
  v_dedupe      TEXT;
  v_existing    public.card_set_claims%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_milestone IS NULL OR p_milestone NOT IN (25, 50, 75, 100) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_milestone');
  END IF;

  IF p_set_code IS NULL OR length(trim(p_set_code)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unknown_set');
  END IF;

  v_dedupe := 'card_set:' || v_user::TEXT || ':' || p_set_code || ':' || p_milestone::TEXT;

  -- Trava por (usuário, conjunto): serializa duplo clique e retries paralelos.
  PERFORM pg_advisory_xact_lock(hashtext('card_set_claim'), hashtext(v_dedupe));

  SELECT * INTO v_existing
  FROM public.card_set_claims
  WHERE user_id = v_user AND set_code = p_set_code AND milestone = p_milestone;

  IF FOUND THEN
    -- Idempotente: devolve o mesmo resultado, sem creditar de novo.
    RETURN jsonb_build_object(
      'success', true,
      'replayed', true,
      'coins', v_existing.coins_awarded,
      'xp', v_existing.xp_awarded
    );
  END IF;

  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE uc.quantity > 0)::INTEGER,
    COALESCE(SUM(public._card_rarity_value(d.rarity)), 0)::INTEGER
  INTO v_total, v_owned, v_value
  FROM public.card_definitions d
  LEFT JOIN public.user_cards uc
    ON uc.card_id = d.id AND uc.user_id = v_user
  WHERE d.is_active AND d.set_code = p_set_code;

  IF v_total IS NULL OR v_total = 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'empty_set');
  END IF;

  IF v_owned * 100 < p_milestone * v_total THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_reached');
  END IF;

  SELECT amount INTO v_coins
  FROM public._card_set_milestone_split(v_value * 5)
  WHERE milestone = p_milestone;

  SELECT amount INTO v_xp
  FROM public._card_set_milestone_split(v_value * 3)
  WHERE milestone = p_milestone;

  v_coins := GREATEST(COALESCE(v_coins, 0), 0);
  v_xp    := GREATEST(COALESCE(v_xp, 0), 0);

  INSERT INTO public.card_set_claims
    (user_id, set_code, milestone, coins_awarded, xp_awarded, cards_owned, cards_total, dedupe_key)
  VALUES
    (v_user, p_set_code, p_milestone, v_coins, v_xp, v_owned, v_total, v_dedupe)
  ON CONFLICT (dedupe_key) DO NOTHING;

  IF NOT FOUND THEN
    -- Corrida vencida por outra transação: nada a creditar.
    RETURN jsonb_build_object('success', true, 'replayed', true, 'coins', 0, 'xp', 0);
  END IF;

  UPDATE public.profiles
     SET coins = coins + v_coins,
         xp    = xp + v_xp
   WHERE id = v_user;

  PERFORM public.enqueue_push(
    p_user_id   := v_user,
    p_type      := 'card_set_reward',
    p_title     := 'Marco de coleção conquistado!',
    p_message    := 'Você completou ' || p_milestone::TEXT || '% da coleção ' || p_set_code ||
                    ' e ganhou ' || v_coins::TEXT || ' moedas.',
    p_dedupe_key := v_dedupe,
    p_url        := '/album',
    p_data       := jsonb_build_object('set_code', p_set_code, 'milestone', p_milestone)
  );

  RETURN jsonb_build_object(
    'success', true,
    'replayed', false,
    'coins', v_coins,
    'xp', v_xp,
    'cards_owned', v_owned,
    'cards_total', v_total
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.review_purchase(p_purchase_id uuid, p_action text, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_purchase public.shop_purchases%ROWTYPE;
  v_new_status public.purchase_status;
  v_logged_action text := p_action;
  v_stock integer;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória';
  END IF;

  IF NOT (public.has_role(v_actor, 'admin'::app_role) OR public.has_role(v_actor, 'manager'::app_role)) THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;

  IF p_action NOT IN ('approve','reject','deliver','cancel') THEN
    RAISE EXCEPTION 'Ação inválida: %', p_action;
  END IF;

  SELECT * INTO v_purchase FROM public.shop_purchases WHERE id = p_purchase_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

  IF v_purchase.status IN ('delivered','cancelled') THEN
    RAISE EXCEPTION 'Pedido já finalizado (%)', v_purchase.status;
  END IF;

  IF p_action = 'approve' THEN
    IF v_purchase.status <> 'pending' THEN
      RAISE EXCEPTION 'Somente pedidos pendentes podem ser aprovados';
    END IF;

    IF v_purchase.requires_dual_approval AND v_purchase.first_approver_id IS NULL THEN
      UPDATE public.shop_purchases
        SET first_approver_id = v_actor
        WHERE id = p_purchase_id;

      INSERT INTO public.purchase_approvals (purchase_id, actor_id, action, from_status, to_status, reason, risk_snapshot)
      VALUES (p_purchase_id, v_actor, 'first_approval', 'pending', 'pending', p_reason,
              jsonb_build_object('risk_score', v_purchase.risk_score, 'risk_level', v_purchase.risk_level));

      RETURN jsonb_build_object('status', 'pending', 'awaiting_second_approval', true);
    END IF;

    IF v_purchase.requires_dual_approval AND v_purchase.first_approver_id = v_actor THEN
      RAISE EXCEPTION 'Pedido de risco elevado exige um segundo aprovador distinto';
    END IF;

    v_new_status := 'approved';

  ELSIF p_action = 'deliver' THEN
    IF v_purchase.status <> 'approved' THEN
      RAISE EXCEPTION 'Somente pedidos aprovados podem ser entregues';
    END IF;
    v_new_status := 'delivered';

  ELSE
    v_new_status := 'cancelled';

    UPDATE public.profiles
      SET coins = coins + v_purchase.total_coins
      WHERE id = v_purchase.user_id;

    SELECT stock INTO v_stock FROM public.shop_rewards WHERE id = v_purchase.reward_id;
    IF v_stock IS NOT NULL THEN
      UPDATE public.shop_rewards
        SET stock = stock + v_purchase.quantity
        WHERE id = v_purchase.reward_id;
    END IF;
  END IF;

  UPDATE public.shop_purchases
    SET status = v_new_status,
        processed_by = v_actor,
        processed_at = now(),
        notes = COALESCE(p_reason, notes)
    WHERE id = p_purchase_id;

  INSERT INTO public.purchase_approvals (purchase_id, actor_id, action, from_status, to_status, reason, risk_snapshot)
  VALUES (p_purchase_id, v_actor, v_logged_action, v_purchase.status, v_new_status, p_reason,
          jsonb_build_object('risk_score', v_purchase.risk_score, 'risk_level', v_purchase.risk_level));

  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    v_purchase.user_id,
    'achievement',
    CASE v_new_status
      WHEN 'approved' THEN '✅ Resgate aprovado'
      WHEN 'delivered' THEN '📦 Resgate entregue'
      ELSE '❌ Resgate cancelado'
    END,
    CASE v_new_status
      WHEN 'cancelled' THEN 'Seu resgate foi cancelado e as moedas foram devolvidas.'
      ELSE 'O status do seu resgate foi atualizado.'
    END,
    jsonb_build_object('purchase_id', p_purchase_id, 'status', v_new_status)
  );

  RETURN jsonb_build_object('status', v_new_status, 'awaiting_second_approval', false);
END;
$function$;

