-- Remove the incorrectly created user so signup API can create properly
DELETE FROM auth.identities WHERE provider_id = 'qa-test@taskgifts.com';
DELETE FROM auth.users WHERE email = 'qa-test@taskgifts.com';
