-- Run once before deploying the password-change flow. Does not reset any account.
ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

-- Public browser clients must not read or overwrite the principal account.
-- Server operations use SUPABASE_SERVICE_ROLE_KEY (never NEXT_PUBLIC_*).
DROP POLICY IF EXISTS "app_users_policy" ON public.app_users;
CREATE POLICY "app_users_policy" ON public.app_users FOR ALL
USING (id <> 'usr-superadmin-01' AND role <> 'SUPER_ADMIN' AND lower(email) <> 'gnunezgonzalez@icloud.com')
WITH CHECK (id <> 'usr-superadmin-01' AND role <> 'SUPER_ADMIN' AND lower(email) <> 'gnunezgonzalez@icloud.com');

-- Restrictive policy also covers older permissive policies already present in production.
DROP POLICY IF EXISTS "protect_super_admin_from_public_clients" ON public.app_users;
CREATE POLICY "protect_super_admin_from_public_clients" ON public.app_users
AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (id <> 'usr-superadmin-01' AND role <> 'SUPER_ADMIN' AND lower(email) <> 'gnunezgonzalez@icloud.com')
WITH CHECK (id <> 'usr-superadmin-01' AND role <> 'SUPER_ADMIN' AND lower(email) <> 'gnunezgonzalez@icloud.com');
