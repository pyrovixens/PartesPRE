import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../lib/rateLimiter';
import {
  ApiSecurityError,
  apiErrorResponse,
  cleanText,
  readJsonObject,
  requireApiAuth,
  writeAuditLog,
} from '../../../lib/apiSecurity';

export async function POST(request: Request) {
  try {
    const context = await requireApiAuth(request, 'canManageUsers');
    const rateLimit = checkRateLimit('invite_user_' + context.user.id, 10, 60);
    if (!rateLimit.allowed) {
      throw new ApiSecurityError(429, 'Espera antes de enviar más invitaciones.');
    }
    const body = await readJsonObject(request, 100_000);
    const email = cleanText(body.email, 'Correo', 254).toLowerCase();
    const fullName = cleanText(body.fullName, 'Nombre', 200);
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '';

    if (!appUrl || (!appUrl.startsWith('https://') && process.env.NODE_ENV === 'production')) {
      throw new ApiSecurityError(503, 'APP_URL debe estar configurada con HTTPS.');
    }

    const existing = await context.admin
      .from('app_users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (existing.error) throw existing.error;

    const linkType = existing.data?.auth_user_id ? 'recovery' : 'invite';
    const generated = await context.admin.auth.admin.generateLink({
      type: linkType,
      email,
      options: {
        redirectTo: appUrl.replace(/\/$/, '') + '/crear-cuenta?email=' + encodeURIComponent(email),
        data: { full_name: fullName },
      },
    } as any);

    if (generated.error || !generated.data.user || !generated.data.properties?.action_link) {
      throw new ApiSecurityError(
        400,
        generated.error?.message || 'No se pudo generar la invitación.'
      );
    }

    const authUserId = generated.data.user.id;
    const requestedRole = body.role || existing.data?.role || 'VOLUNTARIO';
    const role = ['SUPER_ADMIN', 'ADMIN', 'OFICIAL', 'VOLUNTARIO'].includes(requestedRole)
      ? requestedRole
      : 'VOLUNTARIO';
    if (role === 'SUPER_ADMIN' && context.profile.role !== 'SUPER_ADMIN') {
      throw new ApiSecurityError(403, 'No puedes invitar un superadministrador.');
    }

    const profileId = existing.data?.id || 'usr-' + crypto.randomUUID();
    const profileResult = await context.admin.from('app_users').upsert({
      id: profileId,
      auth_user_id: authUserId,
      email,
      full_name: fullName,
      volunteer_id:
        typeof body.volunteerId === 'string'
          ? body.volunteerId
          : existing.data?.volunteer_id || null,
      rank:
        typeof body.rank === 'string'
          ? body.rank.slice(0, 100)
          : existing.data?.rank || 'Bombero Activo',
      registration_number:
        typeof body.registrationNumber === 'string'
          ? body.registrationNumber.slice(0, 50)
          : existing.data?.registration_number || '',
      role,
      status: existing.data?.status === 'ACTIVO' ? 'ACTIVO' : 'INVITADO',
      permissions:
        body.permissions && typeof body.permissions === 'object'
          ? body.permissions
          : existing.data?.permissions || {},
      invited_by: context.profile.fullName,
      invited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (profileResult.error) throw profileResult.error;

    const actionLink = generated.data.properties.action_link;
    const subject = 'Invitación al Sistema de Partes de Emergencia';
    const textBody =
      'Hola ' + fullName + ',\n\n' +
      'La Oficialidad te invitó al Sistema de Partes. Abre este enlace personal y de un solo uso:\n' +
      actionLink + '\n\n' +
      'Si no esperabas esta invitación, ignora este correo.';

    let directEmailSent = false;
    let resendMessage = 'Entrega manual requerida.';
    if (process.env.RESEND_API_KEY) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Partes PRE <onboarding@resend.dev>',
          to: [email],
          subject,
          text: textBody,
        }),
      });
      directEmailSent = emailResponse.ok;
      resendMessage = emailResponse.ok
        ? 'Correo enviado.'
        : 'El proveedor de correo rechazó el envío.';
    }

    const mailtoUrl =
      'mailto:' + encodeURIComponent(email) +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(textBody);

    await writeAuditLog(context, 'invitation.send', 'app_user', profileId, { email });
    return NextResponse.json({
      success: true,
      data: null,
      directEmailSent,
      resendMessage,
      activationUrl: actionLink,
      mailtoUrl,
      gmailUrl:
        'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(email) +
        '&su=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(textBody),
      recipient: email,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
