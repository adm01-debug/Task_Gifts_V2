CREATE OR REPLACE FUNCTION public.update_certification_statuses()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update expired certifications
  UPDATE user_certifications
  SET status = 'expired', updated_at = now()
  WHERE expires_at IS NOT NULL 
    AND expires_at < now() 
    AND status != 'expired' 
    AND status != 'revoked';
  
  -- Update expiring soon (within 30 days)
  UPDATE user_certifications
  SET status = 'expiring_soon', updated_at = now()
  WHERE expires_at IS NOT NULL 
    AND expires_at > now() 
    AND expires_at < now() + INTERVAL '30 days'
    AND status = 'active';
END;
$function$
