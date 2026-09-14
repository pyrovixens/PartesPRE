import { NextResponse } from 'next/server';
import { serverGetSyncState } from '../../../lib/serverStore';
import { apiErrorResponse, requireApiAuth } from '../../../lib/apiSecurity';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireApiAuth(request);
    return NextResponse.json({ success: true, ...serverGetSyncState() });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
