CREATE OR REPLACE FUNCTION public.card_pack_notify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_reason TEXT; v_cards TEXT; v_size INTEGER := GREATEST(1, LEAST(COALESCE(NEW.size, 1), 20));
BEGIN
  v_reason := CASE NEW.source WHEN 'task' THEN 'por entregar sua tarefa no prazo' WHEN 'training' THEN 'por concluir uma trilha de aprendizagem' WHEN 'streak' THEN 'pela sua sequência de presença pontual' WHEN 'quest' THEN 'por completar uma missão' WHEN 'campaign' THEN 'pela sua participação na campanha' WHEN 'manual' THEN 'como reconhecimento da liderança' ELSE NULL END;
  IF v_reason IS NULL THEN RETURN NEW; END IF;
  v_cards := CASE WHEN v_size = 1 THEN '1 carta' ELSE v_size::text || ' cartas' END;
  PERFORM public.enqueue_push(NEW.user_id, 'card_pack', 'Novo pacote de cartas!', 'Você recebeu um pacote com ' || v_cards || ' ' || v_reason || '. Abra o álbum para revelar.', 'card_pack:' || NEW.id::text, '/album', jsonb_build_object('pack_id', NEW.id, 'source', NEW.source, 'size', v_size));
  RETURN NEW;
END; $function$
