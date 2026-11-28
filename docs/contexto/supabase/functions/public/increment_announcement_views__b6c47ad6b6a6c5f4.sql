CREATE OR REPLACE FUNCTION public.increment_announcement_views(announcement_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.announcements
  SET view_count = view_count + 1
  WHERE id = announcement_id;
END;
$function$
