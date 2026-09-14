-- ==============================================================================
-- SISTEMA OFICIAL DE CONTROL DE ASISTENCIAS Y PARTES DE EMERGENCIA
-- 4ª COMPAÑÍA "CALLE LARGA" - CUERPO DE BOMBEROS DE LOS ANDES
-- Schema Oficial para Supabase (PostgreSQL 15+)
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: USUARIOS DEL SISTEMA Y PROTOCOLOS DE SEGURIDAD (RBAC + CYBERSECURITY)
CREATE TABLE IF NOT EXISTS public.app_users (
    id TEXT PRIMARY KEY,
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    volunteer_id TEXT,
    rank TEXT NOT NULL,
    registration_number TEXT,
    role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'OFICIAL', 'VOLUNTARIO')),
    status TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'INVITADO', 'PENDIENTE', 'SUSPENDIDO')),
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    invited_by TEXT,
    invited_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: INVITACIONES Y VERIFICACIONES DE CORREO (NO CREA CUENTA HASTA ACTIVAR)
CREATE TABLE IF NOT EXISTS public.user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'OFICIAL', 'VOLUNTARIO')),
    token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
    invited_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- 4. TABLA: VOLUNTARIOS (PADRÓN OFICIAL DE LA COMPAÑÍA)
CREATE TABLE IF NOT EXISTS public.volunteers (
    id TEXT PRIMARY KEY,
    registration_number TEXT NOT NULL,
    rut TEXT NOT NULL,
    full_name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Fundador / Insigne', 'Honorario', 'Activo', 'Aspirante')),
    rank TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Honorario', 'Insigne', 'Licencia', 'Suspendido')),
    is_driver BOOLEAN DEFAULT FALSE,
    driver_license TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: MATERIAL MAYOR (UNIDADES / CARROS OFICIALES)
CREATE TABLE IF NOT EXISTS public.units (
    code TEXT PRIMARY KEY, -- 'B-4', 'BX-4', 'R-4', 'Z-4', 'K-4'
    name TEXT NOT NULL,
    plate TEXT,
    type TEXT NOT NULL CHECK (type IN ('Bomba', 'Forestal', 'Rescate', 'Transporte', 'Aljibe')),
    current_km NUMERIC DEFAULT 0,
    current_pump_hours NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Operativo' CHECK (status IN ('Operativo', 'En Taller', 'Fuera de Servicio')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: CLAVES RADIALES Y ACTIVIDADES INSTITUCIONALES
CREATE TABLE IF NOT EXISTS public.emergency_keys (
    code TEXT PRIMARY KEY, -- '10-0-1', '10-4-1', 'ES', etc.
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    short_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA: PARTES DE ASISTENCIA Y EMERGENCIAS
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
    status TEXT NOT NULL DEFAULT 'APROBADO',
    created_by TEXT NOT NULL,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    captain_name TEXT,
    captain_rank TEXT,
    digital_signature JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA: AUDITORÍA DE SEGURIDAD (SOLO SERVIDOR)
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

-- 9. TABLA: BRANDING INSTITUCIONAL (ESCUDO Y MARCA)
CREATE TABLE IF NOT EXISTS public.company_branding (
    id TEXT PRIMARY KEY DEFAULT 'default_branding',
    company_name TEXT NOT NULL DEFAULT '4ª Compañía "Bomba Calle Larga"',
    fire_department TEXT NOT NULL DEFAULT 'Cuerpo de Bomberos de Los Andes',
    motto TEXT NOT NULL DEFAULT 'Honor, Disciplina y Abnegación',
    logo_url TEXT NOT NULL DEFAULT '/logo_4ta_calle_larga.png',
    primary_color TEXT NOT NULL DEFAULT '#8B0000',
    accent_color TEXT NOT NULL DEFAULT '#DC2626',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ÍNDICES DE RENDIMIENTO Y PREVENCIÓN DE DUPLICADOS
CREATE INDEX IF NOT EXISTS idx_reports_folio ON public.emergency_reports (folio_year, correlativo_compania);
CREATE INDEX IF NOT EXISTS idx_reports_date ON public.emergency_reports (incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.app_users (email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.user_invitations (token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.user_invitations (email);
CREATE INDEX IF NOT EXISTS idx_volunteers_rut ON public.volunteers (rut);
CREATE INDEX IF NOT EXISTS idx_volunteers_reg ON public.volunteers (registration_number);

-- 10. HABILITAR ROW LEVEL SECURITY
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- 11. ACCESO A DATOS EXCLUSIVAMENTE DESDE LA API CON SERVICE ROLE
-- No se crean políticas para anon/authenticated. La service role omite RLS.
REVOKE ALL ON public.app_users FROM anon, authenticated;
REVOKE ALL ON public.user_invitations FROM anon, authenticated;
REVOKE ALL ON public.volunteers FROM anon, authenticated;
REVOKE ALL ON public.units FROM anon, authenticated;
REVOKE ALL ON public.emergency_keys FROM anon, authenticated;
REVOKE ALL ON public.emergency_reports FROM anon, authenticated;
REVOKE ALL ON public.company_branding FROM anon, authenticated;
REVOKE ALL ON public.security_audit_log FROM anon, authenticated;

-- 12. POBLACIÓN DE MATERIAL MAYOR (UNIDADES OFICIALES 4ª COMPAÑÍA)
INSERT INTO public.units (code, name, plate, type, current_km, current_pump_hours, status) VALUES
  ('B-4', 'Bomba Primera Intervención B-4', 'CB-401', 'Bomba', 45200, 320, 'Operativo'),
  ('BX-4', 'Bomba Respaldo / Cisterna BX-4', 'CB-402', 'Bomba', 38100, 210, 'Operativo'),
  ('R-4', 'Unidad de Rescate Vehicular R-4', 'CB-403', 'Rescate', 29400, 145, 'Operativo'),
  ('Z-4', 'Unidad de Abastecimiento Z-4', 'CB-404', 'Aljibe', 18300, 90, 'Operativo'),
  ('K-4', 'Unidad de Transporte y Mando K-4', 'CB-405', 'Transporte', 52000, 0, 'Operativo')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  plate = EXCLUDED.plate,
  type = EXCLUDED.type;

-- 13. POBLACIÓN DE CLAVES RADIALES
INSERT INTO public.emergency_keys (code, description, category, short_code) VALUES
  ('10-0-1', 'Incendio estructural – Casa habitación / inmueble ≤ 3 niveles', 'Emergencias', 'E'),
  ('10-0-2', 'Incendio estructural – Edificio (4 o más niveles)', 'Emergencias', 'E'),
  ('10-0-3', 'Incendio en lugar de gran afluencia de público (en horario)', 'Emergencias', 'E'),
  ('10-0-4', 'Incendio estructural en sector de alto riesgo', 'Emergencias', 'E'),
  ('10-0-5', 'Incendio en industria', 'Emergencias', 'E'),
  ('10-0-6', 'Incendio en infraestructura crítica', 'Emergencias', 'E'),
  ('10-1-1', 'Incendio de vehículo menor', 'Emergencias', 'E'),
  ('10-1-2', 'Incendio de vehículo mayor', 'Emergencias', 'E'),
  ('10-1-3', 'Incendio de transporte de pasajeros', 'Emergencias', 'E'),
  ('10-1-4', 'Incendio de vehículo mayor con carga', 'Emergencias', 'E'),
  ('10-2-1', 'Incendio de pastizales', 'Emergencias', 'E'),
  ('10-2-2', 'Fuego en contenedores de basura', 'Emergencias', 'E'),
  ('10-2-3', 'Fuego de interfaz urbano–forestal', 'Emergencias', 'E'),
  ('10-2-4', 'Fuego en basural / sitio eriazo', 'Emergencias', 'E'),
  ('10-2-5', 'Incendio de pastizales en ruta o > 7 km (alto riesgo)', 'Emergencias', 'E'),
  ('10-3-1', 'Rescate de personas con riesgo vital / PCR', 'Emergencias', 'E'),
  ('10-3-2', 'Rescate técnico agreste', 'Emergencias', 'E'),
  ('10-3-3', 'Rescate técnico en ríos o cursos de agua', 'Emergencias', 'E'),
  ('10-3-4', 'Rescate técnico en altura', 'Emergencias', 'E'),
  ('10-3-5', 'Rescate técnico en estructuras colapsadas / espacios confinados', 'Emergencias', 'E'),
  ('10-3-6', 'Rescate animal simple', 'Emergencias', 'E'),
  ('10-3-7', 'Rescate técnico animal', 'Emergencias', 'E'),
  ('10-3-8', 'Recuperación de cadáveres en cursos de agua', 'Emergencias', 'E'),
  ('10-3-9', 'Rescate técnico complejo', 'Emergencias', 'E'),
  ('10-3-10', 'Asistencia de personas', 'Emergencias', 'E'),
  ('10-3-11', 'Búsqueda de personas en zonas agrestes', 'Emergencias', 'E'),
  ('10-3-12', 'Rescate técnico simple de persona', 'Emergencias', 'E'),
  ('10-4-1', 'Accidente vehicular menor', 'Emergencias', 'E'),
  ('10-4-2', 'Accidente vehicular pesado', 'Emergencias', 'E'),
  ('10-4-3', 'Accidente vehicular HAZMAT', 'Emergencias', 'E'),
  ('10-4-4', 'Accidente vehicular con desbarrancamiento (> 5 m)', 'Emergencias', 'E'),
  ('10-5-1', 'Incidente con materiales peligrosos', 'Emergencias', 'E'),
  ('10-5-2', 'Derrame de combustible en vía pública', 'Emergencias', 'E'),
  ('10-5-3', 'Olor desconocido en el ambiente', 'Emergencias', 'E'),
  ('10-5-4', 'Emergencia por ingesta de producto químico', 'Emergencias', 'E'),
  ('10-5-5', 'Higienización y desinfección', 'Emergencias', 'E'),
  ('10-5-6', 'Rotura de termómetro', 'Emergencias', 'E'),
  ('10-6-1', 'Fuga de gas inflamable', 'Emergencias', 'E'),
  ('10-6-2', 'Fuga de gas inflamable en lugar de gran afluencia', 'Emergencias', 'E'),
  ('10-6-3', 'Fuga de gas inflamable con explosión', 'Emergencias', 'E'),
  ('10-7', 'Emergencia eléctrica', 'Emergencias', 'E'),
  ('10-8-1', 'Verificación de emergencias', 'Emergencias', 'E'),
  ('10-8-2', 'Apoyo SAMU (camillaje)', 'Emergencias', 'E'),
  ('10-8-3', 'Monitoreo preventivo por factores de riesgo', 'Emergencias', 'E'),
  ('10-8-4', 'Caída de árboles', 'Emergencias', 'E'),
  ('10-8-5', 'Emergencias por condiciones climáticas', 'Emergencias', 'E'),
  ('10-8-6', 'Evacuación de agua', 'Emergencias', 'E'),
  ('10-8-7', 'Apertura de inmuebles sin personas', 'Emergencias', 'E'),
  ('10-8-8', 'No clasificados', 'Emergencias', 'E'),
  ('10-8-9', 'Presunta desgracia', 'Emergencias', 'E'),
  ('10-9-1', 'Academias', 'Academias', 'A'),
  ('10-9-2', 'Entrega de agua / llenado de piscina', 'Emergencias', 'E'),
  ('10-9-3', 'Colocación de banderas / postura de driza', 'Emergencias', 'E'),
  ('10-9-4', 'Guardia preventiva', 'Emergencias', 'E'),
  ('10-9-5', 'Inspección técnica y peritaje', 'Emergencias', 'E'),
  ('10-9-6', 'Revisión de grifos y redes de incendio', 'Emergencias', 'E'),
  ('10-10', 'Rebrote de incendio', 'Emergencias', 'E'),
  ('10-11', 'Llamado a servicio aéreo', 'Emergencias', 'E'),
  ('10-12', 'Apoyo a otro Cuerpo de Bomberos', 'Emergencias', 'E'),
  ('10-13', 'Atentado terrorista', 'Emergencias', 'E'),
  ('10-14', 'Caída de aeronave', 'Emergencias', 'E'),
  ('10-15', 'Simulacro', 'Emergencias', 'E'),
  ('10-16', 'Incendio al interior de túnel', 'Emergencias', 'E'),
  ('A', 'Academias de Formación Técnica', 'Academias', 'A'),
  ('ES', 'Entrenamiento Estándar de Compañía', 'Entrenamiento Estandar', 'ES'),
  ('RC', 'Reunión Ordinaria / Extraordinaria de Compañía', 'Reuniones de Compañía', 'RC'),
  ('RF', 'Reunión de Fundación de Compañía', 'Reuniones de Fundacion', 'RF'),
  ('V', 'Citaciones Varias / Actos Oficiales / Desfiles', 'Citaciones Varias', 'V')
ON CONFLICT (code) DO NOTHING;

-- 14-15. DATOS OPERACIONALES Y USUARIO INICIAL
-- No se versionan datos personales, RUT ni credenciales. Cárgalos por un canal seguro.
-- Vincula el primer administrador a una identidad existente de Supabase Auth.

-- 16. POBLACIÓN DE BRANDING INSTITUCIONAL
INSERT INTO public.company_branding (id, company_name, fire_department, motto, logo_url, primary_color, accent_color)
VALUES ('default_branding', '4ª Compañía "Bomba Calle Larga"', 'Cuerpo de Bomberos de Los Andes', 'Honor, Disciplina y Abnegación', '/logo_4ta_calle_larga.png', '#8B0000', '#DC2626')
ON CONFLICT (id) DO NOTHING;

-- 17. HABILITAR PUBLICACIÓN EN TIEMPO REAL DE FORMA SEGURA (SUPABASE REALTIME)
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'emergency_reports',
    'volunteers',
    'units',
    'app_users',
    'user_invitations',
    'emergency_keys',
    'company_branding'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;

-- ==============================================================================
-- 18. MIGRACIÓN / ACTUALIZACIÓN NO DESTRUCTIVA (EJECUTAR EN SUPABASE SQL EDITOR SI YA TIENES DATOS)
-- ==============================================================================
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS is_driver BOOLEAN DEFAULT FALSE;
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS driver_license TEXT;

