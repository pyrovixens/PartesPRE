import React, { useState } from 'react';
import { Shield, Key, User, Check, X, LogOut, Cloud } from 'lucide-react';
import { Volunteer, UserProfile } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

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
    const v = volunteers.find(vol => vol.id === selectedVolId) || volunteers[0];
    if (!v) return;

    let role: 'ADMIN' | 'OFICIAL' | 'VOLUNTARIO' = 'VOLUNTARIO';
    if (['Director', 'Capitán', 'Teniente 1°'].includes(v.rank)) {
      role = 'ADMIN';
    } else if (['Teniente 2°', 'Teniente 3°', 'Ayudante', 'Tesorero', 'Secretario', 'Maquinista General'].includes(v.rank)) {
      role = 'OFICIAL';
    }

    const profile: UserProfile = {
      id: v.id,
      email: `${v.registrationNumber.toLowerCase()}@bomberoscallelarga.cl`,
      fullName: v.fullName,
      rank: v.rank,
      role,
    };

    onLogin(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-5 space-y-4 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-red-700 rounded-lg flex items-center justify-center text-white font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Identificación de Oficial / Guardia
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isCloud ? '🟢 Conectado a la Nube (Supabase Realtime)' : '🟠 Modo Cuartel / Local'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User or Form */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-700 rounded-full flex items-center justify-center text-white font-black text-sm">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-sm">{currentUser.fullName}</h4>
                  <p className="text-xs text-red-700 dark:text-red-400 font-bold">{currentUser.rank}</p>
                  <span className="inline-block mt-0.5 text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-mono">
                    Rol: {currentUser.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center space-x-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-2 rounded-lg font-bold transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                Continuar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleQuickLogin} className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
              Selecciona tu nombre o cargo para firmar y registrar los partes como Oficial de Guardia o Mando en este dispositivo:
            </p>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Oficial / Voluntario en Turno:
              </label>
              <select
                value={selectedVolId}
                onChange={(e) => setSelectedVolId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-600 focus:outline-none"
              >
                <optgroup label="Oficiales de Mando">
                  {volunteers.filter(v => ['Director', 'Capitán', 'Teniente 1°', 'Teniente 2°', 'Teniente 3°'].includes(v.rank)).map(v => (
                    <option key={v.id} value={v.id}>{v.rank} - {v.fullName}</option>
                  ))}
                </optgroup>
                <optgroup label="Oficiales Generales y Maquinistas">
                  {volunteers.filter(v => ['Ayudante', 'Tesorero', 'Secretario', 'Maquinista General', 'Maquinista'].includes(v.rank)).map(v => (
                    <option key={v.id} value={v.id}>{v.rank} - {v.fullName}</option>
                  ))}
                </optgroup>
                <optgroup label="Bomberos de Compañía">
                  {volunteers.filter(v => !['Director', 'Capitán', 'Teniente 1°', 'Teniente 2°', 'Teniente 3°', 'Ayudante', 'Tesorero', 'Secretario', 'Maquinista General', 'Maquinista'].includes(v.rank)).map(v => (
                    <option key={v.id} value={v.id}>{v.fullName} ({v.rank})</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center space-x-1.5 bg-red-700 hover:bg-red-800 text-white font-bold px-4 py-2 rounded-lg shadow transition"
              >
                <Check className="w-4 h-4" />
                <span>Ingresar como Oficial</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
