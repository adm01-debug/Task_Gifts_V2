-- 1. Secure Search Path for ALL public functions
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname as schema, p.proname as name, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    ) 
    LOOP
        EXECUTE 'ALTER FUNCTION ' || quote_ident(r.schema) || '.' || quote_ident(r.name) || '(' || r.args || ') SET search_path = public';
    END LOOP;
END $$;

-- 2. Restrict SECURITY DEFINER functions
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname as schema, p.proname as name, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.prosecdef = true 
        AND n.nspname = 'public'
    ) 
    LOOP
        EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || quote_ident(r.schema) || '.' || quote_ident(r.name) || '(' || r.args || ') FROM PUBLIC, anon';
        EXECUTE 'GRANT EXECUTE ON FUNCTION ' || quote_ident(r.schema) || '.' || quote_ident(r.name) || '(' || r.args || ') TO authenticated, service_role';
    END LOOP;
END $$;

-- 3. Row Level Security Hardening
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles') THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
        DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
        CREATE POLICY "Profiles are viewable by authenticated users" ON profiles FOR SELECT TO authenticated USING (true);
        
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- 4. General RLS Enforcement
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;
