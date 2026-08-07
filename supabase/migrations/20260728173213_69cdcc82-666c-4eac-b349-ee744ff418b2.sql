CREATE OR REPLACE FUNCTION public.save_board_trail(
  p_trail_id uuid,
  p_title text,
  p_description text,
  p_department_id uuid,
  p_status text,
  p_max_moves_per_day integer,
  p_tiles jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trail_id uuid;
  v_count integer;
  v_tile jsonb;
  v_index integer := 0;
  v_starts integer := 0;
  v_finishes integer := 0;
  v_type text;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'manager'::app_role)) THEN
    RAISE EXCEPTION 'Permissao negada' USING ERRCODE = '42501';
  END IF;

  IF coalesce(btrim(p_title), '') = '' THEN
    RAISE EXCEPTION 'Titulo obrigatorio' USING ERRCODE = '22023';
  END IF;

  IF p_status NOT IN ('draft', 'active', 'archived') THEN
    RAISE EXCEPTION 'Status invalido' USING ERRCODE = '22023';
  END IF;

  IF p_max_moves_per_day IS NULL OR p_max_moves_per_day < 1 OR p_max_moves_per_day > 20 THEN
    RAISE EXCEPTION 'Jogadas por dia devem ficar entre 1 e 20' USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_tiles) <> 'array' THEN
    RAISE EXCEPTION 'Tabuleiro invalido' USING ERRCODE = '22023';
  END IF;

  v_count := jsonb_array_length(p_tiles);
  IF v_count < 5 OR v_count > 100 THEN
    RAISE EXCEPTION 'O tabuleiro precisa ter entre 5 e 100 casas' USING ERRCODE = '22023';
  END IF;

  -- Valida o tabuleiro inteiro antes de qualquer escrita.
  FOR v_tile IN SELECT * FROM jsonb_array_elements(p_tiles) LOOP
    v_type := v_tile->>'tile_type';

    IF v_type NOT IN ('start','bonus','penalty','challenge','neutral','checkpoint','finish') THEN
      RAISE EXCEPTION 'Tipo de casa invalido: %', v_type USING ERRCODE = '22023';
    END IF;

    IF v_type = 'start' THEN
      v_starts := v_starts + 1;
      IF v_index <> 0 THEN
        RAISE EXCEPTION 'A casa de Partida deve ser a primeira' USING ERRCODE = '22023';
      END IF;
    END IF;

    IF v_type = 'finish' THEN
      v_finishes := v_finishes + 1;
      IF v_index <> v_count - 1 THEN
        RAISE EXCEPTION 'A casa de Chegada deve ser a ultima' USING ERRCODE = '22023';
      END IF;
    END IF;

    IF v_type = 'challenge' AND coalesce(btrim(v_tile->>'challenge_id'), '') = '' THEN
      RAISE EXCEPTION 'Casa de Desafio exige desafio vinculado' USING ERRCODE = '22023';
    END IF;

    IF coalesce((v_tile->>'coins')::integer, 0) < 0
       OR coalesce((v_tile->>'coins')::integer, 0) > 500
       OR coalesce((v_tile->>'xp')::integer, 0) < 0
       OR coalesce((v_tile->>'xp')::integer, 0) > 800 THEN
      RAISE EXCEPTION 'Moedas/XP fora dos limites permitidos' USING ERRCODE = '22023';
    END IF;

    IF coalesce((v_tile->>'move_by')::integer, 0) <> 0 THEN
      IF v_index + (v_tile->>'move_by')::integer < 0
         OR v_index + (v_tile->>'move_by')::integer > v_count - 1 THEN
        RAISE EXCEPTION 'Deslocamento aponta para fora do tabuleiro' USING ERRCODE = '22023';
      END IF;
    END IF;

    v_index := v_index + 1;
  END LOOP;

  IF v_starts <> 1 THEN
    RAISE EXCEPTION 'A trilha deve ter exatamente uma casa de Partida' USING ERRCODE = '22023';
  END IF;
  IF v_finishes <> 1 THEN
    RAISE EXCEPTION 'A trilha deve ter exatamente uma casa de Chegada' USING ERRCODE = '22023';
  END IF;

  IF p_trail_id IS NULL THEN
    INSERT INTO public.board_trails (title, description, department_id, status, max_moves_per_day)
    VALUES (btrim(p_title), nullif(btrim(coalesce(p_description, '')), ''), p_department_id,
            p_status, p_max_moves_per_day)
    RETURNING id INTO v_trail_id;
  ELSE
    UPDATE public.board_trails
       SET title = btrim(p_title),
           description = nullif(btrim(coalesce(p_description, '')), ''),
           department_id = p_department_id,
           status = p_status,
           max_moves_per_day = p_max_moves_per_day,
           updated_at = now()
     WHERE id = p_trail_id
    RETURNING id INTO v_trail_id;

    IF v_trail_id IS NULL THEN
      RAISE EXCEPTION 'Trilha nao encontrada' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  -- Substituicao atomica do tabuleiro (evita conflito de posicao ao reordenar).
  DELETE FROM public.board_tiles WHERE trail_id = v_trail_id;

  INSERT INTO public.board_tiles (trail_id, position, tile_type, label, coins, xp, move_by, challenge_id)
  SELECT v_trail_id,
         (ord - 1)::integer,
         t->>'tile_type',
         coalesce(nullif(btrim(coalesce(t->>'label', '')), ''), 'Casa ' || (ord - 1)),
         nullif((t->>'coins')::integer, 0),
         nullif((t->>'xp')::integer, 0),
         nullif((t->>'move_by')::integer, 0),
         nullif(btrim(coalesce(t->>'challenge_id', '')), '')
    FROM jsonb_array_elements(p_tiles) WITH ORDINALITY AS a(t, ord);

  RETURN v_trail_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_board_trail(uuid, text, text, uuid, text, integer, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_board_trail(uuid, text, text, uuid, text, integer, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_board_trail(p_trail_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'manager'::app_role)) THEN
    RAISE EXCEPTION 'Permissao negada' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.board_trails WHERE id = p_trail_id;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_board_trail(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_board_trail(uuid) TO authenticated;