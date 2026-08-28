import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { EmergencyReport, Volunteer, Unit, CompanyBranding } from '../types';
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
// DELETED IDS LOCAL STORAGE HELPERS (TOMBSTONES)
// -------------------------------------------------------------------

const getDeletedIds = (key: string): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const addDeletedId = (key: string, id: string) => {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedIds(key);
    if (!current.includes(id)) {
      current.push(id);
      localStorage.setItem(key, JSON.stringify(current));
    }
  } catch {}
};

const mergeDeletedIds = (key: string, serverDeleted: string[]) => {
  if (typeof window === 'undefined' || !serverDeleted || serverDeleted.length === 0) return;
  try {
    const current = getDeletedIds(key);
    const combined = Array.from(new Set([...current, ...serverDeleted]));
    localStorage.setItem(key, JSON.stringify(combined));
  } catch {}
};

const purgeFromAllReportStorages = (reportId: string) => {
  if (typeof window === 'undefined') return;
  const keysToCheck = [
    'bomberos_partes_emergencia_v5', 
    'bomberos_emergency_reports', 
    'bomberos_reports', 
    'bomberos_partes',
    'bomberos_reports_v4',
    'bomberos_partes_v1'
  ];
  for (const k of keysToCheck) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((r: any) => r && r.id !== reportId);
          localStorage.setItem(k, JSON.stringify(filtered));
        }
      }
    } catch {}
  }
};

// -------------------------------------------------------------------
// EMERGENCY REPORTS SERVICE (ONLINE API + SUPABASE + LOCAL CACHE)
// -------------------------------------------------------------------

export const fetchReports = async (): Promise<EmergencyReport[]> => {
  // 1. Fetch from online server API
  let serverReports: EmergencyReport[] = [];
  let serverDeletedIds: string[] = [];

  try {
    const res = await fetch('/api/reports', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        serverReports = json.data;
      }
      if (Array.isArray(json.deletedIds)) {
        serverDeletedIds = json.deletedIds;
        mergeDeletedIds('bomberos_deleted_report_ids', serverDeletedIds);
      }
    }
  } catch (apiErr) {
    console.warn('API /api/reports fetch error:', apiErr);
  }

  // 2. Read local tombstones
  const deletedSet = new Set([...getDeletedIds('bomberos_deleted_report_ids'), ...serverDeletedIds]);

  // 3. Purge deleted from local storages
  for (const delId of Array.from(deletedSet)) {
    purgeFromAllReportStorages(delId);
  }

  // 4. Gather remaining valid local reports
  const localCandidates: EmergencyReport[] = [];
  if (typeof window !== 'undefined') {
    const keysToCheck = [
      'bomberos_partes_emergencia_v5', 
      'bomberos_emergency_reports', 
      'bomberos_reports', 
      'bomberos_partes'
    ];
    for (const k of keysToCheck) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const r of parsed) {
              if (r && r.id && !deletedSet.has(r.id) && !localCandidates.some(c => c.id === r.id)) {
                localCandidates.push(r);
              }
            }
          }
        }
      } catch {}
    }
  }

  // 5. Direct Supabase query if serverReports was empty and Supabase configured
  if (serverReports.length === 0 && isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('emergency_reports')
        .select('*')
        .order('incident_date', { ascending: false });

      if (!error && data && data.length > 0) {
        serverReports = data
          .filter((row: any) => !deletedSet.has(row.id))
          .map(row => ({
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
      }
    } catch (err) {
      console.warn('Direct Supabase fetch error:', err);
    }
  }

  // 6. Auto-upload valid non-deleted local reports missing on server
  const serverIds = new Set(serverReports.map(r => r.id));
  const missingOnServer = localCandidates.filter(r => !serverIds.has(r.id) && !deletedSet.has(r.id));
  if (missingOnServer.length > 0) {
    for (const r of missingOnServer) {
      try {
        fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(r),
        }).catch(() => {});
        serverReports.unshift(r);
      } catch {}
    }
  }

  const finalReports = (serverReports.length > 0 ? serverReports : (localCandidates.length > 0 ? localCandidates : getStoredReports()))
    .filter(r => !deletedSet.has(r.id));

  saveReports(finalReports);
  return finalReports;
};

