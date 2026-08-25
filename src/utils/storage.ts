import { EmergencyReport, Volunteer, Unit, EmergencyKey } from '../types';
import { EMERGENCY_KEYS, INITIAL_VOLUNTEERS, INITIAL_UNITS, INITIAL_REPORTS } from '../data/initialData';

const STORAGE_KEYS = {
  REPORTS: 'bomberos_partes_emergencia_v1',
  VOLUNTEERS: 'bomberos_voluntarios_v1',
  UNITS: 'bomberos_unidades_v1',
  KEYS: 'bomberos_claves_v1',
};

export const getStoredReports = (): EmergencyReport[] => {
  if (typeof window === 'undefined') return INITIAL_REPORTS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
      return INITIAL_REPORTS;
    }
    return JSON.parse(data);
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
    return JSON.parse(data);
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
    return JSON.parse(data);
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
    return JSON.parse(data);
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

export const resetToInitialData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
  localStorage.setItem(STORAGE_KEYS.VOLUNTEERS, JSON.stringify(INITIAL_VOLUNTEERS));
  localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(INITIAL_UNITS));
  localStorage.setItem(STORAGE_KEYS.KEYS, JSON.stringify(EMERGENCY_KEYS));
};

export const exportAllDataBackup = (): string => {
  const payload = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    institution: '4ta Compañía Calle Larga - Cuerpo de Bomberos Los Andes',
    reports: getStoredReports(),
    volunteers: getStoredVolunteers(),
    units: getStoredUnits(),
    keys: getStoredKeys(),
  };
  return JSON.stringify(payload, null, 2);
};

export const importDataBackup = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.reports) saveReports(data.reports);
    if (data.volunteers) saveVolunteers(data.volunteers);
    if (data.units) saveUnits(data.units);
    if (data.keys) saveKeys(data.keys);
    return true;
  } catch (e) {
    console.error('Error importing backup:', e);
    return false;
  }
};
