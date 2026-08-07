
-- Add foreign key constraint from announcements.author_id to profiles.id
ALTER TABLE public.announcements 
ADD CONSTRAINT announcements_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Add foreign key constraint from celebrations.user_id to profiles.id
ALTER TABLE public.celebrations 
ADD CONSTRAINT celebrations_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;
