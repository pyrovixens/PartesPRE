import { NextResponse } from 'next/server';
import { serverGetSyncState } from '../../../lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const syncState = serverGetSyncState();
  return NextResponse.json({ success: true, ...syncState });
}
