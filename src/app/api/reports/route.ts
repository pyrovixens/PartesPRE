import { NextRequest, NextResponse } from 'next/server';
import { serverGetReports, serverSaveReport, serverDeleteReport, serverGetDeletedReportIds } from '../../../lib/serverStore';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimiter';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const reports = await serverGetReports();
    const deletedIds = serverGetDeletedReportIds();
    return NextResponse.json({ success: true, data: reports, deletedIds });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`reports_post_${clientIp}`, 40, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes. Espera unos segundos.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    if (!body || typeof body !== 'object' || !body.id) {
      return NextResponse.json({ success: false, error: 'Datos de parte inválidos.' }, { status: 400 });
    }

    const saved = await serverSaveReport(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`reports_delete_${clientIp}`, 30, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Report id required' }, { status: 400 });
    }
    await serverDeleteReport(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
