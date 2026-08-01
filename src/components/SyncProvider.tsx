'use client';

import React, { useEffect } from 'react';
import { syncFromSupabase } from '@/lib/storage';
import { refreshSession } from '@/lib/services/auth';

/**
 * SyncProvider: Auto-syncs operational data from the server into the
 * localStorage cache on initial app mount — HANYA saat sudah login.
 * Pengunjung anonim tidak pernah men-download data operasional (PII).
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    refreshSession().then((session) => {
      if (session) syncFromSupabase();
    });
  }, []);

  return <>{children}</>;
}
