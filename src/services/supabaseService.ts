import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { EmergencyReport, Volunteer, Unit, EmergencyKey, UserProfile } from '../types';
import { 
  getStoredReports, 
  saveReports, 
  getStoredVolunteers, 
  saveVolunteers, 
  getStoredUnits, 
  saveUnits, 
  getStoredKeys 
} from '../utils/storage';

// -------------------------------------------------------------------
// EMERGENCY REPORTS SERVICE
// -------------------------------------------------------------------

export const fetchReports = async (): Promise<EmergencyReport[]> => {
  if (!isSupabaseConfigured() || !supabase) {
    return getStoredReports();
  }

  try {
    const { data, error } = await supabase
      .from('emergency_reports')
      .select('*')
      .order('incident_date', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error, fallback to local storage:', error.message);
      return getStoredReports();
    }

    if (!data) {
      return getStoredReports();
    }

    if (data.length === 0) {
      const initial = getStoredReports();
      if (initial.length > 0) {
        Promise.all(initial.map(rep => saveReportToDatabase(rep))).catch(e => console.warn('Seeding initial reports:', e));
        return initial;
      }
      return [];
    }

    // Map database fields to frontend model
    const mapped: EmergencyReport[] = data.map(row => ({
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
      externalAgencies: row.external_agencies || {
        carabineros: false,
        samu: false,
        conaf: false,
        cgeChilquinta: false,
        municipalidad: false,
        seguridadCiudadana: false,
      },
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

    // Cache locally
    saveReports(mapped);
    return mapped;
  } catch (err) {
    console.error('Error fetching reports from Supabase:', err);
    return getStoredReports();
  }
};

export const saveReportToDatabase = async (report: EmergencyReport): Promise<boolean> => {
  // Always update local cache first
  const currentLocal = getStoredReports();
  const existsLocal = currentLocal.some(r => r.id === report.id);
  const updatedLocal = existsLocal 
    ? currentLocal.map(r => r.id === report.id ? report : r)
    : [report, ...currentLocal];
  saveReports(updatedLocal);
  broadcastLiveChange('REPORT_CHANGED', report);

  if (!isSupabaseConfigured() || !supabase) {
    return true;
  }

  try {
    const dbPayload = {
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
    };

    const { error } = await supabase
      .from('emergency_reports')
      .upsert(dbPayload, { onConflict: 'id' });

    if (error) {
      console.error('Error saving report to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception saving report to Supabase:', err);
    return false;
  }
};

export const deleteReportFromDatabase = async (reportId: string): Promise<boolean> => {
  const current = getStoredReports();
  const updated = current.filter(r => r.id !== reportId);
  saveReports(updated);
  broadcastLiveChange('REPORT_CHANGED', { id: reportId });

  if (!isSupabaseConfigured() || !supabase) {
    return true;
  }

  try {
    const { error } = await supabase
      .from('emergency_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('Error deleting report from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception deleting report from Supabase:', err);
    return false;
  }
};

// -------------------------------------------------------------------
// VOLUNTEERS SERVICE
// -------------------------------------------------------------------

export const fetchVolunteers = async (): Promise<Volunteer[]> => {
  if (!isSupabaseConfigured() || !supabase) {
    return getStoredVolunteers();
  }

  try {
    const { data, error } = await supabase
      .from('volunteers')
      .select('*')
      .order('registration_number', { ascending: true });

    if (error) {
      console.warn('Supabase volunteers fetch error:', error.message);
      return getStoredVolunteers();
    }

    if (!data) {
      return getStoredVolunteers();
    }

    if (data.length === 0) {
      const initial = getStoredVolunteers();
      if (initial.length > 0) {
        Promise.all(initial.map(vol => saveVolunteerToDatabase(vol))).catch(e => console.warn('Seeding initial volunteers:', e));
        return initial;
      }
      return [];
    }

    const mapped: Volunteer[] = data.map(row => ({
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

    saveVolunteers(mapped);
    return mapped;
  } catch (err) {
    console.error('Error fetching volunteers from Supabase:', err);
    return getStoredVolunteers();
  }
};

export const saveVolunteerToDatabase = async (volunteer: Volunteer): Promise<boolean> => {
  const current = getStoredVolunteers();
  const exists = current.some(v => v.id === volunteer.id);
  const updated = exists ? current.map(v => v.id === volunteer.id ? volunteer : v) : [...current, volunteer];
  saveVolunteers(updated);
  broadcastLiveChange('VOLUNTEER_CHANGED', volunteer);

  if (!isSupabaseConfigured() || !supabase) {
    return true;
  }

  try {
    const { error } = await supabase
      .from('volunteers')
      .upsert({
        id: volunteer.id,
        registration_number: volunteer.registrationNumber,
        rut: volunteer.rut,
        full_name: volunteer.fullName,
        short_name: volunteer.shortName,
        category: volunteer.category,
        rank: volunteer.rank,
        status: volunteer.status,
        phone: volunteer.phone,
        email: volunteer.email,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error saving volunteer to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception saving volunteer to Supabase:', err);
    return false;
  }
};

export const deleteVolunteerFromDatabase = async (volunteerId: string): Promise<boolean> => {
  const current = getStoredVolunteers();
  const updated = current.filter(v => v.id !== volunteerId);
  saveVolunteers(updated);
  broadcastLiveChange('VOLUNTEER_CHANGED', { id: volunteerId });

  if (!isSupabaseConfigured() || !supabase) {
    return true;
  }

  try {
    const { error } = await supabase
      .from('volunteers')
      .delete()
      .eq('id', volunteerId);

    if (error) {
      console.error('Error deleting volunteer from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception deleting volunteer from Supabase:', err);
    return false;
  }
};

// -------------------------------------------------------------------
// UNITS SERVICE
// -------------------------------------------------------------------

export const fetchUnits = async (): Promise<Unit[]> => {
  if (!isSupabaseConfigured() || !supabase) {
    return getStoredUnits();
  }

  try {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('code', { ascending: true });

    if (error) {
      console.warn('Supabase units fetch error:', error.message);
      return getStoredUnits();
    }

    if (!data) {
      return getStoredUnits();
    }

    if (data.length === 0) {
      const initial = getStoredUnits();
      if (initial.length > 0) {
        Promise.all(initial.map(u => saveUnitToDatabase(u))).catch(e => console.warn('Seeding initial units:', e));
        return initial;
      }
      return [];
    }

    const mapped: Unit[] = data.map(row => ({
      code: row.code,
      name: row.name,
      plate: row.plate || row.plate_number || '',
      type: row.type || 'Bomba',
      currentKm: row.current_km || row.currentKm || 0,
      currentPumpHours: row.current_pump_hours || row.currentPumpHours || 0,
      status: row.status || 'Operativo',
    }));

    saveUnits(mapped);
    return mapped;
  } catch (err) {
    console.error('Error fetching units from Supabase:', err);
    return getStoredUnits();
  }
};

export const saveUnitToDatabase = async (unit: Unit): Promise<boolean> => {
  const current = getStoredUnits();
  const exists = current.some(u => u.code === unit.code);
  const updated = exists 
    ? current.map(u => u.code === unit.code ? unit : u)
    : [...current, unit];
  saveUnits(updated);
  broadcastLiveChange('UNIT_CHANGED', unit);

  if (!isSupabaseConfigured() || !supabase) {
    return true;
  }

  try {
    const { error } = await supabase
      .from('units')
      .upsert({
        code: unit.code,
        name: unit.name,
        type: unit.type,
        status: unit.status,
        plate: unit.plate,
        current_km: unit.currentKm,
        current_pump_hours: unit.currentPumpHours,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'code' });

    if (error) {
      console.error('Error saving unit to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception saving unit to Supabase:', err);
    return false;
  }
};

export const deleteUnitFromDatabase = async (unitCode: string): Promise<boolean> => {
  const current = getStoredUnits();
  const updated = current.filter(u => u.code !== unitCode);
  saveUnits(updated);
  broadcastLiveChange('UNIT_CHANGED', { code: unitCode });

  if (!isSupabaseConfigured() || !supabase) {
    return true;
  }

  try {
    const { error } = await supabase
      .from('units')
      .delete()
      .eq('code', unitCode);

    if (error) {
      console.error('Error deleting unit from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception deleting unit from Supabase:', err);
    return false;
  }
};

// -------------------------------------------------------------------
// BRANDING SERVICE
// -------------------------------------------------------------------

export const fetchBranding = async (): Promise<any | null> => {
  const local = typeof window !== 'undefined' ? localStorage.getItem('bomberos_branding') : null;
  const localParsed = local ? JSON.parse(local) : null;

  if (!isSupabaseConfigured() || !supabase) {
    return localParsed;
  }

  try {
    const { data, error } = await supabase
      .from('company_branding')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      return localParsed;
    }

    const branding = {
      companyName: data.company_name,
      fireDepartment: data.fire_department,
      motto: data.motto,
      logoUrl: data.logo_url,
      primaryColor: data.primary_color,
      accentColor: data.accent_color,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('bomberos_branding', JSON.stringify(branding));
    }
    return branding;
  } catch {
    return localParsed;
  }
};

export const saveBrandingToDatabase = async (branding: any): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('bomberos_branding', JSON.stringify(branding));
  }
  broadcastLiveChange('BRANDING_CHANGED', branding);

  if (!isSupabaseConfigured() || !supabase) {
    return true;
  }

  try {
    const { error } = await supabase
      .from('company_branding')
      .upsert({
        id: 1,
        company_name: branding.companyName,
        fire_department: branding.fireDepartment,
        motto: branding.motto,
        logo_url: branding.logoUrl,
        primary_color: branding.primaryColor,
        accent_color: branding.accentColor,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      console.warn('Could not save branding to Supabase:', error.message);
    }
    return true;
  } catch {
    return true;
  }
};

// -------------------------------------------------------------------
// HIGH-SPEED BROADCAST CHANNEL FOR LIVE TAB & WINDOW SYNC
// -------------------------------------------------------------------

const getBroadcastChannel = () => {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      return new BroadcastChannel('bomberos_live_sync_channel');
    } catch {
      return null;
    }
  }
  return null;
};

export const broadcastLiveChange = (type: string, payload?: any) => {
  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage({ type, payload, timestamp: Date.now() });
      channel.close();
    } catch {
      // Ignore broadcast errors
    }
  }
};

// -------------------------------------------------------------------
// REALTIME SUBSCRIPTION (SUPABASE WEBSOCKETS + BROADCAST CHANNEL + STORAGE)
// -------------------------------------------------------------------

export const subscribeToRealtimeChanges = (
  onReportsChange: () => void,
  onVolunteersChange: () => void,
  onUnitsChange?: () => void,
  onBrandingChange?: () => void
) => {
  // 1. Local Broadcast Channel for instant device/tab syncing
  const localChannel = getBroadcastChannel();
  if (localChannel) {
    localChannel.onmessage = (event) => {
      const { type } = event.data || {};
      if (type === 'REPORT_CHANGED') {
        onReportsChange();
      } else if (type === 'VOLUNTEER_CHANGED') {
        onVolunteersChange();
      } else if (type === 'UNIT_CHANGED' && onUnitsChange) {
        onUnitsChange();
      } else if (type === 'BRANDING_CHANGED' && onBrandingChange) {
        onBrandingChange();
      }
    };
  }

  // 2. Storage event fallback for cross-tab sync
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === 'bomberos_emergency_reports') {
      onReportsChange();
    } else if (e.key === 'bomberos_volunteers') {
      onVolunteersChange();
    } else if (e.key === 'bomberos_units' && onUnitsChange) {
      onUnitsChange();
    } else if (e.key === 'bomberos_branding' && onBrandingChange) {
      onBrandingChange();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
  }

  // 3. Supabase Cloud Realtime Channel for multi-device live sync
  let supabaseChannel: any = null;

  if (isSupabaseConfigured() && supabase) {
    try {
      supabaseChannel = supabase
        .channel('schema-db-live-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'emergency_reports' },
          () => {
            onReportsChange();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'volunteers' },
          () => {
            onVolunteersChange();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'units' },
          () => {
            if (onUnitsChange) onUnitsChange();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'company_branding' },
          () => {
            if (onBrandingChange) onBrandingChange();
          }
        )
        .subscribe();
    } catch (err) {
      console.error('Error setting up Supabase Realtime subscription:', err);
    }
  }

  return () => {
    if (localChannel) {
      localChannel.close();
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent);
    }
    if (supabase && supabaseChannel) {
      supabase.removeChannel(supabaseChannel);
    }
  };
};
