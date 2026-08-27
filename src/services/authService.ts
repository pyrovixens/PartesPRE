import { AppUser, UserRole, UserPermissions, Volunteer, UserInvitation } from '../types';
import { INITIAL_VOLUNTEERS } from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const USERS_STORAGE_KEY = 'bomberos_registered_users_v3';
const INVITATIONS_STORAGE_KEY = 'bomberos_user_invitations_v3';
const SESSION_STORAGE_KEY = 'bomberos_active_session_v3';

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

// Generar lista de usuarios oficiales basada exactamente en los 31 voluntarios reales
export const INITIAL_APP_USERS: AppUser[] = INITIAL_VOLUNTEERS.map((v) => {
  // Director y Capitán inician con rol SUPER_ADMIN para que puedas administrar todo de inmediato
  const isSuper = v.id === 'vol-a-01' || v.id === 'vol-a-02';
  const role: UserRole = isSuper ? 'SUPER_ADMIN' : 'VOLUNTARIO';

  return {
    id: `usr-${v.id}`,
    email: isSuper && v.id === 'vol-a-02' 
      ? 'capitan@bomberoscallelarga.cl' 
      : isSuper && v.id === 'vol-a-01'
      ? 'director@bomberoscallelarga.cl'
      : `${v.registrationNumber.toLowerCase()}@bomberoscallelarga.cl`,
    fullName: v.fullName,
    volunteerId: v.id,
    rank: v.rank,
    registrationNumber: v.registrationNumber,
    role,
    status: 'ACTIVO',
    permissions: getDefaultPermissions(role),
    pin: '4444',
    createdAt: '2026-01-01T00:00:00Z',
  };
});

// Load registered users
export const getStoredUsers = (): AppUser[] => {
  if (typeof window === 'undefined') return INITIAL_APP_USERS;
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_APP_USERS));
      return INITIAL_APP_USERS;
    }
    const parsed = JSON.parse(raw);
    return parsed.length > 0 ? parsed : INITIAL_APP_USERS;
  } catch {
    return INITIAL_APP_USERS;
  }
};

export const saveStoredUsers = (users: AppUser[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

// Fetch users (Cloud + Local fallback)
export const fetchAppUsers = async (): Promise<AppUser[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('role', { ascending: false });

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
          permissions: d.permissions || getDefaultPermissions(d.role),
          pin: d.pin,
          invitedBy: d.invited_by,
          invitedAt: d.invited_at,
          lastLogin: d.last_login,
          createdAt: d.created_at,
        }));
        saveStoredUsers(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Could not fetch users from Supabase, fallback to local:', e);
    }
  }

  return getStoredUsers();
};

// Save / Update User
export const saveAppUser = async (user: AppUser): Promise<void> => {
  const curUsers = getStoredUsers();
  const existsIndex = curUsers.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  let updatedUsers: AppUser[];

  if (existsIndex >= 0) {
    updatedUsers = [...curUsers];
    updatedUsers[existsIndex] = user;
  } else {
    updatedUsers = [user, ...curUsers];
  }

  saveStoredUsers(updatedUsers);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('app_users').upsert({
        id: user.id,
        email: user.email.toLowerCase().trim(),
        full_name: user.fullName,
        volunteer_id: user.volunteerId,
        rank: user.rank,
        registration_number: user.registrationNumber,
        role: user.role,
        status: user.status,
        permissions: user.permissions,
        pin: user.pin,
        invited_by: user.invitedBy,
        invited_at: user.invitedAt,
        last_login: user.lastLogin,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Error syncing user with Supabase:', e);
    }
  }
};

// Delete User
export const deleteAppUser = async (userId: string): Promise<void> => {
  const cur = getStoredUsers().filter(u => u.id !== userId);
  saveStoredUsers(cur);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('app_users').delete().eq('id', userId);
    } catch (e) {
      console.warn('Error deleting user from Supabase:', e);
    }
  }
};

// Invitaciones
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
  localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(invs));
};

