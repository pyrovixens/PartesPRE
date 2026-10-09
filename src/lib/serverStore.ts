import { EmergencyReport, Volunteer, Unit, CompanyBranding, AppUser, Company, DEFAULT_COMPANY_ID } from '../types';
import { INITIAL_REPORTS, INITIAL_VOLUNTEERS, INITIAL_UNITS } from '../data/initialData';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://uaznxrwfnneyqmldtbvk.supabase.co';
const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  'sb_publishable_w-Ml2AzHvke457YRHM4dNg_ljPXxTUN';

const supabase = (supabaseUrl && supabaseKey && supabaseUrl.startsWith('https://'))
  ? createClient(supabaseUrl, supabaseKey)
  : null;

interface ServerState {
  companies: Company[];
  reports: EmergencyReport[];
  volunteers: Volunteer[];
  units: Unit[];
  branding: CompanyBranding;
  users: AppUser[];
  invitations?: any[];
  deletedCompanyIds: string[];
  deletedReportIds: string[];
  deletedVolunteerIds: string[];
  deletedUnitCodes: string[];
  deletedUserIds: string[];
  revision: number;
  lastUpdate: string;
}

const DEFAULT_COMPANY: Company = {
  id: '4cia-calle-larga',
  code: '4CIA',
  name: '4ª Compañía "Bomba Calle Larga"',
  fireDepartment: 'Cuerpo de Bomberos de Los Andes - Calle Larga',
  motto: 'Honor, Disciplina y Abnegación',
  logoUrl: '/logo_4ta_calle_larga.png',
  primaryColor: '#8B0000',
  accentColor: '#DC2626',
  isActive: true,
  adminEmail: 'gnunezgonzalez@icloud.com',
  createdAt: '2026-01-01T00:00:00Z',
};

const DEFAULT_BRANDING: CompanyBranding = {
  companyId: '4cia-calle-larga',
  companyName: '4ª Compañía "Bomba Calle Larga"',
  fireDepartment: 'Cuerpo de Bomberos de Los Andes',
  motto: 'Honor, Disciplina y Abnegación',
  logoUrl: '/logo_4ta_calle_larga.png',
  primaryColor: '#8B0000',
  accentColor: '#DC2626',
};

const DEFAULT_SUPER_ADMIN: AppUser = {
  id: 'usr-superadmin-01',
  companyId: 'ALL',
  email: 'gnunezgonzalez@icloud.com',
  fullName: 'Gustavo Núñez González',
  rank: 'Super Administrador General',
  registrationNumber: 'SUP-001',
  role: 'SUPER_ADMIN',
  status: 'ACTIVO',
  permissions: {
    canCreateReports: true,
    canEditReports: true,
    canDeleteReports: true,
    canApproveReports: true,
    canManageVolunteers: true,
    canManageUnits: true,
    canManageUsers: true,
    canExportReports: true,
  },
  passwordHash: 'c0023972fce4d51959f33673c0bb7b465886f889d6998414d88f56fdf57f9a1e',
  failedLoginAttempts: 0,
  createdAt: new Date().toISOString(),
};

// Global singleton state on Node server runtime
const globalState: ServerState = (global as any).__BOMBEROS_SERVER_STATE__ || {
  companies: [{ ...DEFAULT_COMPANY }],
  reports: INITIAL_REPORTS.map(r => ({ ...r, companyId: r.companyId || DEFAULT_COMPANY_ID })),
  volunteers: INITIAL_VOLUNTEERS.map(v => ({ ...v, companyId: v.companyId || DEFAULT_COMPANY_ID })),
  units: INITIAL_UNITS.map(u => ({ ...u, companyId: u.companyId || DEFAULT_COMPANY_ID })),
  branding: { ...DEFAULT_BRANDING },
  users: [{ ...DEFAULT_SUPER_ADMIN }],
  deletedCompanyIds: [],
  deletedReportIds: [],
  deletedVolunteerIds: [],
  deletedUnitCodes: [],
  deletedUserIds: [],
  revision: 1,
  lastUpdate: new Date().toISOString(),
};

if (!globalState.companies || globalState.companies.length === 0) globalState.companies = [{ ...DEFAULT_COMPANY }];
if (!globalState.deletedCompanyIds) globalState.deletedCompanyIds = [];
if (!globalState.deletedReportIds) globalState.deletedReportIds = [];
if (!globalState.deletedVolunteerIds) globalState.deletedVolunteerIds = [];
if (!globalState.deletedUnitCodes) globalState.deletedUnitCodes = [];
if (!globalState.deletedUserIds) globalState.deletedUserIds = [];

