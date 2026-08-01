import React from 'react';
import { Wallet } from 'lucide-react';

export const KeuanganHeader: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E70013] text-white text-xs font-bold uppercase tracking-wider mb-2">
          <Wallet className="w-3.5 h-3.5" />
          Dashboard Keuangan & Laporan
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Keuangan, Donasi, & Pengeluaran</h1>
        <p className="text-xs text-slate-600 font-medium mt-0.5">
          Ringkasan real-time donasi masuk, pembelian doorprize, dan pengeluaran biaya operasional.
        </p>
      </div>
    </div>
  );
};
