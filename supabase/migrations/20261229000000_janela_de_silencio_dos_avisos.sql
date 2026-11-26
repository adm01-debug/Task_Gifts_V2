-- Janela de silencio dos avisos push -----------------------------------------
-- `notification_preferences.do_not_disturb_*` e `quiet_hours_*` existiam no
-- banco desde 2025-12-20 sem nenhum leitor: a fila `push_outbox` enviava de
-- madrugada e o aviso chegava fora de hora. Esta migration liga a janela ao
-- despachante (`push-outbox-dispatcher`).
--
-- Semantica:
--   * fonte canonica: `do_not_disturb_*` (default 22:00-08:00, desligada por
--     padrao); `quiet_hours_*` entra via COALESCE como nome legado;
--   * fuso fixo America/Sao_Paulo (mesma convencao das outras funcoes);
--   * janela que cruza a meia-noite (inicio > fim) e' suportada; inicio = fim
--     desliga a janela; `do_not_disturb_weekends = false` nao silencia sabado e
--     domingo (janela iniciada na sexta a noite ainda termina no sabado);
--   * adiar NAO consome tentativa: a linha sai de `pending` enquanto espera e
--     volta quando a janela fecha, entao nao dispara alerta de fila parada.
--
-- Idempotente de proposito: replay/reset reexecuta o arquivo inteiro.

-- 1. Estado novo da fila: 'deferred' + o instante em que a linha volta -------
ALTER TABLE public.push_outbox
  ADD COLUMN IF NOT EXISTS deferred_until TIMESTAMPTZ;

ALTER TABLE public.push_outbox DROP CONSTRAINT IF EXISTS push_outbox_status_check;
ALTER TABLE public.push_outbox
  ADD CONSTRAINT push_outbox_status_check
  CHECK (status IN ('pending','processing','deferred','sent','failed','skipped'));

COMMENT ON COLUMN public.push_outbox.deferred_until IS
  'Fim da janela de silencio do usuario (notification_preferences.do_not_disturb_*). Preenchido apenas com status = deferred; claim_push_outbox devolve a linha para pending quando vence.';

-- 2. Ate quando este usuario esta em silencio? -------------------------------
CREATE OR REPLACE FUNCTION public.push_quiet_hours_until(_user_id uuid)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_enabled boolean;
  v_start time;
  v_end time;
  v_weekends boolean;
  v_local timestamp;
  v_dow integer;
BEGIN
  SELECT COALESCE(p.do_not_disturb_enabled, false),
         COALESCE(p.do_not_disturb_start, p.quiet_hours_start),
         COALESCE(p.do_not_disturb_end, p.quiet_hours_end),
         COALESCE(p.do_not_disturb_weekends, true)
    INTO v_enabled, v_start, v_end, v_weekends
  FROM public.notification_preferences p
  WHERE p.user_id = _user_id;

  IF NOT FOUND
     OR NOT COALESCE(v_enabled, false)
     OR v_start IS NULL
     OR v_end IS NULL
     OR v_start = v_end THEN
    RETURN NULL;
  END IF;

  v_local := now() AT TIME ZONE 'America/Sao_Paulo';

  IF NOT v_weekends THEN
    v_dow := EXTRACT(ISODOW FROM v_local)::integer;
    IF v_dow >= 6 THEN
      RETURN NULL;
    END IF;
  END IF;

  IF v_start < v_end THEN
    -- Janela dentro do mesmo dia.
    IF v_local::time < v_start OR v_local::time >= v_end THEN
      RETURN NULL;
    END IF;
    RETURN (v_local::date + v_end) AT TIME ZONE 'America/Sao_Paulo';
  END IF;

  -- Janela cruzando a meia-noite (ex.: 22:00 -> 08:00).
  IF v_local::time >= v_start THEN
    RETURN ((v_local::date + 1) + v_end) AT TIME ZONE 'America/Sao_Paulo';
  END IF;

  IF v_local::time < v_end THEN
    RETURN (v_local::date + v_end) AT TIME ZONE 'America/Sao_Paulo';
  END IF;

  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.push_quiet_hours_until(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.push_quiet_hours_until(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.push_quiet_hours_until(uuid) TO service_role;

-- 3. claim_push_outbox: devolve quem ja venceu a janela ----------------------
-- Igual a versao vigente (20260728112223) com um bloco extra de reciclagem.
CREATE OR REPLACE FUNCTION public.claim_push_outbox(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  url TEXT,
  data JSONB,
  attempts INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
BEGIN
  -- Reciclagem: linhas presas em 'processing' voltam para a fila.
  UPDATE public.push_outbox
  SET status = 'pending'
  WHERE status = 'processing'
    AND updated_at < now() - interval '10 minutes';

  -- Janela de silencio: quem venceu volta para a fila (nao consome tentativa).
  -- `deferred_until` nulo tambem volta: linha adiada sem prazo ficaria presa.
  UPDATE public.push_outbox
  SET status = 'pending',
      deferred_until = NULL
  WHERE status = 'deferred'
    AND (deferred_until IS NULL OR deferred_until <= now());

  RETURN QUERY
  WITH claimed AS (
    SELECT o.id
    FROM public.push_outbox o
    WHERE o.status = 'pending'
    ORDER BY o.created_at
    LIMIT greatest(1, least(coalesce(p_limit, 100), 500))
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.push_outbox o
  SET status = 'processing'
  FROM claimed c
  WHERE o.id = c.id
  RETURNING o.id, o.user_id, o.type, o.title, o.message, o.url, o.data, o.attempts;
END;
$fn$;

REVOKE ALL ON FUNCTION public.claim_push_outbox(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_push_outbox(integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_push_outbox(integer) TO service_role;