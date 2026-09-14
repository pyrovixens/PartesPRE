import { NextRequest, NextResponse } from 'next/server';
import { AppUser, UserPermissions, UserRole } from '../../../types';
import {
  ApiSecurityError,
  apiErrorResponse,
  cleanText,
  readJsonObject,
  requireApiAuth,
  writeAuditLog,
} from '../../../lib/apiSecurity';

export const dynamic = 'force-dynamic';

const allowedRoles = new Set<UserRole>(['SUPER_ADMIN', 'ADMIN', 'OFICIAL', 'VOLUNTARIO']);
const permissionKeys: Array<keyof UserPermissions> = [
  'canCreateReports',
  'canEditReports',
  'canDeleteReports',
  'canApproveReports',
  'canManageVolunteers',
  'canManageUnits',
  'canManageUsers',
  'canExportReports',
];

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

const sanitizePermissions = (value: unknown): UserPermissions => {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return Object.fromEntries(
    permissionKeys.map(key => [key, input[key] === true])
  ) as unknown as UserPermissions;
};

const validateNewPassword = (password: string): void => {
  if (
    password.length < 12 ||
    !/[A-ZÁÉÍÓÚÑ]/.test(password) ||
    !/[a-záéíóúñ]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ]/.test(password) ||
    /bombero2026|password|contraseña|123456/i.test(password)
  ) {
    throw new ApiSecurityError(
      400,
      'La contraseña debe tener 12 caracteres, mayúscula, minúscula, número y símbolo, y no ser institucional.'
    );
  }
};

export async function GET(req: NextRequest) {
  try {
    const wantsOwnProfile = new URL(req.url).searchParams.get('me') === '1';
    const context = await requireApiAuth(
      req,
      wantsOwnProfile ? undefined : 'canManageUsers',
      wantsOwnProfile
    );

    if (wantsOwnProfile) {
      return NextResponse.json({ success: true, data: context.profile });
    }

    const { data, error } = await context.admin
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data: (data || []).map(mapProfile) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await requireApiAuth(req, 'canManageUsers');
    const body = await readJsonObject(req, 100_000);
    const email = cleanText(body.email, 'Correo', 254).toLowerCase();
    const fullName = cleanText(body.fullName, 'Nombre', 200);
    const rank = cleanText(body.rank, 'Rango', 100);
    const registrationNumber = cleanText(
      body.registrationNumber,
      'Número de registro',
      50,
      false
    );
    const role = body.role as UserRole;

    if (!allowedRoles.has(role)) {
      throw new ApiSecurityError(400, 'Rol inválido.');
    }
    if (role === 'SUPER_ADMIN' && context.profile.role !== 'SUPER_ADMIN') {
      throw new ApiSecurityError(403, 'Solo un superadministrador puede asignar ese rol.');
    }

    const requestedId =
      typeof body.id === 'string' && body.id.trim()
        ? cleanText(body.id, 'id', 120)
        : '';

    let existing: any = null;
    if (requestedId) {
      const result = await context.admin
        .from('app_users')
        .select('*')
        .eq('id', requestedId)
        .maybeSingle();
      if (result.error) throw result.error;
      existing = result.data;
    }

    if (
      existing &&
      existing.auth_user_id === context.user.id &&
      (role !== existing.role || body.status === 'SUSPENDIDO')
    ) {
      throw new ApiSecurityError(400, 'No puedes degradar ni suspender tu propia cuenta.');
    }

    let authUserId = existing?.auth_user_id || '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!authUserId) {
      if (!newPassword) {
        throw new ApiSecurityError(
          400,
          'Las cuentas nuevas deben crearse mediante una invitación segura.'
        );
      }
      validateNewPassword(newPassword);
      const created = await context.admin.auth.admin.createUser({
        email,
        password: newPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (created.error || !created.data.user) {
        throw new ApiSecurityError(400, created.error?.message || 'No se pudo crear la identidad.');
      }
      authUserId = created.data.user.id;
    } else {
      const changes: { email?: string; password?: string; email_confirm?: boolean } = {};
      if (email !== existing.email) {
        changes.email = email;
        changes.email_confirm = true;
      }
      if (newPassword) {
        validateNewPassword(newPassword);
        changes.password = newPassword;
      }
      if (Object.keys(changes).length > 0) {
        const updated = await context.admin.auth.admin.updateUserById(authUserId, changes);
        if (updated.error) throw new ApiSecurityError(400, updated.error.message);
      }
    }

    const status =
      body.status === 'SUSPENDIDO' ? 'SUSPENDIDO' : 'ACTIVO';
    const profileId = existing?.id || 'usr-' + crypto.randomUUID();
    const { data, error } = await context.admin
      .from('app_users')
      .upsert({
        id: profileId,
        auth_user_id: authUserId,
        email,
        full_name: fullName,
        volunteer_id:
          typeof body.volunteerId === 'string' ? body.volunteerId : null,
        rank,
        registration_number: registrationNumber,
        role,
        status,
        permissions: sanitizePermissions(body.permissions),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select('*')
      .single();

    if (error || !data) throw error || new Error('No se guardó el perfil.');
    await writeAuditLog(context, existing ? 'user.update' : 'user.create', 'app_user', profileId);
    return NextResponse.json({ success: true, data: mapProfile(data) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const context = await requireApiAuth(req, 'canManageUsers');
    const id = cleanText(new URL(req.url).searchParams.get('id'), 'id', 120);
    const result = await context.admin.from('app_users').select('*').eq('id', id).maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) throw new ApiSecurityError(404, 'Usuario no encontrado.');
    if (result.data.auth_user_id === context.user.id) {
      throw new ApiSecurityError(400, 'No puedes eliminar tu propia cuenta.');
    }

    if (result.data.role === 'SUPER_ADMIN') {
      const countResult = await context.admin
        .from('app_users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'SUPER_ADMIN')
        .eq('status', 'ACTIVO');
      if ((countResult.count || 0) <= 1) {
        throw new ApiSecurityError(400, 'No se puede eliminar el último superadministrador.');
      }
    }

    if (result.data.auth_user_id) {
      const deleted = await context.admin.auth.admin.deleteUser(result.data.auth_user_id);
      if (deleted.error) throw new ApiSecurityError(400, deleted.error.message);
    }
    const deletion = await context.admin.from('app_users').delete().eq('id', id);
    if (deletion.error) throw deletion.error;

    await writeAuditLog(context, 'user.delete', 'app_user', id, {
      deletedEmail: result.data.email,
    });
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
