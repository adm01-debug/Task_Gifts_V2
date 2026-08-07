
-- Add foreign key constraint from announcements.author_id to profiles.id (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'announcements_author_id_fkey' 
    AND table_name = 'announcements'
  ) THEN
    ALTER TABLE public.announcements 
    ADD CONSTRAINT announcements_author_id_fkey 
    FOREIGN KEY (author_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint from celebrations.user_id to profiles.id (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'celebrations_user_id_fkey' 
    AND table_name = 'celebrations'
  ) THEN
    ALTER TABLE public.celebrations 
    ADD CONSTRAINT celebrations_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint from user_leagues.user_id to profiles.id (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_leagues_user_id_fkey' 
    AND table_name = 'user_leagues'
  ) THEN
    ALTER TABLE public.user_leagues 
    ADD CONSTRAINT user_leagues_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;
  END IF;
END $$;
