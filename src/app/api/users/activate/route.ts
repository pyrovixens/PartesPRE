import { NextResponse } from 'next/server';
import {
  ApiSecurityError,
  apiErrorResponse,
  requireApiAuth,
  writeAuditLog,
} from '../../../../lib/apiSecurity';

export async function POST(request: Request) {
  try {
    const context = await requireApiAuth(request);
    if (context.profile.status === 'SUSPENDIDO') {
      throw new ApiSecurityError(403, 'La cuenta está suspendida.');
    }

    const { data, error } = await context.admin
      .from('app_users')
      .update({
        status: 'ACTIVO',
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', context.user.id)
      .select('*')
      .single();

    if (error || !data) throw error || new Error('No se activó el perfil.');
    await context.admin
      .from('user_invitations')
      .update({ status: 'ACCEPTED' })
      .eq('email', context.profile.email.toLowerCase());

    await writeAuditLog(context, 'user.activate', 'app_user', context.profile.id);
    return NextResponse.json({
      success: true,
      data: { ...context.profile, status: 'ACTIVO', lastLogin: data.last_login },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
