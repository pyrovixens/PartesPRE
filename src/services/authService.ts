import { AppUser, UserRole, UserPermissions, Volunteer, UserInvitation } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const USERS_STORAGE_KEY = 'bomberos_registered_users_v5';
const INVITATIONS_STORAGE_KEY = 'bomberos_user_invitations_v5';
const SESSION_STORAGE_KEY = 'bomberos_active_session_v5';

// ----------------------------------------------------------------------
// CYBERSECURITY: HASHING & PASSWORD VALIDATION PROTOCOLS
// ----------------------------------------------------------------------

export const hashPassword = async (password: string): Promise<string> => {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return password;
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(`salt_4tacia_calle_larga_${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  errors: string[];
} => {
  const errors: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    errors.push('Mínimo 8 caracteres');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    errors.push('Al menos una letra mayúscula (A-Z)');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    errors.push('Al menos una letra minúscula (a-z)');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    errors.push('Al menos un número (0-9)');
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`§±]/.test(password)) {
    score += 1;
  } else {
    errors.push('Al menos un símbolo o carácter especial (!@#$%^&*...)');
  }

  return {
    isValid: errors.length === 0,
    score,
    errors,
  };
};

export const getDefaultPermissions = (role: UserRole): UserPermissions => {
  switch (role) {
    case 'SUPER_ADMIN':
      return {
        canCreateReports: true,
        canEditReports: true,
        canDeleteReports: true,
        canApproveReports: true,
        canManageVolunteers: true,
        canManageUnits: true,
        canManageUsers: true,
        canExportReports: true,
      };
    case 'ADMIN':
      return {
        canCreateReports: true,
        canEditReports: true,
        canDeleteReports: true,
        canApproveReports: true,
        canManageVolunteers: true,
        canManageUnits: true,
        canManageUsers: false,
        canExportReports: true,
      };
    case 'OFICIAL':
      return {
        canCreateReports: true,
        canEditReports: true,
        canDeleteReports: false,
        canApproveReports: false,
        canManageVolunteers: false,
        canManageUnits: false,
        canManageUsers: false,
        canExportReports: true,
      };
    case 'VOLUNTARIO':
    default:
      return {
        canCreateReports: false,
        canEditReports: false,
        canDeleteReports: false,
        canApproveReports: false,
        canManageVolunteers: false,
        canManageUnits: false,
        canManageUsers: false,
        canExportReports: true,
      };
  }
};

// ----------------------------------------------------------------------
// SUPER ADMIN MASTER USER
// ----------------------------------------------------------------------
export const SUPER_ADMIN_USER: AppUser = {
  id: 'usr-superadmin-01',
  email: 'gnunezgonzalez@icloud.com',
  fullName: 'Gustavo Núñez González',
  rank: 'Super Administrador General',
  registrationNumber: 'SUP-001',
  role: 'SUPER_ADMIN',
  status: 'ACTIVO',
  permissions: getDefaultPermissions('SUPER_ADMIN'),
  passwordHash: 'c0023972fce4d51959f33673c0bb7b465886f889d6998414d88f56fdf57f9a1e',
  failedLoginAttempts: 0,
  createdAt: '2026-01-01T00:00:00Z',
};

export const INITIAL_APP_USERS: AppUser[] = [SUPER_ADMIN_USER];

// ----------------------------------------------------------------------
// USER STORAGE & REPOSITORY
// ----------------------------------------------------------------------

export const getStoredUsers = (): AppUser[] => {
  if (typeof window === 'undefined') return INITIAL_APP_USERS;
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_APP_USERS));
      return INITIAL_APP_USERS;
    }
    const parsed = JSON.parse(raw);
    const hasSuperAdmin = parsed.some((u: AppUser) => u.email.toLowerCase() === 'gnunezgonzalez@icloud.com');
    if (!hasSuperAdmin) {
      const merged = [SUPER_ADMIN_USER, ...parsed];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
    return parsed.length > 0 ? parsed : INITIAL_APP_USERS;
  } catch {
    return INITIAL_APP_USERS;
  }
};

export const saveStoredUsers = (users: AppUser[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users to storage:', e);
  }
};

export const fetchAppUsers = async (): Promise<AppUser[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: AppUser[] = data.map((d: any) => ({
          id: d.id,
          email: d.email,
          fullName: d.full_name,
          volunteerId: d.volunteer_id,
          rank: d.rank,
          registrationNumber: d.registration_number,
          role: d.role,
          status: d.status,
          permissions: typeof d.permissions === 'string' ? JSON.parse(d.permissions) : (d.permissions || getDefaultPermissions(d.role)),
          password: d.password,
          passwordHash: d.password_hash,
          failedLoginAttempts: d.failed_login_attempts || 0,
          lockedUntil: d.locked_until,
          invitedBy: d.invited_by,
          invitedAt: d.invited_at,
          lastLogin: d.last_login,
          createdAt: d.created_at,
        }));
        saveStoredUsers(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Could not fetch app_users from Supabase, fallback to local storage:', e);
    }
  }

  return getStoredUsers();
};

