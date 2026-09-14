import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { AppUser, UserPermissions } from '../types';

export type PermissionKey = keyof UserPermissions;

export interface ApiAuthContext {
  user: User;
  profile: AppUser;
  admin: SupabaseClient;
}

export class ApiSecurityError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiSecurityError';
    this.status = status;
  }
}

const getSupabaseUrl = (): string =>
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';

const getAnonKey = (): string =>
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const getServerSupabaseAdmin = (): SupabaseClient => {
  const url = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!url || !serviceRoleKey || !url.startsWith('https://')) {
    throw new ApiSecurityError(503, 'El servicio seguro de datos no está configurado.');
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const getBearerToken = (request: Request): string => {
  const authorization = request.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer ([A-Za-z0-9._~-]+)$/);

  if (!match) {
    throw new ApiSecurityError(401, 'Sesión requerida.');
  }

  return match[1];
};

const mapProfile = (row: any): AppUser => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  volunteerId: row.volunteer_id || undefined,
  rank: row.rank,
  registrationNumber: row.registration_number || '',
  role: row.role,
  status: row.status,
  permissions: row.permissions || {},
  invitedBy: row.invited_by || undefined,
  invitedAt: row.invited_at || undefined,
  lastLogin: row.last_login || undefined,
  createdAt: row.created_at,
});

export const hasPermission = (
  profile: AppUser,
  permission: PermissionKey
): boolean =>
  profile.role === 'SUPER_ADMIN' || profile.permissions?.[permission] === true;

export const requireApiAuth = async (
  request: Request,
  permission?: PermissionKey
): Promise<ApiAuthContext> => {
  const url = getSupabaseUrl();
  const anonKey = getAnonKey();

  if (!url || !anonKey || !url.startsWith('https://')) {
    throw new ApiSecurityError(503, 'El servicio de autenticación no está configurado.');
  }

  const verifier = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = getBearerToken(request);
  const { data, error } = await verifier.auth.getUser(token);

  if (error || !data.user) {
    throw new ApiSecurityError(401, 'La sesión expiró o no es válida.');
  }

  const admin = getServerSupabaseAdmin();
  const { data: profileRow, error: profileError } = await admin
    .from('app_users')
    .select('*')
    .eq('auth_user_id', data.user.id)
    .maybeSingle();

  if (profileError) {
    throw new ApiSecurityError(503, 'No fue posible validar el perfil de acceso.');
  }

  if (!profileRow) {
    throw new ApiSecurityError(403, 'La cuenta no tiene un perfil autorizado.');
  }

  const profile = mapProfile(profileRow);
  if (profile.status === 'SUSPENDIDO') {
    throw new ApiSecurityError(403, 'La cuenta está suspendida.');
  }

  if (permission && !hasPermission(profile, permission)) {
    throw new ApiSecurityError(403, 'No tienes permiso para realizar esta acción.');
  }

  return { user: data.user, profile, admin };
};

export const readJsonObject = async (
  request: Request,
  maxBytes = 1_000_000
): Promise<Record<string, any>> => {
  const declaredLength = Number(request.headers.get('content-length') || '0');
  if (declaredLength > maxBytes) {
    throw new ApiSecurityError(413, 'La solicitud excede el tamaño permitido.');
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > maxBytes) {
    throw new ApiSecurityError(413, 'La solicitud excede el tamaño permitido.');
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new ApiSecurityError(400, 'JSON inválido.');
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiSecurityError(400, 'El cuerpo de la solicitud es inválido.');
  }

  return value as Record<string, any>;
};

export const cleanText = (
  value: unknown,
  field: string,
  maxLength: number,
  required = true
): string => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (required && !text) {
    throw new ApiSecurityError(400, field + ' es obligatorio.');
  }
  if (text.length > maxLength) {
    throw new ApiSecurityError(400, field + ' excede el largo permitido.');
  }
  return text;
};

export const writeAuditLog = async (
  context: ApiAuthContext,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata: Record<string, unknown> = {}
): Promise<void> => {
  const { error } = await context.admin.from('security_audit_log').insert({
    actor_auth_user_id: context.user.id,
    actor_app_user_id: context.profile.id,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
  });

  if (error) {
    console.error('No se pudo registrar el evento de auditoría:', error.message);
  }
};

export const apiErrorResponse = (error: unknown): NextResponse => {
  if (error instanceof ApiSecurityError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status }
    );
  }

  console.error('Error interno de API:', error);
  return NextResponse.json(
    { success: false, error: 'Error interno del servidor.' },
    { status: 500 }
  );
};
