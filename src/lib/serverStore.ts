import { EmergencyReport, Volunteer, Unit, CompanyBranding, AppUser } from '../types';
import { INITIAL_REPORTS, INITIAL_VOLUNTEERS, INITIAL_UNITS } from '../data/initialData';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseKey && supabaseUrl.startsWith('https://'))
  ? createClient(supabaseUrl, supabaseKey)
  : null;

interface ServerState {
  reports: EmergencyReport[];
  volunteers: Volunteer[];
  units: Unit[];
  branding: CompanyBranding;
  users: AppUser[];
  invitations?: any[];
  deletedReportIds: string[];
  deletedVolunteerIds: string[];
  deletedUnitCodes: string[];
  deletedUserIds: string[];
  revision: number;
  lastUpdate: string;
}

const DEFAULT_BRANDING: CompanyBranding = {
  companyName: '4ª Compañía "Bomba Calle Larga"',
  fireDepartment: 'Cuerpo de Bomberos de Los Andes',
  motto: 'Honor, Disciplina y Abnegación',
  logoUrl: '/logo_4ta_calle_larga.png',
  primaryColor: '#8B0000',
  accentColor: '#DC2626',
};

const DEFAULT_SUPER_ADMIN: AppUser = {
  id: 'usr-superadmin-01',
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
  reports: [...INITIAL_REPORTS],
  volunteers: [...INITIAL_VOLUNTEERS],
  units: [...INITIAL_UNITS],
  branding: { ...DEFAULT_BRANDING },
  users: [{ ...DEFAULT_SUPER_ADMIN }],
  deletedReportIds: [],
  deletedVolunteerIds: [],
  deletedUnitCodes: [],
  deletedUserIds: [],
  revision: 1,
  lastUpdate: new Date().toISOString(),
};

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
// REPORTS API
// ----------------------------------------------------------------------

export const serverGetDeletedReportIds = (): string[] => {
  return globalState.deletedReportIds || [];
};

export const serverGetReports = async (): Promise<EmergencyReport[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('emergency_reports')
        .select('*')
        .order('incident_date', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: EmergencyReport[] = data
          .map((row: any) => ({
            id: row.id,
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
            approvedBy: row.approved_by,
            approvedAt: row.approved_at,
            captainName: row.captain_name,
            captainRank: row.captain_rank,
            digitalSignature: row.digital_signature && Object.keys(row.digital_signature).length > 0 ? row.digital_signature : undefined,
          }));

        // Strict Deduplication
        const seenIds = new Set<string>();
        const seenFolios = new Set<string>();
        globalState.reports = mapped.filter(r => {
          if (globalState.deletedReportIds.includes(r.id)) return false;
          const key = `${r.folioYear}-${r.correlativoCompania || r.fullFolio || r.folioNumber}`;
          if (seenIds.has(r.id) || seenFolios.has(key)) return false;
          seenIds.add(r.id);
          seenFolios.add(key);
          return true;
        });

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
    const key = `${r.folioYear}-${r.correlativoCompania || r.fullFolio || r.folioNumber}`;
    if (seenIds.has(r.id) || seenFolios.has(key)) return false;
    seenIds.add(r.id);
    seenFolios.add(key);
    return true;
  });

  return globalState.reports;
};

