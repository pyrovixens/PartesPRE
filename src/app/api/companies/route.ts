import { NextRequest, NextResponse } from 'next/server';
import { 
  serverGetCompanies, 
  serverSaveCompany, 
  serverDeleteCompany, 
  serverGetDeletedCompanyIds,
  serverSaveBranding
} from '../../../lib/serverStore';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimiter';
import { Company, DEFAULT_COMPANY_ID, SUPER_ADMIN_MASTER_EMAIL } from '../../../types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const companies = await serverGetCompanies();
    const deletedIds = serverGetDeletedCompanyIds();
    return NextResponse.json({ success: true, data: companies, deletedIds });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`companies_post_${clientIp}`, 30, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes. Espera unos segundos.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    if (!body || typeof body !== 'object' || !body.id || !body.name) {
      return NextResponse.json({ success: false, error: 'Datos de compañía inválidos. Se requiere id y nombre.' }, { status: 400 });
    }

    const company: Company = {
      id: body.id.trim().toLowerCase().replace(/\s+/g, '-'),
      code: body.code ? body.code.trim().toUpperCase() : 'CIA',
      name: body.name.trim(),
      fireDepartment: body.fireDepartment ? body.fireDepartment.trim() : 'Cuerpo de Bomberos',
      motto: body.motto ? body.motto.trim() : 'Honor, Disciplina y Abnegación',
      logoUrl: body.logoUrl || '/logo_4ta_calle_larga.png',
      primaryColor: body.primaryColor || '#8B0000',
      accentColor: body.accentColor || '#DC2626',
      isActive: body.isActive !== false,
      adminEmail: body.adminEmail ? body.adminEmail.trim().toLowerCase() : undefined,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await serverSaveCompany(company);

    // Sync initial branding for the company
    await serverSaveBranding({
      companyId: saved.id,
      companyName: saved.name,
      fireDepartment: saved.fireDepartment,
      motto: saved.motto,
      logoUrl: saved.logoUrl,
      primaryColor: saved.primaryColor,
      accentColor: saved.accentColor,
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`companies_delete_${clientIp}`, 20, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Company id required' }, { status: 400 });
    }

    if (id === DEFAULT_COMPANY_ID) {
      return NextResponse.json({ success: false, error: 'No es posible eliminar la compañía principal predeterminada.' }, { status: 403 });
    }

    await serverDeleteCompany(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
