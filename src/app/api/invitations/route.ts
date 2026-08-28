import { NextRequest, NextResponse } from 'next/server';
import { 
  serverGetInvitations, 
  serverSaveInvitation, 
  serverDeleteInvitation 
} from '../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const invitations = await serverGetInvitations();
    return NextResponse.json({ success: true, data: invitations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const saved = await serverSaveInvitation(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    const target = email || token;
    if (!target) {
      return NextResponse.json({ success: false, error: 'Email or token required' }, { status: 400 });
    }
    await serverDeleteInvitation(target);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