export const saveAppUser = async (user: AppUser): Promise<AppUser> => {
  const currentUsers = getStoredUsers();
  const index = currentUsers.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  let updatedUsers: AppUser[];

  if (index >= 0) {
    updatedUsers = [...currentUsers];
    updatedUsers[index] = { ...updatedUsers[index], ...user };
  } else {
    updatedUsers = [...currentUsers, user];
  }

  saveStoredUsers(updatedUsers);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('app_users').upsert({
        id: user.id,
        email: user.email.toLowerCase(),
        full_name: user.fullName,
        volunteer_id: user.volunteerId,
        rank: user.rank,
        registration_number: user.registrationNumber,
        role: user.role,
        status: user.status,
        permissions: user.permissions,
        password: user.password,
        password_hash: user.passwordHash,
        failed_login_attempts: user.failedLoginAttempts || 0,
        locked_until: user.lockedUntil,
        invited_by: user.invitedBy,
        invited_at: user.invitedAt,
        last_login: user.lastLogin,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Could not upsert user to Supabase:', e);
    }
  }

  return user;
};

export const deleteAppUser = async (userId: string): Promise<void> => {
  const currentUsers = getStoredUsers();
  const filtered = currentUsers.filter(u => u.id !== userId);
  saveStoredUsers(filtered);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('app_users').delete().eq('id', userId);
    } catch (e) {
      console.warn('Could not delete user from Supabase:', e);
    }
  }
};

// ----------------------------------------------------------------------
// AUTHENTICATION & BRUTE-FORCE LOCKOUT DEFENSE
// ----------------------------------------------------------------------

export const authenticateUser = async (
  emailInput: string,
  passwordInput: string
): Promise<{
  success: boolean;
  user?: AppUser;
  error?: string;
  remainingAttempts?: number;
}> => {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: 'Por favor ingresa tu correo electrónico y contraseña.' };
  }

  const users = await fetchAppUsers();
  const targetUser = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!targetUser) {
    return {
      success: false,
      error: 'Credenciales inválidas. Verifica tu correo y contraseña.',
    };
  }

  // 1. Check account suspension
  if (targetUser.status === 'SUSPENDIDO') {
    return {
      success: false,
      error: 'Cuenta suspendida o no habilitada. Contacta al Administrador.',
    };
  }

  // 2. Check Lockout Protocol
  if (targetUser.lockedUntil) {
    const lockTime = new Date(targetUser.lockedUntil).getTime();
    const now = Date.now();
    if (lockTime > now) {
      const minutesLeft = Math.ceil((lockTime - now) / (60 * 1000));
      return {
        success: false,
        error: `Acceso temporalmente restringido. Intenta nuevamente en ${minutesLeft} minuto(s).`,
      };
    }
  }

  // 3. Password Verification (supports salted SHA-256 hash or secure password)
  const hashedAttempt = await hashPassword(cleanPassword);
  const passwordMatches = 
    targetUser.passwordHash === hashedAttempt ||
    (Boolean(targetUser.password) && targetUser.password === cleanPassword);

  if (!passwordMatches) {
    const failedAttempts = (targetUser.failedLoginAttempts || 0) + 1;
    const maxAttempts = 5;

    let updatedUser: AppUser = {
      ...targetUser,
      failedLoginAttempts: failedAttempts,
    };

    if (failedAttempts >= maxAttempts) {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      updatedUser.lockedUntil = lockUntil;
      await saveAppUser(updatedUser);
      return {
        success: false,
        error: 'Demasiados intentos fallidos. Acceso restringido temporalmente.',
      };
    }

    await saveAppUser(updatedUser);
    return {
      success: false,
      error: 'Contraseña incorrecta. Por favor intenta nuevamente.',
    };
  }

  // 4. Successful Authentication
  const updatedUser: AppUser = {
    ...targetUser,
    failedLoginAttempts: 0,
    lockedUntil: undefined,
    lastLogin: new Date().toISOString(),
  };

  await saveAppUser(updatedUser);
  createActiveSession(updatedUser);

  return {
    success: true,
    user: updatedUser,
  };
};

// ----------------------------------------------------------------------
// SESSION MANAGEMENT
// ----------------------------------------------------------------------

