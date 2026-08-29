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
    errors.push('Al menos un símbolo especial (!@#$%^&*...)');
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
// USER STORAGE & REPOSITORY (ACTIVE ACCOUNTS ONLY)
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
  let serverUsers: AppUser[] = [];

  // 1. Online API endpoint
  try {
    const res = await fetch('/api/users', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        serverUsers = json.data;
      }
    }
  } catch (err) {
    console.warn('Could not fetch /api/users:', err);
  }

  // 2. Direct Supabase if server response was empty
  if (serverUsers.length === 0 && isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        serverUsers = data.map((d: any) => ({
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
      }
    } catch (e) {
      console.warn('Supabase fetch error for app_users:', e);
    }
  }

  const baseUsers = serverUsers.length > 0 ? serverUsers : getStoredUsers();
  const hasSuperAdmin = baseUsers.some((u: AppUser) => u.email.toLowerCase() === 'gnunezgonzalez@icloud.com');
  const finalUsers = hasSuperAdmin ? baseUsers : [SUPER_ADMIN_USER, ...baseUsers];

  saveStoredUsers(finalUsers);
  return finalUsers;
};

export const saveAppUser = async (user: AppUser): Promise<AppUser> => {
  const cleanUser: AppUser = {
    ...user,
    email: user.email.trim().toLowerCase(),
    fullName: user.fullName.trim(),
  };

  const currentUsers = getStoredUsers();
  const index = currentUsers.findIndex(u => u.id === cleanUser.id || u.email.toLowerCase() === cleanUser.email.toLowerCase());
  let updatedUsers: AppUser[];

  if (index >= 0) {
    updatedUsers = [...currentUsers];
    updatedUsers[index] = { ...updatedUsers[index], ...cleanUser };
  } else {
    updatedUsers = [...currentUsers, cleanUser];
  }

  saveStoredUsers(updatedUsers);

  // 1. Online API endpoint
  try {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanUser),
    });
  } catch (e) {
    console.warn('API saveAppUser error:', e);
  }

  // 2. Direct Supabase upsert
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('app_users').upsert({
        id: cleanUser.id,
        email: cleanUser.email.toLowerCase(),
        full_name: cleanUser.fullName,
        volunteer_id: cleanUser.volunteerId,
        rank: cleanUser.rank,
        registration_number: cleanUser.registrationNumber,
        role: cleanUser.role,
        status: cleanUser.status,
        permissions: cleanUser.permissions,
        password: cleanUser.password,
        password_hash: cleanUser.passwordHash,
        failed_login_attempts: cleanUser.failedLoginAttempts || 0,
        locked_until: cleanUser.lockedUntil,
        invited_by: cleanUser.invitedBy,
        invited_at: cleanUser.invitedAt,
        last_login: cleanUser.lastLogin,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase upsert error in saveAppUser:', e);
    }
  }

  return cleanUser;
};

export const deleteAppUser = async (userId: string): Promise<void> => {
  const currentUsers = getStoredUsers();
  const filtered = currentUsers.filter(u => u.id !== userId);
  saveStoredUsers(filtered);

  try {
    await fetch(`/api/users?id=${encodeURIComponent(userId)}`, { method: 'DELETE' });
  } catch {}

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('app_users').delete().eq('id', userId);
    } catch (e) {
      console.warn('Could not delete user from Supabase:', e);
    }
  }
};

// ----------------------------------------------------------------------
// AUTHENTICATION & LOGIN PROTOCOL
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

  // 1. Primary: Authoritative Server-Side Authentication with Rate Limiting
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success && data.user) {
      createActiveSession(data.user);
      return {
        success: true,
        user: data.user,
      };
    } else if (res.status === 401 || res.status === 403 || res.status === 423 || res.status === 429) {
      return {
        success: false,
        error: data.error || 'Credenciales inválidas.',
        remainingAttempts: data.remainingAttempts,
      };
    }
  } catch (apiErr) {
    console.warn('Server login endpoint unavailable, attempting local verification:', apiErr);
  }

  // 2. Offline / Local Fallback
  const users = await fetchAppUsers();
  const targetUser = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!targetUser) {
    return {
      success: false,
      error: 'Credenciales inválidas. Verifica tu correo y contraseña.',
    };
  }

  if (targetUser.status === 'SUSPENDIDO') {
    return {
      success: false,
      error: 'Cuenta suspendida o no habilitada. Contacta al Administrador.',
    };
  }

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

  const hashedAttempt = await hashPassword(cleanPassword);
  const passwordMatches = 
    targetUser.passwordHash === hashedAttempt ||
    (Boolean(targetUser.password) && targetUser.password === cleanPassword) ||
    targetUser.passwordHash === cleanPassword;

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
        error: 'Demasiados intentos fallidos. Acceso restringido temporalmente por 15 minutos.',
      };
    }

    await saveAppUser(updatedUser);
    return {
      success: false,
      error: `Contraseña incorrecta. Te quedan ${maxAttempts - failedAttempts} intento(s).`,
      remainingAttempts: maxAttempts - failedAttempts,
    };
  }

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

