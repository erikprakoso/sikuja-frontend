'use client';

import React, { useState, useEffect } from 'react';
import { Landmark } from 'lucide-react';
import { PembelianStatsCards } from '@/components/admin/pembelian/PembelianStatsCards';

const SYNC_INTERVAL_MS = 30000;

export const HomeKeuanganSummary: React.FC = () => {
  const [summary, setSummary] = useState<{
    totalSpent: number;
    totalSpentBarang: number;
    sisaDonasi: number;
    totalDonations: number;
    sisaKupon: number;
    voucherSales: number;
    sisaKas: number;
    purchaseCount: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSummary = () => {
      fetch('/api/keuangan/summary')
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled && data.summary) {
            setSummary(data.summary);
          }
        })
        .catch((err) => console.error('Fetch keuangan summary error:', err));
    };

    loadSummary();
    const interval = window.setInterval(loadSummary, SYNC_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (summary === null) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Landmark className="w-4 h-4" />
          </span>
          <h2 className="text-lg font-black text-slate-900">Transparansi Keuangan</h2>
        </div>
        <p className="text-[11px] font-semibold text-slate-500">
          Data langsung dari sistem pencatatan panitia
        </p>
      </div>

      <PembelianStatsCards
        totalSpent={summary.totalSpent}
        totalSpentBarang={summary.totalSpentBarang}
        sisaDonasi={summary.sisaDonasi}
        totalDonations={summary.totalDonations}
        sisaKupon={summary.sisaKupon}
        voucherSales={summary.voucherSales}
        sisaKas={summary.sisaKas}
        purchaseCount={summary.purchaseCount}
      />
    </section>
  );
};
