import { AppUser, UserInvitation, UserPermissions, UserRole } from '../types';
import { apiFetch, readApiResult } from '../lib/apiClient';
import { supabase } from '../lib/supabase';

const PROFILE_CACHE_KEY = 'partes_auth_profile_v2';

export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  errors: string[];
} => {
  const errors: string[] = [];
  if (password.length < 12) errors.push('mínimo 12 caracteres');
  if (!/[A-ZÁÉÍÓÚÑ]/.test(password)) errors.push('una mayúscula');
  if (!/[a-záéíóúñ]/.test(password)) errors.push('una minúscula');
  if (!/[0-9]/.test(password)) errors.push('un número');
  if (!/[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ]/.test(password)) errors.push('un símbolo');
  if (/bombero2026|password|contraseña|123456/i.test(password)) {
    errors.push('no usar una contraseña conocida o institucional');
  }
  return { isValid: errors.length === 0, score: 5 - errors.length, errors };
};

// Compatibilidad temporal con la interfaz anterior. Este hash nunca se persiste ni autentica.
export const hashPassword = async (password: string): Promise<string> => {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const getDefaultPermissions = (role: UserRole): UserPermissions => {
  const readOnly: UserPermissions = {
    canCreateReports: false,
    canEditReports: false,
    canDeleteReports: false,
    canApproveReports: false,
    canManageVolunteers: false,
    canManageUnits: false,
    canManageUsers: false,
    canExportReports: false,
  };

  if (role === 'SUPER_ADMIN') {
    return Object.fromEntries(
      Object.keys(readOnly).map(key => [key, true])
    ) as unknown as UserPermissions;
  }

  if (role === 'ADMIN') {
    return {
      ...readOnly,
      canCreateReports: true,
      canEditReports: true,
      canDeleteReports: true,
      canApproveReports: true,
      canManageVolunteers: true,
      canManageUnits: true,
      canExportReports: true,
    };
  }

  if (role === 'OFICIAL') {
    return {
      ...readOnly,
      canCreateReports: true,
      canEditReports: true,
      canApproveReports: true,
      canExportReports: true,
    };
  }

  return readOnly;
};

const cacheProfile = (user: AppUser): void => {
  if (typeof window === 'undefined') return;
  const safeUser: AppUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    volunteerId: user.volunteerId,
    rank: user.rank,
    registrationNumber: user.registrationNumber,
    role: user.role,
    status: user.status,
    permissions: user.permissions,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
  };
  localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(safeUser));
};

export const getStoredUsers = (): AppUser[] => [];
export const saveStoredUsers = (_users: AppUser[]): void => undefined;
export const getStoredInvitations = (): UserInvitation[] => [];
export const saveStoredInvitations = (_invitations: UserInvitation[]): void => undefined;

export const fetchCurrentUser = async (): Promise<AppUser> => {
  const response = await apiFetch('/api/users?me=1');
  const user = await readApiResult<AppUser>(response);
  cacheProfile(user);
  return user;
};

export const fetchAppUsers = async (): Promise<AppUser[]> => {
  const response = await apiFetch('/api/users');
  return readApiResult<AppUser[]>(response);
};

export const saveAppUser = async (user: AppUser): Promise<AppUser> => {
  const payload: Record<string, unknown> = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    volunteerId: user.volunteerId,
    rank: user.rank,
    registrationNumber: user.registrationNumber,
    role: user.role,
    status: user.status,
    permissions: user.permissions,
  };

  // La contraseña viaja solo al endpoint administrativo de Supabase Auth.
  if (user.password) payload.newPassword = user.password;

  const response = await apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return readApiResult<AppUser>(response);
};

export const deleteAppUser = async (userId: string): Promise<void> => {
  const response = await apiFetch('/api/users?id=' + encodeURIComponent(userId), {
    method: 'DELETE',
  });
  await readApiResult<unknown>(response);
};