export const saveReportToDatabase = async (report: EmergencyReport): Promise<boolean> => {
  // If report was previously in deleted set, remove it
  if (typeof window !== 'undefined') {
    const deleted = getDeletedIds('bomberos_deleted_report_ids').filter(id => id !== report.id);
    localStorage.setItem('bomberos_deleted_report_ids', JSON.stringify(deleted));
  }

  // Update local cache immediately
  const currentLocal = getStoredReports().filter(r => r.id !== report.id);
  const updatedLocal = [report, ...currentLocal];
  saveReports(updatedLocal);
  broadcastLiveChange('REPORT_CHANGED', report);

  // 1. Post to centralized online backend API
  try {
    fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    }).catch(e => console.warn('Background /api/reports save error:', e));
  } catch (e) {
    console.warn('API saveReport error:', e);
  }

  // 2. Direct Supabase upsert if configured
  if (isSupabaseConfigured() && supabase) {
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
    } catch (err) {
      console.warn('Supabase upsert error:', err);
    }
  }

  return true;
};

export const deleteReportFromDatabase = async (reportId: string): Promise<boolean> => {
  // 1. Mark as permanently deleted in local tombstones
  addDeletedId('bomberos_deleted_report_ids', reportId);
  purgeFromAllReportStorages(reportId);

  // 2. Update local state cache
  const current = getStoredReports();
  const updated = current.filter(r => r.id !== reportId);
  saveReports(updated);
  broadcastLiveChange('REPORT_CHANGED', { id: reportId, deleted: true });

  // 3. Request deletion on online server API
  try {
    fetch(`/api/reports?id=${encodeURIComponent(reportId)}`, { method: 'DELETE' }).catch(() => {});
  } catch {}

  // 4. Request deletion on Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('emergency_reports').delete().eq('id', reportId);
    } catch {}
  }
  return true;
};

// -------------------------------------------------------------------
// VOLUNTEERS SERVICE (ONLINE API + SUPABASE + LOCAL CACHE)
// -------------------------------------------------------------------

export const fetchVolunteers = async (): Promise<Volunteer[]> => {
  let serverVolunteers: Volunteer[] = [];
  let serverDeletedIds: string[] = [];

  try {
    const res = await fetch('/api/volunteers', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        serverVolunteers = json.data;
      }
      if (Array.isArray(json.deletedIds)) {
        serverDeletedIds = json.deletedIds;
        mergeDeletedIds('bomberos_deleted_volunteer_ids', serverDeletedIds);
      }
    }
  } catch (apiErr) {
    console.warn('API /api/volunteers fetch error:', apiErr);
  }

  const deletedSet = new Set([...getDeletedIds('bomberos_deleted_volunteer_ids'), ...serverDeletedIds]);

  const localCandidates: Volunteer[] = [];
  if (typeof window !== 'undefined') {
    const keysToCheck = ['bomberos_voluntarios_v5', 'bomberos_volunteers', 'bomberos_voluntarios'];
    for (const k of keysToCheck) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const v of parsed) {
              if (v && v.id && !deletedSet.has(v.id) && !localCandidates.some(c => c.id === v.id)) {
                localCandidates.push(v);
              }
            }
          }
        }
      } catch {}
    }
  }

  if (serverVolunteers.length === 0 && isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .order('registration_number', { ascending: true });

      if (!error && data && data.length > 0) {
        serverVolunteers = data
          .filter((row: any) => !deletedSet.has(row.id))
          .map(row => ({
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
      }
    } catch (err) {
      console.warn('Supabase fetchVolunteers error:', err);
    }
  }

  const serverIds = new Set(serverVolunteers.map(v => v.id));
  const missing = localCandidates.filter(v => !serverIds.has(v.id) && !deletedSet.has(v.id));
  if (missing.length > 0) {
    for (const v of missing) {
      try {
        fetch('/api/volunteers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(v),
        }).catch(() => {});
        serverVolunteers.push(v);
      } catch {}
    }
  }

  const finalVolunteers = (serverVolunteers.length > 0 ? serverVolunteers : (localCandidates.length > 0 ? localCandidates : getStoredVolunteers()))
    .filter(v => !deletedSet.has(v.id));

  saveVolunteers(finalVolunteers);
  return finalVolunteers;
};

