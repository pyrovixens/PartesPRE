-- ==============================================================================
-- SISTEMA DE PARTES DE EMERGENCIA Y ASISTENCIAS - 4ª COMPAÑÍA "CALLE LARGA"
-- CUERPO DE BOMBEROS DE LOS ANDES
-- Script de Creación y Población de Base de Datos para Supabase (PostgreSQL)
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: USUARIOS DEL SISTEMA Y CONTROL DE ROLES (RBAC)
CREATE TABLE IF NOT EXISTS public.app_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    volunteer_id TEXT,
    rank TEXT NOT NULL,
    registration_number TEXT,
    role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'OFICIAL', 'VOLUNTARIO')),
    status TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'INVITADO', 'PENDIENTE', 'SUSPENDIDO')),
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    pin TEXT DEFAULT '4444',
    invited_by TEXT,
    invited_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: INVITACIONES Y VERIFICACIONES DE CORREO
CREATE TABLE IF NOT EXISTS public.user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'OFICIAL', 'VOLUNTARIO')),
    token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
    invited_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- 4. TABLA: VOLUNTARIOS (PADRÓN OFICIAL)
CREATE TABLE IF NOT EXISTS public.volunteers (
    id TEXT PRIMARY KEY,
    registration_number TEXT NOT NULL,
    rut TEXT NOT NULL,
    full_name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Fundador / Insigne', 'Honorario', 'Activo', 'Aspirante')),
    rank TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Honorario', 'Insigne', 'Licencia', 'Suspendido')),
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: MATERIAL MAYOR (UNIDADES / CARROS)
CREATE TABLE IF NOT EXISTS public.units (
    code TEXT PRIMARY KEY, -- 'B-4', 'BX-4', 'R-4', 'K-4'
    name TEXT NOT NULL,
    plate TEXT,
    type TEXT NOT NULL CHECK (type IN ('Bomba', 'Forestal', 'Rescate', 'Transporte', 'Aljibe')),
    current_km NUMERIC DEFAULT 0,
    current_pump_hours NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Operativo' CHECK (status IN ('Operativo', 'En Taller', 'Fuera de Servicio')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: CLAVES RADIALES Y ACTIVIDADES
CREATE TABLE IF NOT EXISTS public.emergency_keys (
    code TEXT PRIMARY KEY, -- '10-0-1', '10-4-1', 'ES', etc.
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    short_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA: PARTES DE EMERGENCIA Y ASISTENCIAS
CREATE TABLE IF NOT EXISTS public.emergency_reports (
    id TEXT PRIMARY KEY,
    folio_year INT NOT NULL,
    folio_number INT NOT NULL,
    full_folio TEXT NOT NULL,
    correlativo_compania TEXT NOT NULL,
    correlativo_comandancia TEXT,
    incident_date DATE NOT NULL,
    incident_time TIME DEFAULT '14:00',
    key_code TEXT NOT NULL,
    key_description TEXT NOT NULL,
    category TEXT NOT NULL,
    address TEXT NOT NULL,
    corner_or_reference TEXT,
    sector TEXT NOT NULL,
    commune TEXT NOT NULL DEFAULT 'Calle Larga',
    latitude NUMERIC,
    longitude NUMERIC,
    officer_in_charge_id TEXT NOT NULL,
    officer_in_charge_name TEXT NOT NULL,
    officer_in_charge_rank TEXT NOT NULL,
    units JSONB DEFAULT '[]'::jsonb,
    attendees JSONB DEFAULT '[]'::jsonb,
    total_firefighters INT DEFAULT 0,
    caller_name TEXT,
    caller_phone TEXT,
    affected_property_type TEXT,
    damage_level TEXT,
    injured_count INT DEFAULT 0,
    fatal_count INT DEFAULT 0,
    civilian_injured_count INT DEFAULT 0,
    firefighter_injured_count INT DEFAULT 0,
    external_agencies JSONB DEFAULT '{}'::jsonb,
    summary_notes TEXT,
    officer_notes TEXT,
    status TEXT NOT NULL DEFAULT 'BORRADOR' CHECK (status IN ('BORRADOR', 'ENVIADO', 'APROBADO', 'CERRADO')),
    created_by TEXT NOT NULL,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso anonimo completo a usuarios autorizados" ON public.app_users;
DROP POLICY IF EXISTS "Permitir acceso anonimo a invitaciones" ON public.user_invitations;
DROP POLICY IF EXISTS "Permitir acceso a voluntarios" ON public.volunteers;
DROP POLICY IF EXISTS "Permitir acceso a unidades" ON public.units;
DROP POLICY IF EXISTS "Permitir acceso a claves" ON public.emergency_keys;
DROP POLICY IF EXISTS "Permitir acceso a reportes" ON public.emergency_reports;

CREATE POLICY "Permitir acceso anonimo completo a usuarios autorizados" ON public.app_users FOR ALL USING (true);
CREATE POLICY "Permitir acceso anonimo a invitaciones" ON public.user_invitations FOR ALL USING (true);
CREATE POLICY "Permitir acceso a voluntarios" ON public.volunteers FOR ALL USING (true);
CREATE POLICY "Permitir acceso a unidades" ON public.units FOR ALL USING (true);
CREATE POLICY "Permitir acceso a claves" ON public.emergency_keys FOR ALL USING (true);
CREATE POLICY "Permitir acceso a reportes" ON public.emergency_reports FOR ALL USING (true);

-- 9. HABILITAR SINCRONIZACIÓN EN TIEMPO REAL (REALTIME)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'app_users') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_users;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'volunteers') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.volunteers;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'emergency_reports') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_reports;
  END IF;
END $$;

-- 10. POBLACIÓN DEL MATERIAL MAYOR (UNIDADES)
INSERT INTO public.units (code, name, plate, type, current_km, current_pump_hours, status)
VALUES
  ('B-4', 'Carro Bomba Urbano Mayor (Renault Camiva Midlum)', 'KJ-9082', 'Bomba', 42150, 852.4, 'Operativo'),
  ('BX-4', 'Carro Bomba de Interfaz / Forestal (Mercedes-Benz Atego 4x4)', 'LL-4412', 'Forestal', 28400, 490.1, 'Operativo'),
  ('R-4', 'Unidad de Rescate Técnico y Vehicular (Iveco Magirus)', 'PR-3321', 'Rescate', 31200, 215.8, 'Operativo'),
  ('K-4', 'Vehículo de Transporte y Mando (Toyota Hilux 4x4)', 'TD-8842', 'Transporte', 65100, 12.0, 'Operativo')
ON CONFLICT (code) DO NOTHING;

-- 11. POBLACIÓN DEL PADRÓN OFICIAL DE 31 VOLUNTARIOS REALES
INSERT INTO public.volunteers (id, registration_number, rut, full_name, short_name, category, rank, status)
VALUES
  -- 1. Fundadores / Insignes
  ('vol-f-01', 'FND-001', '07.456.123-4', 'Iván Galdámez Calderón', 'I. Galdámez', 'Fundador / Insigne', 'Bombero Insigne', 'Insigne'),
  ('vol-f-02', 'FND-002', '08.123.456-7', 'Patricio Urbina Zamora', 'P. Urbina Z.', 'Fundador / Insigne', 'Bombero Insigne', 'Insigne'),
  ('vol-f-03', 'FND-003', '08.789.012-3', 'Eduardo Liberón Figueroa', 'E. Liberón', 'Fundador / Insigne', 'Bombero Insigne', 'Insigne'),
  ('vol-f-04', 'FND-004', '09.345.678-9', 'Carlos Contreras Inostroza', 'C. Contreras', 'Fundador / Insigne', 'Bombero Insigne', 'Insigne'),
  ('vol-f-05', 'FND-005', '09.876.543-2', 'Luis Nanjarí Villarroel', 'L. Nanjarí', 'Fundador / Insigne', 'Bombero Insigne', 'Insigne'),
  ('vol-f-06', 'FND-006', '10.234.567-8', 'Claudio Vargas López', 'C. Vargas L.', 'Fundador / Insigne', 'Bombero Insigne', 'Insigne'),
  ('vol-f-07', 'FND-007', '10.987.654-1', 'Manuel Campos Velásquez', 'M. Campos', 'Fundador / Insigne', 'Bombero Insigne', 'Insigne'),
  ('vol-f-08', 'FND-008', '11.345.678-0', 'Luis Haroldo Gutiérrez', 'L. H. Gutiérrez', 'Fundador / Insigne', 'Bombero Insigne', 'Insigne'),
  ('vol-f-09', 'FND-009', '11.890.123-5', 'Héctor Casanova Sánchez', 'H. Casanova S.', 'Fundador / Insigne', 'Bombero Insigne', 'Insigne'),

  -- 2. Honorarios
  ('vol-h-01', 'HON-010', '12.456.789-2', 'Jorge Rodríguez Humeres', 'J. Rodríguez', 'Honorario', 'Bombero Honorario', 'Honorario'),
  ('vol-h-02', 'HON-011', '12.987.654-K', 'Patricio Urbina Lazcano', 'P. Urbina L.', 'Honorario', 'Bombero Honorario', 'Honorario'),
  ('vol-h-03', 'HON-012', '13.234.567-8', 'Julio Triviño Galdámez', 'J. Triviño', 'Honorario', 'Bombero Honorario', 'Honorario'),
  ('vol-h-04', 'HON-013', '13.789.012-3', 'Julio Ayala Mura', 'J. Ayala M.', 'Honorario', 'Bombero Honorario', 'Honorario'),
  ('vol-h-05', 'HON-014', '14.123.456-7', 'Nelly Vicencio Galdámez', 'N. Vicencio', 'Honorario', 'Bombero Honorario', 'Honorario'),
  ('vol-h-06', 'HON-015', '14.678.901-4', 'Víctor Olguín Campos', 'V. Olguín', 'Honorario', 'Bombero Honorario', 'Honorario'),
  ('vol-h-07', 'HON-016', '15.234.567-1', 'Alberto Reyes Barrera', 'A. Reyes B.', 'Honorario', 'Bombero Honorario', 'Honorario'),
  ('vol-h-08', 'HON-017', '15.890.123-9', 'Héctor Bustos Ojeda', 'H. Bustos', 'Honorario', 'Bombero Honorario', 'Honorario'),
  ('vol-h-09', 'HON-018', '16.345.678-6', 'Jaime Ayala Vicencio', 'J. Ayala V.', 'Honorario', 'Bombero Honorario', 'Honorario'),

  -- 3. Activos
  ('vol-a-01', 'ACT-019', '16.789.012-3', 'Nelson Venegas Salazar', 'N. Venegas', 'Activo', 'Director', 'Activo'),
  ('vol-a-02', 'ACT-020', '17.123.456-8', 'Gabriel Bianchini Frost', 'G. Bianchini', 'Activo', 'Capitán', 'Activo'),
  ('vol-a-03', 'ACT-021', '17.654.321-0', 'Samuel Aguirre Torres', 'S. Aguirre', 'Activo', 'Teniente 1°', 'Activo'),
  ('vol-a-04', 'ACT-022', '18.112.233-4', 'Héctor Covarrubias Caiceo', 'H. Covarrubias', 'Activo', 'Teniente 2°', 'Activo'),
  ('vol-a-05', 'ACT-023', '18.456.789-1', 'Jorge Navia Valencia', 'J. Navia', 'Activo', 'Teniente 3°', 'Activo'),
  ('vol-a-06', 'ACT-024', '18.990.112-5', 'José Vargas Ortega', 'J. Vargas', 'Activo', 'Ayudante', 'Activo'),
  ('vol-a-07', 'ACT-025', '19.234.567-2', 'Víctor Rojo Salinas', 'V. Rojo', 'Activo', 'Tesorero', 'Activo'),
  ('vol-a-08', 'ACT-026', '19.789.012-9', 'Enzo Núñez Campos', 'E. Núñez', 'Activo', 'Secretario', 'Activo'),
  ('vol-a-09', 'ACT-027', '16.554.321-8', 'Gustavo Núñez', 'G. Núñez', 'Activo', 'Maquinista General', 'Activo'),
  ('vol-a-10', 'ACT-028', '17.889.900-1', 'Cristian Gutiérrez', 'C. Gutiérrez', 'Activo', 'Maquinista', 'Activo'),
  ('vol-a-11', 'ACT-029', '18.334.455-6', 'Enrique Vargas', 'E. Vargas', 'Activo', 'Maquinista', 'Activo'),
  ('vol-a-12', 'ACT-030', '19.445.678-0', 'Fernando González', 'F. González', 'Activo', 'Bombero Activo', 'Activo'),
  ('vol-a-13', 'ACT-031', '19.890.123-7', 'Hugo Santibáñez Cutiño', 'H. Santibáñez', 'Activo', 'Bombero Activo', 'Activo'),
  ('vol-a-14', 'ACT-032', '20.123.456-4', 'Gustavo Casanova', 'G. Casanova', 'Activo', 'Bombero Activo', 'Activo'),
  ('vol-a-15', 'ACT-033', '20.567.890-1', 'Raúl Reyes Cortés', 'R. Reyes C.', 'Activo', 'Bombero Activo', 'Activo'),
  ('vol-a-16', 'ACT-034', '20.901.234-8', 'Susana Lira', 'S. Lira', 'Activo', 'Bombero Activo', 'Activo'),
  ('vol-a-17', 'ACT-035', '21.234.567-5', 'Germán Muñoz', 'G. Muñoz', 'Activo', 'Bombero Activo', 'Activo'),
  ('vol-a-18', 'ACT-036', '21.678.901-2', 'Nellzon Alcayaga', 'N. Alcayaga', 'Activo', 'Bombero Activo', 'Activo'),
  ('vol-a-19', 'ACT-037', '21.990.112-9', 'Jonathan Toro', 'J. Toro', 'Activo', 'Bombero Activo', 'Activo'),
  ('vol-a-20', 'ACT-038', '22.345.678-6', 'Evelyn Ponce', 'E. Ponce', 'Activo', 'Bombero Activo', 'Activo'),
  ('vol-a-21', 'ACT-039', '22.789.012-3', 'Mayra Rodríguez', 'M. Rodríguez', 'Activo', 'Bombero Activo', 'Activo'),

  -- 4. Aspirantes
  ('vol-asp-01', 'ASP-040', '23.456.789-0', 'Martina Lopez', 'M. Lopez', 'Aspirante', 'Aspirante', 'Activo')
ON CONFLICT (id) DO NOTHING;

-- 12. POBLACIÓN DE USUARIOS INICIALES (SUPER ADMIN PARA MANDO)
INSERT INTO public.app_users (id, email, full_name, volunteer_id, rank, registration_number, role, status, permissions, pin)
VALUES
    ('usr-vol-a-01', 'director@bomberoscallelarga.cl', 'Nelson Venegas Salazar', 'vol-a-01', 'Director', 'ACT-019', 'SUPER_ADMIN', 'ACTIVO', '{"canCreateReports":true,"canEditReports":true,"canDeleteReports":true,"canApproveReports":true,"canManageVolunteers":true,"canManageUnits":true,"canManageUsers":true,"canExportReports":true}'::jsonb, '4444'),
    ('usr-vol-a-02', 'capitan@bomberoscallelarga.cl', 'Gabriel Bianchini Frost', 'vol-a-02', 'Capitán', 'ACT-020', 'SUPER_ADMIN', 'ACTIVO', '{"canCreateReports":true,"canEditReports":true,"canDeleteReports":true,"canApproveReports":true,"canManageVolunteers":true,"canManageUnits":true,"canManageUsers":true,"canExportReports":true}'::jsonb, '4444')
ON CONFLICT (id) DO NOTHING;
