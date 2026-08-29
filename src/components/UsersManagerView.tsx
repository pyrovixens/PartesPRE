import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  Shield, 
  ShieldAlert, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Search, 
  Edit, 
  Trash2, 
  Lock, 
  Send,
  Sparkles,
  KeyRound,
  Check,
  X,
  AlertTriangle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { AppUser, UserRole, UserPermissions, Volunteer, UserInvitation } from '../types';
import { 
  fetchAppUsers, 
  saveAppUser, 
  deleteAppUser, 
  createInvitation, 
  fetchInvitations,
  deleteInvitation,
  getDefaultPermissions,
  validatePasswordStrength,
  hashPassword
} from '../services/authService';
import { searchInFields } from '../utils/searchUtils';

interface UsersManagerViewProps {
  volunteers: Volunteer[];
  currentUser: AppUser;
  onNotify: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const UsersManagerView: React.FC<UsersManagerViewProps> = ({
  volunteers,
  currentUser,
  onNotify,
}) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Dispatch Link Result Modal
  const [invitationResult, setInvitationResult] = useState<{
    invitation: UserInvitation;
    activationUrl: string;
    mailtoUrl: string;
    gmailUrl: string;
    whatsappUrl?: string;
    directEmailSent?: boolean;
    resendMessage?: string;
  } | null>(null);

  // Quick Activation Modal
  const [activatingInvitation, setActivatingInvitation] = useState<UserInvitation | null>(null);
  const [activationPassword, setActivationPassword] = useState<string>('Bombero2026!');
  const [isActivating, setIsActivating] = useState<boolean>(false);

