import { NextRequest, NextResponse } from 'next/server';
import { serverGetPublicUsers, serverSaveUser, serverDeleteUser, serverGetDeletedUserIds, serverSanitizeUser } from '../../../lib/serverStore';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimiter';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await serverGetPublicUsers();
    const deletedIds = serverGetDeletedUserIds();
    return NextResponse.json({ success: true, data: users, deletedIds });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`users_post_${clientIp}`, 30, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Límite de solicitudes alcanzado. Por favor espera unos segundos.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const saved = await serverSaveUser(body);
    return NextResponse.json({ success: true, data: serverSanitizeUser(saved) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`users_delete_${clientIp}`, 20, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Límite de solicitudes alcanzado.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'User id required' }, { status: 400 });
    }
    await serverDeleteUser(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