(global as any).__BOMBEROS_SERVER_STATE__ = globalState;

const bumpRevision = () => {
  globalState.revision += 1;
  globalState.lastUpdate = new Date().toISOString();
};

// ----------------------------------------------------------------------
// COMPANIES API (MULTI-TENANT)
// ----------------------------------------------------------------------

export const serverGetDeletedCompanyIds = (): string[] => {
  return globalState.deletedCompanyIds || [];
};

export const serverGetCompanies = async (): Promise<Company[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: Company[] = data
          .filter((r: any) => !globalState.deletedCompanyIds.includes(r.id))
          .map((row: any) => ({
            id: row.id,
            code: row.code,
            name: row.name,
            fireDepartment: row.fire_department,
            motto: row.motto || '',
            logoUrl: row.logo_url || '/logo_4ta_calle_larga.png',
            primaryColor: row.primary_color || '#8B0000',
            accentColor: row.accent_color || '#DC2626',
            isActive: row.is_active !== false,
            adminEmail: row.admin_email,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));

        if (!mapped.some(c => c.id === DEFAULT_COMPANY_ID)) {
          mapped.unshift({ ...DEFAULT_COMPANY });
        }
        globalState.companies = mapped;
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase query error in serverGetCompanies:', e);
    }
  }
  return globalState.companies.filter(c => !globalState.deletedCompanyIds.includes(c.id));
};

export const serverSaveCompany = async (company: Company): Promise<Company> => {
  globalState.deletedCompanyIds = globalState.deletedCompanyIds.filter(id => id !== company.id);
  const index = globalState.companies.findIndex(c => c.id === company.id);
  if (index >= 0) {
    globalState.companies[index] = { ...globalState.companies[index], ...company, updatedAt: new Date().toISOString() };
  } else {
    globalState.companies.push({ ...company, createdAt: company.createdAt || new Date().toISOString() });
  }
  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('companies').upsert({
        id: company.id,
        code: company.code,
        name: company.name,
        fire_department: company.fireDepartment,
        motto: company.motto,
        logo_url: company.logoUrl,
        primary_color: company.primaryColor,
        accent_color: company.accentColor,
        is_active: company.isActive,
        admin_email: company.adminEmail,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase save error in serverSaveCompany:', e);
    }
  }
  return company;
};

export const serverDeleteCompany = async (companyId: string): Promise<boolean> => {
  if (companyId === DEFAULT_COMPANY_ID) {
    return false; // Cannot delete master company
  }
  globalState.companies = globalState.companies.filter(c => c.id !== companyId);
  if (!globalState.deletedCompanyIds.includes(companyId)) {
    globalState.deletedCompanyIds.push(companyId);
  }
  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('companies').delete().eq('id', companyId);
    } catch (e) {
      console.warn('Supabase delete error in serverDeleteCompany:', e);
    }
  }
  return true;
};

// ----------------------------------------------------------------------
// REPORTS API
// ----------------------------------------------------------------------

export const serverGetDeletedReportIds = (): string[] => {
  return globalState.deletedReportIds || [];
};