  // Form states
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [rank, setRank] = useState<any>('Bombero Activo');
  const [registrationNumber, setRegistrationNumber] = useState<string>('');
  const [role, setRole] = useState<UserRole>('OFICIAL');
  const [directPassword, setDirectPassword] = useState<string>('');
  const [permissions, setPermissions] = useState<UserPermissions>(getDefaultPermissions('OFICIAL'));
  const [isSending, setIsSending] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [userList, invList] = await Promise.all([
        fetchAppUsers(),
        fetchInvitations(),
      ]);
      // Active / suspended users only (no unverified dummy users)
      setUsers(userList.filter(u => u.status === 'ACTIVO' || u.status === 'SUSPENDIDO'));
      setInvitations(invList.filter(i => i.status === 'PENDING'));
    } catch {
      console.warn('Error loading users and invitations');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVolunteerSelect = (volId: string) => {
    setSelectedVolunteerId(volId);
    const vol = volunteers.find(v => v.id === volId);
    if (vol) {
      setFullName(vol.fullName);
      setRank(vol.rank);
      setRegistrationNumber(vol.registrationNumber);
      setEmail(vol.email || `${vol.registrationNumber.toLowerCase()}@bomberoscallelarga.cl`);
      
      let defaultRole: UserRole = 'OFICIAL';
      if (['Director', 'Capitán', 'Teniente 1°'].includes(vol.rank)) {
        defaultRole = 'SUPER_ADMIN';
      } else if (['Teniente 2°', 'Teniente 3°'].includes(vol.rank)) {
        defaultRole = 'ADMIN';
      }
      setRole(defaultRole);
      setPermissions(getDefaultPermissions(defaultRole));
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setPermissions(getDefaultPermissions(newRole));
  };

  const handleOpenNewUserModal = () => {
    setEditingUser(null);
    setSelectedVolunteerId(volunteers[0]?.id || '');
    handleVolunteerSelect(volunteers[0]?.id || '');
    setDirectPassword('');
    setIsModalOpen(true);
  };

  const handleOpenEditUserModal = (u: AppUser) => {
    setEditingUser(u);
    setSelectedVolunteerId(u.volunteerId || '');
    setEmail(u.email);
    setFullName(u.fullName);
    setRank(u.rank);
    setRegistrationNumber(u.registrationNumber);
    setRole(u.role);
    setDirectPassword('');
    setPermissions(u.permissions || getDefaultPermissions(u.role));
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !fullName.trim()) {
      alert('Por favor ingresa el nombre y correo del usuario.');
      return;
    }

    if (directPassword) {
      const strength = validatePasswordStrength(directPassword);
      if (!strength.isValid) {
        alert(`La contraseña no cumple los requisitos de seguridad: ${strength.errors.join(', ')}`);
        return;
      }
    }

    setIsSending(true);

    try {
      if (editingUser) {
        // Edit existing active user
        let hashedPassword = editingUser.passwordHash;
        if (directPassword && directPassword !== editingUser.password) {
          hashedPassword = await hashPassword(directPassword);
        }

        const userToSave: AppUser = {
          ...editingUser,
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          volunteerId: selectedVolunteerId || undefined,
          rank,
          registrationNumber: registrationNumber || 'VOL-000',
          role,
          permissions,
          password: directPassword || editingUser.password,
          passwordHash: hashedPassword,
          failedLoginAttempts: 0,
          lockedUntil: undefined,
        };
        await saveAppUser(userToSave);
        await loadData();
        setIsModalOpen(false);
        onNotify('success', 'Usuario Actualizado', `Permisos y credenciales de ${userToSave.fullName} actualizados.`);
      } else {
        // Direct password provided -> create active account immediately
        if (directPassword) {
          const hashed = await hashPassword(directPassword);
          const newUser: AppUser = {
            id: `usr-${Date.now()}`,
            email: email.trim().toLowerCase(),
            fullName: fullName.trim(),
            volunteerId: selectedVolunteerId || undefined,
            rank,
            registrationNumber: registrationNumber || 'VOL-000',
            role,
            status: 'ACTIVO',
            permissions,
            password: directPassword,
            passwordHash: hashed,
            createdAt: new Date().toISOString(),
          };
          await saveAppUser(newUser);
          await loadData();
          setIsModalOpen(false);
          onNotify('success', 'Cuenta Creada', `Se creó la cuenta oficial activa para ${newUser.fullName}.`);
        } else {
          // Sender display name (avoid technical internal role like Super Administrador General)
          const matchedSenderVol = volunteers.find(
            v => (currentUser.volunteerId && v.id === currentUser.volunteerId) ||
                 v.fullName.toLowerCase() === currentUser.fullName.toLowerCase()
          );
          const senderRank = matchedSenderVol?.rank || (
            currentUser.rank && !currentUser.rank.toLowerCase().includes('administrador')
              ? currentUser.rank
              : 'Oficialidad'
          );
          const senderDisplayName = senderRank === 'Oficialidad' 
            ? `${currentUser.fullName} (Oficialidad 4ª Cía.)`
            : `${senderRank} ${currentUser.fullName}`;

          // Send official invitation (account will only be saved when activated)
          const inv = await createInvitation({
            email: email.trim().toLowerCase(),
            fullName: fullName.trim(),
            volunteerId: selectedVolunteerId || undefined,
            rank,
            registrationNumber: registrationNumber || 'VOL-000',
            role,
            permissions,
            invitedBy: senderDisplayName,
          });

          // Request API for email payload
          const origin = window.location.origin;
          let activationUrl = `${origin}/crear-cuenta?email=${encodeURIComponent(inv.email)}`;
          let mailtoUrl = `mailto:${inv.email}`;
          let gmailUrl = `https://mail.google.com`;
          let whatsappUrl = `https://api.whatsapp.com`;
          let directEmailSent = false;
          let resendMessage = '';

          try {
            const apiRes = await fetch('/api/invite-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: inv.email,
                fullName: inv.fullName,
                rank: inv.rank,
                registrationNumber: inv.registrationNumber,
                role: inv.role,
                permissions: inv.permissions,
                invitedBy: inv.invitedBy,
                token: inv.token,
                origin,
              }),
            });

            if (apiRes.ok) {
              const apiData = await apiRes.json();
              activationUrl = apiData.activationUrl || activationUrl;
              mailtoUrl = apiData.mailtoUrl || mailtoUrl;
              gmailUrl = apiData.gmailUrl || gmailUrl;
              whatsappUrl = apiData.whatsappUrl || whatsappUrl;
              directEmailSent = apiData.directEmailSent || false;
              resendMessage = apiData.resendMessage || '';
            }
          } catch {
            // fallback
          }

          await loadData();
          setIsModalOpen(false);

          // Show Dispatch Options Modal
          setInvitationResult({
            invitation: inv,
            activationUrl,
            mailtoUrl,
            gmailUrl,
            whatsappUrl,
            directEmailSent,
            resendMessage,
          });

          onNotify(
            'success',
            directEmailSent ? 'Correo Enviado' : 'Invitación Generada',
            directEmailSent 
              ? `Se envió el correo oficial de activación a ${inv.email}.`
              : `Se generó el enlace de activación para ${inv.fullName}.`
          );
        }
      }
    } catch {
      onNotify('error', 'Error', 'Ocurrió un error al procesar el usuario.');
    } finally {
      setIsSending(false);
    }
  };

  const handleResendInvitation = async (inv: UserInvitation) => {
    const origin = window.location.origin;
    let activationUrl = `${origin}/crear-cuenta?email=${encodeURIComponent(inv.email)}`;
    let mailtoUrl = `mailto:${inv.email}`;
    let gmailUrl = `https://mail.google.com`;
    let whatsappUrl = `https://api.whatsapp.com`;
    let directEmailSent = false;
    let resendMessage = '';

    try {
      const apiRes = await fetch('/api/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inv.email,
          fullName: inv.fullName,
          rank: inv.rank,
          registrationNumber: inv.registrationNumber,
          role: inv.role,
          permissions: inv.permissions,
          invitedBy: inv.invitedBy,
          token: inv.token,
          origin,
        }),
      });

      if (apiRes.ok) {
        const apiData = await apiRes.json();
        activationUrl = apiData.activationUrl || activationUrl;
        mailtoUrl = apiData.mailtoUrl || mailtoUrl;
        gmailUrl = apiData.gmailUrl || gmailUrl;
        whatsappUrl = apiData.whatsappUrl || whatsappUrl;
        directEmailSent = apiData.directEmailSent || false;
        resendMessage = apiData.resendMessage || '';
      }
    } catch {}

    setInvitationResult({
      invitation: inv,
      activationUrl,
      mailtoUrl,
      gmailUrl,
      whatsappUrl,
      directEmailSent,
      resendMessage,
    });

    onNotify(
      'info',
      directEmailSent ? 'Correo Reenviado' : 'Opciones de Reenvío',
      directEmailSent
        ? `Correo de activación reenviado a ${inv.email}.`
        : `Enlace de activación listo para compartir con ${inv.fullName}.`
    );
  };

  const handleDeleteInvitation = async (email: string, name: string) => {
    if (confirm(`¿Estás seguro de cancelar y revocar la invitación de ${name}?`)) {
      await deleteInvitation(email);
      await loadData();
      onNotify('warning', 'Invitación Revocada', `Se ha cancelado la invitación pendiente para ${name}.`);
    }
  };

  const handleOpenQuickActivate = (inv: UserInvitation) => {
    setActivatingInvitation(inv);
    setActivationPassword('Bombero2026!');
  };

  const handleConfirmQuickActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activatingInvitation || !activationPassword.trim()) return;

    setIsActivating(true);
    try {
      const hashed = await hashPassword(activationPassword);
      const activeUser: AppUser = {
        id: `usr-${Date.now()}`,
        email: activatingInvitation.email.trim().toLowerCase(),
        fullName: activatingInvitation.fullName.trim(),
        volunteerId: activatingInvitation.volunteerId,
        rank: activatingInvitation.rank || 'Bombero Activo',
        registrationNumber: activatingInvitation.registrationNumber || 'VOL-000',
        role: activatingInvitation.role,
        status: 'ACTIVO',
        permissions: activatingInvitation.permissions || getDefaultPermissions(activatingInvitation.role),
        password: activationPassword,
        passwordHash: hashed,
        invitedBy: activatingInvitation.invitedBy,
        invitedAt: activatingInvitation.invitedAt,
        createdAt: new Date().toISOString(),
      };

      await saveAppUser(activeUser);
      await deleteInvitation(activatingInvitation.email);
      await loadData();
      setActivatingInvitation(null);

      onNotify(
        'success',
        'Cuenta Activada',
        `La cuenta de ${activeUser.fullName} ha sido activada y agregada al sistema.`
      );
    } catch (err: any) {
      onNotify('error', 'Error al Activar', err?.message || 'No se pudo activar la cuenta.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleActivateAllInvitations = async () => {
    if (invitations.length === 0) return;
    if (!confirm(`¿Deseas activar directamente todas las ${invitations.length} invitaciones pendientes con la contraseña inicial "Bombero2026!"?`)) {
      return;
    }

    setIsActivating(true);
    try {
      const defaultPwd = 'Bombero2026!';
      const hashed = await hashPassword(defaultPwd);

      for (const inv of invitations) {
        const activeUser: AppUser = {
          id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          email: inv.email.trim().toLowerCase(),
          fullName: inv.fullName.trim(),
          volunteerId: inv.volunteerId,
          rank: inv.rank || 'Bombero Activo',
          registrationNumber: inv.registrationNumber || 'VOL-000',
          role: inv.role,
          status: 'ACTIVO',
          permissions: inv.permissions || getDefaultPermissions(inv.role),
          password: defaultPwd,
          passwordHash: hashed,
          invitedBy: inv.invitedBy,
          invitedAt: inv.invitedAt,
          createdAt: new Date().toISOString(),
        };

        await saveAppUser(activeUser);
        await deleteInvitation(inv.email);
      }

      await loadData();
      onNotify(
        'success',
        'Invitaciones Activadas',
        `Se activaron ${invitations.length} cuentas oficiales correctamente (Contraseña inicial: Bombero2026!).`
      );
    } catch (err: any) {
      onNotify('error', 'Error al Activar', err?.message || 'Ocurrió un error al activar invitaciones.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      alert('No puedes eliminar tu propia cuenta de usuario activa.');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar o suspender la cuenta de ${userName}?`)) {
      await deleteAppUser(userId);
      await loadData();
      onNotify('warning', 'Usuario Removido', `La cuenta de ${userName} ha sido eliminada.`);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    onNotify('success', 'Enlace Copiado', 'El enlace de activación está en tu portapapeles.');
  };

  const filteredUsers = users.filter(u => 
    searchInFields([
      u.fullName,
      u.email,
      u.role,
      u.rank,
      u.registrationNumber,
      u.status
    ], search)
  );

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
            SUPER ADMIN (Mando Total)
          </span>
        );
      case 'ADMIN':
        return (
          <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            ADMIN (Oficial de Mando)
          </span>
        );
      case 'OFICIAL':
        return (
          <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            OFICIAL (Guardia / Firma)
          </span>
        );
      case 'VOLUNTARIO':
      default:
        return (
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            VOLUNTARIO (Consulta)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 bg-red-700 rounded-2xl flex items-center justify-center text-white shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Gestión de Usuarios & Control de Cuentas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Administración de roles institucionales, invitaciones y credenciales
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenNewUserModal}
          className="flex items-center space-x-1.5 bg-red-700 hover:bg-red-800 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-md transition active:scale-95 border border-red-500/50"
        >
          <Mail className="w-4 h-4" />
          <span>Invitar / Crear Usuario</span>
        </button>
      </div>

      {/* Invitaciones Pendientes (Si existen) */}
      {invitations.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="font-black text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                Invitaciones Pendientes de Activación ({invitations.length})
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleActivateAllInvitations}
                disabled={isActivating}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50"
                title="Activar todas las invitaciones de una vez"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>⚡ Activar Todas</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {invitations.map((inv) => (
              <div key={inv.token || inv.id} className="bg-white dark:bg-slate-900 border border-amber-500/30 rounded-2xl p-3.5 shadow-sm space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{inv.fullName}</p>
                    <span className="text-[9px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800 shrink-0">
                      {inv.role}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-slate-500 truncate">{inv.email}</p>
                  <p className="text-[10px] text-slate-400 pt-1">
                    Invitado por: <span className="font-medium text-slate-700 dark:text-slate-300">{inv.invitedBy ? inv.invitedBy.replace(/Super Administrador General\s*/i, '').trim() || 'Oficialidad de Compañía' : 'Oficialidad de Compañía'}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleOpenQuickActivate(inv)}
                    className="flex items-center gap-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg transition shadow-sm active:scale-95"
                    title="Activar cuenta ahora asignando contraseña"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>⚡ Activar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResendInvitation(inv)}
                    className="flex items-center gap-1 text-[10px] font-bold bg-amber-600/10 hover:bg-amber-600/20 text-amber-700 dark:text-amber-300 px-2 py-1.5 rounded-lg transition"
                    title="Reenviar correo o enlace"
                  >
                    <Send className="w-3 h-3" />
                    <span>Reenviar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(`${window.location.origin}/crear-cuenta?email=${encodeURIComponent(inv.email)}`)}
                    className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-2 py-1.5 rounded-lg transition"
                    title="Copiar enlace directo"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteInvitation(inv.email, inv.fullName)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                    title="Revocar invitación"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar usuario por nombre, correo, registro o cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 shrink-0">
          {filteredUsers.length} cuentas oficiales activas
        </span>
      </div>

      {/* Mobile User Cards (Visible on Phones/Small Tablets) */}
      <div className="block md:hidden space-y-3">
        {filteredUsers.map((u) => (
          <div
            key={u.id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded-xl flex items-center justify-center border border-slate-300 dark:border-slate-700 shrink-0">
                  {u.fullName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{u.fullName}</p>
                  <p className="text-[11px] text-slate-400">
                    {u.registrationNumber} • {u.rank}
                  </p>
                  <p className="font-mono text-[10px] text-slate-500 truncate pt-0.5">{u.email}</p>
                </div>
              </div>

              <div className="shrink-0">
                {u.lockedUntil && new Date(u.lockedUntil) > new Date() ? (
                  <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-300">
                    <ShieldAlert className="w-3 h-3 text-red-600" />
                    Bloqueado
                  </span>
                ) : u.status === 'ACTIVO' ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                    <Mail className="w-3 h-3 text-amber-600" />
                    Invitado
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2 flex-wrap">
              <div>
                {getRoleBadge(u.role)}
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleOpenEditUserModal(u)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 transition active:scale-95"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>

                <button
                  onClick={() => handleDeleteUser(u.id, u.fullName)}
                  className="flex items-center gap-1 text-xs font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-800 transition active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Users Table */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Usuario / Voluntario</th>
                <th className="py-3 px-4">Correo Electrónico</th>
                <th className="py-3 px-4">Rol en el Sistema</th>
                <th className="py-3 px-4 text-center">Permisos Asignados</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded-xl flex items-center justify-center border border-slate-300 dark:border-slate-700">
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{u.fullName}</p>
                        <p className="text-[10px] text-slate-400">
                          {u.registrationNumber} • {u.rank}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {u.email}
                  </td>
                  <td className="py-3 px-4">
                    {getRoleBadge(u.role)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1 text-[10px] font-bold text-slate-500">
                      <span title="Crear Partes" className={`px-1.5 py-0.5 rounded ${u.permissions?.canCreateReports ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>C</span>
                      <span title="Editar Partes" className={`px-1.5 py-0.5 rounded ${u.permissions?.canEditReports ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>E</span>
                      <span title="Eliminar Partes" className={`px-1.5 py-0.5 rounded ${u.permissions?.canDeleteReports ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>D</span>
                      <span title="Gestión Usuarios" className={`px-1.5 py-0.5 rounded ${u.permissions?.canManageUsers ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>U</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {u.lockedUntil && new Date(u.lockedUntil) > new Date() ? (
                      <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-300">
                        <ShieldAlert className="w-3 h-3 text-red-600" />
                        Bloqueado
                      </span>
                    ) : u.status === 'ACTIVO' ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                        <Mail className="w-3 h-3 text-amber-600" />
                        Invitado
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => handleOpenEditUserModal(u)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition"
                        title="Modificar permisos y contraseña"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.fullName)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Enviar Invitación / Crear Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-red-800/60">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-red-700 rounded-2xl flex items-center justify-center text-white font-bold shadow-md">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {editingUser ? `Editar Credenciales: ${editingUser.fullName}` : 'Generar Invitación Oficial de Acceso'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Se generará un enlace oficial de activación para el bombero
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs text-slate-800 dark:text-slate-200">
              {/* Select from Padrón */}
              {!editingUser && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vincular con Voluntario del Padrón:
                  </label>
                  <select
                    value={selectedVolunteerId}
                    onChange={(e) => handleVolunteerSelect(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                  >
                    {volunteers.map(v => (
                      <option key={v.id} value={v.id}>{v.rank} - {v.fullName} ({v.registrationNumber})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico Real
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@gmail.com"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Rol Asignado</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-red-700 dark:text-red-400"
                  >
                    <option value="SUPER_ADMIN">SUPER ADMIN (Mando General Total)</option>
                    <option value="ADMIN">ADMIN (Oficial de Mando)</option>
                    <option value="OFICIAL">OFICIAL (Guardia / Servicio)</option>
                    <option value="VOLUNTARIO">VOLUNTARIO (Solo Consulta)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial (Opcional)'}
                  </label>
                  <input
                    type="password"
                    name="admin-new-user-password"
                    autoComplete="new-password"
                    value={directPassword}
                    onChange={(e) => setDirectPassword(e.target.value)}
                    placeholder={editingUser ? 'Dejar vacío para no cambiar' : '••••••••••••'}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              {/* Granular Permissions Toggle */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-2 bg-slate-50 dark:bg-slate-800/40">
                <p className="font-extrabold text-slate-800 dark:text-white text-xs">
                  Permisos Específicos de Operación:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canCreateReports}
                      onChange={(e) => setPermissions({ ...permissions, canCreateReports: e.target.checked })}
                      className="rounded text-red-600"
                    />
                    <span>Crear Partes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canEditReports}
                      onChange={(e) => setPermissions({ ...permissions, canEditReports: e.target.checked })}
                      className="rounded text-red-600"
                    />
                    <span>Modificar Partes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canDeleteReports}
                      onChange={(e) => setPermissions({ ...permissions, canDeleteReports: e.target.checked })}
                      className="rounded text-red-600"
                    />
                    <span>Eliminar Partes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canApproveReports}
                      onChange={(e) => setPermissions({ ...permissions, canApproveReports: e.target.checked })}
                      className="rounded text-red-600"
                    />
                    <span>Aprobar / Validar</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageVolunteers}
                      onChange={(e) => setPermissions({ ...permissions, canManageVolunteers: e.target.checked })}
                      className="rounded text-red-600"
                    />
                    <span>Modificar Padrón</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageUnits}
                      onChange={(e) => setPermissions({ ...permissions, canManageUnits: e.target.checked })}
                      className="rounded text-red-600"
                    />
                    <span>Modificar Carros (Material Mayor)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canManageUsers}
                      onChange={(e) => setPermissions({ ...permissions, canManageUsers: e.target.checked })}
                      className="rounded text-red-600"
                    />
                    <span>Administrar Usuarios</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.canExportReports}
                      onChange={(e) => setPermissions({ ...permissions, canExportReports: e.target.checked })}
                      className="rounded text-red-600"
                    />
                    <span>Exportar Reportes / Excel</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex items-center space-x-1.5 bg-red-700 hover:bg-red-800 text-white font-black px-4 py-2 rounded-xl shadow-md transition active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSending ? 'Generando...' : (editingUser ? 'Guardar Cambios' : (directPassword ? 'Crear Cuenta Activa' : 'Generar Invitación'))}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resultado del Enlace de Invitación */}
      {invitationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-red-800/60">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-red-700 rounded-2xl flex items-center justify-center text-white font-bold shadow-md">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Invitación Oficial Generada
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {invitationResult.invitation.email}
                  </p>
                </div>
              </div>
              <button onClick={() => setInvitationResult(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-800 dark:text-slate-200">
              {/* Delivery Status Banner */}
              {invitationResult.directEmailSent ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-3 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <div>
                    <p>Correo enviado automáticamente</p>
                    <p className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400">Se despachó a {invitationResult.invitation.email} vía Resend.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-3 space-y-1 text-amber-900 dark:text-amber-300 text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Enlace de activación listo para compartir</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Puedes enviar la invitación con 1 clic usando los botones rápidos a continuación:
                  </p>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white text-xs">
                  {invitationResult.invitation.fullName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {invitationResult.invitation.rank} • N° {invitationResult.invitation.registrationNumber}
                </p>
                <p className="text-[10px] text-slate-500 pt-1">
                  El enlace es válido por 7 días. Cuando el voluntario acceda y cree su contraseña, quedará activado de inmediato.
                </p>
              </div>

              {/* Copy link button */}
              <button
                type="button"
                onClick={() => handleCopyLink(invitationResult.activationUrl)}
                className="w-full flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl transition text-xs border border-slate-700 shadow-sm"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar Enlace de Activación</span>
              </button>

              {/* Dispatch options: Gmail, WhatsApp, Mail */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <a
                  href={invitationResult.gmailUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center justify-center bg-red-700 hover:bg-red-800 text-white font-bold p-2.5 rounded-xl text-center shadow-sm transition active:scale-95 text-[11px]"
                >
                  <ExternalLink className="w-4 h-4 mb-1" />
                  <span>Gmail</span>
                </a>

                {invitationResult.whatsappUrl && (
                  <a
                    href={invitationResult.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-xl text-center shadow-sm transition active:scale-95 text-[11px]"
                  >
                    <Send className="w-4 h-4 mb-1" />
                    <span>WhatsApp</span>
                  </a>
                )}

                <a
                  href={invitationResult.mailtoUrl}
                  className="flex flex-col items-center justify-center bg-blue-700 hover:bg-blue-800 text-white font-bold p-2.5 rounded-xl text-center shadow-sm transition active:scale-95 text-[11px]"
                >
                  <Mail className="w-4 h-4 mb-1" />
                  <span>Correo</span>
                </a>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setInvitationResult(null)}
                  className="w-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold py-2 rounded-xl transition text-xs"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Activar Directamente Invitación */}
      {activatingInvitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800/60">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-md">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Activar Cuenta Oficial
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {activatingInvitation.fullName}
                  </p>
                </div>
              </div>
              <button onClick={() => setActivatingInvitation(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmQuickActivate} className="p-6 space-y-4 text-xs text-slate-800 dark:text-slate-200">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-3 space-y-1">
                <p className="font-bold text-emerald-900 dark:text-emerald-300">
                  Activación Inmediata de Usuario
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Asigna una contraseña de acceso para activar a <strong>{activatingInvitation.fullName}</strong> ({activatingInvitation.email}) de inmediato sin esperar que abra su correo.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña de Acceso para el Voluntario:
                </label>
                <input
                  type="text"
                  required
                  value={activationPassword}
                  onChange={(e) => setActivationPassword(e.target.value)}
                  placeholder="Ej. Bombero2026!"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Mínimo 6 caracteres (letras y números). Podrá cambiarla luego si lo desea.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActivatingInvitation(null)}
                  className="px-3.5 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isActivating}
                  className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl shadow-md transition active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isActivating ? 'Activando...' : 'Confirmar y Activar Usuario'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