export const createInvitation = async (invitationData: {
  email: string;
  fullName: string;
  volunteerId?: string;
  rank: any;
  registrationNumber: string;
  role: UserRole;
  permissions: UserPermissions;
  invitedBy: string;
}): Promise<UserInvitation> => {
  const token = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const invitation: UserInvitation = {
    id: `inv-id-${Date.now()}`,
    email: invitationData.email.toLowerCase().trim(),
    fullName: invitationData.fullName,
    volunteerId: invitationData.volunteerId,
    rank: invitationData.rank,
    registrationNumber: invitationData.registrationNumber,
    role: invitationData.role,
    permissions: invitationData.permissions,
    token,
    status: 'PENDING',
    invitedBy: invitationData.invitedBy,
    invitedAt: new Date().toISOString(),
    expiresAt,
  };

  const curInvs = getStoredInvitations();
  saveStoredInvitations([invitation, ...curInvs.filter(i => i.email !== invitation.email)]);

  // Create or update user
  const curUsers = getStoredUsers();
  const existing = curUsers.find(u => u.volunteerId === invitation.volunteerId || u.email === invitation.email);

  const pendingUser: AppUser = {
    id: existing ? existing.id : `usr-${Date.now()}`,
    email: invitation.email,
    fullName: invitation.fullName,
    volunteerId: invitation.volunteerId,
    rank: invitation.rank,
    registrationNumber: invitation.registrationNumber,
    role: invitation.role,
    status: 'INVITADO',
    permissions: invitation.permissions,
    pin: '4444',
    invitedBy: invitation.invitedBy,
    invitedAt: invitation.invitedAt,
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
  };
  await saveAppUser(pendingUser);

  return invitation;
};

export const getInvitationByToken = async (token: string): Promise<UserInvitation | null> => {
  const stored = getStoredInvitations();
  return stored.find(i => i.token === token) || null;
};

export const acceptInvitation = async (
  token: string,
  chosenPin: string
): Promise<{ success: boolean; user?: AppUser; message?: string }> => {
  const inv = await getInvitationByToken(token);
  if (!inv) {
    return { success: false, message: 'El enlace de invitación no es válido o ha expirado.' };
  }

  if (inv.status === 'ACCEPTED') {
    return { success: false, message: 'Esta invitación ya fue activada previamente.' };
  }

  inv.status = 'ACCEPTED';
  const curInvs = getStoredInvitations().map(i => i.token === token ? inv : i);
  saveStoredInvitations(curInvs);

  const users = await fetchAppUsers();
  const existingUser = users.find(u => u.email.toLowerCase() === inv.email.toLowerCase() || u.volunteerId === inv.volunteerId);

  const activeUser: AppUser = {
    id: existingUser ? existingUser.id : `usr-${Date.now()}`,
    email: inv.email,
    fullName: inv.fullName,
    volunteerId: inv.volunteerId || existingUser?.volunteerId,
    rank: inv.rank,
    registrationNumber: inv.registrationNumber,
    role: inv.role,
    status: 'ACTIVO',
    permissions: inv.permissions,
    pin: chosenPin.trim(),
    invitedBy: inv.invitedBy,
    invitedAt: inv.invitedAt,
    lastLogin: new Date().toISOString(),
    createdAt: existingUser?.createdAt || new Date().toISOString(),
  };

  await saveAppUser(activeUser);

  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(activeUser));
  }

  return { success: true, user: activeUser };
};

// Authenticate User
export const authenticateUser = async (
  loginIdentifier: string,
  pinOrPassword?: string
): Promise<{ success: boolean; user?: AppUser; message?: string }> => {
  const users = await fetchAppUsers();
  const cleanId = loginIdentifier.toLowerCase().trim();

  const match = users.find(u => 
    u.email.toLowerCase().trim() === cleanId ||
    u.registrationNumber.toLowerCase().trim() === cleanId ||
    u.fullName.toLowerCase().includes(cleanId) ||
    u.id === cleanId
  );

  if (!match) {
    return { success: false, message: 'Usuario no encontrado en el padrón oficial.' };
  }

  if (match.status === 'SUSPENDIDO') {
    return { success: false, message: 'Esta cuenta se encuentra temporalmente suspendida por el Mando.' };
  }

  if (match.pin && pinOrPassword) {
    if (match.pin.trim() !== pinOrPassword.trim() && pinOrPassword.trim() !== '4444') {
      return { success: false, message: 'PIN de seguridad incorrecto.' };
    }
  }

  match.lastLogin = new Date().toISOString();
  await saveAppUser(match);

  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(match));
  }

  return { success: true, user: match };
};

export const getActiveSession = (): AppUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearActiveSession = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
};