export const serverGetReports = async (companyId?: string): Promise<EmergencyReport[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('emergency_reports')
        .select('*')
        .order('incident_date', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: EmergencyReport[] = data
          .map((row: any) => {
            let capName = row.captain_name;
            let capRank = row.captain_rank;
            let appBy = row.approved_by;
            let sig = row.digital_signature && Object.keys(row.digital_signature).length > 0 ? row.digital_signature : undefined;
            if (capName?.toLowerCase().includes('enrique') || appBy?.toLowerCase().includes('enrique') || sig?.signedBy?.toLowerCase().includes('enrique')) {
              capName = 'José Vargas Ortega';
              capRank = 'Capitán';
              if (appBy?.toLowerCase().includes('enrique')) appBy = 'José Vargas Ortega';
              if (sig?.signedBy?.toLowerCase().includes('enrique')) {
                sig = { ...sig, signedBy: 'José Vargas Ortega', signedByRank: 'Capitán' };
              }
            }
            return {
              id: row.id,
              companyId: row.company_id || DEFAULT_COMPANY_ID,
              folioYear: row.folio_year,
              folioNumber: row.folio_number,
              fullFolio: row.full_folio,
              correlativoCompania: row.correlativo_compania,
              correlativoComandancia: row.correlativo_comandancia || '',
              incidentDate: row.incident_date,
              incidentTime: row.incident_time || '12:00',
              keyCode: row.key_code,
              keyDescription: row.key_description,
              category: row.category,
              address: row.address,
              cornerOrReference: row.corner_or_reference,
              sector: row.sector,
              commune: row.commune,
              officerInChargeId: row.officer_in_charge_id,
              officerInChargeName: row.officer_in_charge_name,
              officerInChargeRank: row.officer_in_charge_rank,
              units: row.units || [],
              attendees: row.attendees || [],
              totalFirefighters: row.total_firefighters || (row.attendees ? row.attendees.length : 0),
              callerName: row.caller_name,
              callerPhone: row.caller_phone,
              affectedPropertyType: row.affected_property_type,
              damageLevel: row.damage_level,
              injuredCount: row.injured_count || 0,
              fatalCount: row.fatal_count || 0,
              civilianInjuredCount: row.civilian_injured_count || 0,
              firefighterInjuredCount: row.firefighter_injured_count || 0,
              externalAgencies: row.external_agencies || {},
              summaryNotes: row.summary_notes || '',
              status: row.status || 'APROBADO',
              createdAt: row.created_at,
              createdBy: row.created_by,
              updatedAt: row.updated_at,
              approvedBy: appBy,
              approvedAt: row.approved_at,
              captainName: capName,
              captainRank: capRank,
              digitalSignature: sig,
              obacSignature: row.obac_signature && Object.keys(row.obac_signature).length > 0 ? row.obac_signature : undefined,
              reviewerSignature: row.reviewer_signature && Object.keys(row.reviewer_signature).length > 0 ? row.reviewer_signature : sig,
            };
          });

        // Strict Deduplication
        const seenIds = new Set<string>();
        const seenFolios = new Set<string>();
        globalState.reports = mapped.filter(r => {
          if (globalState.deletedReportIds.includes(r.id)) return false;
          const key = `${r.companyId || DEFAULT_COMPANY_ID}-${r.folioYear}-${r.correlativoCompania || r.fullFolio || r.folioNumber}`;
          if (seenIds.has(r.id) || seenFolios.has(key)) return false;
          seenIds.add(r.id);
          seenFolios.add(key);
          return true;
        });

        if (companyId && companyId !== 'ALL') {
          return globalState.reports.filter(r => (r.companyId || DEFAULT_COMPANY_ID) === companyId);
        }
        return globalState.reports;
      }
    } catch (e) {
      console.warn('Supabase query error in serverGetReports:', e);
    }
  }

  // Deduplicate in-memory reports
  const seenIds = new Set<string>();
  const seenFolios = new Set<string>();
  globalState.reports = globalState.reports.filter(r => {
    if (globalState.deletedReportIds.includes(r.id)) return false;
    const key = `${r.companyId || DEFAULT_COMPANY_ID}-${r.folioYear}-${r.correlativoCompania || r.fullFolio || r.folioNumber}`;
    if (seenIds.has(r.id) || seenFolios.has(key)) return false;
    seenIds.add(r.id);
    seenFolios.add(key);
    return true;
  });

  if (companyId && companyId !== 'ALL') {
    return globalState.reports.filter(r => (r.companyId || DEFAULT_COMPANY_ID) === companyId);
  }
  return globalState.reports;
};

