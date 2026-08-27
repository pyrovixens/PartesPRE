import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  CheckCircle2
} from 'lucide-react';
import { AppUser, CompanyBranding } from '../types';
import { authenticateUser } from '../services/authService';

interface LoginScreenProps {
  onLogin: (user: AppUser) => void;
  branding: CompanyBranding;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, branding }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor ingresa tu correo electrónico y contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authenticateUser(email, password);
      if (result.success && result.user) {
        onLogin(result.user);
      } else {
        setErrorMsg(result.error || 'Credenciales inválidas. Verifica tu correo y contraseña.');
      }
    } catch {
      setErrorMsg('Error de conexión con el servicio de autenticación.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Crest & Title */}
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
              Acceso Seguro al Sistema de Partes y Asistencias
            </p>
          </div>
        </div>

        {/* Error Notification Alert */}
        {errorMsg && (
          <div className="bg-red-950/80 border border-red-800 rounded-2xl p-3.5 flex items-start space-x-2.5 text-xs text-red-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Secure Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Correo Electrónico:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@dominio.cl"
                autoComplete="email"
                className="w-full bg-slate-950/90 border border-slate-700 rounded-2xl pl-10 pr-3 py-2.5 font-bold text-white text-xs focus:ring-2 focus:ring-red-600 focus:outline-none placeholder-slate-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Contraseña:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="w-full bg-slate-950/90 border border-slate-700 rounded-2xl pl-10 pr-10 py-2.5 font-mono font-bold text-white text-xs focus:ring-2 focus:ring-red-600 focus:outline-none placeholder-slate-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white font-black py-3 rounded-2xl shadow-xl transition-all transform active:scale-98 flex items-center justify-center space-x-2 border border-red-500/50 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Ingresar al Sistema Seguro</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Badges Footer */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-mono">Cifrado SHA-256</span>
          </div>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Prevención Fuerza Bruta</span>
          <span className="text-slate-500">•</span>
          <span className="text-amber-400 font-bold">Control RBAC</span>
        </div>
      </div>
    </div>
  );
};
