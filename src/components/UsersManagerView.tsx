import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  Key, 
  Mail, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  Lock, 
  Unlock, 
  Search,
  Sparkles,
  Send,
  UserCheck,
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { AppUser, UserRole, UserPermissions, Volunteer, UserInvitation } from '../types';
import { 
  fetchAppUsers, 
  saveAppUser, 
  deleteAppUser, 
  getDefaultPermissions,
  createInvitation 
} from '../services/authService';

interface UsersManagerViewProps {
  currentUser: AppUser;
  volunteers: Volunteer[];
  onNotify: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const UsersManagerView: React.FC<UsersManagerViewProps> = ({
  currentUser,
  volunteers,
  onNotify,
}) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Invitation Success Modal
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
  const [pin, setPin] = useState<string>('4444');
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
    setPin('4444');
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
    setPin(u.pin || '4444');
    setPermissions(u.permissions || getDefaultPermissions(u.role));
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !fullName.trim()) {
      alert('Por favor ingresa el nombre y correo del usuario.');
      return;
    }

    setIsSending(true);

    try {
      if (editingUser) {
        // Edit existing user
        const userToSave: AppUser = {
          ...editingUser,
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          volunteerId: selectedVolunteerId || undefined,
          rank,
          registrationNumber: registrationNumber || 'VOL-000',
          role,
          permissions,
          pin: pin.trim() || '4444',
        };
        await saveAppUser(userToSave);
        await loadUsers();
        setIsModalOpen(false);
        onNotify('success', 'Usuario Actualizado', `Permisos de ${userToSave.fullName} actualizados.`);
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

        const apiData = await apiRes.json();

        await loadUsers();
        setIsModalOpen(false);

        // Show Dispatch Options Modal
        setInvitationResult({
          invitation: inv,
          activationUrl: apiData.activationUrl || `${origin}/activar?token=${inv.token}`,
          mailtoUrl: apiData.mailtoUrl || `mailto:${inv.email}`,
          gmailUrl: apiData.gmailUrl || `https://mail.google.com`,
        });

        onNotify(
          'success',
          'Invitación Generada',
          `Se generó el enlace de activación para ${inv.fullName}.`
        );
      }
    } catch (error) {
      alert('Ocurrió un error al procesar la invitación.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      alert('No puedes eliminar tu propia cuenta en sesión.');
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
                Gestión de Usuarios & Control de Permisos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Envío de invitaciones reales por correo y administración de roles
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
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2">
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
                    <span className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      u.status === 'ACTIVO'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      <span>{u.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => handleOpenEditUserModal(u)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Modificar permisos y rol"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.fullName)}
                        className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Eliminar cuenta"
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

      {/* Modal: Formulario Invitar / Crear Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden transition-colors">
            <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-red-800/60">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-red-700 rounded-xl flex items-center justify-center text-white">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingUser ? 'Editar Permisos de Usuario' : 'Enviar Invitación Oficial por Correo'}
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

      {/* Modal: Resultado y Opciones de Despacho de Correo Real */}
      {invitationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                ¡Invitación Oficial Generada!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Para: <span className="font-bold text-slate-800 dark:text-slate-200">{invitationResult.invitation.fullName}</span> ({invitationResult.invitation.email})
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 space-y-2">
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Enlace Único de Activación:
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={invitationResult.activationUrl}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-[11px] font-mono text-slate-700 dark:text-slate-300 truncate"
                />
                <button
                  onClick={() => handleCopyLink(invitationResult.activationUrl)}
                  className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 p-2 rounded-xl text-slate-800 dark:text-slate-200 transition"
                  title="Copiar enlace"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Direct Email Dispatch Buttons */}
            <div className="space-y-2 pt-2">
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-center">
                Elige cómo enviar el correo al bombero:
              </p>

              <a
                href={invitationResult.gmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center space-x-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow transition"
              >
                <Mail className="w-4 h-4" />
                <span>Abrir y Enviar desde Gmail</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
              </a>

              <a
                href={invitationResult.mailtoUrl}
                className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-700 transition"
              >
                <Send className="w-4 h-4" />
                <span>Abrir en mi Correo Predeterminado (Outlook/Mail)</span>
              </a>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setInvitationResult(null)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
