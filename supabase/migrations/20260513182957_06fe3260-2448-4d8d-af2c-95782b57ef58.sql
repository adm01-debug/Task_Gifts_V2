CREATE OR REPLACE FUNCTION public.increment_announcement_views(announcement_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.announcements
  SET view_count = view_count + 1
  WHERE id = announcement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;