export const serverSaveReport = async (report: EmergencyReport): Promise<EmergencyReport> => {
  const targetCompanyId = report.companyId || DEFAULT_COMPANY_ID;
  const enrichedReport: EmergencyReport = {
    ...report,
    companyId: targetCompanyId,
  };

  // If report was previously deleted, un-delete it
  globalState.deletedReportIds = globalState.deletedReportIds.filter(id => id !== enrichedReport.id);

  // Match by ID OR by same Folio in the same Year and Company
  const reportKey = `${targetCompanyId}-${enrichedReport.folioYear}-${enrichedReport.correlativoCompania || enrichedReport.fullFolio || enrichedReport.folioNumber}`;
  const index = globalState.reports.findIndex(r => 
    r.id === enrichedReport.id || 
    `${r.companyId || DEFAULT_COMPANY_ID}-${r.folioYear}-${r.correlativoCompania || r.fullFolio || r.folioNumber}` === reportKey
  );

  if (index >= 0) {
    globalState.reports[index] = { ...enrichedReport, id: globalState.reports[index].id || enrichedReport.id };
  } else {
    globalState.reports.unshift(enrichedReport);
  }

  // Deduplicate array
  const seenIds = new Set<string>();
  const seenFolios = new Set<string>();
  globalState.reports = globalState.reports.filter(r => {
    const key = `${r.companyId || DEFAULT_COMPANY_ID}-${r.folioYear}-${r.correlativoCompania || r.fullFolio || r.folioNumber}`;
    if (seenIds.has(r.id) || seenFolios.has(key)) return false;
    seenIds.add(r.id);
    seenFolios.add(key);
    return true;
  });

  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('emergency_reports').upsert({
        id: enrichedReport.id,
        company_id: targetCompanyId,
        folio_year: enrichedReport.folioYear,
        folio_number: enrichedReport.folioNumber,
        full_folio: enrichedReport.fullFolio,
        correlativo_compania: enrichedReport.correlativoCompania,
        correlativo_comandancia: enrichedReport.correlativoComandancia,
        incident_date: enrichedReport.incidentDate,
        incident_time: enrichedReport.incidentTime || '12:00',
        key_code: enrichedReport.keyCode,
        key_description: enrichedReport.keyDescription,
        category: enrichedReport.category,
        address: enrichedReport.address,
        corner_or_reference: enrichedReport.cornerOrReference,
        sector: enrichedReport.sector,
        commune: enrichedReport.commune,
        officer_in_charge_id: enrichedReport.officerInChargeId,
        officer_in_charge_name: enrichedReport.officerInChargeName,
        officer_in_charge_rank: enrichedReport.officerInChargeRank,
        units: enrichedReport.units,
        attendees: enrichedReport.attendees,
        total_firefighters: enrichedReport.totalFirefighters,
        caller_name: enrichedReport.callerName,
        caller_phone: enrichedReport.callerPhone,
        affected_property_type: enrichedReport.affectedPropertyType,
        damage_level: enrichedReport.damageLevel,
        injured_count: enrichedReport.injuredCount,
        fatal_count: enrichedReport.fatalCount,
        civilian_injured_count: enrichedReport.civilianInjuredCount,
        firefighter_injured_count: enrichedReport.firefighterInjuredCount,
        external_agencies: enrichedReport.externalAgencies,
        summary_notes: enrichedReport.summaryNotes,
        status: enrichedReport.status,
        created_by: enrichedReport.createdBy,
        approved_by: enrichedReport.approvedBy,
        approved_at: enrichedReport.approvedAt,
        captain_name: enrichedReport.captainName,
        captain_rank: enrichedReport.captainRank,
        digital_signature: enrichedReport.digitalSignature || enrichedReport.reviewerSignature || {},
        obac_signature: enrichedReport.obacSignature || {},
        reviewer_signature: enrichedReport.reviewerSignature || enrichedReport.digitalSignature || {},
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase save error in serverSaveReport:', e);
    }
  }

  return enrichedReport;
};

export const serverDeleteReport = async (id: string): Promise<boolean> => {
  globalState.reports = globalState.reports.filter(r => r.id !== id);
  if (!globalState.deletedReportIds.includes(id)) {
    globalState.deletedReportIds.push(id);
  }
  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('emergency_reports').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete error in serverDeleteReport:', e);
    }
  }
  return true;
};

// ----------------------------------------------------------------------
// VOLUNTEERS API
// ----------------------------------------------------------------------

export const serverGetDeletedVolunteerIds = (): string[] => {
  return globalState.deletedVolunteerIds || [];
};

export const serverGetVolunteers = async (companyId?: string): Promise<Volunteer[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .order('registration_number', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: Volunteer[] = data
          .filter((row: any) => !(globalState.deletedVolunteerIds || []).includes(row.id))
          .map((row: any) => {
            const isRankMachinist = row.rank === 'Maquinista General' || row.rank === 'Maquinista';
            const isDriverBool = isRankMachinist || (row.is_driver === true || row.is_driver === 'true' || row.isDriver === true);
            const hasLicense = !!row.driver_license && row.driver_license !== 'NO' && row.driver_license !== 'null' && row.driver_license !== 'undefined';
            
            let isDriver = false;
            let driverLicense: string | undefined = undefined;

            if (isDriverBool) {
              isDriver = true;
              driverLicense = hasLicense ? row.driver_license : 'Clase F';
            } else {
              isDriver = false;
              driverLicense = undefined;
            }

            let rank = row.rank || 'Bombero Activo';
            if (row.id === 'vol-a-06' || row.full_name?.toLowerCase().includes('josé vargas') || row.full_name?.toLowerCase().includes('jose vargas')) {
              rank = 'Capitán';
            } else if (row.id === 'vol-a-11' || row.full_name?.toLowerCase().includes('enrique vargas')) {
              if (rank === 'Capitán') rank = 'Bombero Activo';
            }

            return {
              id: row.id,
              companyId: row.company_id || DEFAULT_COMPANY_ID,
              registrationNumber: row.registration_number,
              rut: row.rut,
              fullName: row.full_name,
              shortName: row.short_name,
              category: row.category,
              rank,
              status: row.status,
              isDriver,
              driverLicense,
              phone: row.phone,
              email: row.email,
            };
          });
        globalState.volunteers = mapped;
        if (companyId && companyId !== 'ALL') {
          return mapped.filter(v => (v.companyId || DEFAULT_COMPANY_ID) === companyId);
        }
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase query error in serverGetVolunteers:', e);
    }
  }
  const clean = globalState.volunteers.filter(v => !(globalState.deletedVolunteerIds || []).includes(v.id));
  if (companyId && companyId !== 'ALL') {
    return clean.filter(v => (v.companyId || DEFAULT_COMPANY_ID) === companyId);
  }
  return clean;
};

