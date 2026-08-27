'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  UserCheck, 
  Eye, 
  EyeOff,
  Check,
  X,
  Mail,
  ShieldAlert
} from 'lucide-react';
import { UserInvitation } from '../../types';
import { getInvitationByToken, activateUserWithPassword, validatePasswordStrength } from '../../services/authService';

function RegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<UserInvitation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      if (!token) {
        setErrorMsg('No se proporcionó un enlace de registro válido.');
        setIsLoading(false);
        return;
      }

      try {
        const found = await getInvitationByToken(token);
        if (!found) {
          setErrorMsg('El enlace de registro ha expirado o no es válido. Contacta a la Oficialidad para recibir uno nuevo.');
        } else if (found.status === 'ACCEPTED') {
          setErrorMsg('Esta cuenta ya ha sido registrada previamente. Ya puedes iniciar sesión con tu correo y contraseña.');
        } else {
          setInvitation(found);
        }
      } catch {
        setErrorMsg('Error de conexión al verificar la invitación de registro.');
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [token]);

  const passwordStrength = validatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!passwordStrength.isValid) {
      alert(`La contraseña no cumple con los requisitos: ${passwordStrength.errors.join(', ')}`);
      return;
    }

    if (password !== confirmPassword) {
      alert('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await activateUserWithPassword(token, password);
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        alert(res.error || 'Ocurrió un error al crear la cuenta.');
      }
    } catch {
      alert('Ocurrió un problema al procesar el registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-bold">Verificando invitación oficial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Crest & Title */}
        <div className="text-center space-y-3">
          <img
            src="/logo_4ta_calle_larga.png"
            alt="4ª Cía. Calle Larga"
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto object-contain drop-shadow-2xl rounded-2xl bg-slate-950/70 p-2 border border-slate-800"
          />

          <div>
            <span className="bg-red-700/80 text-amber-300 text-[10px] font-black px-3 py-0.5 rounded-full border border-red-600/50 tracking-wider uppercase">
              Cuerpo de Bomberos de Los Andes
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5">
              Crear Cuenta Oficial
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              4ª Compañía "Bomba Calle Larga"
            </p>
          </div>
        </div>

        {errorMsg ? (
          <div className="bg-red-950/80 border border-red-800 rounded-2xl p-4 space-y-3 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-xs text-red-200 font-medium leading-relaxed">{errorMsg}</p>
            <button
              onClick={() => router.push('/')}
              className="inline-block bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
            >
              Ir al Inicio de Sesión
            </button>
          </div>
        ) : isSuccess ? (
          <div className="bg-emerald-950/80 border border-emerald-700 rounded-2xl p-5 space-y-3 text-center animate-in zoom-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base font-black text-white">¡Cuenta Creada Exitosamente!</h3>
            <p className="text-xs text-emerald-200">
              Iniciando sesión en el sistema...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {invitation && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-slate-300">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                  <UserCheck className="w-4 h-4" />
                  <span>{invitation.fullName}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">{invitation.registrationNumber}</span>
                  <span className="bg-red-900/60 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded border border-red-700/60">
                    {invitation.rank}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Correo Electrónico Oficial:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={invitation?.email || ''}
                  readOnly
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-2xl pl-10 pr-3 py-2.5 font-bold text-slate-300 text-xs focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Crear Contraseña:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu nueva contraseña"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-10 py-2.5 font-mono font-bold text-white text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  title={showPassword ? 'Ocultar' : 'Ver'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Confirmar Contraseña:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña exactamente"
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-3 py-2.5 font-mono font-bold text-white text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Live Password Checklist */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 space-y-1.5 text-[11px]">
              <p className="font-bold text-slate-400 mb-1">Requisitos de la contraseña:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <span className={`flex items-center gap-1.5 font-medium ${password.length >= 8 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {password.length >= 8 ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                  Mínimo 8 caracteres
                </span>
                <span className={`flex items-center gap-1.5 font-medium ${/[A-Z]/.test(password) ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {/[A-Z]/.test(password) ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                  Mayúscula (A-Z)
                </span>
                <span className={`flex items-center gap-1.5 font-medium ${/[a-z]/.test(password) ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {/[a-z]/.test(password) ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                  Minúscula (a-z)
                </span>
                <span className={`flex items-center gap-1.5 font-medium ${/[0-9]/.test(password) ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {/[0-9]/.test(password) ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                  Número (0-9)
                </span>
                <span className={`flex items-center gap-1.5 font-medium ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`§±]/.test(password) ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`§±]/.test(password) ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-600" />}
                  Signo especial (!@#$%)
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !passwordStrength.isValid || password !== confirmPassword}
              className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white font-black py-3 rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 border border-red-500/50 disabled:opacity-50 active:scale-98"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Crear mi Cuenta Oficial</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
