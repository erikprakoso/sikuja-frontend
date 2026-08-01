'use client';

import React, { useState, useEffect } from 'react';
import { syncFromSupabase, SIKUJA_EVENT_NAME } from '@/lib/storage';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { PengeluaranList } from '@/components/admin/PengeluaranList';

export default function PengeluaranPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    syncFromSupabase().then(() => setIsLoaded(true));
    window.addEventListener(SIKUJA_EVENT_NAME, () => setIsLoaded(true));
    return () => window.removeEventListener(SIKUJA_EVENT_NAME, () => setIsLoaded(true));
  }, []);

  return (
    <RequireAuth roles={['admin']}>
    <div className="space-y-8 py-4 max-w-7xl mx-auto">
      <AdminHeader />

      {isLoaded ? (
        <PengeluaranList />
      ) : (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-[#E70013] border-t-transparent rounded-full" />
        </div>
      )}
    </div>
    </RequireAuth>
  );
}