export const serverSaveVolunteer = async (vol: Volunteer): Promise<Volunteer> => {
  globalState.deletedVolunteerIds = (globalState.deletedVolunteerIds || []).filter(id => id !== vol.id);
  const isRankMachinist = vol.rank === 'Maquinista General' || vol.rank === 'Maquinista';
  const isDriverBool = isRankMachinist || (vol.isDriver === true && vol.driverLicense !== 'NO');
  const targetCompanyId = vol.companyId || DEFAULT_COMPANY_ID;
  
  const cleanVol: Volunteer = {
    ...vol,
    companyId: targetCompanyId,
    isDriver: isDriverBool,
    driverLicense: isDriverBool ? (vol.driverLicense && vol.driverLicense !== 'NO' ? vol.driverLicense : 'Clase F') : undefined,
  };

  const index = globalState.volunteers.findIndex(v => v.id === cleanVol.id);
  if (index >= 0) {
    globalState.volunteers[index] = cleanVol;
  } else {
    globalState.volunteers.push(cleanVol);
  }
  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('volunteers').upsert({
        id: cleanVol.id,
        company_id: targetCompanyId,
        registration_number: cleanVol.registrationNumber,
        rut: cleanVol.rut,
        full_name: cleanVol.fullName,
        short_name: cleanVol.shortName,
        category: cleanVol.category,
        rank: cleanVol.rank,
        status: cleanVol.status,
        is_driver: cleanVol.isDriver || false,
        driver_license: cleanVol.isDriver ? (cleanVol.driverLicense || 'Clase F') : null,
        phone: cleanVol.phone,
        email: cleanVol.email,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase save error in serverSaveVolunteer:', e);
    }
  }
  return cleanVol;
};

export const serverDeleteVolunteer = async (id: string): Promise<boolean> => {
  globalState.volunteers = globalState.volunteers.filter(v => v.id !== id);
  if (!globalState.deletedVolunteerIds.includes(id)) {
    globalState.deletedVolunteerIds.push(id);
  }
  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('volunteers').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete error in serverDeleteVolunteer:', e);
    }
  }
  return true;
};

// ----------------------------------------------------------------------
// UNITS API
// ----------------------------------------------------------------------

export const serverGetDeletedUnitCodes = (): string[] => {
  return globalState.deletedUnitCodes || [];
};

export const serverGetUnits = async (companyId?: string): Promise<Unit[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('code', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: Unit[] = data
          .filter((row: any) => !globalState.deletedUnitCodes.includes(row.code))
          .map((row: any) => ({
            code: row.code,
            companyId: row.company_id || DEFAULT_COMPANY_ID,
            name: row.name,
            plate: row.plate || '',
            type: row.type || 'Bomba',
            currentKm: row.current_km || 0,
            currentPumpHours: row.current_pump_hours || 0,
            status: row.status || 'Operativo',
          }));
        globalState.units = mapped;
        if (companyId && companyId !== 'ALL') {
          return mapped.filter(u => (u.companyId || DEFAULT_COMPANY_ID) === companyId);
        }
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase query error in serverGetUnits:', e);
    }
  }
  const clean = globalState.units.filter(u => !globalState.deletedUnitCodes.includes(u.code));
  if (companyId && companyId !== 'ALL') {
    return clean.filter(u => (u.companyId || DEFAULT_COMPANY_ID) === companyId);
  }
  return clean;
};