export const saveVolunteerToDatabase = async (volunteer: Volunteer): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    const deleted = getDeletedIds('bomberos_deleted_volunteer_ids').filter(id => id !== volunteer.id);
    localStorage.setItem('bomberos_deleted_volunteer_ids', JSON.stringify(deleted));
  }

  const current = getStoredVolunteers();
  const exists = current.some(v => v.id === volunteer.id);
  const updated = exists ? current.map(v => v.id === volunteer.id ? volunteer : v) : [...current, volunteer];
  saveVolunteers(updated);
  broadcastLiveChange('VOLUNTEER_CHANGED', volunteer);

  try {
    fetch('/api/volunteers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(volunteer),
    }).catch(() => {});
  } catch {}

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('volunteers').upsert({
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
    } catch {}
  }
  return true;
};

export const deleteVolunteerFromDatabase = async (volunteerId: string): Promise<boolean> => {
  addDeletedId('bomberos_deleted_volunteer_ids', volunteerId);

  const current = getStoredVolunteers();
  const updated = current.filter(v => v.id !== volunteerId);
  saveVolunteers(updated);
  broadcastLiveChange('VOLUNTEER_CHANGED', { id: volunteerId, deleted: true });

  try {
    fetch(`/api/volunteers?id=${encodeURIComponent(volunteerId)}`, { method: 'DELETE' }).catch(() => {});
  } catch {}

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('volunteers').delete().eq('id', volunteerId);
    } catch {}
  }
  return true;
};

// -------------------------------------------------------------------
// UNITS SERVICE (ONLINE API + SUPABASE + LOCAL CACHE)
// -------------------------------------------------------------------

export const fetchUnits = async (): Promise<Unit[]> => {
  let serverUnits: Unit[] = [];
  let serverDeletedCodes: string[] = [];

  try {
    const res = await fetch('/api/units', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        serverUnits = json.data;
      }
      if (Array.isArray(json.deletedCodes)) {
        serverDeletedCodes = json.deletedCodes;
        mergeDeletedIds('bomberos_deleted_unit_codes', serverDeletedCodes);
      }
    }
  } catch {}

  const deletedSet = new Set([...getDeletedIds('bomberos_deleted_unit_codes'), ...serverDeletedCodes]);

  if (serverUnits.length === 0 && isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('code', { ascending: true });

      if (!error && data && data.length > 0) {
        serverUnits = data
          .filter((row: any) => !deletedSet.has(row.code))
          .map(row => ({
            code: row.code,
            name: row.name,
            plate: row.plate || row.plate_number || '',
            type: row.type || 'Bomba',
            currentKm: row.current_km || row.currentKm || 0,
            currentPumpHours: row.current_pump_hours || row.currentPumpHours || 0,
            status: row.status || 'Operativo',
          }));
      }
    } catch {}
  }

  const finalUnits = (serverUnits.length > 0 ? serverUnits : getStoredUnits())
    .filter(u => !deletedSet.has(u.code));

  saveUnits(finalUnits);
  return finalUnits;
};

export const saveUnitToDatabase = async (unit: Unit): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    const deleted = getDeletedIds('bomberos_deleted_unit_codes').filter(c => c !== unit.code);
    localStorage.setItem('bomberos_deleted_unit_codes', JSON.stringify(deleted));
  }

  const current = getStoredUnits();
  const exists = current.some(u => u.code === unit.code);
  const updated = exists ? current.map(u => u.code === unit.code ? unit : u) : [...current, unit];
  saveUnits(updated);
  broadcastLiveChange('UNIT_CHANGED', unit);

  try {
    fetch('/api/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unit),
    }).catch(() => {});
  } catch {}

  if (isSupabaseConfigured() && supabase) {
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
    } catch {}
  }
  return true;
};

