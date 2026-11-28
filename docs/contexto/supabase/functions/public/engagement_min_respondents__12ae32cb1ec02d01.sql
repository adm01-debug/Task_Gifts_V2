CREATE OR REPLACE FUNCTION public.engagement_min_respondents()
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$ SELECT 5 $function$