export const serverSaveUnit = async (unit: Unit): Promise<Unit> => {
  globalState.deletedUnitCodes = globalState.deletedUnitCodes.filter(c => c !== unit.code);
  const targetCompanyId = unit.companyId || DEFAULT_COMPANY_ID;
  const enrichedUnit: Unit = { ...unit, companyId: targetCompanyId };
  
  const index = globalState.units.findIndex(u => u.code === enrichedUnit.code);
  if (index >= 0) {
    globalState.units[index] = enrichedUnit;
  } else {
    globalState.units.push(enrichedUnit);
  }
  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('units').upsert({
        code: enrichedUnit.code,
        company_id: targetCompanyId,
        name: enrichedUnit.name,
        plate: enrichedUnit.plate,
        type: enrichedUnit.type,
        current_km: enrichedUnit.currentKm,
        current_pump_hours: enrichedUnit.currentPumpHours,
        status: enrichedUnit.status,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'code' });
    } catch (e) {
      console.warn('Supabase save error in serverSaveUnit:', e);
    }
  }
  return enrichedUnit;
};

export const serverDeleteUnit = async (code: string): Promise<boolean> => {
  globalState.units = globalState.units.filter(u => u.code !== code);
  if (!globalState.deletedUnitCodes.includes(code)) {
    globalState.deletedUnitCodes.push(code);
  }
  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('units').delete().eq('code', code);
    } catch (e) {
      console.warn('Supabase delete error in serverDeleteUnit:', e);
    }
  }
  return true;
};

// ----------------------------------------------------------------------
// BRANDING API
// ----------------------------------------------------------------------

export const serverGetBranding = async (companyId?: string): Promise<CompanyBranding> => {
  const targetCompanyId = (companyId && companyId !== 'ALL') ? companyId : DEFAULT_COMPANY_ID;

  // First check if matched company exists in registered companies
  const comp = globalState.companies.find(c => c.id === targetCompanyId);
  if (comp) {
    return {
      companyId: comp.id,
      companyName: comp.name,
      fireDepartment: comp.fireDepartment,
      motto: comp.motto,
      logoUrl: comp.logoUrl,
      primaryColor: comp.primaryColor,
      accentColor: comp.accentColor,
    };
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', targetCompanyId)
        .limit(1)
        .single();

      if (!error && data) {
        const mapped: CompanyBranding = {
          companyId: data.company_id || targetCompanyId,
          companyName: data.company_name,
          fireDepartment: data.fire_department,
          motto: data.motto,
          logoUrl: data.logo_url,
          primaryColor: data.primary_color,
          accentColor: data.accent_color,
        };
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase query error in serverGetBranding:', e);
    }
  }
  return { ...globalState.branding, companyId: targetCompanyId };
};

export const serverSaveBranding = async (branding: CompanyBranding): Promise<CompanyBranding> => {
  const targetCompanyId = branding.companyId || DEFAULT_COMPANY_ID;
  const enriched: CompanyBranding = { ...branding, companyId: targetCompanyId };
  globalState.branding = enriched;

  // Also sync with company in globalState.companies if present
  const compIndex = globalState.companies.findIndex(c => c.id === targetCompanyId);
  if (compIndex >= 0) {
    globalState.companies[compIndex] = {
      ...globalState.companies[compIndex],
      name: branding.companyName,
      fireDepartment: branding.fireDepartment,
      motto: branding.motto,
      logoUrl: branding.logoUrl,
      primaryColor: branding.primaryColor,
      accentColor: branding.accentColor,
      updatedAt: new Date().toISOString(),
    };
  }

  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('company_branding').upsert({
        id: `branding_${targetCompanyId}`,
        company_id: targetCompanyId,
        company_name: branding.companyName,
        fire_department: branding.fireDepartment,
        motto: branding.motto,
        logo_url: branding.logoUrl,
        primary_color: branding.primaryColor,
        accent_color: branding.accentColor,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase save error in serverSaveBranding:', e);
    }
  }
  return enriched;
};

// ----------------------------------------------------------------------
// USERS API
// ----------------------------------------------------------------------

export const serverGetDeletedUserIds = (): string[] => {
  return globalState.deletedUserIds || [];
};

