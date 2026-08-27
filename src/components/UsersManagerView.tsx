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
  AlertTriangle
} from 'lucide-react';
import { AppUser, UserRole, UserPermissions, Volunteer, UserInvitation } from '../types';
import { 
  fetchAppUsers, 
  saveAppUser, 
  deleteAppUser, 
  createInvitation, 
  getDefaultPermissions,
  validatePasswordStrength,
  hashPassword
} from '../services/authService';

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
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Dispatch Link Result Modal
  const [invitationResult, setInvitationResult] = useState<{
    invitation: UserInvitation;
    activationUrl: string;
    mailtoUrl: string;
    gmailUrl: string;
  } | null>(null);

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

  const loadUsers = async () => {
    const list = await fetchAppUsers();
    setUsers(list);
  };

  useEffect(() => {
    loadUsers();
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
    setDirectPassword(u.password || '');
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
        // Edit existing user
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
          lockedUntil: undefined, // Reset lockout if admin edited
        };
        await saveAppUser(userToSave);
        await loadUsers();
        setIsModalOpen(false);
        onNotify('success', 'Usuario Actualizado', `Permisos y credenciales de ${userToSave.fullName} actualizados.`);
      } else {
        // Create new official invitation
        const inv = await createInvitation({
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          volunteerId: selectedVolunteerId || undefined,
          rank,
          registrationNumber: registrationNumber || 'VOL-000',
          role,
          permissions,
          invitedBy: `${currentUser.rank} ${currentUser.fullName}`,
        });

        // Request API for email payload
        const origin = window.location.origin;
        let activationUrl = `${origin}/activar?token=${inv.token}`;
        let mailtoUrl = `mailto:${inv.email}`;
        let gmailUrl = `https://mail.google.com`;

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
          }
        } catch {
          // fallback to client URLs
        }

        if (directPassword) {
          const hashed = await hashPassword(directPassword);
          await saveAppUser({
            id: `usr-${Date.now()}`,
            email: inv.email,
            fullName: inv.fullName,
            volunteerId: inv.volunteerId,
            rank: inv.rank,
            registrationNumber: inv.registrationNumber,
            role: inv.role,
            status: 'ACTIVO',
            permissions: inv.permissions,
            password: directPassword,
            passwordHash: hashed,
            createdAt: new Date().toISOString(),
          });
        }

        await loadUsers();
        setIsModalOpen(false);

        // Show Dispatch Options Modal
        setInvitationResult({
          invitation: inv,
          activationUrl,
          mailtoUrl,
          gmailUrl,
        });

        onNotify(
          'success',
          'Invitación Generada',
          `Se generó el enlace de activación para ${inv.fullName}.`
        );
      }
    } catch {
      onNotify('error', 'Error', 'Ocurrió un error al procesar el usuario.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      alert('No puedes eliminar tu propia cuenta de usuario activa.');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar o suspender la cuenta de ${userName}?`)) {
      await deleteAppUser(userId);
      await loadUsers();
      onNotify('warning', 'Usuario Removido', `La cuenta de ${userName} ha sido eliminada.`);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    onNotify('success', 'Enlace Copiado', 'El enlace de activación está en tu portapapeles.');
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    u.registrationNumber.toLowerCase().includes(search.toLowerCase())
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
                Gestión de Usuarios & Control de Ciberseguridad
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Super Admin Master: <span className="font-mono text-amber-500 font-bold">gnunezgonzalez@icloud.com</span> • Acceso protegido con contraseñas seguras
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenNewUserModal}
          className="flex items-center space-x-1.5 bg-red-700 hover:bg-red-800 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-md transition active:scale-95 border border-red-500/50"
        >
          <Mail className="w-4 h-4" />
          <span>Enviar Invitación por Correo</span>
        </button>
      </div>

      {/* Search & Stats Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, registro o cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 shrink-0">
          {filteredUsers.length} cuentas registradas
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Usuario / Voluntario</th>
                <th className="py-3 px-4">Correo Electrónico</th>
                <th className="py-3 px-4">Rol en el Sistema</th>
                <th className="py-3 px-4 text-center">Permisos Asignados</th>
                <th className="py-3 px-4 text-center">Estado / Seguridad</th>
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
                    Contraseña Directa (Opcional)
                  </label>
                  <input
                    type="text"
                    value={directPassword}
                    onChange={(e) => setDirectPassword(e.target.value)}
                    placeholder="Ej. Bombero2026!"
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
                      checked={permissions.canManageUsers}
                      onChange={(e) => setPermissions({ ...permissions, canManageUsers: e.target.checked })}
                      className="rounded text-red-600"
                    />
                    <span>Administrar Usuarios</span>
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
                  <span>{isSending ? 'Generando...' : (editingUser ? 'Guardar Cambios' : 'Generar Invitación')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resultado del Enlace de Invitación Real */}
      {invitationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800/60">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-emerald-700 rounded-2xl flex items-center justify-center text-white font-bold shadow-md">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    ¡Invitación Oficial Lista para Enviar!
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Destinatario: {invitationResult.invitation.email}
                  </p>
                </div>
              </div>
              <button onClick={() => setInvitationResult(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-800 dark:text-slate-200">
              <p className="leading-relaxed">
                Se ha generado el enlace seguro de activación para <span className="font-bold text-slate-900 dark:text-white">{invitationResult.invitation.fullName}</span> con rol de <span className="font-bold text-red-700 dark:text-red-400">{invitationResult.invitation.role}</span>.
              </p>

              {/* Activation Link Copy Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Enlace Oficial de Activación:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={invitationResult.activationUrl}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-[11px] text-slate-700 dark:text-slate-300 select-all"
                  />
                  <button
                    onClick={() => handleCopyLink(invitationResult.activationUrl)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2 rounded-xl flex items-center space-x-1 flex-shrink-0 transition active:scale-95"
                    title="Copiar al portapapeles"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copiar</span>
                  </button>
                </div>
              </div>

              {/* Actions dispatch options */}
              <div className="space-y-2 pt-2">
                <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                  Opciones de Envío Directo:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={invitationResult.mailtoUrl}
                    className="flex items-center justify-center space-x-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold p-2.5 rounded-xl text-center shadow-sm transition active:scale-95"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Abrir en Correo / Outlook</span>
                  </a>

                  <a
                    href={invitationResult.gmailUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center space-x-1.5 bg-red-700 hover:bg-red-800 text-white font-bold p-2.5 rounded-xl text-center shadow-sm transition active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir en Gmail Web</span>
                  </a>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setInvitationResult(null)}
                  className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
