import { EmergencyReport, Volunteer, Unit, EmergencyKey } from '../types';
import { EMERGENCY_KEYS, INITIAL_VOLUNTEERS, INITIAL_UNITS, INITIAL_REPORTS } from '../data/initialData';

const STORAGE_KEYS = {
  REPORTS: 'bomberos_partes_emergencia_v4',
  VOLUNTEERS: 'bomberos_voluntarios_v4',
  UNITS: 'bomberos_unidades_v4',
  KEYS: 'bomberos_claves_v4',
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
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_REPORTS;
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

export const getStoredVolunteers = (): Volunteer[] => {
  if (typeof window === 'undefined') return INITIAL_VOLUNTEERS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.VOLUNTEERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.VOLUNTEERS, JSON.stringify(INITIAL_VOLUNTEERS));
      return INITIAL_VOLUNTEERS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length >= 25 ? parsed : INITIAL_VOLUNTEERS;
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
    version: '4.0',
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