export const serverGetUsers = async (companyId?: string): Promise<AppUser[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: AppUser[] = data
          .filter((row: any) => !globalState.deletedUserIds.includes(row.id))
          .map((row: any) => {
            const isMasterSuperAdmin = row.email?.toLowerCase() === 'gnunezgonzalez@icloud.com';
            return {
              id: row.id,
              companyId: isMasterSuperAdmin ? 'ALL' : (row.company_id || DEFAULT_COMPANY_ID),
              email: row.email,
              fullName: row.full_name,
              volunteerId: row.volunteer_id,
              rank: isMasterSuperAdmin ? 'Super Administrador General' : row.rank,
              registrationNumber: isMasterSuperAdmin ? 'SUP-001' : row.registration_number,
              role: isMasterSuperAdmin ? 'SUPER_ADMIN' : row.role,
              status: row.status,
              permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : (row.permissions || {}),
              password: row.password,
              passwordHash: row.password_hash,
              failedLoginAttempts: row.failed_login_attempts || 0,
              lockedUntil: row.locked_until,
              invitedBy: row.invited_by,
              invitedAt: row.invited_at,
              lastLogin: row.last_login,
              createdAt: row.created_at,
            };
          });

        if (!mapped.some(u => u.email.toLowerCase() === 'gnunezgonzalez@icloud.com')) {
          mapped.unshift({ ...DEFAULT_SUPER_ADMIN });
        }
        globalState.users = mapped;
        
        if (companyId && companyId !== 'ALL') {
          return mapped.filter(u => u.companyId === 'ALL' || (u.companyId || DEFAULT_COMPANY_ID) === companyId);
        }
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase query error in serverGetUsers:', e);
    }
  }

  const clean = globalState.users.filter(u => !globalState.deletedUserIds.includes(u.id));
  if (!clean.some(u => u.email.toLowerCase() === 'gnunezgonzalez@icloud.com')) {
    clean.unshift({ ...DEFAULT_SUPER_ADMIN });
  }

  if (companyId && companyId !== 'ALL') {
    return clean.filter(u => u.companyId === 'ALL' || (u.companyId || DEFAULT_COMPANY_ID) === companyId);
  }
  return clean;
};

export const serverSanitizeUser = (user: AppUser): AppUser => {
  const { password, passwordHash, ...safe } = user;
  return safe as AppUser;
};

export const serverGetPublicUsers = async (companyId?: string): Promise<AppUser[]> => {
  const users = await serverGetUsers(companyId);
  return users.map(serverSanitizeUser);
};

export const serverSaveUser = async (user: AppUser): Promise<AppUser> => {
  globalState.deletedUserIds = globalState.deletedUserIds.filter(id => id !== user.id);
  const isMasterSuperAdmin = user.email.toLowerCase() === 'gnunezgonzalez@icloud.com';
  const targetCompanyId = isMasterSuperAdmin ? 'ALL' : (user.companyId || DEFAULT_COMPANY_ID);
  
  const enrichedUser: AppUser = {
    ...user,
    companyId: targetCompanyId,
    role: isMasterSuperAdmin ? 'SUPER_ADMIN' : user.role,
    rank: isMasterSuperAdmin ? 'Super Administrador General' : user.rank,
    registrationNumber: isMasterSuperAdmin ? 'SUP-001' : user.registrationNumber,
    permissions: isMasterSuperAdmin ? {
      canCreateReports: true,
      canEditReports: true,
      canDeleteReports: true,
      canApproveReports: true,
      canManageVolunteers: true,
      canManageUnits: true,
      canManageUsers: true,
      canExportReports: true,
    } : user.permissions,
  };

  const index = globalState.users.findIndex(u => u.id === enrichedUser.id || u.email.toLowerCase() === enrichedUser.email.toLowerCase());
  if (index >= 0) {
    globalState.users[index] = { ...globalState.users[index], ...enrichedUser };
  } else {
    globalState.users.push(enrichedUser);
  }
  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('app_users').upsert({
        id: enrichedUser.id,
        company_id: targetCompanyId,
        email: enrichedUser.email.toLowerCase(),
        full_name: enrichedUser.fullName,
        volunteer_id: enrichedUser.volunteerId,
        rank: enrichedUser.rank,
        registration_number: enrichedUser.registrationNumber,
        role: enrichedUser.role,
        status: enrichedUser.status,
        permissions: enrichedUser.permissions,
        password: enrichedUser.password,
        password_hash: enrichedUser.passwordHash,
        failed_login_attempts: enrichedUser.failedLoginAttempts || 0,
        locked_until: enrichedUser.lockedUntil,
        invited_by: enrichedUser.invitedBy,
        invited_at: enrichedUser.invitedAt,
        last_login: enrichedUser.lastLogin,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase save error in serverSaveUser:', e);
    }
  }

  // If user is active, auto-purge pending invitations for this email
  if (enrichedUser.status === 'ACTIVO') {
    if (globalState.invitations) {
      globalState.invitations = globalState.invitations.filter(i => i.email.toLowerCase() !== enrichedUser.email.toLowerCase());
    }
    if (supabase) {
      try {
        await supabase.from('user_invitations').delete().eq('email', enrichedUser.email.toLowerCase());
      } catch {}
    }
  }

  return enrichedUser;
};

