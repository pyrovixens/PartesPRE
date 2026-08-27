import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  User, 
  Key, 
  Flame, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  Users,
  Award
} from 'lucide-react';
import { AppUser, CompanyBranding } from '../types';
import { authenticateUser, INITIAL_APP_USERS } from '../services/authService';

interface LoginScreenProps {
  onLogin: (user: AppUser) => void;
  branding: CompanyBranding;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, branding }) => {
  const [identifier, setIdentifier] = useState<string>('capitan@bomberoscallelarga.cl');
  const [pin, setPin] = useState<string>('4444');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const result = await authenticateUser(identifier, pin);
      if (result.success && result.user) {
        onLogin(result.user);
      } else {
        setErrorMsg(result.message || 'Credenciales no válidas.');
      }
    } catch {
      setErrorMsg('Error al conectar con el servicio de autenticación.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVolunteerSelect = (user: AppUser) => {
    setIdentifier(user.email);
    setPin(user.pin || '4444');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card Container */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Crest & Header */}
        <div className="text-center space-y-3">
          <div className="inline-block relative group">
            <img
              src={branding.logoUrl || '/logo_4ta_calle_larga.png'}
              alt={branding.companyName}
              className="w-20 h-20 sm:w-24 sm:h-24 mx-auto object-contain drop-shadow-2xl rounded-2xl bg-slate-950/70 p-2 border border-slate-800"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo_4ta_calle_larga.png';
              }}
            />
          </div>

          <div>
            <span className="bg-red-700/80 text-amber-300 text-[10px] font-black px-3 py-0.5 rounded-full border border-red-600/50 tracking-wider uppercase">
              {branding.fireDepartment}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5">
              {branding.companyName}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Control Oficial de Asistencias & Libro de Partes
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-950/70 border border-red-800/80 rounded-2xl p-3.5 flex items-start space-x-2.5 text-xs text-red-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Seleccionar Bombero / Voluntario:
            </label>
            <select
              value={identifier}
              onChange={(e) => {
                const u = INITIAL_APP_USERS.find(user => user.email === e.target.value);
                if (u) handleVolunteerSelect(u);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-600 mb-2"
            >
              <optgroup label="⭐ Oficialidad de Mando (Super Admin)">
                <option value="capitan@bomberoscallelarga.cl">Capitán - Gabriel Bianchini Frost</option>
                <option value="director@bomberoscallelarga.cl">Director - Nelson Venegas Salazar</option>
              </optgroup>
              <optgroup label="Padrón Oficial de Voluntarios (31 Bomberos)">
                {INITIAL_APP_USERS.filter(u => u.role === 'VOLUNTARIO').map(u => (
                  <option key={u.id} value={u.email}>{u.fullName} ({u.registrationNumber})</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              PIN de Acceso (4 dígitos):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Key className="w-4 h-4" />
              </div>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN de 4 dígitos"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-3.5 py-3 text-xs font-bold text-white placeholder-slate-600 tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white font-black text-sm py-3 px-4 rounded-2xl shadow-lg shadow-red-950/50 flex items-center justify-center space-x-2 transition active:scale-98 disabled:opacity-50"
          >
            <span>{isLoading ? 'Verificando...' : 'Iniciar Sesión en Guardia'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Security Notice */}
        <div className="text-center pt-2 border-t border-slate-800/80">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            🔒 Los roles de Tenientes, Maquinistas y Oficiales pueden configurarse y modificarse manualmente desde el panel de <span className="text-amber-400 font-bold">Usuarios & Permisos</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