export const serverSaveReport = async (report: EmergencyReport): Promise<EmergencyReport> => {
  // If report was previously deleted, un-delete it
  globalState.deletedReportIds = globalState.deletedReportIds.filter(id => id !== report.id);

  // Match by ID OR by same Folio in the same Year
  const reportKey = `${report.folioYear}-${report.correlativoCompania || report.fullFolio || report.folioNumber}`;
  const index = globalState.reports.findIndex(r => 
    r.id === report.id || 
    `${r.folioYear}-${r.correlativoCompania || r.fullFolio || r.folioNumber}` === reportKey
  );

  if (index >= 0) {
    globalState.reports[index] = { ...report, id: globalState.reports[index].id || report.id };
  } else {
    globalState.reports.unshift(report);
  }

  // Deduplicate array
  const seenIds = new Set<string>();
  const seenFolios = new Set<string>();
  globalState.reports = globalState.reports.filter(r => {
    const key = `${r.folioYear}-${r.correlativoCompania || r.fullFolio || r.folioNumber}`;
    if (seenIds.has(r.id) || seenFolios.has(key)) return false;
    seenIds.add(r.id);
    seenFolios.add(key);
    return true;
  });

  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('emergency_reports').upsert({
        id: report.id,
        folio_year: report.folioYear,
        folio_number: report.folioNumber,
        full_folio: report.fullFolio,
        correlativo_compania: report.correlativoCompania,
        correlativo_comandancia: report.correlativoComandancia,
        incident_date: report.incidentDate,
        incident_time: report.incidentTime || '12:00',
        key_code: report.keyCode,
        key_description: report.keyDescription,
        category: report.category,
        address: report.address,
        corner_or_reference: report.cornerOrReference,
        sector: report.sector,
        commune: report.commune,
        officer_in_charge_id: report.officerInChargeId,
        officer_in_charge_name: report.officerInChargeName,
        officer_in_charge_rank: report.officerInChargeRank,
        units: report.units,
        attendees: report.attendees,
        total_firefighters: report.totalFirefighters,
        caller_name: report.callerName,
        caller_phone: report.callerPhone,
        affected_property_type: report.affectedPropertyType,
        damage_level: report.damageLevel,
        injured_count: report.injuredCount,
        fatal_count: report.fatalCount,
        civilian_injured_count: report.civilianInjuredCount,
        firefighter_injured_count: report.firefighterInjuredCount,
        external_agencies: report.externalAgencies,
        summary_notes: report.summaryNotes,
        status: report.status,
        created_by: report.createdBy,
        approved_by: report.approvedBy,
        approved_at: report.approvedAt,
        captain_name: report.captainName,
        captain_rank: report.captainRank,
        digital_signature: report.digitalSignature || {},
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase save error in serverSaveReport:', e);
    }
  }

  return report;
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

export const serverGetVolunteers = async (): Promise<Volunteer[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .order('registration_number', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: Volunteer[] = data
          .filter((row: any) => !globalState.deletedVolunteerIds.includes(row.id))
          .map((row: any) => ({
            id: row.id,
            registrationNumber: row.registration_number,
            rut: row.rut,
            fullName: row.full_name,
            shortName: row.short_name,
            category: row.category,
            rank: row.rank,
            status: row.status,
            phone: row.phone,
            email: row.email,
          }));
        globalState.volunteers = mapped;
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase query error in serverGetVolunteers:', e);
    }
  }
  return globalState.volunteers.filter(v => !globalState.deletedVolunteerIds.includes(v.id));
};

export const serverSaveVolunteer = async (vol: Volunteer): Promise<Volunteer> => {
  globalState.deletedVolunteerIds = globalState.deletedVolunteerIds.filter(id => id !== vol.id);
  const index = globalState.volunteers.findIndex(v => v.id === vol.id);
  if (index >= 0) {
    globalState.volunteers[index] = vol;
  } else {
    globalState.volunteers.push(vol);
  }
  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('volunteers').upsert({
        id: vol.id,
        registration_number: vol.registrationNumber,
        rut: vol.rut,
        full_name: vol.fullName,
        short_name: vol.shortName,
        category: vol.category,
        rank: vol.rank,
        status: vol.status,
        phone: vol.phone,
        email: vol.email,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase save error in serverSaveVolunteer:', e);
    }
  }
  return vol;
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

export const serverGetUnits = async (): Promise<Unit[]> => {
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
            name: row.name,
            plate: row.plate || '',
            type: row.type || 'Bomba',
            currentKm: row.current_km || 0,
            currentPumpHours: row.current_pump_hours || 0,
            status: row.status || 'Operativo',
          }));
        globalState.units = mapped;
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase query error in serverGetUnits:', e);
    }
  }
  return globalState.units.filter(u => !globalState.deletedUnitCodes.includes(u.code));
};

export const serverSaveUnit = async (unit: Unit): Promise<Unit> => {
  globalState.deletedUnitCodes = globalState.deletedUnitCodes.filter(c => c !== unit.code);
  const index = globalState.units.findIndex(u => u.code === unit.code);
  if (index >= 0) {
    globalState.units[index] = unit;
  } else {
    globalState.units.push(unit);
  }
  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('units').upsert({
        code: unit.code,
        name: unit.name,
        plate: unit.plate,
        type: unit.type,
        current_km: unit.currentKm,
        current_pump_hours: unit.currentPumpHours,
        status: unit.status,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'code' });
    } catch (e) {
      console.warn('Supabase save error in serverSaveUnit:', e);
    }
  }
  return unit;
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

