import React, { useState } from 'react';
import { Shield, Key, User, Check, X, LogOut, Cloud, Lock, Sparkles, UserCheck } from 'lucide-react';
import { Volunteer, UserProfile, UserRole } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { getDefaultPermissions } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  volunteers: Volunteer[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  volunteers,
}) => {
  const [selectedVolId, setSelectedVolId] = useState<string>(volunteers[0]?.id || '');
  const isCloud = isSupabaseConfigured();

  if (!isOpen) return null;

  const handleQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const v = volunteers.find((vol) => vol.id === selectedVolId) || volunteers[0];
    if (!v) return;

    // Determine Role
    let role: UserRole = 'VOLUNTARIO';
    if (['Director', 'Capitán', 'Teniente 1°'].includes(v.rank)) {
      role = 'SUPER_ADMIN';
    } else if (['Teniente 2°', 'Teniente 3°'].includes(v.rank)) {
      role = 'ADMIN';
    } else if (
      [
        'Ayudante',
        'Tesorero',
        'Secretario',
        'Maquinista General',
        'Maquinista',
      ].includes(v.rank)
    ) {
      role = 'OFICIAL';
    }

    const profile: UserProfile = {
      id: v.id,
      volunteerId: v.id,
      email: `${v.registrationNumber.toLowerCase()}@bomberoscallelarga.cl`,
      fullName: v.fullName,
      rank: v.rank,
      registrationNumber: v.registrationNumber,
      role,
      status: 'ACTIVO',
      permissions: getDefaultPermissions(role),
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    onLogin(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-red-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-700 rounded-2xl flex items-center justify-center text-amber-300 shadow-md border border-red-500/50">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-100 text-base">
                Identificación de Guardia
              </h3>
              <p className="text-[11px] text-slate-400">
                Cambio rápido de Oficial en Turno
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-slate-800 dark:text-slate-200">
          {currentUser ? (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-700 text-white font-black text-base rounded-2xl flex items-center justify-center shadow-md">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {currentUser.fullName}
                    </h4>
                    <p className="text-xs text-red-700 dark:text-red-400 font-bold">
                      {currentUser.rank}
                    </p>
                    <span className="inline-block mt-1 text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-full font-bold">
                      Perfil: {currentUser.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center space-x-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-3.5 py-2 rounded-xl font-bold transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Turno</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                >
                  Continuar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleQuickLogin} className="space-y-4">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                Selecciona al Oficial de Guardia para este puesto de trabajo:
              </p>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Oficial en Turno:
                </label>
                <select
                  value={selectedVolId}
                  onChange={(e) => setSelectedVolId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-600 focus:outline-none text-xs"
                >
                  {volunteers.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.rank} - {v.fullName} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 bg-red-700 hover:bg-red-800 text-white font-black px-4 py-2 rounded-xl shadow-md transition active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Activar Turno</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
