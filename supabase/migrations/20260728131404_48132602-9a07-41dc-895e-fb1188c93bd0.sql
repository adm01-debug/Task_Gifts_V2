-- Enfileira alertas de travessia de fase do chefão para todos os contribuintes.
CREATE OR REPLACE FUNCTION public.boss_phase_alert_hook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total INTEGER := GREATEST(NEW.total_hp, 1);
  v_before NUMERIC;
  v_after NUMERIC;
  v_phase TEXT;
  v_phase_before TEXT;
  v_pct INTEGER;
  v_title TEXT;
  v_message TEXT;
  v_user UUID;
BEGIN
  IF NEW.current_hp >= OLD.current_hp THEN RETURN NEW; END IF;

  v_before := LEAST(GREATEST(OLD.current_hp, 0), v_total)::NUMERIC / v_total;
  v_after := LEAST(GREATEST(NEW.current_hp, 0), v_total)::NUMERIC / v_total;

  v_phase_before := CASE
    WHEN OLD.current_hp <= 0 THEN 'defeated'
    WHEN v_before > 0.66 THEN 'healthy'
    WHEN v_before > 0.33 THEN 'wounded'
    WHEN v_before > 0.10 THEN 'enraged'
    ELSE 'critical' END;

  v_phase := CASE
    WHEN NEW.current_hp <= 0 THEN 'defeated'
    WHEN v_after > 0.66 THEN 'healthy'
    WHEN v_after > 0.33 THEN 'wounded'
    WHEN v_after > 0.10 THEN 'enraged'
    ELSE 'critical' END;

  IF v_phase = v_phase_before OR v_phase = 'healthy' THEN RETURN NEW; END IF;

  v_pct := ROUND(v_after * 100)::INTEGER;

  SELECT
    CASE v_phase
      WHEN 'wounded' THEN 'Chefão ferido!'
      WHEN 'enraged' THEN 'Chefão enfurecido!'
      WHEN 'critical' THEN 'Chefão em estado crítico!'
      ELSE 'Chefão derrotado!' END,
    CASE v_phase
      WHEN 'wounded' THEN NEW.title || ' está com ' || v_pct || '% de vida. O time já tirou o primeiro terço — mantenha o ritmo.'
      WHEN 'enraged' THEN NEW.title || ' caiu para ' || v_pct || '% de vida. Cada entrega no prazo agora vale muito.'
      WHEN 'critical' THEN NEW.title || ' está com apenas ' || v_pct || '% de vida. Faltam poucos golpes para derrubar.'
      ELSE NEW.title || ' foi derrubado pelo time. As recompensas serão distribuídas por contribuição.' END
  INTO v_title, v_message;

  FOR v_user IN
    SELECT DISTINCT user_id FROM public.boss_battle_damage WHERE battle_id = NEW.id
  LOOP
    PERFORM public.enqueue_push(
      v_user,
      'boss_battle',
      v_title,
      v_message,
      'boss_phase:' || NEW.id::text || ':' || v_phase || ':' || v_user::text,
      '/chefao',
      jsonb_build_object('battle_id', NEW.id, 'phase', v_phase, 'hp_percent', v_pct)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_boss_phase_alert ON public.boss_battles;
CREATE TRIGGER trg_boss_phase_alert
AFTER UPDATE OF current_hp ON public.boss_battles
FOR EACH ROW EXECUTE FUNCTION public.boss_phase_alert_hook();