'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function RedirectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      router.replace(`/registro?token=${token}`);
    } else {
      router.replace('/registro');
    }
  }, [token, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-sans">
      <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ActivarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-sans" />}>
      <RedirectContent />
    </Suspense>
  );
}
