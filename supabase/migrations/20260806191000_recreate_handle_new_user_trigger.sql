-- ============================================
-- Recreate handle_new_user() trigger on auth.users
-- ============================================
--
-- Why: the trigger declared in 20251212191618_... is missing from the deployed
-- database. As a result, every user that signed up before the migration was
-- applied landed in auth.users WITHOUT a corresponding public.profiles row.
-- Because public.user_leagues.user_id has a FK to public.profiles(id), any
-- subsequent INSERT into user_leagues fails with
--   "insert or update on table 'user_leagues' violates foreign key
--    constraint 'user_leagues_user_id_fkey'"
-- and the /leagues page shows a destructive-state error.
--
-- This migration is idempotent:
--   * CREATE OR REPLACE FUNCTION: safe to re-run.
--   * DROP TRIGGER IF EXISTS: re-binding the trigger is harmless.
--   * INSERT ... ON CONFLICT (id) DO NOTHING inside the function: protects
--     against duplicate-profile errors if the trigger fires twice for any
--     reason (e.g. re-issued signups).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
