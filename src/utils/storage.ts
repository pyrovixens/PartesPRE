import { EmergencyReport, Volunteer, Unit, EmergencyKey } from '../types';
import { EMERGENCY_KEYS, INITIAL_VOLUNTEERS, INITIAL_UNITS, INITIAL_REPORTS } from '../data/initialData';

const STORAGE_KEYS = {
  REPORTS: 'bomberos_partes_emergencia_v5',
  VOLUNTEERS: 'bomberos_voluntarios_v5',
  UNITS: 'bomberos_unidades_v5',
  KEYS: 'bomberos_claves_v5',
};

export const getStoredReports = (): EmergencyReport[] => {
  if (typeof window === 'undefined') return INITIAL_REPORTS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
      return INITIAL_REPORTS;
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      // Heal any report where captain or reviewer was erroneously set to Enrique instead of José Vargas
      return parsed.map((rep: EmergencyReport) => {
        let updated = { ...rep };
        const hasEnriqueAsCaptain = 
          (rep.captainName && rep.captainName.toLowerCase().includes('enrique')) ||
          (rep.approvedBy && rep.approvedBy.toLowerCase().includes('enrique')) ||
          (rep.digitalSignature?.signedBy && rep.digitalSignature.signedBy.toLowerCase().includes('enrique'));

        if (hasEnriqueAsCaptain) {
          updated.captainName = 'José Vargas Ortega';
          updated.captainRank = 'Capitán';
          if (updated.approvedBy && updated.approvedBy.toLowerCase().includes('enrique')) {
            updated.approvedBy = 'José Vargas Ortega';
          }
          if (updated.digitalSignature && updated.digitalSignature.signedBy?.toLowerCase().includes('enrique')) {
            updated.digitalSignature = {
              ...updated.digitalSignature,
              signedBy: 'José Vargas Ortega',
              signedByRank: 'Capitán',
            };
          }
        }
        return updated;
      });
    }
    return INITIAL_REPORTS;
  } catch (e) {
    console.error('Error loading reports from localStorage:', e);
    return INITIAL_REPORTS;
  }
};

export const saveReports = (reports: EmergencyReport[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  } catch (e) {
    console.error('Error saving reports:', e);
  }
};

const getDeletedVolunteerIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('bomberos_deleted_volunteer_ids');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getStoredVolunteers = (): Volunteer[] => {
  if (typeof window === 'undefined') return INITIAL_VOLUNTEERS;
  try {
    const deletedIds = getDeletedVolunteerIds();
    const data = localStorage.getItem(STORAGE_KEYS.VOLUNTEERS);
    if (!data) {
      const initialClean = INITIAL_VOLUNTEERS.filter(v => !deletedIds.includes(v.id));
      localStorage.setItem(STORAGE_KEYS.VOLUNTEERS, JSON.stringify(initialClean));
      return initialClean;
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      const cleaned = parsed
        .filter((pv: Volunteer) => !deletedIds.includes(pv.id))
        .map((pv: Volunteer) => {
          const isRankMachinist = pv.rank === 'Maquinista General' || pv.rank === 'Maquinista';
          const isDriver = isRankMachinist || (pv.isDriver === true && !!pv.driverLicense && pv.driverLicense !== 'NO');
          const driverLicense = isDriver 
            ? (pv.driverLicense && pv.driverLicense !== 'NO' ? pv.driverLicense : 'Clase F') 
            : undefined;
          
          let rank = pv.rank || 'Bombero Activo';
          if (pv.id === 'vol-a-06' || pv.fullName?.toLowerCase().includes('josé vargas') || pv.fullName?.toLowerCase().includes('jose vargas')) {
            rank = 'Capitán';
          } else if (pv.id === 'vol-a-11' || pv.fullName?.toLowerCase().includes('enrique vargas')) {
            if (rank === 'Capitán') rank = 'Bombero Activo';
          }

          return {
            ...pv,
            rank,
            isDriver,
            driverLicense,
          };
        });
      localStorage.setItem(STORAGE_KEYS.VOLUNTEERS, JSON.stringify(cleaned));
      return cleaned;
    }
    return INITIAL_VOLUNTEERS.filter(v => !deletedIds.includes(v.id));
  } catch (e) {
    console.error('Error loading volunteers:', e);
    return INITIAL_VOLUNTEERS;
  }
};

export const saveVolunteers = (volunteers: Volunteer[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.VOLUNTEERS, JSON.stringify(volunteers));
  } catch (e) {
    console.error('Error saving volunteers:', e);
  }
};

export const getStoredUnits = (): Unit[] => {
  if (typeof window === 'undefined') return INITIAL_UNITS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.UNITS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(INITIAL_UNITS));
      return INITIAL_UNITS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_UNITS;
  } catch (e) {
    console.error('Error loading units:', e);
    return INITIAL_UNITS;
  }
};

export const saveUnits = (units: Unit[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
  } catch (e) {
    console.error('Error saving units:', e);
  }
};

export const getStoredKeys = (): EmergencyKey[] => {
  if (typeof window === 'undefined') return EMERGENCY_KEYS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.KEYS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.KEYS, JSON.stringify(EMERGENCY_KEYS));
      return EMERGENCY_KEYS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : EMERGENCY_KEYS;
  } catch (e) {
    console.error('Error loading keys:', e);
    return EMERGENCY_KEYS;
  }
};

export const saveKeys = (keys: EmergencyKey[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.KEYS, JSON.stringify(keys));
  } catch (e) {
    console.error('Error saving keys:', e);
  }
};

// -------------------------------------------------------------------
// BACKUP & RESTORE HELPERS
// -------------------------------------------------------------------

export const exportAllDataBackup = (): string => {
  const backup = {
    version: '5.0',
    exportDate: new Date().toISOString(),
    company: '4ª Compañía Calle Larga - C.B. Los Andes',
    reports: getStoredReports(),
    volunteers: getStoredVolunteers(),
    units: getStoredUnits(),
    keys: getStoredKeys(),
  };

  return JSON.stringify(backup, null, 2);
};

export const importDataBackup = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    if (data.reports && Array.isArray(data.reports)) saveReports(data.reports);
    if (data.volunteers && Array.isArray(data.volunteers)) saveVolunteers(data.volunteers);
    if (data.units && Array.isArray(data.units)) saveUnits(data.units);
    if (data.keys && Array.isArray(data.keys)) saveKeys(data.keys);
    return true;
  } catch (e) {
    console.error('Error importing backup:', e);
    return false;
  }
};

export const resetToInitialData = (): void => {
  if (typeof window === 'undefined') return;
  saveReports(INITIAL_REPORTS);
  saveVolunteers(INITIAL_VOLUNTEERS);
  saveUnits(INITIAL_UNITS);
  saveKeys(EMERGENCY_KEYS);
};
