import { NextRequest, NextResponse } from 'next/server';
import {
  serverDeleteVolunteer,
  serverGetDeletedVolunteerIds,
  serverGetVolunteers,
  serverSaveVolunteer,
} from '../../../lib/serverStore';
import {
  ApiSecurityError,
  apiErrorResponse,
  cleanText,
  readJsonObject,
  requireApiAuth,
  writeAuditLog,
} from '../../../lib/apiSecurity';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireApiAuth(req);
    return NextResponse.json({
      success: true,
      data: await serverGetVolunteers(),
      deletedIds: serverGetDeletedVolunteerIds(),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await requireApiAuth(req, 'canManageVolunteers');
    const body = await readJsonObject(req, 100_000);
    cleanText(body.id, 'id', 120);
    cleanText(body.fullName, 'Nombre', 200);
    cleanText(body.registrationNumber, 'Número de registro', 50);
    cleanText(body.rut, 'RUT', 20);
    const saved = await serverSaveVolunteer(body as any);
    await writeAuditLog(context, 'volunteer.save', 'volunteer', body.id);
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const context = await requireApiAuth(req, 'canManageVolunteers');
    const id = cleanText(new URL(req.url).searchParams.get('id'), 'id', 120);
    await serverDeleteVolunteer(id);
    await writeAuditLog(context, 'volunteer.delete', 'volunteer', id);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