export const createActiveSession = (user: AppUser): void => {
  if (typeof window === 'undefined') return;
  try {
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
    const session = {
      user: safeUser,
      token: `session_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Error creating session:', e);
  }
};

export const getActiveSession = (): AppUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.user || null;
  } catch {
    return null;
  }
};

export const clearActiveSession = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing session:', e);
  }
};

// ----------------------------------------------------------------------
// INVITATIONS & REAL EMAIL DISPATCH FLOW
// ----------------------------------------------------------------------

export const getStoredInvitations = (): UserInvitation[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INVITATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredInvitations = (invs: UserInvitation[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(invs));
  } catch (e) {
    console.error('Error saving invitations:', e);
  }
};

export const createInvitation = async (params: {
  email: string;
  fullName: string;
  volunteerId?: string;
  rank: any;
  registrationNumber: string;
  role: UserRole;
  permissions: UserPermissions;
  invitedBy: string;
}): Promise<UserInvitation> => {
  const token = `inv_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const newInvitation: UserInvitation = {
    id: `inv-${Date.now()}`,
    email: params.email.trim().toLowerCase(),
    fullName: params.fullName.trim(),
    volunteerId: params.volunteerId,
    rank: params.rank,
    registrationNumber: params.registrationNumber,
    role: params.role,
    permissions: params.permissions,
    token,
    status: 'PENDING',
    invitedBy: params.invitedBy,
    invitedAt: now.toISOString(),
    expiresAt,
  };

  const existing = getStoredInvitations();
  saveStoredInvitations([newInvitation, ...existing]);

  // Create or stage user account
  const stagedUser: AppUser = {
    id: `usr-${Date.now()}`,
    email: params.email.trim().toLowerCase(),
    fullName: params.fullName.trim(),
    volunteerId: params.volunteerId,
    rank: params.rank,
    registrationNumber: params.registrationNumber,
    role: params.role,
    status: 'INVITADO',
    permissions: params.permissions,
    invitedBy: params.invitedBy,
    invitedAt: now.toISOString(),
    createdAt: now.toISOString(),
  };

  await saveAppUser(stagedUser);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('user_invitations').insert({
        email: newInvitation.email,
        full_name: newInvitation.fullName,
        role: newInvitation.role,
        token: newInvitation.token,
        status: newInvitation.status,
        invited_by: newInvitation.invitedBy,
        created_at: newInvitation.invitedAt,
        expires_at: newInvitation.expiresAt,
      });
    } catch (e) {
      console.warn('Could not insert invitation to Supabase:', e);
    }
  }

  return newInvitation;
};

export const getInvitationByToken = async (token: string): Promise<UserInvitation | null> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('token', token)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          rank: data.rank || 'Bombero Activo',
          registrationNumber: data.registration_number || 'VOL-000',
          role: data.role,
          permissions: getDefaultPermissions(data.role),
          token: data.token,
          status: data.status,
          invitedBy: data.invited_by,
          invitedAt: data.created_at,
          expiresAt: data.expires_at,
        };
      }
    } catch (e) {
      console.warn('Could not fetch invitation from Supabase:', e);
    }
  }

  const list = getStoredInvitations();
  return list.find(inv => inv.token === token && inv.status === 'PENDING') || null;
};

export const activateUserWithPassword = async (
  token: string,
  passwordInput: string
): Promise<{ success: boolean; user?: AppUser; error?: string }> => {
  const strength = validatePasswordStrength(passwordInput);
  if (!strength.isValid) {
    return {
      success: false,
      error: `La contraseña no cumple con los estándares de seguridad: ${strength.errors.join(', ')}.`,
    };
  }

  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    return { success: false, error: 'El enlace de invitación no es válido o ya ha expirado.' };
  }

  const hashedPassword = await hashPassword(passwordInput);
  const users = await fetchAppUsers();
  const existingUser = users.find(u => u.email.toLowerCase() === invitation.email.toLowerCase());

  const activatedUser: AppUser = {
    id: existingUser ? existingUser.id : `usr-${Date.now()}`,
    email: invitation.email,
    fullName: invitation.fullName,
    volunteerId: invitation.volunteerId,
    rank: invitation.rank,
    registrationNumber: invitation.registrationNumber,
    role: invitation.role,
    status: 'ACTIVO',
    permissions: invitation.permissions,
    passwordHash: hashedPassword,
    failedLoginAttempts: 0,
    createdAt: existingUser ? existingUser.createdAt : new Date().toISOString(),
  };

  await saveAppUser(activatedUser);

  // Update invitation status
  const invs = getStoredInvitations().map(i => i.token === token ? { ...i, status: 'ACCEPTED' as const } : i);
  saveStoredInvitations(invs);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('user_invitations')
        .update({ status: 'ACCEPTED' })
        .eq('token', token);
    } catch (e) {
      console.warn('Could not update invitation in Supabase:', e);
    }
  }

  createActiveSession(activatedUser);

  return {
    success: true,
    user: activatedUser,
  };
};