export const authenticateUser = async (
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: AppUser; error?: string }> => {
  if (!supabase) {
    return { success: false, error: 'El servicio de autenticación no está configurado.' };
  }

  const email = emailInput.trim().toLowerCase();
  const password = passwordInput;

  if (!email || !password) {
    return { success: false, error: 'Ingresa tu correo y contraseña.' };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { success: false, error: 'Credenciales inválidas o cuenta no habilitada.' };
  }

  try {
    const profile = await fetchCurrentUser();
    if (profile.status !== 'ACTIVO') {
      await supabase.auth.signOut();
      return { success: false, error: 'La cuenta aún no está activa o está suspendida.' };
    }
    return { success: true, user: profile };
  } catch (error) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo validar el perfil.',
    };
  }
};

export const createActiveSession = (user: AppUser): void => cacheProfile(user);

export const getActiveSession = (): AppUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const restoreActiveSession = async (): Promise<AppUser | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    if (typeof window !== 'undefined') localStorage.removeItem(PROFILE_CACHE_KEY);
    return null;
  }

  try {
    return await fetchCurrentUser();
  } catch {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') localStorage.removeItem(PROFILE_CACHE_KEY);
    return null;
  }
};

export const clearActiveSession = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PROFILE_CACHE_KEY);
    localStorage.removeItem('bomberos_active_session');
    localStorage.removeItem('bomberos_app_users');
    localStorage.removeItem('bomberos_user_invitations');
  }
  if (supabase) void supabase.auth.signOut();
};

export const fetchInvitations = async (): Promise<UserInvitation[]> => {
  const response = await apiFetch('/api/invitations');
  return readApiResult<UserInvitation[]>(response);
};

export const createInvitation = async (params: {
  email: string;
  fullName: string;
  volunteerId?: string;
  rank?: AppUser['rank'];
  registrationNumber?: string;
  role: UserRole;
  permissions?: UserPermissions;
  invitedBy: string;
}): Promise<UserInvitation> => {
  const response = await apiFetch('/api/invitations', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return readApiResult<UserInvitation>(response);
};

export const deleteInvitation = async (emailOrToken: string): Promise<void> => {
  const response = await apiFetch(
    '/api/invitations?email=' + encodeURIComponent(emailOrToken),
    { method: 'DELETE' }
  );
  await readApiResult<unknown>(response);
};

export const checkUserEmailForRegistration = async (
  emailInput: string
): Promise<{ allowed: boolean; user?: AppUser; alreadyActive?: boolean; error?: string }> => {
  if (!supabase) return { allowed: false, error: 'Autenticación no configurada.' };

  const { data, error } = await supabase.auth.getUser();
  const authEmail = data.user?.email?.toLowerCase();
  const requestedEmail = emailInput.trim().toLowerCase();

  if (error || !data.user || !authEmail || authEmail !== requestedEmail) {
    return {
      allowed: false,
      error: 'Abre el enlace personal enviado a tu correo. Escribir un correo no autoriza una cuenta.',
    };
  }

  try {
    const profile = await fetchCurrentUser();
    return {
      allowed: profile.status !== 'SUSPENDIDO',
      user: profile,
      alreadyActive: profile.status === 'ACTIVO',
    };
  } catch (profileError) {
    return {
      allowed: false,
      error: profileError instanceof Error ? profileError.message : 'Perfil no autorizado.',
    };
  }
};

export const registerUserPassword = async (
  emailInput: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Autenticación no configurada.' };

  const strength = validatePasswordStrength(password);
  if (!strength.isValid) {
    return { success: false, error: strength.errors.join(', ') };
  }

  const { data: current } = await supabase.auth.getUser();
  if (!current.user?.email || current.user.email.toLowerCase() !== emailInput.trim().toLowerCase()) {
    return { success: false, error: 'El enlace de invitación no corresponde a este correo.' };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { success: false, error: error.message };

  try {
    const response = await apiFetch('/api/users/activate', { method: 'POST' });
    await readApiResult<AppUser>(response);
    await supabase.auth.signOut();
    return { success: true };
  } catch (activationError) {
    return {
      success: false,
      error: activationError instanceof Error ? activationError.message : 'No se pudo activar la cuenta.',
    };
  }
};
