'use client';

import React, { useState, useEffect } from 'react';
import { syncFromSupabase, SIKUJA_EVENT_NAME } from '@/lib/storage';
import Link from 'next/link';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { KeuanganHeader } from '@/components/admin/KeuanganHeader';
import { BendaharaStatCards } from '@/components/admin/BendaharaStatCards';
import { DonasiList } from '@/components/admin/DonasiList';
import { PembelianList } from '@/components/admin/PembelianList';

export default function KeuanganDashboardPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    syncFromSupabase().then(() => setIsLoaded(true));
    window.addEventListener(SIKUJA_EVENT_NAME, () => setIsLoaded(true));
    return () => window.removeEventListener(SIKUJA_EVENT_NAME, () => setIsLoaded(true));
  }, []);

  return (
    <RequireAuth roles={['admin']}>
      <div className="space-y-8 py-4 max-w-7xl mx-auto">
        <KeuanganHeader />

        {isLoaded ? (
          <>
            <BendaharaStatCards />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/admin/keuangan/donasi" className="group block">
                <div className="bg-linear-to-br from-emerald-500 to-emerald-600 text-white rounded-3xl p-8 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
                  <h3 className="text-xl font-black mb-2">Pemasukan & Sponsor</h3>
                  <p className="text-emerald-100 mb-4">Kelola donasi, bantuan dana, serta sponsor acara</p>
                  <div className="flex items-center gap-2 font-semibold">
                    Lihat Daftar
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>

              <Link href="/admin/keuangan/pembelian" className="group block">
                <div className="bg-linear-to-br from-blue-500 to-blue-600 text-white rounded-3xl p-8 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
                  <h3 className="text-xl font-black mb-2">Pengeluaran & Belanja</h3>
                  <p className="text-blue-100 mb-4">Catat belanja barang doorprize maupun operasional</p>
                  <div className="flex items-center gap-2 font-semibold">
                    Lihat Daftar
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            </div>

            <DonasiList />
            <PembelianList />
          </>
        ) : (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-[#E70013] border-t-transparent rounded-full" />
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
