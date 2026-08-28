import { NextRequest, NextResponse } from 'next/server';
import { serverGetUnits, serverSaveUnit, serverDeleteUnit } from '../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const units = await serverGetUnits();
    return NextResponse.json({ success: true, data: units });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const saved = await serverSaveUnit(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    if (!code) {
      return NextResponse.json({ success: false, error: 'Unit code required' }, { status: 400 });
    }
    await serverDeleteUnit(code);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
