-- Enable realtime for password_reset_requests table
ALTER TABLE public.password_reset_requests REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.password_reset_requests;