export interface EmergencyKey {
  code: string; // e.g. "10-0-1", "10-4-1", "ES"
  description: string;
  category: 'Emergencias' | 'Academias' | 'Entrenamiento Estandar' | 'Reuniones de Compañía' | 'Reuniones de Fundacion' | 'Citaciones Varias';
  shortCode?: string; // "E", "A", "ES", "RC", "RF", "V"
}

export type VolunteerCategory = 'Fundador / Insigne' | 'Honorario' | 'Activo' | 'Aspirante';

export type VolunteerRank =
  | 'Director'
  | 'Capitán'
  | 'Teniente 1°'
  | 'Teniente 2°'
  | 'Teniente 3°'
  | 'Ayudante'
  | 'Tesorero'
  | 'Secretario'
  | 'Maquinista General'
  | 'Maquinista'
  | 'Bombero Insigne'
  | 'Bombero Fundador'
  | 'Bombero Honorario'
  | 'Bombero Activo'
  | 'Aspirante'
  | 'Super Administrador General';

export interface Volunteer {
  id: string;
  rut: string;
  registrationNumber: string; // e.g. "VOL-001"
  fullName: string;
  shortName: string;
  category: VolunteerCategory;
  rank: VolunteerRank;
  status: 'Activo' | 'Honorario' | 'Insigne' | 'Licencia' | 'Suspendido';
  isDriver?: boolean; // Conductor / Maquinista habilitado (Licencia Clase F)
  driverLicense?: string; // e.g. "Clase F", "Clase A2", etc.
  phone?: string;
  email?: string;
  joinDate?: string;
  pin?: string;
}

export interface Unit {
  code: string; // "B-4", "BX-4", "R-4", "K-4", "Z-4"
  name: string; // "Bomba Urbana Mayor"
  plate: string;
  brand?: string;
  model?: string;
  type: 'Bomba' | 'Forestal' | 'Rescate' | 'Transporte' | 'Aljibe';
  currentKm: number;
  currentPumpHours: number;
  status: 'Operativo' | 'En Taller' | 'Fuera de Servicio';
}

export interface DispatchedUnit {
  unitCode: string;
  driverId?: string;
  driverName?: string;
  pumpHours?: number;
  startKm?: number;
  endKm?: number;
  distanceKm?: number;
}

export type ArrivalStatus = 'TRIPULO_CARRO' | '6_3_LUGAR' | 'CUBRE_CUARTEL';

export interface AttendanceRecord {
  volunteerId: string;
  volunteerName: string;
  category: VolunteerCategory;
  rank: string;
  registrationNumber: string;
  arrivalStatus: ArrivalStatus;
  unitCode?: string; // If TRIPULO_CARRO
  roleInAction?: string; // "Oficial a Cargo", "Maquinista", "Pitón 1", etc.
}

export type ReportStatus = 'BORRADOR' | 'ENVIADO' | 'APROBADO' | 'CERRADO';

export interface EmergencyReport {
  id: string;
  folioYear: number;
  folioNumber: number;
  fullFolio: string; // e.g. "2026-001"
  correlativoCompania: string; // "001"
  correlativoComandancia?: string; // "C-014", "102"
  incidentDate: string; // YYYY-MM-DD
  incidentTime?: string; // HH:mm (Hora del Acto)

  // Clasificación
  keyCode: string; // "10-0-1", "A", "ES", "RC", "RF", "V"
  keyDescription: string;
  category: string;

  // Ubicación
  address: string;
  cornerOrReference?: string;
  sector: string; // "Centro", "San Roque", "El Calleillón", "Pocuro", etc.
  commune: string; // "Calle Larga", "Los Andes", "San Esteban", "Rinconada"
  latitude?: number;
  longitude?: number;

  // Mando del Servicio
  officerInChargeId: string;
  officerInChargeName: string;
  officerInChargeRank: VolunteerRank;

  // Material Mayor
  units: DispatchedUnit[];

  // Asistencia
  attendees: AttendanceRecord[];
  totalFirefighters: number;

  // Información del Denunciante / Solicitante
  callerName?: string;
  callerPhone?: string;

  // Afectados e Inmueble
  affectedPropertyType?: string;
  damageLevel?: 'Leve' | 'Mediano' | 'Grave' | 'Total';
  injuredCount: number;
  fatalCount: number;
  civilianInjuredCount: number;
  firefighterInjuredCount: number;

  // Apoyos y Organismos Concurrentes
  externalAgencies: {
    carabineros: boolean;
    carabinerosUnit?: string;
    samu: boolean;
    samuUnit?: string;
    conaf: boolean;
    cgeChilquinta: boolean;
    municipalidad: boolean;
    seguridadCiudadana: boolean;
    otherBodies?: string;
  };

  // Relato Operativo / Novedades
  summaryNotes: string;
  officerNotes?: string;

  // Control Administrativo y Firmas Digitales
  status: ReportStatus;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  captainName?: string;
  captainRank?: string;
  digitalSignature?: {
    signedBy: string;
    signedByRank: string;
    signedAt: string;
    signatureDataUrl?: string;
    verificationCode?: string;
  };
}

export interface StatsSummary {
  totalCalls: number;
  totalEmergencies: number;
  totalActivities: number;
  avgFirefightersPerCall: number;
  totalPumpHours: number;
  totalDistanceKm: number;
  callsByKeyCode: Record<string, number>;
  callsByMonth: { month: string; calls: number; avgFirefighters: number }[];
  attendancesByVolunteer: { volunteerId: string; name: string; category: VolunteerCategory; rank: string; total: number; percentage: number }[];
}

// -------------------------------------------------------------
// SISTEMA DE USUARIOS, ROLES Y PERMISOS
// -------------------------------------------------------------
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'OFICIAL' | 'VOLUNTARIO';

export type UserStatus = 'ACTIVO' | 'INVITADO' | 'PENDIENTE' | 'SUSPENDIDO';

export interface UserPermissions {
  canCreateReports: boolean;
  canEditReports: boolean;
  canDeleteReports: boolean;
  canApproveReports: boolean;
  canManageVolunteers: boolean;
  canManageUnits: boolean;
  canManageUsers: boolean;
  canExportReports: boolean;
}

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  volunteerId?: string;
  rank: VolunteerRank;
  registrationNumber: string;
  role: UserRole;
  status: UserStatus;
  permissions: UserPermissions;
  password?: string;
  passwordHash?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string;
  invitedBy?: string;
  invitedAt?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  fullName: string;
  volunteerId?: string;
  rank?: VolunteerRank;
  registrationNumber?: string;
  role: UserRole;
  permissions?: UserPermissions;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
}

export type UserProfile = AppUser;

export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
}

export interface CompanyBranding {
  companyName: string;
  fireDepartment: string;
  motto: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
}
