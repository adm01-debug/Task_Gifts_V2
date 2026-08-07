-- Create test user via auth admin
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'qa-test@taskgifts.com';
  
  IF v_user_id IS NULL THEN
    -- Insert into auth.users
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token
    ) VALUES (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
      'qa-test@taskgifts.com',
      crypt('QaTest2026!', gen_salt('bf')),
      now(), 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"QA Tester"}'::jsonb,
      now(), now(), '', ''
    )
    RETURNING id INTO v_user_id;
    
    -- Insert identity
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    VALUES (v_user_id, v_user_id, 'qa-test@taskgifts.com', 'email', 
      jsonb_build_object('sub', v_user_id::text, 'email', 'qa-test@taskgifts.com'),
      now(), now(), now());
    
    -- Assign admin role for full testing
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin');
  ELSE
    -- Ensure admin role exists
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;
