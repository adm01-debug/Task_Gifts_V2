CREATE OR REPLACE FUNCTION public.search_all(p_query text, p_limit integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_tsquery tsquery;
  v_result jsonb := '[]'::jsonb;
  v_profiles jsonb;
  v_achievements jsonb;
  v_announcements jsonb;
  v_departments jsonb;
BEGIN
  -- Sanitiza query para tsquery (português)
  v_tsquery := plainto_tsquery('portuguese', p_query);

  -- Busca em profiles
  SELECT jsonb_agg(jsonb_build_object(
    'type', 'profile', 'id', id,
    'display_name', display_name,
    'email', email,
    'rank', ts_rank(to_tsvector('portuguese', coalesce(display_name,'')), v_tsquery)
  )) INTO v_profiles
  FROM (
    SELECT id, display_name, email
    FROM public.profiles
    WHERE to_tsvector('portuguese', coalesce(display_name,'')) @@ v_tsquery
       OR display_name ILIKE '%' || p_query || '%'
    LIMIT p_limit
  ) t;

  -- Busca em achievements
  SELECT jsonb_agg(jsonb_build_object(
    'type', 'achievement', 'id', id, 'name', name, 'description', description
  )) INTO v_achievements
  FROM (
    SELECT id, name, description
    FROM public.achievements
    WHERE to_tsvector('portuguese', coalesce(name,'') || ' ' || coalesce(description,'')) @@ v_tsquery
       OR name ILIKE '%' || p_query || '%'
    LIMIT p_limit
  ) t;

  -- Busca em announcements
  SELECT jsonb_agg(jsonb_build_object(
    'type', 'announcement', 'id', id, 'title', title
  )) INTO v_announcements
  FROM (
    SELECT id, title
    FROM public.announcements
    WHERE to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(content,'')) @@ v_tsquery
       OR title ILIKE '%' || p_query || '%'
    LIMIT p_limit
  ) t;

  -- Busca em departments
  SELECT jsonb_agg(jsonb_build_object(
    'type', 'department', 'id', id, 'name', name
  )) INTO v_departments
  FROM (
    SELECT id, name
    FROM public.departments
    WHERE to_tsvector('portuguese', coalesce(name,'')) @@ v_tsquery
       OR name ILIKE '%' || p_query || '%'
    LIMIT p_limit
  ) t;

  RETURN jsonb_build_object(
    'query', p_query,
    'profiles', COALESCE(v_profiles, '[]'::jsonb),
    'achievements', COALESCE(v_achievements, '[]'::jsonb),
    'announcements', COALESCE(v_announcements, '[]'::jsonb),
    'departments', COALESCE(v_departments, '[]'::jsonb),
    'total', (
      jsonb_array_length(COALESCE(v_profiles,'[]'::jsonb)) +
      jsonb_array_length(COALESCE(v_achievements,'[]'::jsonb)) +
      jsonb_array_length(COALESCE(v_announcements,'[]'::jsonb)) +
      jsonb_array_length(COALESCE(v_departments,'[]'::jsonb))
    )
  );
END;
$function$
