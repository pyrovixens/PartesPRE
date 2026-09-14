import { NextRequest, NextResponse } from 'next/server';
import { serverGetBranding, serverSaveBranding } from '../../../lib/serverStore';
import {
  apiErrorResponse,
  cleanText,
  readJsonObject,
  requireApiAuth,
  writeAuditLog,
} from '../../../lib/apiSecurity';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: await serverGetBranding() });
  } catch {
    return NextResponse.json(
      { success: false, error: 'No fue posible cargar la marca.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await requireApiAuth(req, 'canManageUsers');
    const body = await readJsonObject(req, 100_000);
    cleanText(body.companyName, 'Nombre de compañía', 200);
    cleanText(body.fireDepartment, 'Cuerpo de Bomberos', 200);
    cleanText(body.logoUrl, 'Logo', 500);
    const saved = await serverSaveBranding(body as any);
    await writeAuditLog(context, 'branding.update', 'branding', 'default_branding');
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
