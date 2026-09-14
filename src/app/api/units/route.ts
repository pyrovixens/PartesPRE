import { NextRequest, NextResponse } from 'next/server';
import {
  serverDeleteUnit,
  serverGetDeletedUnitCodes,
  serverGetUnits,
  serverSaveUnit,
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
    await requireApiAuth(req);
    return NextResponse.json({
      success: true,
      data: await serverGetUnits(),
      deletedCodes: serverGetDeletedUnitCodes(),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await requireApiAuth(req, 'canManageUnits');
    const body = await readJsonObject(req, 100_000);
    cleanText(body.code, 'Código', 30);
    cleanText(body.name, 'Nombre', 200);
    cleanText(body.plate, 'Patente', 30);
    const saved = await serverSaveUnit(body as any);
    await writeAuditLog(context, 'unit.save', 'unit', body.code);
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const context = await requireApiAuth(req, 'canManageUnits');
    const code = cleanText(new URL(req.url).searchParams.get('code'), 'code', 30);
    await serverDeleteUnit(code);
    await writeAuditLog(context, 'unit.delete', 'unit', code);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
