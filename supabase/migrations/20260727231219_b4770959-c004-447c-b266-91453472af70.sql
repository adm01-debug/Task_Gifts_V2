-- Reforca as invariantes de configuracao das Guerras de Departamentos.
-- Motivacao: a criacao de uma guerra e um ato economico. O front valida e
-- projeta o custo, mas o banco precisa ser a ultima linha de defesa contra
-- payloads montados manualmente contra a API.

ALTER TABLE public.department_wars
  ALTER COLUMN created_by SET DEFAULT auth.uid();

CREATE OR REPLACE FUNCTION public.validate_department_war()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_share       jsonb;
  v_share_num   numeric;
  v_duration    interval;
BEGIN
  -- 1) Titulo utilizavel
  NEW.title := btrim(coalesce(NEW.title, ''));
  IF length(NEW.title) < 3 THEN
    RAISE EXCEPTION 'O titulo da guerra deve ter ao menos 3 caracteres';
  END IF;
  IF length(NEW.title) > 120 THEN
    RAISE EXCEPTION 'O titulo da guerra deve ter no maximo 120 caracteres';
  END IF;

  -- 2) Janela temporal sana
  IF NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'O termino da guerra deve ser posterior ao inicio';
  END IF;
  v_duration := NEW.ends_at - NEW.starts_at;
  IF v_duration < interval '1 hour' THEN
    RAISE EXCEPTION 'A guerra precisa durar ao menos 1 hora';
  END IF;
  IF v_duration > interval '365 days' THEN
    RAISE EXCEPTION 'A guerra nao pode durar mais de 365 dias';
  END IF;

  -- 3) Fatias de premiacao: array nao vazio de numeros entre 0 e 1
  IF jsonb_typeof(NEW.placement_shares) <> 'array'
     OR jsonb_array_length(NEW.placement_shares) = 0 THEN
    RAISE EXCEPTION 'placement_shares deve ser um array nao vazio';
  END IF;
  IF jsonb_array_length(NEW.placement_shares) > 10 THEN
    RAISE EXCEPTION 'placement_shares suporta no maximo 10 colocacoes';
  END IF;
  FOR v_share IN SELECT jsonb_array_elements(NEW.placement_shares) LOOP
    IF jsonb_typeof(v_share) <> 'number' THEN
      RAISE EXCEPTION 'placement_shares deve conter apenas numeros';
    END IF;
    v_share_num := v_share::text::numeric;
    IF v_share_num < 0 OR v_share_num > 1 THEN
      RAISE EXCEPTION 'Cada fatia de placement_shares deve estar entre 0 e 1';
    END IF;
  END LOOP;

  -- 4) Teto absoluto de emissao economica por guerra
  IF NEW.coins_pool > 1000000 THEN
    RAISE EXCEPTION 'O pool de moedas nao pode exceder 1.000.000';
  END IF;
  IF NEW.xp_pool > 1000000 THEN
    RAISE EXCEPTION 'O pool de XP nao pode exceder 1.000.000';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- 5) Guerra ja paga e imutavel na parte economica/estrutural
    IF OLD.settled_at IS NOT NULL AND (
         NEW.coins_pool           IS DISTINCT FROM OLD.coins_pool
      OR NEW.xp_pool              IS DISTINCT FROM OLD.xp_pool
      OR NEW.placement_shares     IS DISTINCT FROM OLD.placement_shares
      OR NEW.per_member_coins_cap IS DISTINCT FROM OLD.per_member_coins_cap
      OR NEW.fairness_alpha       IS DISTINCT FROM OLD.fairness_alpha
      OR NEW.per_user_cap         IS DISTINCT FROM OLD.per_user_cap
      OR NEW.participation_bonus  IS DISTINCT FROM OLD.participation_bonus
      OR NEW.starts_at            IS DISTINCT FROM OLD.starts_at
      OR NEW.ends_at              IS DISTINCT FROM OLD.ends_at
      OR NEW.status               IS DISTINCT FROM OLD.status
    ) THEN
      RAISE EXCEPTION 'A guerra ja foi encerrada e paga: configuracao imutavel';
    END IF;

    -- 6) Transicoes de status permitidas (sem retroceder)
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NOT (
           (OLD.status = 'draft'   AND NEW.status IN ('running', 'cancelled'))
        OR (OLD.status = 'running' AND NEW.status IN ('finished', 'cancelled'))
      ) THEN
        RAISE EXCEPTION 'Transicao de status invalida: % -> %', OLD.status, NEW.status;
      END IF;
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

CREATE INDEX IF NOT EXISTS idx_department_wars_status_ends_at
  ON public.department_wars (status, ends_at DESC);