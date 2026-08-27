'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  UserCheck, 
  Eye, 
  EyeOff,
  Check,
  X
} from 'lucide-react';
import { AppUser } from '../../types';
import { 
  checkUserEmailForRegistration, 
  registerUserPassword, 
  validatePasswordStrength 
} from '../../services/authService';

function CreateAccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState<string>(initialEmail);
  const [authorizedUser, setAuthorizedUser] = useState<AppUser | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState<boolean>(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<{ type: 'error' | 'info' | 'success'; text: string } | null>(null);

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Auto-verify if email is passed in URL
  useEffect(() => {
    if (initialEmail.trim()) {
      verifyEmail(initialEmail.trim());
    }
  }, [initialEmail]);

  const verifyEmail = async (emailToTest: string) => {
    if (!emailToTest.trim()) {
      setAuthorizedUser(null);
      setEmailStatusMsg(null);
      return;
    }

    setIsCheckingEmail(true);
    setEmailStatusMsg(null);

    try {
      const res = await checkUserEmailForRegistration(emailToTest);
      if (res.allowed && res.user) {
        setAuthorizedUser(res.user);
        if (res.alreadyActive) {
          setEmailStatusMsg({
            type: 'info',
            text: 'Esta cuenta ya tiene una contraseña activa. Al ingresar una nueva la actualizarás.',
          });
        } else {
          setEmailStatusMsg({
            type: 'success',
            text: `Usuario oficial encontrado: ${res.user.fullName} (${res.user.rank})`,
          });
        }
      } else {
        setAuthorizedUser(null);
        setEmailStatusMsg({
          type: 'error',
          text: res.error || 'Correo no encontrado en la base de datos de la Compañía.',
        });
      }
    } catch {
      setAuthorizedUser(null);
      setEmailStatusMsg({
        type: 'error',
        text: 'Error de conexión al verificar el correo.',
      });
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const passwordStrength = validatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      alert('Por favor ingresa tu correo electrónico.');
      return;
    }

    if (!authorizedUser) {
      await verifyEmail(email);
      if (!authorizedUser) {
        alert('El correo no se encuentra autorizado. Contacta a la Oficialidad.');
        return;
      }
    }

    if (!passwordStrength.isValid) {
      alert(`La contraseña no cumple con los requisitos: ${passwordStrength.errors.join(', ')}`);
      return;
    }

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerUserPassword(email, password);
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 1800);
      } else {
        alert(res.error || 'Ocurrió un error al registrar la contraseña.');
      }
    } catch {
      alert('Ocurrió un error en el proceso de registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Ambience glow */}
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
              Crear Contraseña Oficial
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              4ª Compañía "Bomba Calle Larga"
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="bg-emerald-950/80 border border-emerald-700 rounded-3xl p-6 space-y-3 text-center animate-in zoom-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-black text-white">¡Contraseña Creada Exitosamente!</h3>
            <p className="text-xs text-emerald-200 leading-relaxed">
              Tu cuenta ha sido activada. Redirigiendo a la pantalla de inicio de sesión...
            </p>
            <div className="pt-2">
              <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Email field */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Correo Electrónico Oficial:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={(e) => verifyEmail(e.target.value)}
                  placeholder="usuario@dominio.cl"
                  className="w-full bg-slate-950/90 border border-slate-700 rounded-2xl pl-10 pr-3 py-2.5 font-bold text-white text-xs focus:ring-2 focus:ring-red-600 focus:outline-none placeholder-slate-600"
                  required
                />
              </div>

              {/* Email verification status feedback */}
              {isCheckingEmail ? (
                <p className="text-[11px] text-amber-400 mt-1.5 flex items-center gap-1 font-medium">
                  <span className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
                  Verificando autorización en el padrón...
                </p>
              ) : emailStatusMsg ? (
                <div className={`mt-2 p-2.5 rounded-xl text-[11px] font-medium flex items-start gap-1.5 ${
                  emailStatusMsg.type === 'success' 
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                    : emailStatusMsg.type === 'info'
                    ? 'bg-blue-950/60 border border-blue-800 text-blue-300'
                    : 'bg-red-950/60 border border-red-800 text-red-300'
                }`}>
                  {emailStatusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{emailStatusMsg.text}</span>
                </div>
              ) : null}
            </div>

            {/* Volunteer identity card if verified */}
            {authorizedUser && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-slate-300 animate-in fade-in">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                  <UserCheck className="w-4 h-4" />
                  <span>{authorizedUser.fullName}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">{authorizedUser.registrationNumber}</span>
                  <span className="bg-red-900/60 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded border border-red-700/60">
                    {authorizedUser.rank}
                  </span>
                </div>
              </div>
            )}

            {/* Password input */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Nueva Contraseña:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
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

            {/* Confirm password input */}
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
                  placeholder="Repite la contraseña"
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
                  <span>Guardar y Crear mi Cuenta</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-slate-500 hover:text-slate-300 text-xs font-bold transition"
              >
                ← Volver al Inicio de Sesión
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CreateAccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando...</div>}>
      <CreateAccountContent />
    </Suspense>
  );
}
