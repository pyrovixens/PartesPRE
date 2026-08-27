'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function RedirectToCrearCuenta() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');

  useEffect(() => {
    if (email) {
      router.replace(`/crear-cuenta?email=${encodeURIComponent(email)}`);
    } else {
      router.replace('/crear-cuenta');
    }
  }, [email, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-sans">
      <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-sans" />}>
      <RedirectToCrearCuenta />
    </Suspense>
  );
}