export const serverGetBranding = async (): Promise<CompanyBranding> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('company_branding')
        .select('*')
        .limit(1)
        .single();

      if (!error && data) {
        const mapped: CompanyBranding = {
          companyName: data.company_name,
          fireDepartment: data.fire_department,
          motto: data.motto,
          logoUrl: data.logo_url,
          primaryColor: data.primary_color,
          accentColor: data.accent_color,
        };
        globalState.branding = mapped;
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase query error in serverGetBranding:', e);
    }
  }
  return globalState.branding;
};

export const serverSaveBranding = async (branding: CompanyBranding): Promise<CompanyBranding> => {
  globalState.branding = branding;
  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('company_branding').upsert({
        id: 'default_branding',
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
  return branding;
};

// ----------------------------------------------------------------------
// USERS API
// ----------------------------------------------------------------------

export const serverGetDeletedUserIds = (): string[] => {
  return globalState.deletedUserIds || [];
};

export const serverGetUsers = async (): Promise<AppUser[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: AppUser[] = data
          .filter((row: any) => !globalState.deletedUserIds.includes(row.id))
          .map((row: any) => ({
            id: row.id,
            email: row.email,
            fullName: row.full_name,
            volunteerId: row.volunteer_id,
            rank: row.rank,
            registrationNumber: row.registration_number,
            role: row.role,
            status: row.status,
            permissions: row.permissions || {},
            password: row.password,
            passwordHash: row.password_hash,
            failedLoginAttempts: row.failed_login_attempts || 0,
            lockedUntil: row.locked_until,
            invitedBy: row.invited_by,
            invitedAt: row.invited_at,
            lastLogin: row.last_login,
            createdAt: row.created_at,
          }));
        globalState.users = mapped;
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase query error in serverGetUsers:', e);
    }
  }
  return globalState.users.filter(u => !globalState.deletedUserIds.includes(u.id));
};

export const serverSaveUser = async (user: AppUser): Promise<AppUser> => {
  globalState.deletedUserIds = globalState.deletedUserIds.filter(id => id !== user.id);
  const index = globalState.users.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  if (index >= 0) {
    globalState.users[index] = { ...globalState.users[index], ...user };
  } else {
    globalState.users.push(user);
  }
  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('app_users').upsert({
        id: user.id,
        email: user.email.toLowerCase(),
        full_name: user.fullName,
        volunteer_id: user.volunteerId,
        rank: user.rank,
        registration_number: user.registrationNumber,
        role: user.role,
        status: user.status,
        permissions: user.permissions,
        password: user.password,
        password_hash: user.passwordHash,
        failed_login_attempts: user.failedLoginAttempts || 0,
        locked_until: user.lockedUntil,
        invited_by: user.invitedBy,
        invited_at: user.invitedAt,
        last_login: user.lastLogin,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase save error in serverSaveUser:', e);
    }
  }
  return user;
};

export const serverDeleteUser = async (id: string): Promise<boolean> => {
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

export const serverGetInvitations = async (): Promise<any[]> => {
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
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase query error in serverGetInvitations:', e);
    }
  }
  return globalState.invitations || [];
};

export const serverSaveInvitation = async (inv: any): Promise<any> => {
  if (!globalState.invitations) globalState.invitations = [];
  globalState.invitations = globalState.invitations.filter((i: any) => i.email.toLowerCase() !== inv.email.toLowerCase());
  globalState.invitations.unshift(inv);
  bumpRevision();

  if (supabase) {
    try {
      await supabase.from('user_invitations').upsert({
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
  return inv;
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
    reportsCount: globalState.reports.length,
    volunteersCount: globalState.volunteers.length,
    unitsCount: globalState.units.length,
    usersCount: globalState.users.length,
    invitationsCount: (globalState.invitations || []).length,
    deletedReportIds: globalState.deletedReportIds,
    deletedVolunteerIds: globalState.deletedVolunteerIds,
    deletedUnitCodes: globalState.deletedUnitCodes,
    deletedUserIds: globalState.deletedUserIds,
  };
};
