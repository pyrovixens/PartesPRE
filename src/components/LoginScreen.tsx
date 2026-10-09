import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle,
  Building2,
  Shield,
  ChevronDown
} from 'lucide-react';
import { AppUser, CompanyBranding, Company, SUPER_ADMIN_MASTER_EMAIL } from '../types';
import { authenticateUser } from '../services/authService';

interface LoginScreenProps {
  onLogin: (user: AppUser) => void;
  branding: CompanyBranding;
  companies?: Company[];
  selectedCompanyId?: string;
  onSelectCompany?: (companyId: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLogin, 
  branding,
  companies = [],
  selectedCompanyId = '4cia-calle-larga',
  onSelectCompany,
}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isSuperAdminEmail = email.trim().toLowerCase() === SUPER_ADMIN_MASTER_EMAIL.toLowerCase();

  const currentCompany = companies.find(c => c.id === selectedCompanyId);
  const effectiveLogo = currentCompany?.logoUrl || branding.logoUrl || '/logo_4ta_calle_larga.png';
  const effectiveName = currentCompany?.name || branding.companyName;
  const effectiveDepartment = currentCompany?.fireDepartment || branding.fireDepartment;
  const effectiveMotto = currentCompany?.motto || branding.motto;

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
      {/* Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Company Selector for Multi-Company Platform */}
        {companies.length > 1 && onSelectCompany && (
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[11px] font-bold text-slate-300 truncate">Compañía:</span>
            </div>
            <div className="relative inline-flex items-center flex-1 max-w-[220px]">
              <select
                value={selectedCompanyId}
                onChange={(e) => onSelectCompany(e.target.value)}
                className="w-full bg-slate-900 text-amber-300 border border-slate-700 rounded-xl px-2 py-1 text-xs font-black appearance-none pr-6 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer truncate"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400 absolute right-2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Crest & Title */}
        <div className="text-center space-y-3">
          <div className="inline-block relative group">
            <img
              src={effectiveLogo}
              alt={effectiveName}
              className="w-20 h-20 sm:w-24 sm:h-24 mx-auto object-contain drop-shadow-2xl rounded-2xl bg-slate-950/70 p-2 border border-slate-800 transition-all duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo_4ta_calle_larga.png';
              }}
            />
          </div>

          <div>
            <span className="bg-red-700/80 text-amber-300 text-[10px] font-black px-3 py-0.5 rounded-full border border-red-600/50 tracking-wider uppercase">
              {effectiveDepartment}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5">
              {effectiveName}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {effectiveMotto || 'Control Oficial de Asistencias & Libro de Partes'}
            </p>
          </div>
        </div>

        {/* Super Admin recognized badge */}
        {isSuperAdminEmail && (
          <div className="bg-amber-950/60 border border-amber-500/50 rounded-2xl p-3 flex items-center space-x-2 text-xs text-amber-200 animate-in fade-in">
            <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="font-bold text-[11px] leading-tight">
              Perfil Super Administrador Central detectado • Acceso global Multi-Compañía
            </p>
          </div>
        )}

        {/* Error Notification Alert */}
        {errorMsg && (
          <div className="bg-red-950/80 border border-red-800 rounded-2xl p-3.5 flex items-start space-x-2.5 text-xs text-red-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Login Form */}
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
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Create Account Link */}
          <div className="pt-3 text-center border-t border-slate-800/80">
            <a
              href="/crear-cuenta"
              className="text-[11px] text-slate-400 hover:text-amber-400 font-bold transition inline-flex items-center space-x-1"
            >
              <span>¿Cuenta nueva habilitada?</span>
              <span className="text-red-400 underline underline-offset-2">Crear mi contraseña</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};
