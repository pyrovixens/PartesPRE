'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Shield, Key, CheckCircle2, AlertCircle, ArrowRight, UserCheck, Sparkles, Lock } from 'lucide-react';
import { UserInvitation } from '../../types';
import { getInvitationByToken, acceptInvitation } from '../../services/authService';

function ActivationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<UserInvitation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      if (!token) {
        setErrorMsg('No se proporcionó ningún token de invitación válido.');
        setIsLoading(false);
        return;
      }

      try {
        const found = await getInvitationByToken(token);
        if (!found) {
          setErrorMsg('El enlace de invitación ha expirado o no es válido.');
        } else if (found.status === 'ACCEPTED') {
          setErrorMsg('Esta invitación ya fue activada previamente. Ya puedes iniciar sesión con tu PIN.');
        } else {
          setInvitation(found);
        }
      } catch {
        setErrorMsg('Error al conectar con el servidor.');
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      alert('Por favor ingresa un PIN numérico de exactamente 4 dígitos.');
      return;
    }

    if (pin !== confirmPin) {
      alert('Los PINs ingresados no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await acceptInvitation(token, pin);
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        alert(res.message || 'Error al activar cuenta.');
      }
    } catch {
      alert('Ocurrió un problema al procesar la activación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-bold">Verificando invitación oficial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Crest */}
        <div className="text-center space-y-3">
          <img
            src="/logo_4ta_calle_larga.png"
            alt="4ta Compañía Calle Larga"
            className="w-20 h-20 mx-auto object-contain drop-shadow-2xl rounded-2xl bg-slate-950/70 p-2 border border-slate-800"
          />
          <div>
            <span className="bg-red-700/80 text-amber-300 text-[10px] font-black px-3 py-0.5 rounded-full border border-red-600/50 uppercase tracking-wider">
              Cuerpo de Bomberos de Los Andes
            </span>
            <h1 className="text-xl font-black text-white tracking-tight mt-1.5">
              4ª COMPAÑÍA "CALLE LARGA"
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Activación Oficial de Cuenta y Turno
            </p>
          </div>
        </div>

        {errorMsg ? (
          <div className="space-y-4">
            <div className="bg-red-950/70 border border-red-800/80 rounded-2xl p-4 flex items-start space-x-3 text-xs text-red-200">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-2xl transition"
            >
              Ir a la Pantalla de Inicio
            </button>
          </div>
        ) : isSuccess ? (
          <div className="text-center space-y-3 py-4 animate-in fade-in">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-black text-white">¡Cuenta Activada con Éxito!</h3>
            <p className="text-xs text-slate-300">
              Ingresando al sistema oficial de partes...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Volunteer info badge */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-1.5">
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Datos de la Invitación:
              </p>
              <h4 className="text-sm font-black text-white">{invitation?.fullName}</h4>
              <p className="text-xs text-red-400 font-bold">
                {invitation?.rank} • {invitation?.registrationNumber}
              </p>
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-slate-400">Rol Asignado:</span>
                <span className="bg-amber-950 text-amber-300 font-black px-2 py-0.5 rounded border border-amber-800">
                  {invitation?.role.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                Invitado por: {invitation?.invitedBy}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Define tu PIN de Acceso (4 dígitos):
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
                    placeholder="Ej. 1234"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs font-bold text-white tracking-widest text-center focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Confirma tu PIN (4 dígitos):
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Repite tu PIN"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs font-bold text-white tracking-widest text-center focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white font-black text-xs py-3 px-4 rounded-2xl shadow-lg shadow-red-950/50 flex items-center justify-center space-x-2 transition active:scale-98 disabled:opacity-50 mt-2"
            >
              <span>{isSubmitting ? 'Activando...' : 'Activar mi Cuenta y Entrar'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ActivationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ActivationContent />
    </Suspense>
  );
}