export const fetchInvitations = async (): Promise<UserInvitation[]> => {
  let serverInvs: UserInvitation[] = [];

  try {
    const res = await fetch('/api/invitations', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        serverInvs = json.data;
      }
    }
  } catch {}

  if (serverInvs.length === 0 && isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (!error && data) {
        serverInvs = data.map((d: any) => ({
          id: d.id || `inv-${d.token}`,
          email: d.email,
          fullName: d.full_name,
          volunteerId: d.volunteer_id,
          rank: d.rank || 'Bombero Activo',
          registrationNumber: d.registration_number || 'VOL-000',
          role: d.role || 'OFICIAL',
          permissions: typeof d.permissions === 'string' ? JSON.parse(d.permissions) : (d.permissions || getDefaultPermissions(d.role || 'OFICIAL')),
          token: d.token,
          status: d.status,
          invitedBy: d.invited_by,
          invitedAt: d.created_at || d.invited_at,
          expiresAt: d.expires_at,
        }));
      }
    } catch {}
  }

  let finalInvs = serverInvs.length > 0 ? serverInvs : getStoredInvitations();
  const storedActiveUsers = getStoredUsers();
  finalInvs = finalInvs.filter(inv => !storedActiveUsers.some(u => u.email.toLowerCase() === inv.email.toLowerCase() && u.status === 'ACTIVO' && Boolean(u.passwordHash)));
  saveStoredInvitations(finalInvs);
  return finalInvs;
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
  const cleanEmail = params.email.trim().toLowerCase();
  const token = `inv_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const newInvitation: UserInvitation = {
    id: `inv-${Date.now()}`,
    email: cleanEmail,
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

  // Replace any existing invitation for this email
  const existing = getStoredInvitations().filter(i => i.email.toLowerCase() !== cleanEmail);
  const updatedInvs = [newInvitation, ...existing];
  saveStoredInvitations(updatedInvs);

  // Send to online API
  try {
    await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInvitation),
    });
  } catch {}

  // Upsert to Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('user_invitations').upsert({
        email: newInvitation.email,
        full_name: newInvitation.fullName,
        role: newInvitation.role,
        token: newInvitation.token,
        status: newInvitation.status,
        invited_by: newInvitation.invitedBy,
        created_at: newInvitation.invitedAt,
        expires_at: newInvitation.expiresAt,
      }, { onConflict: 'email' });
    } catch (e) {
      console.warn('Could not upsert invitation in Supabase:', e);
    }
  }

  // NOTE: We DO NOT create an unverified AppUser in app_users!
  // The user will be created only when they activate and choose their password.

  return newInvitation;
};

export const deleteInvitation = async (emailOrToken: string): Promise<void> => {
  const clean = emailOrToken.trim().toLowerCase();
  const current = getStoredInvitations();
  const filtered = current.filter(i => i.email.toLowerCase() !== clean && i.token !== emailOrToken && i.id !== emailOrToken);
  saveStoredInvitations(filtered);

  try {
    await fetch(`/api/invitations?email=${encodeURIComponent(clean)}`, { method: 'DELETE' });
  } catch {}

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('user_invitations').delete().or(`email.eq.${clean},token.eq.${clean}`);
    } catch {}
  }
};

export const checkUserEmailForRegistration = async (emailInput: string): Promise<{
  allowed: boolean;
  user?: AppUser;
  invitation?: UserInvitation;
  alreadyActive?: boolean;
  error?: string;
}> => {
  const cleanEmail = emailInput.trim().toLowerCase();
  if (!cleanEmail) {
    return { allowed: false, error: 'Por favor ingresa tu correo electrónico.' };
  }

  // 1. Check if user is already registered and active
  const users = await fetchAppUsers();
  const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (existingUser) {
    if (existingUser.status === 'SUSPENDIDO') {
      return { allowed: false, error: 'Esta cuenta ha sido suspendida. Contacta al Mando Oficial.' };
    }
    return {
      allowed: true,
      user: existingUser,
      alreadyActive: existingUser.status === 'ACTIVO' && Boolean(existingUser.passwordHash),
    };
  }

  // 2. Check pending invitations
  const invs = await fetchInvitations();
  const pendingInv = invs.find(i => i.email.toLowerCase() === cleanEmail);

  if (pendingInv) {
    const stagedUser: AppUser = {
      id: `usr-${Date.now()}`,
      email: pendingInv.email,
      fullName: pendingInv.fullName,
      volunteerId: pendingInv.volunteerId,
      rank: pendingInv.rank || 'Bombero Activo',
      registrationNumber: pendingInv.registrationNumber || 'VOL-000',
      role: pendingInv.role,
      status: 'INVITADO',
      permissions: pendingInv.permissions || getDefaultPermissions(pendingInv.role),
      invitedBy: pendingInv.invitedBy,
      invitedAt: pendingInv.invitedAt,
      createdAt: new Date().toISOString(),
    };
    return {
      allowed: true,
      user: stagedUser,
      invitation: pendingInv,
      alreadyActive: false,
    };
  }

  return {
    allowed: false,
    error: 'El correo no se encuentra registrado en el sistema ni cuenta con una invitación activa. Solicita a la Oficialidad que habilite tu cuenta.',
  };
};

export const registerUserPassword = async (
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: AppUser; error?: string }> => {
  const cleanEmail = emailInput.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: 'Correo electrónico no válido.' };
  }

  const strength = validatePasswordStrength(passwordInput);
  if (!strength.isValid) {
    return {
      success: false,
      error: `La contraseña no cumple con los requisitos: ${strength.errors.join(', ')}.`,
    };
  }

  const check = await checkUserEmailForRegistration(cleanEmail);
  if (!check.allowed || !check.user) {
    return {
      success: false,
      error: check.error || 'El correo no está autorizado para registro.',
    };
  }

  const hashedPassword = await hashPassword(passwordInput);

  const newUser: AppUser = {
    ...check.user,
    status: 'ACTIVO',
    passwordHash: hashedPassword,
    failedLoginAttempts: 0,
    lockedUntil: undefined,
    createdAt: check.user.createdAt || new Date().toISOString(),
  };

  await saveAppUser(newUser);
  createActiveSession(newUser);

  // Remove/update invitation
  await deleteInvitation(cleanEmail);

  return {
    success: true,
    user: newUser,
  };
};
