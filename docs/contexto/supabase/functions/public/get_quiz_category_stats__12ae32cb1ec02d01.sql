CREATE OR REPLACE FUNCTION public.get_quiz_category_stats()
 RETURNS TABLE(category text, total_answers bigint, correct_answers bigint, accuracy_rate numeric, avg_time_ms numeric, question_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public._require_admin();
  RETURN QUERY
  SELECT
    COALESCE(qq.category, 'Sem categoria') as category,
    COUNT(qa.id) as total_answers,
    COUNT(qa.id) FILTER (WHERE qa.is_correct = true) as correct_answers,
    ROUND(
      (COUNT(qa.id) FILTER (WHERE qa.is_correct = true)::NUMERIC / NULLIF(COUNT(qa.id), 0)) * 100, 1
    ) as accuracy_rate,
    ROUND(AVG(qa.time_spent_ms), 0) as avg_time_ms,
    COUNT(DISTINCT qq.id) as question_count
  FROM quiz_questions qq
  LEFT JOIN quiz_answers qa ON qa.question_id = qq.id
  WHERE qq.is_active = true
  GROUP BY qq.category
  ORDER BY total_answers DESC;
END;
$function$
