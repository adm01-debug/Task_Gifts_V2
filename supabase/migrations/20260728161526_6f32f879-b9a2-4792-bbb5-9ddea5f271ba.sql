CREATE OR REPLACE FUNCTION public.save_sequence_procedure(
  p_procedure_id uuid,
  p_title text,
  p_description text,
  p_department_id uuid,
  p_is_active boolean,
  p_steps jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
  v_title text := btrim(coalesce(p_title, ''));
  v_desc text := nullif(btrim(coalesce(p_description, '')), '');
  v_count int;
  v_inserted int := 0;
  v_updated int := 0;
  v_deleted int := 0;
  v_step jsonb;
  v_label text;
  v_hint text;
  v_step_id uuid;
  v_pos int := 0;
  v_keep uuid[] := ARRAY[]::uuid[];
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;
  IF NOT has_role(v_uid, 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'forbidden');
  END IF;

  IF v_title = '' OR char_length(v_title) > 120 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_title');
  END IF;
  IF v_desc IS NOT NULL AND char_length(v_desc) > 400 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_description');
  END IF;
  IF p_steps IS NULL OR jsonb_typeof(p_steps) <> 'array' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_steps');
  END IF;

  SELECT count(*) INTO v_count FROM jsonb_array_elements(p_steps);
  IF v_count < 3 OR v_count > 20 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_step_count');
  END IF;

  -- Validação prévia: rótulos e duplicidade (case-insensitive).
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_steps) s
    WHERE btrim(coalesce(s->>'label', '')) = ''
       OR char_length(btrim(s->>'label')) > 160
  ) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_label');
  END IF;

  IF (
    SELECT count(DISTINCT lower(btrim(s->>'label'))) FROM jsonb_array_elements(p_steps) s
  ) <> v_count THEN
    RETURN jsonb_build_object('success', false, 'reason', 'duplicate_label');
  END IF;

  IF p_department_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM departments d WHERE d.id = p_department_id) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_department');
  END IF;

  IF p_procedure_id IS NULL THEN
    INSERT INTO sequence_procedures (title, description, department_id, is_active, created_by)
    VALUES (v_title, v_desc, p_department_id, coalesce(p_is_active, true), v_uid)
    RETURNING id INTO v_id;
  ELSE
    UPDATE sequence_procedures
       SET title = v_title,
           description = v_desc,
           department_id = p_department_id,
           is_active = coalesce(p_is_active, true),
           updated_at = now()
     WHERE id = p_procedure_id
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'reason', 'not_found');
    END IF;
  END IF;

  -- A unique (procedure_id, position) é DEFERRABLE: dentro desta transação
  -- podemos reordenar livremente e a checagem ocorre só no commit.
  SET CONSTRAINTS ALL DEFERRED;

  FOR v_step IN SELECT * FROM jsonb_array_elements(p_steps)
  LOOP
    v_pos := v_pos + 1;
    v_label := btrim(v_step->>'label');
    v_hint := nullif(btrim(coalesce(v_step->>'hint', '')), '');
    BEGIN
      v_step_id := nullif(v_step->>'id', '')::uuid;
    EXCEPTION WHEN others THEN
      v_step_id := NULL;
    END;

    IF v_hint IS NOT NULL AND char_length(v_hint) > 240 THEN
      RAISE EXCEPTION 'hint_too_long';
    END IF;

    IF v_step_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM sequence_steps st WHERE st.id = v_step_id AND st.procedure_id = v_id
    ) THEN
      UPDATE sequence_steps
         SET label = v_label, hint = v_hint, position = v_pos, updated_at = now()
       WHERE id = v_step_id;
      v_updated := v_updated + 1;
      v_keep := array_append(v_keep, v_step_id);
    ELSE
      INSERT INTO sequence_steps (procedure_id, label, hint, position)
      VALUES (v_id, v_label, v_hint, v_pos)
      RETURNING id INTO v_step_id;
      v_inserted := v_inserted + 1;
      v_keep := array_append(v_keep, v_step_id);
    END IF;
  END LOOP;

  WITH removed AS (
    DELETE FROM sequence_steps
     WHERE procedure_id = v_id
       AND NOT (id = ANY (v_keep))
    RETURNING 1
  )
  SELECT count(*) INTO v_deleted FROM removed;

  RETURN jsonb_build_object(
    'success', true,
    'procedure_id', v_id,
    'inserted', v_inserted,
    'updated', v_updated,
    'deleted', v_deleted
  );
END;
$$;

REVOKE ALL ON FUNCTION public.save_sequence_procedure(uuid, text, text, uuid, boolean, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_sequence_procedure(uuid, text, text, uuid, boolean, jsonb) TO authenticated;