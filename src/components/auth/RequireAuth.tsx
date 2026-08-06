'use client';

import React, { startTransition, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { getCurrentSession, refreshSession } from '@/lib/services/auth';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  roles?: string[];
  children: React.ReactNode;
}

type GuardState = 'checking' | 'ok';

/**
 * Client-side route guard.
 * - Belum login / role tidak diizinkan → tampil 404 (seolah halaman tidak ada),
 *   agar halaman login hanya "ditemukan" lewat ketuk logo 5x di navbar.
 * - Menampilkan spinner sambil memvalidasi sesi ke server (tanpa flash konten).
 */
export function RequireAuth({ roles, children }: RequireAuthProps) {
  const [state, setState] = useState<GuardState>('checking');
  const rolesKey = roles ? roles.join(',') : '';

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Pakai cache lokal dulu, lalu validasi ke server (cookie adalah sumber kebenaran).
      let session = getCurrentSession();
      try {
        session = await refreshSession();
      } catch {
        // Offline: tetap andalkan cache lokal.
      }
      if (cancelled) return;

      if (!session || (rolesKey && !rolesKey.split(',').includes(session.role))) {
        // Panggil notFound() lewat startTransition setelah router terinisialisasi
        // (memanggil saat render → "Router action dispatched before initialization").
        startTransition(() => notFound());
        return;
      }

      setState('ok');
    })();

    return () => {
      cancelled = true;
    };
  }, [rolesKey]);

  if (state !== 'ok') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E70013]" />
      </div>
    );
  }

  return <>{children}</>;
}