export const serverDeleteUser = async (id: string): Promise<boolean> => {
  // Security guard: prevent deleting master Super Admin
  if (id === 'usr-superadmin-01') {
    return false;
  }
  const user = globalState.users.find(u => u.id === id);
  if (user && (user.email.toLowerCase() === 'gnunezgonzalez@icloud.com' || user.role === 'SUPER_ADMIN')) {
    return false;
  }

  globalState.users = globalState.users.filter(u => u.id !== id);
  if (!globalState.deletedUserIds.includes(id)) {
    globalState.deletedUserIds.push(id);
  }
  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('app_users').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete error in serverDeleteUser:', e);
    }
  }
  return true;
};

export const serverGetInvitations = async (companyId?: string): Promise<any[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map((d: any) => ({
          id: d.id || `inv-${d.token}`,
          companyId: d.company_id || DEFAULT_COMPANY_ID,
          email: d.email,
          fullName: d.full_name,
          role: d.role,
          token: d.token,
          status: d.status,
          invitedBy: d.invited_by,
          invitedAt: d.created_at || d.invited_at,
          expiresAt: d.expires_at,
        }));
        globalState.invitations = mapped;
        if (companyId && companyId !== 'ALL') {
          return mapped.filter(i => (i.companyId || DEFAULT_COMPANY_ID) === companyId);
        }
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase query error in serverGetInvitations:', e);
    }
  }
  const clean = globalState.invitations || [];
  if (companyId && companyId !== 'ALL') {
    return clean.filter((i: any) => (i.companyId || DEFAULT_COMPANY_ID) === companyId);
  }
  return clean;
};

export const serverSaveInvitation = async (inv: any): Promise<any> => {
  const targetCompanyId = inv.companyId || DEFAULT_COMPANY_ID;
  const enriched = { ...inv, companyId: targetCompanyId };
  if (!globalState.invitations) globalState.invitations = [];
  globalState.invitations = globalState.invitations.filter((i: any) => i.email.toLowerCase() !== inv.email.toLowerCase());
  globalState.invitations.unshift(enriched);
  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('user_invitations').upsert({
        company_id: targetCompanyId,
        email: inv.email.toLowerCase(),
        full_name: inv.fullName,
        role: inv.role,
        token: inv.token,
        status: inv.status || 'PENDING',
        invited_by: inv.invitedBy,
        created_at: inv.invitedAt || new Date().toISOString(),
        expires_at: inv.expiresAt,
      }, { onConflict: 'email' });
    } catch (e) {
      console.warn('Supabase save error in serverSaveInvitation:', e);
    }
  }
  return enriched;
};

export const serverDeleteInvitation = async (emailOrToken: string): Promise<boolean> => {
  if (!globalState.invitations) globalState.invitations = [];
  globalState.invitations = globalState.invitations.filter(
    (i: any) => i.email.toLowerCase() !== emailOrToken.toLowerCase() && i.token !== emailOrToken && i.id !== emailOrToken
  );
  bumpRevision();

  if (supabase) {
    try {
      await supabase
        .from('user_invitations')
        .delete()
        .or(`email.eq.${emailOrToken.toLowerCase()},token.eq.${emailOrToken}`);
    } catch (e) {
      console.warn('Supabase delete error in serverDeleteInvitation:', e);
    }
  }
  return true;
};

// ----------------------------------------------------------------------
// SYNC STATE API
// ----------------------------------------------------------------------

export const serverGetSyncState = () => {
  return {
    revision: globalState.revision,
    lastUpdate: globalState.lastUpdate,
    companiesCount: (globalState.companies || []).length,
    reportsCount: globalState.reports.length,
    volunteersCount: globalState.volunteers.length,
    unitsCount: globalState.units.length,
    usersCount: globalState.users.length,
    invitationsCount: (globalState.invitations || []).length,
    deletedCompanyIds: globalState.deletedCompanyIds,
    deletedReportIds: globalState.deletedReportIds,
    deletedVolunteerIds: globalState.deletedVolunteerIds,
    deletedUnitCodes: globalState.deletedUnitCodes,
    deletedUserIds: globalState.deletedUserIds,
  };
};
