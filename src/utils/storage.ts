import { EmergencyKey, EmergencyReport, Unit, Volunteer } from '../types';
import { EMERGENCY_KEYS } from '../data/initialData';

const KEY_CACHE = 'bomberos_claves_v5';
const LEGACY_SENSITIVE_KEYS = [
  'bomberos_partes_emergencia_v5',
  'bomberos_voluntarios_v5',
  'bomberos_unidades_v5',
];

export const clearSensitiveLegacyCaches = (): void => {
  if (typeof window === 'undefined') return;
  for (const key of LEGACY_SENSITIVE_KEYS) {
    localStorage.removeItem(key);
  }
};

// Los datos operacionales solo viven en memoria durante una sesión autenticada.
export const getStoredReports = (): EmergencyReport[] => [];
export const saveReports = (_reports: EmergencyReport[]): void => undefined;
export const getStoredVolunteers = (): Volunteer[] => [];
export const saveVolunteers = (_volunteers: Volunteer[]): void => undefined;
export const getStoredUnits = (): Unit[] => [];
export const saveUnits = (_units: Unit[]): void => undefined;

export const getStoredKeys = (): EmergencyKey[] => {
  if (typeof window === 'undefined') return EMERGENCY_KEYS;
  try {
    const raw = localStorage.getItem(KEY_CACHE);
    if (!raw) return EMERGENCY_KEYS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : EMERGENCY_KEYS;
  } catch {
    return EMERGENCY_KEYS;
  }
};

export const saveKeys = (keys: EmergencyKey[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_CACHE, JSON.stringify(keys));
};

export const exportAllDataBackup = (): string =>
  JSON.stringify({
    version: '6.0',
    exportDate: new Date().toISOString(),
    keys: getStoredKeys(),
    notice: 'Los datos operacionales se exportan únicamente desde el flujo autorizado del servidor.',
  }, null, 2);

export const importDataBackup = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    if (!Array.isArray(data.keys)) return false;
    saveKeys(data.keys);
    return true;
  } catch {
    return false;
  }
};

export const resetToInitialData = (): void => {
  clearSensitiveLegacyCaches();
  saveKeys(EMERGENCY_KEYS);
};