export const deleteUnitFromDatabase = async (unitCode: string): Promise<boolean> => {
  addDeletedId('bomberos_deleted_unit_codes', unitCode);

  const current = getStoredUnits();
  const updated = current.filter(u => u.code !== unitCode);
  saveUnits(updated);
  broadcastLiveChange('UNIT_CHANGED', { code: unitCode, deleted: true });

  try {
    fetch(`/api/units?code=${encodeURIComponent(unitCode)}`, { method: 'DELETE' }).catch(() => {});
  } catch {}

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('units').delete().eq('code', unitCode);
    } catch {}
  }
  return true;
};

// -------------------------------------------------------------------
// BRANDING SERVICE (ONLINE API + SUPABASE + LOCAL CACHE)
// -------------------------------------------------------------------

export const fetchBranding = async (): Promise<CompanyBranding | null> => {
  try {
    const res = await fetch('/api/branding', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('bomberos_branding', JSON.stringify(json.data));
        }
        return json.data;
      }
    }
  } catch {}

  const local = typeof window !== 'undefined' ? localStorage.getItem('bomberos_branding') : null;
  return local ? JSON.parse(local) : null;
};

export const saveBrandingToDatabase = async (branding: CompanyBranding): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('bomberos_branding', JSON.stringify(branding));
  }
  broadcastLiveChange('BRANDING_CHANGED', branding);

  try {
    fetch('/api/branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branding),
    }).catch(() => {});
  } catch {}

  if (isSupabaseConfigured() && supabase) {
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
    } catch {}
  }
  return true;
};

// -------------------------------------------------------------------
// BROADCAST CHANNEL FOR INSTANT SAME-BROWSER/DEVICE SYNC
// -------------------------------------------------------------------

const BROADCAST_CHANNEL_NAME = 'bomberos_live_sync_channel';

export const getBroadcastChannel = (): BroadcastChannel | null => {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      return new BroadcastChannel(BROADCAST_CHANNEL_NAME);
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
    } catch {}
  }
};

// -------------------------------------------------------------------
// REALTIME SUBSCRIPTION (ONLINE API POLLING + SUPABASE + BROADCAST)
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

  // 2. Storage event fallback
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === 'bomberos_emergency_reports' || e.key === 'bomberos_partes_emergencia_v5' || e.key === 'bomberos_deleted_report_ids') {
      onReportsChange();
    } else if (e.key === 'bomberos_volunteers' || e.key === 'bomberos_voluntarios_v5' || e.key === 'bomberos_deleted_volunteer_ids') {
      onVolunteersChange();
    } else if ((e.key === 'bomberos_units' || e.key === 'bomberos_unidades_v5' || e.key === 'bomberos_deleted_unit_codes') && onUnitsChange) {
      onUnitsChange();
    } else if (e.key === 'bomberos_branding' && onBrandingChange) {
      onBrandingChange();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
  }

  // 3. Online Server Synchronization (Heartbeat check every 3.5 seconds)
  let lastKnownRevision = -1;
  const pollInterval = setInterval(async () => {
    try {
      const res = await fetch('/api/sync', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.revision === 'number') {
          if (lastKnownRevision !== -1 && data.revision !== lastKnownRevision) {
            onReportsChange();
            onVolunteersChange();
            if (onUnitsChange) onUnitsChange();
            if (onBrandingChange) onBrandingChange();
          }
          lastKnownRevision = data.revision;
        }
      }
    } catch {}
  }, 3500);

  // 4. Supabase Cloud Realtime Channel if configured
  let supabaseChannel: any = null;
  if (isSupabaseConfigured() && supabase) {
    try {
      supabaseChannel = supabase
        .channel('schema-db-live-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_reports' }, () => onReportsChange())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteers' }, () => onVolunteersChange())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, () => onUnitsChange && onUnitsChange())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'company_branding' }, () => onBrandingChange && onBrandingChange())
        .subscribe();
    } catch {}
  }

  return () => {
    if (localChannel) {
      try { localChannel.close(); } catch {}
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent);
    }
    clearInterval(pollInterval);
    if (supabaseChannel && supabase) {
      try { supabase.removeChannel(supabaseChannel); } catch {}
    }
  };
};
