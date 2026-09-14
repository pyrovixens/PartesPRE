import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { serverGetReports, serverSaveReport } from '../../../../lib/serverStore';
import {
  ApiSecurityError,
  apiErrorResponse,
  cleanText,
  readJsonObject,
  requireApiAuth,
  writeAuditLog,
} from '../../../../lib/apiSecurity';

export async function POST(request: Request) {
  try {
    const context = await requireApiAuth(request, 'canApproveReports');
    const body = await readJsonObject(request, 10_000);
    const reportId = cleanText(body.reportId, 'reportId', 120);
    const report = (await serverGetReports()).find(item => item.id === reportId);

    if (!report) {
      throw new ApiSecurityError(404, 'Parte no encontrado.');
    }

    const approvedAt = new Date().toISOString();
    const digest = createHash('sha256')
      .update(JSON.stringify({
        id: report.id,
        folio: report.fullFolio,
        updatedAt: report.updatedAt || report.createdAt,
        approvedBy: context.profile.id,
        approvedAt,
      }))
      .digest('hex');

    const signed = await serverSaveReport({
      ...report,
      status: 'APROBADO',
      approvedBy: context.profile.id,
      approvedAt,
      captainName: context.profile.fullName,
      captainRank: context.profile.rank,
      digitalSignature: {
        signedBy: context.profile.fullName,
        signedByRank: context.profile.rank,
        signedAt: approvedAt,
        verificationCode: digest.slice(0, 20).toUpperCase(),
      },
      updatedAt: approvedAt,
    });

    await writeAuditLog(context, 'report.approve', 'emergency_report', reportId, {
      verificationCode: digest.slice(0, 20).toUpperCase(),
    });

    return NextResponse.json({ success: true, data: signed });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
