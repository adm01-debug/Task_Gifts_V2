DO $$
DECLARE r record; q text;
BEGIN
  FOR r IN
    SELECT tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname='public' AND roles::text='{public}' AND cmd='SELECT'
      AND coalesce(qual,'true')='true'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', r.policyname, r.tablename);
  END LOOP;
END $$;