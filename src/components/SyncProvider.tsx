'use client';

import React, { useEffect } from 'react';
import { syncFromSupabase } from '@/lib/storage';

/**
 * SyncProvider: Auto-syncs data from Supabase into localStorage cache
 * on initial app mount. This ensures all pages have fresh data
 * regardless of which device or browser tab is used.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    syncFromSupabase();
  }, []);

  return <>{children}</>;
}
