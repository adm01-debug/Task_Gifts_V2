
-- Drop existing constraints if they exist (to recreate them properly)
ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_author_id_fkey;
ALTER TABLE public.celebrations DROP CONSTRAINT IF EXISTS celebrations_user_id_fkey;
ALTER TABLE public.user_leagues DROP CONSTRAINT IF EXISTS user_leagues_user_id_fkey;

-- Add foreign key constraints
ALTER TABLE public.announcements 
ADD CONSTRAINT announcements_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.celebrations 
ADD CONSTRAINT celebrations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_leagues 
ADD CONSTRAINT user_leagues_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
