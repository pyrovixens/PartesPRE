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

    if (!data || data.length === 0) {
      return getStoredReports();
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
      alertTime: row.alert_time,
      time6_0: row.time_6_0,
      time6_7: row.time_6_7,
      time6_8: row.time_6_8,
      time6_10: row.time_6_10,
      responseTimeMinutes: Number(row.response_time_minutes || 0),
      controlTimeMinutes: Number(row.control_time_minutes || 0),
      totalDurationMinutes: Number(row.total_duration_minutes || 0),
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
      alert_time: report.alertTime,
      time_6_0: report.time6_0,
      time_6_7: report.time6_7,
      time_6_8: report.time6_8,
      time_6_10: report.time6_10,
      response_time_minutes: report.responseTimeMinutes,
      control_time_minutes: report.controlTimeMinutes,
      total_duration_minutes: report.totalDurationMinutes,
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
      created_at: report.createdAt,
      updated_at: new Date().toISOString(),
      approved_by: report.approvedBy,
      approved_at: report.approvedAt,
    };

    const { error } = await supabase
      .from('emergency_reports')
      .upsert(dbPayload, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting report to Supabase:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception saving report to Supabase:', err);
    return false;
  }
};

export const deleteReportFromDatabase = async (reportId: string): Promise<boolean> => {
  const currentLocal = getStoredReports().filter(r => r.id !== reportId);
  saveReports(currentLocal);

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

    if (error || !data || data.length === 0) {
      return getStoredVolunteers();
    }

    const mapped: Volunteer[] = data.map(row => ({
      id: row.id,
      rut: row.rut,
      registrationNumber: row.registration_number,
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
    return getStoredVolunteers();
  }
};

export const saveVolunteerToDatabase = async (volunteer: Volunteer): Promise<boolean> => {
  const currentLocal = getStoredVolunteers();
  const exists = currentLocal.some(v => v.id === volunteer.id);
  const updated = exists ? currentLocal.map(v => v.id === volunteer.id ? volunteer : v) : [...currentLocal, volunteer];
  saveVolunteers(updated);

  if (!isSupabaseConfigured() || !supabase) {
    return true;
  }

  try {
    const dbPayload = {
      id: volunteer.id,
      rut: volunteer.rut,
      registration_number: volunteer.registrationNumber,
      full_name: volunteer.fullName,
      short_name: volunteer.shortName,
      category: volunteer.category,
      rank: volunteer.rank,
      status: volunteer.status,
      phone: volunteer.phone,
      email: volunteer.email,
    };

    const { error } = await supabase
      .from('volunteers')
      .upsert(dbPayload, { onConflict: 'id' });

    return !error;
  } catch (err) {
    return false;
  }
};

export const deleteVolunteerFromDatabase = async (volunteerId: string): Promise<boolean> => {
  const currentLocal = getStoredVolunteers().filter(v => v.id !== volunteerId);
  saveVolunteers(currentLocal);

  if (!isSupabaseConfigured() || !supabase) {
    return true;
  }

  try {
    const { error } = await supabase.from('volunteers').delete().eq('id', volunteerId);
    return !error;
  } catch (err) {
    return false;
  }
};

// -------------------------------------------------------------------
// REALTIME SUBSCRIPTIONS (Live updates across all devices)
// -------------------------------------------------------------------

export const subscribeToRealtimeChanges = (
  onReportsChange: () => void,
  onVolunteersChange: () => void
) => {
  if (!isSupabaseConfigured() || !supabase) {
    return () => {};
  }

  const channel = supabase
    .channel('bomberos_realtime_sync')
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
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
};
