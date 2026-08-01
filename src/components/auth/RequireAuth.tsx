'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentSession, refreshSession } from '@/lib/services/auth';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  roles?: string[];
  children: React.ReactNode;
}

/**
 * Client-side route guard.
 * - Belum login → redirect diam-diam ke home (TIDAK ke /login, agar halaman login
 *   hanya "ditemukan" lewat ketuk logo 5x di navbar).
 * - Sudah login tapi role tidak diizinkan → redirect ke home.
 * - Menampilkan spinner sambil memvalidasi sesi ke server (tanpa flash konten).
 */
export function RequireAuth({ roles, children }: RequireAuthProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
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

      if (!session) {
        router.replace('/');
        return;
      }

      if (rolesKey && !rolesKey.split(',').includes(session.role)) {
        router.replace('/');
        return;
      }

      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, rolesKey]);

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E70013]" />
      </div>
    );
  }

  return <>{children}</>;
}
