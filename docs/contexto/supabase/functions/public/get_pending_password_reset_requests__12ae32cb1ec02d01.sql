CREATE OR REPLACE FUNCTION public.get_pending_password_reset_requests()
 RETURNS TABLE(id uuid, user_id uuid, email text, display_name text, requested_at timestamp with time zone, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT r.id,
         r.user_id,
         u.email::text AS email,
         COALESCE(
           NULLIF(p.display_name, ''),
           NULLIF(split_part(coalesce(u.email, ''), '@', 1), '')
         ) AS display_name,
         r.requested_at,
         r.expires_at
  FROM public.password_reset_requests r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  LEFT JOIN auth.users u ON u.id = r.user_id
  WHERE r.status = 'pending'
    AND (
      has_role(v_uid, 'admin'::app_role)
      OR EXISTS (
        SELECT 1
        FROM team_members tm1
        JOIN team_members tm2 ON tm1.department_id = tm2.department_id
        WHERE tm1.user_id = v_uid
          AND tm1.is_manager = true
          AND tm2.user_id = r.user_id
      )
    )
  ORDER BY r.requested_at ASC;
END;
$function$
