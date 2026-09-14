import { NextRequest, NextResponse } from 'next/server';
import {
  serverDeleteInvitation,
  serverGetInvitations,
  serverSaveInvitation,
} from '../../../lib/serverStore';
import {
  apiErrorResponse,
  cleanText,
  readJsonObject,
  requireApiAuth,
  writeAuditLog,
} from '../../../lib/apiSecurity';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireApiAuth(req, 'canManageUsers');
    return NextResponse.json({ success: true, data: await serverGetInvitations() });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await requireApiAuth(req, 'canManageUsers');
    const body = await readJsonObject(req, 100_000);
    const email = cleanText(body.email, 'Correo', 254).toLowerCase();
    const invitation = {
      ...body,
      id: 'inv-' + crypto.randomUUID(),
      email,
      fullName: cleanText(body.fullName, 'Nombre', 200),
      token: crypto.randomUUID(),
      status: 'PENDING',
      invitedBy: context.profile.fullName,
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    const saved = await serverSaveInvitation(invitation);
    await writeAuditLog(context, 'invitation.create', 'invitation', invitation.id, { email });
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const context = await requireApiAuth(req, 'canManageUsers');
    const params = new URL(req.url).searchParams;
    const target = params.get('email') || params.get('token');
    const cleanTarget = cleanText(target, 'Invitación', 300);
    await serverDeleteInvitation(cleanTarget);
    await writeAuditLog(context, 'invitation.revoke', 'invitation', cleanTarget);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
