import { NextRequest, NextResponse } from 'next/server';
import {
  serverDeleteReport,
  serverGetDeletedReportIds,
  serverGetReports,
  serverSaveReport,
} from '../../../lib/serverStore';
import {
  ApiSecurityError,
  apiErrorResponse,
  cleanText,
  hasPermission,
  readJsonObject,
  requireApiAuth,
  writeAuditLog,
} from '../../../lib/apiSecurity';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireApiAuth(req);
    const reports = await serverGetReports();
    return NextResponse.json({
      success: true,
      data: reports,
      deletedIds: serverGetDeletedReportIds(),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await requireApiAuth(req);
    const body = await readJsonObject(req, 1_500_000);
    const id = cleanText(body.id, 'id', 120);
    cleanText(body.incidentDate, 'Fecha del incidente', 10);
    cleanText(body.keyCode, 'Clave', 30);
    cleanText(body.address, 'Dirección', 300);
    cleanText(body.summaryNotes, 'Relato operativo', 12_000, false);

    if (!Array.isArray(body.attendees) || body.attendees.length > 500) {
      throw new ApiSecurityError(400, 'La asistencia es inválida o excede el límite.');
    }
    if (!Array.isArray(body.units) || body.units.length > 30) {
      throw new ApiSecurityError(400, 'Las unidades son inválidas o exceden el límite.');
    }

    const reports = await serverGetReports();
    const existing = reports.find(report => report.id === id);
    const permission = existing ? 'canEditReports' : 'canCreateReports';
    if (!hasPermission(context.profile, permission)) {
      throw new ApiSecurityError(403, 'No tienes permiso para guardar este parte.');
    }
    if (
      existing &&
      (existing.status === 'APROBADO' || existing.status === 'CERRADO') &&
      !hasPermission(context.profile, 'canApproveReports')
    ) {
      throw new ApiSecurityError(403, 'Un parte aprobado solo puede ser modificado por el mando autorizado.');
    }

    const allowedStatus =
      body.status === 'ENVIADO' || body.status === 'BORRADOR'
        ? body.status
        : 'BORRADOR';

    const report = {
      ...body,
      id,
      status:
        existing?.status === 'APROBADO' || existing?.status === 'CERRADO'
          ? existing.status
          : allowedStatus,
      createdBy: existing?.createdBy || context.profile.id,
      createdAt: existing?.createdAt || new Date().toISOString(),
      approvedBy: existing?.approvedBy,
      approvedAt: existing?.approvedAt,
      captainName: existing?.captainName,
      captainRank: existing?.captainRank,
      digitalSignature: existing?.digitalSignature,
      updatedAt: new Date().toISOString(),
    };

    const saved = await serverSaveReport(report as any);
    await writeAuditLog(
      context,
      existing ? 'report.update' : 'report.create',
      'emergency_report',
      id
    );
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const context = await requireApiAuth(req, 'canDeleteReports');
    const id = cleanText(new URL(req.url).searchParams.get('id'), 'id', 120);
    await serverDeleteReport(id);
    await writeAuditLog(context, 'report.delete', 'emergency_report', id);
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
