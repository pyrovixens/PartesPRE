import { CompanyBranding, EmergencyReport, Unit, Volunteer } from '../types';
import { apiFetch, readApiResult } from '../lib/apiClient';

const requestList = async <T>(path: string): Promise<T[]> => {
  const response = await apiFetch(path);
  const data = await readApiResult<T[]>(response);
  return Array.isArray(data) ? data : [];
};

export const fetchReports = async (): Promise<EmergencyReport[]> =>
  requestList<EmergencyReport>('/api/reports');

export const saveReportToDatabase = async (
  report: EmergencyReport
): Promise<boolean> => {
  const response = await apiFetch('/api/reports', {
    method: 'POST',
    body: JSON.stringify(report),
  });
  await readApiResult<EmergencyReport>(response);
  broadcastLiveChange('report');
  return true;
};

export const approveReportInDatabase = async (
  reportId: string
): Promise<EmergencyReport> => {
  const response = await apiFetch('/api/reports/approve', {
    method: 'POST',
    body: JSON.stringify({ reportId }),
  });
  const report = await readApiResult<EmergencyReport>(response);
  broadcastLiveChange('report');
  return report;
};

export const deleteReportFromDatabase = async (
  reportId: string
): Promise<boolean> => {
  const response = await apiFetch('/api/reports?id=' + encodeURIComponent(reportId), {
    method: 'DELETE',
  });
  await readApiResult<unknown>(response);
  broadcastLiveChange('report');
  return true;
};

export const fetchVolunteers = async (): Promise<Volunteer[]> =>
  requestList<Volunteer>('/api/volunteers');

export const saveVolunteerToDatabase = async (
  volunteer: Volunteer
): Promise<boolean> => {
  const response = await apiFetch('/api/volunteers', {
    method: 'POST',
    body: JSON.stringify(volunteer),
  });
  await readApiResult<Volunteer>(response);
  broadcastLiveChange('volunteer');
  return true;
};

export const deleteVolunteerFromDatabase = async (
  volunteerId: string
): Promise<boolean> => {
  const response = await apiFetch('/api/volunteers?id=' + encodeURIComponent(volunteerId), {
    method: 'DELETE',
  });
  await readApiResult<unknown>(response);
  broadcastLiveChange('volunteer');
  return true;
};

export const fetchUnits = async (): Promise<Unit[]> =>
  requestList<Unit>('/api/units');

export const saveUnitToDatabase = async (unit: Unit): Promise<boolean> => {
  const response = await apiFetch('/api/units', {
    method: 'POST',
    body: JSON.stringify(unit),
  });
  await readApiResult<Unit>(response);
  broadcastLiveChange('unit');
  return true;
};

export const deleteUnitFromDatabase = async (
  unitCode: string
): Promise<boolean> => {
  const response = await apiFetch('/api/units?code=' + encodeURIComponent(unitCode), {
    method: 'DELETE',
  });
  await readApiResult<unknown>(response);
  broadcastLiveChange('unit');
  return true;
};

export const fetchBranding = async (): Promise<CompanyBranding | null> => {
  try {
    const response = await apiFetch('/api/branding', {}, false);
    return await readApiResult<CompanyBranding>(response);
  } catch {
    return null;
  }
};

export const saveBrandingToDatabase = async (
  branding: CompanyBranding
): Promise<boolean> => {
  const response = await apiFetch('/api/branding', {
    method: 'POST',
    body: JSON.stringify(branding),
  });
  await readApiResult<CompanyBranding>(response);
  broadcastLiveChange('branding');
  return true;
};

let channel: BroadcastChannel | null = null;

export const getBroadcastChannel = (): BroadcastChannel | null => {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return null;
  if (!channel) channel = new BroadcastChannel('partes_security_sync_v2');
  return channel;
};

export const broadcastLiveChange = (type: string, payload?: unknown): void => {
  getBroadcastChannel()?.postMessage({ type, payload, at: Date.now() });
};

export const subscribeToRealtimeChanges = (
  onReports: () => void,
  onVolunteers: () => void,
  onUnits: () => void,
  onBranding: () => void
): (() => void) => {
  const handlers: Record<string, () => void> = {
    report: onReports,
    volunteer: onVolunteers,
    unit: onUnits,
    branding: onBranding,
  };
  const localChannel = getBroadcastChannel();
  const onMessage = (event: MessageEvent) => handlers[event.data?.type]?.();
  localChannel?.addEventListener('message', onMessage);

  const interval = window.setInterval(() => {
    onReports();
    onVolunteers();
    onUnits();
  }, 30000);

  return () => {
    window.clearInterval(interval);
    localChannel?.removeEventListener('message', onMessage);
  };
};
