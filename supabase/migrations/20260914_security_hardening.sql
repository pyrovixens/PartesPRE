-- Ejecutar manualmente en Supabase antes de desplegar security/hardening-v1.
-- Esta migración cierra el acceso directo, vincula perfiles con Supabase Auth
-- y elimina credenciales heredadas de public.app_users.

BEGIN;

ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS app_users_auth_user_id_key
  ON public.app_users (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

UPDATE public.app_users AS profile
SET auth_user_id = auth_user.id
FROM auth.users AS auth_user
WHERE profile.auth_user_id IS NULL
  AND lower(profile.email) = lower(auth_user.email);

ALTER TABLE public.app_users
  DROP COLUMN IF EXISTS password,
  DROP COLUMN IF EXISTS password_hash,
  DROP COLUMN IF EXISTS failed_login_attempts,
  DROP COLUMN IF EXISTS locked_until;

CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_app_user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS security_audit_actor_idx
  ON public.security_audit_log (actor_auth_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS security_audit_resource_idx
  ON public.security_audit_log (resource_type, resource_id, created_at DESC);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  table_name TEXT;
  policy_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'app_users',
    'user_invitations',
    'volunteers',
    'units',
    'emergency_keys',
    'emergency_reports',
    'company_branding',
    'security_audit_log'
  ]
  LOOP
    FOR policy_name IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
    END LOOP;
  END LOOP;
END $$;

REVOKE ALL ON public.app_users FROM anon, authenticated;
REVOKE ALL ON public.user_invitations FROM anon, authenticated;
REVOKE ALL ON public.volunteers FROM anon, authenticated;
REVOKE ALL ON public.units FROM anon, authenticated;
REVOKE ALL ON public.emergency_keys FROM anon, authenticated;
REVOKE ALL ON public.emergency_reports FROM anon, authenticated;
REVOKE ALL ON public.company_branding FROM anon, authenticated;
REVOKE ALL ON public.security_audit_log FROM anon, authenticated;

COMMIT;

-- Comprobación manual: toda cuenta operativa debe devolver auth_user_id no nulo.
-- SELECT id, email, role, status, auth_user_id FROM public.app_users;
